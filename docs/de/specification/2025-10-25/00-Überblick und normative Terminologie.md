---
title: "Kapitel 0: Überblick und normative Terminologie"
description: Geltungsbereich von CAP 1.0, normative Schlüsselwörter nach RFC 2119 und RFC 8174, Kernterminologie und zweistellige Versionsregeln
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Kapitel 0: Überblick und normative Terminologie

## 0.1 Auftrag und Geltungsbereich des Protokolls

Das **Control Authority Protocol (CAP)** bildet ein nach dem Prinzip der standardmäßigen Ablehnung (Default-Deny) arbeitendes Autorisierungs- und Sicherheitsgatter zwischen einem digitalen Avatar (`Fay`, bestehend aus individuellen Avataren `iFay` und rollenbasierten Avataren `coFay`) und einem bewohnten **Host** (einem physischen Endgerät, einem Aktuatorsubsystem oder einer Client-Softwareanwendung). CAP übersetzt vorgelagerte Delegationsbefugnisse in deterministische Einzeloperationsentscheidungen und stellt sicher, dass unumkehrbare physische Auswirkungen sowie kritische Systemänderungen strikt durch signierte Treiber-Fähigkeitsuntergrenzen und den ausdrücklichen Willen des **Human Prime** (`Menschliches Primärsubjekt`) begrenzt bleiben.

Der normative Geltungsbereich von CAP 1.0 umfasst:

1. Das Draht- und Datenmodell für Kontrollauswertungsanfragen (`CapEvaluationRequest`) und deterministische Entscheidungen (`CapDecision`);
2. Kryptografische Signaturprüfung, Ableitung der Basiskritikalität und Berechnung der Irreversibilitätsuntergrenze über `DriverCapabilityManifest`;
3. Prüfung der Online-Aktualität sowie sitzungsabgeleiteter kryptografischer Nachweise für `Faying-Protocol`-Mandatsbelege (`MandateEvidence`);
4. Die dreidimensionale Zulassungsmatrix `FayingGrade × AccessMode × Criticality`;
5. Die an den Parameter-Hash gebundene ausdrückliche Bestätigung durch den **Human Prime** (`HumanConfirmationProof`) für sämtliche `high`- und `critical`-Operationen;
6. Unmittelbare Vorrangunterbrechung bei einer `G0`-Notübernahme durch den **Human Prime** einschließlich blockierungsfreier Sicherheitszustandsanweisungen (`G0SafeStateDirective`).

**Ausdrücklich ausgeschlossene Bereiche**: CAP 1.0 regelt weder die Identitätsausstellung (siehe `FayID`) noch kognitive Schlussfolgerungsverfahren (siehe `Ego`) oder die Verbuchung gesellschaftlicher Beiträge (die nicht-monetäre **MeriToken**-Verbuchung auf **GMChain** ist in `Global-Merit-Chain` spezifiziert). Darüber hinaus sind **finanzielle Geldtransfers und Zahlungsabwicklungen (`fund_transfer`) vollständig aus CAP 1.0 ausgeschlossen**; jede Anfrage oder Operation mit `domain_category == "fund_transfer"` wird ausnahmslos abgewiesen.

---

## 0.2 Normative Schlüsselwörter nach RFC 2119 und RFC 8174

Die Schlüsselwörter **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY** und **OPTIONAL** sowie ihre großgeschriebenen deutschen Entsprechungen in dieser Spezifikation sind gemäß BCP 14 (IETF RFC 2119 und RFC 8174) genau dann normativ auszulegen, wenn sie vollständig in Großbuchstaben gesetzt sind:

| Englisches Schlüsselwort (BCP 14) | Deutsche Entsprechung | Normative Auslegung |
|-----------------------------------|-----------------------|---------------------|
| **MUST** / **SHALL** / **REQUIRED** | **MUSS** / **ERFORDERLICH** | Zwingende Anforderung der Spezifikation; bei Abweichung ist keine Konformität mit CAP 1.0 gegeben |
| **MUST NOT** / **SHALL NOT** | **DARF NICHT** | Absolutes Verbot der Spezifikation; jeder Verstoß stellt eine Nichtkonformität und einen Sicherheitsmangel dar |
| **SHOULD** / **RECOMMENDED** | **SOLLTE** / **EMPFOHLEN** | Nachdrückliche technische Empfehlung; Abweichungen erfordern eine dokumentierte Sicherheitsbegründung und Risikoanalyse |
| **SHOULD NOT** / **NOT RECOMMENDED** | **SOLLTE NICHT** / **NICHT EMPFOHLEN** | Nachdrückliches Abraten von einem Verhalten; Ausnahmen setzen eine explizite Sicherheitsbewertung voraus |
| **MAY** / **OPTIONAL** | **DARF** / **OPTIONAL** | Echte Wahlfreiheit; interoperable Gegenstellen **DÜRFEN NICHT** (**MUST NOT**) voraussetzen, dass eine optionale Fähigkeit stets vorhanden oder abwesend ist |

