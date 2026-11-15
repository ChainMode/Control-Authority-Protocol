# 第 11 章：Faying Mandate 对齐、危险度判定与破坏性操作确认

本章规范化定义 CAP 1.0 控制权评估器与 Faying-Protocol 授权委任（Mandate）的分级对齐模型、驱动能力清单危险度底线、后果不可逆性提升规则、人类原型（Human Prime）`G0` 紧急接管安全态语义，以及参数绑定的显式破坏性操作确认机制。

---

## 11.1 驱动能力清单权威底线与单调上调规则

1. **唯一底线权威源**：宿主终端或设备驱动发布的操作基础危险度（`criticality`）MUST 由经可信公钥（Ed25519）签名的 `DriverCapabilityManifest` 声明。评估器在验签失败或找不到匹配信任锚时，MUST 立即返回 `DENY` 与错误码 `E_UNTRUSTED_MANIFEST`（诊断码 `2005`）。
2. **未知操作默认拒绝**：凡未在已验签 `DriverCapabilityManifest` 中显式声明的 `resource_id` 或 `operation_id`，评估器 MUST 将其有效危险度视为 `critical`，并立即返回 `DENY` 与错误码 `E_UNKNOWN_OPERATION`（诊断码 `2004`）。
3. **单调上调不变量**：危险度序关系定义为 `routine < sensitive < high < critical`。授权凭据（`CapGrant.criticality_override`）或调用请求（`caller_criticality_override`）MAY 将有效危险度向更高等级上调，但 SHALL NOT 将其降至清单底线以下；若传入更低值，评估器 MUST 保持底线等级并将 `escalation_clamped` 标记为 `true`。

---

## 11.2 后果不可逆性维度与范围边界

1. **后果不可逆性轴（`consequence_irreversibility`）**：每个 `OperationDescriptor` MUST 显式声明以下四类不可逆性之一：
   - `reversible`：状态可无损回滚（如只读遥测读取、临时配置预览）；
   - `bounded_compensation`：存在有界补偿动作（如可撤销的本地缓存写入）；
   - `irreversible_consequence`：产生外部世界或物理状态不可逆影响（如物理门禁解锁、对外群发消息、删除本地常规记录），有效危险度底线 MUST 至少提升至 `high`；
   - `irreversible_data_or_hardware`：导致不可恢复的数据销毁或硬件损坏风险（如不可恢复安全擦除、存在变砖风险的固件刷写、高危物理执行器解锁），有效危险度底线 MUST 强制锁定为 `critical`。
2. **金融资金划转排除在协议范围外**：CAP 1.0 聚焦物理与数字终端控制权治理，不承载金融支付清算或资金划转职责。任何将 `domain_category` 声明或请求为 `fund_transfer` 的调用，评估器 MUST 立即返回 `DENY` 与错误码 `E_OUT_OF_SCOPE_FUND_TRANSFER`（诊断码 `2007`）。

---

## 11.3 Faying Mandate 绑定模型

每次 CAP 控制请求 MUST 携带与请求主体（`fay_id`）、目标资源（`resource_id`）及访问模式（`requested_mode`）一致且未过期、未撤销的 `MandateEvidence`：

| 绑定模型枚举 | 适用危险度 | 规范要求 |
|-------------|-----------|----------|
| `model_b_online_ref` | `routine`、`sensitive` | 默认基线：要求 Mandate 引用未过期、未撤销且通过在线新鲜度核验（`online_fresh = true`） |
| `model_a_plus_b` | `routine`、`sensitive`、`high`、`critical` | 高危强制模型：在满足 `model_b_online_ref` 基础上，MUST 叠加密码学会话/委任派生绑定证明（`model_a_derived_proof_valid = true`） |
| `model_c_offline_cache` | 仅限断网受限场景下的 `routine`（若策略允许） | **严禁用于 `high` 与 `critical` 操作**；一旦在 `high` 或 `critical` 请求中出现，评估器 MUST 返回 `DENY` 与 `E_WEAK_MANDATE_BINDING`（诊断码 `2001`） |

