const { supabase } = require('./supabaseClient');

/**
 * Reusable Authentication Guard Middleware
 * Extracts and verifies the Supabase JWT Bearer token from incoming requests.
 * Attaches verified user to `req.user` or returns 401 Unauthorized.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Check presence of Authorization header
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Validate Bearer format
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  if (!token || token.trim() === '') {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token validity with Supabase Auth Identity Provider
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach verified user and token for downstream handlers
    req.user = data.user;
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
