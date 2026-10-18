import React, { useRef, useState } from 'react';
import { ContextoPrincipal, MapBilletes, MapMonedas } from '../types';
import {
  formatoSoles,
  formatoEntero,
  vibrarRapido,
  DENOMINACIONES_BILLETES,
  DENOMINACIONES_MONEDAS,
} from '../utils/formatters';
import {
  StepperDownIcon,
  StepperUpIcon,
  SvgBilleteFallback,
  SvgMonedaFallback,
} from '../utils/svgIcons';

interface MultiplicadorViewProps {
  contextoPrincipal: ContextoPrincipal;
  billetes: MapBilletes;
  setBilletes: React.Dispatch<React.SetStateAction<MapBilletes>>;
  monedas: MapMonedas;
  setMonedas: React.Dispatch<React.SetStateAction<MapMonedas>>;
  onVolver: () => void;
  onOpenAjustes: () => void;
  guardarMovimientosActivo: boolean;
  onEnterKey: () => void;
}

export const MultiplicadorView: React.FC<MultiplicadorViewProps> = ({
  contextoPrincipal,
  billetes,
  setBilletes,
  monedas,
  setMonedas,
  onVolver,
  onOpenAjustes,
  guardarMovimientosActivo,
  onEnterKey,
}) => {
  const [tabActiva, setTabActiva] = useState<'billetes' | 'monedas'>('billetes');
  const sliderRef = useRef<HTMLDivElement>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Subtotals
  let centimosBilletes = 0;
  DENOMINACIONES_BILLETES.forEach(d => {
    centimosBilletes += Math.round(d * 100) * (billetes[d] || 0);
  });

  let centimosMonedas = 0;
  DENOMINACIONES_MONEDAS.forEach(d => {
    centimosMonedas += Math.round(d * 100) * (monedas[d] || 0);
  });

  const totalBilletesVal = centimosBilletes / 100;
  const totalMonedasVal = centimosMonedas / 100;
  const granTotalNumerico = (centimosBilletes + centimosMonedas) / 100;

  const handleStep = (tipo: 'billete' | 'moneda', denom: number, delta: number) => {
    vibrarRapido();
    if (tipo === 'billete') {
      setBilletes(prev => {
        let val = (prev[denom] || 0) + delta;
        if (contextoPrincipal === 'caja' && val < 0) val = 0;
        return { ...prev, [denom]: val };
      });
    } else {
      setMonedas(prev => {
        let val = (prev[denom] || 0) + delta;
        if (contextoPrincipal === 'caja' && val < 0) val = 0;
        return { ...prev, [denom]: val };
      });
    }
  };

  const handleQtyChange = (tipo: 'billete' | 'moneda', denom: number, valStr: string) => {
    let val = parseInt(valStr) || 0;
    if (contextoPrincipal === 'caja' && val < 0) val = 0;
    if (tipo === 'billete') {
      setBilletes(prev => ({ ...prev, [denom]: val }));
    } else {
      setMonedas(prev => ({ ...prev, [denom]: val }));
    }
  };

  const handleReset = (tipo: 'billete' | 'moneda', denom: number) => {
    vibrarRapido();
    if (tipo === 'billete') {
      setBilletes(prev => ({ ...prev, [denom]: 0 }));
    } else {
      setMonedas(prev => ({ ...prev, [denom]: 0 }));
    }
  };

  const switchTab = (tab: 'billetes' | 'monedas') => {
    vibrarRapido();
    setTabActiva(tab);
    if (sliderRef.current) {
      sliderRef.current.scrollTo({
        left: tab === 'billetes' ? 0 : sliderRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleSliderScroll = () => {
    if (!sliderRef.current) return;
    const isMonedas = sliderRef.current.scrollLeft > sliderRef.current.clientWidth / 2;
    setTabActiva(isMonedas ? 'monedas' : 'billetes');
  };

  const getFotoSrc = (tipo: 'billete' | 'moneda', denom: number) => {
    const key = `foto_${tipo}_${denom}`;
    const custom = localStorage.getItem(key);
    if (custom) return custom;
    if (tipo === 'billete') return `img/billete-${denom}.jpg`;
    const nombreMoneda = denom === 5 ? '5' : denom === 2 ? '2' : denom === 1 ? '1' : denom === 0.5 ? '050' : denom === 0.2 ? '020' : '010';
    return `img/moneda-${nombreMoneda}.jpg`;
  };

  return (
    <div id="app-multiplicador" className="w-full h-full overflow-hidden select-none">
      <form
        onSubmit={e => {
          e.preventDefault();
          onEnterKey();
        }}
        className="h-full flex flex-col justify-between"
      >
        <div className="multiplicador-wrapper">
          {/* HEADER */}
          <div
            className="sticky-header-compact"
            onClick={onVolver}
            title="Toca o presiona (-) para regresar"
          >
            <div className="main-total-centered" id="txtGranTotal">
              {(granTotalNumerico < 0 ? '-' : '') + formatoSoles(granTotalNumerico)}
            </div>
            <button
              type="button"
              id="btnAjustesMonedas"
              className={`btn-config-monedas ${tabActiva === 'billetes' ? 'oculto-en-billetes' : ''}`}
              onClick={e => {
                e.stopPropagation();
                onOpenAjustes();
              }}
              title="Configuración de Monedas"
            >
              ⚙️
              <span className={`dot-sync-mini ${guardarMovimientosActivo ? 'on' : ''}`} id="dotSyncMulti" />
            </button>
          </div>

          {/* TABS */}
          <div className="tabs-container-sub">
            <button
              type="button"
              id="tab-btn-billetes"
              className={`sub-tab-btn ${tabActiva === 'billetes' ? 'active' : ''}`}
              onClick={() => switchTab('billetes')}
            >
              <span>💵 Billetes</span>
              <span
                className={`tab-badge-subtotal ${centimosBilletes !== 0 ? 'badge-con-monto' : ''}`}
                id="badgeTotalBilletes"
              >
                S/ {formatoEntero(totalBilletesVal)}
              </span>
            </button>
            <button
              type="button"
              id="tab-btn-monedas"
              className={`sub-tab-btn ${tabActiva === 'monedas' ? 'active' : ''}`}
              onClick={() => switchTab('monedas')}
            >
              <span>🪙 Monedas</span>
              <span
                className={`tab-badge-subtotal ${centimosMonedas !== 0 ? 'badge-con-monto' : ''}`}
                id="badgeTotalMonedas"
              >
                S/ {(totalMonedasVal < 0 ? '-' : '') + formatoSoles(totalMonedasVal)}
              </span>
            </button>
          </div>

          {/* SLIDER VIEWS */}
          <div
            className="multiplicador-slider"
            id="sliderMultiplicador"
            ref={sliderRef}
            onScroll={handleSliderScroll}
          >
            {/* VIEW BILLETES */}
            <div id="tab-billetes" className="view-content">
              <div id="containerBilletes">
                {DENOMINACIONES_BILLETES.map(denom => {
                  const cant = billetes[denom] || 0;
                  const subCentimos = Math.round(denom * 100) * cant;
                  const imgSrc = getFotoSrc('billete', denom);
                  const isBroken = brokenImages[`billete-${denom}`];

                  return (
                    <div
                      key={denom}
                      className={`item-card ${cant > 0 ? 'fila-activa' : ''} ${cant < 0 ? 'fila-negativa' : ''}`}
                      id={`card-b-${denom}`}
                    >
                      <div
                        className="billete-container"
                        onDoubleClick={() => handleReset('billete', denom)}
                        title="Doble toque para reiniciar"
                      >
                        {!isBroken ? (
                          <img
                            src={imgSrc}
                            className="billete-real-img"
                            alt={`S/ ${denom}`}
                            onError={() => setBrokenImages(p => ({ ...p, [`billete-${denom}`]: true }))}
                          />
                        ) : (
                          <div className="fallback-badge">
                            <SvgBilleteFallback denom={denom} />
                          </div>
                        )}
                      </div>

                      <div className="stepper-control">
                        <button
                          type="button"
                          className="btn-step btn-step-down"
                          onClick={() => handleStep('billete', denom, -1)}
                          title="Bajar"
                        >
                          <StepperDownIcon />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="input-qty"
                          id={`input-b-${denom}`}
                          placeholder="0"
                          enterKeyHint="done"
                          value={cant === 0 ? '' : cant}
                          onChange={e => handleQtyChange('billete', denom, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-step btn-step-up"
                          onClick={() => handleStep('billete', denom, 1)}
                          title="Subir"
                        >
                          <StepperUpIcon />
                        </button>
                      </div>

                      <div
                        className="item-data-col"
                        onDoubleClick={() => handleReset('billete', denom)}
                        title="Doble toque para reiniciar"
                      >
                        <span className="subtotal-tag">SUBTOTAL</span>
                        <div className="subtotal-valor-box">
                          <span className="item-subtotal" id={`sub-b-${denom}`}>
                            {formatoEntero(subCentimos / 100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VIEW MONEDAS */}
            <div id="tab-monedas" className="view-content">
              <div id="containerMonedas">
                {DENOMINACIONES_MONEDAS.map(denom => {
                  const cant = monedas[denom] || 0;
                  const subCentimos = Math.round(denom * 100) * cant;
                  const imgSrc = getFotoSrc('moneda', denom);
                  const isBroken = brokenImages[`moneda-${denom}`];

                  const monedaCssClass = denom === 1
                    ? 'moneda-100'
                    : denom === 5
                    ? 'moneda-500'
                    : denom === 0.2
                    ? 'moneda-020'
                    : denom === 2
                    ? 'moneda-200'
                    : denom === 0.5
                    ? 'moneda-050'
                    : 'moneda-010';

                  return (
                    <div
                      key={denom}
                      className={`item-card ${cant > 0 ? 'fila-activa' : ''} ${cant < 0 ? 'fila-negativa' : ''}`}
                      id={`card-m-${denom}`}
                    >
                      <div
                        className="moneda-real-frame"
                        onDoubleClick={() => handleReset('moneda', denom)}
                        title="Doble toque para reiniciar"
                      >
                        {!isBroken ? (
                          <img
                            src={imgSrc}
                            className={`moneda-real-img ${monedaCssClass}`}
                            alt={`S/ ${denom.toFixed(2)}`}
                            onError={() => setBrokenImages(p => ({ ...p, [`moneda-${denom}`]: true }))}
                          />
                        ) : (
                          <div className={`fallback-badge ${monedaCssClass}`} style={{ borderRadius: '50%' }}>
                            <SvgMonedaFallback denom={denom} />
                          </div>
                        )}
                      </div>

                      <div className="stepper-control">
                        <button
                          type="button"
                          className="btn-step btn-step-down"
                          onClick={() => handleStep('moneda', denom, -1)}
                          title="Bajar"
                        >
                          <StepperDownIcon />
                        </button>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="input-qty"
                          id={`input-m-${denom}`}
                          placeholder="0"
                          enterKeyHint="done"
                          value={cant === 0 ? '' : cant}
                          onChange={e => handleQtyChange('moneda', denom, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-step btn-step-up"
                          onClick={() => handleStep('moneda', denom, 1)}
                          title="Subir"
                        >
                          <StepperUpIcon />
                        </button>
                      </div>

                      <div
                        className="item-data-col"
                        onDoubleClick={() => handleReset('moneda', denom)}
                        title="Doble toque para reiniciar"
                      >
                        <span className="subtotal-tag">SUBTOTAL</span>
                        <div className="subtotal-valor-box">
                          <span className="item-subtotal" id={`sub-m-${denom}`}>
                            {subCentimos < 0 ? '-' + formatoSoles(subCentimos / 100) : formatoSoles(subCentimos / 100)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
