import React, { useRef, useEffect } from 'react';
import { ModoOperacion, DatosCajaModos } from '../types';
import { formatoSoles, parseValorCentimosTexto, formatInputString } from '../utils/formatters';
import { SignalIcon } from '../utils/svgIcons';

interface CajaViewProps {
  modoOperacion: ModoOperacion;
  setModoOperacion: (modo: ModoOperacion) => void;
  datosSuperior: DatosCajaModos;
  setDatosSuperior: React.Dispatch<React.SetStateAction<DatosCajaModos>>;
  datosInferior: DatosCajaModos;
  setDatosInferior: React.Dispatch<React.SetStateAction<DatosCajaModos>>;
  cuadroVinculado: string | null;
  ordenModosConDatos: ModoOperacion[];
  registrarModoEnOrden: (modo: ModoOperacion) => void;
  onEjecutarEnterCaja: () => void;
  ultimoInputCajaActivoRef: React.MutableRefObject<string | null>;
  badgeConfirmacionTexto: string | null;
}

export const CajaView: React.FC<CajaViewProps> = ({
  modoOperacion,
  setModoOperacion,
  datosSuperior,
  setDatosSuperior,
  datosInferior,
  setDatosInferior,
  cuadroVinculado,
  ordenModosConDatos,
  registrarModoEnOrden,
  onEjecutarEnterCaja,
  ultimoInputCajaActivoRef,
  badgeConfirmacionTexto,
}) => {
  const swipeSupRef = useRef<HTMLDivElement>(null);
  const swipeInfRef = useRef<HTMLDivElement>(null);
  const [pagSup, setPagSup] = React.useState<number>(1);
  const [pagInf, setPagInf] = React.useState<number>(1);

  const datosSupActual = datosSuperior[modoOperacion];
  const datosInfActual = datosInferior[modoOperacion];

  // Expansion calculations
  const sup1a4Llenos = ['b1', 'b2', 'b3', 'b4'].every(id => (datosSupActual[id] || '').trim() !== '');
  const sup5o6ConDato = ['b5', 'b6'].some(id => (datosSupActual[id] || '').trim() !== '');
  const expandirSup = sup1a4Llenos || sup5o6ConDato;

  const inf1a4Llenos = ['p1', 'p2', 'p3', 'p4'].every(id => (datosInfActual[id] || '').trim() !== '');
  const inf5o6ConDato = ['p5', 'p6'].some(id => (datosInfActual[id] || '').trim() !== '');
  const expandirInf = inf1a4Llenos || inf5o6ConDato;

  // Totals calculations
  let centimosSuperior = 0;
  let centimosSupPag2 = 0;
  for (let i = 1; i <= 10; i++) {
    const v = parseValorCentimosTexto(datosSupActual['b' + i]);
    centimosSuperior += v;
    if (i >= 7) centimosSupPag2 += v;
  }

  let centimosInferior = 0;
  let centimosInfPag2 = 0;
  for (let i = 1; i <= 10; i++) {
    const v = parseValorCentimosTexto(datosInfActual['p' + i]);
    centimosInferior += v;
    if (i >= 7) centimosInfPag2 += v;
  }

  const totalSuperior = centimosSuperior / 100;
  const totalInferior = centimosInferior / 100;

  // Determine resultado panel state
  let estadoClave = 'esperando';
  let signalIcon = 'esperando';
  let mensajeTexto = 'ESPERANDO MONTOS...';
  let valorFormateado = '0.00';

  if (modoOperacion === 'recibo') {
    const difCentimos = centimosSuperior - centimosInferior;
    if (centimosInferior === 0 && centimosSuperior === 0) {
      estadoClave = 'esperando';
      signalIcon = 'esperando';
      mensajeTexto = 'ESPERANDO MONTOS...';
      valorFormateado = '0.00';
    } else if (centimosInferior === 0 && centimosSuperior > 0) {
      estadoClave = 'proceso';
      signalIcon = 'mano';
      mensajeTexto = 'EFECTIVO RECIBIDO';
      valorFormateado = formatoSoles(totalSuperior);
    } else if (centimosInferior > 0 && centimosSuperior === 0) {
      estadoClave = 'cobrar';
      signalIcon = 'cobrar';
      mensajeTexto = 'FALTA QUE TE PAGUE';
      valorFormateado = formatoSoles(totalInferior);
    } else if (difCentimos === 0) {
      estadoClave = 'exacto';
      signalIcon = 'exacto';
      mensajeTexto = 'PAGO EXACTO CONFORME';
      valorFormateado = formatoSoles(0);
    } else if (difCentimos < 0) {
      estadoClave = 'faltante';
      signalIcon = 'faltante';
      mensajeTexto = 'FALTA QUE TE PAGUE';
      valorFormateado = formatoSoles(Math.abs(difCentimos) / 100);
    } else {
      estadoClave = 'vuelto';
      signalIcon = 'vuelto';
      mensajeTexto = 'VUELTO PARA EL CLIENTE';
      valorFormateado = formatoSoles(difCentimos / 100);
    }
  } else if (modoOperacion === 'retiro') {
    if (centimosInferior === 0 && centimosSuperior === 0) {
      estadoClave = 'esperando';
      signalIcon = 'esperando';
      mensajeTexto = 'ESPERANDO RETIRO...';
      valorFormateado = '0.00';
    } else if (centimosInferior > 0 && centimosSuperior === 0) {
      estadoClave = 'retiro';
      signalIcon = 'mano';
      mensajeTexto = 'DINERO CONTADO EN MANO';
      valorFormateado = formatoSoles(totalInferior);
    } else if (centimosSuperior > 0 && centimosInferior === 0) {
      estadoClave = 'proceso';
      signalIcon = 'entregar';
      mensajeTexto = 'MONTO POR ENTREGAR';
      valorFormateado = formatoSoles(totalSuperior);
    } else {
      const difRetiroCentimos = centimosSuperior - centimosInferior;
      if (difRetiroCentimos === 0) {
        estadoClave = 'exacto';
        signalIcon = 'exacto';
        mensajeTexto = 'MONTO EXACTO A ENTREGAR';
        valorFormateado = formatoSoles(0);
      } else if (difRetiroCentimos > 0) {
        estadoClave = 'faltante-entregar';
        signalIcon = 'entregar';
        mensajeTexto = 'FALTA ENTREGAR AL CLIENTE';
        valorFormateado = formatoSoles(difRetiroCentimos / 100);
      } else {
        estadoClave = 'peligro-mas';
        signalIcon = 'peligro';
        mensajeTexto = '¡CUIDADO! DAS DE MÁS';
        valorFormateado = formatoSoles(Math.abs(difRetiroCentimos) / 100);
      }
    }
  } else {
    // deposito
    if (centimosInferior === 0 && centimosSuperior === 0) {
      estadoClave = 'esperando';
      signalIcon = 'esperando';
      mensajeTexto = 'ESPERANDO DEPÓSITO...';
      valorFormateado = '0.00';
    } else if (centimosSuperior > 0 && centimosInferior === 0) {
      estadoClave = 'exacto';
      signalIcon = 'exacto';
      mensajeTexto = 'DEPÓSITO DIRECTO (SIN VUELTO)';
      valorFormateado = formatoSoles(totalSuperior);
    } else if (centimosSuperior === 0 && centimosInferior > 0) {
      estadoClave = 'deposito';
      signalIcon = 'mano';
      mensajeTexto = 'DINERO CONTADO EN MANO';
      valorFormateado = formatoSoles(totalInferior);
    } else {
      const balanceDepositoCentimos = centimosInferior - centimosSuperior;
      if (balanceDepositoCentimos === 0) {
        estadoClave = 'exacto';
        signalIcon = 'exacto';
        mensajeTexto = 'DEPÓSITO EXACTO CONFORME';
        valorFormateado = formatoSoles(0);
      } else if (balanceDepositoCentimos > 0) {
        estadoClave = 'vuelto';
        signalIcon = 'vuelto';
        mensajeTexto = 'VUELTO PARA EL CLIENTE';
        valorFormateado = formatoSoles(balanceDepositoCentimos / 100);
      } else {
        estadoClave = 'faltante';
        signalIcon = 'faltante';
        mensajeTexto = 'FALTA QUE TE PAGUE';
        valorFormateado = formatoSoles(Math.abs(balanceDepositoCentimos) / 100);
      }
    }
  }

  // Check pending operations on other modes
  const tieneDatosModo = (m: ModoOperacion) => {
    let cSup = 0, cInf = 0;
    for (let i = 1; i <= 10; i++) {
      cSup += parseValorCentimosTexto(datosSuperior[m]['b' + i]);
      cInf += parseValorCentimosTexto(datosInferior[m]['p' + i]);
    }
    return (cSup > 0 || cInf > 0);
  };

  const pendingDeposito = modoOperacion !== 'deposito' && tieneDatosModo('deposito');
  const pendingServicio = modoOperacion !== 'recibo' && tieneDatosModo('recibo');
  const pendingRetiro = modoOperacion !== 'retiro' && tieneDatosModo('retiro');

  const handleInputChange = (field: string, isSuperior: boolean, rawValue: string) => {
    const formatted = formatInputString(rawValue);
    ultimoInputCajaActivoRef.current = field;
    registrarModoEnOrden(modoOperacion);

    if (isSuperior) {
      setDatosSuperior(prev => ({
        ...prev,
        [modoOperacion]: {
          ...prev[modoOperacion],
          [field]: formatted,
        },
      }));
    } else {
      setDatosInferior(prev => ({
        ...prev,
        [modoOperacion]: {
          ...prev[modoOperacion],
          [field]: formatted,
        },
      }));
    }
  };

  const handleScrollIndicators = (container: HTMLDivElement | null, setPag: (p: number) => void) => {
    if (!container) return;
    const isP2 = container.scrollLeft > container.clientWidth / 2;
    setPag(isP2 ? 2 : 1);
  };

  const scrollToPage = (ref: React.RefObject<HTMLDivElement | null>, page: number) => {
    if (!ref.current) return;
    ref.current.scrollTo({ left: page === 1 ? 0 : ref.current.clientWidth, behavior: 'smooth' });
  };

  const getThemeClasses = () => {
    if (modoOperacion === 'recibo') {
      return {
        header: 'tema-recibo-header',
        cajaBg: 'tema-recibo-bg',
        tituloSup: 'EFECTIVO RECIBIDO',
        tituloInf: 'RECIBO POR PAGAR',
        badge: 'PAGO DE SERVICIOS / RECIBO',
      };
    } else if (modoOperacion === 'retiro') {
      return {
        header: 'tema-retiro-header',
        cajaBg: 'tema-retiro-bg',
        tituloSup: 'MONTO POR RETIRAR',
        tituloInf: 'EFECTIVO RETIRADO',
        badge: 'RETIRO EN EFECTIVO',
      };
    } else {
      return {
        header: 'tema-deposito-header',
        cajaBg: 'tema-deposito-bg',
        tituloSup: 'MONTO A DEPOSITAR',
        tituloInf: 'EFECTIVO RECIBIDO',
        badge: 'DEPÓSITO EN CUENTA',
      };
    }
  };

  const theme = getThemeClasses();

  return (
    <div id="app-caja" className="w-full h-full overflow-hidden select-none">
      <form
        onSubmit={e => {
          e.preventDefault();
          onEjecutarEnterCaja();
        }}
        className="h-full flex flex-col justify-start"
      >
        <div className="caja-wrapper">
          {/* BLOQUE SUPERIOR */}
          <div className={`panel-total ${theme.header}`} id="panelSuperior">
            <div className="panel-title-area">
              <span id="lblTituloSuperior">{theme.tituloSup}</span>
              <div className="header-dots">
                <div
                  className={`h-dot ${pagSup === 1 ? 'active' : ''}`}
                  onClick={() => scrollToPage(swipeSupRef, 1)}
                />
                <div
                  className={`h-dot ${pagSup === 2 ? 'active' : ''} ${centimosSupPag2 > 0 ? 'has-data' : ''}`}
                  onClick={() => scrollToPage(swipeSupRef, 2)}
                />
              </div>
            </div>
            <span id="lblEfectivo">{formatoSoles(totalSuperior)}</span>
          </div>

          <div
            className={`caja-contenedor ${theme.cajaBg} ${expandirSup ? 'bloque-con-6' : ''}`}
            id="cajaSuperiorContenedor"
          >
            <div
              className="contenedor-deslizable"
              ref={swipeSupRef}
              onScroll={() => handleScrollIndicators(swipeSupRef.current, setPagSup)}
            >
              {/* Página 1: b1..b4 + b5, b6 expandibles */}
              <div className="pagina-deslizable">
                <div className="grid-2">
                  {(['b1', 'b2', 'b3', 'b4'] as const).map(id => {
                    const isSynced = cuadroVinculado === id;
                    let syncClass = '';
                    if (isSynced) {
                      syncClass = 'active-sync';
                    }
                    return (
                      <input
                        key={id}
                        id={id}
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="send"
                        className={syncClass}
                        readOnly={isSynced}
                        value={datosSupActual[id] || ''}
                        onFocus={() => { ultimoInputCajaActivoRef.current = id; }}
                        onChange={e => handleInputChange(id, true, e.target.value)}
                        placeholder="0.00"
                      />
                    );
                  })}
                </div>
                <div className={`fila-extra-expandible ${expandirSup ? 'activa' : ''}`}>
                  {(['b5', 'b6'] as const).map(id => {
                    const isSynced = cuadroVinculado === id;
                    return (
                      <input
                        key={id}
                        id={id}
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="send"
                        className={isSynced ? 'active-sync' : ''}
                        readOnly={isSynced}
                        value={datosSupActual[id] || ''}
                        onFocus={() => { ultimoInputCajaActivoRef.current = id; }}
                        onChange={e => handleInputChange(id, true, e.target.value)}
                        placeholder="0.00"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Página 2: b7..b10 */}
              <div className="pagina-deslizable">
                <div className="grid-2">
                  {(['b7', 'b8', 'b9', 'b10'] as const).map(id => {
                    const isSynced = cuadroVinculado === id;
                    return (
                      <input
                        key={id}
                        id={id}
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="send"
                        className={isSynced ? 'active-sync' : ''}
                        readOnly={isSynced}
                        value={datosSupActual[id] || ''}
                        onFocus={() => { ultimoInputCajaActivoRef.current = id; }}
                        onChange={e => handleInputChange(id, true, e.target.value)}
                        placeholder="0.00"
                      />
                    );
                  })}
                </div>
                <span className="badge-pagina-dos">PÁG. 2</span>
              </div>
            </div>
          </div>

          {/* BLOQUE INFERIOR */}
          <div className={`panel-total ${theme.header}`} id="panelModoSecundario">
            <div className="panel-title-area">
              <span id="lblTituloModo">{theme.tituloInf}</span>
              <div className="header-dots">
                <div
                  className={`h-dot ${pagInf === 1 ? 'active' : ''}`}
                  onClick={() => scrollToPage(swipeInfRef, 1)}
                />
                <div
                  className={`h-dot ${pagInf === 2 ? 'active' : ''} ${centimosInfPag2 > 0 ? 'has-data' : ''}`}
                  onClick={() => scrollToPage(swipeInfRef, 2)}
                />
              </div>
            </div>
            <span id="lblRecibo">{formatoSoles(totalInferior)}</span>
          </div>

          <div
            className={`caja-contenedor ${theme.cajaBg} ${expandirInf ? 'bloque-con-6' : ''}`}
            id="cajaInferiorContenedor"
          >
            <div
              className="contenedor-deslizable"
              ref={swipeInfRef}
              onScroll={() => handleScrollIndicators(swipeInfRef.current, setPagInf)}
            >
              {/* Página 1: p1..p4 + p5, p6 expandibles */}
              <div className="pagina-deslizable">
                <div className="grid-2">
                  {(['p1', 'p2', 'p3', 'p4'] as const).map(id => {
                    const isSynced = cuadroVinculado === id;
                    let syncClass = '';
                    if (isSynced) {
                      syncClass = modoOperacion === 'deposito'
                        ? 'active-sync-deposito'
                        : (modoOperacion === 'retiro' ? 'active-sync-retiro' : 'active-sync');
                    }
                    return (
                      <input
                        key={id}
                        id={id}
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="send"
                        className={syncClass}
                        readOnly={isSynced}
                        value={datosInfActual[id] || ''}
                        onFocus={() => { ultimoInputCajaActivoRef.current = id; }}
                        onChange={e => handleInputChange(id, false, e.target.value)}
                        placeholder="0.00"
                      />
                    );
                  })}
                </div>
                <div className={`fila-extra-expandible ${expandirInf ? 'activa' : ''}`}>
                  {(['p5', 'p6'] as const).map(id => {
                    const isSynced = cuadroVinculado === id;
                    let syncClass = '';
                    if (isSynced) {
                      syncClass = modoOperacion === 'deposito'
                        ? 'active-sync-deposito'
                        : (modoOperacion === 'retiro' ? 'active-sync-retiro' : 'active-sync');
                    }
                    return (
                      <input
                        key={id}
                        id={id}
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="send"
                        className={syncClass}
                        readOnly={isSynced}
                        value={datosInfActual[id] || ''}
                        onFocus={() => { ultimoInputCajaActivoRef.current = id; }}
                        onChange={e => handleInputChange(id, false, e.target.value)}
                        placeholder="0.00"
                      />
                    );
                  })}
                </div>
              </div>

              {/* Página 2: p7..p10 */}
              <div className="pagina-deslizable">
                <div className="grid-2">
                  {(['p7', 'p8', 'p9', 'p10'] as const).map(id => {
                    const isSynced = cuadroVinculado === id;
                    let syncClass = '';
                    if (isSynced) {
                      syncClass = modoOperacion === 'deposito'
                        ? 'active-sync-deposito'
                        : (modoOperacion === 'retiro' ? 'active-sync-retiro' : 'active-sync');
                    }
                    return (
                      <input
                        key={id}
                        id={id}
                        type="text"
                        inputMode="decimal"
                        enterKeyHint="send"
                        className={syncClass}
                        readOnly={isSynced}
                        value={datosInfActual[id] || ''}
                        onFocus={() => { ultimoInputCajaActivoRef.current = id; }}
                        onChange={e => handleInputChange(id, false, e.target.value)}
                        placeholder="0.00"
                      />
                    );
                  })}
                </div>
                <span className="badge-pagina-dos">PÁG. 2</span>
              </div>
            </div>
          </div>

          {/* PANEL DE RESULTADO CAJA */}
          <div className={`panel-resultado estado-${estadoClave}`} id="panelFinal">
            <div className="badge-operacion" id="badgeOperacion">
              {badgeConfirmacionTexto || theme.badge}
            </div>
            <div className="texto-final-expresivo" id="textoFinal">
              <span className="sig-wing wing-left">
                <SignalIcon name={signalIcon} />
              </span>
              <span>{mensajeTexto}</span>
              <span className="sig-wing wing-right">
                <SignalIcon name={signalIcon} />
              </span>
            </div>
            <span className="monto-final" id="montoFinal">
              {valorFormateado}
            </span>
          </div>

          {/* SELECTOR DE MODOS */}
          <div className="selector-modos-grid" id="gridSelectorModos">
            <button
              type="button"
              className={`btn-modo-operacion ${modoOperacion === 'deposito' ? 'active-modo' : ''} ${pendingDeposito ? 'tiene-operacion-pendiente' : ''}`}
              id="btn-modo-deposito"
              onClick={() => setModoOperacion('deposito')}
            >
              DEPÓSITO
            </button>
            <button
              type="button"
              className={`btn-modo-operacion ${modoOperacion === 'recibo' ? 'active-modo' : ''} ${pendingServicio ? 'tiene-operacion-pendiente' : ''}`}
              id="btn-modo-servicio"
              onClick={() => setModoOperacion('recibo')}
            >
              SERVICIO
            </button>
            <button
              type="button"
              className={`btn-modo-operacion ${modoOperacion === 'retiro' ? 'active-modo' : ''} ${pendingRetiro ? 'tiene-operacion-pendiente' : ''}`}
              id="btn-modo-retiro"
              onClick={() => setModoOperacion('retiro')}
            >
              RETIRO
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
