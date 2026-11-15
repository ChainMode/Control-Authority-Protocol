---
title: "Chapitre 2 : Grades d'autorité et matrice de criticité"
description: Modes d'accès aux ressources dans CAP 1.0, ordre total de criticité à quatre niveaux et matrice tridimensionnelle FayingGrade x AccessMode x Criticality
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Chapitre 2 : Grades d'autorité et matrice de criticité

## 2.1 Modes d'accès aux ressources non hiérarchiques (`AccessMode`)

CAP 1.0 définit quatre valeurs orthogonales d'`AccessMode` pour les opérations portant sur les ressources du Host. Ces modes d'accès sont **non hiérarchiques** (par exemple, détenir l'autorisation `write` ne confère implicitement ni `read` ni `configure`) :

| Mode d'accès | Sémantique de verrouillage concurrent | Définition normative |
|--------------|---------------------------------------|----------------------|
| `read` | Verrou de lecture partagé | Consulte la télémétrie, l'état de l'équipement ou des instantanés de configuration sans modifier l'état du Host ni les conditions physiques externes |
| `write` | Verrou d'exclusion mutuelle | Modifie le stockage du Host, écrit dans des registres de commande ou inscrit des images de micrologiciel |
| `execute` | Verrou d'exclusion mutuelle | Actionne des mécanismes physiques, émet des communications externes ou invoque des processus sur le Host |
| `configure` | Verrou d'exclusion mutuelle | Modifie les politiques de sécurité du Host, les gains de boucles d'asservissement (tels que les paramètres PID d'un contrôleur de vol) ou les périmètres de permissions |

Lors du contrôle de concurrence en cours de session, plusieurs opérations `read` simultanées sur une même ressource du Host sont permises, tandis que toute opération `write`, `execute` ou `configure` **DOIT** (**MUST**) acquérir un verrou exclusif incompatible avec toute autre opération sur cette ressource.

---

## 2.2 Ordre total de criticité des opérations (`Criticality`)

CAP 1.0 classe chaque opération du Host selon un ordre total strict à quatre niveaux :

$$\texttt{routine} (0) < \texttt{sensitive} (1) < \texttt{high} (2) < \texttt{critical} (3)$$

- **`routine`** : Opérations de lecture ou actions idempotentes bornées et entièrement réversibles, sans divulgation de données personnelles ni risque physique (par exemple, lecture de la température ambiante ou de la télémétrie de vol).
- **`sensitive`** : Réglages encadrés de paramètres, lectures d'états sensibles ou modifications couvertes par une compensation automatique bornée (par exemple, ajustement des gains PID d'un régulateur).
- **`high`** : Opérations produisant des conséquences irréversibles dans le monde physique, actionnant un verrou mécanique ou émettant un signal externe (par exemple, déverrouillage d'une trappe de soute physique) ; requièrent la liaison modèle A+B et une confirmation par opération du **Human Prime**.
- **`critical`** : Opérations comportant un risque de destruction irrémédiable de données, de mise hors service matérielle permanente ou de dommage physique grave (par exemple, effacement cryptographique sécurisé ou flashage bas niveau d'un micrologiciel ESC), strictement réservées au grade `G1`.

---

## 2.3 Grades d'autonomie et de présence Faying (`FayingGrade`)

L'Évaluateur CAP consomme les cinq grades de session définis par `Faying-Protocol` (voir `Faying-Protocol`) :

- **`G0`** : État de reprise en main directe d'urgence par le **Human Prime** (priorité de préemption maximale ; ne constitue jamais un état d'exécution autonome d'un `Fay`) ;
- **`G1`** : Liaison forte de présence en temps réel du **Human Prime** (force de délégation maximale ; **seul** grade éligible aux opérations `critical`) ;
- **`G2`** : Présence supervisée d'accompagnement du **Human Prime** ;
- **`G3`** : Autonomie déléguée standard ;
- **`G4`** : Autonomie restreinte en arrière-plan (force de délégation minimale).

Pour `CapGrant.min_grade` (`G1` à `G4`), la force d'autorisation suit l'ordre strict :

$$\text{Strength}(\texttt{G1}) = 4 > \text{Strength}(\texttt{G2}) = 3 > \text{Strength}(\texttt{G3}) = 2 > \text{Strength}(\texttt{G4}) = 1$$

Si $\text{Strength}(\texttt{session\_grade}) < \text{Strength}(\texttt{grant.min\_grade})$, l'Évaluateur **DOIT** (**MUST**) rejeter la requête avec `E_GRADE_INSUFFICIENT` (`2002`).

---

## 2.4 Matrice tridimensionnelle d'autorisation (`FayingGrade × AccessMode × Criticality`)

Lorsque `session_grade` appartient à `G1`–`G4` et satisfait `grant.min_grade`, l'Évaluateur CAP **DOIT** (**MUST**) appliquer la matrice conservatrice d'admission suivante au triplet `(session_grade, requested_mode, effective_criticality)` :

| Criticité effective (`effective_criticality`) | `G1` (Présence temps réel) | `G2` (Présence supervisée) | `G3` (Autonomie standard) | `G4` (Arrière-plan restreint) |
|-----------------------------------------------|----------------------------|----------------------------|---------------------------|-------------------------------|
| **`critical`** | `read` / `write` / `execute` / `configure` autorisés (**requiert la porte du chapitre 4**) | **`DENY`** | **`DENY`** | **`DENY`** |
| **`high`** | Tous les modes accordés sont autorisés (**requiert la porte du chapitre 4**) | Tous les modes accordés sont autorisés (**requiert la porte du chapitre 4**) | **`DENY`** | **`DENY`** |
| **`sensitive`** | Tous les modes accordés sont autorisés | Tous les modes accordés sont autorisés | `read` / `write` / `execute` uniquement (**`configure` interdit**) | **`DENY`** |
| **`routine`** | Tous les modes accordés sont autorisés | Tous les modes accordés sont autorisés | Tous les modes accordés sont autorisés | `read` / `execute` uniquement (**`write` et `configure` interdits**) |

### Invariants fondamentaux de sûreté de la matrice

1. **Exclusivité de `G1` pour `critical`** : Toute opération `critical` tentée sous `G2`, `G3` ou `G4` **DOIT** (**MUST**) être refusée avec `E_GRADE_INSUFFICIENT` (`2002`), même lorsqu'une preuve `human_confirmation` valide est jointe.
2. **Isolation de configuration sous `G3`** : Demander le mode `configure` sur une opération `sensitive` sous `G3` **DOIT** (**MUST**) être refusé avec `E_GRADE_INSUFFICIENT` (`2002`).
3. **Interdiction de mutation sous `G4`** : Sous `G4`, seuls `read` et `execute` sur des opérations `routine` sont permis ; toute demande `write`, `configure` ou de criticité supérieure à `routine` **DOIT** (**MUST**) être refusée avec `E_GRADE_INSUFFICIENT` (`2002`).
