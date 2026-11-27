# FUXA 普通版（Normal）项目规则

> 本仓库是官方开源 FUXA 1.3.6 的普通版维护仓库（源码只读参考 + 自有文档/测试）。

## 自有资产权威（skill / 品牌 / 测试）

- **SKILL 唯一权威**：`E:\FUXA-all\skills\`（fuxa-automation 为独立 git 仓库，完整版含 references/scripts）。本仓库不再维护 `.trae\skills\` 副本（2026-11-27 已删除），需 skill 时引用 `E:\FUXA-all\skills\<name>\SKILL.md`。
- **品牌母本**：PRO 仓库 `FUXA-Tecon-PRO\docs\customization\`（`config.json` + `logo.svg` + `favicon.ico`）是品牌唯一事实源。本仓库 `server/brand.js` 在 `data/brand.json` 不存在时直接读 PRO `customization/config.json`（字段映射见 `科控物联优化\品牌配置说明.md` §5），不维护两套品牌。根目录 `logo.svg` 是官方默认 logo，非品牌文件。
- **测试资产**：可复用测试框架在 `E:\FUXA-all\FUXA-Widget-Demo\`；一次性排查脚本散落在本仓库 `_probe\`、`_verify\`（归档用，不改主链路）。
