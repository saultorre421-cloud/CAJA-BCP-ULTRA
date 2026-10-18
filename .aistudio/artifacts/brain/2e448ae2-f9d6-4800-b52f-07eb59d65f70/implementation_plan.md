# Consolidación Monolítica en `index.html` para GitHub Pages — Sistema Ágil Unificado Agente BCP

Consolidación integral de toda la aplicación y sus tres mejoras operativas recientes dentro de un único archivo raíz `index.html` autocontenido en HTML, CSS y JavaScript vanilla puro, eliminando los archivos auxiliares de compilación para que el repositorio funcione directamente en GitHub Pages y de forma 100% offline.

## User Review & Critical Decisions

> [!IMPORTANT]
> Se han confirmado las decisiones clave para la estructura final del repositorio y la arquitectura del código embebido:

- **Decisión Confirmada 1 (Estructura del Repositorio)**: Se conservarán únicamente `index.html` y `README.md` en la raíz del proyecto, eliminando la carpeta de código fuente modular y los archivos de configuración de empaquetado (`src/`, `package.json`, `tsconfig.json`, `vite.config.ts`, `metadata.json` y `bun.lock`).
- **Decisión Confirmada 2 (Arquitectura Monolítica Vanilla)**: El archivo `index.html` estará construido íntegramente con HTML5, CSS3 y JavaScript Vanilla puro (ES6+), sin dependencias externas ni enlaces a módulos externos, garantizando ejecución instantánea al abrir el archivo o desplegarlo en GitHub Pages.

---

## 1. Overview & Core Concept

- **What It Does**: Proporciona a los operadores de Agente BCP una herramienta ultrarrápida en un solo archivo (`index.html`) para calcular cobros de servicios, depósitos y retiros, contabilizar fajos, billetes y monedas con imágenes personalizables, registrar movimientos en hojas locales (Hoja 1 y Hoja 2) y exportar reportes contables en formato binario `.xlsx` nativo.
- **Target Audience / Persona**: Operadores y cajeros de Agentes BCP que trabajan desde dispositivos móviles Android o terminales con teclado numérico y requieren respuesta instantánea (`0.00 ms`), funcionamiento sin conexión a internet y despliegue directo en GitHub Pages.
- **Key Value**: Portabilidad absoluta en un único archivo monolítico sin pasos de compilación, manteniendo intactos los blindajes táctiles, atajos de teclado físico y compatibilidad nativa con Microsoft Excel y Google Sheets en Android.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Operación de Caja (`SERVICIO`, `DEPÓSITO`, `RETIRO`)**: Ingreso veloz en grillas dinámicas de 4 a 6 casillas con formato automático de céntimos (`0.00`), cálculo en tiempo real de vuelto/faltante/comisión y registro directo en Hoja 1 al presionar `Enter`.
  2. **Cierre de Caja y Multiplicador (`EFECTIVO`)**: Cuadre instantáneo frente al saldo del sistema y capital de trabajo, con desglose interactivo de billetes (`S/ 200` a `S/ 10`) y monedas (`S/ 5.00` a `S/ 0.10`), soporte de subida y compresión de imágenes reales y sonido sintético de conteo.
  3. **Vista `HOJAS BCP` y Borrado Contextual (`🗑️ BORRAR`)**:
     - En **Hoja 1 (Movimientos)**: Al pulsar `🗑️ BORRAR`, se despliega un menú flotante compacto bajo el botón con dos acciones directas: `🧹 Solo Movimientos` y `💵 Efectivo Inicial`, con confirmación de segundo toque.
     - En **Hoja 2 (Cierre General)**: Al pulsar `🗑️ BORRAR` y confirmar con el segundo toque, se limpia en `0.00 ms` todo el conteo de billetes, monedas, fajos, efectivo manual y saldo del sistema sin alterar la Hoja 1.
  4. **Exportación `.XLSX` Real y Web Share API (`📥 EXCEL`)**: Empaquetado binario OpenXML (`.xlsx`) en memoria que invoca el selector nativo de Android (`navigator.share` / `navigator.canShare`) para abrir o enviar directamente `BCP_Caja_y_Cierre.xlsx` por WhatsApp, Excel o Google Sheets, o descargarlo localmente si el navegador no soporta compartición de archivos.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Diseño utilitario financiero de alta densidad, optimizado para operación con una sola mano y lectura inmediata bajo cualquier condición de luz.
  - *Color Palette & Mood*: Identidad corporativa BCP (`--bcp-blue: #002A8D`, `--bcp-orange: #FF6A00`) combinada con codificación semántica por operación: Amarillo Recibo (`#eab308`), Turquesa Depósito (`#0d9488`) y Carmesí Retiro (`#e11d48`), sobre fondo neutro (`#F1F5F9`).
  - *Typography & Hierarchy*: Tipografía de sistema sin serifa de renderizado nativo con disciplina numérica tabular estricta (`font-variant-numeric: tabular-nums`) y escalado fluido (`clamp()`) para importes totales.
  - *Component Styling & Layout*: Blindaje vertical (`100dvh`, `overflow: hidden`) en vistas operativas para evitar desplazamientos accidentales, botones de toque rápido con áreas de impacto ergonómicas ($\ge 44\text{px}$) y navegación por gestos horizontales (`swipe`).
