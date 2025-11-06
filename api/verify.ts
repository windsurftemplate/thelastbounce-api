import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyProof } from '../lib/verifier.js';
import { rateLimit } from '../lib/rate-limit.js';

/**
 * Public verification API endpoint
 *
 * This endpoint accepts verification requests from the mobile app
 * and returns authentication results without storing any user data.
 */

interface VerifyRequest {
  proof: string;           // Base64-encoded ZK proof
  publicInputs: string[];  // Public inputs (root, nullifier hash)
  tagSignature: string;    // NFC tag signature (base64)
  challenge: string;       // Challenge used for tag auth (base64)
  tagUid: string;          // Tag UID for verification
}

interface VerifyResponse {
  success: boolean;
  authentic: boolean;
  timestamp: string;
  error?: string;
  details?: {
    proofValid: boolean;
    tagAuthValid: boolean;
    rootValid: boolean;
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      authentic: false,
      timestamp: new Date().toISOString(),
      error: 'Method not allowed'
    });
  }

  // Rate limiting
  const rateLimitResult = await rateLimit(req);
  if (!rateLimitResult.success) {
    return res.status(429).json({
      success: false,
      authentic: false,
      timestamp: new Date().toISOString(),
      error: 'Too many requests. Please try again later.'
    });
  }

  try {
    const body = req.body as VerifyRequest;

    // Validate request body
    if (!body.proof || !body.publicInputs || !body.tagSignature || !body.challenge || !body.tagUid) {
      return res.status(400).json({
        success: false,
        authentic: false,
        timestamp: new Date().toISOString(),
        error: 'Missing required fields'
      });
    }

    // Verify the proof and tag authentication
    const result = await verifyProof({
      proof: Buffer.from(body.proof, 'base64'),
      publicInputs: body.publicInputs,
      tagSignature: Buffer.from(body.tagSignature, 'base64'),
      challenge: Buffer.from(body.challenge, 'base64'),
      tagUid: body.tagUid
    });

    return res.status(200).json({
      success: true,
      authentic: result.authentic,
      timestamp: new Date().toISOString(),
      details: {
        proofValid: result.proofValid,
        tagAuthValid: result.tagAuthValid,
        rootValid: result.rootValid
      }
    });

  } catch (error) {
    console.error('Verification error:', error);

    return res.status(500).json({
      success: false,
      authentic: false,
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    });
  }
}
