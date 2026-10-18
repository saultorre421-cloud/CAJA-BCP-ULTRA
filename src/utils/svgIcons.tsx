import React from 'react';

export const StepperDownIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-[21px] h-[21px] pointer-events-none block" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.8 6.2L12 11.2L17.2 6.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>
    <path d="M12 19.5L18.6 12.6L16.2 10.8L12 15L7.8 10.8L5.4 12.6L12 19.5Z" fill="currentColor"/>
  </svg>
);

export const StepperUpIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-[21px] h-[21px] pointer-events-none block" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5L18.6 11.4L16.2 13.2L12 9L7.8 13.2L5.4 11.4L12 4.5Z" fill="currentColor"/>
    <path d="M6.8 17.8L12 12.8L17.2 17.8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>
  </svg>
);

export const SignalIcon: React.FC<{ name: string }> = ({ name }) => {
  switch (name) {
    case 'mano':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
          <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>
        </svg>
      );
    case 'cobrar':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
          <path d="M12 3v14"/><path d="m6 11 6 6 6-6"/><line x1="4" y1="21" x2="20" y2="21"/>
        </svg>
      );
    case 'faltante':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="7" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor"/>
        </svg>
      );
    case 'entregar':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
          <path d="M12 21V7"/><path d="m6 13 6-6 6 6"/><line x1="4" y1="3" x2="20" y2="3"/>
        </svg>
      );
    case 'vuelto':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
          <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
        </svg>
      );
    case 'exacto':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      );
    case 'peligro':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.9" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor"/>
        </svg>
      );
    case 'esperando':
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full block">
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
        </svg>
      );
  }
};

const coloresBilletes: Record<number, { c1: string; c2: string; acc: string }> = {
  200: { c1: '#4c1d95', c2: '#7c3aed', acc: '#ddd6fe' },
  100: { c1: '#0c4a6e', c2: '#0284c7', acc: '#bae6fd' },
  50:  { c1: '#7c2d12', c2: '#c2410c', acc: '#fed7aa' },
  20:  { c1: '#78350f', c2: '#d97706', acc: '#fde68a' },
  10:  { c1: '#064e3b', c2: '#059669', acc: '#a7f3d0' }
};

export const SvgBilleteFallback: React.FC<{ denom: number }> = ({ denom }) => {
  const t = coloresBilletes[denom] || coloresBilletes[100];
  return (
    <svg viewBox="0 0 136 70" width="100%" height="100%" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`gB${denom}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={t.c1}/>
          <stop offset="100%" stopColor={t.c2}/>
        </linearGradient>
      </defs>
      <rect width="136" height="70" fill={`url(#gB${denom})`}/>
      <rect x="4" y="4" width="128" height="62" rx="3" fill="none" stroke={t.acc} strokeOpacity="0.35" strokeWidth="1"/>
      <rect x="34" y="0" width="3" height="70" fill={t.acc} fillOpacity="0.3"/>
      <circle cx="110" cy="35" r="20" fill="rgba(255,255,255,0.08)"/>
      <text x="10" y="16" fill={t.acc} fontFamily="sans-serif" fontSize="7.5" fontWeight="900" letterSpacing="0.8">BCRP · PERÚ</text>
      <text x="10" y="49" fill="#ffffff" fontFamily="sans-serif" fontSize="27" fontWeight="900" letterSpacing="-1">S/ {denom}</text>
    </svg>
  );
};

export const SvgMonedaFallback: React.FC<{ denom: number }> = ({ denom }) => {
  const esBimetal = (denom === 5 || denom === 2);
  const esPlata = (denom === 1 || denom === 0.5);
  const txt = denom >= 1 ? `S/ ${denom.toFixed(0)}` : `${Math.round(denom * 100)}¢`;

  if (esBimetal) {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="31" fill="#94a3b8" stroke="#475569" strokeWidth="1.5"/>
        <circle cx="32" cy="32" r="21" fill="#d97706" stroke="#78350f" strokeWidth="1"/>
        <text x="32" y="37" textAnchor="middle" fill="#ffffff" fontFamily="sans-serif" fontSize="16" fontWeight="900">{txt}</text>
      </svg>
    );
  } else if (esPlata) {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="31" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5"/>
        <circle cx="32" cy="32" r="25" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2"/>
        <text x="32" y="37" textAnchor="middle" fill="#0f172a" fontFamily="sans-serif" fontSize="16" fontWeight="900">{txt}</text>
      </svg>
    );
  } else {
    return (
      <svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="31" fill="#eab308" stroke="#854d0e" strokeWidth="1.5"/>
        <circle cx="32" cy="32" r="25" fill="none" stroke="#713f12" strokeWidth="1" strokeOpacity="0.4"/>
        <text x="32" y="37" textAnchor="middle" fill="#422006" fontFamily="sans-serif" fontSize="16" fontWeight="900">{txt}</text>
      </svg>
    );
  }
};
