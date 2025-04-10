"use server"

import type { SignalingMessage } from "@/lib/webrtc"

// In a real application, you would use a database or a real-time service
// This is a simplified in-memory implementation for demonstration
const messageQueue: Map<string, SignalingMessage[]> = new Map()

export async function sendSignal(message: SignalingMessage): Promise<{ success: boolean }> {
  try {
    const recipientQueue = messageQueue.get(message.recipient) || []
    recipientQueue.push(message)
    messageQueue.set(message.recipient, recipientQueue)
    return { success: true }
  } catch (error) {
    console.error("Error sending signal:", error)
    return { success: false }
  }
}

export async function receiveSignals(userId: string): Promise<{ messages: SignalingMessage[] }> {
  try {
    const messages = messageQueue.get(userId) || []
    // Clear the queue after retrieving messages
    messageQueue.set(userId, [])
    return { messages }
  } catch (error) {
    console.error("Error receiving signals:", error)
    return { messages: [] }
  }
}
