"use client"

import { useState, useEffect } from "react"
import { io, Socket } from "socket.io-client"
import { PopulatedMessage } from "@/lib/messaging-service"

export interface SignalingMessage {
  type: "offer" | "answer" | "ice-candidate" | "hangup"
  sender: string
  recipient: string
  data: any
}

export interface UseSocketProps {
  userId: string
  onNewMessage?: (message: PopulatedMessage) => void
  onSignaling?: (message: SignalingMessage) => void
}

export function useSocket({ userId, onNewMessage, onSignaling }: UseSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!userId) return

    // Initialize socket
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", {
      withCredentials: true,
      query: {
        userId
      }
    })

    // Connection events
    socketInstance.on("connect", () => {
      console.log("Socket connected")
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected")
      setIsConnected(false)
    })

    // Message events
    socketInstance.on("new-message", (message: PopulatedMessage) => {
      console.log("New message received:", message)
      onNewMessage?.(message)
    })

    // Signaling events for video/voice calls
    socketInstance.on("signaling", (message: SignalingMessage) => {
      console.log("Signaling message received:", message)
      onSignaling?.(message)
    })

    // Error handling
    socketInstance.on("connect_error", (error) => {
      console.error("Connection error:", error)
    })

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error)
    })

    // Set socket instance
    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect()
    }
  }, [userId, onNewMessage, onSignaling])

  // Function to send signaling data (for calls)
  const sendSignal = (message: Omit<SignalingMessage, "sender">) => {
    if (!socket || !isConnected) {
      console.error("Cannot send signal: socket not connected")
      return
    }

    const signalMessage: SignalingMessage = {
      ...message,
      sender: userId
    }

    socket.emit("signaling", signalMessage)
  }

  return {
    isConnected,
    socket,
    sendSignal
  }
} 