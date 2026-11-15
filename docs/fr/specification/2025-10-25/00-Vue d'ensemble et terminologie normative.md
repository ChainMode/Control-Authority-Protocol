---
title: "Chapitre 0 : Vue d'ensemble et terminologie normative"
description: Périmètre de CAP 1.0, conventions de mots-clés normatifs selon RFC 2119 et RFC 8174, terminologie fondamentale et règles de version à deux segments
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Chapitre 0 : Vue d'ensemble et terminologie normative

## 0.1 Mission et périmètre du protocole

Le **Control Authority Protocol (CAP)** est une porte d'autorisation et de sûreté à refus par défaut (*default-deny*) placée entre un avatar numérique (`Fay`, regroupant les avatars individuels `iFay` et les avatars de poste institutionnel `coFay`) et un **Host** habité (un terminal matériel, un sous-système d'actionneurs ou une application logicielle cliente). CAP traduit l'autorité déléguée en amont en décisions d'admission déterministes par opération, garantissant que les effets physiques irréversibles et les modifications sensibles du système restent strictement bornés par des planchers signés de capacités de pilote et par l'intention explicite du **Human Prime**.

Le périmètre normatif de CAP 1.0 couvre :

1. Le modèle de trame et de données pour les entrées d'évaluation (`CapEvaluationRequest`) et les décisions déterministes (`CapDecision`) ;
2. La vérification cryptographique de signature, le calcul de la criticité de base et la détermination du plancher d'irréversibilité sur `DriverCapabilityManifest` ;
3. La vérification de la fraîcheur en ligne et des preuves cryptographiques dérivées de session pour les justificatifs de mandat `Faying-Protocol` (`MandateEvidence`) ;
4. La matrice tridimensionnelle d'admission `FayingGrade × AccessMode × Criticality` ;
5. La confirmation explicite du **Human Prime** liée au condensat des paramètres (`HumanConfirmationProof`) pour toutes les opérations `high` et `critical` ;
6. La préemption immédiate de reprise en main d'urgence `G0` par le **Human Prime** et les directives non bloquantes d'état sûr (`G0SafeStateDirective`).

**Exclusions explicites hors périmètre** : CAP 1.0 ne régit ni l'émission d'identités (voir `FayID`), ni le raisonnement cognitif (voir `Ego`), ni la comptabilité de contribution sociale (la comptabilisation non monétaire de **MeriToken** sur **GMChain** est définie dans `Global-Merit-Chain`). En outre, **les transferts financiers de fonds et règlements de paiement (`fund_transfer`) sont strictement exclus de CAP 1.0** : toute requête ou opération portant `domain_category == "fund_transfer"` est rejetée sans condition.

---

## 0.2 Déclaration des mots-clés normatifs selon RFC 2119 et RFC 8174

Les mots-clés **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY** et **OPTIONAL**, ainsi que leurs équivalents normatifs français en capitales, doivent être interprétés conformément au BCP 14 (IETF RFC 2119 et RFC 8174) uniquement lorsqu'ils apparaissent entièrement en majuscules :

| Mot-clé BCP 14 | Équivalent normatif français | Interprétation normative |
|----------------|------------------------------|--------------------------|
| **MUST** / **SHALL** / **REQUIRED** | **DOIT** / **REQUIS** | Exigence absolue de la spécification ; tout écart interdit de revendiquer la conformité à CAP 1.0 |
| **MUST NOT** / **SHALL NOT** | **NE DOIT PAS** | Interdiction absolue de la spécification ; toute violation constitue une non-conformité et un défaut de sûreté |
| **SHOULD** / **RECOMMENDED** | **DEVRAIT** / **RECOMMANDÉ** | Recommandation technique forte ; toute dérogation exige une justification de sécurité documentée et une analyse des risques |
| **SHOULD NOT** / **NOT RECOMMENDED** | **NE DEVRAIT PAS** / **DÉCONSEILLÉ** | Déconseil technique fort ; toute exception requiert une évaluation explicite de sécurité |
| **MAY** / **OPTIONAL** | **PEUT** / **OPTIONNEL** | Capacité réellement facultative ; les pairs interopérables **NE DOIVENT PAS** (**MUST NOT**) présumer sa présence ou son absence |

