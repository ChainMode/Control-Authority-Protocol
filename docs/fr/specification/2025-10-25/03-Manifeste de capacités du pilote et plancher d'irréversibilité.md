---
title: "Chapitre 3 : Manifeste de capacités du pilote et plancher d'irréversibilité"
description: Vérification de signature Ed25519 du manifeste dans CAP 1.0, refus des opérations inconnues, plancher d'irréversibilité et escalade monotone de criticité
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Chapitre 3 : Manifeste de capacités du pilote et plancher d'irréversibilité

## 3.1 Vérification du `DriverCapabilityManifest` signé

La criticité de base d'une opération **NE DOIT PAS** (**SHALL NOT**) être fixée par le `Fay` appelant ni par des métadonnées externes non vérifiées ; elle **DOIT** (**MUST**) provenir d'un `DriverCapabilityManifest` côté Host signé cryptographiquement par une autorité de confiance. Chaque manifeste comporte :

- `manifest_id`, `driver_id`, `version`, `issued_at` : Identifiant unique du manifeste, identifiant du pilote, chaîne de version et horodatage d'émission ;
- `signer_key_id` : Identifiant de clé référençant une entrée dans la table locale `TrustAnchorMap` du Host ;
- `resources` : Tableau non vide d'entrées `ResourceCapabilityDescriptor` déclarant `resource_id`, des `safe_states` éventuels et une liste non vide `operations` (`OperationDescriptor`) ;
- `signature_ed25519` : Signature Ed25519 de 64 octets (128 caractères hexadécimaux) conforme à la RFC 8032.

### Procédure canonique de vérification de signature

L'Évaluateur CAP **DOIT** (**MUST**) vérifier l'authenticité du manifeste selon les étapes suivantes :

1. Confirmer que `signature_ed25519` est une chaîne hexadécimale valide de 128 caractères et rechercher `signer_key_id` dans `trust_anchors`. Si l'ancre de confiance est absente, si `algorithm != "Ed25519"` ou si `public_key_raw_hex` n'est pas une chaîne hexadécimale valide de 64 caractères (clé publique Ed25519 brute de 32 octets), la vérification échoue immédiatement.
2. Construire l'objet manifeste non signé en omettant `signature_ed25519`, puis le sérialiser en octets UTF-8 selon un **JSON canonique déterministe compatible RFC 8785** (clés d'objet triées lexicographiquement, omission des propriétés optionnelles non définies et absence totale d'espaces superflus).
3. Vérifier la signature Ed25519 de 64 octets sur ces octets UTF-8 à l'aide de la clé publique de l'ancre de confiance.

En cas d'échec de la vérification, l'Évaluateur **DOIT** (**MUST**) renvoyer immédiatement `decision = "DENY"`, `effective_criticality = "critical"`, `error_code = "E_UNTRUSTED_MANIFEST"` et `diagnostic_code = 2005`.

---

## 3.2 Refus par défaut en `critical` des ressources et opérations inconnues

Au sein d'un `DriverCapabilityManifest` dont la signature a été validée :

- Si aucun `ResourceCapabilityDescriptor` ne correspond à `req.resource_id`, ou si aucun `OperationDescriptor` au sein de cette ressource ne correspond à `req.operation_id`, l'Évaluateur CAP **DOIT** (**MUST**) qualifier `effective_criticality` en `"critical"` et renvoyer immédiatement `decision = "DENY"`, `error_code = "E_UNKNOWN_OPERATION"` et `diagnostic_code = 2004`.
- Les implémentations **NE DOIVENT PAS** (**SHALL NOT**) prévoir d'admission générique par joker ni attribuer par défaut le niveau `routine` à des opérations non déclarées.

---

## 3.3 Plancher d'irréversibilité des conséquences (`ConsequenceIrreversibility`)

Afin d'éviter que des pilotes mal configurés ne sous-classent des actions physiquement ou numériquement destructrices, chaque `OperationDescriptor` **DOIT** (**MUST**) déclarer à la fois `criticality` et `consequence_irreversibility`. L'Évaluateur **DOIT** (**MUST**) calculer en premier lieu le plancher `floor_criticality` comme suit :

| Valeur de `consequence_irreversibility` | Opération représentative sur le Host | Règle obligatoire de plancher (`floor_criticality`) |
|-----------------------------------------|--------------------------------------|-----------------------------------------------------|
| `reversible` | Lecture de télémétrie de contrôleur de vol ou de capteurs thermiques | Conserve `operation.criticality` |
| `bounded_compensation` | Ajustement de gains PID assorti d'un retour arrière automatique borné | Conserve `operation.criticality` |
| `irreversible_consequence` | Déverrouillage d'un loquet physique de soute ou émission de balises externes | $\max(\texttt{operation.criticality}, \texttt{high})$ : le plancher vaut au minimum **`high`** |
| `irreversible_data_or_hardware` | Effacement sécurisé irrécupérable de stockage ou flashage de micrologiciel ESC à risque de blocage matériel | **Verrouillé sur `critical`** quelle que soit la valeur déclarée dans `operation.criticality` |

Ainsi, même si `unlock_cargo_latch` déclare une criticité initiale `criticality = "sensitive"`, la valeur `consequence_irreversibility = "irreversible_consequence"` relève automatiquement `floor_criticality` à `high` ; de même, `flash_esc_firmware` marqué `irreversible_data_or_hardware` est verrouillé sur `critical`.

---

## 3.4 Escalade monotone de criticité et plafonnement des rétrogradations

Au-dessus de `floor_criticality`, CAP autorise les concessions en amont (`req.grant.criticality_override`) ainsi que l'appelant (`req.caller_criticality_override`) à durcir la politique de façon monotone tout en interdisant toute rétrogradation :

1. Initialiser `effective_criticality = floor_criticality` et `escalation_clamped = false`.
2. Examiner `req.grant.criticality_override` et `req.caller_criticality_override` (lorsqu'ils sont renseignés) :
   - Si une surcharge est strictement inférieure à `floor_criticality` ($\text{rank}(\text{override}) < \text{rank}(\text{floor\_criticality})$), l'Évaluateur **DOIT** (**MUST**) ignorer la tentative de rétrogradation, maintenir au moins `floor_criticality` et positionner **`escalation_clamped = true`** dans `CapDecision` à des fins d'audit ;
   - Sinon, mettre à jour `effective_criticality = max(effective_criticality, override)`.

Par conséquent, toute évaluation CAP vérifie l'invariant :

$$\text{rank}(\texttt{effective\_criticality}) \ge \text{rank}(\texttt{floor\_criticality})$$
