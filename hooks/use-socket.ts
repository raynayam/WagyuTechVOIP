"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import type { SignalingMessage } from "@/lib/webrtc"

interface UseSocketProps {
  userId: string
  onSignal?: (message: SignalingMessage) => void
  onUserOnline?: (userId: string) => void
  onUserOffline?: (userId: string) => void
  onUsersOnline?: (users: string[]) => void
}

export function useSocket({ userId, onSignal, onUserOnline, onUserOffline, onUsersOnline }: UseSocketProps) {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!userId) return

    // Initialize socket connection
    const socket = io({
      path: "/api/socket",
      query: { userId },
      autoConnect: true,
      reconnection: true,
    })

    // Set up event listeners
    socket.on("connect", () => {
      setIsConnected(true)
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
    })

    socket.on("signal", (message: SignalingMessage) => {
      if (onSignal) onSignal(message)
    })

    socket.on("user:online", ({ userId }) => {
      if (onUserOnline) onUserOnline(userId)
    })

    socket.on("user:offline", ({ userId }) => {
      if (onUserOffline) onUserOffline(userId)
    })

    socket.on("users:online", ({ users }) => {
      if (onUsersOnline) onUsersOnline(users)
    })

    socketRef.current = socket

    // Clean up on unmount
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, onSignal, onUserOnline, onUserOffline, onUsersOnline])

  // Function to send a signaling message
  const sendSignal = useCallback(
    (message: Omit<SignalingMessage, "sender">) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("signal", {
          ...message,
          sender: userId,
        })
      }
    },
    [isConnected, userId],
  )

  return {
    isConnected,
    sendSignal,
  }
}
