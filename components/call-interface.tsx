"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, PhoneOff, Mic, MicOff, X, Video, VideoOff, MonitorUp, UserPlus } from "lucide-react"
import { useWebRTC, type CallStatus, type CallType } from "@/hooks/use-webrtc"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog" 
import { UserSelector } from "@/components/user-selector"

interface CallInterfaceProps {
  userId: string
  username: string
}

export default function CallInterface({ userId, username }: CallInterfaceProps) {
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState<boolean>(false)
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)

  const {
    localStream,
    remoteStream,
    screenShareStream,
    callStatus,
    callType,
    error,
    remotePeerId,
    remoteUsername,
    isConnected,
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
  } = useWebRTC({ userId, username })

  // Initialize local stream on component mount
  useEffect(() => {
    initLocalStream()
  }, [initLocalStream])

  // Connect local stream to audio/video elements
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream
    }
    
    if (localVideoRef.current && localStream && callType === "video") {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream, callType])

  // Connect remote stream to audio/video elements
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream
    }
    
    if (remoteVideoRef.current && remoteStream && callType === "video") {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream, callType])
  
  // Connect screen share stream to video element
  useEffect(() => {
    if (screenVideoRef.current && screenShareStream) {
      screenVideoRef.current.srcObject = screenShareStream
    }
  }, [screenShareStream])

  // Handle mute/unmute
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  // Get status message based on call status
  const getStatusMessage = (status: CallStatus): string => {
    switch (status) {
      case "idle":
        return "Ready to call"
      case "connecting":
        return "Connecting..."
      case "connected":
        return `In call with ${remoteUsername || remotePeerId}`
      case "disconnected":
        return "Call ended"
      case "reconnecting":
        return "Reconnecting..."
      case "error":
        return error || "Error occurred"
      default:
        return ""
    }
  }
  
  // Handle call transfer
  const handleTransferCall = (targetId: string, targetName: string) => {
    if (transferCall) {
      transferCall(targetId, targetName)
      setIsTransferDialogOpen(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Call</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected && (
          <Alert>
            <AlertDescription>Connecting to signaling server...</AlertDescription>
          </Alert>
        )}

        <div className="text-center py-2">
          <div className={`text-sm font-medium ${callStatus === "error" ? "text-red-500" : callStatus === "reconnecting" ? "text-amber-500" : "text-green-500"}`}>
            {getStatusMessage(callStatus)}
          </div>
        </div>
        
        {/* Video Call UI */}
        {callType === "video" && callStatus === "connected" && (
          <div className="relative grid grid-cols-2 gap-2 aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {/* Remote Video (Large) */}
            <div className="col-span-2 w-full h-full">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Screen Share Display */}
              {screenShareStream && (
                <div className="absolute inset-0 z-10 bg-black">
                  <video 
                    ref={screenVideoRef} 
                    autoPlay 
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
            
            {/* Local Video (Small Overlay) */}
            <div className="absolute bottom-2 right-2 w-1/4 aspect-video rounded overflow-hidden border-2 border-white">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {callStatus === "connecting" && remotePeerId && (
          <div className="flex justify-center space-x-4">
            <Button onClick={rejectCall} variant="destructive">
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button onClick={answerCall}>
              <Phone className="h-4 w-4 mr-2" />
              Answer
            </Button>
          </div>
        )}
      </CardContent>

      {callStatus === "connected" && (
        <CardFooter className="flex justify-center space-x-4">
          <Button onClick={toggleMute} variant="outline" size="icon" title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <Button 
            onClick={toggleVideo} 
            variant="outline" 
            size="icon"
            title={callType === "video" ? "Disable Video" : "Enable Video"}
          >
            {callType === "video" ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>
          
          <Button 
            onClick={isSharingScreen ? stopScreenShare : startScreenShare} 
            variant="outline" 
            size="icon"
            title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
          >
            <MonitorUp className="h-4 w-4" />
          </Button>
          
          <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" title="Transfer Call">
                <UserPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Call</DialogTitle>
                <DialogDescription>
                  Select a user to transfer this call to
                </DialogDescription>
              </DialogHeader>
              <UserSelector 
                userId={userId} 
                onSelectUser={(targetId, targetName) => handleTransferCall(targetId, targetName)} 
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button onClick={endCall} variant="destructive" size="icon" title="End Call">
            <PhoneOff className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}

      {/* Hidden audio elements to play streams */}
      <audio ref={localAudioRef} autoPlay muted className="hidden" />
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
    </Card>
  )
}
