// Add global declarations for mongoose cached connection
interface MongooseCache {
  conn: typeof import('mongoose') | null;
  promise: Promise<typeof import('mongoose')> | null;
}

// Declare WebRTC MediaStream types
interface MediaStreamConstraints {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
  peerIdentity?: string;
}

interface MediaStreamEvent {
  stream: MediaStream;
}

declare global {
  namespace NodeJS {
    interface Global {
      mongoose: MongooseCache;
    }
    
    interface ProcessEnv {
      MONGODB_URI: string;
      NEXT_PUBLIC_URL: string;
      JWT_SECRET: string;
      TWILIO_ACCOUNT_SID: string;
      TWILIO_AUTH_TOKEN: string;
      TWILIO_PHONE_NUMBER: string;
      TWILIO_API_KEY: string;
      TWILIO_APP_SID: string;
      APP_BASE_URL: string;
    }
  }

  // Fix window WebRTC types
  interface Window {
    RTCPeerConnection: typeof RTCPeerConnection;
    mozRTCPeerConnection: typeof RTCPeerConnection;
    webkitRTCPeerConnection: typeof RTCPeerConnection;
    MediaStream: typeof MediaStream;
  }
  
  // Extend CryptoKey for WebRTC encryption
  interface CryptoKey {
    type: string;
    extractable: boolean;
    algorithm: any;
    usages: string[];
  }
  
  // Fix Socket.io types
  interface Socket {
    server: any;
  }
  
  // Fix WebRTC types
  interface RTCIceCandidate {
    urls: string | string[];
    toString(): string;
  }
  
  // Fix SignalingMessage types
  type SignalingMessageType = "offer" | "answer" | "ice-candidate" | "call-rejected" | "call-ended" | "call-transfer" | "call-transfered";
} 