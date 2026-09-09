//! Collection topology is owned by parent_id; stored paths never select descendants.
use std::collections::{HashMap, HashSet};

use crate::errors::*;
use service_errors::Fault;

pub(super) struct Node {
    pub id: i64,
    pub name: String,
    pub path: String,
    pub parent_id: Option<i64>,
}

pub(super) struct Hierarchy {
    nodes: HashMap<i64, Node>,
    children: HashMap<i64, Vec<i64>>,
}

pub(super) struct PathChange {
    pub id: i64,
    pub path: String,
    pub temporary: String,
}

impl Hierarchy {
    pub fn new(nodes: Vec<Node>) -> Self {
        let mut children: HashMap<i64, Vec<i64>> = HashMap::new();
        for node in &nodes {
            if let Some(parent) = node.parent_id {
                children.entry(parent).or_default().push(node.id);
            }
        }
        Self {
            nodes: nodes.into_iter().map(|node| (node.id, node)).collect(),
            children,
        }
    }

    pub fn get(&self, id: i64) -> AppResult<&Node> {
        self.nodes
            .get(&id)
            .ok_or_else(|| missing(ResourceKind::Collection, id))
    }

    pub fn check_name(
        &self,
        parent: Option<i64>,
        name: &str,
        except: Option<i64>,
    ) -> AppResult<()> {
        if self
            .nodes
            .values()
            .any(|node| Some(node.id) != except && node.parent_id == parent && node.name == name)
        {
            return Err(conflict(ConflictReason::CollectionPathExists, vec![]));
        }
        Ok(())
    }

    fn ancestors(&self, mut parent: Option<i64>) -> AppResult<Vec<&Node>> {
        let mut seen = HashSet::new();
        let mut ancestors = Vec::new();
        while let Some(id) = parent {
            if !seen.insert(id) {
                return Err(Fault::internal("collection.hierarchy.cycle").into());
            }
            let node = self
                .nodes
                .get(&id)
                .ok_or_else(|| Fault::internal("collection.hierarchy.missing_ancestor"))?;
            ancestors.push(node);
            parent = node.parent_id;
        }
        Ok(ancestors)
    }

    pub fn child_path(&self, parent: Option<i64>, name: &str) -> AppResult<String> {
        // A caller-specified parent is a missing resource; its broken ancestors are a fault.
        if let Some(id) = parent {
            self.get(id)?;
        }
        let mut path = String::from("/");
        for node in self.ancestors(parent)?.into_iter().rev() {
            path.push_str(&node.name);
            path.push('/');
        }
        path.push_str(name);
        path.push('/');
        Ok(path)
    }

    /// Parent-first order; reversing it gives a deletion order without recursion.
    pub fn subtree(&self, root: i64) -> AppResult<Vec<i64>> {
        if !self.nodes.contains_key(&root) {
            return Ok(Vec::new());
        }
        self.ancestors(Some(root))?;
        let mut seen = HashSet::new();
        let mut pending = vec![root];
        let mut result = Vec::new();
        while let Some(id) = pending.pop() {
            if !seen.insert(id) {
                return Err(Fault::internal("collection.hierarchy.cycle").into());
            }
            result.push(id);
            if let Some(children) = self.children.get(&id) {
                pending.extend(children);
            }
        }
        Ok(result)
    }

    /// Validate every final path before writing, including conflicts within the subtree.
    pub fn paths(
        &self,
        ids: &[i64],
        name: &str,
        parent: Option<i64>,
    ) -> AppResult<Vec<PathChange>> {
        let root = *ids
            .first()
            .ok_or_else(|| Fault::internal("collection.hierarchy.empty"))?;
        let path = self.child_path(parent, name)?;
        self.check_name(parent, name, Some(root))?;
        let mut paths = HashMap::from([(root, path)]);
        for &id in &ids[1..] {
            let node = self.get(id)?;
            let prefix = node
                .parent_id
                .and_then(|id| paths.get(&id))
                .ok_or_else(|| Fault::internal("collection.hierarchy.order"))?;
            paths.insert(id, format!("{}{}/", prefix, node.name));
        }
        let mut final_paths = HashSet::new();
        for node in self.nodes.values() {
            let path = paths.get(&node.id).unwrap_or(&node.path);
            // Unrelated corrupt roots do not block this operation unless a new path collides.
            if !paths.contains_key(&node.id) {
                final_paths.insert(path.clone());
            }
        }
        for path in paths.values() {
            if !final_paths.insert(path.clone()) {
                return Err(conflict(ConflictReason::CollectionPathExists, vec![]));
            }
        }
        let mut occupied: HashSet<_> = self.nodes.values().map(|node| node.path.clone()).collect();
        occupied.extend(final_paths);
        let mut changes = Vec::new();
        for &id in ids {
            let path = paths.remove(&id).unwrap();
            if path == self.get(id)?.path {
                continue;
            }
            // Unique constraints are immediate. Vacate old paths inside this locked transaction
            // so a valid move or drift repair may reuse another affected node's old path.
            let mut temporary = format!("@collection-path/{id}");
            while !occupied.insert(temporary.clone()) {
                temporary.push('@');
            }
            changes.push(PathChange {
                id,
                path,
                temporary,
            });
        }
        Ok(changes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deep_topology_traversal_uses_no_call_stack() {
        let tree = Hierarchy::new(
            (1..=30_000)
                .map(|id| Node {
                    id,
                    parent_id: (id > 1).then_some(id - 1),
                    name: "x".into(),
                    path: format!("/stale-{id}/"),
                })
                .collect(),
        );
        let ids = tree.subtree(1).unwrap();
        assert_eq!(ids.len(), 30_000);
        assert_eq!(ids.last(), Some(&30_000));
        let path = tree.child_path(Some(30_000), "leaf").unwrap();
        assert_eq!(path.len(), 60_006);
    }
}
