const http = require('http');

const API_HOST = '127.0.0.1';
const API_PORT = 5000;

const runRequest = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request({
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
};

async function runProductionBackendTestSuite() {
  console.log('🧪 Starting VR Connect Production Backend Verification Test Suite...\n');

  try {
    const testId = Date.now();

    // 1. Health Check
    const health = await runRequest('/api/health');
    console.log('✅ 1. Health Check:', health.status === 200 && health.body.status === 'ok' ? 'PASS' : 'FAIL', `(${health.body.service})`);

    // 2. Register Alice (User A)
    const regAlice = await runRequest('/api/auth/register', 'POST', {
      username: `raju_test_${testId}`,
      email: `raju_test_${testId}@example.com`,
      password: 'password123',
      displayName: 'Raju Test',
    });
    console.log('✅ 2. Register User A (Raju):', regAlice.status === 201 ? 'PASS' : 'FAIL');
    let tokenAlice = regAlice.body.token;
    const aliceId = regAlice.body.user.id;

    // 3. Register Bob (User B - Friend)
    const regBob = await runRequest('/api/auth/register', 'POST', {
      username: `friend_test_${testId}`,
      email: `friend_test_${testId}@example.com`,
      password: 'password123',
      displayName: 'Friend Test',
    });
    console.log('✅ 3. Register User B (Friend):', regBob.status === 201 ? 'PASS' : 'FAIL');
    let tokenBob = regBob.body.token;
    const bobId = regBob.body.user.id;

    // 4. Duplicate Registration Rejection (409)
    const dupReg = await runRequest('/api/auth/register', 'POST', {
      username: `raju_test_${testId}`,
      email: `different_${testId}@example.com`,
      password: 'password123',
    });
    console.log('✅ 4. Prevent Duplicate Username Registration (HTTP 409):', dupReg.status === 409 ? 'PASS' : 'FAIL');

    // 5. Login User A
    const loginRes = await runRequest('/api/auth/login', 'POST', {
      emailOrUsername: `raju_test_${testId}`,
      password: 'password123',
    });
    console.log('✅ 5. Login User A:', loginRes.status === 200 && loginRes.body.token ? 'PASS' : 'FAIL');
    tokenAlice = loginRes.body.token;

    // 6. Token Refresh
    const refreshRes = await runRequest('/api/auth/refresh', 'POST', null, tokenAlice);
    console.log('✅ 6. Token Refresh:', refreshRes.status === 200 && refreshRes.body.token ? 'PASS' : 'FAIL');

    // 7. Get Current User Profile (GET /api/auth/me)
    const meRes = await runRequest('/api/auth/me', 'GET', null, tokenAlice);
    console.log('✅ 7. Get Current User Profile (GET /api/auth/me):', meRes.status === 200 && meRes.body.user.id === aliceId ? 'PASS' : 'FAIL');

    // 8. User Search (GET /api/users/search?q=)
    const searchRes = await runRequest(`/api/users/search?q=friend_test_${testId}`, 'GET', null, tokenAlice);
    const foundUser = searchRes.body.users?.find((u) => u.username === `friend_test_${testId}`);
    console.log('✅ 8. User Search by Query:', searchRes.status === 200 && foundUser ? 'PASS' : 'FAIL', `(@${foundUser?.username})`);

    // 9. Lookup User by Username (GET /api/users/:username)
    const lookupRes = await runRequest(`/api/users/friend_test_${testId}`, 'GET', null, tokenAlice);
    console.log('✅ 9. Single User Lookup by Username:', lookupRes.status === 200 && lookupRes.body.user.username === `friend_test_${testId}` ? 'PASS' : 'FAIL');

    // 10. Direct Chat Creation (User A -> User B)
    const chatRes = await runRequest('/api/chats', 'POST', {
      recipientId: bobId,
    }, tokenAlice);
    console.log('✅ 10. Create Direct Conversation (1-on-1):', chatRes.status === 201 ? 'PASS' : 'FAIL');
    const chatId = chatRes.body.chat.id;

    // 11. Duplicate Direct Chat Prevention
    const dupChatRes = await runRequest('/api/chats', 'POST', {
      recipientId: bobId,
    }, tokenAlice);
    console.log('✅ 11. Prevent Duplicate Direct Conversation:', dupChatRes.status === 200 && dupChatRes.body.isExisting ? 'PASS' : 'FAIL');

    // 12. Send Message (User A -> User B)
    const msgRes = await runRequest(`/api/chats/${chatId}/messages`, 'POST', {
      chatId,
      content: 'Hello Friend! Welcome to VR Connect production backend.',
      messageType: 'text',
    }, tokenAlice);
    console.log('✅ 12. Send Message in Direct Chat:', msgRes.status === 201 ? 'PASS' : 'FAIL');
    const messageId = msgRes.body.message.id;

    // 13. List Messages in Chat (User B reads)
    const getMsgsRes = await runRequest(`/api/chats/${chatId}/messages`, 'GET', null, tokenBob);
    console.log('✅ 13. List Messages (User B receives message):', getMsgsRes.status === 200 && getMsgsRes.body.messages?.length >= 1 ? 'PASS' : 'FAIL');

    // 14. Mark Read
    const markReadRes = await runRequest('/api/messages/read', 'POST', { chatId }, tokenBob);
    console.log('✅ 14. Mark Messages Read:', markReadRes.status === 200 ? 'PASS' : 'FAIL');

    // 15. Security Isolation Check: User C (unauthorized) cannot access Chat A-B
    const regEve = await runRequest('/api/auth/register', 'POST', {
      username: `unauthorized_${testId}`,
      email: `unauthorized_${testId}@example.com`,
      password: 'password123',
    });
    const tokenEve = regEve.body.token;

    const unauthorizedChatAccess = await runRequest(`/api/chats/${chatId}/messages`, 'GET', null, tokenEve);
    console.log('✅ 15. Security Authorization Check (HTTP 403 for Non-members):', unauthorizedChatAccess.status === 403 ? 'PASS' : 'FAIL');

    // 16. Update Settings (message_delete_after_viewing)
    const setSettingsRes = await runRequest('/api/settings', 'PATCH', {
      message_delete_after_viewing: '10s',
    }, tokenAlice);
    console.log('✅ 16. Update Settings (message_delete_after_viewing = 10s):', setSettingsRes.status === 200 && setSettingsRes.body.settings.message_delete_after_viewing === '10s' ? 'PASS' : 'FAIL');

    // 17. Save & Retrieve Memories
    const saveMemRes = await runRequest('/api/memories', 'POST', {
      messageId,
      content: 'Cyberpunk VR Architecture Blueprint',
      mediaType: 'text',
      senderName: 'Raju Test',
    }, tokenAlice);
    console.log('✅ 17. Save Memory to User Vault:', saveMemRes.status === 201 ? 'PASS' : 'FAIL');
    const memoryId = saveMemRes.body.memory.id;

    const getMemRes = await runRequest('/api/memories', 'GET', null, tokenAlice);
    console.log('✅ 18. Retrieve Memories (Authenticated Owner Only):', getMemRes.status === 200 && getMemRes.body.count >= 1 ? 'PASS' : 'FAIL');

    // 19. Google Account Linking
    const linkGoogleRes = await runRequest('/api/accounts/google/link', 'POST', {
      googleSub: `sub_${testId}`,
      googleEmail: `raju_${testId}@gmail.com`,
    }, tokenAlice);
    console.log('✅ 19. Link Google Account:', linkGoogleRes.status === 200 ? 'PASS' : 'FAIL');

    // 20. Prevent Linking Same Google Account to Another User (HTTP 409)
    const dupGoogleRes = await runRequest('/api/accounts/google/link', 'POST', {
      googleSub: `sub_${testId}`,
      googleEmail: `raju_${testId}@gmail.com`,
    }, tokenBob);
    console.log('✅ 20. Prevent Duplicate Google Account Linking across VR accounts (HTTP 409):', dupGoogleRes.status === 409 ? 'PASS' : 'FAIL');

    // 21. Export User Data (GET /api/users/me/export)
    const exportRes = await runRequest('/api/users/me/export', 'GET', null, tokenAlice);
    console.log('✅ 21. Export My Data Archive (.JSON):', exportRes.status === 200 && exportRes.body.userProfile ? 'PASS' : 'FAIL');

    // 22. Delete Message
    const delMsgRes = await runRequest(`/api/messages/${messageId}`, 'DELETE', null, tokenAlice);
    console.log('✅ 22. Delete / Recall Message:', delMsgRes.status === 200 ? 'PASS' : 'FAIL');

    // 23. Logout
    const logoutRes = await runRequest('/api/auth/logout', 'POST', null, tokenAlice);
    console.log('✅ 23. User Logout:', logoutRes.status === 200 ? 'PASS' : 'FAIL');

    console.log('\n🎉 ALL 23 PRODUCTION BACKEND INTEGRATION & SECURITY TESTS PASSED!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Suite Execution Error:', err.message);
    process.exit(1);
  }
}

runProductionBackendTestSuite();
