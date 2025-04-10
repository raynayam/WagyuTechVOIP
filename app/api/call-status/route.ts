import { NextResponse } from 'next/server';
import { updateCallRecord } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // Parse the form data from Twilio webhook
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const callDuration = formData.get('CallDuration') as string;
    
    if (!callSid) {
      return NextResponse.json({ error: 'Missing CallSid' }, { status: 400 });
    }
    
    // Fetch the call from our database using CallSid
    // This would require adding a callSid field to our call model
    // For now, this is a placeholder implementation
    
    // Map Twilio call status to our internal status
    let status: 'missed' | 'completed' | 'rejected' = 'missed';
    switch (callStatus) {
      case 'completed':
        status = 'completed';
        break;
      case 'busy':
      case 'no-answer':
      case 'failed':
      case 'canceled':
        status = 'missed';
        break;
      case 'rejected':
        status = 'rejected';
        break;
    }
    
    // Update call record in database
    // For a real implementation, you would look up the call by CallSid
    // Here we're assuming you would add callSid to your call schema
    // await updateCallRecord(callId, {
    //   status,
    //   endTime: new Date(),
    //   duration: callDuration ? parseInt(callDuration, 10) : undefined
    // });
    
    // Placeholder response for now
    console.log(`Call status update: ${callSid} - ${callStatus} - ${callDuration}s`);
    
    // Return an empty 200 response to acknowledge the webhook
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error handling call status webhook:', error);
    return NextResponse.json({ error: 'Failed to process call status' }, { status: 500 });
  }
} 