"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from './models/user'
import connectToDatabase from './db/mongoose'
import mongoose from 'mongoose'

// JWT secret key - in a real app, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'

// Schema for login validation
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

// Schema for registration validation
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

// Send verification email
async function sendVerificationEmail(email: string, token: string) {
  // In a real app, you would integrate with an email service like SendGrid, AWS SES, etc.
  // For this example, we'll just log the verification link
  const verificationLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  console.log(`Verification link for ${email}: ${verificationLink}`);
  
  // Return success for demonstration purposes
  return { success: true };
}

// Generate a random token
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function login(formData: FormData) {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  }

  try {
    const { email, password } = loginSchema.parse(rawData)

    await connectToDatabase()
    
    // Find user in database by email (case insensitive)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } })
    
    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Generate a new verification token
      const verificationToken = generateToken();
      user.verificationToken = verificationToken;
      await user.save();
      
      // Send verification email
      await sendVerificationEmail(user.email, verificationToken);
      
      return { 
        success: false, 
        error: "Email not verified. A new verification link has been sent to your email." 
      }
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Set the token in a cookie
    cookies().set("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    // Ensure user._id is a valid ObjectId before converting to string
    const userId = user._id instanceof mongoose.Types.ObjectId 
      ? user._id.toString() 
      : typeof user._id === 'string' 
        ? user._id 
        : String(user._id);

    return { success: true, userId }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: "Invalid input" }
  }
}

export async function register(formData: FormData) {
  const rawData = {
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  }

  try {
    const { username, email, password } = registerSchema.parse(rawData)

    await connectToDatabase()
    
    // Check if username already exists
    const userExists = await User.findOne({ 
      $or: [
        { username },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    })

    if (userExists) {
      if (userExists.email.toLowerCase() === email.toLowerCase()) {
        return { success: false, error: "Email already exists" }
      }
      return { success: false, error: "Username already exists" }
    }

    // Generate verification token
    const verificationToken = generateToken();
    
    // Create a new user
    const user = new User({ 
      username, 
      email, 
      password, 
      emailVerified: false, 
      verificationToken 
    });
    
    await user.save()

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    return { 
      success: true, 
      message: "Registration successful. Please check your email to verify your account." 
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: "Invalid input" }
  }
}

export async function verifyEmail(token: string) {
  try {
    await connectToDatabase();
    
    // Find user with this verification token
    const user = await User.findOne({ verificationToken: token });
    
    if (!user) {
      return { success: false, error: "Invalid or expired verification token" };
    }
    
    // Mark email as verified and clear the token
    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();
    
    // Generate JWT token for automatic login
    const authToken = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Set the token in a cookie
    cookies().set("authToken", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    
    // Ensure user._id is a valid ObjectId before converting to string
    const userId = user._id instanceof mongoose.Types.ObjectId 
      ? user._id.toString() 
      : typeof user._id === 'string' 
        ? user._id 
        : String(user._id);
    
    return { success: true, userId };
  } catch (error) {
    console.error('Email verification error:', error);
    return { success: false, error: "Verification failed" };
  }
}

export async function requestPasswordReset(email: string) {
  try {
    await connectToDatabase();
    
    // Find user by email
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    if (!user) {
      // For security reasons, don't reveal that the email doesn't exist
      return { success: true, message: "If your email is registered, you will receive a password reset link" };
    }
    
    // Generate reset token and set expiry (1 hour from now)
    const resetToken = generateToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();
    
    // In a real app, you would send an email with the reset link
    const resetLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetLink}`);
    
    return { success: true, message: "If your email is registered, you will receive a password reset link" };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { success: false, error: "Failed to process request" };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    await connectToDatabase();
    
    // Find user with this reset token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return { success: false, error: "Invalid or expired token" };
    }
    
    // Update password and clear reset token fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    return { success: true, message: "Password has been reset successfully" };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: "Failed to reset password" };
  }
}

export async function logout() {
  cookies().delete("authToken")
  redirect("/login")
}

export async function getAuthToken() {
  return cookies().get("authToken")?.value || null
}

export async function verifyAuthToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; email: string }
    return { id: decoded.id, username: decoded.username, email: decoded.email }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function getCurrentUser() {
  const token = await getAuthToken()

  if (!token) {
    return null
  }

  return await verifyAuthToken(token)
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
