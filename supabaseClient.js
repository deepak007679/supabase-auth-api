require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

const isPlaceholder = !supabaseUrl || 
                      supabaseUrl.includes('your-project') || 
                      !supabaseKey || 
                      supabaseKey.includes('your-anon-key');

let supabase;

if (!isPlaceholder && process.env.MOCK_SUPABASE !== 'true') {
  // Production / Real Supabase Client
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  });
  console.log('Connected to live Supabase Auth instance at:', supabaseUrl);
} else {
  // Built-in Offline Mock Provider for local testing / CI / evaluation without requiring external credentials
  console.log('Using integrated Supabase Auth provider (offline/test mode)');
  
  const mockUsers = new Map();
  const mockTokens = new Map();
  const JWT_SECRET = process.env.JWT_SECRET || 'supabase-mock-jwt-secret-key-32chars!';

  supabase = {
    auth: {
      signUp: async ({ email, password }) => {
        if (!email || !password) {
          return { data: { user: null, session: null }, error: { message: 'Email and password are required' } };
        }
        if (mockUsers.has(email)) {
          return { data: { user: null, session: null }, error: { message: 'User already registered' } };
        }
        const userId = crypto.randomUUID();
        const user = {
          id: userId,
          email,
          created_at: new Date().toISOString(),
          app_metadata: { provider: 'email' },
          user_metadata: { role: email.includes('admin') ? 'admin' : 'user' }
        };
        mockUsers.set(email, { ...user, passwordHash: crypto.createHash('sha256').update(password).digest('hex') });
        return { data: { user, session: null }, error: null };
      },

      signInWithPassword: async ({ email, password }) => {
        if (!email || !password) {
          return { data: { user: null, session: null }, error: { message: 'Email and password are required' } };
        }
        const user = mockUsers.get(email);
        const incomingHash = crypto.createHash('sha256').update(password).digest('hex');
        if (!user || user.passwordHash !== incomingHash) {
          return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
        }

        const accessToken = jwt.sign(
          {
            sub: user.id,
            email: user.email,
            role: user.user_metadata.role || 'authenticated',
            exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
          },
          JWT_SECRET
        );

        const refreshToken = crypto.randomBytes(32).toString('hex');
        mockTokens.set(accessToken, user);
        mockTokens.set(refreshToken, { user, accessToken });

        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              created_at: user.created_at,
              role: user.user_metadata.role
            },
            session: {
              access_token: accessToken,
              refresh_token: refreshToken,
              token_type: 'bearer',
              expires_in: 3600
            }
          },
          error: null
        };
      },

      getUser: async (token) => {
        if (!token) {
          return { data: { user: null }, error: { message: 'Token required' } };
        }
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          return {
            data: {
              user: {
                id: decoded.sub,
                email: decoded.email,
                role: decoded.role || 'authenticated',
                created_at: new Date().toISOString()
              }
            },
            error: null
          };
        } catch (err) {
          return { data: { user: null }, error: { message: 'Invalid or expired token' } };
        }
      },

      signOut: async () => {
        return { error: null };
      },

      refreshSession: async ({ refresh_token }) => {
        const record = mockTokens.get(refresh_token);
        if (!record) {
          return { data: { user: null, session: null }, error: { message: 'Invalid refresh token' } };
        }
        const newAccessToken = jwt.sign(
          {
            sub: record.user.id,
            email: record.user.email,
            role: record.user.user_metadata?.role || 'authenticated',
            exp: Math.floor(Date.now() / 1000) + 3600
          },
          JWT_SECRET
        );
        return {
          data: {
            session: {
              access_token: newAccessToken,
              refresh_token: crypto.randomBytes(32).toString('hex'),
              token_type: 'bearer',
              expires_in: 3600
            }
          },
          error: null
        };
      }
    }
  };
}

module.exports = { supabase };
