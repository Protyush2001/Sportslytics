
const User = require("../models/user-model");
const Team = require("../models/team-model"); 
const Match = require("../models/customMatch-model");
const Player = require("../models/player-model");

// Cache for frequently accessed data
const cache = {
  data: {},
  timestamp: {},
  TTL: 2 * 60 * 1000 // 2 minutes for more real-time data
};

function getCachedData(key) {
  if (cache.data[key] && Date.now() - cache.timestamp[key] < cache.TTL) {
    console.log(`📋 Using cached data for: ${key}`);
    return cache.data[key];
  }
  return null;
}

function setCachedData(key, data) {
  cache.data[key] = data;
  cache.timestamp[key] = Date.now();
  console.log(`💾 Cached data for: ${key}`);
}

async function getUserContext(role, userId) {
  const cacheKey = `user_${role}_${userId}`;
  // const cached = getCachedData(cacheKey);
  // if (false && cached){
  //   return cached;
  // } 
  const cached = false; 
if (cached) return cached;

  let context = "";

  try {
    console.log(`🔍 Fetching user context for role: ${role}, userId: ${userId}`);

    if (role === "teamOwner") {
      const teams = await Team.find({ createdBy: userId })
        .populate({
          path: 'players',
          select: 'name role runs wickets average matches'
        })
        .lean();
      
      console.log(`👥 Found ${teams.length} teams for team owner`);

      if (teams.length > 0) {
        const allPlayers = teams.reduce((acc, team) => {
          return acc.concat(team.players || []);
        }, []);

        const topBatsmen = allPlayers
          .filter(p => p.runs > 0)
          .sort((a, b) => (b.runs || 0) - (a.runs || 0))
          .slice(0, 3);

        const topBowlers = allPlayers
          .filter(p => p.wickets > 0)
          .sort((a, b) => (b.wickets || 0) - (a.wickets || 0))
          .slice(0, 3);

        context = `Teams owned: ${teams.length}
Team Names: ${teams.map(t => t.name).join(", ")}
Total Players: ${allPlayers.length}
Top Batsmen: ${topBatsmen.length > 0 ? topBatsmen.map(p => `${p.name} (${p.runs} runs)`).join(", ") : "No batting data available"}
Top Bowlers: ${topBowlers.length > 0 ? topBowlers.map(p => `${p.name} (${p.wickets} wickets)`).join(", ") : "No bowling data available"}`;
      } else {
        context = "No teams owned yet. Create your first team to get started!";
      }

    } else if (role === "admin") {
      // Get comprehensive admin stats
      const [userCount, matchCount, teamCount, playerCount] = await Promise.all([
        User.countDocuments().catch(() => 0),
        Match.countDocuments().catch(() => 0),
        Team.countDocuments().catch(() => 0),
        Player.countDocuments().catch(() => 0)
      ]);

      // Get recent matches with better error handling - updated for CustomMatch schema
      const recentMatches = await Match.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title teams status currentScore result createdAt')
        .lean()
        .catch(() => []);

      console.log('🔍 Raw recent matches from database:', JSON.stringify(recentMatches, null, 2));

      // Get top performing players - updated for actual Player schema
      const topPlayers = await Player.find({
          $or: [
            { 'runs': { $gt: 0 } },
            { 'wickets': { $gt: 0 } }
          ]
        })
        .sort({ 'runs': -1 })
        .limit(5)
        .select('name runs wickets average matches')
        .lean()
        .catch(() => []);

      console.log(`📊 Admin stats - Users: ${userCount}, Matches: ${matchCount}, Teams: ${teamCount}`);

      context = `Platform Statistics:
Total Users: ${userCount}
Total Matches: ${matchCount}
Total Teams: ${teamCount}
Total Players: ${playerCount}
Recent Matches: ${recentMatches.length > 0 ? 
  recentMatches.map(m => {
    let teamsDisplay = 'Match';
    if (m.teams && Array.isArray(m.teams) && m.teams.length >= 2) {
      teamsDisplay = `${m.teams[0].name || 'Team 1'} vs ${m.teams[1].name || 'Team 2'}`;
    } else if (m.title) {
      teamsDisplay = m.title;
    }
    return `${teamsDisplay} (${m.status})`;
  }).join(", ") : 
  "No recent matches"}
Top Players: ${topPlayers.length > 0 ? topPlayers.map(p => `${p.name} (${p.runs || 0} runs, ${p.wickets || 0} wickets)`).join(", ") : "No player data available"}`;

    } else if (role === "player") {
      const player = await Player.findOne({ userId })
        .select('name role battingStyle bowlingStyle matches average runs wickets teamId')
        .lean()
        .catch(() => null);
        
      if (player) {
        context = `Player Profile: ${player.name}
Role: ${player.role || 'Not specified'}
Batting Style: ${player.battingStyle || 'Not specified'}
Bowling Style: ${player.bowlingStyle || 'Not specified'}
Matches Played: ${player.matches || 0}
Total Runs: ${player.runs || 0}
Total Wickets: ${player.wickets || 0}
Average: ${player.average || 0}`;
      } else {
        context = "Player profile not found. Complete your registration to access detailed stats.";
      }
    }

    setCachedData(cacheKey, context);
    return context;
  } catch (error) {
    console.error("❌ Error fetching user context:", error);
    return `Unable to fetch ${role} data at the moment. Database connection may be unstable.`;
  }
}

