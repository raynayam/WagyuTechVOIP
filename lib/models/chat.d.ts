import { Document, Model, Types } from 'mongoose';
import { IUser } from './user';
import { IMessage } from './message';

export interface IChat extends Document {
  participants: Types.ObjectId[] | IUser[];
  isGroup: boolean;
  name?: string;
  admin?: Types.ObjectId | IUser;
  encryptionEnabled: boolean;
  lastMessage?: Types.ObjectId | IMessage;
  lastMessageText?: string;
  lastMessageTime?: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

declare const Chat: Model<IChat>;
export default Chat; 