- **Interactive Feedback & Motion**: Respuesta táctil (`navigator.vibrate`), síntesis de audio Web Audio API sin archivos externos, animaciones en compositor (`transform`, `opacity` en $\le 150\text{ms}$) y botón flotante arrastrable (`btnGoogleSwitcher`) con persistencia de coordenadas.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisión 1: Consolidación en HTML/CSS/JS Vanilla Monolítico**
  - *Chosen Approach*: Integrar todos los estilos en `<style>`, la estructura de las 4 pantallas y el modal en `<body>`, y toda la lógica de negocio + generador ZIP/OpenXML en `<script>` dentro de `/index.html`.
  - *Why*: Permite alojar el proyecto directamente en GitHub Pages desde la rama principal sin procesos de build ni dependencias de Node.js, además de permitir abrir `index.html` localmente en cualquier dispositivo.
  - *Alternatives Considered*: Mantener la estructura React/Vite requería compilación previa o ramas de despliegue separadas (`gh-pages`), lo cual iba en contra del requisito de repositorio estático limpio.
- **Decisión 2: Generador `.XLSX` OpenXML Nativo sin Librerías Externas**
  - *Chosen Approach*: Construcción en JavaScript puro de los flujos XML (`[Content_Types].xml`, `_rels/.rels`, `xl/workbook.xml`, `xl/_rels/workbook.xml.rels`, `xl/styles.xml`, `xl/worksheets/sheet1.xml`, `xl/worksheets/sheet2.xml`) empaquetados en un contenedor binario ZIP válido con cálculo CRC-32 por tabla en `Uint8Array`.
  - *Why*: Garantiza peso cero en librerías externas, funcionamiento 100% offline y compatibilidad total con las aplicaciones móviles de Microsoft Excel y Google Sheets en Android.
- **Decisión 3: Centralización del Borrado de Hojas**
  - *Chosen Approach*: Ubicar el control `🗑️ BORRAR` directamente en la barra superior de `HOJAS BCP` con comportamiento contextual según la pestaña activa, y eliminar los botones redundantes de borrado de hojas en ambas pestañas del modal de Configuración (`⚙️`).
  - *Why*: Simplifica el modal de ajustes (dejándolo exclusivamente para parámetros como Efectivo Inicial, Capital Base y fotos de billetes/monedas) y permite limpiar registros viendo los datos en pantalla.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     /index.html (Monolito Autocontenido)                │
├───────────────────────┬─────────────────────────┬───────────────────────┤
│   <style> Embebido    │     DOM Multi-Vista     │  <script> Vanilla JS  │
│  • Variables BCP      │  • #app-caja            │  • Estado + Storage   │
│  • Blindaje 100dvh    │  • #app-cierre          │  • Motor Aritmético   │
│  • Temas Operativos   │  • #app-multiplicador   │  • Borrado Contextual │
│  • Menú Borrar Popover│  • #app-movimientos     │  • Motor ZIP / .XLSX  │
│  • Controles Flotantes│  • #modalAjustes        │  • Web Share API      │
└───────────────────────┴───────────┬─────────────┴───────────┬───────────┘
                                    │                         │
                                    ▼                         ▼
                        ┌───────────────────────┐ ┌───────────────────────┐
                        │   localStorage BCP    │ │  BCP_Caja_y_Cierre    │
                        │ • bcp_hoja1_data_v1   │ │        .xlsx          │
                        │ • bcp_hoja2_data_v1   │ │ • Hoja 1: Movimientos │
                        │ • bcp_caja_modos_v1   │ │ • Hoja 2: Cierre Gral │
                        │ • bcp_billetes/monedas│ │ • navigator.share()   │
                        └───────────────────────┘ └───────────────────────┘
```

- **Data Model & State**:
  - `bcp_caja_modos_v1`: Estado independiente por modo (`recibo`, `deposito`, `retiro`) con arreglos de valores para las grillas izquierda y derecha.
  - `bcp_hoja1_data_v1`: Efectivo inicial, efectivo actual en tiempo real y lista cronológica de movimientos (`fecha`, `tipo`, `descripcion`, `entradas`, `salidas`, `caja`).
  - `bcp_hoja2_data_v1`: Instantánea sincronizada del Cierre General (desglose de billetes y monedas, fajos, efectivo manual, saldo sistema, capital base y diferencia).
  - `bcp_billetes_v2` / `bcp_monedas_v1` y `bcp_img_billete_*` / `bcp_img_moneda_*`: Cantidades del multiplicador e imágenes personalizadas comprimidas en Base64.
- **Interactive Component & State Mapping**:
  - **Cabecera `HOJAS BCP`**: Muestra el título compacto `HOJAS BCP`, el botón `🗑️ BORRAR` (con menú desplegable en Hoja 1 y acción directa de doble toque en Hoja 2) y el botón `📥 EXCEL`.
  - **Modal `⚙️ Configuración`**: Contiene únicamente los campos de Efectivo Inicial (pestaña Caja), Capital Base e imágenes personalizadas de billetes y monedas (pestaña Cierre), sin botones de borrado de hojas.
  - **Atajos de Teclado Físico**: Tecla `-` para cambiar entre modos (`SERVICIO` → `DEPÓSITO` → `RETIRO`), tecla `,` para saltar entre columna de cobros y pagos, y tecla `Enter` para registrar la operación en Hoja 1 y limpiar la pantalla.
