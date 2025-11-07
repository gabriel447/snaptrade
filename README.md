# SnapTrade Vision API

Monorepo com duas aplicações:

- `api/`: servidor Express para análise de gráficos de candles (Vision), com autenticação por token e CORS.
- `web/`: frontend React para envio de imagem e exibição do sinal (aposta para baixo ou para cima).

## Como usar
1. Configure `api/.env` (inclua `OPENAI_API_KEY` e `API_TOKEN`).
2. Rode a API: `cd api && npm install && npm start`.
3. Configure `web/.env` (inclua `VITE_API_BASE_URL` e `VITE_API_TOKEN`).
4. Rode o frontend: `cd web && npm install && npm run dev`.

Abra o frontend e envie a imagem; o resultado mostra se deve apostar para baixo (VENDER) ou para cima (COMPRAR), ou aguardar.


## Requisitos
- Node.js >= 18
- Chave da OpenAI (`OPENAI_API_KEY`)

## Configuração
1. Copie `.env.example` para `.env` e configure variáveis.
2. Instale dependências: `npm install`
3. Inicie: `npm start`

## Autenticação por Token
- Todos os endpoints exigem token.
- Defina `API_TOKEN` no `.env` com um token único fixo.
- Envie o token via `Authorization: Bearer <token>` ou header `X-API-TOKEN: <token>`.

- Se `API_TOKEN` não estiver definido, a API responde com `401 Token não configurado`.

Exemplo cURL (apenas endpoint principal):
```
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MEU_TOKEN" \
  --data-binary '{
    "imageBase64":"data:image/png;base64,SEU_BASE64_AQUI",
    "context":{"timeframe":"1m","symbol":"EURUSD"}
  }'
```

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
- Rate limit por token: configure `RATE_LIMIT_RPS` (default 5) e `RATE_LIMIT_WINDOW_MS` (default 1000ms)
