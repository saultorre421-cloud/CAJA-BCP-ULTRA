import React, { useRef } from 'react';
import { Hoja1Data, MapBilletes, MapMonedas } from '../types';
import {
  formatoSoles,
  formatoMonedaConPrefijo,
  formatoEntero,
  formatInputString,
  DENOMINACIONES_BILLETES,
  DENOMINACIONES_MONEDAS,
} from '../utils/formatters';
import { SignalIcon, StepperDownIcon, StepperUpIcon } from '../utils/svgIcons';

interface CierreViewProps {
  hoja1Data: Hoja1Data;
  billetesCierre: MapBilletes;
  monedasCierre: MapMonedas;
  cantF1000: number;
  setCantF1000: React.Dispatch<React.SetStateAction<number>>;
  inputSistema: string;
  setInputSistema: React.Dispatch<React.SetStateAction<string>>;
  capitalBase: number;
  onOpenMultiplicador: (tab?: string) => void;
  onOpenAjustes: (tab: 'caja' | 'cierre') => void;
  onGuardarCierreConEnter: () => void;
  onLimpiarCierreManual: () => void;
  ultimoInputCierreActivoRef: React.MutableRefObject<string>;
  confirmacionCierreTexto: { msg: string; monto: string; estado: string } | null;
}

export const CierreView: React.FC<CierreViewProps> = ({
  hoja1Data,
  billetesCierre,
  monedasCierre,
  cantF1000,
  setCantF1000,
  inputSistema,
  setInputSistema,
  capitalBase,
  onOpenMultiplicador,
  onOpenAjustes,
  onGuardarCierreConEnter,
  onLimpiarCierreManual,
  ultimoInputCierreActivoRef,
  confirmacionCierreTexto,
}) => {
  const fajoInputRef = useRef<HTMLInputElement>(null);
  const [btnBorradoLabel, setBtnBorradoLabel] = React.useState<string | null>(null);

  // Physical manual cash calculations
  let centB = 0;
  DENOMINACIONES_BILLETES.forEach(d => {
    centB += Math.round(d * 100) * (billetesCierre[d] || 0);
  });
  let centM = 0;
  DENOMINACIONES_MONEDAS.forEach(d => {
    centM += Math.round(d * 100) * (monedasCierre[d] || 0);
  });
  const centFajo = cantF1000 * 100000;
  const totalCentimosManual = centB + centM + centFajo;
  const totalBilletesYMonedasManual = (centB + centM) / 100;

  // Hoja 1 state
  const hayMovs = hoja1Data.movimientos.length > 0;
  const estadoMovsActivo = hoja1Data.tieneEfectivoInicial || hayMovs;
  let sumaMovsCentimos = 0;
  for (const mov of hoja1Data.movimientos) {
    sumaMovsCentimos += mov.montoCentimos || 0;
  }
  const inicialCent = hoja1Data.tieneEfectivoInicial ? hoja1Data.efectivoInicialCentimos : 0;
  const actualCentimos = inicialCent + sumaMovsCentimos;
  const actualSoles = actualCentimos / 100;

  // S. Sistema state
  const rawSistema = inputSistema.replace(/,/g, '').trim();
  const numSistema = parseFloat(rawSistema);
  const tieneSistema = rawSistema !== '' && !isNaN(numSistema);
  const centimosSistema = tieneSistema ? Math.round(numSistema * 100) : 0;

  // Cuadre determination
  let centimosEfectivoParaCuadre = 0;
  let mostrarFilaManualExtra = false;

  if (estadoMovsActivo) {
    if (totalCentimosManual !== 0) {
      mostrarFilaManualExtra = true;
      centimosEfectivoParaCuadre = totalCentimosManual;
    } else {
      centimosEfectivoParaCuadre = actualCentimos;
    }
  } else {
    centimosEfectivoParaCuadre = totalCentimosManual;
  }

  const centimosSumaES = centimosEfectivoParaCuadre + centimosSistema;
  const sumaTotalES = centimosSumaES / 100;

  const centimosBase = Math.round(capitalBase * 100);
  const difCentimos = centimosSumaES - centimosBase;
  const diferenciaSoles = difCentimos / 100;

  // Response banner
  let estadoClave = 'esperando';
  let signalIcon = 'esperando';
  let mensajeTexto = 'ESPERANDO CONTEO...';
  let valorFormateado = 'S/ 0.00';

  if (confirmacionCierreTexto) {
    estadoClave = confirmacionCierreTexto.estado;
    signalIcon = 'exacto';
    mensajeTexto = confirmacionCierreTexto.msg;
    valorFormateado = confirmacionCierreTexto.monto;
  } else {
    const tieneEfectivoActivo = centimosEfectivoParaCuadre !== 0;
    if (!tieneEfectivoActivo && !tieneSistema) {
      estadoClave = 'esperando';
      signalIcon = 'esperando';
      mensajeTexto = 'ESPERANDO CONTEO...';
      valorFormateado = 'S/ 0.00';
    } else if (tieneEfectivoActivo && !tieneSistema) {
      estadoClave = 'vuelto';
      signalIcon = 'mano';
      mensajeTexto = (totalCentimosManual !== 0) ? 'ENTER = FIJAR EFECTIVO INICIAL' : 'EFECTIVO ACTUAL EN TIEMPO REAL';
      valorFormateado = formatoMonedaConPrefijo(centimosEfectivoParaCuadre / 100);
    } else if (Math.abs(diferenciaSoles) <= 0.05) {
      estadoClave = 'exacto';
      signalIcon = 'exacto';
      mensajeTexto = 'CUADRE EXACTO CONFORME';
      valorFormateado = 'S/ 0.00';
    } else if (diferenciaSoles < -0.05) {
      estadoClave = 'faltante';
      signalIcon = 'faltante';
      mensajeTexto = 'FALTANTE EN CAJA';
      valorFormateado = '- S/ ' + formatoSoles(diferenciaSoles);
    } else {
      estadoClave = 'faltante-entregar';
      signalIcon = 'entregar';
      mensajeTexto = 'SOBRANTE EN CAJA';
      valorFormateado = '+ S/ ' + formatoSoles(diferenciaSoles);
    }
  }

  const handleStepFajo = (delta: number) => {
    setCantF1000(prev => prev + delta);
  };

  const handleFajoChange = (valStr: string) => {
    const val = parseInt(valStr) || 0;
    setCantF1000(val);
  };

  const handleBorrarCierreClick = () => {
    onLimpiarCierreManual();
    setBtnBorradoLabel('✅ CONTEO MANUAL DE CIERRE BORRADO');
    setTimeout(() => {
      setBtnBorradoLabel(null);
    }, 600);
  };

  return (
    <div id="app-cierre" className="w-full h-full overflow-hidden select-none">
      <form
        onSubmit={e => {
          e.preventDefault();
          onGuardarCierreConEnter();
        }}
        className="h-full flex flex-col justify-start"
      >
        <div className="cierre-wrapper">
          {/* 1. TOP BAR */}
          <div className="top-bar-cierre">
            <div className="top-bar-title">
              <span>📋 CIERRE DE CAJA BCP</span>
            </div>
            <div className="top-bar-actions">
              <button
                type="button"
                className="btn-ir-efectivo"
                onClick={() => onOpenMultiplicador('tab-billetes')}
                title="Presiona (-) o toca aquí para ir a Billetes y Monedas"
              >
                <span>💵🪙 EFECTIVO</span>
              </button>
              <button
                type="button"
                className="btn-config-cierre"
                onClick={() => onOpenAjustes('cierre')}
                title="Configuración de Cierre"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* 2. SUMMARY BOX */}
          <div className="summary-box">
            {/* Row Efectivo */}
            <div
              className="summary-row row-efectivo"
              onClick={() => onOpenMultiplicador('tab-billetes')}
              title="Toca para detallar Billetes y Monedas"
            >
              <span className="summary-label">
                <span id="lblTituloEfectivoCierre">EFECTIVO</span>
                <span className="badge-touch-hint" id="badgeResumenBilletesMonedas">
                  {estadoMovsActivo
                    ? `Movimientos (#${hoja1Data.movimientos.length}) ⇄`
                    : (centB !== 0 || centM !== 0 ? `B+M: S/ ${formatoSoles(totalBilletesYMonedasManual)} ⇄` : 'Billetes / Monedas ⇄')}
                </span>
              </span>
              <span
                className={`summary-value ${estadoMovsActivo ? 'efectivo-sync-movimientos' : ''}`}
                id="display-efectivo"
              >
                {estadoMovsActivo
                  ? formatoMonedaConPrefijo(actualSoles)
                  : formatoMonedaConPrefijo(totalCentimosManual / 100)}
              </span>
            </div>

            {/* Fila extra inteligente si hay conteo manual sobre saldo en vivo */}
            {mostrarFilaManualExtra && (
              <div
                className="summary-row row-efectivo-manual-extra activa"
                onClick={() => onOpenMultiplicador('tab-billetes')}
                title="Conteo físico manual activo para el cuadre"
              >
                <span className="summary-label" style={{ fontSize: '12.5px', color: '#0f172a' }}>
                  EFECTIVO MANUAL
                  <span
                    className="badge-touch-hint"
                    style={{ background: '#dcfce7', color: '#15803d' }}
                  >
                    {centB !== 0 || centM !== 0
                      ? `B+M: S/ ${formatoSoles(totalBilletesYMonedasManual)} ⇄`
                      : 'En mano ✓'}
                  </span>
                </span>
                <span
                  className="summary-value"
                  style={{ fontSize: 'clamp(18px, 5vw, 22px)', color: '#15803d' }}
                >
                  {formatoMonedaConPrefijo(totalCentimosManual / 100)}
                </span>
              </div>
            )}

            {/* Row S. SISTEMA */}
            <div className="summary-row">
              <span className="summary-label">S. SISTEMA</span>
              <input
                type="text"
                id="input-sistema"
                className="input-sistema"
                inputMode="decimal"
                enterKeyHint="send"
                value={inputSistema}
                onFocus={() => { ultimoInputCierreActivoRef.current = 'input-sistema'; }}
                onChange={e => setInputSistema(formatInputString(e.target.value))}
                placeholder="0.00"
              />
            </div>

            {/* Row E + S */}
            <div className="summary-row row-total-es">
              <span className="summary-label">E + S</span>
              <span className="summary-value val-es" id="display-suma">
                {formatoMonedaConPrefijo(sumaTotalES)}
              </span>
            </div>
          </div>

          {/* 3. CAPITAL BASE */}
          <div className="capital-row">
            <span className="capital-label">Capital Base</span>
            <span
              className="capital-display-pill"
              onClick={() => onOpenAjustes('cierre')}
              title="Editar Capital Base en Ajustes"
            >
              S/ <span id="lblBaseActiva">{formatoSoles(capitalBase)}</span>
            </span>
          </div>

          {/* 4. PANEL FINAL */}
          <div className={`panel-resultado estado-${estadoClave}`} id="panelFinalCierre">
            <div className="texto-final-expresivo" id="textoFinalCierre">
              <span className="sig-wing wing-left">
                <SignalIcon name={signalIcon} />
              </span>
              <span>{mensajeTexto}</span>
              <span className="sig-wing wing-right">
                <SignalIcon name={signalIcon} />
              </span>
            </div>
            <span className="monto-final" id="montoFinalCierre">
              {valorFormateado}
            </span>
          </div>

          {/* 5. FAJOS ESPECIALES */}
          <div className="fajos-section">
            <div className="fajos-header-bar">
              <span className="fajos-title">Fajos Especiales</span>
              <span className="fajos-subtitle">Doble toque para limpiar fajo</span>
            </div>
            <div
              className={`fajo-card ${cantF1000 > 0 ? 'fila-activa' : ''} ${cantF1000 < 0 ? 'fila-negativa' : ''}`}
              id="card-f1000"
            >
              <div
                className="fajo-visual-box"
                onDoubleClick={() => setCantF1000(0)}
                title="Doble toque para reiniciar fajo"
              >
                <svg viewBox="0 0 122 60" width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="gFajo" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#002A8D" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                  <rect width="122" height="60" fill="url(#gFajo)" />
                  <rect x="3" y="3" width="116" height="54" rx="3" fill="none" stroke="#FF6A00" strokeOpacity="0.55" strokeWidth="1.2" />
                  <text x="8" y="16" fill="#fdba74" fontFamily="sans-serif" fontSize="8" fontWeight="900" letterSpacing="0.6">📦 FAJO ESPECIAL</text>
                  <text x="8" y="45" fill="#ffffff" fontFamily="sans-serif" fontSize="22" fontWeight="900" letterSpacing="-0.8">S/ 1,000</text>
                </svg>
              </div>

              <div className="stepper-control">
                <button
                  type="button"
                  className="btn-step btn-step-down"
                  onClick={() => handleStepFajo(-1)}
                  title="Bajar"
                >
                  <StepperDownIcon />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  className="input-qty"
                  id="f1000"
                  ref={fajoInputRef}
                  placeholder="0"
                  enterKeyHint="send"
                  value={cantF1000 === 0 ? '' : cantF1000}
                  onFocus={() => { ultimoInputCierreActivoRef.current = 'f1000'; }}
                  onChange={e => handleFajoChange(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-step btn-step-up"
                  onClick={() => handleStepFajo(1)}
                  title="Subir"
                >
                  <StepperUpIcon />
                </button>
              </div>

              <div
                className="item-data-col"
                onDoubleClick={() => setCantF1000(0)}
                title="Doble toque para reiniciar"
              >
                <span className="subtotal-tag">SUBTOTAL</span>
                <div className="subtotal-valor-box">
                  <span className="item-subtotal" id="sub-f1000">
                    {formatoEntero(centFajo / 100)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. RESET BUTTON */}
          <div className="cierre-reset-zone">
            <button
              type="button"
              className="btn-borrar-todo-cierre"
              id="btnBorrarTodoPantallaCierre"
              style={btnBorradoLabel ? { background: '#dcfce7', borderColor: '#16a34a', color: '#15803d' } : {}}
              onClick={handleBorrarCierreClick}
            >
              <span>{btnBorradoLabel || '🗑️ BORRAR DATOS EDITADOS DE CIERRE'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
