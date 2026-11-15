---
title: "Kapitel 3: Treiber-Fähigkeitsmanifest und Irreversibilitätsuntergrenze"
description: Ed25519-Manifestsignaturprüfung in CAP 1.0, Ablehnung unbekannter Operationen, Irreversibilitätsuntergrenze und monotone Kritikalitätsanhebung
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Kapitel 3: Treiber-Fähigkeitsmanifest und Irreversibilitätsuntergrenze

## 3.1 Prüfung des signierten `DriverCapabilityManifest`

Die Basiskritikalität einer Operation **DARF NICHT** (**SHALL NOT**) durch den aufrufenden `Fay` oder durch ungeprüfte externe Metadaten bestimmt werden; sie **MUSS** (**MUST**) aus einem Host-seitigen `DriverCapabilityManifest` stammen, das von einer vertrauenswürdigen Stelle kryptografisch signiert wurde. Jedes Manifest umfasst:

- `manifest_id`, `driver_id`, `version`, `issued_at`: Eindeutige Manifestkennung, Treiberkennung, Versionszeichenkette und Ausstellungszeitpunkt;
- `signer_key_id`: Schlüsselkennung mit Verweis auf einen Eintrag in der lokalen `TrustAnchorMap` des Host;
- `resources`: Nichtleeres Feld von `ResourceCapabilityDescriptor`-Einträgen mit `resource_id`, optionalen `safe_states` und einer nichtleeren Liste `operations` (`OperationDescriptor`);
- `signature_ed25519`: 64 Byte lange (128 Hexadezimalzeichen umfassende) Ed25519-Signatur nach RFC 8032.

### Kanonisches Verfahren zur Signaturprüfung

Der CAP-Auswerter **MUSS** (**MUST**) die Authentizität des Manifests wie folgt prüfen:

1. Sicherstellen, dass `signature_ed25519` eine gültige 128-stellige Hexadezimalzeichenkette ist, und `signer_key_id` in `trust_anchors` nachschlagen. Fehlt der Vertrauensanker, gilt `algorithm != "Ed25519"` oder ist `public_key_raw_hex` keine gültige 64-stellige Hexadezimalzeichenkette (32 Byte langer öffentlicher Ed25519-Rohschlüssel), schlägt die Prüfung sofort fehl.
2. Das unsignierte Manifestobjekt durch Weglassen des Feldes `signature_ed25519` bilden und mittels **RFC-8785-kompatiblem deterministischem kanonischem JSON** (lexikografisch sortierte Objektschlüssel, Entfall nicht definierter optionaler Felder, keinerlei überflüssige Leerzeichen) in UTF-8-Bytes serialisieren.
3. Die 64-Byte-Ed25519-Signatur über diesen UTF-8-Bytes gegen den öffentlichen Schlüssel des Vertrauensankers verifizieren.

Schlägt die Prüfung fehl, **MUSS** (**MUST**) der Auswerter unverzüglich `decision = "DENY"`, `effective_criticality = "critical"`, `error_code = "E_UNTRUSTED_MANIFEST"` und `diagnostic_code = 2005` zurückgeben.

---

## 3.2 Standardmäßige `critical`-Ablehnung unbekannter Ressourcen und Operationen

Innerhalb eines erfolgreich signaturgeprüften `DriverCapabilityManifest` gilt:

- Existiert kein `ResourceCapabilityDescriptor` mit passender `req.resource_id` oder innerhalb dieser Ressource kein `OperationDescriptor` mit passender `req.operation_id`, **MUSS** (**MUST**) der CAP-Auswerter `effective_criticality` als `"critical"` einstufen und sofort `decision = "DENY"`, `error_code = "E_UNKNOWN_OPERATION"` sowie `diagnostic_code = 2004` liefern.
- Implementierungen **DÜRFEN KEINE** (**SHALL NOT**) Platzhalter-Freigaben vorsehen und nicht deklarierte Operationen niemals standardmäßig als `routine` behandeln.

---

## 3.3 Untergrenze der Folgen-Irreversibilität (`ConsequenceIrreversibility`)

Um auszuschließen, dass fehlerhaft konfigurierte Treiber physisch oder digital zerstörerische Aktionen zu niedrig einstufen, **MUSS** (**MUST**) jeder `OperationDescriptor` sowohl `criticality` als auch `consequence_irreversibility` angeben. Der Auswerter **MUSS** (**MUST**) daraus zunächst die Untergrenze `floor_criticality` bestimmen:

| Wert von `consequence_irreversibility` | Beispielhafte Host-Operation | Verbindliche Untergrenzenregel (`floor_criticality`) |
|----------------------------------------|------------------------------|------------------------------------------------------|
| `reversible` | Auslesen von Flugregler-Telemetrie oder Temperatursensoren | Übernimmt `operation.criticality` unverändert |
| `bounded_compensation` | Anpassung von PID-Verstärkungen mit begrenzter automatischer Rücknahme | Übernimmt `operation.criticality` unverändert |
| `irreversible_consequence` | Entriegeln eines physischen Frachtschlosses oder Aussenden externer Funkbaken | $\max(\texttt{operation.criticality}, \texttt{high})$ – Untergrenze beträgt mindestens **`high`** |
| `irreversible_data_or_hardware` | Unwiederbringliches sicheres Löschen von Speicher oder Flashen von ESC-Firmware mit Beschädigungsrisiko | **Fest auf `critical` gesetzt**, unabhängig von der deklarierten `operation.criticality` |

Selbst wenn `unlock_cargo_latch` beispielsweise als Basiskritikalität `criticality = "sensitive"` angibt, hebt `consequence_irreversibility = "irreversible_consequence"` die Untergrenze `floor_criticality` zwingend auf `high` an; ebenso wird `flash_esc_firmware` durch `irreversible_data_or_hardware` fest auf `critical` verriegelt.

---

## 3.4 Monotone Kritikalitätsanhebung und Begrenzung von Herabstufungen

Oberhalb von `floor_criticality` erlaubt CAP vorgelagerten Berechtigungen (`req.grant.criticality_override`) sowie dem Aufrufer (`req.caller_criticality_override`), die Richtlinie monoton zu verschärfen, während Herabstufungen strikt unterbunden werden:

1. Initialisierung mit `effective_criticality = floor_criticality` und `escalation_clamped = false`.
2. Auswertung von `req.grant.criticality_override` und `req.caller_criticality_override` (sofern angegeben):
   - Liegt eine Überschreibung streng unterhalb von `floor_criticality` ($\text{rank}(\text{override}) < \text{rank}(\text{floor\_criticality})$), **MUSS** (**MUST**) der Auswerter den Herabstufungsversuch verwerfen, mindestens `floor_criticality` beibehalten und in `CapDecision` zu Prüfzwecken **`escalation_clamped = true`** setzen;
   - Andernfalls wird `effective_criticality = max(effective_criticality, override)` gesetzt.

Damit erfüllt jede CAP-Auswertung ausnahmslos die Invariante:

$$\text{rank}(\texttt{effective\_criticality}) \ge \text{rank}(\texttt{floor\_criticality})$$
