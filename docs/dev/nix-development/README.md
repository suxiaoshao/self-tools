# 可复现的本机与 CI 开发环境

状态：Done

关联需求：[Issue #129](https://github.com/suxiaoshao/self-tools/issues/129)

## 目标与所有权

根 `flake.nix` / `flake.lock` 固定 macOS 与 Linux 的构建工具和系统库；`rust-toolchain.toml` 是 Rust 版本与组件的事实源，`package.json` 继续声明 pnpm 版本。业务依赖仍由 Cargo / pnpm lockfile 管理。

## 设计与实施

- 提供 `backend`、`web` 和默认组合 devShell，按平台选择原生依赖。后端包含 C/C++、CMake、pkg-config、OpenSSL、libpq 和 Rust/rustfmt/clippy；前端包含 Node 24 与 pnpm 12.4.0。
- pnpm 12.4.0 尚未进入已选 nixpkgs，使用官方平台包并固定完整性哈希；不依赖用户全局 pnpm 自动下载另一版本。
- Linux 链接配置改用 PATH 中的 mold，移除 `/usr/bin/mold` 的宿主路径假设。
- GitHub Actions 在对应 devShell 中运行已有验证命令。Docker 内的工具安装、服务、数据库与运行数据继续由现有 Docker 配置拥有。
- 更新根 README 的环境入口，保留现有构建、代码生成与编排脚本。

## 验证

本机实测工具来源、OpenSSL/libpq 发现、Rust 编译与测试、前端依赖安装和构建。对声明的其他平台做 flake 求值，并在已有 Linux VM 验证关键环境。远程 Actions 和 Windows 运行结果只在实际执行后报告。

## 完成验证

- macOS 在 `--ignore-environment` 环境下确认 Rust / Node / pnpm 来自 Nix store，前端 72 个测试、生产构建预算、lint、GraphQL 生成检查通过；Vite 开发服务器启动并成功返回入口 HTML。
- 后端 workspace 测试通过（99 passed，18 个需要额外运行条件的测试沿用现有 ignored 标记），`cargo clippy --all --locked` 通过。
- 四个声明平台的 devShell 均通过 flake 求值检查；OrbStack aarch64-linux 实测 Rust、OpenSSL/libpq 的 pkg-config 发现、mold 链接和 Node / pnpm 启动成功。
- GitHub Actions 配置通过 actionlint。测试未启动或修改数据库与 Docker 服务。
