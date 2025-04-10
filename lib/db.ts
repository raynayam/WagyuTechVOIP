"use server"

import connectToDatabase from './db/mongoose';
import User from './models/user';
import Call from './models/call';
import mongoose from 'mongoose';

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
      id: newRecord._id.toString()
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
      if (updates.transferredTo) callRecord.transferredTo = updates.transferredTo;
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
      id: call._id.toString(),
      callerId: call.callerId.toString(),
      callerName: call.callerName,
      recipientId: call.recipientId.toString(),
      recipientName: call.recipientName,
      startTime: call.startTime,
      endTime: call.endTime,
      duration: call.duration,
      status: call.status,
      encrypted: call.encrypted,
      callType: call.callType,
      transferred: call.transferred,
      transferredTo: call.transferredTo ? call.transferredTo.toString() : undefined
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
    
    if (!user.contacts.includes(contact.contactId)) {
      user.contacts.push(contact.contactId);
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
    
    if (user.contacts) {
      user.contacts = user.contacts.filter((id: mongoose.Types.ObjectId) => id.toString() !== contactId);
      await user.save();
    }
  } catch (error) {
    console.error('Error removing contact:', error);
    throw error;
  }
}

export async function getUserContacts(userId: string) {
  await connectToDatabase();
  
  try {
    const user = await User.findById(userId).populate('contacts');
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    return (user.contacts || []).map((contact: any) => ({
      id: contact._id.toString(),
      userId: userId,
      name: contact.username,
      contactId: contact._id.toString()
    }));
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
}
