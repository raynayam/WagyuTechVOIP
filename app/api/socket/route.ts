import { Server as SocketIOServer } from "socket.io"
import { NextResponse } from "next/server"
import { getAuthToken, verifyAuthToken } from "@/lib/auth"

// Type for the Socket.io server with explicit to() method
interface EnhancedSocketIOServer extends SocketIOServer {
  to(room: string): {
    emit(event: string, ...args: any[]): boolean;
  };
}

// Socket type definition
interface Socket {
  id: string;
  handshake: {
    query: {
      userId: string;
      [key: string]: string;
    };
  };
  connected: boolean;
  broadcast: {
    emit(event: string, ...args: any[]): void;
  };
  emit(event: string, ...args: any[]): void;
  on(event: string, callback: Function): void;
}

// Types for socket handling
interface SignalPayload {
  type: string;
  payload: any;
  recipient: string;
  senderName?: string;
  callType?: "audio" | "video";
  encrypted?: boolean;
}

// Store active socket connections
const connectedUsers = new Map<string, string>() // userId -> socketId

// This is needed because Next.js edge runtime doesn't support Socket.io
export const runtime = "nodejs"

// Create a global instance of Socket.io server
let io: EnhancedSocketIOServer

export async function GET(req: Request, res: any) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
  }

  // Verify authentication
  const token = await getAuthToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await verifyAuthToken(token);
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // If socket.io server is not initialized, create it
  if (!io) {
    // @ts-ignore - Next.js doesn't expose the underlying HTTP server directly
    // but Socket.io can attach to the response object
    io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      // Add WebSocket transport for better performance
      transports: ['websocket', 'polling'],
    }) as EnhancedSocketIOServer

    io.on("connection", (socket: Socket) => {
      const userId = socket.handshake.query.userId as string

      if (userId) {
        // Store the connection
        connectedUsers.set(userId, socket.id)

        // Notify others that this user is online
        socket.broadcast.emit("user:online", { userId })

        // Send the list of online users to the newly connected user
        const onlineUsers = Array.from(connectedUsers.keys())
        socket.emit("users:online", { users: onlineUsers })

        // Handle signaling messages
        socket.on("signal", (data: SignalPayload) => {
          const recipientSocketId = connectedUsers.get(data.recipient)
          if (recipientSocketId) {
            // Socket.io's to() method allows sending to a specific socket
            io.to(recipientSocketId).emit("signal", {
              type: data.type,
              payload: data.payload,
              sender: userId,
              senderName: data.senderName,
              callType: data.callType,
              encrypted: data.encrypted,
              recipient: data.recipient,
            })
          }
        })

        // Handle disconnection
        socket.on("disconnect", () => {
          connectedUsers.delete(userId)
          socket.broadcast.emit("user:offline", { userId })
        })
        
        // Send heartbeat to check connection
        const heartbeatInterval = setInterval(() => {
          if (socket.connected) {
            socket.emit("heartbeat")
          } else {
            clearInterval(heartbeatInterval)
          }
        }, 30000) // 30 seconds
        
        // Clear interval on disconnect
        socket.on("disconnect", () => {
          clearInterval(heartbeatInterval)
        })
      }
    })
  }

  // Return a response to keep the connection alive
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
