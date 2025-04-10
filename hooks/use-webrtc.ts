"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  type PeerConnection,
  type MediaStreamType,
  createPeerConnection,
  getUserMedia,
  getDisplayMedia,
  addTracksFromStream,
  type SignalingMessage,
  generateEncryptionKey,
  encryptData,
  decryptData
} from "@/lib/webrtc"
import { useSocket } from "@/hooks/use-socket"
import { addCallRecord, updateCallRecord } from "@/lib/db"
import { toast } from "@/hooks/use-toast"

export type CallStatus = "idle" | "connecting" | "connected" | "disconnected" | "error" | "reconnecting"
export type CallType = "audio" | "video"

interface UseWebRTCProps {
  userId: string
  username: string
}

export function useWebRTC({ userId, username }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStreamType>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStreamType>(null)
  const [screenShareStream, setScreenShareStream] = useState<MediaStreamType>(null)
  const [callStatus, setCallStatus] = useState<CallStatus>("idle")
  const [error, setError] = useState<string | null>(null)
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null)
  const [remoteUsername, setRemoteUsername] = useState<string | null>(null)
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [isEncrypted, setIsEncrypted] = useState<boolean>(true)
  const [callType, setCallType] = useState<CallType>("audio")
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false)
  const [isTransferring, setIsTransferring] = useState<boolean>(false)
  const [transferTarget, setTransferTarget] = useState<string | null>(null)
  const [reconnectionAttempts, setReconnectionAttempts] = useState<number>(0)

  const peerConnectionRef = useRef<PeerConnection>(null)
  const encryptionKeyRef = useRef<CryptoKey | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      if (!peerConnectionRef.current) return

      try {
        if (message.type === "offer") {
          setRemotePeerId(message.sender)
          setRemoteUsername(message.senderName || "Unknown User")
          
          // Set call type based on offer
          if (message.callType) {
            setCallType(message.callType)
          }
          
          // Set encryption status
          setIsEncrypted(message.encrypted !== false)

          // Record incoming call
          const callRecord = await addCallRecord({
            callerId: message.sender,
            callerName: message.senderName || "Unknown User",
            recipientId: userId,
            recipientName: username,
            startTime: new Date(),
            status: "missed", // Will be updated when answered
            callType: message.callType || "audio",
            encrypted: message.encrypted !== false
          })

          setCurrentCallId(callRecord.id)

          // If we're using encryption, generate a key
          if (message.encrypted !== false) {
            encryptionKeyRef.current = await generateEncryptionKey()
          }

          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.payload))
          setCallStatus("connecting")
          
          // Show notification for incoming call
          toast({
            title: "Incoming Call",
            description: `${message.senderName || "Someone"} is calling you`,
            duration: 10000
          })
        } else if (message.type === "answer") {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.payload))
          setCallStatus("connected")
          setCallStartTime(new Date())
          
          // Reset reconnection attempts when successfully connected
          setReconnectionAttempts(0)

          // Update call record to completed
          if (currentCallId) {
            await updateCallRecord(currentCallId, {
              status: "completed",
            })
          }
        } else if (message.type === "ice-candidate") {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.payload))
        } else if (message.type === "call-rejected") {
          cleanup()
          setError("Call rejected")
          toast({
            title: "Call Rejected",
            description: `${message.senderName || "The recipient"} rejected your call`,
            variant: "destructive"
          })

          // Update call record to rejected
          if (currentCallId) {
            await updateCallRecord(currentCallId, {
              status: "rejected",
              endTime: new Date(),
            })
          }
        } else if (message.type === "call-ended") {
          cleanup()
          toast({
            title: "Call Ended",
            description: `${message.senderName || "The other person"} ended the call`
          })

          // Update call record with end time and duration
          if (currentCallId && callStartTime) {
            const endTime = new Date()
            const duration = Math.floor((endTime.getTime() - callStartTime.getTime()) / 1000) // in seconds

            await updateCallRecord(currentCallId, {
              endTime,
              duration,
              status: "completed",
            })
          }
        } else if (message.type === "call-transfer") {
          // Handle call transfer request
          setIsTransferring(true)
          setTransferTarget(message.payload.targetId)
          
          toast({
            title: "Call Transfer",
            description: `${message.senderName || "The other person"} is transferring you to another user`
          })
          
          // We'll end the current call to start a new one with the transfer target
          cleanup()
          
          // Update call record with transfer information
          if (currentCallId) {
            await updateCallRecord(currentCallId, {
              endTime: new Date(),
              status: "completed",
              transferred: true,
              transferredTo: message.payload.targetId
            })
          }
        }
      } catch (err) {
        console.error("Error handling signaling message:", err)
        setError("Error processing call data")
        setCallStatus("error")
        
        // Try to reconnect if connection fails
        if (callStatus === "connecting" || callStatus === "connected") {
          handleConnectionFailure()
        }
      }
    },
    [userId, username, currentCallId, callStartTime, callStatus],
  )

  // Initialize socket connection
  const { isConnected, sendSignal } = useSocket({
    userId,
    onSignal: handleSignalingMessage,
  })

  // Handle ICE connection state changes for improved error recovery
  const handleIceConnectionStateChange = useCallback(() => {
    if (!peerConnectionRef.current) return;
    
    const connectionState = peerConnectionRef.current.iceConnectionState;
    console.log("ICE connection state:", connectionState);
    
    if (connectionState === "failed" || connectionState === "disconnected") {
      // Try to reconnect
      if (callStatus === "connected") {
        setCallStatus("reconnecting");
        handleConnectionFailure();
      }
    } else if (connectionState === "connected" && callStatus === "reconnecting") {
      // Successfully reconnected
      setCallStatus("connected");
      setReconnectionAttempts(0);
      toast({
        title: "Connection Restored",
        description: "Call connection has been restored"
      });
    }
  }, [callStatus]);

  // Handle connection failures with reconnection logic
  const handleConnectionFailure = useCallback(() => {
    if (reconnectionAttempts >= 3) {
      // Give up after 3 attempts
      setError("Connection failed after multiple attempts");
      setCallStatus("error");
      cleanup();
      toast({
        title: "Connection Lost",
        description: "Could not reconnect the call after multiple attempts",
        variant: "destructive"
      });
      return;
    }
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Increment the attempt counter
    setReconnectionAttempts(prev => prev + 1);
    
    // Try to reconnect after a delay (exponential backoff)
    const delay = Math.min(1000 * Math.pow(2, reconnectionAttempts), 10000);
    toast({
      title: "Connection Issue",
      description: `Attempting to reconnect (${reconnectionAttempts + 1}/3)...`
    });
    
    reconnectTimeoutRef.current = setTimeout(() => {
      // Re-create peer connection
      if (remotePeerId) {
        // Close existing connection
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
        
        // Create new connection and retry
        createPeerConnectionAndRetry();
      }
    }, delay);
  }, [reconnectionAttempts, remotePeerId]);

  // Create a new peer connection and retry the call
  const createPeerConnectionAndRetry = useCallback(async () => {
    try {
      // Create new peer connection
      const pc = await createPeerConnection();
      if (!pc) throw new Error("Failed to create peer connection");

      peerConnectionRef.current = pc;

      // Set up event handlers
      pc.onicecandidate = async (event) => {
        if (event.candidate && remotePeerId) {
          sendSignal({
            type: "ice-candidate",
            payload: event.candidate,
            recipient: remotePeerId,
            senderName: username,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(new MediaStream(event.streams[0].getTracks()));
      };
      
      pc.oniceconnectionstatechange = handleIceConnectionStateChange;

      // Add local tracks to the connection
      if (localStream) {
        addTracksFromStream(pc, localStream);
      }

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal({
        type: "offer",
        payload: offer,
        recipient: remotePeerId,
        senderName: username,
        callType,
        encrypted: isEncrypted
      });
    } catch (err) {
      console.error("Error recreating peer connection:", err);
      setError("Failed to reestablish connection");
      setCallStatus("error");
    }
  }, [remotePeerId, localStream, username, sendSignal, callType, isEncrypted, handleIceConnectionStateChange]);

  // Initialize local media stream
  const initLocalStream = useCallback(async (video = false) => {
    try {
      // Stop any existing stream
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      
      // Get new stream with audio and optional video
      const stream = await getUserMedia({ 
        audio: true, 
        video: video ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } : false 
      });
      
      if (stream) {
        setLocalStream(stream);
        // Update call type based on stream
        setCallType(video ? "video" : "audio");
      } else {
        setError(video ? "Could not access camera or microphone" : "Could not access microphone");
      }
    } catch (err) {
      if (video) {
        // Fallback to audio-only if video fails
        toast({
          title: "Video Unavailable",
          description: "Could not access camera. Falling back to audio only.",
          variant: "destructive"
        });
        return initLocalStream(false);
      }
      
      setError("Error accessing media devices");
      console.error(err);
    }
  }, [localStream]);

  // Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      if (!peerConnectionRef.current || !remotePeerId) {
        throw new Error("No active call to share screen");
      }
      
      // Get screen share stream
      const screenStream = await getDisplayMedia();
      if (!screenStream) throw new Error("Failed to access screen sharing");
      
      setScreenShareStream(screenStream);
      setIsSharingScreen(true);
      
      // Add screen track to peer connection
      screenStream.getTracks().forEach(track => {
        peerConnectionRef.current!.addTrack(track, screenStream);
        
        // Listen for the track to end (user stops sharing)
        track.onended = () => {
          stopScreenShare();
        };
      });
      
      toast({
        title: "Screen Sharing Started",
        description: "You are now sharing your screen"
      });
    } catch (err) {
      console.error("Error starting screen share:", err);
      toast({
        title: "Screen Sharing Failed",
        description: "Could not start screen sharing",
        variant: "destructive"
      });
    }
  }, [remotePeerId]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenShareStream) {
      // Stop all tracks
      screenShareStream.getTracks().forEach(track => {
        track.stop();
        
        // Remove track from peer connection
        if (peerConnectionRef.current) {
          peerConnectionRef.current.getSenders().forEach(sender => {
            if (sender.track === track) {
              peerConnectionRef.current!.removeTrack(sender);
            }
          });
        }
      });
      
      setScreenShareStream(null);
      setIsSharingScreen(false);
      
      toast({
        title: "Screen Sharing Stopped",
        description: "You are no longer sharing your screen"
      });
    }
  }, [screenShareStream]);

  // Clean up function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    if (screenShareStream) {
      screenShareStream.getTracks().forEach((track) => track.stop());
      setScreenShareStream(null);
    }

    setRemoteStream(null);
    setCallStatus("idle");
    setRemotePeerId(null);
    setRemoteUsername(null);
    setCallStartTime(null);
    setCurrentCallId(null);
    setIsEncrypted(true);
    setCallType("audio");
    setIsSharingScreen(false);
    setIsTransferring(false);
    setTransferTarget(null);
    setReconnectionAttempts(0);
    encryptionKeyRef.current = null;
  }, [localStream, screenShareStream]);

  // Initialize a call to a peer
  const initiateCall = useCallback(
    async (peerId: string, peerName: string, video = false) => {
      if (!localStream) {
        await initLocalStream(video);
      } else if (video && (!localStream.getVideoTracks() || localStream.getVideoTracks().length === 0)) {
        // If requesting video but current stream doesn't have video, reinitialize
        await initLocalStream(true);
      }

      cleanup();
      setCallStatus("connecting");
      setRemotePeerId(peerId);
      setRemoteUsername(peerName);
      setCallType(video ? "video" : "audio");

      try {
        // Generate encryption key if encryption is enabled
        if (isEncrypted) {
          encryptionKeyRef.current = await generateEncryptionKey();
        }
        
        // Create new peer connection
        const pc = await createPeerConnection();
        if (!pc) throw new Error("Failed to create peer connection");

        peerConnectionRef.current = pc;

        // Set up event handlers
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            sendSignal({
              type: "ice-candidate",
              payload: event.candidate,
              recipient: peerId,
              senderName: username,
            });
          }
        };

        pc.ontrack = (event) => {
          setRemoteStream(new MediaStream(event.streams[0].getTracks()));
        };
        
        // Monitor connection state for improved error handling
        pc.oniceconnectionstatechange = handleIceConnectionStateChange;

        // Add local tracks to the connection
        if (localStream) {
          addTracksFromStream(pc, localStream);
        }

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Record outgoing call
        const callRecord = await addCallRecord({
          callerId: userId,
          callerName: username,
          recipientId: peerId,
          recipientName: peerName,
          startTime: new Date(),
          status: "missed", // Will be updated when answered
          callType: video ? "video" : "audio",
          encrypted: isEncrypted
        });

        setCurrentCallId(callRecord.id);

        sendSignal({
          type: "offer",
          payload: offer,
          recipient: peerId,
          senderName: username,
          callType: video ? "video" : "audio",
          encrypted: isEncrypted
        });
      } catch (err) {
        console.error("Error initiating call:", err);
        setError("Failed to initiate call");
        setCallStatus("error");
        
        toast({
          title: "Call Failed",
          description: "Could not establish call. Please try again.",
          variant: "destructive"
        });
      }
    },
    [localStream, cleanup, sendSignal, userId, username, initLocalStream, isEncrypted, handleIceConnectionStateChange],
  );

  // Answer an incoming call
  const answerCall = useCallback(async () => {
    if (!remotePeerId) return;

    // Initialize local stream with correct media type
    if (!localStream) {
      await initLocalStream(callType === "video");
    } else if (callType === "video" && (!localStream.getVideoTracks() || localStream.getVideoTracks().length === 0)) {
      // If it's a video call but we don't have video tracks, reinitialize
      await initLocalStream(true);
    }

    try {
      // Create new peer connection if it doesn't exist
      if (!peerConnectionRef.current) {
        const pc = await createPeerConnection();
        if (!pc) throw new Error("Failed to create peer connection");

        peerConnectionRef.current = pc;

        // Set up event handlers
        pc.onicecandidate = async (event) => {
          if (event.candidate && remotePeerId) {
            sendSignal({
              type: "ice-candidate",
              payload: event.candidate,
              recipient: remotePeerId,
              senderName: username,
            });
          }
        };

        pc.ontrack = (event) => {
          setRemoteStream(new MediaStream(event.streams[0].getTracks()));
        };
        
        // Monitor connection state for improved error handling
        pc.oniceconnectionstatechange = handleIceConnectionStateChange;

        // Add local tracks to the connection
        if (localStream) {
          addTracksFromStream(pc, localStream);
        }
      }

      // Create and send answer
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      sendSignal({
        type: "answer",
        payload: answer,
        recipient: remotePeerId,
        senderName: username,
      });

      setCallStatus("connected");
      setCallStartTime(new Date());

      // Update call record to completed
      if (currentCallId) {
        await updateCallRecord(currentCallId, {
          status: "completed",
        });
      }
      
      toast({
        title: "Call Connected",
        description: `Connected with ${remoteUsername || remotePeerId}`
      });
    } catch (err) {
      console.error("Error answering call:", err);
      setError("Failed to answer call");
      setCallStatus("error");
      
      toast({
        title: "Call Failed",
        description: "Could not connect to the call. Please try again.",
        variant: "destructive"
      });
    }
  }, [remotePeerId, localStream, sendSignal, username, currentCallId, callType, initLocalStream, remoteUsername, handleIceConnectionStateChange]);

  // Reject an incoming call
  const rejectCall = useCallback(() => {
    if (!remotePeerId) return;

    sendSignal({
      type: "call-rejected",
      payload: null,
      recipient: remotePeerId,
      senderName: username,
    });

    // Update call record to rejected
    if (currentCallId) {
      updateCallRecord(currentCallId, {
        status: "rejected",
        endTime: new Date(),
      });
    }

    cleanup();
  }, [remotePeerId, sendSignal, username, currentCallId, cleanup]);

  // End the current call
  const endCall = useCallback(() => {
    if (!remotePeerId) return;

    sendSignal({
      type: "call-ended",
      payload: null,
      recipient: remotePeerId,
      senderName: username,
    });

    // Update call record with end time and duration
    if (currentCallId && callStartTime) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - callStartTime.getTime()) / 1000); // in seconds

      updateCallRecord(currentCallId, {
        endTime,
        duration,
        status: "completed",
      });
    }

    cleanup();
  }, [remotePeerId, sendSignal, username, currentCallId, callStartTime, cleanup]);

  // Transfer the call to another user
  const transferCall = useCallback((targetId: string, targetName: string) => {
    if (!remotePeerId) return;
    
    sendSignal({
      type: "call-transfer",
      payload: { targetId, targetName },
      recipient: remotePeerId,
      senderName: username,
    });
    
    // Update call record with transfer information
    if (currentCallId) {
      updateCallRecord(currentCallId, {
        endTime: new Date(),
        status: "completed",
        transferred: true,
        transferredTo: targetId
      });
    }
    
    toast({
      title: "Call Transferred",
      description: `Call transferred to ${targetName}`
    });
    
    cleanup();
  }, [remotePeerId, sendSignal, username, currentCallId, cleanup]);

  // Toggle video during a call
  const toggleVideo = useCallback(async () => {
    if (callStatus !== "connected" && callStatus !== "connecting") return;
    
    try {
      const newCallType = callType === "audio" ? "video" : "audio";
      
      // Re-initialize local stream with new constraints
      await initLocalStream(newCallType === "video");
      
      // Update call type
      setCallType(newCallType);
      
      // Replace tracks in the peer connection if it exists
      if (peerConnectionRef.current && localStream) {
        const senders = peerConnectionRef.current.getSenders();
        
        if (newCallType === "video") {
          // Add video track if turning on video
          const videoTrack = localStream.getVideoTracks()[0];
          if (videoTrack) {
            const videoSender = senders.find(sender => sender.track?.kind === "video");
            if (videoSender) {
              await videoSender.replaceTrack(videoTrack);
            } else {
              peerConnectionRef.current.addTrack(videoTrack, localStream);
            }
          }
        } else {
          // Remove video track if turning off video
          const videoSender = senders.find(sender => sender.track?.kind === "video");
          if (videoSender) {
            peerConnectionRef.current.removeTrack(videoSender);
          }
        }
      }
      
      toast({
        title: newCallType === "video" ? "Video Enabled" : "Video Disabled",
        description: newCallType === "video" ? "Your camera is now on" : "Your camera is now off"
      });
    } catch (err) {
      console.error("Error toggling video:", err);
      toast({
        title: "Error",
        description: "Could not toggle video",
        variant: "destructive"
      });
    }
  }, [callStatus, callType, initLocalStream]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    screenShareStream,
    callStatus,
    error,
    remotePeerId,
    remoteUsername,
    isConnected,
    callType,
    isEncrypted,
    isSharingScreen,
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    initLocalStream,
    startScreenShare,
    stopScreenShare,
    toggleVideo,
    transferCall
  };
}
