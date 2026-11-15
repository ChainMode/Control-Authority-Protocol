---
title: 控制權限協定（CAP）1.0 技術規範
description: Control Authority Protocol (CAP) 1.0 正式版技術規範導覽、文件結構與一致性資產索引
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
replaces: draft@5bbc1a5
---

# 控制權限協定（CAP）1.0 技術規範

本目錄承載 **Control Authority Protocol（CAP，控制權限協定）1.0** 的正式定稿規範（版次 `2025-10-25`，狀態 `Final`）。CAP 規範化定義數位化身（`iFay` 或 `coFay`）如何基於人類原型（`Human Prime`）簽發的委任憑據，在被附身（`Inhabit`）的宿主（`Host`，僅指終端設備或軟體應用）上安全地申請、行使與交還軟硬體控制權。

## 規範章節目錄

| 章節 | 檔案 | 規範性內容摘要 |
|------|------|----------------|
| 第 0 章 | `00-概述與規範性用語.md` | 協定範圍與非目標、RFC 2119 / RFC 8174 規範性用語對應、核心術語定義、三條正交版本軸與兩段式 `"1.0"` 版本紀律 |
| 第 1 章 | `01-架構與綁定模型.md` | 協定角色與問責邊界、作為 Faying 依賴方的評估管線、`Mandate` 三種綁定模型（Model B / Model A+B / Model C 禁令）與金融超範圍攔截 |
| 第 2 章 | `02-授權分級與危重度矩陣.md` | 四種非層級資源存取模式（`read` / `write` / `execute` / `configure`）、四級操作危重度與 `FayingGrade × AccessMode × Criticality` 保守判定矩陣 |
| 第 3 章 | `03-驅動能力清單與不可逆地板.md` | 經 Ed25519 簽章的 `DriverCapabilityManifest`、未知操作預設 `critical` 拒絕、`consequence_irreversibility` 不可逆地板與單調上調鐵律 |
| 第 4 章 | `04-高危人類原型確認與安全態.md` | 參數 SHA-256 綁定的顯式人類原型確認門、`G0` 人類原型零阻塞緊急接管與 `G0SafeStateDirective`、規範錯誤碼表與符合性判據 |

## 配套規範性交付物

本規範正文與以下機器可讀資產共同構成 CAP 1.0 互操作基線：

- **CDDL 線格式權威定義**：`schemas/cap-1.0.cddl`
- **JSON Schema 2020-12 權威定義**：`schemas/cap-1.0.json`（及發布快照 `schema/2025-10-25/schema.json`）
- **語意一致性測試向量**：`vectors/semantic/d1-d7-conformance.json`（14 條涵蓋正負向邊界的標準測試向量）
- **雙語言參考實作**：TypeScript 參考評估器（`src/`）與 Rust 參考評估器（`reference-impls/rust/`）

## 跨協定引用說明

- 人類原型身分與數位化身識別體系由 **FayID** 權威定義（詳見 `FayID`）。
- 授權委任（`Mandate`）、自治等級（`G0`–`G4`）與在場新鮮度語意由 **Faying-Protocol** 權威定義（詳見 `Faying-Protocol`）。
- 執行時宿主注入與驅動清單載入生命週期由 **FayGer** 權威定義（詳見 `FayGer`）。
- 社會貢獻帳本公譽鏈（`GMChain`）與非貨幣度量單位美譽值（`MeriToken`）由 **Global-Merit-Chain** 權威定義（詳見 `Global-Merit-Chain`）。
