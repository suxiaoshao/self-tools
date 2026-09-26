{
  description = "self-tools development environment";
  inputs = {
    nixpkgs.url = "git+https://github.com/NixOS/nixpkgs?ref=nixos-26.05&shallow=1";
    rust-overlay = {
      url = "git+https://github.com/oxalica/rust-overlay?ref=master&shallow=1";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
  outputs =
    { nixpkgs, rust-overlay, ... }:
    let
      systems = [
        "aarch64-darwin"
        "x86_64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
      pkgsFor =
        system:
        import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };
    in
    {
      formatter = forAllSystems (system: (pkgsFor system).nixfmt);
      devShells = forAllSystems (
        system:
        let
          pkgs = pkgsFor system;
          inherit (pkgs) lib;
          rust = pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
          pnpm = pkgs.callPackage ./nix/pnpm.nix { };
          backend = pkgs.mkShell {
            packages = [
              rust
              pkgs.cmake
              pkgs.pkg-config
            ]
            ++ lib.optionals pkgs.stdenv.isLinux [
              pkgs.clang
              pkgs.mold
            ];
            nativeBuildInputs = [ pkgs.rustPlatform.bindgenHook ];
            buildInputs = [
              pkgs.openssl
              pkgs.libpq
            ];
          };
          web = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pnpm
            ];
          };
        in
        {
          inherit backend web;
          default = pkgs.mkShell {
            inputsFrom = [
              backend
              web
            ];
          };
        }
      );
    };
}
