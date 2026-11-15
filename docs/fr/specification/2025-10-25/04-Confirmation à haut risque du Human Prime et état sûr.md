---
title: "Chapitre 4 : Confirmation à haut risque du Human Prime et état sûr"
description: Porte de confirmation du Human Prime liée aux paramètres dans CAP 1.0, directives d'état sûr lors d'une reprise G0, catalogue des codes d'erreur et critères de conformité
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Chapitre 4 : Confirmation à haut risque du Human Prime et état sûr

## 4.1 Porte de confirmation explicite du `Human Prime` liée aux paramètres (`HumanConfirmationProof`)

Pour toute opération dont `effective_criticality` vaut **`high`** ou **`critical`** (**y compris les opérations exécutées au sein d'une session de présence en temps réel `G1`**), l'Évaluateur CAP **DOIT** (**MUST**) valider `req.human_confirmation` (`HumanConfirmationProof`). Les implémentations **NE DOIVENT PAS** (**SHALL NOT**) dispenser cette confirmation par opération au motif du confort d'automatisation ou de la fiabilité passée de l'agent :

1. **Syntaxe canonique d'identité** : `human_confirmation.human_prime_id` **DOIT** (**MUST**) correspondre au motif canonique d'identifiant du **Human Prime** `^hid_[a-z2-7]{16,}$`.
2. **Fraîcheur temporelle** : `human_confirmation.expires_at_epoch_ms` **DOIT** (**MUST**) être strictement supérieur à `req.now_epoch_ms`.
3. **Divulgation attestée par le Host** : `human_confirmation.terminal_attested_disclosure` **DOIT** (**MUST**) être égal à `true`, prouvant qu'une interface de confiance du Host (et non un texte autodéclaré par le `Fay`) a présenté au **Human Prime** la ressource cible, l'opération et ses conséquences irréversibles.
4. **Liaison canonique SHA-256 des paramètres** : Calculer le condensat SHA-256 en hexadécimal minuscule (64 caractères) sur la sérialisation JSON canonique en UTF-8 (voir §3.1) de `req.params` ; `human_confirmation.confirmed_params_sha256` **DOIT** (**MUST**) correspondre caractère pour caractère à ce condensat.

Si `human_confirmation` est absent ou échoue à l'un des contrôles ci-dessus (par exemple en cas d'altération des paramètres après confirmation), l'Évaluateur **DOIT** (**MUST**) renvoyer immédiatement `decision = "DENY"`, `error_code = "E_CONFIRMATION_REQUIRED"` et `diagnostic_code = 2006`.

---

## 4.2 Reprise en main d'urgence `G0` et directives non bloquantes d'état sûr

Le **Human Prime** conserve à tout instant une priorité inconditionnelle pour reprendre le contrôle du Host. Dès lors que `req.g0_override == true` ou `req.grant.mandate_binding.session_grade == "G0"` :

1. **Refus préemptif immédiat** : Avant même l'examen de l'expiration du mandat ou de la matrice de grades, l'Évaluateur CAP **DOIT** (**MUST**) rejeter la requête du `Fay` avec `decision = "DENY"`, `error_code = "E_G0_EMERGENCY_OVERRIDE"` et `diagnostic_code = 2003`.
2. **Directive déterministe d'état sûr (`G0SafeStateDirective`)** :
   - Si la liste `ResourceCapabilityDescriptor.safe_states` de la ressource cible est non vide, l'Évaluateur **DOIT** (**MUST**) sélectionner `safe_states[0].safe_state_id` et émettre :
     `{ "action": "enter_safe_state", "safe_state_id": "<safe_states[0].safe_state_id>", "blocks_human_takeover": false }` ;
   - Si la ressource cible ne déclare aucun `safe_states` (ou une liste vide), l'Évaluateur **DOIT** (**MUST**) émettre :
     `{ "action": "terminate_and_alert", "blocks_human_takeover": false }`, ordonnant au Host d'interrompre sans délai les actions en cours de l'agent et d'alerter le **Human Prime**.
