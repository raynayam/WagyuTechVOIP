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

- Node.js >= 16.0.0 (The application requires a modern version of Node.js)
- MongoDB instance (local or Atlas)

## Important Note About Node.js Version

This application has two configurations:

1. **For local development**: We've downgraded dependencies to be compatible with Node.js 16+
2. **For Vercel deployment**: The `--legacy-peer-deps` flag is used to handle React dependency conflicts

**If you're using Node.js v8.x** (which is quite outdated), you'll see errors like:
```
SyntaxError: Unexpected token import
```

Please upgrade your Node.js version using nvm:

```
nvm install 16
nvm use 16
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or with legacy peer dependencies if needed:
   ```
   npm install --legacy-peer-deps
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

Our vercel.json is configured to use the `--legacy-peer-deps` flag to handle React dependency conflicts:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

Make sure to add all the required environment variables in the Vercel dashboard:

- MONGODB_URI
- JWT_SECRET
- APP_BASE_URL (your Vercel deployment URL)
- ENCRYPTION_SECRET
- NEXT_PUBLIC_API_URL (your Vercel deployment URL)
- Twilio and TURN server credentials if using those features

### MongoDB Setup

1. Create a MongoDB Atlas cluster or use a local MongoDB installation
2. Add the connection string to your environment variables

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT