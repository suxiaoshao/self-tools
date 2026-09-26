{
  lib,
  stdenvNoCC,
  fetchurl,
  makeWrapper,
}:
let
  version = "12.4.0";
  sources = {
    aarch64-darwin = {
      platform = "darwin-arm64";
      hash = "sha512-75EYiF8GuiTsnvP4cbZsviMBjohXUYtg2zjD4gdfhqxlU1y9Nj+KdEsbH4jfgB/FgyJSYPB2rqfmvvgLnRlVug==";
    };
    x86_64-darwin = {
      platform = "darwin-x64";
      hash = "sha512-b74TzBg8lxl0lqZImGOXpRbAGcqVKX+UMckl3wG+KH52yYHI86VBJP86HbJX30HJ/EFeC6Tgbz2E4b5hhKRvdA==";
    };
    aarch64-linux = {
      platform = "linux-arm64-musl";
      hash = "sha512-yS6DNel7twfEUoW1yka1hpQrnhRe/s1JZ1MThVfgrmNQrNaPyHxQvAihm/GtL2CM6OeMV6z5532H/W/yDjQp5g==";
    };
    x86_64-linux = {
      platform = "linux-x64-musl";
      hash = "sha512-c8YyjVL39L48tRg9i3iw3d90fN6q84UjxlgWBhplcBOpzCgmglDVkPMtEAVDC+t9iobvYzs2hJnmTqLaA87MVA==";
    };
  };
  source = sources.${stdenvNoCC.hostPlatform.system};
in
assert
  lib.removePrefix "pnpm@" (builtins.fromJSON (builtins.readFile ../package.json)).packageManager
  == version;
stdenvNoCC.mkDerivation {
  pname = "pnpm";
  inherit version;
  src = fetchurl {
    url = "https://registry.npmjs.org/@pnpm/exe.${source.platform}/-/exe.${source.platform}-${version}.tgz";
    inherit (source) hash;
  };
  nativeBuildInputs = [ makeWrapper ];
  dontBuild = true;
  dontStrip = true;
  installPhase = ''
    runHook preInstall
    install -Dm755 pnpm $out/bin/pnpm
    makeWrapper $out/bin/pnpm $out/bin/pnpx --add-flags dlx
    ln -s pnpm $out/bin/pn
    ln -s pnpx $out/bin/pnx
    runHook postInstall
  '';
  meta = {
    description = "pnpm CLI from its official platform distribution";
    homepage = "https://pnpm.io";
    license = lib.licenses.mit;
    platforms = builtins.attrNames sources;
    mainProgram = "pnpm";
  };
}