async function getAppAnalytics() {
  const cacheKey = "app_analytics";
  const cached = getCachedData(cacheKey);
  
  // Temporarily disable cache to see fresh data
  // if (cached) return cached;

  try {
    console.log("🔄 Fetching comprehensive app analytics...");

    // Get current date for today's data
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    // Fetch all data with proper error handling
    const [
      totalUsers,
      totalMatches,
      totalTeams,
      totalPlayers,
      liveMatches,
      todayMatches,
      recentMatches,
      topBatsmen,
      topBowlers,
      usersByRole
    ] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Match.countDocuments().catch(() => 0),
      Team.countDocuments().catch(() => 0),
      Player.countDocuments().catch(() => 0),
      
      // Live matches - updated for CustomMatch schema
      Match.find({ status: "live" })
        .select('title teams currentScore status result')
        .lean()
        .catch(() => []),
        
      // Today's matches - updated for CustomMatch schema
      Match.find({ 
        createdAt: { $gte: startOfToday },
        status: { $in: ['live', 'completed'] }
      })
        .select('title teams status currentScore result')
        .lean()
        .catch(() => []),
        
      // Recent matches (last 7 days) - updated for CustomMatch schema
      Match.find({ 
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title teams currentScore status result createdAt')
        .lean()
        .catch(() => []),
        
      // Top batsmen - updated for actual Player schema
      Player.find({ 'runs': { $gt: 0 } })
        .sort({ 'runs': -1 })
        .limit(5)
        .select('name runs average matches')
        .lean()
        .catch(() => []),
        
      // Top bowlers - updated for actual Player schema  
      Player.find({ 'wickets': { $gt: 0 } })
        .sort({ 'wickets': -1 })
        .limit(5)
        .select('name wickets average matches')
        .lean()
        .catch(() => []),
        
      // Users by role
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } }
      ]).catch(() => [])
    ]);

    console.log(`📈 Analytics fetched - Users: ${totalUsers}, Matches: ${totalMatches}, Live: ${liveMatches.length}`);

    const analytics = {
      users: {
        total: totalUsers,
        activeToday: todayMatches.length, // Approximate active users by today's matches
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      },
      matches: {
        total: totalMatches,
        live: liveMatches.length,
        today: todayMatches.length,
        recent: recentMatches.slice(0, 5).map(match => {
          // Debug logging to see what we actually get
          console.log('🔍 Debug match data:', {
            title: match.title,
            teams: match.teams,
            teamsType: typeof match.teams,
            teamsIsArray: Array.isArray(match.teams),
            teamsLength: match.teams ? match.teams.length : 0,
            team0: match.teams && match.teams[0] ? match.teams[0] : 'not found',
            team1: match.teams && match.teams[1] ? match.teams[1] : 'not found'
          });

          // Handle multiple possible team structure formats
          let teamsDisplay = 'Match';
          
          if (match.teams && Array.isArray(match.teams)) {
            if (match.teams.length >= 2) {
              // Try different possible structures
              const team1 = match.teams[0];
              const team2 = match.teams[1];
              
              console.log('🔍 Team1 details:', { team1, type: typeof team1, name: team1?.name });
              console.log('🔍 Team2 details:', { team2, type: typeof team2, name: team2?.name });
              
              if (typeof team1 === 'object' && team1 !== null && team1.name && 
                  typeof team2 === 'object' && team2 !== null && team2.name) {
                // Structure: [{ name: "Team A", players: [...] }, { name: "Team B", players: [...] }]
                teamsDisplay = `${team1.name} vs ${team2.name}`;
                console.log('✅ Successfully extracted team names:', teamsDisplay);
              } else if (typeof team1 === 'string' && typeof team2 === 'string') {
                // Structure: ["Team A", "Team B"]
                teamsDisplay = `${team1} vs ${team2}`;
                console.log('✅ Teams are strings:', teamsDisplay);
              } else {
                // Debug what we actually got
                console.log('❌ Unexpected team structure:', {
                  team1Type: typeof team1,
                  team2Type: typeof team2,
                  team1Keys: team1 ? Object.keys(team1) : 'null',
                  team2Keys: team2 ? Object.keys(team2) : 'null'
                });
                teamsDisplay = match.title || 'Unknown Match';
              }
            } else {
              console.log('❌ Not enough teams in array:', match.teams.length);
            }
          } else {
            console.log('❌ Teams is not an array:', { teams: match.teams, type: typeof match.teams });
          }
          
          // If still generic, try using title
          if (teamsDisplay === 'Match' && match.title) {
            teamsDisplay = match.title;
            console.log('🔄 Falling back to title:', teamsDisplay);
          }
          
          console.log('🏏 Final teams display:', teamsDisplay);
          
          return {
            id: match._id,
            title: match.title,
            teams: teamsDisplay,
            status: match.status,
            score: match.currentScore ? `${match.currentScore.runs}/${match.currentScore.wickets} (${match.currentScore.overs}.${match.currentScore.balls})` : 'Not started',
            result: match.result || null,
            date: match.createdAt
          };
        })
      },
      teams: {
        total: totalTeams,
        avgPlayersPerTeam: totalTeams > 0 ? Math.round(totalPlayers / totalTeams) : 0
      },
      players: {
        total: totalPlayers,
        topPerformers: {
          topBatsmen: topBatsmen.map(player => ({
            name: player.name,
            runs: player.runs,
            average: player.average || 0,
            matches: player.matches || 0
          })),
          topBowlers: topBowlers.map(player => ({
            name: player.name,
            wickets: player.wickets,
            average: player.average || 0,
            matches: player.matches || 0
          }))
        }
      },
      liveData: {
        liveMatches: liveMatches.map(match => {
          let teamsDisplay = 'Match';
          if (match.teams && Array.isArray(match.teams) && match.teams.length >= 2) {
            teamsDisplay = `${match.teams[0].name || 'Team 1'} vs ${match.teams[1].name || 'Team 2'}`;
          } else if (match.title) {
            teamsDisplay = match.title;
          }
          
          return {
            id: match._id,
            title: match.title,
            teams: teamsDisplay,
            score: match.currentScore ? `${match.currentScore.runs}/${match.currentScore.wickets} (${match.currentScore.overs}.${match.currentScore.balls})` : 'Score updating...',
            overs: match.currentScore ? `${match.currentScore.overs}.${match.currentScore.balls}` : '0.0'
          };
        }),
        todayMatches: todayMatches.map(match => {
          let teamsDisplay = 'Match';
          if (match.teams && Array.isArray(match.teams) && match.teams.length >= 2) {
            teamsDisplay = `${match.teams[0].name || 'Team 1'} vs ${match.teams[1].name || 'Team 2'}`;
          } else if (match.title) {
            teamsDisplay = match.title;
          }
          
          return {
            title: match.title,
            teams: teamsDisplay,
            status: match.status,
            result: match.result
          };
        })
      }
    };

    setCachedData(cacheKey, analytics);
    return analytics;
  } catch (error) {
    console.error("❌ Error fetching app analytics:", error);
    return {
      users: { total: 0, activeToday: 0 },
      matches: { total: 0, live: 0, today: 0, recent: [] },
      teams: { total: 0, avgPlayersPerTeam: 0 },
      players: { total: 0, topPerformers: { topBatsmen: [], topBowlers: [] } },
      liveData: { liveMatches: [], todayMatches: [] },
      error: "Database connection failed"
    };
  }
}

