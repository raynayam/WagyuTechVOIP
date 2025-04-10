"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSocket } from "@/hooks/use-socket"
import { getUserContacts, type Contact } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserData {
  id: string
  name: string
  online?: boolean
}

interface UserSelectorProps {
  userId: string
  onSelectUser: (userId: string, username: string) => void
}

export function UserSelector({ userId, onSelectUser }: UserSelectorProps) {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  
  // Initialize socket connection to get online users
  const { isConnected } = useSocket({
    userId,
    onUsersOnline: (onlineUserIds) => {
      // Update user list with online status
      updateOnlineStatus(onlineUserIds)
    },
    onUserOnline: (onlineUserId) => {
      // Add new online user
      updateOnlineStatus([onlineUserId])
    }
  })
  
  // Fetch contacts from database
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true)
      const contacts = await getUserContacts(userId)
      
      // Map contacts to UserData format
      const formattedContacts = contacts.map((contact: Contact) => ({
        id: contact.contactId,
        name: contact.name
      }))
      
      setUsers(formattedContacts)
      setFilteredUsers(formattedContacts)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching contacts:", error)
      setLoading(false)
    }
  }, [userId])
  
  // Update online status of users
  const updateOnlineStatus = useCallback((onlineUserIds: string[]) => {
    setUsers(prevUsers => {
      return prevUsers.map(user => ({
        ...user,
        online: onlineUserIds.includes(user.id)
      }))
    })
    
    // Also update filtered users
    if (searchQuery) {
      filterUsers(searchQuery)
    }
  }, [searchQuery])
  
  // Filter users by search query
  const filterUsers = useCallback((query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setFilteredUsers(users)
      return
    }
    
    const lowerQuery = query.toLowerCase()
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(lowerQuery)
    )
    setFilteredUsers(filtered)
  }, [users])
  
  // Initial data load
  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])
  
  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => filterUsers(e.target.value)}
        className="mb-4"
      />
      
      <div className="max-h-[300px] overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-4">No users found</div>
        ) : (
          filteredUsers.map(user => (
            <Card key={user.id} className={`cursor-pointer hover:bg-slate-100 transition-colors ${user.online ? 'border-green-300' : ''}`}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">
                      {user.online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => onSelectUser(user.id, user.name)}
                  disabled={!user.online}
                >
                  Transfer
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 