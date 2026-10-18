# Sistema Ágil Unificado - Agente BCP

Aplicación web ultrarrápida y **100% autocontenida en un único archivo monolítico (`index.html`)** con HTML5, CSS3 y JavaScript Vanilla puro (sin librerías externas), lista para ejecutarse directamente en **GitHub Pages** o localmente sin conexión a internet (`100% Offline`).

---

## 🚀 Funcionalidades Principales

### 1. Caja Principal (3 Modos Operativos)
- **Modo Servicio (Recibo)**: Cálculo automático de vuelto o monto faltante para pagos de servicios.
- **Modo Depósito**: Verificación de monto a depositar vs dinero recibido con detección de depósito directo sin vuelto.
- **Modo Retiro**: Validación de dinero contado en mano vs monto por entregar con alerta de seguridad (`¡CUIDADO! DAS DE MÁS`).
- **Expansión Inteligente de Cuadros**: Inicialmente 4 cuadros (`b1..b4` y `p1..p4`), que se expanden fluidamente a 6 cuadros al completar los 4 primeros, y deslizables horizontalmente a la Página 2 (`b7..b10` y `p7..b10`).
- **Operaciones Enganchadas**: Permite editar múltiples modos simultáneamente (indicados por un punto naranja) y registrar todas las operaciones con una sola pulsación de `Enter` en orden cronológico.

### 2. Cierre de Caja BCP
- **Resumen Contable en Vivo**:
  - `EFECTIVO`: Sincronizado en tiempo real con el saldo acumulado en la Hoja 1 de Movimientos.
  - `EFECTIVO MANUAL`: Despliegue automático cuando se realiza un conteo físico sobre el saldo en vivo.
  - `S. SISTEMA`: Campo numérico para ingresar el saldo reportado por el sistema BCP.
  - `E + S`: Suma automática del efectivo y saldo de sistema.
  - `Capital Base`: Comparación con la remesa asignada (por defecto `S/ 26,729.00`).
- **Fajos Especiales**: Steppers de doble ala e ingreso directo para paquetes de `S/ 1,000` con reinicio por doble toque.

### 3. Multiplicador de Billetes y Monedas
- Desglose por denominaciones oficiales del BCRP:
  - **Billetes**: `S/ 200`, `S/ 100`, `S/ 50`, `S/ 20`, `S/ 10`.
  - **Monedas**: `S/ 5.00`, `S/ 2.00`, `S/ 1.00`, `S/ 0.50`, `S/ 0.20`, `S/ 0.10`.
- Sincronización bidireccional automática con la casilla activa de Caja o con el Cierre General.
- Soporte para personalizar fotos reales con compresión automática en HTML5 Canvas (`localStorage`).

### 4. Hojas BCP (`HOJAS BCP`), Borrado Contextual y Exportador `.XLSX` Nativo
- **Cabecera Compacta (`HOJAS BCP`)**: Acceso directo a la **Hoja 1 (Movimientos)** y **Hoja 2 (Cierre General)**.
- **Botón Contextual `🗑️ BORRAR`**:
  - **En Hoja 1**: Despliega un menú rápido compacto bajo el botón para elegir entre **🧹 Borrar Solo Movimientos** (conservando el Efectivo Inicial) o **💰 Borrar Efectivo Inicial** (conservando las filas de movimientos).
  - **En Hoja 2**: Limpia directamente el **Cierre General** en `0.00 ms` sin tocar la Hoja 1.
- **Exportador Binario `.XLSX` OpenXML Real (`📥 EXCEL`)**:
  - Empaqueta en JavaScript puro un archivo binario `.xlsx` válido (estructura ZIP con CRC-32, `[Content_Types].xml`, `xl/workbook.xml`, `xl/styles.xml` y hojas `sheet1.xml` y `sheet2.xml` con formato numérico y de moneda).
  - **Integración con Web Share API**: En Android despliega el selector nativo (estilo WhatsApp / Microsoft Excel / Google Sheets) para abrir o enviar directamente `BCP_Caja_y_Cierre.xlsx`, o descarga el archivo `.xlsx` si el navegador no soporta `navigator.canShare`.

### 5. Controles Flotantes y Atajos de Teclado
- **Conmutador Circular 2D (`CAJA` / `CIERRE`)**: Botón flotante arrastrable hacia cualquier lugar con persistencia de coordenadas.
- **Botones Auxiliares Reubicables (`BORRAR`, `MOVIMIENTOS`, `ANULAR`)**: Mantener presionado cualquiera de los tres botones para mover su ubicación en pantalla.
- **Atajos de Teclado Físico**:
  - Tecla `-`: Alterna hacia el Multiplicador de Billetes y Monedas y regresa.
  - Tecla `,`: Inserta doble cero (`00`) instantáneamente.
  - Tecla `Enter`: Registra operaciones en Hoja 1 o guarda el Cierre en Hoja 2.

---

## 📦 Estructura del Repositorio (GitHub Pages Ready)

- `index.html`: Aplicación monolítica completa (HTML + CSS + JS embebidos, cero dependencias externas).
- `README.md`: Documentación del sistema.
