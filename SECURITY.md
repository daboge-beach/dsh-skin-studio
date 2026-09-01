# Security Policy / 安全策略

## Supported versions / 支持版本

| Version | Supported |
|---|---|
| ≥ v0.12 | ✅（含安全模式与宿主适配层） |
| < v0.12 | ❌ 请升级 |

## Reporting / 报告

私下报告安全漏洞请用 GitHub Security Advisories（仓库 Security 标签页的
"Report a vulnerability"），不要开公开 issue。

Please use GitHub Security Advisories (repo Security tab → "Report a
vulnerability") for sensitive reports instead of public issues.

## Scope notes / 范围说明

- 皮肤包是**纯静态资源**（JSON + 图片），不执行代码；上传链路有
  zip bomb / 路径穿越 / 像素上限拦截（见 `registry/unzip.ts`、`imageGuard.ts`）
- 全部功能本机运行：无遥测、无网络上传（统计仅存 localStorage 且可清除）
- npm 上的 `dsh-skin-studio`（非 scoped）**不是本项目发布的**——本项目的
  包全部在 `@dsh-skin-studio/*` scope 下且尚未发布；安装请按 README 的
  源码方式，不要安装来源不明的同名包
