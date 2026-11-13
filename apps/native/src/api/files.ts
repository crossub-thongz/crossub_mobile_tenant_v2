import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { ApiError, apiFetch } from '@/src/api/http';
import { getApiOrigin } from '@/src/config/api-url';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function latin1(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff;
  return bytes;
}

function pdfEscape(text: string): string {
  const ascii = text.replace(/[^\x20-\x7E]/g, ' ');
  return ascii.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** A one-page PDF of the ledger lines already loaded for this signed-in account. */
export function ledgerPdfBytes(lines: string[]): Uint8Array {
  const body = lines
    .slice(0, 42)
    .map((line, index) => `BT /F1 11 Tf 48 ${760 - index * 16} Td (${pdfEscape(line)}) Tj ET`)
    .join('\n');
  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj',
    `4 0 obj << /Length ${body.length} >> stream\n${body}\nendstream endobj`,
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return latin1(pdf);
}

export function isApiFile(url: string): boolean {
  return url.startsWith('/') || url.startsWith(getApiOrigin());
}

async function shareFile(fileName: string, bytes: Uint8Array, mimeType: string): Promise<void> {
  const dir = FileSystem.cacheDirectory;
  if (!dir) throw new Error('This device cannot save a file yet.');
  const uri = `${dir}${fileName}`;
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), { encoding: FileSystem.EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(uri, {
    mimeType,
    UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : 'public.data',
    dialogTitle: fileName,
  });
}

/** Download a PDF from the tenant API with the mobile bearer token, then open the share sheet. */
export async function downloadAuthedPdf(path: string, fileName: string): Promise<void> {
  const res = await apiFetch(path, { headers: { Accept: 'application/pdf,application/octet-stream,*/*' } });
  if (!res.ok) {
    let message = `Could not download this file (${res.status})`;
    try {
      const body = (await res.json()) as { message?: unknown };
      if (typeof body.message === 'string' && body.message.trim()) message = body.message;
      if (Array.isArray(body.message) && body.message[0]) message = String(body.message[0]);
    } catch {
      // The body was not JSON.
    }
    throw new ApiError(res.status, message);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.length === 0) throw new Error('The file was empty.');
  await shareFile(fileName, bytes, 'application/pdf');
}

export async function sharePdf(fileName: string, bytes: Uint8Array): Promise<void> {
  await shareFile(fileName, bytes, 'application/pdf');
}
