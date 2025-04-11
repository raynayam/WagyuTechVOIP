# VOIP Application

A full-featured VOIP application with chat messaging, voice/video calls, and contact management.

## Features

- Secure authentication with email verification
- End-to-end encrypted messaging
- Voice and video calling capabilities
- Contact management
- Call history tracking

## Tech Stack

- Next.js
- MongoDB/Mongoose
- Socket.io for real-time communication
- Twilio for VOIP services
- bcryptjs for password hashing (pure JavaScript implementation)

## Prerequisites

- Node.js >= 18.18.0 (The application requires a modern version of Node.js)
- MongoDB instance (local or Atlas)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Create a `.env` file based on `.env.example` and fill in your values:
   ```
   cp .env.example .env
   ```

4. Run the development server:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```

## Deployment

### Vercel Deployment Notes

This application uses bcryptjs (a pure JavaScript implementation) instead of bcrypt (which requires native modules) for password hashing. This ensures compatibility with serverless environments like Vercel.

Make sure to add all the required environment variables in the Vercel dashboard:

- MONGODB_URI
- JWT_SECRET
- APP_BASE_URL (your Vercel deployment URL)
- ENCRYPTION_SECRET
- NEXT_PUBLIC_API_URL (your Vercel deployment URL)
- Twilio and TURN server credentials if using those features

### Node.js Version

This application requires Node.js version 18.18.0 or higher. If you're experiencing issues with npm install or starting the server, please ensure you're using a compatible Node.js version:

```
node -v
```

You can use nvm (Node Version Manager) to install and switch to a compatible version:

```
nvm install 18
nvm use 18
```

### MongoDB Setup

1. Create a MongoDB Atlas cluster or use a local MongoDB installation
2. Add the connection string to your environment variables

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT