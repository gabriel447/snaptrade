// Autenticação simples: um token fixo via variável de ambiente
export function authMiddleware(req, res, next) {
  const token = (process.env.API_TOKEN || '').trim();

  // Apenas mensagens em caso de token inválido/ausente
  if (!token) {
    return res.status(401).json({ error: 'Token não configurado' });
  }

  const headerAuth = req.headers.authorization || '';
  let provided = null;
  if (headerAuth.startsWith('Bearer ')) {
    provided = headerAuth.substring('Bearer '.length).trim();
  }
  if (!provided && req.headers['x-api-token']) {
    provided = String(req.headers['x-api-token']).trim();
  }

  if (!provided) {
    return res.status(401).json({ error: 'Token ausente' });
  }
  if (provided !== token) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  return next();
}