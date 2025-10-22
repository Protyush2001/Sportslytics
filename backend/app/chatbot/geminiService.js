
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildPrompt } = require("./promptBuilder");
const { getUserContext, getAppAnalytics } = require("./contextBuilder");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateReply(userMessage, userContext = {}) {
  try {
    console.log(` Generating reply for: "${userMessage.substring(0, 50)}..."`);
    console.log(` User context: ${userContext.role} - ${userContext.name}`);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    });


    console.log(" Fetching app analytics...");
    const appContext = await getAppAnalytics();
    console.log(` App context loaded - Users: ${appContext.users?.total}, Matches: ${appContext.matches?.total}, Live: ${appContext.liveData?.liveMatches?.length}`);

    let userSpecificContext = null;
    if (userContext.userId && userContext.role) {
      console.log(` Fetching user-specific context for ${userContext.role}...`);
      userSpecificContext = await getUserContext(userContext.role, userContext.userId);
      console.log(` User context loaded: ${userSpecificContext?.substring(0, 100)}...`);
    }


    const prompt = buildPrompt(userMessage, {
      appContext,
      userContext: userSpecificContext,
      userRole: userContext.role,
      userName: userContext.name
    });

    console.log(" Sending request to Gemini API...");
    console.log(` Prompt length: ${prompt.length} characters`);
    

    if (appContext.players?.topPerformers?.topBatsmen?.length > 0) {
      console.log(` Sample data - Top batsman: ${appContext.players.topPerformers.topBatsmen[0].name} (${appContext.players.topPerformers.topBatsmen[0].runs} runs)`);
    }
    
    if (appContext.liveData?.liveMatches?.length > 0) {
      console.log(` Live matches available: ${appContext.liveData.liveMatches.length}`);
    }

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();


    console.log(` Gemini response received: ${response.length} characters`);
    console.log(` Response preview: "${response.substring(0, 150)}..."`);


    validateResponseQuality(response, appContext, userMessage);

    return response;
  } catch (error) {
    console.error(" Gemini API error:", error);
    

    if (error.message?.includes('API_KEY')) {
      console.error(" API Key issue detected");
      return "I'm experiencing authentication issues with my AI service. Please contact the administrator to check the API configuration.";
    } 
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      console.error(" API quota/limit exceeded");
      return "I'm temporarily experiencing high usage. Please try again in a few moments, or contact support if this persists.";
    }
    
    if (error.message?.includes('timeout')) {
      console.error(" API timeout occurred");
      return "Your request is taking longer than expected. Let me provide a quick response based on available data while we resolve this.";
    }


    try {
      console.log(" Attempting fallback response with cached data...");
      const fallbackResponse = await generateFallbackResponse(userMessage, userContext);
      return fallbackResponse;
    } catch (fallbackError) {
      console.error(" Fallback response also failed:", fallbackError);
    }

    return getFinalFallbackResponse(userMessage);
  }
}

async function generateFallbackResponse(userMessage, userContext) {
  try {

    const appContext = await getAppAnalytics();
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('top') && lowerMessage.includes('player')) {
      if (appContext.players?.topPerformers?.topBatsmen?.length > 0) {
        const topBatsmen = appContext.players.topPerformers.topBatsmen.slice(0, 3);
        return `Here are our current top batsmen based on runs scored:\n${topBatsmen.map((p, i) => `${i+1}. ${p.name} - ${p.runs} runs (Average: ${p.average.toFixed(1)})`).join('\n')}\n\nThese statistics are updated based on recent matches in our platform.`;
      }
    }

    if (lowerMessage.includes('live') || lowerMessage.includes('current')) {
      if (appContext.liveData?.liveMatches?.length > 0) {
        const liveMatches = appContext.liveData.liveMatches;
        return `Current live matches:\n${liveMatches.map((m, i) => `${i+1}. ${m.teams} - ${m.score}`).join('\n')}\n\nFollow these matches for real-time updates!`;
      } else {
        return "No matches are currently live. Check back later or view recent match results in the matches section.";
      }
    }

    if (lowerMessage.includes('today')) {
      if (appContext.liveData?.todayMatches?.length > 0) {
        const todayMatches = appContext.liveData.todayMatches;
        return `Today's matches:\n${todayMatches.map((m, i) => `${i+1}. ${m.teams} - ${m.status}${m.winner ? ` (Winner: ${m.winner})` : ''}`).join('\n')}`;
      } else {
        return "No matches are scheduled for today. Check the upcoming fixtures or create a new match!";
      }
    }

    if (lowerMessage.includes('team') && userContext.role === 'teamOwner') {
      const userSpecificContext = await getUserContext(userContext.role, userContext.userId);
      return `Based on your teams: ${userSpecificContext}`;
    }


    return `I have access to data for ${appContext.users?.total || 0} users, ${appContext.matches?.total || 0} matches, and ${appContext.players?.total || 0} players. What specific information would you like to know about?`;

  } catch (error) {
    console.error("Fallback response generation failed:", error);
    throw error;
  }
}

function getFinalFallbackResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('player')) {
    return "I'm having trouble accessing player data right now. Please check the players section directly or try again in a moment.";
  } else if (lowerMessage.includes('match')) {
    return "Match information is temporarily unavailable. Please visit the matches section for the latest updates.";
  } else if (lowerMessage.includes('team')) {
    return "Team data is currently inaccessible. Please check the teams section or try again later.";
  } else if (lowerMessage.includes('top') || lowerMessage.includes('best')) {
    return "I'm unable to access performance rankings right now. Please check the leaderboards section for top performers.";
  }
  
  return "I'm experiencing technical difficulties accessing the cricket data. Please try again in a moment or check the relevant sections directly in the app.";
}

function validateResponseQuality(response, appContext, userMessage) {
  const lowerResponse = response.toLowerCase();
  const lowerMessage = userMessage.toLowerCase();
  

  if (lowerResponse.includes('no data') || lowerResponse.includes('not available') || lowerResponse.includes('unavailable')) {
    

    const hasPlayerData = appContext.players?.topPerformers?.topBatsmen?.length > 0 || appContext.players?.topPerformers?.topBowlers?.length > 0;
    const hasMatchData = appContext.matches?.recent?.length > 0 || appContext.liveData?.liveMatches?.length > 0;
    const hasTodayData = appContext.liveData?.todayMatches?.length > 0;
    
    if (lowerMessage.includes('player') && hasPlayerData) {
      console.warn(" Response claims no player data but data exists!");
    }
    if (lowerMessage.includes('match') && hasMatchData) {
      console.warn(" Response claims no match data but data exists!");
    }
    if (lowerMessage.includes('today') && hasTodayData) {
      console.warn(" Response claims no today's data but data exists!");
    }
  }
  

  const hasSpecificNames = /[A-Z][a-z]+ [A-Z][a-z]+/.test(response); 
  const hasSpecificNumbers = /\d+/.test(response);
  
  if ((hasSpecificNames || hasSpecificNumbers)) {
    console.log(" Response includes specific data - good quality");
  } else if (appContext.players?.total > 0 || appContext.matches?.total > 0) {
    console.warn(" Response may be too generic despite available data");
  }
}


async function testDataConnectivity() {
  try {
    console.log(" Testing database connectivity...");
    const appContext = await getAppAnalytics();
    
    console.log(` Connection test results:
    - Users: ${appContext.users?.total || 0}
    - Matches: ${appContext.matches?.total || 0} 
    - Teams: ${appContext.teams?.total || 0}
    - Players: ${appContext.players?.total || 0}
    - Live matches: ${appContext.liveData?.liveMatches?.length || 0}
    - Today's matches: ${appContext.liveData?.todayMatches?.length || 0}`);
    
    if (appContext.error) {
      console.error(" Database connectivity issue:", appContext.error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(" Data connectivity test failed:", error);
    return false;
  }
}

module.exports = { 
  generateReply,
  testDataConnectivity 
};