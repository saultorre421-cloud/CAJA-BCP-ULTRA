import React, { useState, useEffect, useRef } from 'react';
import {
  ModoOperacion,
  ContextoPrincipal,
  ScreenApp,
  Hoja1Data,
  Hoja2Data,
  DatosCajaModos,
  MapBilletes,
  MapMonedas,
} from './types';
import {
  crearMapa10Cuadros,
  parseValorCentimosTexto,
  formatInputString,
  vibrarRapido,
  DENOMINACIONES_BILLETES,
  DENOMINACIONES_MONEDAS,
} from './utils/formatters';
import { generarYCompartirExcelXlsx } from './utils/xlsxExporter';
import { CajaView } from './components/CajaView';
import { CierreView } from './components/CierreView';
import { MultiplicadorView } from './components/MultiplicadorView';
import { HojasLocalesView } from './components/HojasLocalesView';
import { AjustesModal } from './components/AjustesModal';
import { FloatingControls } from './components/FloatingControls';

export const App: React.FC = () => {
  // Navigation
  const [currentScreen, setCurrentScreen] = useState<ScreenApp>('app-caja');
  const [contextoPrincipal, setContextoPrincipal] = useState<ContextoPrincipal>(() => {
    return (localStorage.getItem('bcp_contexto_activo') as ContextoPrincipal) || 'caja';
  });

  // Settings Modal
  const [modalAjustesOpen, setModalAjustesOpen] = useState(false);
  const [modalAjustesTab, setModalAjustesTab] = useState<'caja' | 'cierre'>('caja');

  // Persistence: Guardar Movimientos Switch
  const [guardarMovimientosActivo, setGuardarMovimientosActivo] = useState<boolean>(() => {
    const raw = localStorage.getItem('bcp_sync_movimientos');
    return raw === null ? true : raw === 'true';
  });

  // Persistence: Capital Base
  const [capitalBase, setCapitalBase] = useState<number>(() => {
    return parseFloat(localStorage.getItem('bcp_capital_base') || '') || 26729.00;
  });

  // Persistence: Hoja 1 and Hoja 2 Local Data
  const [hoja1Data, setHoja1Data] = useState<Hoja1Data>(() => {
    try {
      const raw = localStorage.getItem('bcp_local_hoja1_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          tieneEfectivoInicial: !!parsed.tieneEfectivoInicial,
          efectivoInicialCentimos: parseInt(parsed.efectivoInicialCentimos) || 0,
          movimientos: Array.isArray(parsed.movimientos) ? parsed.movimientos : [],
        };
      }
    } catch (e) {
      console.warn('Error cargando hoja 1:', e);
    }
    return { tieneEfectivoInicial: false, efectivoInicialCentimos: 0, movimientos: [] };
  });

  const [hoja2Data, setHoja2Data] = useState<Hoja2Data | null>(() => {
    try {
      const raw = localStorage.getItem('bcp_local_hoja2_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error cargando hoja 2:', e);
    }
    return null;
  });

  // State: Caja Principal
  const [modoOperacion, setModoOperacion] = useState<ModoOperacion>(() => {
    return (localStorage.getItem('bcp_modo_operacion') as ModoOperacion) || 'recibo';
  });

  const [ordenModosConDatos, setOrdenModosConDatos] = useState<ModoOperacion[]>(['recibo', 'deposito', 'retiro']);
  const [cuadroVinculado, setCuadroVinculado] = useState<string | null>(null);
  const [badgeConfirmacionCaja, setBadgeConfirmacionCaja] = useState<string | null>(null);

  const [datosSuperior, setDatosSuperior] = useState<DatosCajaModos>(() => {
    try {
      const raw = localStorage.getItem('bcp_estado_blindado_v4');
      if (raw) {
        const est = JSON.parse(raw);
        if (est.datosSuperior) return est.datosSuperior;
      }
    } catch {}
    return {
      recibo: crearMapa10Cuadros('b'),
      retiro: crearMapa10Cuadros('b'),
      deposito: crearMapa10Cuadros('b'),
    };
  });

  const [datosInferior, setDatosInferior] = useState<DatosCajaModos>(() => {
    try {
      const raw = localStorage.getItem('bcp_estado_blindado_v4');
      if (raw) {
        const est = JSON.parse(raw);
        if (est.datosInferior) return est.datosInferior;
      }
    } catch {}
    return {
      recibo: crearMapa10Cuadros('p'),
      retiro: crearMapa10Cuadros('p'),
      deposito: crearMapa10Cuadros('p'),
    };
  });

  // State: Cierre de Caja
  const [cantF1000, setCantF1000] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('bcp_estado_blindado_v4');
      if (raw) {
        const est = JSON.parse(raw);
        if (typeof est.cantF1000 === 'number') return est.cantF1000;
      }
    } catch {}
    return 0;
  });

  const [inputSistema, setInputSistema] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('bcp_estado_blindado_v4');
      if (raw) {
        const est = JSON.parse(raw);
        if (est.inputSistema) return est.inputSistema;
      }
    } catch {}
    return '';
  });

  const [confirmacionCierreTexto, setConfirmacionCierreTexto] = useState<{
    msg: string;
    monto: string;
    estado: string;
  } | null>(null);

  // Separate Cash Counts for Caja and Cierre
  const [billetesCaja, setBilletesCaja] = useState<MapBilletes>(() => {
    const init: MapBilletes = {};
    DENOMINACIONES_BILLETES.forEach(d => { init[d] = 0; });
    return init;
  });

  const [monedasCaja, setMonedasCaja] = useState<MapMonedas>(() => {
    const init: MapMonedas = {};
    DENOMINACIONES_MONEDAS.forEach(d => { init[d] = 0; });
    return init;
  });

  const [billetesCierre, setBilletesCierre] = useState<MapBilletes>(() => {
    const init: MapBilletes = {};
    DENOMINACIONES_BILLETES.forEach(d => { init[d] = 0; });
    return init;
  });

  const [monedasCierre, setMonedasCierre] = useState<MapMonedas>(() => {
    const init: MapMonedas = {};
    DENOMINACIONES_MONEDAS.forEach(d => { init[d] = 0; });
    return init;
  });

  // Focus tracking refs
  const ultimoInputCajaActivoRef = useRef<string | null>(null);
  const ultimoInputCierreActivoRef = useRef<string>('input-sistema');
  const timestampUltimoEnterRef = useRef<number>(0);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('bcp_contexto_activo', contextoPrincipal);
  }, [contextoPrincipal]);

  useEffect(() => {
    localStorage.setItem('bcp_modo_operacion', modoOperacion);
  }, [modoOperacion]);

  useEffect(() => {
    localStorage.setItem('bcp_capital_base', capitalBase.toFixed(2));
  }, [capitalBase]);

  useEffect(() => {
    localStorage.setItem('bcp_sync_movimientos', guardarMovimientosActivo ? 'true' : 'false');
  }, [guardarMovimientosActivo]);

  useEffect(() => {
    localStorage.setItem('bcp_local_hoja1_v1', JSON.stringify(hoja1Data));
  }, [hoja1Data]);

  useEffect(() => {
    if (hoja2Data) {
      localStorage.setItem('bcp_local_hoja2_v1', JSON.stringify(hoja2Data));
    } else {
      localStorage.removeItem('bcp_local_hoja2_v1');
    }
  }, [hoja2Data]);

  useEffect(() => {
    try {
      const estado = {
        modoOperacion,
        ordenModosConDatos,
        datosSuperior,
        datosInferior,
        cuadroVinculado,
        billetesCaja,
        monedasCaja,
        billetesCierre,
        monedasCierre,
        cantF1000,
        inputSistema,
      };
      localStorage.setItem('bcp_estado_blindado_v4', JSON.stringify(estado));
    } catch {}
  }, [
    modoOperacion,
    ordenModosConDatos,
    datosSuperior,
    datosInferior,
    cuadroVinculado,
    billetesCaja,
    monedasCaja,
    billetesCierre,
    monedasCierre,
    cantF1000,
    inputSistema,
  ]);

  // Synchronize counting in multiplicador into Caja or Cierre
  useEffect(() => {
    if (contextoPrincipal === 'caja') {
      let centB = 0, centM = 0;
      DENOMINACIONES_BILLETES.forEach(d => {
        centB += Math.round(d * 100) * (billetesCaja[d] || 0);
      });
      DENOMINACIONES_MONEDAS.forEach(d => {
        centM += Math.round(d * 100) * (monedasCaja[d] || 0);
      });
      const granTotal = (centB + centM) / 100;

      if (granTotal > 0) {
        const listaOpciones = (modoOperacion === 'retiro' || modoOperacion === 'deposito')
          ? ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10']
          : ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10'];

        let targetId = cuadroVinculado;
        if (!targetId || !listaOpciones.includes(targetId)) {
          const mapaValores = (modoOperacion === 'retiro' || modoOperacion === 'deposito')
            ? datosInferior[modoOperacion]
            : datosSuperior[modoOperacion];

          for (const id of listaOpciones) {
            if (!mapaValores[id] || mapaValores[id].trim() === '') {
              targetId = id;
              break;
            }
          }
          if (!targetId) targetId = listaOpciones[listaOpciones.length - 1];
          setCuadroVinculado(targetId);
        }

        const formatted = formatInputString(granTotal.toFixed(2));
        if (targetId.startsWith('p')) {
          setDatosInferior(prev => ({
            ...prev,
            [modoOperacion]: { ...prev[modoOperacion], [targetId!]: formatted },
          }));
        } else {
          setDatosSuperior(prev => ({
            ...prev,
            [modoOperacion]: { ...prev[modoOperacion], [targetId!]: formatted },
          }));
        }
      } else if (cuadroVinculado) {
        const targetId = cuadroVinculado;
        if (targetId.startsWith('p')) {
          setDatosInferior(prev => ({
            ...prev,
            [modoOperacion]: { ...prev[modoOperacion], [targetId]: '' },
          }));
        } else {
          setDatosSuperior(prev => ({
            ...prev,
            [modoOperacion]: { ...prev[modoOperacion], [targetId]: '' },
          }));
        }
        setCuadroVinculado(null);
      }
    }
  }, [billetesCaja, monedasCaja, modoOperacion, contextoPrincipal]);

  const registrarModoEnOrden = (modo: ModoOperacion) => {
    setOrdenModosConDatos(prev => {
      const filtered = prev.filter(m => m !== modo);
      return [...filtered, modo];
    });
  };

  // Action: Clear Caja
  const handleLimpiarCaja = () => {
    setBilletesCaja(() => {
      const n: MapBilletes = {};
      DENOMINACIONES_BILLETES.forEach(d => { n[d] = 0; });
      return n;
    });
    setMonedasCaja(() => {
      const n: MapMonedas = {};
      DENOMINACIONES_MONEDAS.forEach(d => { n[d] = 0; });
      return n;
    });

    setDatosSuperior({
      recibo: crearMapa10Cuadros('b'),
      retiro: crearMapa10Cuadros('b'),
      deposito: crearMapa10Cuadros('b'),
    });
    setDatosInferior({
      recibo: crearMapa10Cuadros('p'),
      retiro: crearMapa10Cuadros('p'),
      deposito: crearMapa10Cuadros('p'),
    });
    setCuadroVinculado(null);
    ultimoInputCajaActivoRef.current = null;
    vibrarRapido();
  };

  // Action: Save Caja with Enter (saving all hooked modes in sequence)
  const handleEjecutarEnterCaja = () => {
    const ahoraMs = Date.now();
    if (ahoraMs - timestampUltimoEnterRef.current < 220) return;
    timestampUltimoEnterRef.current = ahoraMs;

    const ahora = new Date();
    const fechaStr = ahora.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    const secuenciaModos = [...ordenModosConDatos];
    (['recibo', 'deposito', 'retiro'] as const).forEach(m => {
      if (!secuenciaModos.includes(m)) secuenciaModos.push(m);
    });

    const nuevosMovimientos: Array<{ fecha: string; hora: string; detalle: string; montoCentimos: number }> = [];

    if (guardarMovimientosActivo) {
      for (const m of secuenciaModos) {
        let centSup = 0, centInf = 0;
        for (let i = 1; i <= 10; i++) {
          centSup += parseValorCentimosTexto(datosSuperior[m]['b' + i]);
          centInf += parseValorCentimosTexto(datosInferior[m]['p' + i]);
        }
        if (centSup === 0 && centInf === 0) continue;

        let detalleOp = 'PAGO SERVICIO';
        let montoCentimos = 0;

        if (m === 'recibo') {
          detalleOp = 'PAGO SERVICIO';
          montoCentimos = centInf > 0 ? centInf : centSup;
        } else if (m === 'deposito') {
          detalleOp = 'DEPÓSITO';
          montoCentimos = centSup > 0 ? centSup : centInf;
        } else if (m === 'retiro') {
          detalleOp = 'RETIRO';
          montoCentimos = -(centSup > 0 ? centSup : centInf);
        }

        if (montoCentimos !== 0) {
          nuevosMovimientos.push({
            fecha: fechaStr,
            hora: horaStr,
            detalle: detalleOp,
            montoCentimos,
          });
        }
      }

      if (nuevosMovimientos.length > 0) {
        setHoja1Data(prev => ({
          ...prev,
          movimientos: [...prev.movimientos, ...nuevosMovimientos],
        }));
      }
    }

    handleLimpiarCaja();

    if (nuevosMovimientos.length > 0) {
      const msg = nuevosMovimientos.length > 1
        ? `✓ ${nuevosMovimientos.length} OPERACIONES GUARDADAS (0 ms)`
        : `✓ GUARDADO EN MOVIMIENTOS (#${hoja1Data.movimientos.length + nuevosMovimientos.length})`;
      setBadgeConfirmacionCaja(msg);
      setTimeout(() => setBadgeConfirmacionCaja(null), 650);
    }
  };

  // Action: Anular Last Operation
  const handleAnularUltimaOp = () => {
    if (hoja1Data.movimientos.length > 0) {
      setHoja1Data(prev => ({
        ...prev,
        movimientos: prev.movimientos.slice(0, -1),
      }));
      setBadgeConfirmacionCaja('↩️ ÚLTIMA OPERACIÓN ANULADA (0 ms)');
    } else {
      setBadgeConfirmacionCaja('SIN OPERACIONES PARA ANULAR');
    }
    setTimeout(() => setBadgeConfirmacionCaja(null), 850);
  };

  // Action: Save Cierre with Enter
  const handleGuardarCierreConEnter = () => {
    let centB = 0, centM = 0;
    DENOMINACIONES_BILLETES.forEach(d => {
      centB += Math.round(d * 100) * (billetesCierre[d] || 0);
    });
    DENOMINACIONES_MONEDAS.forEach(d => {
      centM += Math.round(d * 100) * (monedasCierre[d] || 0);
    });
    const centFajo = cantF1000 * 100000;
    const totalCentimosManual = centB + centM + centFajo;

    let sumaMovsCentimos = 0;
    for (const mov of hoja1Data.movimientos) {
      sumaMovsCentimos += mov.montoCentimos || 0;
    }
    const inicialCent = hoja1Data.tieneEfectivoInicial ? hoja1Data.efectivoInicialCentimos : 0;
    const actualCentimos = inicialCent + sumaMovsCentimos;

    const rawSistema = inputSistema.replace(/,/g, '').trim();
    const numSistema = parseFloat(rawSistema);
    const tieneSistema = rawSistema !== '' && !isNaN(numSistema);
    const centimosSistema = tieneSistema ? Math.round(numSistema * 100) : 0;

    const centimosEfectivoUsar = totalCentimosManual !== 0
      ? totalCentimosManual
      : (hoja1Data.tieneEfectivoInicial || hoja1Data.movimientos.length > 0 ? actualCentimos : 0);

    if (centimosEfectivoUsar === 0 && !tieneSistema) return;

    if (tieneSistema) {
      const nuevoCierre: Hoja2Data = {
        fechaHora: new Date().toLocaleString('es-PE'),
        f1000: cantF1000,
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
        totalEfectivoSoles: centimosEfectivoUsar / 100,
        saldoSistemaSoles: numSistema,
        capitalTotalSoles: (centimosEfectivoUsar + centimosSistema) / 100,
        capitalBaseSoles: capitalBase,
        diferenciaSoles: ((centimosEfectivoUsar + centimosSistema) - Math.round(capitalBase * 100)) / 100,
      };

      setHoja2Data(nuevoCierre);
      vibrarRapido([18, 25, 18]);
      setConfirmacionCierreTexto({
        msg: '✓ CIERRE GUARDADO EN HOJA 2',
        monto: `S/ ${nuevoCierre.capitalTotalSoles.toFixed(2)}`,
        estado: 'exacto',
      });
    } else {
      const centNuevoInicial = totalCentimosManual !== 0 ? totalCentimosManual : centimosEfectivoUsar;
      setHoja1Data(prev => ({
        ...prev,
        tieneEfectivoInicial: true,
        efectivoInicialCentimos: centNuevoInicial,
      }));
      setGuardarMovimientosActivo(true);

      setCantF1000(0);
      setBilletesCierre(() => {
        const n: MapBilletes = {};
        DENOMINACIONES_BILLETES.forEach(d => { n[d] = 0; });
        return n;
      });
      setMonedasCierre(() => {
        const n: MapMonedas = {};
        DENOMINACIONES_MONEDAS.forEach(d => { n[d] = 0; });
        return n;
      });

      vibrarRapido([18, 25, 18]);
      setConfirmacionCierreTexto({
        msg: '✓ EFECTIVO INICIAL FIJADO EN HOJA 1',
        monto: `S/ ${(centNuevoInicial / 100).toFixed(2)}`,
        estado: 'exacto',
      });
    }

    setTimeout(() => {
      setConfirmacionCierreTexto(null);
    }, 1200);
  };

  // Action: Clear Cierre manual counted inputs
  const handleLimpiarCierreManual = () => {
    setCantF1000(0);
    setInputSistema('');
    setBilletesCierre(() => {
      const n: MapBilletes = {};
      DENOMINACIONES_BILLETES.forEach(d => { n[d] = 0; });
      return n;
    });
    setMonedasCierre(() => {
      const n: MapMonedas = {};
      DENOMINACIONES_MONEDAS.forEach(d => { n[d] = 0; });
      return n;
    });
  };

  // Keyboard Shortcuts listener (- and ,)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalAjustesOpen) return;
      if (currentScreen === 'app-movimientos') return;

      // (-) Toggle Multiplicador
      if (e.key === '-' || e.key === 'Minus' || e.code === 'NumpadSubtract' || e.code === 'Minus') {
        e.preventDefault();
        e.stopPropagation();
        if (currentScreen === 'app-multiplicador') {
          setCurrentScreen(contextoPrincipal === 'caja' ? 'app-caja' : 'app-cierre');
        } else {
          setCurrentScreen('app-multiplicador');
        }
        vibrarRapido();
        return;
      }

      // (,) Double zero
      if (e.key === ',' || e.code === 'Comma') {
        const el = document.activeElement as HTMLInputElement | null;
        if (el && el.tagName === 'INPUT' && !el.readOnly) {
          e.preventDefault();
          e.stopPropagation();

          if (el.id === 'f1000' || el.classList.contains('input-qty')) {
            const raw = el.value.replace(/[^0-9-]/g, '');
            const nextVal = (raw === '' || raw === '0' || raw === '-') ? '' : raw + '00';
            el.value = nextVal;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            let val = el.value.replace(/,/g, '').trim();
            if (val === '' || val === '0') val = '00';
            else if (!val.includes('.')) val = val + '00';
            else {
              const partes = val.split('.');
              if (partes[1].length === 0) partes[1] = '00';
              else if (partes[1].length === 1) partes[1] = partes[1] + '0';
              val = partes[0] + '.' + partes[1].substring(0, 2);
            }
            el.value = val;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
          vibrarRapido();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [currentScreen, contextoPrincipal, modalAjustesOpen]);

  // Native Binary .XLSX Export + Web Share API Handler
  const handleExportExcel = () => {
    generarYCompartirExcelXlsx({
      hoja1Data,
      hoja2Data,
      cantF1000,
      billetesCierre,
      monedasCierre,
      inputSistema,
      capitalBase,
    });
  };

  const handleToggleContexto = () => {
    vibrarRapido(16);
    if (contextoPrincipal === 'caja') {
      setContextoPrincipal('cierre');
      setCurrentScreen('app-cierre');
    } else {
      setContextoPrincipal('caja');
      setCurrentScreen('app-caja');
    }
  };

  return (
    <div className="w-full h-full overflow-hidden relative">
      {/* 1. CAJA VIEW */}
      {currentScreen === 'app-caja' && (
        <CajaView
          modoOperacion={modoOperacion}
          setModoOperacion={setModoOperacion}
          datosSuperior={datosSuperior}
          setDatosSuperior={setDatosSuperior}
          datosInferior={datosInferior}
          setDatosInferior={setDatosInferior}
          cuadroVinculado={cuadroVinculado}
          ordenModosConDatos={ordenModosConDatos}
          registrarModoEnOrden={registrarModoEnOrden}
          onEjecutarEnterCaja={handleEjecutarEnterCaja}
          ultimoInputCajaActivoRef={ultimoInputCajaActivoRef}
          badgeConfirmacionTexto={badgeConfirmacionCaja}
        />
      )}

      {/* 2. CIERRE VIEW */}
      {currentScreen === 'app-cierre' && (
        <CierreView
          hoja1Data={hoja1Data}
          billetesCierre={billetesCierre}
          monedasCierre={monedasCierre}
          cantF1000={cantF1000}
          setCantF1000={setCantF1000}
          inputSistema={inputSistema}
          setInputSistema={setInputSistema}
          capitalBase={capitalBase}
          onOpenMultiplicador={() => setCurrentScreen('app-multiplicador')}
          onOpenAjustes={tab => {
            setModalAjustesTab(tab);
            setModalAjustesOpen(true);
          }}
          onGuardarCierreConEnter={handleGuardarCierreConEnter}
          onLimpiarCierreManual={handleLimpiarCierreManual}
          ultimoInputCierreActivoRef={ultimoInputCierreActivoRef}
          confirmacionCierreTexto={confirmacionCierreTexto}
        />
      )}

      {/* 3. MULTIPLICADOR VIEW */}
      {currentScreen === 'app-multiplicador' && (
        <MultiplicadorView
          contextoPrincipal={contextoPrincipal}
          billetes={contextoPrincipal === 'caja' ? billetesCaja : billetesCierre}
          setBilletes={contextoPrincipal === 'caja' ? setBilletesCaja : setBilletesCierre}
          monedas={contextoPrincipal === 'caja' ? monedasCaja : monedasCierre}
          setMonedas={contextoPrincipal === 'caja' ? setMonedasCaja : setMonedasCierre}
          onVolver={() => setCurrentScreen(contextoPrincipal === 'caja' ? 'app-caja' : 'app-cierre')}
          onOpenAjustes={() => {
            setModalAjustesTab(contextoPrincipal);
            setModalAjustesOpen(true);
          }}
          guardarMovimientosActivo={guardarMovimientosActivo}
          onEnterKey={() => {
            if (contextoPrincipal === 'caja') {
              setBilletesCaja(() => {
                const n: MapBilletes = {};
                DENOMINACIONES_BILLETES.forEach(d => { n[d] = 0; });
                return n;
              });
              setMonedasCaja(() => {
                const n: MapMonedas = {};
                DENOMINACIONES_MONEDAS.forEach(d => { n[d] = 0; });
                return n;
              });
              vibrarRapido();
            } else {
              handleGuardarCierreConEnter();
            }
          }}
        />
      )}

      {/* 4. HOJAS LOCALES VIEW */}
      {currentScreen === 'app-movimientos' && (
        <HojasLocalesView
          hoja1Data={hoja1Data}
          hoja2Data={hoja2Data}
          cantF1000={cantF1000}
          billetesCierre={billetesCierre}
          monedasCierre={monedasCierre}
          inputSistema={inputSistema}
          capitalBase={capitalBase}
          onVolver={() => setCurrentScreen(contextoPrincipal === 'caja' ? 'app-caja' : 'app-cierre')}
          onExportExcel={handleExportExcel}
          onBorrarSoloMovimientos={() => {
            setHoja1Data(prev => ({ ...prev, movimientos: [] }));
          }}
          onBorrarSaldoInicial={() => {
            setHoja1Data(prev => ({
              ...prev,
              tieneEfectivoInicial: false,
              efectivoInicialCentimos: 0,
            }));
          }}
          onLimpiarCierreHoja2={() => {
            setHoja2Data(null);
            handleLimpiarCierreManual();
          }}
        />
      )}

      {/* FLOATING CONTROLS */}
      <FloatingControls
        currentScreen={currentScreen}
        contextoPrincipal={contextoPrincipal}
        onToggleContexto={handleToggleContexto}
        onBorrarCaja={handleLimpiarCaja}
        onOpenMovimientos={() => setCurrentScreen('app-movimientos')}
        onAnularUltimaOp={handleAnularUltimaOp}
      />

      {/* MODAL CONFIGURACION */}
      <AjustesModal
        isOpen={modalAjustesOpen}
        onClose={() => setModalAjustesOpen(false)}
        contextoInicial={modalAjustesTab}
        guardarMovimientosActivo={guardarMovimientosActivo}
        onToggleGuardarMovimientos={setGuardarMovimientosActivo}
        capitalBase={capitalBase}
        onGuardarCapitalBase={setCapitalBase}
      />
    </div>
  );
};
