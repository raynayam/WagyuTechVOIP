import { Document, Model, Schema, Types } from 'mongoose';
import { IUser } from './user';

export interface ICall extends Document {
  callerId: Types.ObjectId | IUser;
  callerName: string;
  recipientId: Types.ObjectId | IUser;
  recipientName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'missed' | 'completed' | 'rejected';
  encrypted: boolean;
  callType: 'audio' | 'video';
  transferred: boolean;
  transferredTo?: Types.ObjectId | IUser;
  callSid?: string;
  isPstnCall?: boolean;
  twilioRecordingUrl?: string;
  twilioRecordingSid?: string;
  phoneNumber?: string;
}

declare const Call: Model<ICall>;
export default Call; 