import React, { useState, useEffect } from "react";
import ChatBot from "./ChatBot";

const ChatBotLauncher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);


  useEffect(() => {
    if (!isOpen) {

      const timer = setTimeout(() => {

        setHasUnreadMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setHasUnreadMessage(false);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setHasUnreadMessage(false);
    setIsMinimized(false);
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const maximizeChat = () => {
    setIsMinimized(false);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>

      <div
        className={`fixed bottom-6 right-6 z-50 cursor-pointer transition-all duration-300 ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
        onClick={toggleChat}
      >
        <div className="relative">

          <div className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors hover:scale-110 transform">
            <span className="text-2xl">🤖</span>
          </div>
          

          {hasUnreadMessage && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">!</span>
            </div>
          )}
          

          <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></div>
        </div>
        

        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Need cricket help? Chat with me! 🏏
          <div className="absolute top-full right-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
        </div>
      </div>


      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
        }`}>
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200">

            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold">Cricket Assistant</h3>
                  <p className="text-xs text-blue-100">
                    {isMinimized ? 'Minimized' : 'Online • Ready to help'}
                  </p>
                </div>
              </div>
              

              <div className="flex items-center gap-2">
                {!isMinimized && (
                  <button
                    onClick={minimizeChat}
                    className="w-6 h-6 flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    title="Minimize"
                  >
                    <span className="text-sm">−</span>
                  </button>
                )}
                
                {isMinimized && (
                  <button
                    onClick={maximizeChat}
                    className="w-6 h-6 flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                    title="Maximize"
                  >
                    <span className="text-sm">□</span>
                  </button>
                )}
                
                <button
                  onClick={closeChat}
                  className="w-6 h-6 flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  title="Close"
                >
                  <span className="text-sm">×</span>
                </button>
              </div>
            </div>


            {!isMinimized && (
              <div className="h-[536px]">
                <ChatBot />
              </div>
            )}


            {isMinimized && (
              <div 
                className="p-3 text-center text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={maximizeChat}
              >
                <p className="text-sm">Click to restore chat 💬</p>
              </div>
            )}
          </div>


          {isOpen && !isMinimized && (
            <div className="absolute bottom-full right-0 mb-2 max-w-xs">
              <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg opacity-0 animate-fade-in">
                <p className="text-sm">
                  Hi! I'm your cricket assistant. I can help you with:
                </p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>• Player statistics & analysis</li>
                  <li>• Live match updates</li>
                  <li>• Team performance insights</li>
                  <li>• Strategic recommendations</li>
                </ul>
                <div className="absolute top-full right-6 w-2 h-2 bg-gray-800 transform rotate-45"></div>
              </div>
            </div>
          )}
        </div>
      )}


      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        /* Responsive adjustments */
        @media (max-width: 480px) {
          .fixed.bottom-6.right-6.z-50.w-96 {
            width: calc(100vw - 3rem) !important;
            right: 1.5rem !important;
            left: 1.5rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default ChatBotLauncher;