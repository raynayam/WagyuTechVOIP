import { ObjectId } from "mongodb";

export interface Chat {
  _id?: ObjectId;
  participants: ObjectId[];
  isGroup?: boolean;
  name?: string;
  admin?: ObjectId;
  encryptionEnabled?: boolean;
  lastMessage?: ObjectId;
  lastMessageText?: string;
  lastMessageTime?: Date;
  unreadCount?: Map<string, number>;
  createdAt: Date;
  updatedAt?: Date;
} 