"use client"

import { useState, useEffect } from "react"
import { requireAuth, logout } from "@/lib/auth"
import CallInterface from "@/components/call-interface"
import CallHistory from "@/components/call-history"
import ContactsList from "@/components/contacts-list"
import PhoneDialer from "@/components/phone-dialer"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Phone, UserRound, History } from "lucide-react"

export default function Home() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("call")

  useEffect(() => {
    async function getUser() {
      try {
        const userData = await requireAuth()
        setUser(userData)
      } catch (error) {
        console.error("Authentication error:", error)
      }
    }

    getUser()
  }, [])

  const handleCallUser = (userId: string, username: string) => {
    setSelectedUserId(userId)
    setSelectedUsername(username)
    setActiveTab("call") // Switch to call tab when initiating a call
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">VOIP Web App</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Logged in as {user.username}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Tabs defaultValue="call" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="call">
                <Phone className="h-4 w-4 mr-2" />
                Call Interface
              </TabsTrigger>
              <TabsTrigger value="phone">
                <Phone className="h-4 w-4 mr-2" />
                Phone Dialer
              </TabsTrigger>
            </TabsList>
            <TabsContent value="call" className="mt-4">
              <CallInterface userId={user.id} username={user.username} />
            </TabsContent>
            <TabsContent value="phone" className="mt-4">
              <PhoneDialer userId={user.id} username={user.username} />
            </TabsContent>
          </Tabs>
          
          <CallHistory userId={user.id} onCallUser={handleCallUser} />
        </div>
        <div>
          <ContactsList userId={user.id} onCallUser={handleCallUser} />
        </div>
      </div>
    </main>
  )
}
