---
title: "Capítulo 3: Manifiesto de capacidades del controlador y piso de irreversibilidad"
description: Verificación de firma Ed25519 del manifiesto en CAP 1.0, denegación de operaciones desconocidas, piso de irreversibilidad y escalamiento monótono de criticidad
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Capítulo 3: Manifiesto de capacidades del controlador y piso de irreversibilidad

## 3.1 Verificación del `DriverCapabilityManifest` firmado

La criticidad base de una operación **NO DEBE** (**SHALL NOT**) ser determinada por el `Fay` invocador ni por metadatos externos sin verificar; **DEBE** (**MUST**) provenir de un `DriverCapabilityManifest` en el lado del Host firmado criptográficamente por una autoridad de confianza. Cada manifiesto incluye:

- `manifest_id`, `driver_id`, `version`, `issued_at`: Identificador único del manifiesto, identificador del controlador, cadena de versión y marca temporal de emisión;
- `signer_key_id`: Identificador de clave que referencia una entrada en el `TrustAnchorMap` local del Host;
- `resources`: Arreglo no vacío de descriptores `ResourceCapabilityDescriptor` que declaran `resource_id`, `safe_states` opcionales y una lista no vacía `operations` (`OperationDescriptor`);
- `signature_ed25519`: Firma Ed25519 de 64 bytes (128 caracteres hexadecimales) conforme a RFC 8032.

### Procedimiento canónico de verificación de firma

El Evaluador CAP **DEBE** (**MUST**) verificar la autenticidad del manifiesto siguiendo estos pasos:

1. Confirmar que `signature_ed25519` es una cadena hexadecimal válida de 128 caracteres y buscar `signer_key_id` en `trust_anchors`. Si falta el ancla de confianza, `algorithm != "Ed25519"` o `public_key_raw_hex` no es una cadena hexadecimal válida de 64 caracteres (clave pública Ed25519 sin formato de 32 bytes), la verificación falla de inmediato.
2. Construir el objeto de manifiesto sin firma omitiendo `signature_ed25519` y serializarlo en bytes UTF-8 mediante **JSON canónico determinista compatible con RFC 8785** (claves de objeto ordenadas lexicográficamente, omisión de propiedades opcionales indefinidas y ausencia total de espacios superfluos).
3. Verificar la firma Ed25519 de 64 bytes sobre dichos bytes UTF-8 utilizando la clave pública del ancla de confianza.

Si la verificación falla, el Evaluador **DEBE** (**MUST**) devolver de inmediato `decision = "DENY"`, `effective_criticality = "critical"`, `error_code = "E_UNTRUSTED_MANIFEST"` y `diagnostic_code = 2005`.

---

## 3.2 Denegación predeterminada `critical` ante recursos y operaciones desconocidos

Dentro de un `DriverCapabilityManifest` cuya firma ha sido verificada:

- Si ningún `ResourceCapabilityDescriptor` coincide con `req.resource_id`, o ningún `OperationDescriptor` dentro de ese recurso coincide con `req.operation_id`, el Evaluador CAP **DEBE** (**MUST**) clasificar `effective_criticality` como `"critical"` y devolver de inmediato `decision = "DENY"`, `error_code = "E_UNKNOWN_OPERATION"` y `diagnostic_code = 2004`.
- Las implementaciones **NO DEBEN** (**SHALL NOT**) ofrecer admisión comodín ni asignar por defecto `routine` a operaciones no declaradas.

---

## 3.3 Piso de irreversibilidad de consecuencias (`ConsequenceIrreversibility`)

Para evitar que controladores mal configurados subclasifiquen acciones física o digitalmente destructivas, todo `OperationDescriptor` **DEBE** (**MUST**) declarar tanto `criticality` como `consequence_irreversibility`. El Evaluador **DEBE** (**MUST**) calcular primero `floor_criticality` conforme a la siguiente tabla:

| Valor de `consequence_irreversibility` | Operación representativa en el Host | Regla obligatoria de piso (`floor_criticality`) |
|----------------------------------------|-------------------------------------|-------------------------------------------------|
| `reversible` | Lectura de telemetría de vuelo o sensores de temperatura | Conserva `operation.criticality` |
| `bounded_compensation` | Ajuste de ganancias PID con reversión automática acotada | Conserva `operation.criticality` |
| `irreversible_consequence` | Apertura de un pestillo físico de carga o emisión de balizas externas | $\max(\texttt{operation.criticality}, \texttt{high})$ — el piso es al menos **`high`** |
| `irreversible_data_or_hardware` | Borrado seguro irrecuperable de almacenamiento o grabación de firmware ESC con riesgo de inutilización | **Fijado en `critical`** con independencia del valor declarado en `operation.criticality` |

Por ejemplo, aunque `unlock_cargo_latch` declare una criticidad base `criticality = "sensitive"`, declarar `consequence_irreversibility = "irreversible_consequence"` eleva automáticamente `floor_criticality` a `high`; del mismo modo, `flash_esc_firmware` con `irreversible_data_or_hardware` queda fijado en `critical`.

---

## 3.4 Escalamiento monótono de criticidad y acotamiento de rebajas

Por encima de `floor_criticality`, CAP permite que las concesiones aguas arriba (`req.grant.criticality_override`) y el invocador (`req.caller_criticality_override`) endurezcan la política de manera monótona, prohibiendo toda rebaja:

1. Inicializar `effective_criticality = floor_criticality` y `escalation_clamped = false`.
2. Inspeccionar `req.grant.criticality_override` y `req.caller_criticality_override` (cuando estén presentes):
   - Si una sobreescritura es estrictamente inferior a `floor_criticality` ($\text{rank}(\text{override}) < \text{rank}(\text{floor\_criticality})$), el Evaluador **DEBE** (**MUST**) ignorar el intento de rebaja, conservar al menos `floor_criticality` y establecer **`escalation_clamped = true`** en `CapDecision` para trazabilidad de auditoría;
   - En caso contrario, actualizar `effective_criticality = max(effective_criticality, override)`.

En consecuencia, toda evaluación CAP cumple la invariante:

$$\text{rank}(\texttt{effective\_criticality}) \ge \text{rank}(\texttt{floor\_criticality})$$
