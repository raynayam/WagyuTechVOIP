import { NextResponse } from 'next/server';
import { makeOutboundCall, generateCallTwiML } from '@/lib/twilio-service';
import { getAuthToken, verifyAuthToken } from '@/lib/auth';
import { addCallRecord } from '@/lib/db';

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
    const { phoneNumber } = body;
    
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    // Generate a callback URL for the call
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/phone-call-handler`;
    
    // Make the outbound call
    const callSid = await makeOutboundCall(
      phoneNumber,
      user.id,
      callbackUrl
    );
    
    // Record the call in the database
    const callRecord = await addCallRecord({
      callerId: user.id,
      callerName: user.username,
      recipientId: phoneNumber,
      recipientName: phoneNumber,
      startTime: new Date(),
      status: 'missed', // Will be updated when answered
      callType: 'audio',
      encrypted: false
    });
    
    return NextResponse.json({ 
      success: true, 
      callSid, 
      callId: callRecord.id 
    });
  } catch (error) {
    console.error('Error initiating phone call:', error);
    return NextResponse.json({ 
      error: 'Failed to initiate call',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// This endpoint returns TwiML for call handling
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const callSid = searchParams.get('callSid');
    
    if (!callSid) {
      return NextResponse.json({ error: 'Missing callSid parameter' }, { status: 400 });
    }
    
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    
    // Generate TwiML for the call
    const twiml = generateCallTwiML({
      message: 'Thank you for using our VoIP service. Connecting you now.',
      connectToApp: true,
      appUrl: `${baseUrl}/api/voice-app`
    });
    
    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  } catch (error) {
    console.error('Error generating TwiML:', error);
    
    // Return a basic TwiML response in case of error
    const errorTwiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Sorry, an error occurred while processing your call.</Say>
        <Hangup />
      </Response>
    `;
    
    return new NextResponse(errorTwiml, {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  }
} 