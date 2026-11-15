---
title: "Kapitel 4: Hochrisiko-Bestätigung durch Human Prime und Sicherheitszustand"
description: Parametergebundenes Bestätigungsgatter des Human Prime in CAP 1.0, G0-Notübernahme mit Sicherheitszustandsanweisungen, Fehlercodekatalog und Konformitätskriterien
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Kapitel 4: Hochrisiko-Bestätigung durch Human Prime und Sicherheitszustand

## 4.1 Parametergebundenes ausdrückliches Bestätigungsgatter des `Human Prime` (`HumanConfirmationProof`)

Für jede Operation, deren `effective_criticality` den Wert **`high`** oder **`critical`** annimmt (**einschließlich solcher Operationen, die innerhalb einer `G1`-Echtzeit-Anwesenheitssitzung ausgeführt werden**), **MUSS** (**MUST**) der CAP-Auswerter `req.human_confirmation` (`HumanConfirmationProof`) prüfen. Implementierungen **DÜRFEN** die Einzeloperationsbestätigung weder zugunsten höherer Automatisierung noch aufgrund bisheriger Zuverlässigkeit des Agenten **erlassen** (**SHALL NOT**):

1. **Kanonische Identitätssyntax**: `human_confirmation.human_prime_id` **MUSS** (**MUST**) dem kanonischen Bezeichnermuster für den **Human Prime** (`Menschliches Primärsubjekt`) `^hid_[a-z2-7]{16,}$` entsprechen.
2. **Zeitliche Frische**: `human_confirmation.expires_at_epoch_ms` **MUSS** (**MUST**) echt größer als `req.now_epoch_ms` sein.
3. **Host-attestierte Offenlegung**: `human_confirmation.terminal_attested_disclosure` **MUSS** (**MUST**) den Wert `true` tragen und damit belegen, dass eine vertrauenswürdige Benutzeroberfläche des Host – und nicht etwa selbstberichteter Text des `Fay` – dem **Human Prime** Zielressource, Operation und unumkehrbare Folgen offengelegt hat.
4. **Kanonische Parameter-SHA-256-Bindung**: Über die UTF-8-kodierte kanonische JSON-Serialisierung (siehe §3.1) von `req.params` wird der kleingeschriebene hexadezimale SHA-256-Prüfwert (64 Zeichen) berechnet; `human_confirmation.confirmed_params_sha256` **MUSS** (**MUST**) zeichengenau mit diesem Prüfwert übereinstimmen.

Fehlt `human_confirmation` oder schlägt eine der vorstehenden Prüfungen fehl (etwa infolge nachträglicher Parameteränderung nach der Bestätigung), **MUSS** (**MUST**) der Auswerter unverzüglich `decision = "DENY"`, `error_code = "E_CONFIRMATION_REQUIRED"` und `diagnostic_code = 2006` zurückgeben.

---

## 4.2 `G0`-Notübernahme und blockierungsfreie Sicherheitszustandsanweisungen

Der **Human Prime** behält zu jedem Zeitpunkt den uneingeschränkten Vorrang, die Kontrolle über den Host zurückzuübernehmen. Gilt `req.g0_override == true` oder `req.grant.mandate_binding.session_grade == "G0"`, sind folgende Regeln verbindlich:

1. **Sofortige vorrangige Ablehnung**: Noch vor Prüfung von Mandatsablauf oder Stufenmatrix **MUSS** (**MUST**) der CAP-Auswerter die Anfrage des `Fay` mit `decision = "DENY"`, `error_code = "E_G0_EMERGENCY_OVERRIDE"` und `diagnostic_code = 2003` ablehnen.
2. **Deterministische Sicherheitszustandsanweisung (`G0SafeStateDirective`)**:
   - Ist die Liste `ResourceCapabilityDescriptor.safe_states` der Zielressource nicht leer, **MUSS** (**MUST**) der Auswerter `safe_states[0].safe_state_id` auswählen und folgende Struktur ausgeben:
     `{ "action": "enter_safe_state", "safe_state_id": "<safe_states[0].safe_state_id>", "blocks_human_takeover": false }`;
   - Deklariert die Zielressource keine `safe_states` (oder eine leere Liste), **MUSS** (**MUST**) der Auswerter folgende Struktur ausgeben:
     `{ "action": "terminate_and_alert", "blocks_human_takeover": false }`, wodurch der Host angewiesen wird, laufende Agentenaktionen sofort abzubrechen und den **Human Prime** zu alarmieren.
3. **Blockierungsfreiheits-Invariante**: `safe_state_directive.blocks_human_takeover` **MUSS** (**MUST**) stets `false` lauten. Übergänge in einen sicheren Zustand oder Aufräumroutinen des Host **DÜRFEN** eine direkte physische oder interaktive Übernahme durch den **Human Prime** weder blockieren noch aussperren oder verzögern (**SHALL NOT**).

---

## 4.3 Kanonische Fehlercodes und numerische Diagnose-Begleitcodes

CAP-1.0-Antworten verwenden stabile Fehlercodes in Großbuchstaben mit Unterstrichen (`CapErrorCode`), die eindeutig 1-zu-1 numerischen Diagnosecodes (`2001`–`2099`) zugeordnet sind:

| Kanonischer Fehlercode (`error_code`) | Diagnosecode (`diagnostic_code`) | Auslösebedingung und normative Bedeutung |
|---------------------------------------|----------------------------------|------------------------------------------|
| `E_WEAK_MANDATE_BINDING` | `2001` | Anfrage der Stufe `high`/`critical` nutzt nicht `model_a_plus_b` (oder besitzt keinen gültigen abgeleiteten Nachweis bzw. keine Online-Frische), oder `sensitive`-Anfrage verwendet `model_c_offline_cache` |
| `E_GRADE_INSUFFICIENT` | `2002` | Sitzungsstufe ist schwächer als `grant.min_grade` oder verletzt die Matrix `FayingGrade × AccessMode × Criticality` |
| `E_G0_EMERGENCY_OVERRIDE` | `2003` | `G0`-Notübernahme durch den **Human Prime** aktiv; verweigert `Fay`-Steuerung und gibt blockierungsfreie `safe_state_directive` aus |
| `E_UNKNOWN_OPERATION` | `2004` | Angeforderte `resource_id` oder `operation_id` ist im verifizierten `DriverCapabilityManifest` nicht deklariert |
| `E_UNTRUSTED_MANIFEST` | `2005` | `DriverCapabilityManifest` besitzt keine gültige Signatur, Vertrauensanker fehlt oder Ed25519-Prüfung schlägt fehl |
| `E_CONFIRMATION_REQUIRED` | `2006` | Für `high`/`critical`-Operation fehlt ein unverfallener, Host-attestierter und im Parameter-SHA-256 übereinstimmender `HumanConfirmationProof` |
| `E_OUT_OF_SCOPE_FUND_TRANSFER` | `2007` | Anfrage oder Manifestoperation deklariert `domain_category == "fund_transfer"` außerhalb des Geltungsbereichs von CAP 1.0 |
| `E_MANDATE_INVALID` | `2008` | Mandat ist widerrufen, abgelaufen, in einem Online-Bindungsmodell nicht frisch oder stimmt bei Subjekt/Ressource/Modus nicht überein |
| `E_PROTOCOL_VERSION_UNSUPPORTED` | `2098` | `protocol_version` entspricht nicht der unterstützten zweistelligen Version `"1.0"` |
| `E_PROTOCOL` | `2099` | Fehlerhafter Nachrichtenrahmen oder allgemeiner Protokollfehler; der Alt-Alias `E_INVALID_MESSAGE` **MUSS** (**MUST**) beim Einlesen auf `E_PROTOCOL` abgebildet werden |

---

## 4.4 Kriterien für die Implementierungskonformität

Eine Implementierung, die Konformität mit **CAP 1.0 (Ausgabe `2025-10-25`)** beansprucht, **MUSS** (**MUST**) sämtliche nachfolgenden überprüfbaren Anforderungen erfüllen:

1. Vollständige Umsetzung der 8-stufigen Default-Deny-Auswertungspipeline, der monotonen Kritikalitätsuntergrenze, der dreidimensionalen Stufenmatrix, des parameter-SHA-256-gebundenen **Human Prime**-Bestätigungsgatters sowie der blockierungsfreien `G0`-Sicherheitszustandsanweisung gemäß den Kapiteln 0–4;
2. Strikte Einhaltung der Draht- und Datendefinitionen in `schemas/cap-1.0.cddl` und `schemas/cap-1.0.json`;
3. Ausführung aller 14 normativen Konformitätsvektoren (`V01`–`V14`) in `vectors/semantic/d1-d7-conformance.json` mit **100 % exakter Übereinstimmung** in `decision`, `effective_criticality`, `effective_grade`, `escalation_clamped`, `error_code`, `diagnostic_code` und `safe_state_directive`.
