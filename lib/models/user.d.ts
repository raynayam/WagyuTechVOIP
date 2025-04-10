import { Document, Model, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  phoneNumber?: string;
  contacts: Types.ObjectId[] | IUser[];
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

declare const User: Model<IUser>;
export default User; 