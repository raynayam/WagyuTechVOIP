import twilio from 'twilio';

// Twilio credentials - in production, these should be environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'your_account_sid';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'your_auth_token';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || 'your_twilio_phone_number';

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Generate a Twilio access token for voice calls
 * This token is used by the client to authenticate with Twilio
 */
export async function generateTwilioToken(userId: string, userName: string) {
  // @ts-ignore
  const AccessToken = twilio.jwt.AccessToken;
  // @ts-ignore
  const VoiceGrant = AccessToken.VoiceGrant;
  
  // Create a Voice grant for this token
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_APP_SID,
    incomingAllow: true,
  });
  
  // Create an access token
  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    process.env.TWILIO_API_KEY || 'your_api_key',
    { identity: userId }
  );
  
  // Add the voice grant to the token
  token.addGrant(voiceGrant);
  
  // Set the token TTL (time to live)
  token.ttl = 3600; // 1 hour
  
  return token.toJwt();
}

/**
 * Make an outbound call to a regular phone number
 * Returns call SID if successful
 */
export async function makeOutboundCall(to: string, from: string, callbackUrl: string) {
  try {
    // Normalize the 'to' number to E.164 format if necessary
    let toNumber = to;
    if (!to.startsWith('+')) {
      toNumber = `+${to}`; // Add + prefix if missing
    }
    
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    
    // Make the call
    const call = await twilioClient.calls.create({
      to: toNumber,
      from: TWILIO_PHONE_NUMBER,
      url: callbackUrl, // A TwiML URL that dictates call behavior
      statusCallback: `${baseUrl}/api/call-status`, // Webhook for call status updates
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
    });
    
    return call.sid;
  } catch (error) {
    console.error('Error making outbound call:', error);
    throw error;
  }
}

/**
 * Generate TwiML for call handling
 * This is the XML that tells Twilio how to handle the call
 */
export function generateCallTwiML(options: { 
  message?: string, 
  recordCall?: boolean, 
  connectToApp?: boolean,
  appUrl?: string
}) {
  // @ts-ignore
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
  
  // Add a welcome message if provided
  if (options.message) {
    response.say(options.message);
  }
  
  // Record the call if requested
  if (options.recordCall) {
    response.record({
      action: `${baseUrl}/api/call-recording`,
      method: 'POST',
      maxLength: 600, // 10 minutes
      transcribe: true,
    });
  }
  
  // Connect to the app if requested
  if (options.connectToApp && options.appUrl) {
    const dial = response.dial({
      callerId: TWILIO_PHONE_NUMBER,
    });
    
    dial.client({
      url: options.appUrl,
    }, 'user');
  }
  
  return response.toString();
}

/**
 * Get call details from Twilio
 */
export async function getCallDetails(callSid: string) {
  try {
    const call = await twilioClient.calls(callSid).fetch();
    return call;
  } catch (error) {
    console.error('Error fetching call details:', error);
    throw error;
  }
}

/**
 * End an active call
 */
export async function endCall(callSid: string) {
  try {
    const call = await twilioClient.calls(callSid).update({
      status: 'completed',
    });
    return call;
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS(to: string, body: string) {
  try {
    const message = await twilioClient.messages.create({
      body,
      to: to.startsWith('+') ? to : `+${to}`,
      from: TWILIO_PHONE_NUMBER,
    });
    
    return message.sid;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
} 