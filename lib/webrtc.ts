export type PeerConnection = RTCPeerConnection | null
export type MediaStreamType = MediaStream | null

export interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "call-rejected" | "call-ended" | "call-transfer" | "call-transfered";
  payload: any;
  sender: string;
  recipient: string | null;
  senderName?: string;
  callType?: "audio" | "video";
  encrypted?: boolean;
}

// Function to fetch TURN credentials from server
export async function getTurnCredentials() {
  try {
    const response = await fetch('/api/turn-credentials');
    if (!response.ok) {
      throw new Error('Failed to fetch TURN credentials');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching TURN credentials:', error);
    // Fallback to default configuration
    return {
      username: 'default',
      credential: 'default',
      ttl: 86400,
      uris: [
        'turn:turn.example.com:443?transport=tcp',
        'turn:turn.example.com:443?transport=udp'
      ]
    };
  }
}

// Configuration for ICE servers (STUN and TURN)
export const rtcConfig: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun1.l.google.com:19302" },
    // Default TURN servers that will be replaced with dynamic credentials
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
}

// Helper function to create a new RTCPeerConnection with dynamic TURN credentials
export async function createPeerConnection(config: RTCConfiguration = rtcConfig): Promise<PeerConnection> {
  try {
    // Get dynamic TURN credentials
    const turnCredentials = await getTurnCredentials();
    
    // Update the configuration with the fresh credentials
    const updatedConfig = {
      ...config,
      iceServers: [
        ...config.iceServers?.filter(server => server.urls.toString().includes('stun:')) || [],
        {
          urls: turnCredentials.uris,
          username: turnCredentials.username,
          credential: turnCredentials.credential
        }
      ]
    };
    
    return new RTCPeerConnection(updatedConfig);
  } catch (error) {
    console.error("Error creating RTCPeerConnection:", error);
    // Fallback to default configuration if TURN credential fetch fails
    return new RTCPeerConnection(config);
  }
}

// Helper function to get user media (audio and/or video)
export async function getUserMedia(constraints: MediaStreamConstraints = { audio: true, video: false }): Promise<MediaStreamType> {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error("Error accessing media devices:", error);
    return null;
  }
}

// Helper function to get user's display for screen sharing
export async function getDisplayMedia(): Promise<MediaStreamType> {
  try {
    return await navigator.mediaDevices.getDisplayMedia({ video: true });
  } catch (error) {
    console.error("Error accessing display media:", error);
    return null;
  }
}

// Helper function to add tracks from a media stream to a peer connection
export function addTracksFromStream(peerConnection: PeerConnection, stream: MediaStreamType): void {
  if (!peerConnection || !stream) return;

  stream.getTracks().forEach((track: MediaStreamTrack) => {
    peerConnection.addTrack(track, stream);
  });
}

// Helper function to encrypt data (for future implementation of end-to-end encryption)
export async function encryptData(data: any, key: CryptoKey): Promise<ArrayBuffer> {
  try {
    // This is a placeholder for actual encryption logic
    // In a real implementation, you would use the Web Crypto API
    const encoder = new TextEncoder();
    const encoded = encoder.encode(JSON.stringify(data));
    
    // Return the encoded data explicitly as ArrayBuffer
    return encoded.buffer as ArrayBuffer;
  } catch (error) {
    console.error("Error encrypting data:", error);
    throw error;
  }
}

// Helper function to decrypt data (for future implementation of end-to-end encryption)
export async function decryptData(encryptedData: ArrayBuffer, key: CryptoKey): Promise<any> {
  try {
    // This is a placeholder for actual decryption logic
    // In a real implementation, you would use the Web Crypto API
    const decoder = new TextDecoder();
    const decoded = decoder.decode(new Uint8Array(encryptedData));
    
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw error;
  }
}

// Helper function to generate encryption keys (for future implementation of end-to-end encryption)
export async function generateEncryptionKey(): Promise<CryptoKey> {
  try {
    // Generate a random encryption key using the Web Crypto API
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
    
    return key;
  } catch (error) {
    console.error("Error generating encryption key:", error);
    throw error;
  }
}
