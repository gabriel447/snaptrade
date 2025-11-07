# SnapTrade

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
 
## Frontend Web
Aplicação em React (Vite) para enviar o gráfico e visualizar o resultado da análise.

### Configuração (Web)
1. Copie `web/.env.example` para `web/.env`.
2. Ajuste variáveis:
   - `VITE_API_BASE_URL` (ex.: `http://localhost:3000`)
   - `VITE_API_TOKEN` (opcional; se definido, será enviado como `Authorization: Bearer <token>`)

### Executar em desenvolvimento
Em dois terminais separados:
- API:
  - `cd api && npm install`
  - Configure `api/.env` com `OPENAI_API_KEY` e `API_TOKEN` (opcional: `CORS_ORIGIN=http://localhost:5173`)
  - `npm run dev` (ou `npm start`)
- Web:
  - `cd web && npm install`
  - `npm run dev` (Vite em `http://localhost:5173`)

### Build e preview (Web)
- `cd web && npm run build`
- `npm run preview`

## Variáveis de Ambiente
### API (`api/.env`)
- `OPENAI_API_KEY`: chave da OpenAI
- `API_TOKEN`: token fixo exigido nas requisições (se não definido, retorna 401)
- `MAX_IMAGE_BYTES`: tamanho máximo da imagem (default 5000000)
- `RATE_LIMIT_RPS`: requisições por segundo por token (default 5)
- `RATE_LIMIT_WINDOW_MS`: janela do rate limit em ms (default 1000)

### Web (`web/.env`)
- `VITE_API_BASE_URL`: base da API (ex.: `http://localhost:3000`)
- `VITE_API_TOKEN`: token a ser enviado nas requisições (opcional)

## Estrutura
```
snaptrade/
├── api/        # API Node.js (Express)
└── web/        # Frontend React (Vite)
```
