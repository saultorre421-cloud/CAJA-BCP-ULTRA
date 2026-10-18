import { Hoja1Data, Hoja2Data, MapBilletes, MapMonedas } from '../types';
import { DENOMINACIONES_BILLETES, DENOMINACIONES_MONEDAS, vibrarRapido } from './formatters';

// Precompute IEEE 802.3 CRC-32 table
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function escapeXml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface ZipEntryInput {
  name: string;
  content: string;
}

/**
 * Empaqueta archivos XML en un contenedor binario ZIP válido (método STORE = 0)
 * compatible con el estándar OpenXML (.xlsx) en Microsoft Excel Mobile y Google Sheets.
 */
function buildZipArchive(entries: ZipEntryInput[]): Uint8Array {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1F) << 11) |
    ((now.getMinutes() & 0x3F) << 5) |
    ((now.getSeconds() >> 1) & 0x1F);
  const dosDate =
    (((now.getFullYear() - 1980) & 0x7F) << 9) |
    (((now.getMonth() + 1) & 0x0F) << 5) |
    (now.getDate() & 0x1F);

  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = encoder.encode(entry.content);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local File Header (30 bytes + name length)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // Signature
    lv.setUint16(4, 20, true); // Version needed (2.0)
    lv.setUint16(6, 0x0800, true); // General purpose bit flag (UTF-8)
    lv.setUint16(8, 0, true); // Compression method (0 = STORE)
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true); // Compressed size
    lv.setUint32(22, size, true); // Uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true); // Extra field length
    localHeader.set(nameBytes, 30);

    localChunks.push(localHeader, dataBytes);

    // Central Directory File Header (46 bytes + name length)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // Signature
    cv.setUint16(4, 20, true); // Version made by
    cv.setUint16(6, 20, true); // Version needed
    cv.setUint16(8, 0x0800, true); // General purpose bit flag (UTF-8)
    cv.setUint16(10, 0, true); // Compression method (STORE)
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true); // Extra field length
    cv.setUint16(32, 0, true); // File comment length
    cv.setUint16(34, 0, true); // Disk number start
    cv.setUint16(36, 0, true); // Internal file attributes
    cv.setUint32(38, 0, true); // External file attributes
    cv.setUint32(42, offset, true); // Relative offset of local header
    centralHeader.set(nameBytes, 46);

    centralChunks.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  }

  let centralSize = 0;
  for (const c of centralChunks) centralSize += c.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // Signature
  ev.setUint16(4, 0, true); // Number of this disk
  ev.setUint16(6, 0, true); // Disk where central directory starts
  ev.setUint16(8, entries.length, true); // Total entries on this disk
  ev.setUint16(10, entries.length, true); // Total entries in central directory
  ev.setUint32(12, centralSize, true); // Size of central directory
  ev.setUint32(16, offset, true); // Offset of start of central directory
  ev.setUint16(20, 0, true); // Comment length

  const totalLength = offset + centralSize + eocd.length;
  const output = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of localChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  for (const chunk of centralChunks) {
    output.set(chunk, pos);
    pos += chunk.length;
  }
  output.set(eocd, pos);

  return output;
}

function cellInlineStr(ref: string, text: string, styleIndex = 0): string {
  const sAttr = styleIndex > 0 ? ` s="${styleIndex}"` : '';
  return `<c r="${ref}"${sAttr} t="inlineStr"><is><t>${escapeXml(text)}</t></is></c>`;
}

function cellNumber(ref: string, num: number, styleIndex = 0): string {
  const sAttr = styleIndex > 0 ? ` s="${styleIndex}"` : '';
  const safeVal = Number.isFinite(num) ? Number(num.toFixed(2)) : 0;
  return `<c r="${ref}"${sAttr} t="n"><v>${safeVal}</v></c>`;
}

/**
 * Styles mapping in xl/styles.xml:
 * 0: Default general
 * 1: Header Dark Blue (#002A8D) with bold white text
 * 2: Bold label text
 * 3: Currency positive (#,##0.00) black
 * 4: Currency negative (#,##0.00;-#,##0.00) red (#DC2626)
 * 5: Currency bold positive (#,##0.00) black
 * 6: Currency bold red (#,##0.00;-#,##0.00) (#DC2626)
 * 7: Currency bold blue highlight (#002A8D on #EFF6FF)
 * 8: Section subtitle row (#E2E8F0 fill, bold text)
 * 9: Centered integer
 */
