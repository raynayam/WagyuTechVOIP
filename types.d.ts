// Declaration for modules without types
declare module 'lucide-react';
declare module 'twilio';
declare module 'next/server';
declare module 'next/navigation';
declare module 'class-variance-authority';
declare module '@radix-ui/react-slot';
declare module 'toml';
declare module 'simple-peer';
declare module 'socket.io' {
  export class Server {
    constructor(httpServer: any, options?: any);
    on(event: string, listener: Function): this;
    emit(event: string, ...args: any[]): boolean;
    to(room: string): {
      emit: (event: string, ...args: any[]) => boolean;
    };
  }
}
declare module 'socket.io-client';
declare module 'next/headers' {
  export function cookies(): {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options?: object): void;
    delete(name: string): void;
  };
}
declare module 'zod';
declare module 'jsonwebtoken';

// NextRequest and NextResponse types
declare namespace NextRequest {
  interface NextRequest {
    socket: any;
  }
}

declare namespace NextResponse {
  interface NextResponse {
    socket: {
      server: any;
    };
  }
}

// ButtonProps type definition to match the UI component library
declare namespace React {
  interface ButtonHTMLAttributes<T> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  }
}

// Fix JSX issues
declare namespace JSX {
  interface IntrinsicElements {
    div: any;
    main: any;
    header: any;
    h1: any;
    h2: any;
    h3: any;
    h4: any;
    h5: any;
    h6: any;
    p: any;
    span: any;
    button: any;
    input: any;
    form: any;
    label: any;
  }
}

// Import ButtonProps from its actual definition
// The ButtonProps interface is already defined in components/ui/button.tsx
// No need to redefine it here 