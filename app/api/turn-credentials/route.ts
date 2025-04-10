import { NextResponse } from 'next/server';
import { getAuthToken, verifyAuthToken } from '@/lib/auth';
import * as crypto from 'crypto';

// Ideally, these should be environment variables
const TURN_SERVER_URL = process.env.TURN_SERVER_URL || 'turn:turn.example.com:443';
const TURN_SERVER_USERNAME = process.env.TURN_SERVER_USERNAME || 'turnuser';
const TURN_SERVER_CREDENTIAL = process.env.TURN_SERVER_CREDENTIAL || 'turnpass';

export async function GET(req: Request) {
  try {
    // Get user token from cookies for authentication
    const token = await getAuthToken();
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify token
    const user = await verifyAuthToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate a time-limited TURN credential
    // In a production environment, you'd integrate with a proper TURN server
    // that provides temporary credentials via API
    
    // Calculate expiration (24 hours from now)
    const ttl = 86400; // 24 hours in seconds
    const expiry = Math.floor(Date.now() / 1000) + ttl;
    
    // Create a username with timestamp to enforce the TTL
    const username = `${expiry}:${user.id}`;
    
    // Create an HMAC of the username using the shared secret
    const hmac = crypto.createHmac('sha1', TURN_SERVER_CREDENTIAL);
    hmac.update(username);
    const credential = hmac.digest('base64');
    
    // Return the credentials
    return NextResponse.json({
      username,
      credential,
      ttl,
      uris: [
        `${TURN_SERVER_URL}?transport=tcp`,
        `${TURN_SERVER_URL}?transport=udp`
      ]
    });
  } catch (error) {
    console.error('Error generating TURN credentials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 