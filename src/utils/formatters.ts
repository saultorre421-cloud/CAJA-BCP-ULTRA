export function formatoSoles(val: number): string {
  if (isNaN(val)) return "0.00";
  return Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function formatoEntero(val: number): string {
  if (isNaN(val)) return "0";
  return Math.abs(val).toLocaleString('en-US', {
    maximumFractionDigits: 0
  });
}

export function formatoMonedaConPrefijo(val: number): string {
  if (isNaN(val)) return "S/ 0.00";
  const num = Math.abs(val);
  const texto = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return (val < 0 ? "- S/ " : "S/ ") + texto;
}

export function formatoNumeroPuroHoja1(val: number): string {
  if (isNaN(val)) return "0.00";
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function parseValorCentimosTexto(str: string | number): number {
  if (!str) return 0;
  const raw = String(str).replace(/,/g, '').trim();
  const num = parseFloat(raw);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

export function formatInputString(original: string): string {
  if (original === "") return "";
  const esNegativo = original.trim().startsWith('-');
  let numerico = original.replace(/[^0-9.]/g, '');
  let partes = numerico.split('.');
  if (partes.length > 2) {
    numerico = partes[0] + '.' + partes.slice(1).join('');
    partes = numerico.split('.');
  }
  if (partes[0].length > 0) {
    const entero = parseInt(partes[0], 10);
    partes[0] = isNaN(entero) ? "" : entero.toLocaleString('en-US');
  }
  if (partes[1] !== undefined && partes[1].length > 2) {
    partes[1] = partes[1].substring(0, 2);
  }
  const resultado = partes.join('.');
  return (esNegativo && resultado !== "") ? '-' + resultado : resultado;
}

export function vibrarRapido(patron: number | number[] = 12): void {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(patron);
    } catch {
      // Ignored if browser blocks vibrate
    }
  }
}

export const DENOMINACIONES_BILLETES = [200, 100, 50, 20, 10] as const;
export const DENOMINACIONES_MONEDAS = [5.00, 2.00, 1.00, 0.50, 0.20, 0.10] as const;

export function crearMapa10Cuadros(prefijo: 'b' | 'p'): { [key: string]: string } {
  const obj: { [key: string]: string } = {};
  for (let i = 1; i <= 10; i++) {
    obj[prefijo + i] = '';
  }
  return obj;
}