Employés en minuscules, ces termes conservent leur sens courant et n'emportent aucune portée normative.

---

## 0.3 Terminologie de référence

Toutes les implémentations, tous les schémas et toute la documentation **DOIVENT** (**MUST**) respecter les invariants terminologiques suivants :

- **Human Prime** : La personne physique incarnée numériquement par un `iFay`, détentrice de la responsabilité ultime et du droit inconditionnel de reprise en main (identifiant canonique conforme au motif `^hid_[a-z2-7]{16,}$`). **Les implémentations et la documentation NE DOIVENT PAS (**MUST NOT**) désigner un être humain par le terme « Host ».**
- **Fay (`iFay` / `coFay`)** : L'avatar numérique sollicitant le contrôle d'une ressource du Host.
- **Inhabit (`Habiter`)** : Le mécanisme d'exécution consistant à injecter un `Fay` dans un Host cible afin qu'il puisse être piloté sous gouvernance CAP.
- **Host** : Exclusivement **le terminal matériel, le périphérique actionneur ou l'application logicielle cliente** habité et contrôlé par un `Fay` (jamais une personne humaine).
- **Évaluateur CAP (`CAP Evaluator`)** : Le composant normatif d'application des politiques situé dans la frontière de confiance du Host qui évalue de manière déterministe `CapEvaluationRequest → CapDecision`.

---

## 0.4 Trois axes orthogonaux de version et discipline à deux segments `"1.0"`

CAP distingue trois axes orthogonaux de versionnement qui **NE DOIVENT PAS** (**MUST NOT**) être confondus dans une chaîne unique ni exprimés sous la forme d'un identifiant SemVer à trois segments :

1. **Version de protocole (`Protocol Version`)** : Seul identifiant contractuel d'interopérabilité transmis sur le fil, composé strictement de deux segments entiers non négatifs `MAJOR.MINOR` **sans segment `PATCH`**. Les en-têtes d'enveloppe indiquent `"CAP/1.0"`, tandis que `CapEvaluationRequest.protocol_version` et `protocol.version` portent exactement la chaîne à deux segments **`"1.0"`** (conforme à `^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`).
   - **Incrément `MAJOR`** : Réservé aux changements incompatibles sur le fil ou aux modifications des invariants de sûreté *default-deny* ; aucune compatibilité inter-`MAJOR` n'est garantie.
   - **Incrément `MINOR`** : Réservé aux champs optionnels rétrocompatibles ou aux extensions additives d'énumérations ; toute implémentation d'un `MINOR` supérieur au sein du même `MAJOR` **DOIT** (**MUST**) demeurer rétrocompatible jusqu'à `MAJOR.0` et ignorer les champs optionnels inconnus.
2. **Statut du document (`Document Status`)** : Consigné exclusivement dans le champ `status` de l'en-tête documentaire (`Draft`, `Final`, `Deprecated` ou `Obsolete`, sensible à la casse) ; il **NE DOIT PAS** (**SHALL NOT**) figurer sur le fil ni dans les chemins de répertoires.
3. **Édition éditoriale (`Editorial Edition`)** : Ancrée par la date de publication ISO 8601 `YYYY-MM-DD` (**`2025-10-25`** pour la première édition figée de CAP 1.0). Les éditions éditoriales apportent uniquement des clarifications rédactionnelles non normatives sans modifier la sémantique sur le fil et **NE DOIVENT PAS** (**SHALL NOT**) entrer dans les charges utiles du protocole.

Lorsqu'un Évaluateur CAP 1.0 reçoit une requête dont `protocol_version` diffère de `"1.0"` (par exemple `"2.0"` ou `"1.0.0"`), il **DOIT** (**MUST**) la rejeter immédiatement avec `decision = "DENY"`, `effective_criticality = "critical"`, `error_code = "E_PROTOCOL_VERSION_UNSUPPORTED"` et `diagnostic_code = 2098`, sans tenter de repli opportuniste.
