// Autenticação simples por token fixo via variável de ambiente.
const ACTIVE_TOKEN = (process.env.API_TOKEN || '').trim();

function getProvidedToken(req) {
  const headerAuth = req.headers.authorization || '';
  if (headerAuth.startsWith('Bearer ')) {
    return headerAuth.substring('Bearer '.length).trim();
  }
  if (req.headers['x-api-token']) {
    return String(req.headers['x-api-token']).trim();
  }
  return null;
}

export function authMiddleware(req, res, next) {
  const provided = getProvidedToken(req);
  if (!provided) {
    return res.status(401).json({ error: 'Token ausente' });
  }
  if (!ACTIVE_TOKEN) {
    return res.status(401).json({ error: 'Token não configurado' });
  }
  if (provided !== ACTIVE_TOKEN) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  return next();
}