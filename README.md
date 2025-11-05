# SnapTrade Vision API

API em Node.js que recebe imagens de gráficos de candles (base64), analisa padrões via OpenAI Vision e retorna sinal de trading para operações de 1 minuto.

## Requisitos
- Node.js >= 18
- Chave da OpenAI (`OPENAI_API_KEY`)

## Configuração
1. Copie `.env.example` para `.env` e configure variáveis.
2. Instale dependências: `npm install`
3. Inicie: `npm start`

## Endpoint
`POST /analyze`

Body JSON:
```json
{
  "imageBase64": "data:image/png;base64,....",
  "context": { "timeframe": "1m", "symbol": "EURUSD" }
}
```

Resposta:
```json
{
  "sinal": "COMPRAR|VENDER|AGUARDAR",
  "confianca": "alta|media|baixa",
  "explicacao": "..."
}
```

## Observações
- Formatos de imagem aceitos: PNG, JPEG, WEBP
- Tamanho máximo configurável via `MAX_IMAGE_BYTES` (default 5MB)
- Rate limit padrão: 60 req/min por IP