3. **Invariant d'absence totale de blocage** : `safe_state_directive.blocks_human_takeover` **DOIT** (**MUST**) toujours valoir `false`. Les transitions vers un état sûr ou routines de nettoyage du Host **NE DOIVENT PAS** (**SHALL NOT**) bloquer, verrouiller ni retarder une reprise en main directe, physique ou interactive, par le **Human Prime**.

---

## 4.3 Codes d'erreur canoniques et codes numériques de diagnostic associés

Les réponses sur le fil de CAP 1.0 emploient des codes d'erreur stables en majuscules séparées par des blancs soulignés (`CapErrorCode`), associés en bijection 1-à-1 à des codes numériques de diagnostic (`2001` à `2099`) :

| Code d'erreur canonique (`error_code`) | Code de diagnostic (`diagnostic_code`) | Condition de déclenchement et sémantique normative |
|----------------------------------------|----------------------------------------|----------------------------------------------------|
| `E_WEAK_MANDATE_BINDING` | `2001` | Une requête `high`/`critical` n'utilise pas `model_a_plus_b` (ou manque de preuve dérivée valide / de fraîcheur en ligne), ou une requête `sensitive` utilise `model_c_offline_cache` |
| `E_GRADE_INSUFFICIENT` | `2002` | Le grade de session est inférieur à `grant.min_grade` ou enfreint la matrice `FayingGrade × AccessMode × Criticality` |
| `E_G0_EMERGENCY_OVERRIDE` | `2003` | Reprise en main d'urgence `G0` du **Human Prime** active : refuse le contrôle du `Fay` et émet une `safe_state_directive` non bloquante |
| `E_UNKNOWN_OPERATION` | `2004` | Le `resource_id` ou l'`operation_id` demandé n'est pas déclaré dans le `DriverCapabilityManifest` vérifié |
| `E_UNTRUSTED_MANIFEST` | `2005` | Le `DriverCapabilityManifest` est dépourvu de signature valide, l'ancre de confiance est absente ou la vérification Ed25519 échoue |
| `E_CONFIRMATION_REQUIRED` | `2006` | Une opération `high`/`critical` ne dispose pas d'un `HumanConfirmationProof` non expiré, attesté par le Host et conforme au SHA-256 des paramètres |
| `E_OUT_OF_SCOPE_FUND_TRANSFER` | `2007` | La requête ou l'opération du manifeste déclare `domain_category == "fund_transfer"`, hors périmètre de CAP 1.0 |
| `E_MANDATE_INVALID` | `2008` | Le mandat est révoqué, expiré, non frais dans un modèle en ligne, ou incohérent quant au sujet, à la ressource ou au mode |
| `E_PROTOCOL_VERSION_UNSUPPORTED` | `2098` | `protocol_version` ne correspond pas à la version prise en charge à deux segments `"1.0"` |
| `E_PROTOCOL` | `2099` | Enveloppe mal formée ou erreur protocolaire générale ; l'alias historique `E_INVALID_MESSAGE` **DOIT** (**MUST**) être normalisé en `E_PROTOCOL` à la lecture |

---

## 4.4 Critères de conformité d'implémentation

Toute implémentation revendiquant la conformité à **CAP 1.0 (édition `2025-10-25`)** **DOIT** (**MUST**) satisfaire l'ensemble des exigences vérifiables suivantes :

1. Mettre en œuvre l'intégralité du pipeline déterministe *default-deny* en 8 étapes, le plancher monotone de criticité, la matrice tridimensionnelle de grades, la porte de confirmation du **Human Prime** liée au SHA-256 des paramètres et la directive non bloquante d'état sûr `G0` définis aux chapitres 0 à 4 ;
2. Se conformer strictement aux définitions de trame et de données figurant dans `schemas/cap-1.0.cddl` et `schemas/cap-1.0.json` ;
3. Exécuter les 14 vecteurs normatifs de conformité (`V01` à `V14`) de `vectors/semantic/d1-d7-conformance.json` avec **100 % de parité exacte** sur `decision`, `effective_criticality`, `effective_grade`, `escalation_clamped`, `error_code`, `diagnostic_code` et `safe_state_directive`.
