"use server"

import crypto from 'crypto';
import connectToDatabase from './db/mongoose';
import User from './models/user';
import Message from './models/message';
import Chat from './models/chat';
import mongoose from 'mongoose';
import { IMessage } from './models/message';
import { IChat } from './models/chat';
import db from "./db"
import { ObjectId } from "mongodb"

// Interface for message creation
export interface MessageData {
  content: string;
  sender: string;
  recipient: string;
  encrypted?: boolean;
  attachments?: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    encryptedKey?: string;
  }[];
}

// Interface for creating a chat
export interface ChatData {
  participants: string[];
  isGroup?: boolean;
  name?: string;
  admin?: string;
  encryptionEnabled?: boolean;
}

// Message with populated user data
export interface PopulatedMessage extends Omit<IMessage, 'sender' | 'recipient'> {
  sender: {
    _id: string;
    username: string;
    email: string;
  };
  recipient: {
    _id: string;
    username: string;
    email: string;
  };
}

/**
 * Encrypts a message using AES-256-GCM
 * @param text Plain text to encrypt
 * @param key The encryption key (or recipient's public key in asymmetric encryption)
 */
export function encryptMessage(text: string): { encrypted: string; iv: string } {
  // For actual production, you would use the recipient's public key
  // Here we're using a symmetric encryption example with a derived key
  
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  
  // In production, the key would be derived from a shared secret established via key exchange 
  // For this example, we're using a fixed key (NEVER do this in production)
  const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET || 'default-secret-key', 'salt', 32);
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Encrypt the message
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get the auth tag
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return the encrypted message and IV
  return {
    encrypted: encrypted + ':' + authTag, // Store auth tag with ciphertext
    iv: iv.toString('hex')
  };
}

/**
 * Decrypts a message using AES-256-GCM
 * @param encryptedText The encrypted message
 * @param iv The initialization vector used for encryption
 * @param key The decryption key (or recipient's private key in asymmetric encryption)
 */
export function decryptMessage(encryptedText: string, iv: string): string {
  try {
    // Split ciphertext and auth tag
    const [encrypted, authTag] = encryptedText.split(':');
    
    // Convert IV from hex to Buffer
    const ivBuffer = Buffer.from(iv, 'hex');
    
    // In production, the key would be the recipient's private key
    // For this example, we're using a fixed key (NEVER do this in production)
    const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET || 'default-secret-key', 'salt', 32);
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    // Decrypt the message
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '[Encrypted message - unable to decrypt]';
  }
}

/**
 * Creates a new chat between users
 */
export async function createChat(participants: ObjectId[]): Promise<Chat> {
  try {
    const { db: database } = await db()
    
    // Check if chat already exists with these participants
    const existingChat = await database.collection("chats").findOne({
      participants: { $all: participants, $size: participants.length }
    })
    
    if (existingChat) {
      return existingChat as Chat
    }
    
    const chat: Chat = {
      participants,
      createdAt: new Date()
    }
    
    const result = await database.collection("chats").insertOne(chat)
    return { ...chat, _id: result.insertedId }
  } catch (error) {
    console.error("Error creating chat:", error)
    throw new Error("Failed to create chat")
  }
}

/**
 * Sends a new message
 */
export async function sendMessage(messageData: MessageData): Promise<IMessage> {
  await connectToDatabase();
  
  try {
    // Encrypt message if encryption is enabled
    let encryptedContent, iv;
    if (messageData.encrypted !== false) {
      const encryption = encryptMessage(messageData.content);
      encryptedContent = encryption.encrypted;
      iv = encryption.iv;
    } else {
      encryptedContent = messageData.content;
    }
    
    // Create the message
    const newMessage = new Message({
      sender: new mongoose.Types.ObjectId(messageData.sender),
      recipient: new mongoose.Types.ObjectId(messageData.recipient),
      content: encryptedContent,
      encrypted: messageData.encrypted !== false,
      iv: iv,
      attachments: messageData.attachments,
      read: false,
      createdAt: new Date()
    });
    
    await newMessage.save();
    
    // Find or create chat
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { 
        $all: [messageData.sender, messageData.recipient], 
        $size: 2 
      }
    });
    
    if (!chat) {
      chat = await createChat([new mongoose.Types.ObjectId(messageData.sender), new mongoose.Types.ObjectId(messageData.recipient)]);
    }
    
    // Update chat with last message
    chat.lastMessage = newMessage._id;
    chat.lastMessageText = messageData.encrypted !== false ? '[Encrypted message]' : messageData.content.substring(0, 50);
    chat.lastMessageTime = new Date();
    
    // Increment unread count for recipient
    const unreadCount = chat.unreadCount.get(messageData.recipient) || 0;
    chat.unreadCount.set(messageData.recipient, unreadCount + 1);
    
    await chat.save();
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Gets chat messages
 */
export async function getChatMessages(chatId: string, userId: string, limit = 50, offset = 0): Promise<PopulatedMessage[]> {
  await connectToDatabase();
  
  try {
    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    // Verify user is a participant
    if (!chat.participants.some(p => p.toString() === userId)) {
      throw new Error('Not authorized to view this chat');
    }
    
    // Get participants
    const participantIds = chat.participants.map(p => p.toString());
    
    // Find messages for this chat (either direct or group)
    const query = chat.isGroup
      ? { 
          recipient: new mongoose.Types.ObjectId(chatId),
          sender: { $in: chat.participants } 
        }
      : {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId), recipient: { $in: chat.participants.filter(p => p.toString() !== userId) } },
            { recipient: new mongoose.Types.ObjectId(userId), sender: { $in: chat.participants.filter(p => p.toString() !== userId) } }
          ]
        };
    
    // Get messages with populated sender and recipient
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .populate('sender', 'username email')
      .populate('recipient', 'username email');
    
    // Mark messages as read
    await Message.updateMany(
      { 
        recipient: new mongoose.Types.ObjectId(userId),
        read: false 
      },
      { 
        read: true,
        readAt: new Date()
      }
    );
    
    // Reset unread count for this user
    if (chat.unreadCount.get(userId)) {
      chat.unreadCount.set(userId, 0);
      await chat.save();
    }
    
    // Decrypt messages
    return messages.map(msg => {
      const message = msg.toObject() as PopulatedMessage;
      
      // Decrypt if needed and user is authorized
      if (message.encrypted && message.iv) {
        try {
          message.content = decryptMessage(message.content, message.iv);
        } catch (error) {
          message.content = '[Encrypted message - unable to decrypt]';
        }
      }
      
      return message;
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
}

/**
 * Gets a list of chats for a user
 */
export async function getUserChats(userId: string): Promise<IChat[]> {
  await connectToDatabase();
  
  try {
    const chats = await Chat.find({
      participants: new mongoose.Types.ObjectId(userId)
    })
    .sort({ updatedAt: -1 })
    .populate({
      path: 'participants',
      select: 'username email'
    })
    .populate({
      path: 'lastMessage'
    });
    
    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
}

/**
 * Marks messages as read
 */
export async function markMessagesAsRead(chatId: string, userId: string): Promise<void> {
  await connectToDatabase();
  
  try {
    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }
    
    // Verify user is a participant
    if (!chat.participants.some(p => p.toString() === userId)) {
      throw new Error('Not authorized for this chat');
    }
    
    // Mark messages as read
    await Message.updateMany(
      { 
        recipient: new mongoose.Types.ObjectId(userId),
        read: false 
      },
      { 
        read: true,
        readAt: new Date()
      }
    );
    
    // Reset unread count
    if (chat.unreadCount.get(userId)) {
      chat.unreadCount.set(userId, 0);
      await chat.save();
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
} 