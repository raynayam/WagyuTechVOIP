"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { verifyEmail } from "@/lib/auth"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState("Verifying your email address...")
  
  useEffect(() => {
    const verifyEmailToken = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        setVerificationStatus('error')
        setMessage("Invalid verification link. The token is missing.")
        return
      }
      
      try {
        const result = await verifyEmail(token)
        
        if (result.success) {
          setVerificationStatus('success')
          setMessage("Your email has been verified successfully! You will be redirected to the app.")
          
          // Redirect to dashboard after a brief delay
          setTimeout(() => {
            router.push('/')
          }, 2000)
        } else {
          setVerificationStatus('error')
          setMessage(result.error || "Verification failed. Please try again.")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setVerificationStatus('error')
        setMessage("An error occurred during verification. Please try again.")
      }
    }
    
    verifyEmailToken()
  }, [searchParams, router])
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {verificationStatus === 'verifying' ? 'Please wait while we verify your email' : 
             verificationStatus === 'success' ? 'Verification successful' : 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              {verificationStatus === 'verifying' && (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
              )}
              {verificationStatus === 'success' && (
                <div className="text-green-500 text-5xl mb-4">✓</div>
              )}
              {verificationStatus === 'error' && (
                <div className="text-red-500 text-5xl mb-4">✗</div>
              )}
              <p className="mt-2">{message}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          {verificationStatus === 'error' && (
            <Button onClick={() => router.push('/login')}>
              Back to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 