"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { requestPasswordReset } from "@/lib/auth"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error state
    setError("")
    setSuccess(false)
    
    // Basic email validation
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address")
      return
    }
    
    setLoading(true)
    
    try {
      const result = await requestPasswordReset(email)
      
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Failed to send reset email. Please try again.")
      }
    } catch (error) {
      console.error("Password reset request error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your email to receive a password reset link</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>
                    If an account exists with this email, we've sent you instructions to reset your password.
                    Please check your inbox and spam folder.
                  </AlertDescription>
                </Alert>
              )}
              {!success && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            {!success && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Reset Password"}
              </Button>
            )}
            <div className="text-center text-sm">
              <Link href="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 