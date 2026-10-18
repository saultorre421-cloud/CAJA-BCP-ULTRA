# Sistema Ágil Unificado - Agente BCP (React Edition)

Aplicación web progresiva reescrita completamente en **React + TypeScript + Vite + Tailwind CSS** para operaciones ágiles de Agentes BCP. Optimizado para dispositivos móviles y terminales táctiles con cero latencia (0.00 ms), diseño sin scroll vertical, blindaje de datos en almacenamiento local y exportación completa a Excel.

## 🚀 Funcionalidades Principales

### 1. Caja Principal (3 Modos Operativos)
- **Modo Servicio (Recibo)**: Cálculo automático de vuelto o monto faltante para pagos de servicios.
- **Modo Depósito**: Verificación de monto a depositar vs dinero recibido con detección de depósito directo sin vuelto.
- **Modo Retiro**: Validación de dinero contado en mano vs monto por entregar con alerta de seguridad (`¡CUIDADO! DAS DE MÁS`).
- **Expansión Inteligente de Cuadros**: Inicialmente 4 cuadros (`b1..b4` y `p1..p4`), que se expanden fluidamente a 6 cuadros al completar los 4 primeros, y deslizables horizontalmente a la Página 2 (`b7..b10` y `p7..p10`).
- **Operaciones Enganchadas**: Permite editar múltiples modos simultáneamente (indicados por un punto naranja) y registrar todas las operaciones con una sola pulsación de `Enter` en orden cronológico.

### 2. Cierre de Caja BCP
- **Resumen Contable en Vivo**:
  - `EFECTIVO`: Sincronizado en tiempo real con el saldo acumulado en la Hoja 1 de Movimientos.
  - `EFECTIVO MANUAL`: Despliegue automático cuando se realiza un conteo físico sobre el saldo en vivo.
  - `S. SISTEMA`: Campo numérico para ingresar el saldo reportado por el sistema BCP.
  - `E + S`: Suma automática del efectivo y saldo de sistema.
  - `Capital Base`: Comparación con la remesa asignada (por defecto S/ 26,729.00).
- **Fajos Especiales**: Steppers de doble ala e input directo para paquetes de S/ 1,000 con reinicio por doble toque.
- **Cuadre Inteligente**:
  - `CUADRE EXACTO CONFORME` (verde).
  - `FALTANTE EN CAJA` (rojo).
  - `SOBRANTE EN CAJA` (naranja).
  - `ENTER = FIJAR EFECTIVO INICIAL`: Si no se ha ingresado Saldo de Sistema, fija el conteo como capital inicial en la Hoja 1.
  - `✓ CIERRE GUARDADO EN HOJA 2`: Si se ingresa Saldo de Sistema, archiva el cuadre en la Hoja 2.

### 3. Multiplicador de Billetes y Monedas
- Desglose por denominaciones oficiales del BCRP:
  - Billetes: S/ 200, S/ 100, S/ 50, S/ 20, S/ 10.
  - Monedas: S/ 5.00, S/ 2.00, S/ 1.00, S/ 0.50, S/ 0.20, S/ 0.10.
- Steppers ergonómicos de doble ala (subir y bajar) e ingreso numérico directo.
- Sincronización bidireccional automática: al contar billetes/monedas en modo Caja, se vuelca el valor en la casilla activa.
- Soporte para personalizar fotos reales con recorte y compresión en HTML5 Canvas.

### 4. Control Local BCP (Hojas 1 y 2) & Exportación Excel
- **Hoja 1 (Movimientos)**: Tarjetas de Efectivo Inicial y Efectivo Actual, tabla con N°, Fecha, Hora, Detalle y Monto (positivos en negro, negativos en rojo).
- **Hoja 2 (Cierre General)**: Desglose completo de fajos, billetes, monedas, totales y diferencia.
- **Descarga Excel (.xls)**: Generación directa con formato XML oficial de Microsoft Excel conteniendo ambas hojas tabuladas con estilos y colores contables.

### 5. Controles Flotantes y Ergonomía
- **Conmutador Circular 2D (Google Switcher)**: Botón flotante arrastrable con efecto de rotación y cambio inmediato entre Caja y Cierre.
- **Botones Auxiliares Reubicables**:
  - `BORRAR`: Limpia la caja con confirmación instantánea.
  - `MOVIMIENTOS`: Accede directamente a las hojas de control.
  - `ANULAR`: Elimina la última operación registrada en 0.00 ms.
  - *Mantener presionado* cualquier botón auxiliar para reubicarlo en cualquier posición de la pantalla.
- **Atajos de Teclado**:
  - Tecla `-` (o Menos del teclado numérico): Conmuta al Multiplicador y regresa.
  - Tecla `,` (Coma): Inserta doble cero (`00`) instantáneamente.
  - Tecla `Enter`: Registra operaciones o guarda el cierre según la pantalla activa.

## 🛠️ Tecnologías Utilizadas

- **React 18**
- **TypeScript**
- **Vite 6**
- **Tailwind CSS v4**
- **HTML5 Web Storage & Canvas API**
