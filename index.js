require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const { supabase } = require('./supabaseClient');
const { requireAuth } = require('./authMiddleware');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Rate limiting state for brute-force protection
const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Swagger UI at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  swaggerOptions: { persistAuthorization: true },
  customSiteTitle: 'Supabase Auth API Docs'
}));

// Root info
app.get('/', (req, res) => {
  res.json({
    name: 'Supabase Auth API',
    version: '1.0.0',
    documentation: 'http://localhost:3000/docs',
    status: 'connected to Supabase',
    endpoints: [
      'POST /auth/signup',
      'POST /auth/login',
      'POST /auth/refresh',
      'POST /auth/logout',
      'GET /public/info',
      'GET /protected/profile',
      'GET /protected/dashboard',
      'GET /protected/admin',
      'GET /docs'
    ]
  });
});

// Stage 1: Open auth - Sign Up
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || typeof email !== 'string' || !email.trim() ||
      !password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({
      message: 'User registered successfully',
      user: data.user
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during registration', details: err.message });
  }
});

// Stage 1 + Extras: Open auth - Log In with Brute-Force Rate Limiting (429)
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const clientIp = req.ip || req.connection.remoteAddress || 'client';

  // Check rate limit status
  const attemptRecord = failedLoginAttempts.get(clientIp);
  const now = Date.now();
  if (attemptRecord && attemptRecord.count >= MAX_FAILED_ATTEMPTS) {
    if (now - attemptRecord.firstAttempt < LOCKOUT_WINDOW_MS) {
      return res.status(429).json({
        error: 'Too many failed login attempts. Account temporarily locked for 5 minutes.'
      });
    } else {
      // Window expired, reset counter
      failedLoginAttempts.delete(clientIp);
    }
  }

  if (!email || typeof email !== 'string' || !email.trim() ||
      !password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error || !data || !data.session) {
      // Record failed attempt
      const existing = failedLoginAttempts.get(clientIp) || { count: 0, firstAttempt: now };
      existing.count += 1;
      failedLoginAttempts.set(clientIp, existing);

      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Reset rate limiter on successful login
    failedLoginAttempts.delete(clientIp);

    return res.status(200).json({
      message: 'Login successful',
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type || 'bearer',
      expires_in: data.session.expires_in || 3600,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during login', details: err.message });
  }
});

// Extras: Refresh Token Rotation
app.post('/auth/refresh', async (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token || typeof refresh_token !== 'string' || !refresh_token.trim()) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refresh_token.trim() });
    if (error || !data || !data.session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    return res.status(200).json({
      message: 'Token refreshed successfully',
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: 'bearer',
      expires_in: data.session.expires_in || 3600
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during token refresh', details: err.message });
  }
});

// Stage 4: Protected Logout endpoint
app.post('/auth/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during logout', details: err.message });
  }
});

// Stage 2: Public gate
app.get('/public/info', (req, res) => {
  res.status(200).json({ message: 'Welcome stranger! This info is public.' });
});

// Stage 4: Protected profile gate
app.get('/protected/profile', requireAuth, (req, res) => {
  return res.status(200).json({
    id: req.user.id,
    email: req.user.email,
    created_at: req.user.created_at
  });
});

// Stage 4 Checkpoint: Second protected route proving middleware reuse
app.get('/protected/dashboard', requireAuth, (req, res) => {
  return res.status(200).json({
    message: `Welcome to your protected dashboard, ${req.user.email}!`,
    userId: req.user.id,
    role: req.user.role || 'authenticated',
    metrics: {
      activeSessions: 1,
      lastLogin: new Date().toISOString()
    }
  });
});

// Extras: 403 Forbidden Role-Based Authorization
app.get('/protected/admin', requireAuth, (req, res) => {
  const isAdmin = req.user.email?.includes('admin') || req.user.role === 'admin';
  if (!isAdmin) {
    // 403 Forbidden: We know who you are, but you lack permissions!
    return res.status(403).json({
      error: 'Forbidden: Admin access required',
      detail: 'Authenticated user does not possess administrative privileges.'
    });
  }

  return res.status(200).json({
    message: 'Welcome to the Admin Portal',
    adminUser: req.user.email,
    systemMetrics: {
      uptime: '99.98%',
      registeredUsers: 1420,
      activeSessions: 89
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} and connected to Supabase`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
  });
}

module.exports = { app };
