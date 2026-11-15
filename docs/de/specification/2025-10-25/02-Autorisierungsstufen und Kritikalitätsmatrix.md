---
title: "Kapitel 2: Autorisierungsstufen und Kritikalitätsmatrix"
description: Ressourcenzugriffsmodi in CAP 1.0, vierstufige Kritikalitätsordnung und dreidimensionale Matrix FayingGrade x AccessMode x Criticality
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Kapitel 2: Autorisierungsstufen und Kritikalitätsmatrix

## 2.1 Nicht-hierarchische Ressourcenzugriffsmodi (`AccessMode`)

CAP 1.0 definiert vier orthogonale `AccessMode`-Werte für Operationen auf Host-Ressourcen. Diese Zugriffsmodi stehen in **keiner hierarchischen Einschlussbeziehung** (eine Berechtigung für `write` schließt beispielsweise weder `read` noch `configure` implizit ein):

| Zugriffsmodus | Nebenläufigkeits-Sperrsemantik | Normative Begriffsbestimmung |
|---------------|--------------------------------|------------------------------|
| `read` | Geteilte Lesesperre | Liest Telemetrie, Gerätestatus oder Konfigurationsstände aus, ohne den Host-Zustand oder äußere physische Bedingungen zu verändern |
| `write` | Exklusive Schreibsperre (Mutex) | Verändert Host-Speicherinhalte, beschreibt Steuerregister oder überträgt Firmware-Abbilder |
| `execute` | Exklusive Ausführungssperre (Mutex) | Betätigt physische Aktuatoren, versendet externe Nachrichten oder startet Host-Prozesse |
| `configure` | Exklusive Konfigurationssperre (Mutex) | Ändert Sicherheitsrichtlinien des Host, Regelkreisparameter (etwa PID-Verstärkungen eines Flugreglers) oder Berechtigungsgrenzen |

Bei der Nebenläufigkeitssteuerung zur Laufzeit sind mehrere gleichzeitige `read`-Operationen auf derselben Host-Ressource zulässig, während jede `write`-, `execute`- oder `configure`-Operation eine exklusive Sperre erwerben **MUSS** (**MUST**), die sämtliche anderen Operationen auf dieser Ressource ausschließt.

---

## 2.2 Vollständige Ordnung der Operationskritikalität (`Criticality`)

CAP 1.0 ordnet jede Host-Operation entlang einer strengen vierstufigen Totalordnung ein:

$$\texttt{routine} (0) < \texttt{sensitive} (1) < \texttt{high} (2) < \texttt{critical} (3)$$

- **`routine`**: Vollständig umkehrbare, risikoarme Lese- oder begrenzte idempotente Operationen ohne Datenschutzrisiko oder physische Gefährdung (z. B. Auslesen von Umgebungstemperatur oder Flugtelemetrie).
- **`sensitive`**: Kontrollierte Parameteranpassungen, das Lesen vertraulicher Zustandsdaten oder Änderungen mit begrenzter automatischer Kompensation (z. B. Nachjustierung von Regler-PID-Parametern).
- **`high`**: Operationen mit unumkehrbaren Auswirkungen in der realen Welt, physischer Verriegelungsbetätigung oder externer Aussendung (z. B. Entriegeln eines physischen Frachtschlosses); erfordert Bindung nach Modell A+B sowie Einzeloperationsbestätigung durch den **Human Prime**.
- **`critical`**: Operationen mit dem Risiko unwiederbringlicher Datenvernichtung, dauerhafter Hardwarebeschädigung oder schwerer physischer Schäden (z. B. kryptografisches sicheres Löschen von Datenträgern oder Flashen von ESC-Reglerfirmware); ausschließlich unter `G1` zulässig.

---

## 2.3 Autonomie- und Anwesenheitsstufen aus Faying (`FayingGrade`)

Der CAP-Auswerter übernimmt die fünf durch `Faying-Protocol` definierten Sitzungsstufen (siehe `Faying-Protocol`):

- **`G0`**: Unmittelbarer Notübernahmezustand des **Human Prime** (`Menschliches Primärsubjekt`) mit höchster Unterbrechungspriorität (niemals ein autonomer Ausführungszustand eines `Fay`);
- **`G1`**: Starke Echtzeit-Anwesenheitsbindung des **Human Prime** (höchste Delegationsstärke; die **einzige** für `critical`-Operationen zugelassene Stufe);
- **`G2`**: Überwachte Begleitanwesenheit des **Human Prime**;
- **`G3`**: Reguläre delegierte Autonomie;
- **`G4`**: Eingeschränkte Hintergrundautonomie (niedrigste Delegationsstärke).

Für `CapGrant.min_grade` (`G1`–`G4`) gilt die strenge Rangfolge der Autorisierungsstärke:

$$\text{Strength}(\texttt{G1}) = 4 > \text{Strength}(\texttt{G2}) = 3 > \text{Strength}(\texttt{G3}) = 2 > \text{Strength}(\texttt{G4}) = 1$$

Gilt $\text{Strength}(\texttt{session\_grade}) < \text{Strength}(\texttt{grant.min\_grade})$, **MUSS** (**MUST**) der Auswerter die Anfrage mit `E_GRADE_INSUFFICIENT` (`2002`) ablehnen.

---

## 2.4 Dreidimensionale Autorisierungsmatrix (`FayingGrade × AccessMode × Criticality`)

Liegt `session_grade` im Bereich `G1`–`G4` und erfüllt `grant.min_grade`, **MUSS** (**MUST**) der CAP-Auswerter die folgende konservative Zulassungsmatrix über `(session_grade, requested_mode, effective_criticality)` durchsetzen:

| Wirksame Kritikalität (`effective_criticality`) | `G1` (Echtzeit-Anwesenheit) | `G2` (Überwachte Anwesenheit) | `G3` (Standardautonomie) | `G4` (Eingeschränkter Hintergrund) |
|-------------------------------------------------|-----------------------------|-------------------------------|--------------------------|------------------------------------|
| **`critical`** | `read` / `write` / `execute` / `configure` zulässig (**erfordert Bestätigungsgatter nach Kapitel 4**) | **`DENY`** | **`DENY`** | **`DENY`** |
| **`high`** | Alle gewährten Modi zulässig (**erfordert Bestätigungsgatter nach Kapitel 4**) | Alle gewährten Modi zulässig (**erfordert Bestätigungsgatter nach Kapitel 4**) | **`DENY`** | **`DENY`** |
| **`sensitive`** | Alle gewährten Modi zulässig | Alle gewährten Modi zulässig | Nur `read` / `write` / `execute` (**`configure` verboten**) | **`DENY`** |
| **`routine`** | Alle gewährten Modi zulässig | Alle gewährten Modi zulässig | Alle gewährten Modi zulässig | Nur `read` / `execute` (**`write` & `configure` verboten**) |

### Zentrale Sicherheitsinvarianten der Matrix

1. **Exklusivität von `G1` für `critical`**: Jede unter `G2`, `G3` oder `G4` angeforderte `critical`-Operation **MUSS** (**MUST**) mit `E_GRADE_INSUFFICIENT` (`2002`) abgewiesen werden – selbst dann, wenn ein gültiger `human_confirmation`-Nachweis beiliegt.
2. **Konfigurationssperre unter `G3`**: Das Anfordern des Modus `configure` für eine `sensitive`-Operation unter `G3` **MUSS** (**MUST**) mit `E_GRADE_INSUFFICIENT` (`2002`) abgewiesen werden.
3. **Änderungsverbot unter `G4`**: Unter `G4` sind ausschließlich `read` und `execute` auf `routine`-Operationen gestattet; jede `write`-, `configure`- oder oberhalb von `routine` eingestufte Operation **MUSS** (**MUST**) mit `E_GRADE_INSUFFICIENT` (`2002`) abgewiesen werden.