Kleingeschriebene Vorkommen dieser Wörter tragen ausschließlich ihre gewöhnliche sprachliche Bedeutung ohne normative Bindungswirkung.

---

## 0.3 Maßgebliche Terminologie

Alle Implementierungen, Schemata und Dokumentationen **MÜSSEN** (**MUST**) die folgenden Begriffsregeln einhalten:

- **Human Prime (`Menschliches Primärsubjekt`)**: Die durch einen `iFay` repräsentierte natürliche Person, die die letzte Rechenschaftspflicht sowie das uneingeschränkte Übersteuerungsrecht innehat (kanonischer Bezeichner gemäß `^hid_[a-z2-7]{16,}$`). **Implementierungen und Dokumentationen DÜRFEN einen Menschen NICHT (**MUST NOT**) als „Host“ bezeichnen.**
- **Fay (`iFay` / `coFay`)**: Der digitale Avatar, der die Kontrolle über eine Ressource des Host anfordert.
- **Inhabit (`Bewohnen`)**: Der Laufzeitvorgang, bei dem ein `Fay` in einen Ziel-Host eingebracht wird, sodass dieser Host unter CAP-Aufsicht gesteuert werden kann.
- **Host**: Ausschließlich **das physische Endgerät, die Aktuatorperipherie oder die Client-Softwareanwendung**, die von einem `Fay` bewohnt und gesteuert wird (niemals ein Mensch).
- **CAP-Auswerter (`CAP Evaluator`)**: Die normative Richtliniendurchsetzungskomponente innerhalb der Vertrauensgrenze des Host, die deterministisch `CapEvaluationRequest → CapDecision` auswertet.

---

## 0.4 Drei orthogonale Versionsachsen und zweistellige Disziplin `"1.0"`

CAP trennt die Versionierung in drei orthogonale Achsen, die **NICHT** (**MUST NOT**) zu einer einzigen Zeichenkette oder einer dreistelligen SemVer-Kennung vermischt werden dürfen:

1. **Protokollversion (`Protocol Version`)**: Die einzige auf der Leitung übertragene Interoperabilitätskennung, strikt formatiert aus zwei nichtnegativen Ganzzahlsegmenten `MAJOR.MINOR` **ohne `PATCH`-Segment**. Umschlagskopfzeilen führen `"CAP/1.0"`, während `CapEvaluationRequest.protocol_version` und `protocol.version` genau die zweistellige Zeichenkette **`"1.0"`** tragen (entsprechend `^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`).
   - **Erhöhung von `MAJOR`**: Vorbehalten für inkompatible Drahtänderungen oder Änderungen an Default-Deny-Sicherheitsinvarianten; `MAJOR`-übergreifende Kompatibilität wird nicht zugesichert.
   - **Erhöhung von `MINOR`**: Vorbehalten für abwärtskompatible optionale Felder oder additive Aufzählungserweiterungen; Implementierungen höherer `MINOR`-Stufen innerhalb desselben `MAJOR` **MÜSSEN** (**MUST**) bis `MAJOR.0` abwärtskompatibel bleiben und unbekannte optionale Felder ignorieren.
2. **Dokumentstatus (`Document Status`)**: Wird ausschließlich im Front-Matter-Feld `status` (`Draft`, `Final`, `Deprecated` oder `Obsolete`, Groß-/Kleinschreibung signifikant) geführt und **DARF NICHT** (**SHALL NOT**) auf der Leitung oder in Verzeichnispfaden erscheinen.
3. **Redaktionelle Ausgabe (`Editorial Edition`)**: Verankert durch das Veröffentlichungsdatum nach ISO 8601 `YYYY-MM-DD` (**`2025-10-25`** für die erste eingefrorene Ausgabe von CAP 1.0). Redaktionelle Ausgaben enthalten ausschließlich nicht-normative sprachliche Präzisierungen ohne Änderung der Drahtsemantik und **DÜRFEN NICHT** (**SHALL NOT**) in Drahtnutzdaten aufgenommen werden.

Empfängt ein CAP-1.0-Auswerter eine Anfrage, deren `protocol_version` von `"1.0"` abweicht (beispielsweise `"2.0"` oder `"1.0.0"`), **MUSS** (**MUST**) er die Anfrage unverzüglich mit `decision = "DENY"`, `effective_criticality = "critical"`, `error_code = "E_PROTOCOL_VERSION_UNSUPPORTED"` und `diagnostic_code = 2098` abweisen, ohne eine behelfsmäßige Rückstufung zu versuchen.
