"use server"

import connectToDatabase from './db/mongoose';
import User from './models/user';
import Call from './models/call';
import mongoose, { Document } from 'mongoose';
import { IUser } from './models/user';

// In a real app, you would use a database
// This is a simple in-memory implementation

export interface CallRecord {
  id: string
  callerId: string
  callerName: string
  recipientId: string
  recipientName: string
  startTime: Date
  endTime?: Date
  duration?: number
  status: "missed" | "completed" | "rejected"
  encrypted?: boolean
  callType?: "audio" | "video"
  transferred?: boolean
  transferredTo?: string
}

export interface Contact {
  id: string
  userId: string
  name: string
  contactId: string
}

// MongoDB document with _id helper function
function getDocumentId(doc: any): string {
  return doc && doc._id ? doc._id.toString() : '';
}

// Call History Functions
export async function addCallRecord(record: Omit<CallRecord, "id">) {
  await connectToDatabase();
  
  try {
    const newRecord = new Call({
      callerId: record.callerId,
      callerName: record.callerName,
      recipientId: record.recipientId,
      recipientName: record.recipientName,
      startTime: record.startTime,
      status: record.status,
      encrypted: true,
      callType: record.callType || 'audio'
    });
    
    await newRecord.save();
    
    return {
      ...record,
      id: getDocumentId(newRecord)
    };
  } catch (error) {
    console.error('Error adding call record:', error);
    throw error;
  }
}

export async function updateCallRecord(id: string, updates: Partial<CallRecord>) {
  await connectToDatabase();
  
  try {
    const callRecord = await Call.findById(id);
    if (!callRecord) {
      throw new Error(`Call record with ID ${id} not found`);
    }
    
    if (updates.status) callRecord.status = updates.status;
    if (updates.endTime) callRecord.endTime = updates.endTime;
    if (updates.duration) callRecord.duration = updates.duration;
    if (updates.transferred) {
      callRecord.transferred = updates.transferred;
      if (updates.transferredTo) {
        // Use any type for transferredTo to bypass TypeScript checking
        (callRecord as any).transferredTo = updates.transferredTo;
      }
    }
    
    await callRecord.save();
  } catch (error) {
    console.error('Error updating call record:', error);
    throw error;
  }
}

export async function getUserCallHistory(userId: string) {
  await connectToDatabase();
  
  try {
    const calls = await Call.find({
      $or: [
        { callerId: userId },
        { recipientId: userId }
      ]
    }).sort({ startTime: -1 }).limit(50);
    
    return calls.map(call => ({
      id: getDocumentId(call),
      callerId: String(call.callerId),
      callerName: call.callerName,
      recipientId: String(call.recipientId),
      recipientName: call.recipientName,
      startTime: call.startTime,
      endTime: call.endTime,
      duration: call.duration,
      status: call.status,
      encrypted: call.encrypted,
      callType: call.callType,
      transferred: call.transferred,
      transferredTo: call.transferredTo ? String(call.transferredTo) : undefined
    }));
  } catch (error) {
    console.error('Error fetching call history:', error);
    return [];
  }
}

// Contacts Functions
export async function addContact(contact: Omit<Contact, "id">) {
  await connectToDatabase();
  
  try {
    const user = await User.findById(contact.userId);
    if (!user) {
      throw new Error(`User with ID ${contact.userId} not found`);
    }
    
    if (!user.contacts) {
      user.contacts = [];
    }
    
    // Convert string ID to ObjectId
    const contactObjectId = new mongoose.Types.ObjectId(contact.contactId);
    
    // Check if contact already exists (compare as strings)
    const contactExists = (user.contacts || []).some((existingId: any) => 
      existingId.toString() === contact.contactId
    );
    
    if (!contactExists) {
      // Use 'any' casting to bypass TypeScript error
      (user.contacts as any).push(contactObjectId);
      await user.save();
    }
    
    return {
      id: new mongoose.Types.ObjectId().toString(),
      userId: contact.userId,
      name: contact.name,
      contactId: contact.contactId
    };
  } catch (error) {
    console.error('Error adding contact:', error);
    throw error;
  }
}

export async function removeContact(userId: string, contactId: string) {
  await connectToDatabase();
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    if (user.contacts && Array.isArray(user.contacts)) {
      // Filter out the contact by comparing string representations of IDs
      // Use 'any' casting to bypass TypeScript's strict typechecking
      user.contacts = (user.contacts as any).filter((existingId: any) => 
        existingId.toString() !== contactId
      );
      await user.save();
    }
  } catch (error) {
    console.error('Error removing contact:', error);
    throw error;
  }
}

export async function getUserContacts(userId: string): Promise<Contact[]> {
  await connectToDatabase();
  
  try {
    const user = await User.findById(userId).populate('contacts');
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    // Handle the case where user.contacts might be null or undefined
    if (!user.contacts || !Array.isArray(user.contacts)) {
      return [];
    }
    
    // Map contacts to the required format, handling both ObjectId and populated document cases
    // Use 'any' to bypass strict TypeScript checking
    const contacts = user.contacts as any[];
    
    return contacts.map((contactDoc: any) => {
      // Check if it's a populated document or just an ObjectId
      const isPopulated = contactDoc && typeof contactDoc === 'object' && 'username' in contactDoc;
      
      // Extract ID and name based on the contact type
      const contactId = isPopulated ? getDocumentId(contactDoc) : contactDoc.toString();
      const name = isPopulated ? contactDoc.username : 'Unknown';
      
      return {
        id: contactId,
        userId,
        name,
        contactId
      };
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}
