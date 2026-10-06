require('dotenv').config();
const express = require('express');
const { supabase } = require('./supabaseClient');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Root info
app.get('/', (req, res) => {
  res.json({
    name: 'Supabase Auth API',
    version: '1.0.0',
    status: 'connected to Supabase'
  });
});

// Stage 1: Open auth - Sign Up
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body || {};

  // Validate: if email or password is missing, return 400
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

  // Validate empty fields -> 400
  if (!email || typeof email !== 'string' || !email.trim() ||
      !password || typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    // If Supabase rejects credentials, return 401
    if (error || !data || !data.session) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // On success, return 200 with access token and refresh token
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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} and connected to Supabase`);
  });
}

module.exports = { app };
