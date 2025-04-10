"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Phone, X, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface PhoneDialerProps {
  userId: string
  username: string
}

export default function PhoneDialer({ userId, username }: PhoneDialerProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [isDialing, setIsDialing] = useState<boolean>(false)
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null)
  
  // Handle number input
  const handleNumberInput = (num: string) => {
    setPhoneNumber((prev: string) => prev + num)
  }
  
  // Handle backspace
  const handleBackspace = () => {
    setPhoneNumber((prev: string) => prev.slice(0, -1))
  }
  
  // Clear the phone number input
  const handleClear = () => {
    setPhoneNumber("")
  }
  
  // Make a call to the entered phone number
  const handleCall = async () => {
    // Validate phone number (basic validation)
    if (!phoneNumber || phoneNumber.length < 7) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsDialing(true)
      
      const response = await fetch('/api/phone-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place call')
      }
      
      setCurrentCallSid(data.callSid)
      
      toast({
        title: "Call Initiated",
        description: `Calling ${phoneNumber}...`,
      })
    } catch (error) {
      console.error('Error placing call:', error)
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : "Could not place call",
        variant: "destructive"
      })
    } finally {
      setIsDialing(false)
    }
  }
  
  // End the current call
  const handleEndCall = async () => {
    if (!currentCallSid) return
    
    try {
      const response = await fetch('/api/phone-call/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callSid: currentCallSid }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to end call')
      }
      
      setCurrentCallSid(null)
      
      toast({
        title: "Call Ended",
        description: "The call has been ended",
      })
    } catch (error) {
      console.error('Error ending call:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not end call",
        variant: "destructive"
      })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">Phone Dialer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Input
            type="tel"
            value={phoneNumber}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
            className="text-xl text-center font-mono"
            placeholder="+1 (234) 567-8900"
          />
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {/* Number buttons 1-9 */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              variant="outline"
              onClick={() => handleNumberInput(num.toString())}
              className="h-12 text-lg"
            >
              {num}
            </Button>
          ))}
          
          {/* *, 0, # */}
          <Button variant="outline" onClick={() => handleNumberInput("*")} className="h-12 text-lg">
            *
          </Button>
          <Button variant="outline" onClick={() => handleNumberInput("0")} className="h-12 text-lg">
            0
          </Button>
          <Button variant="outline" onClick={() => handleNumberInput("#")} className="h-12 text-lg">
            #
          </Button>
          
          {/* + button */}
          <Button variant="outline" onClick={() => handleNumberInput("+")} className="h-12">
            <Plus className="h-4 w-4" />
          </Button>
          
          {/* Backspace button */}
          <Button variant="outline" onClick={handleBackspace} className="h-12 col-span-2">
            <X className="h-4 w-4 mr-2" />
            Backspace
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        {isDialing || currentCallSid ? (
          <Button onClick={handleEndCall} variant="destructive" disabled={isDialing} className="w-full">
            <X className="h-4 w-4 mr-2" />
            End Call
          </Button>
        ) : (
          <Button
            onClick={handleCall}
            variant="default"
            className="bg-green-500 hover:bg-green-600 w-full"
            disabled={!phoneNumber || isDialing}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
        )}
      </CardFooter>
    </Card>
  )
} 