# Upstream provenance

Wemo was created from the clean public repository:

- Repository: `https://github.com/XavierJiezou/codex-weixin`
- Tag: `v0.3.8`
- Commit: `769f4a1ae5370f46f8962ee7fe45d6764b67bdd8`
- License: MIT

The original Git history, `LICENSE`, and upstream copyright notice are retained.

The initial Wemo fork intentionally excludes all uncommitted code and runtime state from the previous customized local deployment, including Trading Project, Route V3, controller recovery, deployment-watch, and broker state.

The upstream repository remains configured as the read-only `upstream` remote so future changes can be reviewed and selectively merged. Wemo releases are published from the separate `origin` repository.
