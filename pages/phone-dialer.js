import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function PhoneDialer() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  
  const handleDigitPress = (digit) => {
    setPhoneNumber(prev => prev + digit);
  };
  
  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };
  
  const handleCall = () => {
    if (phoneNumber.length > 0) {
      setCallStatus('calling');
      // Simulate call connection after 2 seconds
      setTimeout(() => {
        setCallStatus('connected');
      }, 2000);
    }
  };
  
  const handleEndCall = () => {
    setCallStatus('idle');
    // You might want to clear the phone number after ending a call
    // setPhoneNumber('');
  };
  
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleToggleSpeaker = () => {
    setIsSpeaker(!isSpeaker);
  };
  
  const handleGoBack = () => {
    router.push('/dashboard');
  };
  
  const formatPhoneNumber = (number) => {
    // Simple formatter for US numbers
    if (number.length <= 3) return number;
    if (number.length <= 6) return `${number.slice(0, 3)}-${number.slice(3)}`;
    return `${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6, 10)}`;
  };
  
  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      <Head>
        <title>Phone Dialer - VoIP App</title>
        <meta name="description" content="VoIP softphone dialer" />
      </Head>
      
      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-r from-[#d946ef] to-[#10b981] shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={handleGoBack}
                className="text-white hover:bg-white/10 p-2 rounded-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-white ml-2">Softphone</h1>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-lg mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Phone Dialer Interface */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Display Area */}
          <div className="p-6 bg-gradient-to-br from-[#39a5dc] to-[#2980b9] text-center">
            {callStatus === 'connected' && (
              <div className="text-white text-sm mb-1">Connected</div>
            )}
            {callStatus === 'calling' && (
              <div className="text-white text-sm mb-1">Calling...</div>
            )}
            <div className="text-white text-3xl font-semibold mb-2">
              {phoneNumber ? formatPhoneNumber(phoneNumber) : "Enter Number"}
            </div>
            <div className="flex justify-center space-x-4">
              {callStatus === 'connected' && (
                <>
                  <button 
                    className={`rounded-full p-3 ${isMuted ? 'bg-red-500' : 'bg-white/20'}`}
                    onClick={handleToggleMute}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                  <button 
                    className={`rounded-full p-3 ${isSpeaker ? 'bg-[#10b981]' : 'bg-white/20'}`}
                    onClick={handleToggleSpeaker}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Dial Pad */}
          <div className="grid grid-cols-3 gap-1 bg-white p-4">
            {dialPad.map((row, rowIndex) => (
              row.map((digit, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleDigitPress(digit)}
                  disabled={callStatus === 'connected'}
                  className="aspect-square flex flex-col items-center justify-center p-4 text-[#39a5dc] hover:bg-[#f0f4f8] rounded-lg transition-colors"
                >
                  <span className="text-2xl font-semibold">{digit}</span>
                  {digit === '0' && <span className="text-xs mt-1">+</span>}
                  {digit === '1' && <span className="text-xs mt-1">voice</span>}
                  {(digit >= '2' && digit <= '9') && (
                    <span className="text-xs text-gray-500 mt-1">
                      {/* Letters under the numbers */}
                      {digit === '2' ? 'ABC' :
                       digit === '3' ? 'DEF' :
                       digit === '4' ? 'GHI' :
                       digit === '5' ? 'JKL' :
                       digit === '6' ? 'MNO' :
                       digit === '7' ? 'PQRS' :
                       digit === '8' ? 'TUV' : 'WXYZ'}
                    </span>
                  )}
                </button>
              ))
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-4">
            {callStatus === 'idle' ? (
              <>
                <button className="p-4 text-center text-gray-500">
                  {/* Empty button for spacing */}
                </button>
                <button
                  onClick={handleCall}
                  disabled={!phoneNumber}
                  className={`p-4 rounded-full flex items-center justify-center ${
                    phoneNumber 
                      ? 'bg-[#10b981] hover:bg-[#0d9668] text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } mx-auto`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={handleBackspace}
                  disabled={!phoneNumber}
                  className={`p-4 text-center ${
                    phoneNumber ? 'text-gray-500 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                  } flex items-center justify-center`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={handleEndCall}
                className="col-span-3 p-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Recent Calls - Optional Section */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">RECENT CALLS</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">👨‍💼</div>
                  <div>
                    <div className="font-medium">Michael Chen</div>
                    <div className="text-xs text-gray-500">Today, 10:30 AM</div>
                  </div>
                </div>
                <button className="p-2 rounded-full bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  <div className="text-xl">👩‍💼</div>
                  <div>
                    <div className="font-medium">Sarah Johnson</div>
                    <div className="text-xs text-gray-500">Yesterday, 6:15 PM</div>
                  </div>
                </div>
                <button className="p-2 rounded-full bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 