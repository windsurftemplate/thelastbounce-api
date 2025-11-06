# Website Integration Guide

How to integrate The Last Bounce API with your website.

## Overview

The API provides a simple REST endpoint for verifying product authenticity. This guide shows how to add a "Verify Product" feature to your website.

## Quick Start

### 1. Add the Client Script

Add this script to your website at [thelastbounce-website/verify.js](../thelastbounce-website/):

```javascript
// verify.js
const API_URL = 'https://api.thelastbounce.com';

async function verifyProduct(nfcData) {
  const response = await fetch(`${API_URL}/api/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nfcData)
  });

  if (!response.ok) {
    throw new Error(`Verification failed: ${response.status}`);
  }

  return await response.json();
}
```

### 2. Add to HTML

Include in your HTML:

```html
<script src="verify.js"></script>
```

### 3. Use in Your Code

```javascript
// When user scans NFC tag
async function handleNFCScan(nfcData) {
  try {
    const result = await verifyProduct(nfcData);

    if (result.authentic) {
      showSuccess('Product is authentic!');
    } else {
      showWarning('Could not verify product');
    }
  } catch (error) {
    showError('Verification failed');
  }
}
```

## Complete Example Page

Create a verification page:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verify Product - The Last Bounce</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <section class="verify-section">
    <div class="container">
      <h1>Verify Your Product</h1>
      <p>Scan the NFC tag on your product to verify authenticity</p>

      <div id="verify-status" class="status-hidden">
        <div id="status-message"></div>
      </div>

      <button id="scan-button" class="btn-primary">
        Scan NFC Tag
      </button>

      <div id="result-details" class="details-hidden">
        <h3>Verification Details</h3>
        <ul>
          <li>ZK Proof: <span id="proof-status"></span></li>
          <li>Tag Auth: <span id="tag-status"></span></li>
          <li>Root Valid: <span id="root-status"></span></li>
        </ul>
      </div>
    </div>
  </section>

  <script src="verify.js"></script>
  <script>
    // Web NFC API (Chrome Android only)
    async function scanNFC() {
      if (!('NDEFReader' in window)) {
        alert('NFC not supported on this device');
        return;
      }

      try {
        const ndef = new NDEFReader();
        await ndef.scan();

        ndef.addEventListener('reading', async ({ message, serialNumber }) => {
          // Parse NFC data
          const nfcData = parseNFCData(message);

          // Verify via API
          const result = await verifyProduct(nfcData);

          // Update UI
          updateUI(result);
        });

      } catch (error) {
        console.error('NFC scan failed:', error);
        alert('Failed to scan NFC tag');
      }
    }

    function parseNFCData(message) {
      // Parse NDEF message to extract verification data
      // This depends on how your NFC tags are encoded
      const record = message.records[0];
      const data = JSON.parse(new TextDecoder().decode(record.data));

      return {
        proof: data.proof,
        publicInputs: data.publicInputs,
        tagSignature: data.tagSignature,
        challenge: data.challenge,
        tagUid: data.tagUid
      };
    }

    function updateUI(result) {
      const status = document.getElementById('verify-status');
      const message = document.getElementById('status-message');
      const details = document.getElementById('result-details');

      status.classList.remove('status-hidden');
      details.classList.remove('details-hidden');

      if (result.authentic) {
        status.className = 'status-success';
        message.textContent = '✅ Product is authentic!';
      } else {
        status.className = 'status-warning';
        message.textContent = '⚠️ Could not verify product';
      }

      // Update details
      document.getElementById('proof-status').textContent =
        result.details.proofValid ? '✅ Valid' : '❌ Invalid';
      document.getElementById('tag-status').textContent =
        result.details.tagAuthValid ? '✅ Valid' : '❌ Invalid';
      document.getElementById('root-status').textContent =
        result.details.rootValid ? '✅ Valid' : '❌ Invalid';
    }

    // Attach event listener
    document.getElementById('scan-button').addEventListener('click', scanNFC);
  </script>
</body>
</html>
```

## Mobile App Integration

For React Native apps, use the example from the authenticity platform:

