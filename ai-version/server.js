// AI-Generated Quarantined Implementation
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://demo.supabase.co',
  process.env.SUPABASE_KEY || 'dummy-anon-key'
);

// Middleware
const authGuard = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  const token = auth.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Bad token' });
  req.user = user;
  next();
};

app.get('/public/info', (req, res) => {
  res.json({ message: 'public' });
});

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing' });
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data.user);
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing' });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return res.status(401).json({ error: 'Invalid login' });
  res.json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});

app.post('/auth/logout', authGuard, async (req, res) => {
  await supabase.auth.signOut();
  res.status(204).send();
});

app.get('/protected/profile', authGuard, (req, res) => {
  res.json(req.user);
});

app.listen(3000, () => console.log('AI server listening on 3000'));
