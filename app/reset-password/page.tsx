"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/auth"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error state
    setError("")
    
    // Check if token exists
    if (!token) {
      setError("Invalid reset link. The token is missing.")
      return
    }
    
    // Validate passwords
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    
    setLoading(true)
    
    try {
      const result = await resetPassword(token, password)
      
      if (result.success) {
        setSuccess(true)
        // Redirect to login after a delay
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(result.error || "Failed to reset password. Please try again.")
      }
    } catch (error) {
      console.error("Password reset error:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>The password reset link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/login')} className="w-full">
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              {success ? (
                <div className="text-center py-4">
                  <div className="text-green-500 text-5xl mb-4">✓</div>
                  <p>Your password has been reset successfully!</p>
                  <p className="text-sm text-gray-500">You will be redirected to the login page.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                  </div>
                  {error && (
                    <div className="text-red-500 text-sm mt-2">{error}</div>
                  )}
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {!success && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 