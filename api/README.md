# SnapTrade Vision API

API que recebe imagens de gráficos de candles (base64), analisa padrões via OpenAI Vision e retorna sinal de trading para operações de 1 minuto.

## Rodar
1. Copie `.env.example` para `.env` e configure.
2. Instale dependências: `npm install`
3. Inicie: `npm start`

## Endpoint
`POST /analyze`

Body:
{
  "imageBase64": "data:image/png;base64,....",
  "context": { "timeframe": "1m", "symbol": "EURUSD" }
}

Headers:
- `Authorization: Bearer <API_TOKEN>` ou `x-api-token: <API_TOKEN>`

Resposta:
{
  "sinal": "COMPRAR|VENDER|AGUARDAR",
  "confianca": "alta|media|baixa",
  "explicacao": "..."
}