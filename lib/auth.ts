"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import jwt from 'jsonwebtoken'
import User from './models/user'
import connectToDatabase from './db/mongoose'

// JWT secret key - in a real app, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'

// Schema for login validation
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

// Schema for registration validation
const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
})

export async function login(formData: FormData) {
  const rawData = {
    username: formData.get("username"),
    password: formData.get("password"),
  }

  try {
    const { username, password } = loginSchema.parse(rawData)

    await connectToDatabase()
    
    // Find user in database
    const user = await User.findOne({ username })
    
    if (!user) {
      return { success: false, error: "Invalid username or password" }
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    
    if (!isPasswordValid) {
      return { success: false, error: "Invalid username or password" }
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
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

    return { success: true, userId: user._id.toString() }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: "Invalid input" }
  }
}

export async function register(formData: FormData) {
  const rawData = {
    username: formData.get("username"),
    password: formData.get("password"),
  }

  try {
    const { username, password } = registerSchema.parse(rawData)

    await connectToDatabase()
    
    // Check if username already exists
    const userExists = await User.findOne({ username })

    if (userExists) {
      return { success: false, error: "Username already exists" }
    }

    // Create a new user
    const user = new User({ username, password })
    await user.save()

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username },
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

    return { success: true, userId: user._id.toString() }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: "Invalid input" }
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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string }
    return { id: decoded.id, username: decoded.username }
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
