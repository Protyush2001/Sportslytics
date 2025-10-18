
import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// Initialize socket connection with enhanced configuration
const socket = io("http://localhost:3018", {
  transports: ['polling', 'websocket'], // Start with polling for stability
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  maxReconnectionAttempts: 5,
  autoConnect: true
});

// Enhanced connection event handlers
socket.on('connect', () => {
  console.log(' Connected to server:', socket.id);
  console.log(' Transport:', socket.io.engine.transport.name);
  
  // Authenticate user if token is available
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    socket.emit('authenticate', { token });
  }
});

socket.on('connect_error', (error) => {
  console.error(' Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log(' Disconnected:', reason);
});

// Handle transport upgrades
socket.io.engine.on('upgrade', () => {
  console.log('⬆Upgraded to:', socket.io.engine.transport.name);
});

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connection status handlers
    const handleConnect = () => {
      setIsConnected(true);
      addMessage('system', '🤖 Connected to CricketBot! How can I help you today?');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsAuthenticated(false);
    };

    // Authentication handlers
    const handleAuthenticated = (data) => {
      setIsAuthenticated(true);
      setUserInfo(data.userInfo);
      if (data.message) {
        addMessage('bot', data.message, { type: 'welcome' });
      }
      console.log('🔐 Authenticated as:', data.userInfo?.name);
    };

    const handleAuthError = (data) => {
      console.error('🚫 Authentication failed:', data.message);
      addMessage('system', '⚠️ Authentication failed. Some features may be limited.');
    };

    // Message handlers
    const handleBotReply = (reply) => {
      setIsTyping(false);
      
      // Handle different reply formats safely
      let messageText = '';
      let messageSuggestions = [];
      let messageType = 'response';

      if (typeof reply === 'string') {
        messageText = reply;
      } else if (reply && typeof reply === 'object') {
        messageText = reply.message || reply.text || 'Invalid response format';
        messageSuggestions = reply.suggestions || [];
        messageType = reply.type || 'response';
      } else {
        messageText = 'Received invalid response from server';
        messageType = 'error';
      }

      addMessage('bot', messageText, { 
        suggestions: messageSuggestions, 
        type: messageType,
        messageId: reply?.messageId 
      });
    };

    const handleBotTyping = (data) => {
      setIsTyping(data?.isTyping || false);
    };

    const handleWelcome = (data) => {
      if (data?.message) {
        addMessage('bot', data.message, { type: 'welcome' });
      }
    };

    const handleFeedbackReceived = (data) => {
      if (data?.message) {
        addMessage('system', data.message, { type: 'feedback' });
      }
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('authenticated', handleAuthenticated);
    socket.on('authError', handleAuthError);
    socket.on('botReply', handleBotReply);
    socket.on('botTyping', handleBotTyping);
    socket.on('welcome', handleWelcome);
    socket.on('feedbackReceived', handleFeedbackReceived);

    // Set initial connection state
    setIsConnected(socket.connected);

    // Cleanup function
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('authenticated', handleAuthenticated);
      socket.off('authError', handleAuthError);
      socket.off('botReply', handleBotReply);
      socket.off('botTyping', handleBotTyping);
      socket.off('welcome', handleWelcome);
      socket.off('feedbackReceived', handleFeedbackReceived);
    };
  }, []);

  // Helper function to add messages safely
  const addMessage = (sender, text, metadata = {}) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      sender,
      text: String(text), // Ensure text is always a string
      timestamp: new Date().toISOString(),
      ...metadata
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update suggestions if provided
    if (metadata.suggestions && metadata.suggestions.length > 0) {
      setSuggestions(metadata.suggestions);
    }
  };

  const sendMessage = (messageText = null) => {
    const textToSend = messageText || input.trim();
    
    if (!textToSend || !isConnected) return;

    const messageId = Date.now();
    
    // Add user message to UI
    addMessage('user', textToSend, { messageId });
    
    // Send message to bot with enhanced data
    socket.emit("userMessage", {
      message: textToSend,
      messageId: messageId,
      timestamp: new Date().toISOString()
    });

    // Clear input and show typing indicator
    setInput("");
    setIsTyping(true);
    setSuggestions([]); // Clear suggestions after sending
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleQuickAction = (action) => {
    if (!isConnected) return;
    
    socket.emit('quickAction', { action });
    setIsTyping(true);
    
    // Add user message showing the action
    const actionMessages = {
      'getTopPlayers': 'Show me top players',
      'getLiveMatches': 'Show me live matches',
      'getMyStats': 'Show my statistics'
    };
    
    addMessage('user', actionMessages[action] || `Execute ${action}`);
  };

  const handleFeedback = (messageId, isHelpful) => {
    if (!isConnected) return;
    
    socket.emit('chatFeedback', {
      messageId,
      rating: isHelpful ? 5 : 1,
      comment: isHelpful ? 'helpful' : 'not helpful'
    });
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`text-xs px-2 py-1 rounded ${
      isConnected 
        ? (isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')
        : 'bg-red-100 text-red-800'
    }`}>
      {isConnected 
        ? (isAuthenticated ? `✅ Connected${userInfo?.name ? ` as ${userInfo.name}` : ''}` : '🟡 Connected (Limited)')
        : '🔴 Disconnected'
      }
    </div>
  );

  // Message component
  const MessageBubble = ({ message }) => {
    const isBot = message.sender === 'bot';
    const isSystem = message.sender === 'system';
    
    if (isSystem) {
      return (
        <div className="text-center my-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {message.text}
          </span>
        </div>
      );
    }

    return (
      <div className={`mb-3 ${message.sender === "user" ? "text-right" : "text-left"}`}>
        <div className={`inline-block max-w-[80%] px-3 py-2 rounded-lg ${
          message.sender === "user" 
            ? "bg-blue-500 text-white" 
            : "bg-gray-200 text-black"
        }`}>
          <div className="whitespace-pre-wrap">{message.text}</div>
          
          {/* Feedback buttons for bot messages */}
          {isBot && message.messageId && (
            <div className="flex gap-2 mt-2 text-xs">
              <button 
                onClick={() => handleFeedback(message.messageId, true)}
                className="text-gray-500 hover:text-green-600"
                title="Helpful"
              >
                👍
              </button>
              <button 
                onClick={() => handleFeedback(message.messageId, false)}
                className="text-gray-500 hover:text-red-600"
                title="Not helpful"
              >
                👎
              </button>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-gray-400 mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    );
  };

  // Quick action buttons
  const QuickActions = () => (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 border-t">
      <button 
        onClick={() => handleQuickAction('getTopPlayers')}
        className="px-3 py-1 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        disabled={!isConnected}
      >
        🏏 Top Players
      </button>
      <button 
        onClick={() => handleQuickAction('getLiveMatches')}
        className="px-3 py-1 text-xs bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
        disabled={!isConnected}
      >
        🔴 Live Matches
      </button>
      {isAuthenticated && userInfo?.role === 'player' && (
        <button 
          onClick={() => handleQuickAction('getMyStats')}
          className="px-3 py-1 text-xs bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
        >
          📊 My Stats
        </button>
      )}
    </div>
  );

  // Suggestions component
  const Suggestions = () => {
    if (suggestions.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 p-2 bg-blue-50 border-t">
        <span className="text-xs text-gray-600 mb-1 w-full">💡 Suggestions:</span>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
            disabled={!isConnected}
          >
            {suggestion}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold text-gray-800">CricketBot</span>
        </div>
        <ConnectionStatus />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🏏</div>
            <p className="text-sm">
              Hi! I'm your cricket assistant.<br />
              Ask me about players, matches, or statistics!
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {isTyping && (
          <div className="text-left mb-3">
            <div className="inline-block bg-gray-200 px-3 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">Bot is typing...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      <Suggestions />

      {/* Quick Actions */}
      <QuickActions />

      {/* Input */}
      <div className="flex p-3 border-t">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={isConnected ? "Ask about cricket..." : "Connecting..."}
          disabled={!isConnected}
        />
        <button
          onClick={() => sendMessage()}
          className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={!input.trim() || !isConnected || isTyping}
        >
          {isTyping ? '⏳' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatBot;