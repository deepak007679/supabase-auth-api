require('dotenv').config();
const express = require('express');
const { supabase } = require('./supabaseClient');
const { requireAuth } = require('./authMiddleware');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Root info
app.get('/', (req, res) => {
  res.json({
    name: 'Supabase Auth API',
    version: '1.0.0',
    status: 'connected to Supabase',
    endpoints: [
      'POST /auth/signup',
      'POST /auth/login',
      'POST /auth/logout',
      'GET /public/info',
      'GET /protected/profile',
      'GET /protected/dashboard'
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

// Stage 1: Open auth - Log In
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};

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
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

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

// Stage 4: Protected Logout endpoint
app.post('/auth/logout', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    // Return 204 No Content on successful logout
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during logout', details: err.message });
  }
});

// Stage 2: Public gate
app.get('/public/info', (req, res) => {
  res.status(200).json({ message: 'Welcome stranger! This info is public.' });
});

// Stage 4: Protected profile gate using reusable auth middleware
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} and connected to Supabase`);
  });
}

module.exports = { app };
