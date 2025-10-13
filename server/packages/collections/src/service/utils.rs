use std::collections::{HashMap, HashSet};

/// 找到所有子收藏夹
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

/// 获取收藏夹下的所有小说
pub(super) fn find_all_item_by_collection(
    item_ids: &mut HashSet<i64>,
    collection_id: i64,
    collection_collection_map: &HashMap<i64, Vec<i64>>,
    collection_item_map: &HashMap<i64, HashSet<i64>>,
) {
    if let Some(item_list) = collection_item_map.get(&collection_id) {
        item_ids.extend(item_list);
    }
    if let Some(collection_list) = collection_collection_map.get(&collection_id) {
        for &child_id in collection_list {
            find_all_item_by_collection(
                item_ids,
                child_id,
                collection_collection_map,
                collection_item_map,
            );
        }
    }
}
