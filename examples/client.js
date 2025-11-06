/**
 * Example client for The Last Bounce API
 *
 * Use this in your website or mobile app to verify products.
 */

const API_URL = 'https://api.thelastbounce.com';

/**
 * Verify a product's authenticity
 *
 * @param {Object} nfcData - Data from NFC scan
 * @param {string} nfcData.proof - Base64-encoded ZK proof
 * @param {string[]} nfcData.publicInputs - Public inputs (root, nullifier)
 * @param {string} nfcData.tagSignature - Base64-encoded tag signature
 * @param {string} nfcData.challenge - Base64-encoded challenge
 * @param {string} nfcData.tagUid - Tag UID
 * @returns {Promise<Object>} Verification result
 */
async function verifyProduct(nfcData) {
  try {
    const response = await fetch(`${API_URL}/api/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        proof: nfcData.proof,
        publicInputs: nfcData.publicInputs,
        tagSignature: nfcData.tagSignature,
        challenge: nfcData.challenge,
        tagUid: nfcData.tagUid
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

/**
 * Check API health
 */
async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const health = await response.json();
    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    verifyProduct,
    checkHealth
  };
}

// Example usage
async function exampleUsage() {
  // Check API health
  const health = await checkHealth();
  console.log('API Status:', health.status);

  // Example NFC data (replace with actual data from NFC scan)
  const nfcData = {
    proof: 'SGVsbG8gV29ybGQ=', // Base64 encoded
    publicInputs: [
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    ],
    tagSignature: 'c2lnbmF0dXJlZGF0YQ==', // Base64 encoded
    challenge: 'Y2hhbGxlbmdlZGF0YQ==', // Base64 encoded
    tagUid: 'E004012345678910'
  };

  // Verify product
  const result = await verifyProduct(nfcData);

  if (result.authentic) {
    console.log('✅ Product is authentic!');
    console.log('Details:', result.details);
  } else {
    console.log('❌ Product could not be verified');
    if (result.error) {
      console.log('Error:', result.error);
    }
  }
}

// Run example (uncomment to test)
// exampleUsage();
