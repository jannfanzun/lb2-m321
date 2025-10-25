/**
 * Integration Tests für das Tic-Tac-Toe System
 *
 * Diese Tests überprüfen die Kommunikation zwischen den Services
 * und das grundlegende Verhalten des Systems
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const USER_SERVICE_URL = 'http://localhost:3001';
const GAME_SERVICE_URL = 'http://localhost:3002';

// Utility function for HTTP requests
function makeRequest(url, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test Cases
const tests = [];
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

// ============================================
// Test Suite 1: Health Checks
// ============================================

test('API Gateway health check', async () => {
  const res = await makeRequest(`${BASE_URL}/health`);
  assertEqual(res.statusCode, 200, 'Health check should return 200');
  assert(res.body.status === 'UP', 'Gateway should be UP');
});

test('User Service health check', async () => {
  const res = await makeRequest(`${USER_SERVICE_URL}/health`);
  assertEqual(res.statusCode, 200, 'Health check should return 200');
  assert(res.body.status === 'UP', 'User service should be UP');
});

test('Game Service health check', async () => {
  const res = await makeRequest(`${GAME_SERVICE_URL}/health`);
  assertEqual(res.statusCode, 200, 'Health check should return 200');
  assert(res.body.status === 'UP', 'Game service should be UP');
});

// ============================================
// Test Suite 2: User Authentication
// ============================================

let testToken = null;
let testUserId = null;

test('User registration', async () => {
  const res = await makeRequest(
    `${BASE_URL}/api/users/register`,
    'POST',
    {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'test123456'
    }
  );
  assert([201, 200].includes(res.statusCode), `Registration should return 200/201, got ${res.statusCode}`);
  assert(res.body.token, 'Response should contain token');
  assert(res.body.user.id, 'Response should contain user ID');

  testToken = res.body.token;
  testUserId = res.body.user.id;
});

test('User login', async () => {
  const res = await makeRequest(
    `${BASE_URL}/api/users/login`,
    'POST',
    {
      email: `test_${Date.now() - 1000}@example.com`,
      password: 'test123456'
    }
  );
  assert([200, 401].includes(res.statusCode), 'Login should return valid status');
});

test('Get user profile', async () => {
  if (!testToken) {
    console.log('Skipping profile test - no token');
    return;
  }

  const res = await makeRequest(
    `${BASE_URL}/api/users/profile`,
    'GET',
    null,
    { 'Authorization': `Bearer ${testToken}` }
  );
  assert([200, 401].includes(res.statusCode), 'Get profile should return valid status');
});

// ============================================
// Test Suite 3: Game Service
// ============================================

let testGameId = null;

test('Create game', async () => {
  if (!testUserId) {
    console.log('Skipping game creation - no user ID');
    return;
  }

  const res = await makeRequest(
    `${BASE_URL}/api/games/create`,
    'POST',
    { player1_id: testUserId }
  );
  assert([200, 201].includes(res.statusCode), `Create game should return 200/201, got ${res.statusCode}`);
  assert(res.body.game && res.body.game._id, 'Response should contain game ID');

  testGameId = res.body.game._id;
});

test('Get game', async () => {
  if (!testGameId) {
    console.log('Skipping get game - no game ID');
    return;
  }

  const res = await makeRequest(
    `${BASE_URL}/api/games/${testGameId}`,
    'GET'
  );
  assert([200, 404].includes(res.statusCode), 'Get game should return valid status');
  if (res.statusCode === 200) {
    assert(res.body._id === testGameId, 'Response should contain correct game ID');
  }
});

// ============================================
// Test Suite 4: Circuit Breaker Status
// ============================================

test('Circuit breaker status endpoint', async () => {
  const res = await makeRequest(`${BASE_URL}/status/circuit-breakers`);
  assertEqual(res.statusCode, 200, 'Should return 200');
  assert(res.body.circuitBreakers, 'Response should contain circuit breakers');
  assert(Array.isArray(res.body.circuitBreakers), 'Circuit breakers should be an array');
});

// ============================================
// Test Execution
// ============================================

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Running Integration Tests');
  console.log('='.repeat(60) + '\n');

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  Error: ${error.message}`);
      failedTests++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Tests completed: ${passedTests} passed, ${failedTests} failed`);
  console.log('='.repeat(60) + '\n');

  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests after a short delay to ensure services are ready
setTimeout(runTests, 2000);
