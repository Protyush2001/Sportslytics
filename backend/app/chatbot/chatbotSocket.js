
const { generateReply } = require("./geminiService");
const { getMatchInsights } = require("./contextBuilder");
const jwt = require('jsonwebtoken');
const User = require("../models/user-model");


const activeSessions = new Map();

function registerChatbotHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`Chatbot socket connected: ${socket.id}`);
    

    activeSessions.set(socket.id, {
      userId: null,
      userRole: null,
      userName: null,
      chatHistory: [],
      joinedAt: new Date()
    });


    socket.on("authenticate", async (data) => {
      try {
        const { token } = data;
        
        if (!token) {
          socket.emit("authError", { message: "No authentication token provided" });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('name email role');
        
        if (!user) {
          socket.emit("authError", { message: "Invalid user" });
          return;
        }


        const session = activeSessions.get(socket.id);
        session.userId = user._id;
        session.userRole = user.role;
        session.userName = user.name;
        
        socket.emit("authenticated", {
          message: `Welcome back, ${user.name}! I'm here to help with your cricket queries.`,
          userInfo: {
            name: user.name,
            role: user.role
          }
        });
        
        console.log(`User authenticated: ${user.name} (${user.role})`);
        
      } catch (error) {
        console.error("Authentication error:", error);
        socket.emit("authError", { message: "Authentication failed" });
      }
    });

    socket.on("userMessage", async (data) => {
      try {
        const { message, messageId, timestamp } = data;
        const session = activeSessions.get(socket.id);
        
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          socket.emit("botReply", {
            message: "I didn't receive a valid message. Could you please try again?",
            messageId: messageId || Date.now(),
            timestamp: new Date().toISOString(),
            type: "error"
          });
          return;
        }

        console.log(`Message from ${session?.userName || socket.id}: ${message.substring(0, 100)}...`);


        socket.emit("botTyping", { isTyping: true });


        session.chatHistory.push({
          type: 'user',
          message: message,
          timestamp: new Date()
        });

        if (session.chatHistory.length > 20) {
          session.chatHistory = session.chatHistory.slice(-20);
        }


        const userContext = {
          userId: session.userId,
          role: session.userRole,
          name: session.userName,
          chatHistory: session.chatHistory.slice(-6) 
        };

        const reply = await generateReply(message, userContext);
        

        session.chatHistory.push({
          type: 'bot',
          message: reply,
          timestamp: new Date()
        });


        socket.emit("botTyping", { isTyping: false });
        socket.emit("botReply", {
          message: reply,
          messageId: messageId || Date.now(),
          timestamp: new Date().toISOString(),
          type: "response",
          suggestions: generateSuggestions(message, session.userRole)
        });

      } catch (error) {
        console.error("Chatbot error:", error.message);
        
        socket.emit("botTyping", { isTyping: false });
        socket.emit("botReply", {
          message: getErrorResponse(error),
          messageId: data.messageId || Date.now(),
          timestamp: new Date().toISOString(),
          type: "error"
        });
      }
    });


    socket.on("quickAction", async (data) => {
      try {
        const { action, params } = data;
        const session = activeSessions.get(socket.id);
        
        let response = "";
        
        switch (action) {
          case "getTopPlayers":
            const insights = await getMatchInsights();
            response = formatTopPlayersResponse(insights);
            break;
            
          case "getLiveMatches":
            const liveMatches = await getMatchInsights();
            response = formatLiveMatchesResponse(liveMatches);
            break;
            
          case "getMyStats":
            if (session.userRole === 'player') {
              response = "Let me fetch your latest performance statistics...";

            } else {
              response = "Player statistics are only available for registered players.";
            }
            break;
            
          default:
            response = "I'm not sure what you'd like me to do. Could you please clarify?";
        }
        
        socket.emit("botReply", {
          message: response,
          timestamp: new Date().toISOString(),
          type: "quickAction",
          actionType: action
        });
        
      } catch (error) {
        console.error("Quick action error:", error);
        socket.emit("botReply", {
          message: "I encountered an error processing your request. Please try again.",
          timestamp: new Date().toISOString(),
          type: "error"
        });
      }
    });


    socket.on("chatFeedback", (data) => {
      const { messageId, rating, comment } = data;
      console.log(`Feedback received: Rating ${rating}/5 for message ${messageId}`);

      
      socket.emit("feedbackReceived", {
        message: "Thank you for your feedback! It helps me improve.",
        timestamp: new Date().toISOString()
      });
    });


    socket.on("disconnect", (reason) => {
      const session = activeSessions.get(socket.id);
      const sessionDuration = session ? 
        Math.round((new Date() - session.joinedAt) / 1000) : 0;
        
      console.log(`🤖 Chatbot socket disconnected: ${socket.id}, reason: ${reason}`);
      console.log(`📊 Session duration: ${sessionDuration}s, Messages: ${session?.chatHistory?.length || 0}`);
      
      activeSessions.delete(socket.id);
    });
  });


  setInterval(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    for (const [socketId, session] of activeSessions.entries()) {
      if (session.joinedAt < oneHourAgo) {
        activeSessions.delete(socketId);
      }
    }
  }, 15 * 60 * 1000); 
}

function generateSuggestions(message, userRole) {
  const suggestions = [];
  const lowerMessage = message.toLowerCase();


  if (userRole === 'teamOwner') {
    if (lowerMessage.includes('player') || lowerMessage.includes('team')) {
      suggestions.push("Show my team's top performers", "Compare my players", "Suggest team strategy");
    }
  } else if (userRole === 'admin') {
    suggestions.push("Platform statistics", "User activity report", "Match analytics");
  } else if (userRole === 'player') {
    suggestions.push("My performance stats", "Compare with others", "Training suggestions");
  }


  if (lowerMessage.includes('match')) {
    suggestions.push("Live matches", "Recent results", "Upcoming fixtures");
  }
  
  if (suggestions.length === 0) {
    suggestions.push("Top players", "Live matches", "Recent statistics");
  }

  return suggestions.slice(0, 3); 
}

function getErrorResponse(error) {
  if (error.message.includes('API')) {
    return "I'm experiencing some technical difficulties right now. Please try again in a moment, and I'll do my best to help you.";
  } else if (error.message.includes('timeout')) {
    return "Your request is taking longer than expected. Let me try to help you with something else while we resolve this.";
  } else {
    return "I encountered an unexpected error. Don't worry, I'm still here to help! Please try rephrasing your question.";
  }
}

function formatTopPlayersResponse(insights) {
  if (!insights || insights.length === 0) {
    return "I don't have current player statistics available. Please check back later for updated information.";
  }
  
  return `Here are some recent top performers:\n${insights
    .filter(match => match.topPerformer && match.topPerformer !== "Data not available")
    .slice(0, 5)
    .map(match => `• ${match.topPerformer} in ${match.teams}`)
    .join('\n')}`;
}

function formatLiveMatchesResponse(matches) {
  const liveMatches = matches.filter(match => match.status === 'live');
  
  if (liveMatches.length === 0) {
    return "There are currently no live matches. Check the matches section for upcoming fixtures!";
  }
  
  return `Live Matches:\n${liveMatches
    .map(match => `• ${match.teams} - ${match.score || 'Score updating...'} (${match.overs || 0} overs)`)
    .join('\n')}`;
}

module.exports = registerChatbotHandlers;