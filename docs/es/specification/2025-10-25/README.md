---
title: Especificación de Control Authority Protocol (CAP) 1.0
description: Índice normativo de la especificación, guía de capítulos y artefactos de conformidad para Control Authority Protocol (CAP) 1.0
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
replaces: draft@5bbc1a5
---

# Especificación de Control Authority Protocol (CAP) 1.0

Este directorio contiene la especificación normativa congelada de **Control Authority Protocol (CAP) 1.0** (edición `2025-10-25`, estado `Final`). CAP define cómo un avatar digital (`iFay` o `coFay`) solicita, ejerce y libera de manera segura el control sobre el hardware y el software de un **Host** habitado (estrictamente un dispositivo terminal físico o una aplicación cliente) bajo la autoridad verificable delegada por un **Human Prime**.

## Capítulos de la especificación

| Capítulo | Archivo | Alcance normativo |
|----------|---------|-------------------|
| Capítulo 0 | `00-Descripción general y terminología normativa.md` | Alcance y exclusiones del protocolo, convenciones normativas de RFC 2119 / RFC 8174, terminología autoritativa y disciplina de versiones en tres ejes con formato de dos segmentos `"1.0"` |
| Capítulo 1 | `01-Arquitectura y modelos de vinculación.md` | Roles y fronteras de confianza, CAP como parte confiante de Faying, tubería determinista de evaluación en 8 pasos, modelos de vinculación de `Mandate` (Modelo B / Modelo A+B / prohibición de Modelo C) y exclusión de `fund_transfer` |
| Capítulo 2 | `02-Grados de autoridad y matriz de criticidad.md` | Modos no jerárquicos de acceso a recursos (`read` / `write` / `execute` / `configure`), orden total de criticidad en cuatro niveles y matriz conservadora `FayingGrade × AccessMode × Criticality` |
| Capítulo 3 | `03-Manifiesto de capacidades del controlador y piso de irreversibilidad.md` | Verificación de firmas Ed25519 sobre `DriverCapabilityManifest`, denegación predeterminada `critical` ante operaciones no declaradas, piso `consequence_irreversibility` y escalamiento monótono de criticidad |
| Capítulo 4 | `04-Confirmación de alto riesgo de Human Prime y estado seguro.md` | Compuerta de confirmación explícita de `Human Prime` vinculada al resumen SHA-256 de parámetros, toma de control de emergencia `G0` sin bloqueo (`G0SafeStateDirective`), catálogo canónico de errores y criterios de conformidad |

## Artefactos normativos complementarios

Esta especificación conforma una línea base única de interoperabilidad junto con los siguientes artefactos verificables por máquina:

- **Esquema normativo CDDL de cable y datos**: `schemas/cap-1.0.cddl`
- **Esquema normativo JSON Schema (Draft 2020-12)**: `schemas/cap-1.0.json` (reflejado en `schema/2025-10-25/schema.json`)
- **Conjunto de vectores de conformidad semántica**: `vectors/semantic/d1-d7-conformance.json` (14 vectores de prueba positivos y negativos)
- **Implementaciones de referencia en dos lenguajes**: Evaluador en TypeScript (`src/`) y evaluador en Rust (`reference-impls/rust/`)

## Fronteras entre protocolos

- La sintaxis de identificadores de **Human Prime** y de avatares digitales se define de forma autoritativa en **FayID** (véase `FayID`).
- Los mandatos de delegación (`Mandate`), los grados de autonomía (`G0`–`G4`) y la vigencia de presencia se definen de forma autoritativa en **Faying-Protocol** (véase `Faying-Protocol`).
- La inyección en tiempo de ejecución sobre el Host y el ciclo de carga de manifiestos de controladores se definen de forma autoritativa en **FayGer** (véase `FayGer`).
- El registro de contribución social **Global Merit Chain** (`GMChain`) y la métrica no monetaria **MeriToken** se definen de forma autoritativa en **Global-Merit-Chain** (véase `Global-Merit-Chain`).
