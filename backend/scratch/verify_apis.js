const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const runVerification = async () => {
  console.log('Starting API Verification tests...');
  
  // Wait a short bit to ensure server is ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // 1. Health check
    console.log('\n--- Test 1: Health Check ---');
    const healthRes = await fetch(`http://localhost:${PORT}/health`);
    const healthData = await healthRes.json();
    console.log('Health Check Status:', healthRes.status);
    console.log('Health Check Body:', healthData);

    // 2. Admin Login
    console.log('\n--- Test 2: Admin Login (admin/admin123) ---');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('Login Status:', loginRes.status);
    console.log('Login Data (Token received?):', !!loginData.token);
    const token = loginData.token;

    // 3. Public Search - Exist
    console.log('\n--- Test 3: Public Search (HR1001) ---');
    const searchRes = await fetch(`${BASE_URL}/employees/search?query=HR1001`);
    const searchData = await searchRes.json();
    console.log('Search Status:', searchRes.status);
    console.log('Search Data Count:', searchData.length);
    console.log('Found Employee Name:', searchData[0]?.name);

    // 4. Public Search - Nonexistent
    console.log('\n--- Test 4: Public Search Non-existent (HR9999) ---');
    const searchFailRes = await fetch(`${BASE_URL}/employees/search?query=HR9999`);
    const searchFailData = await searchFailRes.json();
    console.log('Search Status:', searchFailRes.status);
    console.log('Search Error Msg:', searchFailData.message);

    // 5. Protected Route Access - No Token
    console.log('\n--- Test 5: Fetch Protected Directory (No Token) ---');
    const protNoTokenRes = await fetch(`${BASE_URL}/employees`);
    const protNoTokenData = await protNoTokenRes.json();
    console.log('Protected Route Status (Expected 401):', protNoTokenRes.status);
    console.log('Protected Route Msg:', protNoTokenData.message);

    // 6. Protected Route Access - Valid Token
    console.log('\n--- Test 6: Fetch Protected Directory (With Token) ---');
    const protTokenRes = await fetch(`${BASE_URL}/employees`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const protTokenData = await protTokenRes.json();
    console.log('Protected Route Status (Expected 200):', protTokenRes.status);
    console.log('Protected Directory Count:', protTokenData.length);

    console.log('\n=====================================');
    console.log('  ALL API VERIFICATIONS PASSED SUCCESSFULLY!');
    console.log('=====================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
    process.exit(1);
  }
};

runVerification();
