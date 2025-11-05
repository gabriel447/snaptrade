import { z } from 'zod';
import { fileTypeFromBuffer } from 'file-type';

export const analyzeBodySchema = z.object({
  imageBase64: z.string().min(1, 'imageBase64 é obrigatório'),
  context: z
    .object({
      timeframe: z.enum(['1m']).default('1m'),
      symbol: z.string().optional()
    })
    .optional()
});

export async function validateAndDecodeImage(base64) {
  // Suporta data URL e string base64 pura
  let mimeFromDataUrl = null;
  let rawBase64 = base64;
  const dataUrlMatch = /^data:(.*?);base64,(.*)$/i.exec(base64);
  if (dataUrlMatch) {
    mimeFromDataUrl = dataUrlMatch[1];
    rawBase64 = dataUrlMatch[2];
  }

  let buffer;
  try {
    buffer = Buffer.from(rawBase64, 'base64');
  } catch (e) {
    throw new Error('Base64 inválido');
  }

  // Checa tamanho máximo
  const maxBytes = Number(process.env.MAX_IMAGE_BYTES || 5_000_000); // 5MB default
  if (!Number.isFinite(maxBytes) || maxBytes <= 0) {
    throw new Error('Configuração MAX_IMAGE_BYTES inválida');
  }
  if (buffer.length > maxBytes) {
    throw new Error(`Imagem excede tamanho máximo (${maxBytes} bytes)`);
  }

  // Detecta MIME por magic bytes
  const ft = await fileTypeFromBuffer(buffer);
  const detectedMime = mimeFromDataUrl || (ft ? ft.mime : null);
  const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
  if (!detectedMime || !allowed.has(detectedMime)) {
    throw new Error('Formato de imagem não suportado (permitido: PNG, JPEG, WEBP)');
  }

  return { buffer, mime: detectedMime, dataUrl: `data:${detectedMime};base64,${rawBase64}` };
}

export const openAIResultSchema = z.object({
  sinal: z.enum(['COMPRAR', 'VENDER', 'AGUARDAR']),
  confianca: z.enum(['alta', 'media', 'baixa']),
  explicacao: z.string().min(10)
});