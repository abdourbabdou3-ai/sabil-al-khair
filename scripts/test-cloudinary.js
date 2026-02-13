
import { v2 as cloudinary } from 'cloudinary';

// Function to test a specific config
const testConfig = async (cloudName, apiKey, apiSecret) => {
    cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    });

    console.log(`\nTesting with Cloud Name: '${cloudName}'...`);

    try {
        const result = await cloudinary.api.ping();
        console.log(`✅ SUCCESS! Connection established with Cloud Name: '${cloudName}'`);
        return true;
    } catch (error) {
        console.error(`❌ FAILED with Cloud Name: '${cloudName}'`);
        console.error(`   Error Details:`, error);
        return false;
    }
};

(async () => {
    const API_KEY = '796463682942655';
    const API_SECRET = 'HIy-3Jqajo5CQFG0Tn55-I-BiSA';

    // Test 1: Uppercase
    const success1 = await testConfig('SAABIL', API_KEY, API_SECRET);

    // Test 2: Correct Cloud Name from Screenshot
    const success2 = await testConfig('dctqgan7i', API_KEY, API_SECRET);

    if (!success1 && !success2) {
        console.log("\n⚠️ BOTH FAILED. Please check your API Key and Secret.");
    }
})();
