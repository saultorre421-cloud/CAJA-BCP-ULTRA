import React, { useState } from 'react';
import {
  formatInputString,
  vibrarRapido,
  DENOMINACIONES_BILLETES,
  DENOMINACIONES_MONEDAS,
} from '../utils/formatters';

interface AjustesModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextoInicial: 'caja' | 'cierre';
  guardarMovimientosActivo: boolean;
  onToggleGuardarMovimientos: (val: boolean) => void;
  capitalBase: number;
  onGuardarCapitalBase: (val: number) => void;
}

export const AjustesModal: React.FC<AjustesModalProps> = ({
  isOpen,
  onClose,
  contextoInicial,
  guardarMovimientosActivo,
  onToggleGuardarMovimientos,
  capitalBase,
  onGuardarCapitalBase,
}) => {
  const [tabConfig, setTabConfig] = useState<'caja' | 'cierre'>(contextoInicial);
  const [inputBase, setInputBase] = useState<string>(capitalBase.toFixed(2));
  const [btnGuardarBaseLabel, setBtnGuardarBaseLabel] = useState<string>('Guardar');
  const [, setTriggerRender] = useState<number>(0);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setTabConfig(contextoInicial);
      setInputBase(formatInputString(capitalBase.toFixed(2)));
      setBtnGuardarBaseLabel('Guardar');
    }
  }, [isOpen, contextoInicial, capitalBase]);

  if (!isOpen) return null;

  const handleSaveBase = () => {
    const raw = inputBase.replace(/,/g, '').trim();
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 0) {
      onGuardarCapitalBase(num);
      vibrarRapido(20);
      setBtnGuardarBaseLabel('✓ Listo');
      setTimeout(() => {
        setBtnGuardarBaseLabel('Guardar');
        onClose();
      }, 450);
    }
  };

  const handleUploadFoto = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'billete' | 'moneda', denom: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const maxW = (tipo === 'billete') ? 340 : 160;
        const scale = maxW / img.width;
        canvas.width = maxW;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const optimizada = canvas.toDataURL('image/jpeg', 0.85);
          try {
            localStorage.setItem(`foto_${tipo}_${denom}`, optimizada);
            vibrarRapido(15);
            setTriggerRender(prev => prev + 1);
          } catch {
            // Storage quota exceeded
          }
        }
      };
      if (evt.target?.result) {
        img.src = evt.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="modal-config active">
      <div className="modal-card">
        <div className="modal-header">
          <h3 id="tituloModalConfig">
            {tabConfig === 'caja' ? '⚙️ Configuración de Caja' : '⚙️ Configuración de Cierre'}
          </h3>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-context-tabs">
          <button
            type="button"
            className={`btn-tab-modal ${tabConfig === 'caja' ? 'active' : ''}`}
            onClick={() => setTabConfig('caja')}
          >
            ⚡ Config. Caja (Hoja 1)
          </button>
          <button
            type="button"
            className={`btn-tab-modal ${tabConfig === 'cierre' ? 'active' : ''}`}
            onClick={() => setTabConfig('cierre')}
          >
            📋 Config. Cierre (H1 / H2)
          </button>
        </div>

        {/* SECTION CAJA */}
        {tabConfig === 'caja' && (
          <div id="panelConfigCaja" className="seccion-config-panel active">
            <div className="switch-hero-card">
              <div>
                <div className="switch-info-title">Guardar Movimientos en Hoja 1</div>
                <div className="switch-info-sub" id="txtSubEstadoSwitch">
                  {guardarMovimientosActivo
                    ? 'ACTIVO: Cada Enter guarda en la Hoja 1 Local en 0.00 ms'
                    : 'DESACTIVADO: La Caja opera sin registrar en la Hoja 1'}
                </div>
              </div>
              <label className="ios-switch">
                <input
                  type="checkbox"
                  checked={guardarMovimientosActivo}
                  onChange={e => onToggleGuardarMovimientos(e.target.checked)}
                />
                <span className="ios-slider" />
              </label>
            </div>

            <div className="nota-explicativa-config">
              💡 <b>100% Local y Cero Latencia:</b> Todas las operaciones (incluyendo operaciones enganchadas entre modos) se registran en <b>0.00 ms</b> en la memoria interna de tu celular. Para limpiar hojas usa el botón <b>🗑️ BORRAR</b> directamente en la pantalla <b>HOJAS BCP</b>.
            </div>
          </div>
        )}

        {/* SECTION CIERRE */}
        {tabConfig === 'cierre' && (
          <div id="panelConfigCierre" className="seccion-config-panel active">
            <div className="bloque-base-config">
              <label htmlFor="input-base-config">💰 Capital Base / Remesa Asignada (S/)</label>
              <div className="base-input-group">
                <input
                  type="text"
                  id="input-base-config"
                  className="input-base-modal"
                  inputMode="decimal"
                  value={inputBase}
                  onChange={e => setInputBase(formatInputString(e.target.value))}
                  placeholder="26,729.00"
                />
                <button
                  type="button"
                  className="btn-save-base"
                  style={btnGuardarBaseLabel === '✓ Listo' ? { backgroundColor: '#16a34a' } : {}}
                  onClick={handleSaveBase}
                >
                  {btnGuardarBaseLabel}
                </button>
              </div>
            </div>

            {/* Custom Image Uploads */}
            <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--bcp-blue)', textTransform: 'uppercase', margin: '10px 0 6px 0' }}>
              📸 Personalizar Fotos de Billetes
            </div>
            <div className="mb-3">
              {DENOMINACIONES_BILLETES.map(d => {
                const yaTiene = !!localStorage.getItem(`foto_billete_${d}`);
                return (
                  <div key={d} className="fila-upload">
                    <span>💵 Billete S/ {d} {yaTiene ? '✓' : ''}</span>
                    <label className="btn-examinar">
                      {yaTiene ? 'Cambiar' : 'Elegir'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleUploadFoto(e, 'billete', d)}
                      />
                    </label>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--bcp-blue)', textTransform: 'uppercase', margin: '12px 0 6px 0' }}>
              📸 Personalizar Fotos de Monedas
            </div>
            <div className="mb-2">
              {DENOMINACIONES_MONEDAS.map(d => {
                const yaTiene = !!localStorage.getItem(`foto_moneda_${d}`);
                return (
                  <div key={d} className="fila-upload">
                    <span>🪙 Moneda S/ {d.toFixed(2)} {yaTiene ? '✓' : ''}</span>
                    <label className="btn-examinar">
                      {yaTiene ? 'Cambiar' : 'Elegir'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleUploadFoto(e, 'moneda', d)}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
