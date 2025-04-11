import { ObjectId } from 'mongodb';

// Extend existing interfaces
declare global {
  interface ObjectConstructor {
    keys<T>(obj: T): Array<keyof T>;
  }
}

// Fix Map issues in MongoDB/Mongoose
declare module 'mongoose' {
  interface Map<K, V> {
    get(key: K): V | undefined;
    set(key: K, value: V): this;
  }

  // Add type for populated documents
  type PopulatedDoc<T> = T | ObjectId;
}

// Add missing module declarations
declare module '@/hooks/use-toast' {
  import { ToastHook } from '../types/toast';
  export const toast: ToastHook;
}

declare module '@/hooks/use-socket' {
  import { UseSocketOptions, UseSocketReturn } from '../types/socket';
  export function useSocket(options: UseSocketOptions): UseSocketReturn;
}

declare module '@/lib/db' {
  import { ObjectId } from 'mongodb';
  import { IUser } from '@/lib/models/user';

  export interface Contact {
    id: string;
    userId: string;
    name: string;
    contactId: string;
  }

  export function getUserContacts(userId: string): Promise<Contact[]>;
} 