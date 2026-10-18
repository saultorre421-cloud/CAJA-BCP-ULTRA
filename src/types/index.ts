export type ModoOperacion = 'recibo' | 'deposito' | 'retiro';

export type ContextoPrincipal = 'caja' | 'cierre';

export type ScreenApp = 'app-caja' | 'app-cierre' | 'app-multiplicador' | 'app-movimientos';

export interface Movimiento {
  fecha: string;
  hora: string;
  detalle: string;
  montoCentimos: number;
}

export interface Hoja1Data {
  tieneEfectivoInicial: boolean;
  efectivoInicialCentimos: number;
  movimientos: Movimiento[];
}

export interface Hoja2Data {
  fechaHora: string;
  f1000: number;
  b200: number;
  b100: number;
  b50: number;
  b20: number;
  b10: number;
  m5: number;
  m2: number;
  m1: number;
  m050: number;
  m020: number;
  m010: number;
  totalEfectivoSoles: number;
  saldoSistemaSoles: number;
  capitalTotalSoles: number;
  capitalBaseSoles: number;
  diferenciaSoles: number;
}

export type CuadrosMap = { [key: string]: string };

export interface DatosCajaModos {
  recibo: CuadrosMap;
  retiro: CuadrosMap;
  deposito: CuadrosMap;
}

export type DenominacionBillete = 200 | 100 | 50 | 20 | 10;
export type DenominacionMoneda = 5 | 2 | 1 | 0.5 | 0.2 | 0.1;

export type MapBilletes = Record<number, number>;
export type MapMonedas = Record<number, number>;
