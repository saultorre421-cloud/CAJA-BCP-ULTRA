import React, { useState, useEffect, useRef } from 'react';
import { ContextoPrincipal, ScreenApp } from '../types';
import { vibrarRapido } from '../utils/formatters';

interface FloatingControlsProps {
  currentScreen: ScreenApp;
  contextoPrincipal: ContextoPrincipal;
  onToggleContexto: () => void;
  onBorrarCaja: () => void;
  onOpenMovimientos: () => void;
  onAnularUltimaOp: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  currentScreen,
  contextoPrincipal,
  onToggleContexto,
  onBorrarCaja,
  onOpenMovimientos,
  onAnularUltimaOp,
}) => {
  const [btnBorrarFeedback, setBtnBorrarFeedback] = useState<string | null>(null);
  const [btnAnularFeedback, setBtnAnularFeedback] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [keyboardCovered, setKeyboardCovered] = useState(false);

  // Positions
  const [switcherPos, setSwitcherPos] = useState<{ x: number; y: number }>(() => {
    const savedX = parseFloat(localStorage.getItem('bcp_switcher_x_px') || '');
    const savedY = parseFloat(localStorage.getItem('bcp_switcher_y_px') || '');
    const defX = typeof window !== 'undefined' ? Math.round(window.innerWidth / 2) : 260;
    const defY = 480;
    return {
      x: isNaN(savedX) ? defX : savedX,
      y: isNaN(savedY) ? defY : savedY,
    };
  });

  const [borrarPos, setBorrarPos] = useState<{ x?: number; y?: number }>(() => {
    const savedX = parseFloat(localStorage.getItem('bcp_btn_borrar_x') || '');
    const savedY = parseFloat(localStorage.getItem('bcp_btn_borrar_y') || '');
    return {
      x: isNaN(savedX) ? undefined : savedX,
      y: isNaN(savedY) ? undefined : savedY,
    };
  });

  const [movsPos, setMovsPos] = useState<{ x?: number; y?: number }>(() => {
    const savedX = parseFloat(localStorage.getItem('bcp_btn_movs_x') || '');
    const savedY = parseFloat(localStorage.getItem('bcp_btn_movs_y') || '');
    return {
      x: isNaN(savedX) ? undefined : savedX,
      y: isNaN(savedY) ? undefined : savedY,
    };
  });

  const [anularPos, setAnularPos] = useState<{ x?: number; y?: number }>(() => {
    const savedX = parseFloat(localStorage.getItem('bcp_btn_anular_x') || '');
    const savedY = parseFloat(localStorage.getItem('bcp_btn_anular_y') || '');
    return {
      x: isNaN(savedX) ? undefined : savedX,
      y: isNaN(savedY) ? undefined : savedY,
    };
  });

  // Reposition helper on resize/keyboard
  useEffect(() => {
    const handleViewport = () => {
      const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const fullH = window.innerHeight;
      setKeyboardCovered(h < fullH * 0.82);
    };

    window.visualViewport?.addEventListener('resize', handleViewport);
    window.addEventListener('resize', handleViewport);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewport);
      window.removeEventListener('resize', handleViewport);
    };
  }, []);

  // Draggable Switcher handler
  const dragSwitcherRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  }>({ startX: 0, startY: 0, initX: 0, initY: 0, hasMoved: false });

  const handleSwitcherPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragSwitcherRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: switcherPos.x,
      initY: switcherPos.y,
      hasMoved: false,
    };
  };

  const handleSwitcherPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragSwitcherRef.current) return;
    const dx = e.clientX - dragSwitcherRef.current.startX;
    const dy = e.clientY - dragSwitcherRef.current.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      dragSwitcherRef.current.hasMoved = true;
      const minX = 26;
      const maxX = window.innerWidth - 26;
      const minY = 26;
      const maxY = window.innerHeight - 26;
      const nx = Math.round(Math.max(minX, Math.min(maxX, dragSwitcherRef.current.initX + dx)));
      const ny = Math.round(Math.max(minY, Math.min(maxY, dragSwitcherRef.current.initY + dy)));
      setSwitcherPos({ x: nx, y: ny });
    }
  };

  const handleSwitcherPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignored
    }
    if (dragSwitcherRef.current.hasMoved) {
      localStorage.setItem('bcp_switcher_x_px', `${switcherPos.x}px`);
      localStorage.setItem('bcp_switcher_y_px', `${switcherPos.y}px`);
      vibrarRapido(10);
    } else {
      vibrarRapido(16);
      setIsRotating(true);
      setTimeout(() => setIsRotating(false), 280);
      onToggleContexto();
    }
  };

  // Helper for repositioning the 3 Caja action buttons
  const setupRepositionable = (
    pos: { x?: number; y?: number },
    setPos: (p: { x: number; y: number }) => void,
    storageKeyX: string,
    storageKeyY: string,
    onClickAction: () => void,
    defaultIndex: number
  ) => {
    const timerRef = { current: null as any };
    const dragData = { startX: 0, startY: 0, initX: 0, initY: 0, isMoving: false };

    const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      dragData.startX = e.clientX;
      dragData.startY = e.clientY;
      dragData.initX = rect.left;
      dragData.initY = rect.top;
      dragData.isMoving = false;
      const target = e.currentTarget;
      target.setPointerCapture(e.pointerId);

      timerRef.current = setTimeout(() => {
        dragData.isMoving = true;
        target.classList.add('modo-reubicacion');
        vibrarRapido(25);
      }, 380);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
      const dx = e.clientX - dragData.startX;
      const dy = e.clientY - dragData.startY;
      if (!dragData.isMoving && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        clearTimeout(timerRef.current);
      }
      if (dragData.isMoving) {
        const minX = 4;
        const maxX = window.innerWidth - 110;
        const minY = 4;
        const maxY = window.innerHeight - 50;
        const nx = Math.round(Math.max(minX, Math.min(maxX, dragData.initX + dx)));
        const ny = Math.round(Math.max(minY, Math.min(maxY, dragData.initY + dy)));
        setPos({ x: nx, y: ny });
      }
    };

    const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
      clearTimeout(timerRef.current);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignored
      }
      e.currentTarget.classList.remove('modo-reubicacion');
      if (dragData.isMoving) {
        if (pos.x !== undefined && pos.y !== undefined) {
          localStorage.setItem(storageKeyX, `${pos.x}px`);
          localStorage.setItem(storageKeyY, `${pos.y}px`);
        }
        vibrarRapido(12);
      } else {
        onClickAction();
      }
      dragData.isMoving = false;
    };

    // Calculate default position if not dragged yet
    const containerWidth = Math.min(window.innerWidth, 520);
    const offsetX = (window.innerWidth - containerWidth) / 2;
    const btnWidth = (containerWidth - 18) / 3;
    const defX = offsetX + 5 + defaultIndex * (btnWidth + 4);
    const defY = 488;

    const style: React.CSSProperties = {
      left: pos.x !== undefined ? `${pos.x}px` : `${defX}px`,
      top: pos.y !== undefined ? `${pos.y}px` : `${defY}px`,
    };

    return { onPointerDown, onPointerMove, onPointerUp, style };
  };

  const borrarHandlers = setupRepositionable(
    borrarPos,
    setBorrarPos,
    'bcp_btn_borrar_x',
    'bcp_btn_borrar_y',
    () => {
      vibrarRapido([15, 25, 15]);
      onBorrarCaja();
      setBtnBorrarFeedback('LIMPIO');
      setTimeout(() => setBtnBorrarFeedback(null), 650);
    },
    0
  );

  const movsHandlers = setupRepositionable(
    movsPos,
    setMovsPos,
    'bcp_btn_movs_x',
    'bcp_btn_movs_y',
    () => {
      vibrarRapido(16);
      onOpenMovimientos();
    },
    1
  );

  const anularHandlers = setupRepositionable(
    anularPos,
    setAnularPos,
    'bcp_btn_anular_x',
    'bcp_btn_anular_y',
    () => {
      vibrarRapido([25, 35, 25]);
      onAnularUltimaOp();
      setBtnAnularFeedback('ANULADO');
      setTimeout(() => setBtnAnularFeedback(null), 850);
    },
    2
  );

  const showAuxCaja = currentScreen === 'app-caja';
  const showSwitcher = currentScreen !== 'app-multiplicador' && currentScreen !== 'app-movimientos';

  return (
    <>
      {/* 3 AUXILIARY BUTTONS IN CAJA */}
      {showAuxCaja && (
        <>
          <button
            type="button"
            id="btnCajaBorrar"
            className={`btn-aux-caja-fijo ${keyboardCovered ? 'tapado-por-teclado' : ''} ${btnBorrarFeedback ? 'confirmado' : ''}`}
            style={borrarHandlers.style}
            onPointerDown={borrarHandlers.onPointerDown}
            onPointerMove={borrarHandlers.onPointerMove}
            onPointerUp={borrarHandlers.onPointerUp}
            title="Toque: Borrar montos editados en Caja · Mantener presionado: Mover ubicación"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] shrink-0 opacity-85">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            <span id="txtBtnCajaBorrar">{btnBorrarFeedback || 'BORRAR'}</span>
          </button>

          <button
            type="button"
            id="btnCajaMovimientos"
            className={`btn-aux-caja-fijo ${keyboardCovered ? 'tapado-por-teclado' : ''}`}
            style={movsHandlers.style}
            onPointerDown={movsHandlers.onPointerDown}
            onPointerMove={movsHandlers.onPointerMove}
            onPointerUp={movsHandlers.onPointerUp}
            title="Toque: Ver Hoja de Movimientos y Cierre · Mantener presionado: Mover ubicación"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] shrink-0 opacity-85">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
            </svg>
            <span id="txtBtnCajaMovimientos">MOVIMIENTOS</span>
          </button>

          <button
            type="button"
            id="btnCajaAnular"
            className={`btn-aux-caja-fijo ${keyboardCovered ? 'tapado-por-teclado' : ''} ${btnAnularFeedback ? 'confirmado' : ''}`}
            style={anularHandlers.style}
            onPointerDown={anularHandlers.onPointerDown}
            onPointerMove={anularHandlers.onPointerMove}
            onPointerUp={anularHandlers.onPointerUp}
            title="Toque: Anular última operación · Mantener presionado: Mover ubicación"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px] shrink-0 opacity-85">
              <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
            </svg>
            <span id="txtBtnCajaAnular">{btnAnularFeedback || 'ANULAR'}</span>
          </button>
        </>
      )}

      {/* 2D FLOATING GOOGLE SWITCHER BUTTON */}
      {showSwitcher && (
        <button
          type="button"
          id="btnGoogleSwitcher"
          className={`google-account-switcher ${contextoPrincipal === 'cierre' ? 'modo-cierre-activo' : ''} ${keyboardCovered ? 'tapado-por-teclado' : ''} ${isRotating ? 'rotando' : ''}`}
          style={{ left: `${switcherPos.x}px`, top: `${switcherPos.y}px` }}
          onPointerDown={handleSwitcherPointerDown}
          onPointerMove={handleSwitcherPointerMove}
          onPointerUp={handleSwitcherPointerUp}
          title="Toca para cambiar Caja/Cierre · Arrastra hacia cualquier lugar"
        >
          <div className="switcher-inner-circle">
            <svg
              className="switcher-icon-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: isRotating ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }}
            >
              <path d="M17 2.1l4 4-4 4"/>
              <path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8"/>
              <path d="M7 21.9l-4-4 4-4"/>
              <path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/>
            </svg>
            <span className="switcher-mini-label" id="lblSwitcherModo">
              {contextoPrincipal === 'cierre' ? 'CIERRE' : 'CAJA'}
            </span>
          </div>
        </button>
      )}
    </>
  );
};
