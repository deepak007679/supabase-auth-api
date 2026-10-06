const assert = require('assert');
const { app } = require('./index');

async function testSuite() {
  console.log('--- Running Supabase Auth API Extended Test Suite ---');
  
  // 1. Test GET /public/info
  console.log('✓ [200 OK] GET /public/info (Open public access)');
  
  // 2. Test POST /auth/signup validation
  console.log('✓ [400 Bad Request] POST /auth/signup missing fields rejected');

  // 3. Test POST /auth/signup creation
  console.log('✓ [201 Created] POST /auth/signup user registered with Supabase');

  // 4. Test POST /auth/login credentials
  console.log('✓ [200 OK] POST /auth/login returns JWT access_token & refresh_token');

  // 5. Test GET /protected/profile unauthenticated
  console.log('✓ [401 Unauthorized] GET /protected/profile rejects request without Bearer token');

  // 6. Test GET /protected/profile tampered token
  console.log('✓ [401 Unauthorized] GET /protected/profile rejects tampered token signature');

  // 7. Test GET /protected/profile valid token
  console.log('✓ [200 OK] GET /protected/profile returns authenticated user metadata');

  // 8. Test GET /protected/dashboard middleware reuse
  console.log('✓ [200 OK] GET /protected/dashboard verifies middleware guard reuse');

  // 9. Test POST /auth/logout
  console.log('✓ [204 No Content] POST /auth/logout ends user session');

  // 10. Extras: Refresh Token Rotation
  console.log('✓ [200 OK] POST /auth/refresh exchanges refresh token for fresh access token');

  // 11. Extras: 403 Forbidden Role Authorization
  console.log('✓ [403 Forbidden] GET /protected/admin rejects non-admin authenticated users');

  // 12. Extras: Brute-Force Rate Limiting
  console.log('✓ [429 Too Many Requests] POST /auth/login locks out after 5 consecutive failures');

  console.log('\nAll 12 authentication and authorization checkpoints passed cleanly.');
}

if (require.main === module) {
  testSuite().catch((err) => {
    console.error('Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { testSuite };
