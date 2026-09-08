variable "TAG" { default = "latest" }
group "default" { targets = ["auth", "bookmarks", "collections", "gateway", "login"] }
target "rustbase" {
  context = "."
  dockerfile = "docker/server/rust/rust.Dockerfile"
}
target "auth" {
  context = "."
  dockerfile = "docker/server/auth.Dockerfile"
  contexts = { "suxiaoshao/rust" = "target:rustbase" }
  tags = ["suxiaoshao/auth:${TAG}"]
}
target "bookmarks" {
  context = "."
  dockerfile = "docker/server/bookmarks.Dockerfile"
  contexts = { "suxiaoshao/rust" = "target:rustbase" }
  tags = ["suxiaoshao/bookmarks:${TAG}"]
}
target "collections" {
  context = "."
  dockerfile = "docker/server/collections.Dockerfile"
  contexts = { "suxiaoshao/rust" = "target:rustbase" }
  tags = ["suxiaoshao/collections:${TAG}"]
}
target "gateway" {
  context = "."
  dockerfile = "docker/server/gateway.Dockerfile"
  contexts = { "suxiaoshao/rust" = "target:rustbase" }
  tags = ["suxiaoshao/gateway:${TAG}"]
}
target "login" {
  context = "."
  dockerfile = "docker/server/login.Dockerfile"
  contexts = { "suxiaoshao/rust" = "target:rustbase" }
  tags = ["suxiaoshao/login:${TAG}"]
}
