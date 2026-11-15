---
title: "Capítulo 2: Grados de autoridad y matriz de criticidad"
description: Modos de acceso a recursos en CAP 1.0, orden total de criticidad en cuatro niveles y matriz tridimensional FayingGrade x AccessMode x Criticality
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Capítulo 2: Grados de autoridad y matriz de criticidad

## 2.1 Modos no jerárquicos de acceso a recursos (`AccessMode`)

CAP 1.0 define cuatro valores ortogonales de `AccessMode` para las operaciones sobre recursos del Host. Los modos de acceso **no guardan relación jerárquica entre sí** (por ejemplo, contar con permiso `write` no otorga implícitamente `read` ni `configure`):

| Modo de acceso | Semántica de bloqueo concurrente | Definición normativa |
|----------------|----------------------------------|----------------------|
| `read` | Bloqueo compartido de lectura | Consulta telemetría, estado del dispositivo o instantáneas de configuración sin mutar el estado del Host ni condiciones físicas externas |
| `write` | Bloqueo mutuo exclusivo | Modifica el almacenamiento del Host, escribe registros de control o graba imágenes de firmware |
| `execute` | Bloqueo mutuo exclusivo | Acciona mecanismos físicos, transmite comunicaciones externas o invoca procesos en el Host |
| `configure` | Bloqueo mutuo exclusivo | Altera políticas de seguridad del Host, ganancias de lazos de control (como parámetros PID de un controlador de vuelo) o límites de permisos |

En el control de concurrencia de sesiones en tiempo de ejecución se admiten múltiples operaciones `read` simultáneas sobre un mismo recurso del Host, mientras que toda operación `write`, `execute` o `configure` **DEBE** (**MUST**) adquirir un bloqueo exclusivo incompatible con cualquier otra operación sobre dicho recurso.

---

## 2.2 Orden total de la criticidad de operaciones (`Criticality`)

CAP 1.0 clasifica cada operación del Host según un orden total estricto de cuatro niveles:

$$\texttt{routine} (0) < \texttt{sensitive} (1) < \texttt{high} (2) < \texttt{critical} (3)$$

- **`routine`**: Operaciones de lectura o acciones idempotentes acotadas y totalmente reversibles, sin fuga de privacidad ni riesgo físico (por ejemplo, leer la temperatura ambiente o la telemetría de vuelo).
- **`sensitive`**: Ajustes controlados de parámetros, lecturas de estado sensible o mutaciones respaldadas por compensación automática acotada (por ejemplo, ajustar ganancias PID de control).
- **`high`**: Operaciones con consecuencias irreversibles en el mundo físico, accionamiento de cierres mecánicos o emisiones externas (por ejemplo, desbloquear el pestillo físico de una bodega de carga); requieren vinculación Modelo A+B y confirmación explícita por operación del **Human Prime**.
- **`critical`**: Operaciones con riesgo de destrucción irrecuperable de datos, inutilización permanente de hardware o daño físico grave (por ejemplo, borrado seguro criptográfico de almacenamiento o grabación de firmware ESC de bajo nivel), restringidas exclusivamente al grado `G1`.

---

## 2.3 Grados de autonomía y presencia de Faying (`FayingGrade`)

El Evaluador CAP consume los cinco grados de sesión definidos en `Faying-Protocol` (véase `Faying-Protocol`):

- **`G0`**: Estado de toma de control directa de emergencia por el **Human Prime** (máxima prioridad de preempción; nunca constituye un estado de ejecución autónoma de un `Fay`);
- **`G1`**: Vinculación fuerte de presencia en tiempo real del **Human Prime** (máxima fortaleza de delegación; **único** grado elegible para operaciones `critical`);
- **`G2`**: Presencia supervisada de acompañamiento del **Human Prime**;
- **`G3`**: Autonomía delegada estándar;
- **`G4`**: Autonomía restringida en segundo plano (mínima fortaleza de delegación).

Para `CapGrant.min_grade` (`G1`–`G4`), la fortaleza de autorización obedece al orden estricto:

$$\text{Strength}(\texttt{G1}) = 4 > \text{Strength}(\texttt{G2}) = 3 > \text{Strength}(\texttt{G3}) = 2 > \text{Strength}(\texttt{G4}) = 1$$

Si $\text{Strength}(\texttt{session\_grade}) < \text{Strength}(\texttt{grant.min\_grade})$, el Evaluador **DEBE** (**MUST**) rechazar la solicitud con `E_GRADE_INSUFFICIENT` (`2002`).

---

## 2.4 Matriz tridimensional de autorización (`FayingGrade × AccessMode × Criticality`)

Cuando `session_grade` pertenece a `G1`–`G4` y cumple `grant.min_grade`, el Evaluador CAP **DEBE** (**MUST**) aplicar la siguiente matriz conservadora de admisión sobre `(session_grade, requested_mode, effective_criticality)`:

| Criticidad efectiva (`effective_criticality`) | `G1` (Presencia en tiempo real) | `G2` (Presencia supervisada) | `G3` (Autonomía estándar) | `G4` (Segundo plano restringido) |
|-----------------------------------------------|---------------------------------|------------------------------|---------------------------|----------------------------------|
| **`critical`** | Se permiten `read` / `write` / `execute` / `configure` (**requiere compuerta del Capítulo 4**) | **`DENY`** | **`DENY`** | **`DENY`** |
| **`high`** | Se permiten todos los modos concedidos (**requiere compuerta del Capítulo 4**) | Se permiten todos los modos concedidos (**requiere compuerta del Capítulo 4**) | **`DENY`** | **`DENY`** |
| **`sensitive`** | Se permiten todos los modos concedidos | Se permiten todos los modos concedidos | Solo `read` / `write` / `execute` (**`configure` prohibido**) | **`DENY`** |
| **`routine`** | Se permiten todos los modos concedidos | Se permiten todos los modos concedidos | Se permiten todos los modos concedidos | Solo `read` / `execute` (**`write` y `configure` prohibidos**) |

### Invariantes esenciales de seguridad de la matriz

1. **Exclusividad de `G1` para `critical`**: Toda operación `critical` intentada bajo `G2`, `G3` o `G4` **DEBE** (**MUST**) denegarse con `E_GRADE_INSUFFICIENT` (`2002`), incluso cuando se adjunte una prueba `human_confirmation` válida.
2. **Aislamiento de configuración en `G3`**: Solicitar el modo `configure` sobre una operación `sensitive` bajo `G3` **DEBE** (**MUST**) denegarse con `E_GRADE_INSUFFICIENT` (`2002`).
3. **Prohibición de mutación en `G4`**: Bajo `G4` solo se admiten `read` y `execute` en operaciones `routine`; cualquier solicitud `write`, `configure` o de criticidad superior a `routine` **DEBE** (**MUST**) denegarse con `E_GRADE_INSUFFICIENT` (`2002`).
