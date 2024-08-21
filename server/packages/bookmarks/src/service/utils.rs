use std::collections::HashMap;

pub(super) fn find_all_children(ids: &mut Vec<i64>, id: i64, lookup: &HashMap<i64, Vec<i64>>) {
    if let Some(children) = lookup.get(&id) {
        for &child_id in children {
            ids.push(child_id);
            find_all_children(ids, child_id, lookup);
        }
    }
}
