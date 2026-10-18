import React, { useRef, useState, useEffect } from 'react';
import { Hoja1Data, Hoja2Data, MapBilletes, MapMonedas } from '../types';
import {
  formatoMonedaConPrefijo,
  formatoNumeroPuroHoja1,
  vibrarRapido,
} from '../utils/formatters';

interface HojasLocalesViewProps {
  hoja1Data: Hoja1Data;
  hoja2Data: Hoja2Data | null;
  cantF1000: number;
  billetesCierre: MapBilletes;
  monedasCierre: MapMonedas;
  inputSistema: string;
  capitalBase: number;
  onVolver: () => void;
  onExportExcel: () => void;
  onBorrarSoloMovimientos: () => void;
  onBorrarSaldoInicial: () => void;
  onLimpiarCierreHoja2: () => void;
}

export const HojasLocalesView: React.FC<HojasLocalesViewProps> = ({
  hoja1Data,
  hoja2Data,
  cantF1000,
  billetesCierre,
  monedasCierre,
  inputSistema,
  capitalBase,
  onVolver,
  onExportExcel,
  onBorrarSoloMovimientos,
  onBorrarSaldoInicial,
  onLimpiarCierreHoja2,
}) => {
  const [tabHoja, setTabHoja] = useState<1 | 2>(1);
  const [menuBorrarAbierto, setMenuBorrarAbierto] = useState(false);
  const [confirmacionLimpio, setConfirmacionLimpio] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const accionesRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú desplegable si el usuario toca fuera
  useEffect(() => {
    if (!menuBorrarAbierto) return;
    const handlePointerDownOutside = (e: PointerEvent) => {
      if (accionesRef.current && !accionesRef.current.contains(e.target as Node)) {
        setMenuBorrarAbierto(false);
      }
    };
    document.addEventListener('pointerdown', handlePointerDownOutside);
    return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
  }, [menuBorrarAbierto]);

  // Calculate live Hoja 1 balances
  const hayMovs = hoja1Data.movimientos.length > 0;
  const estadoMovsActivo = hoja1Data.tieneEfectivoInicial || hayMovs;
  let sumaMovsCentimos = 0;
  for (const m of hoja1Data.movimientos) {
    sumaMovsCentimos += m.montoCentimos || 0;
  }
  const inicialCent = hoja1Data.tieneEfectivoInicial ? hoja1Data.efectivoInicialCentimos : 0;
  const actualCentimos = inicialCent + sumaMovsCentimos;
  const actualSoles = actualCentimos / 100;

  // Hoja 2 source: either saved closing or live active cierre
  let centManual = 0;
  [200, 100, 50, 20, 10].forEach(d => {
    centManual += Math.round(d * 100) * (billetesCierre[d] || 0);
  });
  [5, 2, 1, 0.5, 0.2, 0.1].forEach(d => {
    centManual += Math.round(d * 100) * (monedasCierre[d] || 0);
  });
  centManual += cantF1000 * 100000;

  const rawSis = inputSistema.replace(/,/g, '').trim();
  const numSis = parseFloat(rawSis) || 0;
  const efecUsadoSoles = (centManual !== 0)
    ? (centManual / 100)
    : (estadoMovsActivo ? actualSoles : 0);

  const srcH2 = hoja2Data || {
    fechaHora: new Date().toLocaleString('es-PE'),
    f1000: cantF1000 || 0,
    b200: billetesCierre[200] || 0,
    b100: billetesCierre[100] || 0,
    b50: billetesCierre[50] || 0,
    b20: billetesCierre[20] || 0,
    b10: billetesCierre[10] || 0,
    m5: monedasCierre[5] || 0,
    m2: monedasCierre[2] || 0,
    m1: monedasCierre[1] || 0,
    m050: monedasCierre[0.5] || 0,
    m020: monedasCierre[0.2] || 0,
    m010: monedasCierre[0.1] || 0,
    totalEfectivoSoles: efecUsadoSoles,
    saldoSistemaSoles: numSis,
    capitalTotalSoles: efecUsadoSoles + numSis,
    capitalBaseSoles: capitalBase,
    diferenciaSoles: (efecUsadoSoles + numSis) - capitalBase,
  };

  const difColor = srcH2.diferenciaSoles < -0.05
    ? '#dc2626'
    : (srcH2.diferenciaSoles > 0.05 ? '#ea580c' : '#15803d');

  const switchTab = (num: 1 | 2) => {
    vibrarRapido(12);
    setMenuBorrarAbierto(false);
    setTabHoja(num);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: num === 1 ? 0 : sliderRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleSliderScroll = () => {
    if (!sliderRef.current) return;
    const isH2 = sliderRef.current.scrollLeft > sliderRef.current.clientWidth / 2;
    const nextTab = isH2 ? 2 : 1;
    if (nextTab !== tabHoja) {
      setMenuBorrarAbierto(false);
      setTabHoja(nextTab);
    }
  };

  const dispararConfirmacionVisual = () => {
    setConfirmacionLimpio(true);
    setTimeout(() => {
      setConfirmacionLimpio(false);
    }, 600);
  };

  const handleClickBotonBorrar = () => {
    if (tabHoja === 1) {
      // En Hoja 1: despliega el menú rápido de borrado
      vibrarRapido(14);
      setMenuBorrarAbierto(prev => !prev);
    } else {
      // En Hoja 2: limpia directamente el Cierre General en 0.00 ms sin tocar la Hoja 1
      vibrarRapido([20, 30, 20]);
      setMenuBorrarAbierto(false);
      onLimpiarCierreHoja2();
      dispararConfirmacionVisual();
    }
  };

  const handleOpcionHoja1 = (tipo: 'movimientos' | 'inicial') => {
    vibrarRapido([20, 30, 20]);
    setMenuBorrarAbierto(false);
    if (tipo === 'movimientos') {
      onBorrarSoloMovimientos();
    } else {
      onBorrarSaldoInicial();
    }
    dispararConfirmacionVisual();
  };

  return (
    <div id="app-movimientos" className="w-full h-full overflow-hidden select-none">
      <div className="hojas-locales-wrapper">
        {/* TOP BAR */}
        <div className="top-bar-hojas">
          <button type="button" className="btn-volver-hojas" onClick={onVolver}>
            <span>← Volver</span>
          </button>

          <div className="titulo-barra-hojas">HOJAS BCP</div>

          <div className="acciones-barra-hojas" ref={accionesRef}>
            <button
              type="button"
              id="btnBorrarContextualHojas"
              className={`btn-borrar-hojas ${confirmacionLimpio ? 'confirmado-limpio' : ''}`}
              onClick={handleClickBotonBorrar}
              title={
                tabHoja === 1
                  ? 'Opciones de borrado rápido de Hoja 1'
                  : 'Limpiar Cierre General (Hoja 2) en 0.00 ms'
              }
            >
              <span>{confirmacionLimpio ? '✅ LIMPIO' : '🗑️ BORRAR'}</span>
            </button>

            <button
              type="button"
              id="btnDescargarExcelXlsx"
              className="btn-descargar-excel"
              onClick={onExportExcel}
              title="Compartir o descargar archivo .xlsx nativo"
            >
              <span>📥 EXCEL</span>
            </button>

            {menuBorrarAbierto && tabHoja === 1 && (
              <div className="dropdown-borrar-hoja1" id="menuDesplegableBorrarHoja1">
                <button
                  type="button"
                  className="item-dropdown-borrar"
                  onClick={() => handleOpcionHoja1('movimientos')}
                >
                  <span className="item-dropdown-title">🧹 Borrar Solo Movimientos</span>
                  <span className="item-dropdown-sub">Conserva intacto el Efectivo Inicial</span>
                </button>
                <button
                  type="button"
                  className="item-dropdown-borrar danger-item"
                  onClick={() => handleOpcionHoja1('inicial')}
                >
                  <span className="item-dropdown-title">💰 Borrar Efectivo Inicial</span>
                  <span className="item-dropdown-sub">Conserva las filas de movimientos</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="tabs-hojas-locales">
          <button
            type="button"
            className={`tab-hoja-btn ${tabHoja === 1 ? 'active' : ''}`}
            id="btnTabHoja1"
            onClick={() => switchTab(1)}
          >
            <span>📊 Hoja 1: Movimientos</span>
          </button>
          <button
            type="button"
            className={`tab-hoja-btn ${tabHoja === 2 ? 'active' : ''}`}
            id="btnTabHoja2"
            onClick={() => switchTab(2)}
          >
            <span>📋 Hoja 2: Cierre General</span>
          </button>
        </div>

        {/* SLIDER VIEWS */}
        <div
          className="slider-hojas-locales"
          id="sliderHojasLocales"
          ref={sliderRef}
          onScroll={handleSliderScroll}
        >
          {/* HOJA 1: MOVIMIENTOS */}
          <div className="vista-hoja-individual" id="vistaHoja1">
            <div className="resumen-saldos-hoja1">
              <div className="card-saldo-hoja1 card-saldo-inicial">
                <span className="lbl-card-hoja1">Efectivo Inicial</span>
                <span className="val-card-hoja1" id="lblHoja1EfectivoInicial">
                  {hoja1Data.tieneEfectivoInicial
                    ? formatoMonedaConPrefijo(hoja1Data.efectivoInicialCentimos / 100)
                    : 'S/ 0.00'}
                </span>
              </div>
              <div className="card-saldo-hoja1 card-saldo-actual">
                <span className="lbl-card-hoja1">Efectivo Actual</span>
                <span className="val-card-hoja1" id="lblHoja1EfectivoActual">
                  {estadoMovsActivo
                    ? formatoMonedaConPrefijo(actualSoles)
                    : 'S/ 0.00'}
                </span>
              </div>
            </div>

            <div className="contenedor-tabla-hoja">
              <table className="tabla-bcp-local">
                <thead>
                  <tr>
                    <th style={{ width: '36px' }}>N°</th>
                    <th>FECHA</th>
                    <th>HORA</th>
                    <th style={{ textAlign: 'left' }}>DETALLE</th>
                    <th style={{ textAlign: 'right', paddingRight: '8px' }}>MOVIMIENTO</th>
                  </tr>
                </thead>
                <tbody id="tbodyMovimientosHoja1">
                  {hoja1Data.movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="fila-vacia-aviso">
                        Aún no hay operaciones registradas en la Hoja 1.
                      </td>
                    </tr>
                  ) : (
                    hoja1Data.movimientos.map((mov, idx) => {
                      const montoSoles = (mov.montoCentimos || 0) / 100;
                      const claseColor = montoSoles < 0 ? 'monto-negativo-rojo' : 'monto-positivo-negro';
                      return (
                        <tr key={idx}>
                          <td className="col-num-op">{idx + 1}</td>
                          <td className="col-fecha-op">{mov.fecha}</td>
                          <td className="col-hora-op">{mov.hora}</td>
                          <td className="col-detalle-op">{mov.detalle}</td>
                          <td className={`col-monto-op ${claseColor}`}>
                            {formatoNumeroPuroHoja1(montoSoles)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* HOJA 2: CIERRE GENERAL */}
          <div className="vista-hoja-individual" id="vistaHoja2">
            <div className="contenedor-tabla-hoja">
              <table className="tabla-bcp-local tabla-hoja2">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', paddingLeft: '8px' }}>DENOMINACIÓN</th>
                    <th style={{ textAlign: 'center' }}>CANTIDAD</th>
                    <th style={{ textAlign: 'right', paddingRight: '8px' }}>RESULTADO</th>
                  </tr>
                </thead>
                <tbody id="tbodyDetalleCierreHoja2">
                  <tr>
                    <td colSpan={3} className="subtitulo-seccion-hoja2">📦 FAJOS DE S/ 1,000</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Fajos de S/ 1,000</td>
                    <td style={{ textAlign: 'center' }}>{srcH2.f1000}</td>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                      {formatoMonedaConPrefijo(srcH2.f1000 * 1000)}
                    </td>
                  </tr>

                  <tr>
                    <td colSpan={3} className="subtitulo-seccion-hoja2">💵 BILLETES SUELTOS</td>
                  </tr>
                  {([
                    { label: 'Billetes de S/ 200', cant: srcH2.b200, mult: 200 },
                    { label: 'Billetes de S/ 100', cant: srcH2.b100, mult: 100 },
                    { label: 'Billetes de S/ 50', cant: srcH2.b50, mult: 50 },
                    { label: 'Billetes de S/ 20', cant: srcH2.b20, mult: 20 },
                    { label: 'Billetes de S/ 10', cant: srcH2.b10, mult: 10 },
                  ]).map(item => (
                    <tr key={item.label}>
                      <td style={{ fontWeight: 700 }}>{item.label}</td>
                      <td style={{ textAlign: 'center' }}>{item.cant}</td>
                      <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                        {formatoMonedaConPrefijo(item.cant * item.mult)}
                      </td>
                    </tr>
                  ))}

                  <tr>
                    <td colSpan={3} className="subtitulo-seccion-hoja2">🪙 MONEDAS</td>
                  </tr>
                  {([
                    { label: 'Monedas de S/ 5.00', cant: srcH2.m5, mult: 5 },
                    { label: 'Monedas de S/ 2.00', cant: srcH2.m2, mult: 2 },
                    { label: 'Monedas de S/ 1.00', cant: srcH2.m1, mult: 1 },
                    { label: 'Monedas de S/ 0.50', cant: srcH2.m050, mult: 0.5 },
                    { label: 'Monedas de S/ 0.20', cant: srcH2.m020, mult: 0.2 },
                    { label: 'Monedas de S/ 0.10', cant: srcH2.m010, mult: 0.1 },
                  ]).map(item => (
                    <tr key={item.label}>
                      <td style={{ fontWeight: 700 }}>{item.label}</td>
                      <td style={{ textAlign: 'center' }}>{item.cant}</td>
                      <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                        {formatoMonedaConPrefijo(item.cant * item.mult)}
                      </td>
                    </tr>
                  ))}

                  <tr>
                    <td colSpan={3} className="subtitulo-seccion-hoja2">🏦 CUADRE FINAL DE CIERRE</td>
                  </tr>
                  <tr className="fila-cuadre-hoja2">
                    <td colSpan={2}>TOTAL EFECTIVO</td>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                      {formatoMonedaConPrefijo(srcH2.totalEfectivoSoles)}
                    </td>
                  </tr>
                  <tr className="fila-cuadre-hoja2">
                    <td colSpan={2}>SALDO DEL SISTEMA</td>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                      {formatoMonedaConPrefijo(srcH2.saldoSistemaSoles)}
                    </td>
                  </tr>
                  <tr className="fila-cuadre-hoja2 fila-cuadre-destacada">
                    <td colSpan={2}>CAPITAL TOTAL (E + S)</td>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                      {formatoMonedaConPrefijo(srcH2.capitalTotalSoles)}
                    </td>
                  </tr>
                  <tr className="fila-cuadre-hoja2">
                    <td colSpan={2}>CAPITAL BASE REQUERIDO</td>
                    <td style={{ textAlign: 'right', paddingRight: '8px' }}>
                      {formatoMonedaConPrefijo(srcH2.capitalBaseSoles)}
                    </td>
                  </tr>
                  <tr className="fila-cuadre-hoja2">
                    <td colSpan={2} style={{ color: difColor, fontWeight: 900 }}>
                      DIFERENCIA (FALTA / SOBRA)
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '8px', color: difColor, fontWeight: 900 }}>
                      {formatoMonedaConPrefijo(srcH2.diferenciaSoles)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