function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="#,##0.00;-#,##0.00"/>
  </numFmts>
  <fonts count="6">
    <font><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/></font>
    <font><sz val="11"/><color rgb="FFDC2626"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFDC2626"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FF002A8D"/><name val="Calibri"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF002A8D"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="10">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="4" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="5" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
  </cellXfs>
</styleSheet>`;
}

interface ExportXlsxParams {
  hoja1Data: Hoja1Data;
  hoja2Data: Hoja2Data | null;
  cantF1000: number;
  billetesCierre: MapBilletes;
  monedasCierre: MapMonedas;
  inputSistema: string;
  capitalBase: number;
}

export async function generarYCompartirExcelXlsx({
  hoja1Data,
  hoja2Data,
  cantF1000,
  billetesCierre,
  monedasCierre,
  inputSistema,
  capitalBase,
}: ExportXlsxParams): Promise<void> {
  vibrarRapido([18, 25, 18]);

  // 1. Calcular saldos de Hoja 1 (Movimientos)
  let sumaMovsCentimos = 0;
  for (const m of hoja1Data.movimientos) {
    sumaMovsCentimos += m.montoCentimos || 0;
  }
  const inicialCent = hoja1Data.tieneEfectivoInicial ? hoja1Data.efectivoInicialCentimos : 0;
  const actualCent = inicialCent + sumaMovsCentimos;
  const inicialSoles = inicialCent / 100;
  const actualSoles = actualCent / 100;
  const estadoMovsActivo = hoja1Data.tieneEfectivoInicial || hoja1Data.movimientos.length > 0;

  let rowsSheet1 = '';
  // Row 1: Resumen de Efectivo Inicial y Efectivo Actual
  rowsSheet1 += `<row r="1">` +
    cellInlineStr('A1', 'EFECTIVO INICIAL', 2) +
    cellNumber('B1', inicialSoles, 5) +
    cellInlineStr('D1', 'EFECTIVO ACTUAL', 2) +
    cellNumber('E1', estadoMovsActivo ? actualSoles : 0, 7) +
    `</row>`;

  // Row 3: Encabezados de tabla de movimientos
  rowsSheet1 += `<row r="3">` +
    cellInlineStr('A3', 'N°', 1) +
    cellInlineStr('B3', 'FECHA', 1) +
    cellInlineStr('C3', 'HORA', 1) +
    cellInlineStr('D3', 'DETALLE', 1) +
    cellInlineStr('E3', 'MOVIMIENTO (S/)', 1) +
    `</row>`;

  hoja1Data.movimientos.forEach((m, idx) => {
    const r = idx + 4;
    const montoSoles = (m.montoCentimos || 0) / 100;
    const styleMonto = montoSoles < 0 ? 4 : 3;
    rowsSheet1 += `<row r="${r}">` +
      cellNumber(`A${r}`, idx + 1, 9) +
      cellInlineStr(`B${r}`, m.fecha, 9) +
      cellInlineStr(`C${r}`, m.hora, 9) +
      cellInlineStr(`D${r}`, m.detalle, 2) +
      cellNumber(`E${r}`, montoSoles, styleMonto) +
      `</row>`;
  });

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="8" customWidth="1"/>
    <col min="2" max="2" width="14" customWidth="1"/>
    <col min="3" max="3" width="13" customWidth="1"/>
    <col min="4" max="4" width="24" customWidth="1"/>
    <col min="5" max="5" width="18" customWidth="1"/>
  </cols>
  <sheetData>${rowsSheet1}</sheetData>
</worksheet>`;

  // 2. Calcular datos de Hoja 2 (Cierre General)
  let centManual = 0;
  DENOMINACIONES_BILLETES.forEach(d => {
    centManual += Math.round(d * 100) * (billetesCierre[d] || 0);
  });
  DENOMINACIONES_MONEDAS.forEach(d => {
    centManual += Math.round(d * 100) * (monedasCierre[d] || 0);
  });
  centManual += cantF1000 * 100000;

  const numSis = parseFloat(inputSistema.replace(/,/g, '')) || 0;
  const efecUsadoSoles = centManual !== 0
    ? (centManual / 100)
    : (estadoMovsActivo ? actualSoles : 0);

  const src = hoja2Data || {
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

  let r2 = 1;
  let rowsSheet2 = '';

  const addHeaderRow2 = () => {
    rowsSheet2 += `<row r="${r2}">` +
      cellInlineStr(`A${r2}`, 'DENOMINACIÓN', 1) +
      cellInlineStr(`B${r2}`, 'CANTIDAD', 1) +
      cellInlineStr(`C${r2}`, 'RESULTADO (S/)', 1) +
      `</row>`;
    r2++;
  };

  const addSectionRow2 = (titulo: string) => {
    rowsSheet2 += `<row r="${r2}">` +
      cellInlineStr(`A${r2}`, titulo, 8) +
      cellInlineStr(`B${r2}`, '', 8) +
      cellInlineStr(`C${r2}`, '', 8) +
      `</row>`;
    r2++;
  };

  const addDenomRow2 = (label: string, cant: number, mult: number) => {
    const subtotal = cant * mult;
    rowsSheet2 += `<row r="${r2}">` +
      cellInlineStr(`A${r2}`, label, 2) +
      cellNumber(`B${r2}`, cant, 9) +
      cellNumber(`C${r2}`, subtotal, subtotal < 0 ? 4 : 3) +
      `</row>`;
    r2++;
  };

  const addCuadreRow2 = (label: string, valor: number, styleVal: number) => {
    rowsSheet2 += `<row r="${r2}">` +
      cellInlineStr(`A${r2}`, label, 2) +
      cellInlineStr(`B${r2}`, '', 2) +
      cellNumber(`C${r2}`, valor, styleVal) +
      `</row>`;
    r2++;
  };

  addHeaderRow2();
  addSectionRow2('FAJOS DE S/ 1,000');
  addDenomRow2('Fajos de S/ 1,000', src.f1000, 1000);

  addSectionRow2('BILLETES SUELTOS');
  addDenomRow2('Billetes de S/ 200', src.b200, 200);
  addDenomRow2('Billetes de S/ 100', src.b100, 100);
  addDenomRow2('Billetes de S/ 50', src.b50, 50);
  addDenomRow2('Billetes de S/ 20', src.b20, 20);
  addDenomRow2('Billetes de S/ 10', src.b10, 10);

  addSectionRow2('MONEDAS');
  addDenomRow2('Monedas de S/ 5.00', src.m5, 5);
  addDenomRow2('Monedas de S/ 2.00', src.m2, 2);
  addDenomRow2('Monedas de S/ 1.00', src.m1, 1);
  addDenomRow2('Monedas de S/ 0.50', src.m050, 0.5);
  addDenomRow2('Monedas de S/ 0.20', src.m020, 0.2);
  addDenomRow2('Monedas de S/ 0.10', src.m010, 0.1);

  addSectionRow2('CUADRE FINAL DE CIERRE');
  addCuadreRow2('TOTAL EFECTIVO', src.totalEfectivoSoles, 5);
  addCuadreRow2('SALDO DEL SISTEMA', src.saldoSistemaSoles, 5);
  addCuadreRow2('CAPITAL TOTAL (E + S)', src.capitalTotalSoles, 7);
  addCuadreRow2('CAPITAL BASE REQUERIDO', src.capitalBaseSoles, 5);
  addCuadreRow2('DIFERENCIA (FALTA / SOBRA)', src.diferenciaSoles, src.diferenciaSoles < -0.05 ? 6 : 5);

  const sheet2Xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>
    <col min="1" max="1" width="28" customWidth="1"/>
    <col min="2" max="2" width="14" customWidth="1"/>
    <col min="3" max="3" width="20" customWidth="1"/>
  </cols>
  <sheetData>${rowsSheet2}</sheetData>
</worksheet>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Hoja 1 - Movimientos" sheetId="1" r:id="rId1"/>
    <sheet name="Hoja 2 - Cierre General" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const zipBytes = buildZipArchive([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'xl/workbook.xml', content: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { name: 'xl/styles.xml', content: buildStylesXml() },
    { name: 'xl/worksheets/sheet1.xml', content: sheet1Xml },
    { name: 'xl/worksheets/sheet2.xml', content: sheet2Xml },
  ]);

  const fileName = 'BCP_Caja_y_Cierre.xlsx';
  const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const blob = new Blob([zipBytes.buffer as ArrayBuffer], { type: mimeType });

  // Integración con Web Share API para Android (selector nativo tipo WhatsApp / Excel / Google Sheets)
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && typeof File !== 'undefined') {
      const file = new File([blob], fileName, { type: mimeType });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'BCP Caja y Cierre',
          text: 'Reporte de Movimientos y Cierre General - Agente BCP',
        });
        return;
      }
    }
  } catch (err: any) {
    // Si el usuario cierra voluntariamente el selector de compartir (AbortError), no forzar descarga
    if (err && err.name === 'AbortError') {
      return;
    }
  }

  // Fallback: descarga directa del archivo .xlsx
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
