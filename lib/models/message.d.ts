import { Document, Model, Types } from 'mongoose';
import { IUser } from './user';

export interface IAttachment {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  encryptedKey?: string;
}

export interface IMessage extends Document {
  sender: Types.ObjectId | IUser;
  recipient: Types.ObjectId | IUser;
  content: string;
  encrypted: boolean;
  iv?: string;
  attachments?: IAttachment[];
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  isExpired: boolean; // Virtual
}

declare const Message: Model<IMessage>;
export default Message; 