"use client"

import { useState, useEffect } from "react"
import { getUserCallHistory } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CallHistoryProps {
  userId: string
  onCallUser: (userId: string, username: string) => void
}

export default function CallHistory({ userId, onCallUser }: CallHistoryProps) {
  const [callHistory, setCallHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function fetchCallHistory() {
    setIsLoading(true)
    try {
      const history = await getUserCallHistory(userId)
      setCallHistory(history.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()))
    } catch (error) {
      console.error("Error fetching call history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCallHistory()
  }, [userId])

  function getCallIcon(status: string) {
    switch (status) {
      case "completed":
        return <PhoneOutgoing className="h-4 w-4 text-green-500" />
      case "missed":
        return <PhoneMissed className="h-4 w-4 text-red-500" />
      case "rejected":
        return <PhoneIncoming className="h-4 w-4 text-amber-500" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Call History</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : callHistory.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No call history</div>
        ) : (
          <div className="space-y-2">
            {callHistory.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                onClick={() =>
                  onCallUser(
                    call.callerId === userId ? call.recipientId : call.callerId,
                    call.callerId === userId ? call.recipientName : call.callerName,
                  )
                }
              >
                <div className="flex items-center gap-2">
                  {getCallIcon(call.status)}
                  <div>
                    <div className="font-medium">{call.callerId === userId ? call.recipientName : call.callerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(call.startTime), { addSuffix: true })}
                      {call.duration && ` • ${Math.round(call.duration)}s`}
                    </div>
                  </div>
                </div>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
