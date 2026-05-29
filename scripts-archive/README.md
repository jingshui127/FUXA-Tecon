# 脚本归档目录

本目录用于存放开发过程中的临时调试脚本、验证脚本和一次性工具脚本。

## 目录结构

| 目录 | 用途 |
|------|------|
| `check/` | 检查类脚本（check-*.js） |
| `debug/` | 调试类脚本（debug-*.js, db-*.js） |
| `fix/` | 修复类脚本（fix-*.js） |
| `inspect/` | 检查/查看类脚本（inspect-*.js） |
| `setup/` | 配置/设置类脚本（setup-*.js） |
| `verify/` | 验证类脚本（verify-*.js） |

## 使用说明

1. **临时脚本**：开发过程中使用的一次性脚本应归档到此目录
2. **长期使用脚本**：如需长期使用的脚本，应保留在 `server/` 目录
3. **文档引用脚本**：被 `定制化修改清单.md` 引用的脚本不应归档

## 已归档脚本清单

### check/
- check-all-items.js
- check-bak.js
- check-btn-pos.js
- check-db-structure.js
- check-footer-api.js
- check-general.js
- check-header.js
- check-plan-status.js
- check-realtime-values.js
- check-status-indicators.js
- check-structure.js
- check-user-btn.js
- check-view-buttons.js
- check-view-items.js
- check-view-structure.js
- preflight-tag-check.js
- quick-check.js

### debug/
- db-check.js
- db-debug.js
- db-full.js
- db-raw.js
- db-structure.js
- debug-api-hmi.js
- debug-api-layout.js
- deep-check-btn.js
- diagnose-and-fix.js

### fix/
- fix-device.js (已保留在 server/)
- fix-header-tag-divisors.js
- fix-layout-save.js
- fix-nav-buttons.js
- fix-navigation-config.js

### inspect/
- compare-components.js
- inspect-general-table.js
- inspect-header-full.js
- inspect-layout-full.js
- inspect-view-structure.js
- inspect-views.js
- list-views.js
- research-header.js

### setup/
- add-nav-correct.js
- add-nav-final.js
- add-nav-stop-start.js
- add-nav-to-all-views.js
- add-nav-via-api.js
- add-nav-with-svg.js
- add-simple-nav.js
- apply-header-css.js
- complete-header.js (已保留在 server/)
- configure-status-indicators.js (已保留在 server/)
- create-footer-nav-buttons.js
- enhance-nav-buttons.js
- find-svg.js
- inject-custom-css.js (已保留在 server/)
- optimize-header-and-footer.js
- restore-all.js
- restore-view.js
- setup-footer-nav.js
- setup-header-layout.js
- show-svg.js
- show-user-btn.js
- view-details.js

### verify/
- final-verification.js
- full-verification.js
- test-api.js (已保留在 server/)
- test-header-config.js
- validate-project.js
- verify-architecture.js
- verify-full-layout.js
- verify-navigation.js

## 保留在 server/ 的脚本

以下脚本因被文档引用或为核心工具，保留在 `server/` 目录：

| 脚本 | 保留原因 |
|------|----------|
| complete-header.js | 文档引用 |
| configure-status-indicators.js | 文档引用 |
| inject-custom-css.js | 文档引用 |
| fix-device.js | 文档引用 |
| sync-db.js | 数据库同步工具 |
| test-api.js | API测试工具 |

---

> **注意**: 此归档目录为空，原始脚本已被删除。如需恢复特定脚本，请从版本控制系统或备份中恢复。
