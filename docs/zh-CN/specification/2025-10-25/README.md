---
title: 控制权限协议（CAP）1.0 技术规范
description: Control Authority Protocol (CAP) 1.0 正式版技术规范导览、文档结构与一致性资产索引
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
replaces: draft@5bbc1a5
---

# 控制权限协议（CAP）1.0 技术规范

本目录承载 **Control Authority Protocol（CAP，控制权限协议）1.0** 的正式定稿规范（版次 `2025-10-25`，状态 `Final`）。CAP 规范化定义数字化身（`iFay` 或 `coFay`）如何基于人类原型（`Human Prime`）签发的委任凭据，在被附身（`Inhabit`）的宿主（`Host`，仅指终端设备或软件应用）上安全地申请、行使与交还软硬件控制权。

## 规范章节目录

| 章节 | 文件 | 规范性内容摘要 |
|------|------|----------------|
| 第 0 章 | `00-概述与规范性用语.md` | 协议范围与非目标、RFC 2119 / RFC 8174 规范性用语映射、核心术语定义、三条正交版本轴与两段式 `"1.0"` 版本纪律 |
| 第 1 章 | `01-架构与绑定模型.md` | 协议角色与问责边界、作为 Faying 依赖方的评估流水线、`Mandate` 三种绑定模型（Model B / Model A+B / Model C 禁令）与金融超范围拦截 |
| 第 2 章 | `02-授权分级与危重度矩阵.md` | 四种非层级资源访问模式（`read` / `write` / `execute` / `configure`）、四级操作危重度与 `FayingGrade × AccessMode × Criticality` 保守判定矩阵 |
| 第 3 章 | `03-驱动能力清单与不可逆地板.md` | 经 Ed25519 签名的 `DriverCapabilityManifest`、未知操作默认 `critical` 拒绝、`consequence_irreversibility` 不可逆地板与单调上调铁律 |
| 第 4 章 | `04-高危人类原型确认与安全态.md` | 参数 SHA-256 绑定的显式人类原型确认门、`G0` 人类原型零阻塞紧急接管与 `G0SafeStateDirective`、规范错误码表与符合性判据 |

## 配套规范性交付物

本规范正文与以下机器可读资产共同构成 CAP 1.0 互操作基线：

- **CDDL 线格式权威定义**：`schemas/cap-1.0.cddl`
- **JSON Schema 2020-12 权威定义**：`schemas/cap-1.0.json`（及发布快照 `schema/2025-10-25/schema.json`）
- **语义一致性测试向量**：`vectors/semantic/d1-d7-conformance.json`（14 条覆盖正负向边界的标准测试向量）
- **双语言参考实现**：TypeScript 参考评估器（`src/`）与 Rust 参考评估器（`reference-impls/rust/`）

## 跨协议引用说明

- 人类原型身份与数字化身标识体系由 **FayID** 权威定义（详见 `FayID`）。
- 授权委任（`Mandate`）、自治等级（`G0`–`G4`）与在场新鲜度语义由 **Faying-Protocol** 权威定义（详见 `Faying-Protocol`）。
- 运行时宿主注入与驱动清单加载生命周期由 **FayGer** 权威定义（详见 `FayGer`）。
- 社会贡献账本公誉链（`GMChain`）与非货币度量单位美誉值（`MeriToken`）由 **Global-Merit-Chain** 权威定义（详见 `Global-Merit-Chain`）。
