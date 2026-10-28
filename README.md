# comprobante-cli

Emisión de **boletas de venta y facturas** peruanas (reglas SUNAT) desde la terminal.
Cero dependencias, cero red, cero telemetría. ~6 KB de JavaScript puro que corre en Node.

```text
─────────────────────────────────────────────────────────────────
BOLETA DE VENTA               B001-85250085
─────────────────────────────────────────────────────────────────
EMISOR: Tech Solutions SAC
RUC:    20601234567
DIR:    Av. La Tecnología 123, Lima
─────────────────────────────────────────────────────────────────
CLIENTE: CLIENTE VARIOS
FECHA:   2026-10-28 18:39
─────────────────────────────────────────────────────────────────
CANT  DESCRIPCIÓN          VALOR UNIT  PRECIO UNIT  TOTAL
1     Cable HDMI 2m             21.19        25.00       25.00
1     Mouse Ergonómico          72.03        85.00       85.00
─────────────────────────────────────────────────────────────────
SUBTOTAL:                       S/      93.22
TOTAL:                          S/     110.00
SON: 110.00 SOLES CON 00/100
─────────────────────────────────────────────────────────────────
```

## Filosofía

Este proyecto se rige por principios no negociables:

| Principio | Cómo se aplica aquí |
|---|---|
| **100% FOSS** | Código abierto, sin binarios opacos, sin servicios propietarios. Todo auditable línea por línea. |
| **Local-first** | Corre 100% offline. No hay API, no hay nube, no hay SDKs de pago. El único runtime requerido es Node ≥ 18. |
| **Privacy-by-design** | Minimización de datos: una boleta < S/ 700 **no almacena ni pide** datos del comprador (`CLIENTE VARIOS`). Los datos del cliente solo entran si la norma los exige (DNI/RUC). Cero logs, cero persistencia — el documento vive en memoria y muere en `console.log`. |
| **Zero-Trust / E2EE** | Nada se envía a ningún lado; no hay superficie de red que asegurar. Si algún día se agrega transporte, será cifrado extremo a extremo por defecto. |
| **Superficie de ataque mínima** | Cero dependencias — no existe `package.json`, no existe `node_modules`. Sin `fs`, sin red, sin `child_process`, sin `eval`: el código solo importa módulos locales y escribe en stdout. Input validado con reglas estrictas (regex de RUC, umbrales SUNAT) que fallan con `throw` antes de procesar nada. |
| **Optimización extrema** | Aritmética en **centavos enteros** (nunca floats para dinero), desglose unitario exacto del IGV, y decisiones deliberadas como *no* usar librerías de número-a-letras que añadirían 50 KB+ por un placeholder de 1 línea. |
| **Builds reproducibles** | Sin build step, sin transpilación, sin lockfiles inflados: el fuente ES Modules *es* el artefacto. `sha256sum *.js` es tu verificación de integridad. |
| **Pragmatismo sobre teoría** | Un conversor a letras "suficientemente robusto", correlativos aleatorios en vez de un contador persistente con estado compartido, validaciones que reflejan la norma real y no un modelo ideal. |

Y la regla final: **cero buzzwords sin sustento técnico**. Si algo dice "seguro", el código muestra por qué — y lo que no puede demostrar (como el correlativo aleatorio), está declarado como deuda, no maquillado.

### Deuda técnica honesta (anti-buzzword)

Para que la tabla anterior no sea humo, estas son las afirmaciones que el código **aún no** respalda:

- **E2EE / Zero-Trust**: hoy son triviales porque no hay transporte de datos; no existe canal que cifrar ni adversario interno. Eso no es una victoria criptográfica, es ausencia de problema. Se volverán relevantes recién al integrar con SUNAT vía red.
- **Privacidad real**: `EMISOR` tiene RUC y cuenta bancaria en claro en `constants.js`. Aceptable para un demo local; inaceptable si este repo se publica con datos reales — usa un `.env` ignorado por git o genera constantes desde un template.
- **Integridad del documento**: no hay hash ni firma; `Math.random()` para el correlativo es *deliberadamente* no reproducible (cada corrida emite otro número). La reproducibilidad aquí aplica al build, no a la salida.

## Arquitectura

Módulos ESM pequeños, cada uno con una única responsabilidad:

```
constants.js   → Datos del emisor y tasa IGV (0.18). Edítalo con tu info real.
tax.js         → Cálculo de subtotal/IGV/total en centavos (sin error de punto flotante).
receipt.js     → Validación de reglas SUNAT + ensamblaje del documento.
store.js       → Fachada: decide 'factura' vs 'boleta' según tipo de cliente.
formatter.js   → Render ASCII del comprobante a stdout.
uso.js         → Demo ejecutable (3 escenarios reales).
```

Flujo: `uso.js → store.emitDocument() → receipt.createReceipt() → tax.calcTax() → formatter.printReceipt()`

### Reglas SUNAT implementadas

- **Boleta > S/ 700** → exige DNI/RUC del comprador (o `throw`).
- **Factura** → exige nombre, RUC de 11 dígitos (validado con `/^\d{11}$/`) y dirección fiscal.
- **Desglose IGV** → `valor = precio / 1.18`, redondeado en centavos; la factura muestra el IGV, la boleta no (precio ya incluye impuesto).
- **Serie** → `F001` (factura) / `B001` (boleta), formato correlativo de 8 dígitos.

## Uso

```bash
node uso.js
```

Como librería:

```js
import { emitDocument } from './store.js';
import { printReceipt } from './formatter.js';

const doc = emitDocument('empresa', [
  { name: 'Teclado Mecánico', priceCents: 35000, qty: 2, unidad: 'NIU' },
], {
  nombre: 'Innovación Digital EIRL',
  ruc: '20609876543',
  direccion: 'Calle Falsa 123, Miraflores',
});

printReceipt(doc);
```

Precios **siempre en centavos** (`priceCents`). Si pasas floats, te lo mereces.

## Hardening antes de producción

Esto es un núcleo limpio, no un sistema CPE (Comprobante Tributario Electrónico) completo. Antes de emitir documentos legales reales:

1. **Correlativo**: reemplaza `Math.random()` por un contador persistente y monotónico (SUNAT exige secuencialidad). Estado local, cifrado en reposo si corresponde.
2. **Firma**: integra el hash/CPE oficial de SUNAT (OS-SIN) sobre el XML generado. Aquí aún no hay generador XML — es el siguiente paso natural.
3. **Secretos**: nada de credenciales hardcodeadas; usa variables de entorno o un gestor de secretos local (pass, sops).
4. **Auditoría**: `npm audit` no existe porque no hay dependencias. Así debe seguir siendo. Ante cualquier feature nueva, pregúntate: *¿esto justifica su superficie de ataque?* Si no, no entra.

## Intereses declarados

Piratería, bypass y análisis de vulnerabilidades: este repo no facilita ninguna de las tres, pero tampoco finge inocencia ingenua — está escrito por y para gente que entiende cómo romper sistemas y por eso mismo construye ones difíciles de romper. Criptografía seria, minimización de datos y ausencia de red son las mejores respuestas defensivas a esas amenazas.

## Licencia

MIT — haz lo que quieras, audita siempre. *There is no trust, only verification.*
