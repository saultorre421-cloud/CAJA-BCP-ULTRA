# Mejoras Offline: Exportador .XLSX Binario Nativo, Borrado Contextual en Hojas y Limpieza de Ajustes

Esta actualización incorpora un empaquetador OpenXML (`.xlsx`) binario 100% nativo en cliente con integración de Web Share API para Android, reestructura la barra superior de la vista de Hojas Locales con un control de borrado contextual instantáneo y simplifica el modal de configuración.

## User Review & Critical Decisions

> [!IMPORTANT]
> Se han confirmado las decisiones de diseño e interacción para el control de borrado y el modal de ajustes:

- **Decisión Confirmada 1 (Selector Rápido en Hoja 1)**: Al pulsar `🗑️ BORRAR` estando en la Hoja 1 (Movimientos), se desplegará un **menú desplegable compacto (popover)** justo debajo del botón con dos acciones directas: *Borrar Solo Movimientos* (conservando el Efectivo Inicial) y *Borrar Efectivo Inicial* (conservando los movimientos). Estando en la Hoja 2 (Cierre General), el botón ejecutará la limpieza directa en `0.00 ms` con confirmación visual inmediata.
- **Decisión Confirmada 2 (Limpieza del Modal de Configuración)**: Se removerán los botones de borrado de hojas de **ambas pestañas** del modal de ajustes (*Config. Caja* y *Config. Cierre*), centralizando toda la gestión de limpieza de registros directamente en la pantalla de Hojas BCP.
- **Empaquetado OpenXML Nativo sin Dependencias Externas**: El archivo `BCP_Caja_y_Cierre.xlsx` se construirá en memoria mediante un empaquetador ZIP propio en TypeScript (cálculo CRC-32 IEEE 802.3, cabeceras Local File Header, Central Directory y End of Central Directory) con estructura OpenXML completa (`[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/_rels/workbook.xml.rels`, `xl/styles.xml`, `xl/worksheets/sheet1.xml` y `xl/worksheets/sheet2.xml`), garantizando compatibilidad nativa en Microsoft Excel Mobile y Google Sheets sin alertas de archivo dañado ni necesidad de conexión a internet.

---

## 1. Overview & Core Concept

- **Qué Hace**: Permite exportar y compartir por WhatsApp, Excel o Google Sheets un libro `.xlsx` binario real desde cualquier dispositivo Android sin conexión a internet, además de ofrecer limpieza contextual ultrarrápida desde la vista de Hojas BCP.
- **Audiencia Objetivo**: Cajeros y operadores de Agentes BCP que trabajan desde smartphones Android y requieren velocidad de respuesta de `0.00 ms`, legibilidad de alto contraste y exportación contable inmediata al cierre del turno.
- **Valor Principal**: Elimina las advertencias de formato incompatible en aplicaciones móviles de hojas de cálculo al reemplazar el antiguo XML plano (`.xls`) por un contenedor ZIP OpenXML (`.xlsx`) estándar, y reduce los pasos necesarios para depurar movimientos o reiniciar el cierre.

---

## 2. User Experience & Visual Design

- **Flujos de Usuario Clave**:
  1. **Exportación y Compartido Nativo (`.xlsx`)**:
     - El operador toca el botón `📥 EXCEL` en la barra superior de `HOJAS BCP`.
     - El sistema construye en milisegundos el archivo binario `BCP_Caja_y_Cierre.xlsx` con dos hojas formateadas (*Hoja 1 - Movimientos* y *Hoja 2 - Cierre General*).
     - Si el navegador móvil soporta `navigator.canShare` con archivos, se abre la bandeja nativa de Android (compartir por WhatsApp, abrir directo en Excel/Google Sheets); en caso contrario (o en escritorio), se inicia la descarga directa del archivo `.xlsx`.
  2. **Borrado Contextual en `HOJAS BCP`**:
     - La barra superior muestra a la izquierda `← Volver`, al centro el título compacto `HOJAS BCP`, y a la derecha los botones `🗑️ BORRAR` y `📥 EXCEL`.
     - **En Hoja 1 (Movimientos)**: Al tocar `🗑️ BORRAR`, se despliega un menú flotante compacto bajo el botón con las opciones:
       - `🧹 Borrar Solo Movimientos` *(Conserva Efectivo Inicial)*
       - `💰 Borrar Efectivo Inicial` *(Conserva Movimientos)*
       Al elegir cualquiera, se ejecuta en `0.00 ms`, el botón muestra confirmación (`✅ ¡LIMPIO!`) y el menú se cierra automáticamente.
     - **En Hoja 2 (Cierre General)**: Al tocar `🗑️ BORRAR`, se limpia inmediatamente el Cierre General guardado sin afectar la Hoja 1, mostrando el estado `✅ ¡LIMPIO!` en el botón durante `600 ms`.
  3. **Menú de Configuración Simplificado (`⚙️`)**:
     - En *Config. Caja*: Muestra exclusivamente el interruptor iOS para activar/desactivar el guardado automático de movimientos y la nota informativa de latencia cero.
     - En *Config. Cierre*: Muestra únicamente el editor de Capital Base / Remesa Asignada y los selectores de fotografías personalizadas para billetes y monedas.

