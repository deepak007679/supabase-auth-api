require('dotenv').config();
const express = require('express');
const { supabase } = require('./supabaseClient');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    name: 'Supabase Auth API',
    version: '1.0.0',
    status: 'connected to Supabase'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} and connected to Supabase`);
  });
}

module.exports = { app };
