import { NextResponse } from 'next/server';
import { endCall } from '@/lib/twilio-service';
import { getAuthToken, verifyAuthToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // Verify user authentication
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await req.json();
    const { callSid } = body;
    
    if (!callSid) {
      return NextResponse.json({ error: 'Call SID is required' }, { status: 400 });
    }
    
    // End the call
    const callInfo = await endCall(callSid);
    
    return NextResponse.json({ 
      success: true, 
      status: callInfo.status
    });
  } catch (error) {
    console.error('Error ending phone call:', error);
    return NextResponse.json({ 
      error: 'Failed to end call',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 