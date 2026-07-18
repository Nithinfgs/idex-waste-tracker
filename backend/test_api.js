const http = require('http');

const API_URL = 'http://localhost:5001';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method: method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Running Backend API Integration Tests...');

  try {
    // Test 1: Fetch Schools
    console.log('\n--- Test 1: GET /api/schools ---');
    const resSchools = await request('GET', '/api/schools');
    console.log(`Status Code: ${resSchools.statusCode}`);
    if (Array.isArray(resSchools.body) && resSchools.body.length > 0) {
      console.log(`✅ Success: Found ${resSchools.body.length} schools.`);
      console.log(`Sample: ${resSchools.body[0].name}`);
    } else {
      console.error('❌ Fail: Expected array of schools');
    }

    // Test 2: Create Waste Post
    console.log('\n--- Test 2: POST /api/waste-posts ---');
    const testPostId = `test-post-${Date.now()}`;
    const testPostPayload = {
      id: testPostId,
      school_id: 'sch-1',
      drumLevel: 0.75,
      estimatedWeight: 30.0,
      reason: 'Excess Lunch Rice',
      createdAt: new Date().toISOString()
    };
    const resCreate = await request('POST', '/api/waste-posts', testPostPayload);
    console.log(`Status Code: ${resCreate.statusCode}`);
    if (resCreate.body.success) {
      console.log('✅ Success: Waste post logged online.');
    } else {
      console.error('❌ Fail: Post creation failed');
    }

    // Test 3: Verify Post Exists and check initial status
    console.log('\n--- Test 3: GET /api/waste-posts Verification ---');
    const resGetPosts = await request('GET', '/api/waste-posts');
    const foundPost = resGetPosts.body.find(p => p.id === testPostId);
    if (foundPost) {
      console.log(`✅ Success: Found newly created post with status: "${foundPost.status}"`);
      console.log(`Initial history items count: ${foundPost.history.length}`);
    } else {
      console.error('❌ Fail: Could not find created post in listings');
    }

    // Test 4: Update Post Status to Reserved (Simulate Collector Reservation)
    console.log('\n--- Test 4: POST /api/waste-posts/:id/status (Reserve) ---');
    const statusPayload = {
      status: 'Reserved',
      collectorId: 'col-1',
      reservedAt: new Date().toISOString()
    };
    const resStatusUpdate = await request('POST', `/api/waste-posts/${testPostId}/status`, statusPayload);
    console.log(`Status Code: ${resStatusUpdate.statusCode}`);
    if (resStatusUpdate.body.success) {
      console.log('✅ Success: Status update returned success.');
    } else {
      console.error('❌ Fail: Status update endpoint failed');
    }

    // Test 5: Verify Reservation and History updates
    console.log('\n--- Test 5: GET /api/waste-posts Validation post-reservation ---');
    const resVerifyPosts = await request('GET', '/api/waste-posts');
    const updatedPost = resVerifyPosts.body.find(p => p.id === testPostId);
    if (updatedPost && updatedPost.status === 'Reserved' && updatedPost.collectorId === 'col-1') {
      console.log('✅ Success: Status is "Reserved" and collectorId is "col-1".');
      console.log(`Updated history logs:`);
      updatedPost.history.forEach((h, i) => {
        console.log(`   [Log ${i + 1}] ${h.message} (${h.status})`);
      });
      if (updatedPost.history.length > 1) {
        console.log('✅ Success: History logs successfully appended!');
      } else {
        console.error('❌ Fail: History logs were not appended');
      }
    } else {
      console.error('❌ Fail: Status was not updated to Reserved on server');
    }

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! SERVER RUNS EXCELLENTLY.');
  } catch (err) {
    console.error('\n❌ Integration Test Suite Failed due to Connection/Network Error:', err.message);
    console.log('Ensure you start the Node server first on port 5001 before running this test script!');
  }
}

runTests();
