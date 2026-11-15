---
title: Spécification du Control Authority Protocol (CAP) 1.0
description: Index normatif de la spécification, guide des chapitres et livrables de conformité du Control Authority Protocol (CAP) 1.0
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
replaces: draft@5bbc1a5
---

# Spécification du Control Authority Protocol (CAP) 1.0

Ce répertoire contient la spécification normative figée du **Control Authority Protocol (CAP) 1.0** (édition `2025-10-25`, statut `Final`). CAP définit la manière dont un avatar numérique (`iFay` ou `coFay`) demande, exerce et restitue en toute sécurité le contrôle matériel et logiciel d'un **Host** habité (strictement un terminal physique ou une application cliente) sous l'autorité vérifiable déléguée par un **Human Prime**.

## Chapitres de la spécification

| Chapitre | Fichier | Périmètre normatif |
|----------|---------|--------------------|
| Chapitre 0 | `00-Vue d'ensemble et terminologie normative.md` | Périmètre et exclusions du protocole, mots-clés normatifs RFC 2119 / RFC 8174, terminologie de référence et discipline de versionnement à trois axes avec version à deux segments `"1.0"` |
| Chapitre 1 | `01-Architecture et modèles de liaison.md` | Rôles et frontières de confiance, CAP en tant que partie utilisatrice de Faying, pipeline déterministe d'évaluation en 8 étapes, modèles de liaison de `Mandate` (modèle B / modèle A+B / interdiction du modèle C) et exclusion de `fund_transfer` |
| Chapitre 2 | `02-Grades d'autorité et matrice de criticité.md` | Modes d'accès aux ressources non hiérarchiques (`read` / `write` / `execute` / `configure`), ordre total de criticité à quatre niveaux et matrice conservatrice `FayingGrade × AccessMode × Criticality` |
| Chapitre 3 | `03-Manifeste de capacités du pilote et plancher d'irréversibilité.md` | Vérification des signatures Ed25519 sur `DriverCapabilityManifest`, refus par défaut en `critical` des opérations non déclarées, plancher `consequence_irreversibility` et escalade monotone de criticité |
| Chapitre 4 | `04-Confirmation à haut risque du Human Prime et état sûr.md` | Porte de confirmation explicite du `Human Prime` liée au condensat SHA-256 des paramètres, reprise en main d'urgence `G0` non bloquante (`G0SafeStateDirective`), catalogue canonique des erreurs et critères de conformité |

## Livrables normatifs associés

Cette spécification constitue un socle d'interopérabilité unifié avec les artefacts vérifiables par machine suivants :

- **Schéma normatif CDDL de trame et de données** : `schemas/cap-1.0.cddl`
- **Schéma normatif JSON Schema (Draft 2020-12)** : `schemas/cap-1.0.json` (répliqué dans `schema/2025-10-25/schema.json`)
- **Suite de vecteurs de conformité sémantique** : `vectors/semantic/d1-d7-conformance.json` (14 vecteurs d'essai positifs et négatifs)
- **Implémentations de référence en deux langages** : évaluateur TypeScript (`src/`) et évaluateur Rust (`reference-impls/rust/`)

## Frontières inter-protocoles

- La syntaxe des identifiants du **Human Prime** et des avatars numériques est définie de manière faisant foi par **FayID** (voir `FayID`).
- Les mandats de délégation (`Mandate`), les grades d'autonomie (`G0` à `G4`) et la fraîcheur de présence sont définis de manière faisant foi par **Faying-Protocol** (voir `Faying-Protocol`).
- L'injection d'exécution dans le Host et le chargement des manifestes de pilotes sont définis de manière faisant foi par **FayGer** (voir `FayGer`).
- Le registre de contribution sociale **Global Merit Chain** (`GMChain`) et la métrique non monétaire **MeriToken** sont définis de manière faisant foi par **Global-Merit-Chain** (voir `Global-Merit-Chain`).
