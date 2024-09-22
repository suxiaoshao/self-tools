use std::collections::{HashMap, HashSet};

pub(super) fn find_all_children(
    ids: &mut HashSet<i64>,
    id: i64,
    collection_collection_map: &HashMap<i64, Vec<i64>>,
) {
    if let Some(children) = collection_collection_map.get(&id) {
        for &child_id in children {
            ids.insert(child_id);
            find_all_children(ids, child_id, collection_collection_map);
        }
    }
}

pub(super) fn find_all_novel_by_collection(
    novel_ids: &mut HashSet<i64>,
    collection_id: i64,
    collection_collection_map: &HashMap<i64, Vec<i64>>,
    collection_novel_map: &HashMap<i64, HashSet<i64>>,
) {
    if let Some(novel_list) = collection_novel_map.get(&collection_id) {
        novel_ids.extend(novel_list);
    }
    if let Some(collection_list) = collection_collection_map.get(&collection_id) {
        for &child_id in collection_list {
            find_all_novel_by_collection(
                novel_ids,
                child_id,
                collection_collection_map,
                collection_novel_map,
            );
        }
    }
}
