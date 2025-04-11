import { Document, Model, Schema, Types } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  contacts: Types.ObjectId[] | IUser[];
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

declare const User: Model<IUser>;
export default User; 