若 Mandate 已过期、已撤销、主体或资源不匹配，或访问模式超出 `allowed_modes`，评估器 MUST 返回 `DENY` 与 `E_MANDATE_INVALID`（诊断码 `2008`）。

---

## 11.4 三维分级授权矩阵（`FayingGrade × AccessMode × Criticality`）

会话有效等级取 `MandateEvidence.session_grade` 与 `CapGrant.min_grade` 约束校验后的结果。当有效等级为 `G1`–`G4` 时，评估器 MUST 按以下保守矩阵判定：

| 有效危险度 | `G1` | `G2` | `G3` | `G4` |
|-----------|------|------|------|------|
| `critical` | 允许 `read` / `write` / `execute` / `configure`（须通过 §11.6 确认门） | `DENY` | `DENY` | `DENY` |
| `high` | 允许全部已授权模式（须通过 §11.6 确认门） | 允许全部已授权模式（须通过 §11.6 确认门） | `DENY` | `DENY` |
| `sensitive` | 允许全部已授权模式 | 允许全部已授权模式 | 允许 `read` / `write` / `execute`（**禁止 `configure`**） | `DENY` |
| `routine` | 允许全部已授权模式 | 允许全部已授权模式 | 允许全部已授权模式 | 仅允许 `read` / `execute`（**禁止 `write` 与 `configure`**） |

凡不满足上述矩阵或会话等级低于 `CapGrant.min_grade`（注：`G1` 高于 `G2` 高于 `G3` 高于 `G4`）的请求，评估器 MUST 返回 `DENY` 与 `E_GRADE_INSUFFICIENT`（诊断码 `2002`）。

---

## 11.5 `G0` 人类原型紧急接管与安全态指令

1. **零延迟抢占**：当 `g0_override = true` 或会话等级处于 `G0` 时，代表人类原型正在行使最高优先级直接接管权。评估器 MUST 立即对 Fay 发起的控制请求返回 `DENY` 与 `E_G0_EMERGENCY_OVERRIDE`（诊断码 `2003`）。
2. **安全态迁移指令（`G0SafeStateDirective`）**：
   - 若目标资源在 `ResourceCapabilityDescriptor.safe_states` 中声明了一个或多个预定义安全态（例如无人机悬停返航、机械臂断电抱闸），评估器 MUST 输出 `{ action: "enter_safe_state", safe_state_id: safe_states[0].safe_state_id, blocks_human_takeover: false }`；
   - 若目标资源未声明预定义安全态，评估器 MUST 输出 `{ action: "terminate_and_alert", blocks_human_takeover: false }`，指令宿主终端立即中止当前代理动作并向人类原型发出告警。
3. **非阻塞铁律**：任何安全态收敛过程 SHALL NOT 阻塞或延迟人类原型对宿主终端的直接物理或交互接管（`blocks_human_takeover` 恒为 `false`）。

---

## 11.6 参数绑定的显式人类原型确认门

对所有有效危险度为 `high` 或 `critical` 的操作（**包括在 `G1` 会话内执行的请求**），评估器 MUST 强制校验 `human_confirmation`（`HumanConfirmationProof`）：

1. `human_prime_id` MUST 符合规范化自然人标识格式（`hid_<base32>`）；
2. `expires_at_epoch_ms` MUST 大于当前评估时间戳 `now_epoch_ms`；
3. `terminal_attested_disclosure` MUST 为 `true`，证明宿主终端可信界面已向人类原型完整披露目标资源、操作及不可逆后果；
4. `confirmed_params_sha256` MUST 精确等于本次请求 `params` 对象按字典序键排序规范化 JSON 序列化后的 SHA-256 十六进制摘要（防止确认重放与参数篡改攻击）。

上述任一条件不满足时，评估器 MUST 返回 `DENY` 与错误码 `E_CONFIRMATION_REQUIRED`（诊断码 `2006`）。
