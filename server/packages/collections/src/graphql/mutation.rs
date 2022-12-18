use async_graphql::Object;

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    /// 创建目录
    async fn add(&self, a: i32, b: i32) -> i32 {
        a + b
    }
}
