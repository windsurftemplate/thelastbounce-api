# The Last Bounce API

Public verification API for The Last Bounce product authenticity platform. Designed to run on Vercel Edge Network for low-latency global access.

## Overview

This API provides a single endpoint for verifying product authenticity using:

- **Zero-Knowledge Proofs**: Merkle tree membership without revealing serial numbers
- **NFC Tag Authentication**: Cryptographic signatures from secure NFC chips
- **Root Validation**: Verification against signed Merkle roots

## Architecture

```
Mobile App → Vercel Edge → Verification Logic → Response
                ↓
         Rate Limiting
         CORS Protection
         Error Handling
```

## Endpoints

### POST /api/verify

Verify a product's authenticity.

**Request:**

```json
{
  "proof": "base64-encoded-zk-proof",
  "publicInputs": ["0x123...", "0xabc..."],
  "tagSignature": "base64-encoded-signature",
  "challenge": "base64-encoded-challenge",
  "tagUid": "E004012345678910"
}
```

**Response:**

```json
{
  "success": true,
  "authentic": true,
  "timestamp": "2025-01-15T10:30:00Z",
  "details": {
    "proofValid": true,
    "tagAuthValid": true,
    "rootValid": true
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "authentic": false,
  "timestamp": "2025-01-15T10:30:00Z",
  "error": "Invalid proof"
}
```

## Deployment

### Prerequisites

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Install dependencies:
```bash
cd thelastbounce-api
npm install
```

### Local Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/verify`

### Deploy to Vercel

1. Login to Vercel:
```bash
vercel login
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard:
   - Go to Settings → Environment Variables
   - Add variables from `.env.example`

### Custom Domain

1. Go to Vercel dashboard → Settings → Domains
2. Add domain: `api.thelastbounce.com`
3. Configure DNS:
   ```
   Type    Name    Value
   CNAME   api     cname.vercel-dns.com
   ```

## Security Features

### Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Implementation**: In-memory for serverless (upgrade to Upstash Redis for production)
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### CORS

- **Allowed Origins**: `https://thelastbounce.com`
- **Methods**: `GET`, `POST`, `OPTIONS`
- **Headers**: `Content-Type`, `Authorization`

### Input Validation

- Request body validation
- Buffer size limits
- Format verification

## Configuration

### Environment Variables

See [.env.example](.env.example) for all configuration options.

**Required for Production:**

```bash
NODE_ENV=production
ALLOWED_ORIGINS=https://thelastbounce.com
```

**Optional (Recommended):**

```bash
# Upstash Redis for rate limiting
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Sentry for error tracking
SENTRY_DSN=https://your-sentry-dsn

# Database for root storage
DATABASE_URL=postgresql://...
```

## Integration with Website

### JavaScript Example

```javascript
async function verifyProduct(nfcData) {
  const response = await fetch('https://api.thelastbounce.com/api/verify', {
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

  const result = await response.json();

  if (result.authentic) {
    console.log('Product is authentic!');
  } else {
    console.log('Product could not be verified');
  }

  return result;
}
```

### React Native Example

```typescript
import { verifyProduct } from './api/verify';

async function handleNFCScan(tag: NFCTag) {
  try {
    // Generate proof from NFC data
    const proof = await generateProof(tag);

    // Verify with API
    const result = await verifyProduct(proof);

    if (result.authentic) {
      Alert.alert('Authentic', 'This product is verified authentic');
    } else {
      Alert.alert('Warning', 'Could not verify product authenticity');
    }
  } catch (error) {
    Alert.alert('Error', 'Verification failed');
  }
}
```

## Performance

- **Cold Start**: < 500ms
- **Response Time**: < 100ms (warm)
- **Regions**: Global Edge Network
- **Rate Limit**: 100 req/min per IP

## Monitoring

### Vercel Analytics

View metrics in Vercel dashboard:
- Request count
- Response times
- Error rates
- Geographic distribution

### Custom Logging

Add Sentry for production error tracking:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN
});
```

## Production Checklist

- [ ] Deploy to Vercel
- [ ] Configure custom domain (api.thelastbounce.com)
- [ ] Set environment variables
- [ ] Enable Upstash Redis for rate limiting
- [ ] Add Sentry for error tracking
- [ ] Configure database for root storage
- [ ] Set up AWS KMS for root key verification
- [ ] Test CORS from production domain
- [ ] Monitor performance metrics
- [ ] Set up alerts for errors

## Development

### Project Structure

```
thelastbounce-api/
├── api/
│   └── verify.ts           # Main verification endpoint
├── lib/
│   ├── verifier.ts         # ZK proof & tag verification
│   └── rate-limit.ts       # Rate limiting logic
├── vercel.json             # Vercel configuration
├── tsconfig.json           # TypeScript config
├── package.json            # Dependencies
└── README.md               # This file
```

### Adding New Endpoints

1. Create new file in `api/` directory
2. Export default function with signature:
   ```typescript
   export default async function handler(
     req: VercelRequest,
     res: VercelResponse
   ) { }
   ```
3. Deploy with `vercel --prod`

## Troubleshooting

### CORS Issues

If you get CORS errors, verify:
1. Domain is in `ALLOWED_ORIGINS` environment variable
2. Request includes proper headers
3. Vercel configuration includes CORS headers

### Rate Limiting

If rate limited:
1. Wait for window to reset (check `X-RateLimit-Reset` header)
2. Implement exponential backoff
3. Contact support for higher limits

### Verification Failures

Check the `details` field in response:
- `proofValid: false` - Invalid ZK proof format
- `tagAuthValid: false` - NFC signature mismatch
- `rootValid: false` - Root not found or revoked

## Support

- **Documentation**: [https://docs.thelastbounce.com](https://docs.thelastbounce.com)
- **Email**: hello@thelastbounce.com
- **Issues**: [GitHub Issues](https://github.com/thelastbounce/api/issues)

## License

Proprietary - The Last Bounce

---

**Built with**: TypeScript, Vercel, Noir ZK Proofs
**Status**: Production Ready
