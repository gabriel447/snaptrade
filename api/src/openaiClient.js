import OpenAI from 'openai';

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada nas variáveis de ambiente');
  }
  return new OpenAI({ apiKey });
}

export async function analyzeCandlesWithVision({ client, imageDataUrl, symbol, timeframe }) {
  const systemPrompt = `Você é um analista técnico sênior de gráficos de candles (timeframe 1 minuto).
Objetivo: decidir ação imediata com alta assertividade.
Considere: padrões (engulfing, doji, hammer, shooting star), direção da tendência, zonas de suporte/resistência e contexto do último movimento.
Regras de saída:
- Retorne SOMENTE JSON: {"sinal":"COMPRAR|VENDER|AGUARDAR","confianca":"alta|media|baixa","explicacao":"..."}
- "alta": múltiplas confirmações (padrão forte + tendência + nível técnico)
- "media": algumas confirmações, risco moderado
- "baixa": sinais ambíguos; prefira "AGUARDAR" quando conflito for significativo
- Explicação deve citar padrões/níveis observados e racional objetivo.
Não inclua texto fora do JSON.`;

  const userPrompt = `Contexto: símbolo=${symbol || 'desconhecido'}, timeframe=${timeframe || '1m'}.
Analise os últimos candles e forneça decisão imediata conforme regras de saída.`;

  // Usa Responses API com modelo multimodal otimizado para visão
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: 0,
    max_output_tokens: 300,
    input: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: userPrompt },
          { type: 'input_image', image_url: imageDataUrl }
        ]
      }
    ]
  });

  // Tenta obter texto consolidado
  const text = response.output_text ||
    (response.content && response.content.length ? response.content.map(c => c.text || '').join('\n') : '');

  // Extrai JSON do texto (caso venha com ruídos)
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Resposta da OpenAI não contém JSON válido');
  }
  const parsed = JSON.parse(match[0]);
  return parsed;
}