async function getMatchInsights(matchId = null) {
  try {
    console.log(`🏏 Fetching match insights${matchId ? ` for match: ${matchId}` : ' for recent matches'}`);
    
    let query = {};
    if (matchId) {
      query._id = matchId;
    } else {
      // Get matches from last 24 hours
      query = { 
        createdAt: { 
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        }
      };
    }

    // Updated for CustomMatch schema - teams field contains arrays of players as strings
    const matches = await Match.find(query)
      .select('title teams currentScore status result createdAt')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📋 Found ${matches.length} matches`);

    if (matches.length === 0) {
      return [{
        message: "No recent matches found",
        suggestion: "Check for matches from the past week or create new matches"
      }];
    }

    return matches.map(match => {
      let teamsDisplay = 'Match';
      if (match.teams && Array.isArray(match.teams) && match.teams.length >= 2) {
        teamsDisplay = `${match.teams[0].name || 'Team 1'} vs ${match.teams[1].name || 'Team 2'}`;
      } else if (match.title) {
        teamsDisplay = match.title;
      }
      
      const scoreDisplay = match.currentScore ? 
        `${match.currentScore.runs}/${match.currentScore.wickets} (${match.currentScore.overs}.${match.currentScore.balls})` : 
        'Not started';
      
      return {
        id: match._id,
        title: match.title,
        teams: teamsDisplay,
        status: match.status,
        score: scoreDisplay,
        overs: match.currentScore ? `${match.currentScore.overs}.${match.currentScore.balls}` : '0.0',
        result: match.result || null,
        topPerformer: "Match data available", // Since players are stored as strings in teams array
        playerCount: match.teams ? match.teams.reduce((total, team) => total + (team.players ? team.players.length : 0), 0) : 0,
        date: match.createdAt
      };
    });
  } catch (error) {
    console.error("❌ Error fetching match insights:", error);
    return [{
      error: "Unable to fetch match data",
      message: "Database connection issue or no matches available"
    }];
  }
}

function getMatchTopPerformer(players) {
  if (!players || players.length === 0) {
    return "No player data available";
  }

  // Find top batsman
  const topBatsman = players.reduce((top, player) => {
    const currentRuns = player.battingStats?.totalRuns || 0;
    const topRuns = top.battingStats?.totalRuns || 0;
    return currentRuns > topRuns ? player : top;
  }, players[0]);

  // Find top bowler
  const topBowler = players.reduce((top, player) => {
    const currentWickets = player.bowlingStats?.totalWickets || 0;
    const topWickets = top.bowlingStats?.totalWickets || 0;
    return currentWickets > topWickets ? player : top;
  }, players[0]);

  const batRuns = topBatsman.battingStats?.totalRuns || 0;
  const bowlWickets = topBowler.bowlingStats?.totalWickets || 0;

  if (batRuns > 0 && bowlWickets > 0) {
    return `${topBatsman.name} (${batRuns} runs), ${topBowler.name} (${bowlWickets} wickets)`;
  } else if (batRuns > 0) {
    return `${topBatsman.name} (${batRuns} runs)`;
  } else if (bowlWickets > 0) {
    return `${topBowler.name} (${bowlWickets} wickets)`;
  } else {
    return "No significant performances yet";
  }
}

// Helper function to get today's matches specifically - updated for CustomMatch schema
async function getTodayMatches() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const todayMatches = await Match.find({
      createdAt: { $gte: startOfToday }
    })
    .select('title teams status currentScore result')
    .lean();
    
    return todayMatches;
  } catch (error) {
    console.error("Error fetching today's matches:", error);
    return [];
  }
}

// Helper function to clear cache manually if needed
function clearCache() {
  cache.data = {};
  cache.timestamp = {};
  console.log("🗑️ Cache cleared manually");
}

module.exports = { 
  getUserContext, 
  getAppAnalytics, 
  getMatchInsights,
  getTodayMatches,
  clearCache
};