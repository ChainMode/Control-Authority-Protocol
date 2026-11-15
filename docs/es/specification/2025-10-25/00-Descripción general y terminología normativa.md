---
title: "Capítulo 0: Descripción general y terminología normativa"
description: Alcance de CAP 1.0, palabras clave normativas según RFC 2119 y RFC 8174, terminología esencial y reglas de versión en dos segmentos
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Capítulo 0: Descripción general y terminología normativa

## 0.1 Misión y alcance del protocolo

**Control Authority Protocol (CAP)** es una compuerta de autorización y seguridad con denegación predeterminada (*default-deny*) situada entre un avatar digital (`Fay`, que abarca tanto avatares individuales `iFay` como avatares de puesto institucional `coFay`) y un **Host** habitado (un dispositivo terminal físico, un subsistema actuador o una aplicación cliente). CAP traduce la autoridad delegada aguas arriba en decisiones deterministas de admisión por operación, garantizando que los efectos físicos irreversibles y las mutaciones sensibles del sistema queden estrictamente acotados por pisos firmados de capacidades del controlador y por la voluntad explícita del **Human Prime**.

El alcance normativo de CAP 1.0 comprende:

1. El modelo de datos y de transmisión para las entradas de evaluación (`CapEvaluationRequest`) y los fallos deterministas (`CapDecision`);
2. La verificación criptográfica de firmas, la obtención de la criticidad base y el cálculo del piso de irreversibilidad sobre `DriverCapabilityManifest`;
3. La verificación de vigencia en línea y de pruebas criptográficas derivadas de sesión para la evidencia de mandato de `Faying-Protocol` (`MandateEvidence`);
4. La matriz tridimensional de admisión `FayingGrade × AccessMode × Criticality`;
5. La confirmación explícita del **Human Prime** vinculada al hash de parámetros (`HumanConfirmationProof`) en toda operación `high` o `critical`;
6. La preempción inmediata por toma de control de emergencia `G0` del **Human Prime** y las directivas no bloqueantes de estado seguro (`G0SafeStateDirective`).

**Fronteras explícitas fuera de alcance**: CAP 1.0 no define la emisión de identidades (véase `FayID`), el razonamiento cognitivo (véase `Ego`) ni la contabilidad de contribución social (la contabilidad no monetaria de **MeriToken** sobre **GMChain** se especifica en `Global-Merit-Chain`). Asimismo, **las transferencias financieras de fondos y liquidaciones de pago (`fund_transfer`) quedan estrictamente excluidas de CAP 1.0**; toda solicitud u operación marcada con `domain_category == "fund_transfer"` se rechaza sin excepción.

---

## 0.2 Declaración de palabras clave normativas según RFC 2119 y RFC 8174

Las palabras clave **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY** y **OPTIONAL**, junto con sus equivalentes normativos en español en mayúsculas, se interpretan conforme a BCP 14 (IETF RFC 2119 y RFC 8174) única y exclusivamente cuando aparecen en mayúsculas:

| Palabra clave BCP 14 | Equivalente normativo en español | Interpretación normativa |
|----------------------|----------------------------------|--------------------------|
| **MUST** / **SHALL** / **REQUIRED** | **DEBE** / **OBLIGATORIO** | Requisito absoluto de la especificación; su incumplimiento impide declarar conformidad con CAP 1.0 |
| **MUST NOT** / **SHALL NOT** | **NO DEBE** | Prohibición absoluta de la especificación; cualquier infracción constituye no conformidad y defecto de seguridad |
| **SHOULD** / **RECOMMENDED** | **DEBERÍA** / **RECOMENDADO** | Recomendación técnica firme; cualquier desviación exige justificación de seguridad documentada y análisis de riesgos |
| **SHOULD NOT** / **NOT RECOMMENDED** | **NO DEBERÍA** / **NO RECOMENDADO** | Desaconsejamiento técnico firme; toda excepción requiere evaluación expresa de seguridad |
| **MAY** / **OPTIONAL** | **PUEDE** / **OPCIONAL** | Capacidad verdaderamente opcional; los pares interoperables **NO DEBEN** (**MUST NOT**) presuponer su presencia ni su ausencia |

