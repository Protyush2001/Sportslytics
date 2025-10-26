
function buildPrompt(message, context = {}) {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const currentTime = today.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const { appContext, userContext, userRole, userName } = context;

  let systemPrompt = `You are CricketBot, an intelligent cricket assistant for a comprehensive cricket management platform. You have access to real-time data and can provide detailed insights about players, teams, matches, and statistics.

CURRENT CONTEXT:
 Today: ${formattedDate} at ${currentTime} (IST)
 Platform: Professional Cricket Management System
${userName ? ` User: ${userName} (${userRole || 'User'})` : ''}

LIVE PLATFORM DATA:
${formatAppContext(appContext)}

${userContext ? `YOUR SPECIFIC CONTEXT:\n${userContext}\n` : ''}

CAPABILITIES:
• Access to live match data, player statistics, and team information
• Real-time analysis of ongoing matches and recent performances
• Player comparison and team strategy recommendations
• Historical data analysis and trend identification
• Personalized insights based on your role and data

IMPORTANT INSTRUCTIONS:
1. ALWAYS use the actual data provided above - never say "no data available" if data exists
2. When users ask about "today's matches", refer to the matches from TODAY'S DATE listed above
3. For "top players" queries, use the specific player names and statistics provided
4. If asking about recent matches, use the recent matches data provided
5. Always include specific numbers, names, and statistics in your responses
6. If you see live matches in the data, prioritize discussing them
7. Be specific about player performance - mention actual runs, wickets, averages
8. Reference actual team names and match results from the provided data

RESPONSE STYLE:
• Professional cricket expert tone
• Include specific statistics and numbers
• Use actual player and team names from the data
• Provide actionable insights
• Keep responses engaging and informative (200-400 words)
• Use cricket terminology appropriately

USER QUERY: "${message}"

Remember: The data above is REAL and CURRENT. Use it to provide accurate, specific responses about your platform's actual cricket data.`;

  return systemPrompt;
}

function formatAppContext(appContext) {
  if (!appContext) return "Platform data temporarily unavailable - please check your database connection.";

  const { users, matches, teams, players, liveData } = appContext;
  
  let formatted = `REAL-TIME CRICKET DATA (Updated Now):

 PLATFORM OVERVIEW:
• Total Users: ${users?.total || 0} (Today's Activity: ${users?.activeToday || 0})
• Total Teams: ${teams?.total || 0} (Avg: ${teams?.avgPlayersPerTeam || 0} players/team)
• Registered Players: ${players?.total || 0}
• Total Matches: ${matches?.total || 0}`;


  if (liveData?.liveMatches?.length > 0) {
    formatted += `\n\n LIVE MATCHES RIGHT NOW:`;
    liveData.liveMatches.forEach((match, index) => {
      formatted += `\n  ${index + 1}. ${match.teams} - ${match.score} (${match.overs} overs)`;
    });
  } else {
    formatted += `\n\n LIVE MATCHES: None currently in progress`;
  }


  if (liveData?.todayMatches?.length > 0) {
    formatted += `\n\n TODAY'S MATCHES:`;
    liveData.todayMatches.forEach((match, index) => {
      formatted += `\n  ${index + 1}. ${match.teams} - Status: ${match.status}`;
      if (match.winner) {
        formatted += ` (Winner: ${match.winner})`;
      }
    });
  } else {
    formatted += `\n\n TODAY'S MATCHES: No matches scheduled or completed today`;
  }


  if (players?.topPerformers?.topBatsmen?.length > 0) {
    formatted += `\n\n TOP BATSMEN (Current Season):`;
    players.topPerformers.topBatsmen.slice(0, 5).forEach((player, index) => {
      const average = (player.average && typeof player.average === 'number') ? player.average.toFixed(1) : '0.0';
      const runs = player.runs || 0;
      formatted += `\n  ${index + 1}. ${player.name} - ${runs} runs (Avg: ${average})`;
    });
  }

  if (players?.topPerformers?.topBowlers?.length > 0) {
    formatted += `\n\n⚡ TOP BOWLERS (Current Season):`;
    players.topPerformers.topBowlers.slice(0, 5).forEach((player, index) => {
      const average = (player.average && typeof player.average === 'number') ? player.average.toFixed(1) : '0.0';
      const wickets = player.wickets || 0;
      formatted += `\n  ${index + 1}. ${player.name} - ${wickets} wickets (Avg: ${average})`;
    });
  }


  if (matches?.recent?.length > 0) {
    formatted += `\n\n RECENT MATCH RESULTS:`;
    matches.recent.slice(0, 5).forEach((match, index) => {
      const date = new Date(match.date).toLocaleDateString("en-IN", { 
        month: 'short', 
        day: 'numeric' 
      });
      formatted += `\n  ${index + 1}. ${match.team1} vs ${match.team2} - ${match.status}`;
      if (match.winner) {
        formatted += ` (Won by ${match.winner})`;
      }
      formatted += ` [${date}]`;
    });
  }


  const hasLiveData = (liveData?.liveMatches?.length > 0) || (liveData?.todayMatches?.length > 0);
  const hasPlayerData = (players?.topPerformers?.topBatsmen?.length > 0) || (players?.topPerformers?.topBowlers?.length > 0);
  const hasMatchData = matches?.recent?.length > 0;

  if (!hasLiveData && !hasPlayerData && !hasMatchData) {
    formatted += `\n\n DATA STATUS: Limited cricket activity detected. This could mean:
• New platform with minimal historical data
• Off-season period with no recent matches
• Database sync in progress`;
  } else {
    formatted += `\n\n DATA STATUS: Live cricket data successfully loaded and current`;
  }

  return formatted;
}

function getContextualPromptEnhancements(message, userRole) {
  const enhancements = [];
  

  switch (userRole) {
    case 'admin':
      enhancements.push("Focus on platform analytics, user engagement metrics, and system performance insights.");
      break;
    case 'teamOwner':
      enhancements.push("Emphasize team performance analysis, player recommendations, and strategic team building advice.");
      break;
    case 'player':
      enhancements.push("Provide personal performance analysis, comparison with peers, and specific improvement suggestions.");
      break;
  }

  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('today') || lowerMessage.includes('current')) {
    enhancements.push("Prioritize today's data and current live information from the platform.");
  }
  
  if (lowerMessage.includes('compare') || lowerMessage.includes('vs')) {
    enhancements.push("Use specific statistical comparisons with actual numbers from the provided data.");
  }
  
  if (lowerMessage.includes('best') || lowerMessage.includes('top')) {
    enhancements.push("Reference the actual top performers listed in the platform data with their specific statistics.");
  }
  
  if (lowerMessage.includes('match') && lowerMessage.includes('live')) {
    enhancements.push("Focus on the live matches section if any are currently in progress.");
  }

  return enhancements.join(' ');
}

module.exports = { buildPrompt, formatAppContext };