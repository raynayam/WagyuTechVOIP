"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { sendMessage, getUserChats, getChatMessages, markMessagesAsRead, PopulatedMessage } from "@/lib/messaging-service"
import { useSocket } from "@/hooks/use-socket"
import { IChat } from "@/lib/models/chat"
import { PaperAirplaneIcon, LockClosedIcon } from "@heroicons/react/24/outline"
import { toast } from "@/hooks/use-toast"

interface MessagingProps {
  userId: string
  username: string
}

export function Messaging({ userId, username }: MessagingProps) {
  const [chats, setChats] = useState<IChat[]>([])
  const [currentChat, setCurrentChat] = useState<IChat | null>(null)
  const [messages, setMessages] = useState<PopulatedMessage[]>([])
  const [messageText, setMessageText] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  
  // Socket connection for real-time messaging
  const { isConnected, socket } = useSocket({
    userId,
    onNewMessage: (message: PopulatedMessage) => {
      if (currentChat && 
          (message.sender._id === currentChat.participants.find(p => p !== userId)?.toString() || 
           message.recipient._id === currentChat.participants.find(p => p !== userId)?.toString())) {
        // Add the new message to the messages state
        setMessages(prev => [message, ...prev])
        
        // Mark message as read
        if (message.recipient._id === userId) {
          markMessagesAsRead(currentChat._id.toString(), userId)
        }
      } else {
        // Notification for messages in other chats
        toast({
          title: "New Message",
          description: `New message from ${message.sender.username}`
        })
        
        // Refresh chat list to update unread counts
        fetchChats()
      }
    }
  })
  
  // Fetch user chats
  const fetchChats = async () => {
    try {
      setLoading(true)
      const userChats = await getUserChats(userId)
      setChats(userChats)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching chats:", error)
      setLoading(false)
    }
  }
  
  // Fetch messages for the current chat
  const fetchMessages = async (chatId: string) => {
    try {
      setLoadingMessages(true)
      const chatMessages = await getChatMessages(chatId, userId)
      setMessages(chatMessages)
      setLoadingMessages(false)
    } catch (error) {
      console.error("Error fetching messages:", error)
      setLoadingMessages(false)
    }
  }
  
  // Load chats on component mount
  useEffect(() => {
    fetchChats()
  }, [userId])
  
  // Load messages when a chat is selected
  useEffect(() => {
    if (currentChat) {
      fetchMessages(currentChat._id.toString())
      
      // Mark messages as read
      markMessagesAsRead(currentChat._id.toString(), userId)
    }
  }, [currentChat])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentChat) return
    
    try {
      const recipientId = currentChat.participants.find(p => p.toString() !== userId)?.toString()
      
      if (!recipientId) {
        toast({
          title: "Error",
          description: "Could not determine recipient",
          variant: "destructive"
        })
        return
      }
      
      await sendMessage({
        content: messageText,
        sender: userId,
        recipient: recipientId,
        encrypted: true
      })
      
      // Clear input
      setMessageText("")
      
      // Refresh messages
      fetchMessages(currentChat._id.toString())
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    }
  }
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <div className="flex h-[80vh]">
      {/* Chat List */}
      <div className="w-1/3 border-r overflow-auto">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Conversations</h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <p>Loading chats...</p>
          </div>
        ) : (
          <div>
            {chats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No conversations yet</p>
              </div>
            ) : (
              chats.map(chat => {
                // Find the other user in the conversation
                const otherParticipant = chat.participants.find(p => p.toString() !== userId);
                const chatName = chat.isGroup ? chat.name : (otherParticipant as any)?.username || 'Unknown';
                const unreadCount = chat.unreadCount?.get(userId) || 0;
                
                return (
                  <div 
                    key={chat._id.toString()} 
                    className={`p-3 flex items-center space-x-3 hover:bg-gray-100 cursor-pointer ${
                      currentChat?._id.toString() === chat._id.toString() ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setCurrentChat(chat)}
                  >
                    <Avatar>
                      <AvatarFallback>{chatName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-medium truncate">{chatName}</h3>
                        {chat.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {new Date(chat.lastMessageTime).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessageText || 'No messages yet'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            <div className="p-4 border-b flex items-center space-x-2">
              <Avatar>
                <AvatarFallback>
                  {currentChat.isGroup 
                    ? currentChat.name?.substring(0, 2).toUpperCase() 
                    : (currentChat.participants.find(p => p.toString() !== userId) as any)?.username?.substring(0, 2).toUpperCase() || '??'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">
                  {currentChat.isGroup 
                    ? currentChat.name 
                    : (currentChat.participants.find(p => p.toString() !== userId) as any)?.username || 'Unknown'}
                </h2>
                <div className="flex items-center text-xs text-green-600">
                  <LockClosedIcon className="h-3 w-3 mr-1" />
                  <span>End-to-end encrypted</span>
                </div>
              </div>
            </div>
            
            <div ref={messageListRef} className="flex-1 p-4 overflow-y-auto flex flex-col-reverse">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(message => {
                    const isCurrentUser = message.sender._id === userId;
                    
                    return (
                      <div key={message._id.toString()} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg p-3`}>
                          <div className="text-sm">{message.content}</div>
                          <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'} flex items-center`}>
                            {message.encrypted && <LockClosedIcon className="h-3 w-3 mr-1" />}
                            <span>{formatTime(message.createdAt)}</span>
                            {message.read && isCurrentUser && (
                              <span className="ml-1">✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                  <PaperAirplaneIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <h3 className="font-medium text-lg">Select a conversation</h3>
              <p className="mt-1">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 