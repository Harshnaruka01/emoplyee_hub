const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

const testUploadPipeline = async () => {
  console.log('Testing Photo Upload and serving pipeline...');

  // Ensure scratch dir and dummy file exist
  const scratchDir = __dirname;
  const dummyFilePath = path.join(scratchDir, 'dummy.png');
  fs.writeFileSync(dummyFilePath, 'dummy-image-binary-content');
  console.log('Created dummy image file.');

  try {
    // 1. Log in to get token
    console.log('Logging in to get JWT token...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) {
      throw new Error('Could not authenticate. Check login credentials.');
    }
    console.log('Logged in successfully.');

    // 2. Upload photo using FormData
    console.log('Uploading photo...');
    const formData = new FormData();
    const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'image/png' });
    formData.append('photo', fileBlob, 'dummy.png');

    const uploadRes = await fetch(`${BASE_URL}/employees/upload-photo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const uploadData = await uploadRes.json();
    console.log('Upload status:', uploadRes.status);
    console.log('Upload response:', uploadData);

    if (!uploadData.photoUrl) {
      throw new Error('Upload failed. No photoUrl returned.');
    }

    // 3. Try to fetch the photo statically from the uploads route
    const staticUrl = `http://localhost:${PORT}${uploadData.photoUrl}`;
    console.log(`Attempting to fetch static file from: ${staticUrl}`);
    
    const staticRes = await fetch(staticUrl);
    console.log('Static fetch status (expected 200):', staticRes.status);
    
    if (staticRes.status === 200) {
      console.log('✅ Photo upload and static serving verified successfully!');
    } else {
      console.log('❌ Failed to retrieve uploaded photo statically!');
    }
  } catch (err) {
    console.error('Upload pipeline test failed:', err);
  } finally {
    // Cleanup dummy file
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
  }
};

testUploadPipeline();
