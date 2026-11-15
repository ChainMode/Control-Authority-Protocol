---
title: 制御権限プロトコル（CAP）1.0 技術仕様書
description: Control Authority Protocol (CAP) 1.0 正式版仕様書の概要、章構成、および適合性検証アセット一覧
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
replaces: draft@5bbc1a5
---

# 制御権限プロトコル（CAP）1.0 技術仕様書

本ディレクトリは **Control Authority Protocol（CAP、制御権限プロトコル）1.0** の正式確定仕様（版次 `2025-10-25`、ステータス `Final`）を収録する。CAP は、デジタルアバター（`iFay` または `coFay`）が `Human Prime`（人間プライム）の発行した委任証憑に基づき、憑依（`Inhabit`）先のホスト（`Host`、端末デバイスまたはクライアントソフトウェアのみを指す）上でハードウェアおよびソフトウェアの制御権を安全に要求・行使・返還するための規範的プロトコルを定義する。

## 仕様書構成

| 章 | ファイル | 規範的内容の概要 |
|----|----------|------------------|
| 第 0 章 | `00-概要と規範的用語.md` | プロトコルの適用範囲と対象外事項、RFC 2119 / RFC 8174 規範キーワード対応表、主要用語定義、直交する 3 つのバージョン軸と 2 セグメント `"1.0"` バージョン規律 |
| 第 1 章 | `01-アーキテクチャとバインディングモデル.md` | プロトコル上の役割と責任境界、Faying 依拠当事者としての評価パイプライン、`Mandate` の 3 つのバインディングモデル（Model B / Model A+B / Model C 禁止規定）、資金移動の対象外遮断 |
| 第 2 章 | `02-認可グレードと重大度マトリクス.md` | 非階層的な 4 つのリソースアクセスモード（`read` / `write` / `execute` / `configure`）、4 段階の操作重大度、`FayingGrade × AccessMode × Criticality` 保守的判定マトリクス |
| 第 3 章 | `03-ドライバ能力マニフェストと不可逆性フロア.md` | Ed25519 署名付き `DriverCapabilityManifest`、未宣言操作のデフォルト `critical` 拒否、`consequence_irreversibility` 不可逆性フロア、単調引き上げ不変条件 |
| 第 4 章 | `04-高リスク確認ゲートと安全状態.md` | パラメータ SHA-256 束縛型の明示的 `Human Prime` 確認ゲート、`G0` 緊急引き継ぎ時の非ブロッキング `G0SafeStateDirective`、標準エラーコード表、適合性要件 |

## 規範的成果物との対応

本仕様書は以下の機械可読アセットと共に CAP 1.0 の相互運用ベースラインを構成する。

- **CDDL ワイヤ形式定義**：`schemas/cap-1.0.cddl`
- **JSON Schema 2020-12 定義**：`schemas/cap-1.0.json`（および公開スナップショット `schema/2025-10-25/schema.json`）
- **意味論的適合性テストベクタ**：`vectors/semantic/d1-d7-conformance.json`（正常系・異常系境界を網羅する全 14 件の標準ベクタ）
- **2 言語リファレンス実装**：TypeScript リファレンス評価器（`src/`）および Rust リファレンス評価器（`reference-impls/rust/`）

## 関連プロトコル参照境界

- `Human Prime`（人間プライム）およびデジタルアバターの識別子体系は **FayID** によって権威的に定義される（詳細は `FayID` を参照）。
- 認可委任（`Mandate`）、自律グレード（`G0`–`G4`）、および在席鮮度セマンティクスは **Faying-Protocol** によって権威的に定義される（詳細は `Faying-Protocol` を参照）。
- ランタイム注入およびドライバマニフェスト読み込みライフサイクルは **FayGer** によって権威的に定義される（詳細は `FayGer` を参照）。
- 社会貢献台帳である公誉チェーン（`GMChain`）および非金銭的貢献単位である `MeriToken` は **Global-Merit-Chain** によって権威的に定義される（詳細は `Global-Merit-Chain` を参照）。
