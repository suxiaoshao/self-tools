/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-16 23:36:58
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-22 08:36:42
 * @FilePath: /self-tools/server/common/thrift/build.rs
 */

use volo_build::plugin::SerdePlugin;

fn main() {
    volo_build::ConfigBuilder::default()
        .plugin(SerdePlugin)
        .write()
        .unwrap();
}