Cuando estas palabras aparecen en minúsculas conservan su sentido ordinario y carecen de fuerza normativa.

---

## 0.3 Terminología autoritativa

Todas las implementaciones, esquemas y documentos **DEBEN** (**MUST**) respetar las siguientes invariantes terminológicas:

- **Human Prime**: La persona física representada por un `iFay` que ostenta la responsabilidad última y la potestad incondicional de revocación y toma de control (identificador canónico ajustado a `^hid_[a-z2-7]{16,}$`). **Las implementaciones y la documentación NO DEBEN (**MUST NOT**) denominar «Host» a una persona humana.**
- **Fay (`iFay` / `coFay`)**: El avatar digital que solicita control sobre un recurso del Host.
- **Inhabit (`Habitar`)**: El proceso en tiempo de ejecución mediante el cual un `Fay` se inyecta en un Host de destino para operarlo bajo la gobernanza de CAP.
- **Host**: Estrictamente **el dispositivo terminal de hardware, el periférico actuador o la aplicación cliente de software** habitado y controlado por un `Fay` (nunca un ser humano).
- **Evaluador CAP (`CAP Evaluator`)**: El componente normativo de aplicación de políticas dentro de la frontera de confianza del Host que evalúa de forma determinista `CapEvaluationRequest → CapDecision`.

---

## 0.4 Tres ejes ortogonales de versión y disciplina de dos segmentos `"1.0"`

CAP separa el versionado en tres ejes ortogonales que **NO DEBEN** (**MUST NOT**) mezclarse en una sola cadena ni expresarse como identificador SemVer de tres segmentos:

1. **Versión de protocolo (`Protocol Version`)**: Único identificador de contrato de interoperabilidad transmitido por el cable, formado estrictamente por dos segmentos enteros no negativos `MAJOR.MINOR` **sin segmento `PATCH`**. Los encabezados de sobre expresan `"CAP/1.0"`, mientras que `CapEvaluationRequest.protocol_version` y `protocol.version` contienen exactamente la cadena de dos segmentos **`"1.0"`** (conforme al patrón `^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`).
   - **Incremento de `MAJOR`**: Reservado para cambios incompatibles en el cable o alteraciones de invariantes de seguridad *default-deny*; no se garantiza compatibilidad entre distintos `MAJOR`.
   - **Incremento de `MINOR`**: Reservado para campos opcionales retrocompatibles o extensiones aditivas de enumeraciones; las implementaciones de un `MINOR` superior dentro del mismo `MAJOR` **DEBEN** (**MUST**) mantener compatibilidad hacia atrás hasta `MAJOR.0` e ignorar campos opcionales desconocidos.
2. **Estado del documento (`Document Status`)**: Registrado únicamente en el metadato `status` del encabezado documental (`Draft`, `Final`, `Deprecated` u `Obsolete`, sensible a mayúsculas) y **NO DEBE** (**SHALL NOT**) aparecer en el cable ni en rutas de directorios.
3. **Edición editorial (`Editorial Edition`)**: Anclada mediante la fecha ISO 8601 `YYYY-MM-DD` (**`2025-10-25`** para la edición inicial congelada de CAP 1.0). Las ediciones editoriales introducen aclaraciones redaccionales no normativas sin modificar la semántica de transmisión y **NO DEBEN** (**SHALL NOT**) incluirse en las cargas útiles del protocolo.

Cuando un Evaluador CAP 1.0 recibe una solicitud cuyo `protocol_version` es distinto de `"1.0"` (por ejemplo, `"2.0"` o `"1.0.0"`), **DEBE** (**MUST**) rechazarla de inmediato con `decision = "DENY"`, `effective_criticality = "critical"`, `error_code = "E_PROTOCOL_VERSION_UNSUPPORTED"` y `diagnostic_code = 2098`, sin intentar degradación oportunista alguna.
