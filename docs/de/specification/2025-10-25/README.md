---
title: Spezifikation des Control Authority Protocol (CAP) 1.0
description: Normativer Spezifikationsindex, Kapitelübersicht und Konformitätsartefakte für das Control Authority Protocol (CAP) 1.0
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
replaces: draft@5bbc1a5
---

# Spezifikation des Control Authority Protocol (CAP) 1.0

Dieses Verzeichnis enthält die eingefrorene, normative Spezifikation des **Control Authority Protocol (CAP) 1.0** (Ausgabe `2025-10-25`, Status `Final`). CAP legt fest, wie ein digitaler Avatar (`iFay` oder `coFay`) die Kontrolle über Hardware und Software eines bewohnten **Host** (ausschließlich ein physisches Endgerät oder eine Client-Softwareanwendung) unter überprüfbarer, durch einen **Human Prime** (`Menschliches Primärsubjekt`) delegierter Autorität sicher anfordert, ausübt und wieder abgibt.

## Kapitelübersicht

| Kapitel | Datei | Normativer Geltungsbereich |
|---------|-------|----------------------------|
| Kapitel 0 | `00-Überblick und normative Terminologie.md` | Geltungsbereich und Nicht-Ziele des Protokolls, normative Schlüsselwörter nach RFC 2119 / RFC 8174, maßgebliche Terminologie sowie dreiachsige Versionsführung mit zweistelliger Protokollversion `"1.0"` |
| Kapitel 1 | `01-Architektur und Bindungsmodelle.md` | Protokollrollen und Vertrauensgrenzen, CAP als Relying Party gegenüber Faying, deterministische 8-stufige Auswertungspipeline, `Mandate`-Bindungsmodelle (Modell B / Modell A+B / Verbot von Modell C) sowie Ausschluss von `fund_transfer` |
| Kapitel 2 | `02-Autorisierungsstufen und Kritikalitätsmatrix.md` | Nicht-hierarchische Ressourcenzugriffsmodi (`read` / `write` / `execute` / `configure`), vierstufige Kritikalitätsordnung und konservative Entscheidungsmatrix `FayingGrade × AccessMode × Criticality` |
| Kapitel 3 | `03-Treiber-Fähigkeitsmanifest und Irreversibilitätsuntergrenze.md` | Ed25519-Signaturprüfung für `DriverCapabilityManifest`, standardmäßige `critical`-Ablehnung nicht deklarierter Operationen, Untergrenze durch `consequence_irreversibility` und monotone Kritikalitätsanhebung |
| Kapitel 4 | `04-Hochrisiko-Bestätigung durch Human Prime und Sicherheitszustand.md` | An den Parameter-SHA-256-Wert gebundenes Bestätigungsgatter des `Human Prime`, blockierungsfreie `G0`-Notübernahme per `G0SafeStateDirective`, kanonischer Fehler- und Diagnosecodekatalog sowie Konformitätskriterien |

## Begleitende normative Liefergegenstände

Diese Spezifikation bildet gemeinsam mit den folgenden maschinell prüfbaren Artefakten eine einheitliche Interoperabilitätsbasis:

- **Normatives CDDL-Draht- und Datenschema**: `schemas/cap-1.0.cddl`
- **Normatives JSON-Schema (Draft 2020-12)**: `schemas/cap-1.0.json` (gespiegelt unter `schema/2025-10-25/schema.json`)
- **Semantische Konformitätsvektoren**: `vectors/semantic/d1-d7-conformance.json` (14 Positiv- und Negativ-Testvektoren)
- **Zweisprachige Referenzimplementierungen**: TypeScript-Auswerter (`src/`) und Rust-Auswerter (`reference-impls/rust/`)

## Protokollübergreifende Abgrenzung

- Die Bezeichnersyntax für **Human Prime** und digitale Avatare wird maßgeblich durch **FayID** definiert (siehe `FayID`).
- Delegationsmandate (`Mandate`), Autonomiestufen (`G0`–`G4`) und Anwesenheitsfrische werden maßgeblich durch **Faying-Protocol** definiert (siehe `Faying-Protocol`).
- Laufzeitinjektion in den Host sowie das Laden von Treibermanifesten werden maßgeblich durch **FayGer** definiert (siehe `FayGer`).
- Das Verzeichnis gesellschaftlicher Beiträge **Global Merit Chain** (`GMChain`) und die nicht-monetäre Beitragsmetrik **MeriToken** werden maßgeblich durch **Global-Merit-Chain** definiert (siehe `Global-Merit-Chain`).