```typescript
// From: authenticity-platform/packages/app/src/services/api.ts

const API_URL = 'https://api.thelastbounce.com';

export async function verifyProduct(proof: VerificationData) {
  const response = await fetch(`${API_URL}/api/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(proof)
  });

  if (!response.ok) {
    throw new Error('Verification failed');
  }

  return await response.json();
}
```

## Error Handling

Always handle errors gracefully:

```javascript
async function safeVerify(nfcData) {
  try {
    const result = await verifyProduct(nfcData);
    return result;
  } catch (error) {
    if (error.message.includes('429')) {
      return {
        success: false,
        authentic: false,
        error: 'Too many requests. Please try again in a minute.'
      };
    }

    if (error.message.includes('500')) {
      return {
        success: false,
        authentic: false,
        error: 'Server error. Please try again later.'
      };
    }

    return {
      success: false,
      authentic: false,
      error: 'Network error. Please check your connection.'
    };
  }
}
```

## Rate Limiting

The API limits requests to 100 per minute per IP. Implement client-side throttling:

```javascript
class VerificationClient {
  constructor() {
    this.lastRequest = 0;
    this.minInterval = 1000; // 1 second between requests
  }

  async verify(nfcData) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequest = Date.now();
    return await verifyProduct(nfcData);
  }
}

const client = new VerificationClient();
```

## Testing

### Test with Mock Data

```javascript
// Test data for development
const mockNFCData = {
  proof: 'SGVsbG8gV29ybGQ=',
  publicInputs: [
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
  ],
  tagSignature: 'c2lnbmF0dXJlZGF0YQ==',
  challenge: 'Y2hhbGxlbmdlZGF0YQ==',
  tagUid: 'E004012345678910'
};

// Test verification
verifyProduct(mockNFCData).then(result => {
  console.log('Verification result:', result);
});
```

### Test CORS

Open your website and run in console:

```javascript
fetch('https://api.thelastbounce.com/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Should return health status without CORS errors.

## Styling

Add these styles to your `styles.css`:

```css
.verify-section {
  padding: 4rem 0;
  text-align: center;
}

.status-hidden {
  display: none;
}

.status-success {
  background: #d1fae5;
  border: 2px solid #10b981;
  color: #065f46;
  padding: 2rem;
  border-radius: 1rem;
  margin: 2rem 0;
}

.status-warning {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  color: #92400e;
  padding: 2rem;
  border-radius: 1rem;
  margin: 2rem 0;
}

.details-hidden {
  display: none;
}

#result-details {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  border: 2px solid var(--color-border);
  margin-top: 2rem;
  text-align: left;
}

#result-details ul {
  list-style: none;
  padding: 0;
}

#result-details li {
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

#result-details li:last-child {
  border-bottom: none;
}
```

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Fetch API | ✅ | ✅ | ✅ | ✅ |
| Web NFC | ✅* | ❌ | ❌ | ❌ |

*Web NFC only available on Chrome Android

For iOS, users need to download your React Native app.

## Security Considerations

1. **Never store API keys**: The API is public, no keys needed
2. **Validate responses**: Always check `result.success` before trusting data
3. **Use HTTPS**: Always use `https://` for API calls
4. **Handle errors**: Don't expose internal errors to users
5. **Rate limiting**: Respect the 100 req/min limit

## Production Checklist

- [ ] Client script added to website
- [ ] CORS tested from production domain
- [ ] Error handling implemented
- [ ] Rate limiting respected
- [ ] UI/UX designed for verification flow
- [ ] Mobile responsiveness tested
- [ ] Loading states added
- [ ] Success/error messages clear
- [ ] Analytics tracking added
- [ ] User documentation written

## Support

- **API Status**: [status.thelastbounce.com](https://status.thelastbounce.com)
- **Documentation**: [docs.thelastbounce.com](https://docs.thelastbounce.com)
- **Email**: hello@thelastbounce.com

---

**API Endpoint**: `https://api.thelastbounce.com/api/verify`
**Method**: POST
**Rate Limit**: 100 requests/minute