- **Identidad Visual y Tema**:
  - *Estética*: Utilitaria bancaria de alta precisión, manteniendo intacta la paleta oficial BCP (`--bcp-blue: #002A8D`, `--bcp-orange: #FF6A00`, verde éxito `#16a34a` y rojo alerta `#dc2626`).
  - *Tipografía y Jerarquía*: Numerales tabulares (`font-variant-numeric: tabular-nums`) en todas las tablas y tarjetas de saldo; controles de una sola línea (`whitespace-nowrap`) en la cabecera para evitar desbordamientos en pantallas de `360px–430px`.
  - *Blindaje Táctil*: Se conserva el bloqueo de scroll vertical global en operación, el ocultamiento total del teclado numérico dentro de `HOJAS BCP` y la respuesta háptica (`navigator.vibrate`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Generador ZIP + OpenXML Nativo en Memoria vs. Librerías Pesadas**
  - *Enfoque Elegido*: Implementar un motor ligero de empaquetado ZIP sin compresión (`STORE`, método `0`) con tabla CRC-32 precalculada y plantillas XML estrictas del estándar ECMA-376 OpenXML (`xl/styles.xml` con formatos numéricos `#,##0.00` y colores contables negro/rojo).
  - *Por Qué*: Funciona 100% offline, pesa menos de 4 KB, se ejecuta de forma síncrona en pocos milisegundos y produce un binario `.xlsx` puro que tanto Excel para Android como Google Sheets abren sin ningún aviso de seguridad o corrupción.
- **Decisión 2: Integración de Web Share API con Fallback Automático**
  - *Enfoque Elegido*: Construir un objeto `File` con MIME type oficial `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. Si `navigator.canShare && navigator.canShare({ files: [file] })` es verdadero, invocar `await navigator.share({ files: [file], title: 'BCP Caja y Cierre' })`; si el usuario cancela el diálogo no se dispara error, y si el navegador no soporta compartir archivos, se ejecuta el fallback de descarga directa por `URL.createObjectURL`.
  - *Por Qué*: En dispositivos Android permite enviar el reporte por WhatsApp o abrirlo en Excel con un solo toque, manteniendo compatibilidad total en navegadores de escritorio.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        App State & LocalStorage                         │
│   • hoja1Data (Efectivo Inicial + Movimientos[])                        │
│   • hoja2Data (Cierre General archivado o cálculo en vivo)              │
│   • capitalBase, guardarMovimientosActivo                               │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
                    ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│            HojasLocalesView           │ │         AjustesModal          │
│ ┌───────────────────────────────────┐ │ │ • Tab Config. Caja:           │
│ │ Top Bar: [← Volver]  HOJAS BCP    │ │ │   - Switch Guardar Movs       │
│ │          [🗑️ BORRAR] [📥 EXCEL]   │ │ │ • Tab Config. Cierre:         │
│ └─────────┬─────────────────┬───────┘ │ │   - Editor Capital Base       │
│           │                 │         │ │   - Fotos Billetes y Monedas  │
│  (Contextual Delete)        │         │ │   (Sin botones de borrado)    │
│           ▼                 ▼         │ └───────────────────────────────┘
│ ┌───────────────────┐ ┌─────────────┐ │
│ │ Hoja 1: Popover   │ │ Generador   │ │
│ │ • Solo Movimientos│ │ Binario     │ │
│ │ • Efectivo Inicial│ │ OpenXML ZIP │ │
│ │                   │ │ (.xlsx)     │ │
│ │ Hoja 2: Directo   │ │ + CRC32     │ │
│ │ • Limpia Cierre   │ │ + Web Share │ │
│ └───────────────────┘ └─────────────┘ │
└───────────────────────────────────────┘
```

### Data Model & OpenXML Structure
- **Estructura interna del archivo `BCP_Caja_y_Cierre.xlsx` (ZIP)**:
  - `[Content_Types].xml`: Define los tipos MIME de relaciones, workbook, hojas y estilos.
  - `_rels/.rels`: Relación raíz hacia `xl/workbook.xml`.
  - `xl/workbook.xml` y `xl/_rels/workbook.xml.rels`: Declara las hojas `Hoja 1 - Movimientos` (`sheet1.xml`) y `Hoja 2 - Cierre General` (`sheet2.xml`) junto con `styles.xml`.
  - `xl/styles.xml`: Define fuentes (calibri normal, negrita, texto blanco de cabecera, texto rojo `#DC2626` para retiros/faltantes), rellenos de cabecera y formato numérico `#,##0.00`.
  - `xl/worksheets/sheet1.xml`: Contiene el resumen superior de Efectivo Inicial y Efectivo Actual, seguido de la tabla de movimientos con celdas tipadas (`t="n"` para montos y correlativos, `t="inlineStr"` para textos).
  - `xl/worksheets/sheet2.xml`: Contiene el desglose de fajos, billetes, monedas y el bloque de cuadre final (Total Efectivo, Saldo Sistema, Capital Total E+S, Capital Base y Diferencia).

### Interactive Component & State Mapping
- **Cabecera de `HojasLocalesView`**:
  - Título actualizado a `HOJAS BCP`.
  - Estado local `menuBorrarAbierto: boolean` que se cierra automáticamente al cambiar entre Hoja 1 y Hoja 2 o al tocar fuera del menú.
  - Estado local `confirmacionBorrado: boolean` para mostrar `✅ LIMPIO` en el botón `🗑️ BORRAR` tras ejecutar una limpieza.
- **Limpieza en `AjustesModal`**:
  - Eliminación de los botones de borrado de Hoja 1 y Hoja 2 en ambas pestañas del modal y limpieza de las propiedades innecesarias en el componente.
