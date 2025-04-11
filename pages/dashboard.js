import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('messages');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for contacts and messages
  const contacts = [
    { id: '1', name: 'Sarah Johnson', status: 'online', avatar: '👩‍💼', lastSeen: 'Just now' },
    { id: '2', name: 'Michael Chen', status: 'online', avatar: '👨‍💻', lastSeen: '2m ago' },
    { id: '3', name: 'Elena Rodriguez', status: 'away', avatar: '👩‍🎓', lastSeen: '1h ago' },
    { id: '4', name: 'David Kim', status: 'offline', avatar: '👨‍🔬', lastSeen: '3h ago' },
    { id: '5', name: 'Lisa Patel', status: 'online', avatar: '👩‍⚕️', lastSeen: '30m ago' }
  ];

  const messages = [
    { id: '1', contactId: '1', text: 'Hey, how are you doing?', time: '09:30 AM', sent: false },
    { id: '2', contactId: '1', text: 'I\'m good, thanks! How about you?', time: '09:32 AM', sent: true },
    { id: '3', contactId: '1', text: 'Great! Just working on the new project.', time: '09:35 AM', sent: false },
    { id: '4', contactId: '1', text: 'Need any help with it?', time: '09:40 AM', sent: true },
    { id: '5', contactId: '1', text: 'Actually, yes. Could we have a call later?', time: '09:42 AM', sent: false }
  ];

  const callLogs = [
    { id: '1', name: 'Sarah Johnson', type: 'incoming', duration: '12:03', time: 'Today, 10:30 AM', avatar: '👩‍💼' },
    { id: '2', name: 'Michael Chen', type: 'outgoing', duration: '03:45', time: 'Today, 09:15 AM', avatar: '👨‍💻' },
    { id: '3', name: 'Elena Rodriguez', type: 'missed', duration: '00:00', time: 'Yesterday, 6:30 PM', avatar: '👩‍🎓' },
    { id: '4', name: 'David Kim', type: 'incoming', duration: '08:12', time: 'Yesterday, 3:20 PM', avatar: '👨‍🔬' },
    { id: '5', name: 'Lisa Patel', type: 'outgoing', duration: '01:50', time: 'Yesterday, 11:45 AM', avatar: '👩‍⚕️' }
  ];

  const handleSignOut = () => {
    router.push('/');
  };

  const [selectedContact, setSelectedContact] = useState(contacts[0]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    // Here you would typically send the message to your backend
    setNewMessage('');
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(
    contact => contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Dashboard - VoIP App</title>
        <meta name="description" content="VoIP application dashboard" />
      </Head>
      
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-[#d946ef] to-[#10b981] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">VoIP App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('messages')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'messages' 
                    ? 'bg-white text-[#d946ef]' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Messages
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'calls' 
                    ? 'bg-white text-[#10b981]' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Calls
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'contacts' 
                    ? 'bg-white text-[#d946ef]' 
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Contacts
              </button>
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 border border-white rounded-md shadow-sm text-sm font-medium text-white hover:bg-white/10"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="flex h-[calc(100vh-9rem)] border border-[#10b981]/20 rounded-xl shadow-lg overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-[#10b981]/20 bg-white">
              <div className="p-4 border-b border-[#10b981]/20">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full px-4 py-2 border-2 border-[#10b981]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="overflow-y-auto h-[calc(100vh-15rem)]">
                {filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className={`flex items-center space-x-3 p-4 hover:bg-[#10b981]/5 cursor-pointer ${
                      selectedContact?.id === contact.id ? 'bg-[#10b981]/10' : ''
                    }`}
                  >
                    <div className="relative">
                      <div className="text-2xl">{contact.avatar}</div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                        contact.status === 'online' ? 'bg-[#10b981]' : 
                        contact.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-xs text-gray-500">{contact.lastSeen}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="w-2/3 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-[#10b981]/20 bg-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{selectedContact?.avatar}</div>
                  <div>
                    <div className="font-medium">{selectedContact?.name}</div>
                    <div className="text-xs text-gray-500">{selectedContact?.status === 'online' ? 'Online' : selectedContact?.lastSeen}</div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button className="p-2 rounded-full bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                  <button className="p-2 rounded-full bg-[#d946ef]/10 text-[#d946ef] hover:bg-[#d946ef]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-[#f8f9fa] flex flex-col space-y-3">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.sent 
                        ? 'bg-[#10b981] text-white self-end rounded-br-none' 
                        : 'bg-white border border-[#d946ef]/20 self-start rounded-bl-none'
                    }`}
                  >
                    <div>{message.text}</div>
                    <div className={`text-xs ${message.sent ? 'text-white/70' : 'text-gray-500'} text-right mt-1`}>
                      {message.time}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-[#10b981]/20 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <button
                    type="button"
                    className="p-2 rounded-full bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-[#10b981]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
                    placeholder="Type a message..."
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-full bg-gradient-to-r from-[#d946ef] to-[#10b981] text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Calls Tab */}
        {activeTab === 'calls' && (
          <div className="bg-white border border-[#10b981]/20 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-[#10b981]/20 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#d946ef]">Recent Calls</h2>
              <button className="p-2 rounded-full bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            
            <div className="divide-y divide-[#10b981]/10">
              {callLogs.map(call => (
                <div key={call.id} className="p-4 flex items-center justify-between hover:bg-[#10b981]/5">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{call.avatar}</div>
                    <div>
                      <div className="font-medium">{call.name}</div>
                      <div className="flex items-center text-sm">
                        <span className={
                          call.type === 'incoming' ? 'text-[#10b981]' : 
                          call.type === 'outgoing' ? 'text-[#d946ef]' : 'text-red-500'
                        }>
                          {call.type === 'incoming' ? '↓ Incoming' : 
                           call.type === 'outgoing' ? '↑ Outgoing' : '✕ Missed'}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="text-gray-500">{call.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-500">{call.duration}</div>
                    <div className="flex space-x-2">
                      <button className="p-2 rounded-full bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </button>
                      <button className="p-2 rounded-full bg-[#d946ef]/10 text-[#d946ef] hover:bg-[#d946ef]/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="bg-white border border-[#10b981]/20 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-[#10b981]/20 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[#d946ef]">Contacts</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="px-4 py-2 border-2 border-[#10b981]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d946ef] focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="p-2 rounded-full bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-[#10b981]/10">
              {filteredContacts.map(contact => (
                <div key={contact.id} className="p-4 flex items-center justify-between hover:bg-[#10b981]/5">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="text-2xl">{contact.avatar}</div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ${
                        contact.status === 'online' ? 'bg-[#10b981]' : 
                        contact.status === 'away' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-xs text-gray-500">{contact.status === 'online' ? 'Online' : contact.lastSeen}</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button className="p-2 rounded-full bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-full bg-[#d946ef]/10 text-[#d946ef] hover:bg-[#d946ef]/20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 