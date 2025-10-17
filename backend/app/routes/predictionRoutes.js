// const express = require('express');
// const router = express.Router();
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const CustomMatch = require('../models/customMatch-model');

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Match prediction endpoint
// router.post('/predict-match', async (req, res) => {
//   try {
//     const { matchId, predictionType = 'pre_match' } = req.body;

//     const match = await CustomMatch.findById(matchId);
//     if (!match) {
//       return res.status(404).json({ msg: "Match not found" });
//     }

//     const prediction = await generateMatchPrediction(match, predictionType);
    
//     // Save prediction to match
//     match.predictions.push({
//       type: 'match',
//       prediction: prediction.prediction_text,
//       confidence: prediction.confidence,
//       winProbability: prediction.win_probability,
//       timestamp: new Date()
//     });

//     await match.save();

//     res.json({
//       success: true,
//       prediction: prediction.prediction_text,
//       win_probability: prediction.win_probability,
//       confidence: prediction.confidence,
//       key_factors: prediction.key_factors,
//       match_situation: prediction.match_situation
//     });

//   } catch (err) {
//     console.error("Prediction error:", err);
//     res.status(500).json({ msg: "Prediction failed", error: err.message });
//   }
// });

// // In-match prediction based on current situation
// router.post('/predict-in-match', async (req, res) => {
//   try {
//     const { matchId } = req.body;

//     const match = await CustomMatch.findById(matchId);
//     if (!match) {
//       return res.status(404).json({ msg: "Match not found" });
//     }

//     const prediction = await generateInMatchPrediction(match);
    
//     // Update AI insights
//     match.aiInsights.winProbability = prediction.win_probability;
//     match.aiInsights.winProbability.lastUpdated = new Date();

//     await match.save();

//     res.json({
//       success: true,
//       prediction: prediction.prediction_text,
//       win_probability: prediction.win_probability,
//       confidence: prediction.confidence,
//       momentum: prediction.momentum,
//       key_players: prediction.key_players
//     });

//   } catch (err) {
//     console.error("In-match prediction error:", err);
//     res.status(500).json({ msg: "Prediction failed", error: err.message });
//   }
// });

// /////////////////////////////
// // Live prediction on each ball
// router.post('/predict-live', async (req, res) => {
//   try {
//     const { matchId } = req.body;

//     const match = await CustomMatch.findById(matchId);
//     if (!match) {
//       return res.status(404).json({ msg: "Match not found" });
//     }

//     const prediction = await generateLivePrediction(match);
    
//     // Save to match predictions
//     match.predictions.push({
//       type: 'momentum',
//       prediction: prediction.prediction_text,
//       confidence: prediction.confidence,
//       winProbability: prediction.win_probability,
//       timestamp: new Date()
//     });

//     // Update AI insights with live data
//     match.aiInsights.winProbability = prediction.win_probability;
//     match.aiInsights.winProbability.lastUpdated = new Date();
    
//     // Update momentum
//     match.aiInsights.momentum = {
//       status: prediction.momentum,
//       recentRunRate: prediction.recent_run_rate,
//       requiredRunRate: prediction.required_run_rate,
//       lastUpdated: new Date()
//     };

//     await match.save();

//     // Emit socket event for real-time update
//     const io = req.app.get('io');
//     if (io) {
//       io.to(`match_${matchId}`).emit('live_prediction_update', {
//         prediction: prediction.prediction_text,
//         win_probability: prediction.win_probability,
//         confidence: prediction.confidence,
//         momentum: prediction.momentum,
//         key_factors: prediction.key_factors
//       });
//     }

//     res.json({
//       success: true,
//       prediction: prediction.prediction_text,
//       win_probability: prediction.win_probability,
//       confidence: prediction.confidence,
//       momentum: prediction.momentum,
//       key_factors: prediction.key_factors,
//       recent_run_rate: prediction.recent_run_rate,
//       required_run_rate: prediction.required_run_rate
//     });

//   } catch (err) {
//     console.error("Live prediction error:", err);
//     res.status(500).json({ msg: "Live prediction failed", error: err.message });
//   }
// });

// // Generate live prediction based on current ball
// async function generateLivePrediction(match) {
//   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//   const currentInnings = match.currentScore;
//   const inningsScores = match.inningsScores || [];
//   const commentary = match.commentary || [];
  
//   // Get recent balls for momentum analysis
//   const recentBalls = commentary.slice(-12); // Last 2 overs
//   const recentRuns = recentBalls.reduce((sum, ball) => sum + (ball.event.runs || 0), 0);
//   const recentBallsCount = recentBalls.length;
//   const recentRunRate = recentBallsCount > 0 ? (recentRuns / (recentBallsCount / 6)).toFixed(2) : 0;

//   const prompt = `
//     Analyze the CURRENT LIVE match situation after the most recent ball and provide updated prediction:

//     MATCH: ${match.title}
//     CURRENT INNINGS: ${currentInnings.innings}
//     BATTING TEAM: ${match.teams[currentInnings.team]?.name || 'Current Team'}
    
//     CURRENT SCORE: ${currentInnings.runs}/${currentInnings.wickets}
//     OVERS: ${currentInnings.overs}.${currentInnings.balls}
//     CURRENT RUN RATE: ${(currentInnings.runs / (currentInnings.overs + currentInnings.balls/6)).toFixed(2)}
    
//     ${inningsScores.length > 0 ? `FIRST INNINGS: ${inningsScores[0].runs}/${inningsScores[0].wickets}` : ''}
    
//     ${inningsScores.length > 0 && currentInnings.innings === 2 ? 
//       `TARGET: ${inningsScores[0].runs + 1}
//        REQUIRED RUNS: ${Math.max(0, inningsScores[0].runs + 1 - currentInnings.runs)}
//        BALLS REMAINING: ${Math.max(0, (match.overs * 6) - (currentInnings.overs * 6 + currentInnings.balls))}
//        REQUIRED RUN RATE: ${(((inningsScores[0].runs + 1 - currentInnings.runs) / (match.overs - (currentInnings.overs + currentInnings.balls/6))) * 6).toFixed(2)}` : ''}

//     RECENT MOMENTUM (Last 12 balls):
//     - Runs: ${recentRuns} in ${recentBallsCount} balls
//     - Recent Run Rate: ${recentRunRate}
//     - Wickets in last 12 balls: ${recentBalls.filter(ball => ball.event.isWicket).length}

//     LATEST BALL: ${commentary.length > 0 ? commentary[commentary.length - 1].commentary : 'No balls yet'}

//     Provide response in this exact JSON format:
//     {
//       "prediction_text": "Live analysis of current situation...",
//       "win_probability": {
//         "team1": 65.5,
//         "team2": 34.5
//       },
//       "confidence": "High/Medium/Low",
//       "momentum": "Strong Positive/Positive/Neutral/Negative/Strong Negative",
//       "key_factors": ["factor1", "factor2", "factor3"],
//       "recent_run_rate": ${recentRunRate},
//       "required_run_rate": ${inningsScores.length > 0 && currentInnings.innings === 2 ? 
//         (((inningsScores[0].runs + 1 - currentInnings.runs) / (match.overs - (currentInnings.overs + currentInnings.balls/6))) * 6).toFixed(2) : 'null'}
//     }

//     Consider:
//     1. Impact of the most recent ball
//     2. Recent over performance (last 12 balls)
//     3. Wickets in hand vs required run rate
//     4. Current partnership
//     5. Match pressure situation
//     6. Momentum shift from recent events

//     Return ONLY valid JSON, no other text.
//   `;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = result.response.text();
    
//     // Clean and parse JSON
//     const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
//     return JSON.parse(cleanedResponse);
//   } catch (parseError) {
//     console.error('Live prediction JSON parse error:', parseError);
//     // Fallback response
//     return {
//       prediction_text: "Live analysis unavailable. The match is progressing with current momentum.",
//       win_probability: { team1: 50, team2: 50 },
//       confidence: "Medium",
//       momentum: "Neutral",
//       key_factors: ["Current run rate", "Wickets remaining"],
//       recent_run_rate: recentRunRate,
//       required_run_rate: inningsScores.length > 0 && currentInnings.innings === 2 ? 
//         (((inningsScores[0].runs + 1 - currentInnings.runs) / (match.overs - (currentInnings.overs + currentInnings.balls/6))) * 6).toFixed(2) : null
//     };
//   }
// }

// // Generate pre-match prediction
// async function generateMatchPrediction(match, predictionType) {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//   // const prompt = `
//   //   Analyze this cricket match and provide a detailed prediction in JSON format:

//   //   MATCH DETAILS:
//   //   - Title: ${match.title}
//   //   - Teams: ${match.teams[0]?.name || 'Team A'} vs ${match.teams[1]?.name || 'Team B'}
//   //   - Match Type: ${match.overs || 20} overs
//   //   - Teams: ${JSON.stringify(match.teams)}
//   //   ${match.venue ? `- Venue: ${match.venue}` : ''}
//   //   ${match.date ? `- Date: ${match.date}` : ''}

//   //   PREDICTION REQUEST: ${predictionType === 'pre_match' ? 'Pre-match analysis and prediction' : 'Match outcome prediction'}

//   //   Provide response in this exact JSON format:
//   //   {
//   //     "prediction_text": "Detailed prediction analysis...",
//   //     "win_probability": {
//   //       "team1": 55.5,
//   //       "team2": 44.5
//   //     },
//   //     "confidence": "High/Medium/Low",
//   //     "key_factors": ["factor1", "factor2", "factor3"],
//   //     "predicted_winner": "Team Name or Draw",
//   //     "score_prediction": "XXX-XXX",
//   //     "match_situation": "Analysis of match conditions"
//   //   }

//   //   Consider:
//   //   1. Team strengths and composition
//   //   2. Player form and key players
//   //   3. Pitch and weather conditions
//   //   4. Historical performance
//   //   5. Match context and importance

//   //   Return ONLY valid JSON, no other text.
//   // `;

//   const prompt = `
// [STRICT INSTRUCTION: Return ONLY valid JSON. No markdown, no code blocks, no additional text.]

// Analyze this cricket match and provide prediction in this exact JSON format:
// {
//   "prediction_text": "Detailed analysis...",
//   "win_probability": {"team1": 55.5, "team2": 44.5},
//   "confidence": "High/Medium/Low", 
//   "key_factors": ["factor1", "factor2"],
//   "predicted_winner": "Team Name",
//   "score_prediction": "XXX-XXX",
//   "match_situation": "Analysis"
// }

// MATCH DATA:
// - Teams: ${match.teams[0]?.name} vs ${match.teams[1]?.name}
// - Format: ${match.overs} overs
// - Status: ${match.status}
// `;

//   const result = await model.generateContent(prompt);
//   const response = result.response.text();
  
//   try {
//     return JSON.parse(response);
//   } catch (parseError) {
//     // Fallback if JSON parsing fails
//     return {
//       prediction_text: response,
//       win_probability: { team1: 50, team2: 50 },
//       confidence: "Medium",
//       key_factors: ["Team composition", "Current form"],
//       predicted_winner: "Too close to call",
//       score_prediction: "Competitive total expected",
//       match_situation: "Evenly matched contest"
//     };
//   }
// }

// // Generate in-match prediction based on current situation
// async function generateInMatchPrediction(match) {
//   const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//   const currentInnings = match.currentScore;
//   const inningsScores = match.inningsScores || [];
//   const commentary = match.commentary || [];

//   // Get recent match momentum from commentary
//   const recentEvents = commentary.slice(-10).map(c => c.commentary).join(', ');

//   const prompt = `
//     Analyze the current match situation and provide live prediction:

//     MATCH STATUS:
//     - ${match.title}
//     - Current Innings: ${currentInnings.innings}
//     - Batting Team: ${match.teams[currentInnings.team]?.name || 'Current Team'}
//     - Score: ${currentInnings.runs}/${currentInnings.wickets}
//     - Overs: ${currentInnings.overs}.${currentInnings.balls}
//     - Run Rate: ${(currentInnings.runs / (currentInnings.overs + currentInnings.balls/6)).toFixed(2)}
    
//     ${inningsScores.length > 0 ? `- First Innings: ${inningsScores[0].runs}/${inningsScores[0].wickets}` : ''}
//     ${inningsScores.length > 0 && currentInnings.innings === 2 ? 
//       `- Target: ${inningsScores[0].runs + 1}\n- Required Run Rate: ${(((inningsScores[0].runs + 1 - currentInnings.runs) / (match.overs - (currentInnings.overs + currentInnings.balls/6))) * 6).toFixed(2)}` : ''}

//     RECENT MATCH MOMENTUM:
//     ${recentEvents}

//     TEAMS:
//     ${JSON.stringify(match.teams)}

//     Provide response in this exact JSON format:
//     {
//       "prediction_text": "Live match analysis...",
//       "win_probability": {
//         "team1": 60.5,
//         "team2": 39.5
//       },
//       "confidence": "High/Medium/Low",
//       "momentum": "Batting/Bowling/Neutral",
//       "key_players": ["Player1", "Player2"],
//       "critical_factors": ["factor1", "factor2"]
//     }

//     Consider:
//     1. Current run rate vs required run rate
//     2. Wickets in hand
//     3. Recent over performance
//     4. Player form from commentary
//     5. Match pressure situation

//     Return ONLY valid JSON, no other text.
//   `;

//   const result = await model.generateContent(prompt);
//   const response = result.response.text();
  
//   try {
//     return JSON.parse(response);
//   } catch (parseError) {
//     return {
//       prediction_text: response,
//       win_probability: { team1: 50, team2: 50 },
//       confidence: "Medium",
//       momentum: "Neutral",
//       key_players: [],
//       critical_factors: ["Match situation"]
//     };
//   }
// }

// module.exports = router;
//////////////////////////////////////////////////

const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const CustomMatch = require('../models/customMatch-model');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


//////////////////////////

// Helper function to get batting and bowling team names
function getTeamNames(match) {
  const currentInnings = match.currentScore;
  
  if (!match.teams || match.teams.length < 2) {
    return { battingTeam: 'Unknown Team', bowlingTeam: 'Unknown Team' };
  }

  // Team index 0 is always team1, team index 1 is always team2
  // The currentScore.team tells us which team is batting (0 or 1)
  const battingTeamIndex = currentInnings.team;
  const bowlingTeamIndex = battingTeamIndex === 0 ? 1 : 0;
  
  const battingTeam = match.teams[battingTeamIndex]?.name || `Team ${battingTeamIndex + 1}`;
  const bowlingTeam = match.teams[bowlingTeamIndex]?.name || `Team ${bowlingTeamIndex + 1}`;
  
  return { battingTeam, bowlingTeam, battingTeamIndex, bowlingTeamIndex };
}

// Generate live prediction based on current ball
async function generateLivePrediction(match) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });

  const currentInnings = match.currentScore;
  const inningsScores = match.inningsScores || [];
  const commentary = match.commentary || [];
  
  // Get correct team names
  const { battingTeam, bowlingTeam, battingTeamIndex, bowlingTeamIndex } = getTeamNames(match);
  
  // Get recent balls for momentum analysis
  const recentBalls = commentary.slice(-12); // Last 2 overs
  const recentRuns = recentBalls.reduce((sum, ball) => sum + (ball.event.runs || 0), 0);
  const recentBallsCount = recentBalls.length;
  const recentRunRate = recentBallsCount > 0 ? (recentRuns / (recentBallsCount / 6)).toFixed(2) : 0;

  // CORRECTED Required Run Rate Calculation
  let requiredRunRate = null;
  let target = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  
  if (inningsScores.length > 0 && currentInnings.innings === 2) {
    target = inningsScores[0].runs + 1;
    runsNeeded = target - currentInnings.runs;
    ballsRemaining = (match.overs * 6) - (currentInnings.overs * 6 + currentInnings.balls);
    
    if (ballsRemaining > 0) {
      requiredRunRate = ((runsNeeded / ballsRemaining) * 6).toFixed(2);
    } else {
      requiredRunRate = '0.00';
    }
  }

  const prompt = `
You are a cricket analyst. Analyze the current LIVE match situation and provide a prediction.

CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no additional text outside the JSON.

MATCH DATA:
- Title: ${match.title}
- Batting Team: ${battingTeam} (Team ${battingTeamIndex + 1})
- Bowling Team: ${bowlingTeam} (Team ${bowlingTeamIndex + 1})
- Current Innings: ${currentInnings.innings}
- Current Score: ${currentInnings.runs}/${currentInnings.wickets}
- Overs: ${currentInnings.overs}.${currentInnings.balls}
- Current Run Rate: ${(currentInnings.runs / (currentInnings.overs + currentInnings.balls/6)).toFixed(2)}
${inningsScores.length > 0 ? `- First Innings: ${inningsScores[0].runs}/${inningsScores[0].wickets} by ${inningsScores[0].team === 0 ? match.teams[0]?.name : match.teams[1]?.name}` : ''}
${inningsScores.length > 0 && currentInnings.innings === 2 ? 
  `- Target: ${target}
   - Runs Needed: ${runsNeeded}
   - Balls Remaining: ${ballsRemaining}
   - Required Run Rate: ${requiredRunRate}` : ''}
- Recent Momentum: ${recentRuns} runs in last ${recentBallsCount} balls (RR: ${recentRunRate})
- Wickets in last 12 balls: ${recentBalls.filter(ball => ball.event.isWicket).length}

TEAM IDENTIFICATION:
- Team 1 (Index 0): ${match.teams[0]?.name || 'Team 1'}
- Team 2 (Index 1): ${match.teams[1]?.name || 'Team 2'}
- Currently Batting: ${battingTeam} (Team ${battingTeamIndex + 1})
- Currently Bowling: ${bowlingTeam} (Team ${bowlingTeamIndex + 1})

IMPORTANT: When calculating win probability:
- "team1" in win_probability refers to ${match.teams[0]?.name || 'Team 1'} 
- "team2" in win_probability refers to ${match.teams[1]?.name || 'Team 2'}
- The batting team is ${battingTeam} (Team ${battingTeamIndex + 1})
- The bowling team is ${bowlingTeam} (Team ${bowlingTeamIndex + 1})

Consider these factors for win probability:
1. Current run rate vs required run rate
2. Wickets in hand
3. Recent over performance
4. Match pressure situation
5. Momentum from recent balls
6. Which team is batting vs bowling

Return this exact JSON structure:
{
  "prediction_text": "Live analysis of current match situation...",
  "win_probability": {
    "team1": 55.5,
    "team2": 44.5
  },
  "confidence": "High/Medium/Low",
  "momentum": "Strong Positive/Positive/Neutral/Negative/Strong Negative",
  "key_factors": ["factor1", "factor2", "factor3"],
  "recent_run_rate": ${recentRunRate},
  "required_run_rate": ${requiredRunRate || 'null'},
  "batting_team": "${battingTeam}",
  "bowling_team": "${bowlingTeam}"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const prediction = parseAIResponse(response);
    
    // Add team information to the prediction
    prediction.batting_team = battingTeam;
    prediction.bowling_team = bowlingTeam;
    
    return prediction;
  } catch (parseError) {
    console.error('Live prediction error:', parseError);
    // Fallback response
    return {
      prediction_text: `Live analysis: ${battingTeam} is batting at ${currentInnings.runs}/${currentInnings.wickets} after ${currentInnings.overs}.${currentInnings.balls} overs. ${bowlingTeam} has taken an early wicket and will look to build pressure.`,
      win_probability: { team1: 50, team2: 50 },
      confidence: "Medium",
      momentum: "Neutral",
      key_factors: ["Current run rate", "Wickets remaining", "Recent momentum"],
      recent_run_rate: recentRunRate,
      required_run_rate: requiredRunRate,
      batting_team: battingTeam,
      bowling_team: bowlingTeam
    };
  }
}

// Update other prediction functions similarly
async function generateInMatchPrediction(match) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });

  const currentInnings = match.currentScore;
  const inningsScores = match.inningsScores || [];
  const commentary = match.commentary || [];

  // Get correct team names
  const { battingTeam, bowlingTeam, battingTeamIndex, bowlingTeamIndex } = getTeamNames(match);

  // Get recent momentum
  const recentBalls = commentary.slice(-12);
  const recentRuns = recentBalls.reduce((sum, ball) => sum + (ball.event.runs || 0), 0);
  const recentBallsCount = recentBalls.length;
  const recentRunRate = recentBallsCount > 0 ? (recentRuns / (recentBallsCount / 6)).toFixed(2) : 0;

  // CORRECTED Required Run Rate Calculation
  let requiredRunRate = null;
  if (inningsScores.length > 0 && currentInnings.innings === 2) {
    const target = inningsScores[0].runs + 1;
    const runsNeeded = target - currentInnings.runs;
    const ballsRemaining = (match.overs * 6) - (currentInnings.overs * 6 + currentInnings.balls);
    
    if (ballsRemaining > 0) {
      requiredRunRate = ((runsNeeded / ballsRemaining) * 6).toFixed(2);
    } else {
      requiredRunRate = '0.00';
    }
  }

  const prompt = `
You are a cricket analyst. Analyze the current match situation and provide prediction.

CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no additional text outside the JSON.

MATCH DATA:
- Title: ${match.title}
- Batting Team: ${battingTeam} (Team ${battingTeamIndex + 1})
- Bowling Team: ${bowlingTeam} (Team ${bowlingTeamIndex + 1})
- Current Innings: ${currentInnings.innings}
- Current Score: ${currentInnings.runs}/${currentInnings.wickets}
- Overs: ${currentInnings.overs}.${currentInnings.balls}
- Current Run Rate: ${(currentInnings.runs / (currentInnings.overs + currentInnings.balls/6)).toFixed(2)}
${inningsScores.length > 0 ? `- First Innings: ${inningsScores[0].runs}/${inningsScores[0].wickets} by ${inningsScores[0].team === 0 ? match.teams[0]?.name : match.teams[1]?.name}` : ''}
${inningsScores.length > 0 && currentInnings.innings === 2 ? 
  `- Target: ${inningsScores[0].runs + 1}
   - Runs Needed: ${Math.max(0, inningsScores[0].runs + 1 - currentInnings.runs)}
   - Required Run Rate: ${requiredRunRate}` : ''}
- Recent Performance: ${recentRuns} runs in last ${recentBallsCount} balls (RR: ${recentRunRate})

TEAM IDENTIFICATION:
- Team 1: ${match.teams[0]?.name || 'Team 1'}
- Team 2: ${match.teams[1]?.name || 'Team 2'}
- Currently Batting: ${battingTeam}
- Currently Bowling: ${bowlingTeam}

Return this exact JSON structure:
{
  "prediction_text": "Analysis of current match situation and likely outcome...",
  "win_probability": {
    "team1": 55.5,
    "team2": 44.5
  },
  "confidence": "High/Medium/Low",
  "momentum": "Strong Positive/Positive/Neutral/Negative/Strong Negative",
  "key_factors": ["factor1", "factor2", "factor3"],
  "recent_run_rate": ${recentRunRate},
  "required_run_rate": ${requiredRunRate || 'null'},
  "batting_team": "${battingTeam}",
  "bowling_team": "${bowlingTeam}"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const prediction = parseAIResponse(response);
    
    // Add team information to the prediction
    prediction.batting_team = battingTeam;
    prediction.bowling_team = bowlingTeam;
    
    return prediction;
  } catch (parseError) {
    console.error('In-match prediction error:', parseError);
    // Fallback response
    return {
      prediction_text: `Current match analysis: ${battingTeam} is batting at ${currentInnings.runs}/${currentInnings.wickets}. ${bowlingTeam} is bowling and will look to take more wickets.`,
      win_probability: { team1: 50, team2: 50 },
      confidence: "Medium",
      momentum: "Neutral",
      key_factors: ["Current run rate", "Wickets in hand", "Required rate"],
      recent_run_rate: recentRunRate,
      required_run_rate: requiredRunRate,
      batting_team: battingTeam,
      bowling_team: bowlingTeam
    };
  }
}
////////////////////////////////

// Helper function to clean and parse AI response
function parseAIResponse(response) {
  try {
    console.log('Raw AI response:', response);
    
    // Remove markdown code blocks and any extra text
    let cleaned = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^JSON:\s*/i, '')
      .trim();
    
    // Try to extract JSON if it's wrapped in other text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }
    
    console.log('Cleaned response:', cleaned);
    const parsed = JSON.parse(cleaned);
    
    // Ensure win_probability has proper structure
    if (parsed.win_probability && typeof parsed.win_probability === 'object') {
      if (!parsed.win_probability.team1) parsed.win_probability.team1 = 50;
      if (!parsed.win_probability.team2) parsed.win_probability.team2 = 50;
    } else {
      parsed.win_probability = { team1: 50, team2: 50 };
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid JSON response from AI');
  }
}

// Match prediction endpoint
router.post('/predict-match', async (req, res) => {
  try {
    const { matchId, predictionType = 'pre_match' } = req.body;

    const match = await CustomMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    const prediction = await generateMatchPrediction(match, predictionType);
    
    // Save prediction to match
    match.predictions.push({
      type: 'match',
      prediction: prediction.prediction_text,
      confidence: prediction.confidence,
      winProbability: prediction.win_probability,
      timestamp: new Date()
    });

    await match.save();

    res.json({
      success: true,
      prediction: prediction.prediction_text,
      win_probability: prediction.win_probability,
      confidence: prediction.confidence,
      key_factors: prediction.key_factors,
      match_situation: prediction.match_situation,
      predicted_winner: prediction.predicted_winner,
      score_prediction: prediction.score_prediction
    });

  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ msg: "Prediction failed", error: err.message });
  }
});

// In-match prediction based on current situation
router.post('/predict-in-match', async (req, res) => {
  try {
    const { matchId } = req.body;

    const match = await CustomMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    const prediction = await generateInMatchPrediction(match);
    
    // Update AI insights
    match.aiInsights.winProbability = prediction.win_probability;
    match.aiInsights.winProbability.lastUpdated = new Date();

    await match.save();

    res.json({
      success: true,
      prediction: prediction.prediction_text,
      win_probability: prediction.win_probability,
      confidence: prediction.confidence,
      momentum: prediction.momentum,
      key_factors: prediction.key_factors,
      recent_run_rate: prediction.recent_run_rate,
      required_run_rate: prediction.required_run_rate
    });

  } catch (err) {
    console.error("In-match prediction error:", err);
    res.status(500).json({ msg: "Prediction failed", error: err.message });
  }
});

// Live prediction on each ball
router.post('/predict-live', async (req, res) => {
  try {
    const { matchId } = req.body;

    const match = await CustomMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ msg: "Match not found" });
    }

    const prediction = await generateLivePrediction(match);
    
    // Save to match predictions
    match.predictions.push({
      type: 'momentum',
      prediction: prediction.prediction_text,
      confidence: prediction.confidence,
      winProbability: prediction.win_probability,
      timestamp: new Date()
    });

    // Update AI insights with live data
    match.aiInsights.winProbability = prediction.win_probability;
    match.aiInsights.winProbability.lastUpdated = new Date();
    
    // Update momentum
    match.aiInsights.momentum = {
      status: prediction.momentum,
      recentRunRate: prediction.recent_run_rate,
      requiredRunRate: prediction.required_run_rate,
      lastUpdated: new Date()
    };

    await match.save();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`match_${matchId}`).emit('live_prediction_update', {
        matchId: matchId,
        prediction: prediction.prediction_text,
        win_probability: prediction.win_probability,
        confidence: prediction.confidence,
        momentum: prediction.momentum,
        key_factors: prediction.key_factors,
        recent_run_rate: prediction.recent_run_rate,
        required_run_rate: prediction.required_run_rate
      });
    }

    res.json({
      success: true,
      prediction: prediction.prediction_text,
      win_probability: prediction.win_probability,
      confidence: prediction.confidence,
      momentum: prediction.momentum,
      key_factors: prediction.key_factors,
      recent_run_rate: prediction.recent_run_rate,
      required_run_rate: prediction.required_run_rate
    });

  } catch (err) {
    console.error("Live prediction error:", err);
    res.status(500).json({ msg: "Live prediction failed", error: err.message });
  }
});


async function generateLivePrediction(match) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });

  const currentInnings = match.currentScore;
  const inningsScores = match.inningsScores || [];
  const commentary = match.commentary || [];
  
  // ✅ ADD THIS: Get correct team names using helper function
  const { battingTeam, bowlingTeam, battingTeamIndex, bowlingTeamIndex } = getTeamNames(match);
  
  // Get recent balls for momentum
  const recentBalls = commentary.slice(-12);
  const recentRuns = recentBalls.reduce((sum, ball) => sum + (ball.event.runs || 0), 0);
  const recentBallsCount = recentBalls.length;
  const recentRunRate = recentBallsCount > 0 ? (recentRuns / (recentBallsCount / 6)).toFixed(2) : 0;

  // === CRITICAL: Ball-by-Ball RRR Calculation ===
  let requiredRunRate = null;
  let target = null;
  let runsNeeded = null;
  let ballsRemaining = null;
  
  if (inningsScores.length > 0 && currentInnings.innings === 2) {
    target = inningsScores[0].runs + 1;
    runsNeeded = target - currentInnings.runs;
    
    // Calculate balls remaining (updates every ball!)
    const ballsCompleted = (currentInnings.overs * 6) + currentInnings.balls;
    ballsRemaining = (match.overs * 6) - ballsCompleted;
    
    if (ballsRemaining > 0 && runsNeeded > 0) {
      // Convert to overs and calculate RRR
      const oversRemaining = ballsRemaining / 6;
      requiredRunRate = (runsNeeded / oversRemaining).toFixed(2);
    } else {
      requiredRunRate = '0.00';
    }
  }

  const prompt = `
You are a cricket analyst. Analyze the current LIVE match situation.

CRITICAL: Return ONLY valid JSON.

MATCH DATA:
- Title: ${match.title}
- Batting Team: ${battingTeam} (Team ${battingTeamIndex + 1})
- Bowling Team: ${bowlingTeam} (Team ${bowlingTeamIndex + 1})
- Current Innings: ${currentInnings.innings}
- Current Score: ${currentInnings.runs}/${currentInnings.wickets}
- Overs: ${currentInnings.overs}.${currentInnings.balls}
- Current Run Rate: ${(currentInnings.runs / ((currentInnings.overs * 6 + currentInnings.balls) / 6)).toFixed(2)}
${inningsScores.length > 0 ? `- First Innings: ${inningsScores[0].runs}/${inningsScores[0].wickets} by ${inningsScores[0].team === 0 ? match.teams[0]?.name : match.teams[1]?.name}` : ''}
${inningsScores.length > 0 && currentInnings.innings === 2 ? 
  `- Target: ${target}
   - Runs Needed: ${runsNeeded}
   - Balls Remaining: ${ballsRemaining}
   - Required Run Rate: ${requiredRunRate} (updates every ball!)` : ''}
- Recent Momentum: ${recentRuns} runs in last ${recentBallsCount} balls

TEAM IDENTIFICATION:
- Team 1 (Index 0): ${match.teams[0]?.name || 'Team 1'}
- Team 2 (Index 1): ${match.teams[1]?.name || 'Team 2'}
- Currently Batting: ${battingTeam} (Team ${battingTeamIndex + 1})
- Currently Bowling: ${bowlingTeam} (Team ${bowlingTeamIndex + 1})

IMPORTANT: When calculating win probability:
- "team1" in win_probability refers to ${match.teams[0]?.name || 'Team 1'} 
- "team2" in win_probability refers to ${match.teams[1]?.name || 'Team 2'}
- The batting team is ${battingTeam} (Team ${battingTeamIndex + 1})
- The bowling team is ${bowlingTeam} (Team ${bowlingTeamIndex + 1})

Return JSON:
{
  "prediction_text": "Live analysis...",
  "win_probability": {"team1": 55.5, "team2": 44.5},
  "confidence": "High/Medium/Low",
  "momentum": "Positive/Neutral/Negative",
  "key_factors": ["factor1", "factor2"],
  "recent_run_rate": ${recentRunRate},
  "required_run_rate": ${requiredRunRate || 'null'},
  "batting_team": "${battingTeam}",
  "bowling_team": "${bowlingTeam}"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const prediction = parseAIResponse(response);
    
    // ✅ ADD THIS: Add team information to the prediction
    prediction.batting_team = battingTeam;
    prediction.bowling_team = bowlingTeam;
    
    return prediction;
  } catch (error) {
    console.error('Live prediction error:', error);
    return {
      prediction_text: `Live analysis: ${battingTeam} is batting at ${currentInnings.runs}/${currentInnings.wickets} after ${currentInnings.overs}.${currentInnings.balls} overs.`,
      win_probability: { team1: 50, team2: 50 },
      confidence: "Medium",
      momentum: "Neutral",
      key_factors: ["Current run rate", "Wickets remaining"],
      recent_run_rate: recentRunRate,
      required_run_rate: requiredRunRate,
      batting_team: battingTeam,
      bowling_team: bowlingTeam
    };
  }
}


// Generate in-match prediction based on current situation
async function generateInMatchPrediction(match) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });

  const currentInnings = match.currentScore;
  const inningsScores = match.inningsScores || [];
  const commentary = match.commentary || [];

  // Get recent momentum
  const recentBalls = commentary.slice(-12);
  const recentRuns = recentBalls.reduce((sum, ball) => sum + (ball.event.runs || 0), 0);
  const recentBallsCount = recentBalls.length;
  const recentRunRate = recentBallsCount > 0 ? (recentRuns / (recentBallsCount / 6)).toFixed(2) : 0;

  // CORRECTED Required Run Rate Calculation
  let requiredRunRate = null;
  if (inningsScores.length > 0 && currentInnings.innings === 2) {
    const target = inningsScores[0].runs + 1;
    const runsNeeded = target - currentInnings.runs;
    const ballsRemaining = (match.overs * 6) - (currentInnings.overs * 6 + currentInnings.balls);
    
    if (ballsRemaining > 0) {
      requiredRunRate = ((runsNeeded / ballsRemaining) * 6).toFixed(2);
    } else {
      requiredRunRate = '0.00';
    }
  }

  const prompt = `
You are a cricket analyst. Analyze the current match situation and provide prediction.

CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no additional text outside the JSON.

MATCH DATA:
- Title: ${match.title}
- Teams: ${match.teams[0]?.name || 'Team 1'} vs ${match.teams[1]?.name || 'Team 2'}
- Current Innings: ${currentInnings.innings}
- Current Score: ${currentInnings.runs}/${currentInnings.wickets}
- Overs: ${currentInnings.overs}.${currentInnings.balls}
- Current Run Rate: ${(currentInnings.runs / (currentInnings.overs + currentInnings.balls/6)).toFixed(2)}
${inningsScores.length > 0 ? `- First Innings: ${inningsScores[0].runs}/${inningsScores[0].wickets}` : ''}
${inningsScores.length > 0 && currentInnings.innings === 2 ? 
  `- Target: ${inningsScores[0].runs + 1}
   - Runs Needed: ${Math.max(0, inningsScores[0].runs + 1 - currentInnings.runs)}
   - Required Run Rate: ${requiredRunRate}` : ''}
- Recent Performance: ${recentRuns} runs in last ${recentBallsCount} balls (RR: ${recentRunRate})

Consider these factors:
1. Current match situation and required rate
2. Wickets in hand and batting depth
3. Recent momentum and partnership status
4. Pressure situation and match context

Return this exact JSON structure:
{
  "prediction_text": "Analysis of current match situation and likely outcome...",
  "win_probability": {
    "team1": 55.5,
    "team2": 44.5
  },
  "confidence": "High/Medium/Low",
  "momentum": "Strong Positive/Positive/Neutral/Negative/Strong Negative",
  "key_factors": ["factor1", "factor2", "factor3"],
  "recent_run_rate": ${recentRunRate},
  "required_run_rate": ${requiredRunRate || 'null'}
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return parseAIResponse(response);
  } catch (parseError) {
    console.error('In-match prediction error:', parseError);
    // Fallback response
    return {
      prediction_text: "Current match analysis suggests a closely contested game with the outcome depending on current partnerships and run rate management.",
      win_probability: { team1: 50, team2: 50 },
      confidence: "Medium",
      momentum: "Neutral",
      key_factors: ["Current run rate", "Wickets in hand", "Required rate"],
      recent_run_rate: recentRunRate,
      required_run_rate: requiredRunRate
    };
  }
}

// Also update the helper function to handle the corrected calculation
// function calculateRequiredRunRate(match) {
//   if (match.inningsScores.length > 0 && match.currentScore.innings === 2) {
//     const target = match.inningsScores[0].runs + 1;
//     const runsNeeded = target - match.currentScore.runs;
//     const ballsRemaining = (match.overs * 6) - (match.currentScore.overs * 6 + match.currentScore.balls);
    
//     if (ballsRemaining > 0 && runsNeeded > 0) {
//       return parseFloat(((runsNeeded / ballsRemaining) * 6).toFixed(2));
//     }
//   }
//   return null;
// }

function calculateRequiredRunRate(match) {
  const currentInnings = match.currentScore;
  const inningsScores = match.inningsScores || [];
  
  // Only calculate RRR in 2nd innings
  if (inningsScores.length > 0 && currentInnings.innings === 2) {
    const target = inningsScores[0].runs + 1;
    const runsNeeded = target - currentInnings.runs;
    
    // Calculate exact overs remaining (as decimal)
    const ballsCompleted = (currentInnings.overs * 6) + currentInnings.balls;
    const totalBalls = match.overs * 6;
    const ballsRemaining = totalBalls - ballsCompleted;
    const oversRemaining = ballsRemaining / 6;
    
    console.log(`=== Ball-by-Ball RRR Debug ===`);
    console.log(`Over: ${currentInnings.overs}.${currentInnings.balls}`);
    console.log(`Balls completed: ${ballsCompleted} | Balls remaining: ${ballsRemaining}`);
    console.log(`Overs remaining: ${oversRemaining.toFixed(3)}`);
    console.log(`Runs needed: ${runsNeeded}`);
    
    if (ballsRemaining > 0 && runsNeeded > 0) {
      const rrr = runsNeeded / oversRemaining;
      console.log(`RRR: ${rrr.toFixed(2)}`);
      return parseFloat(rrr.toFixed(2));
    } else if (ballsRemaining <= 0) {
      console.log(`Match over - no balls remaining`);
      return 0;
    } else {
      console.log(`Target achieved or passed`);
      return 0;
    }
  }
  return null;
}

////////

// Generate pre-match prediction
async function generateMatchPrediction(match, predictionType) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });

  const prompt = `
You are a cricket analyst. Provide a pre-match prediction.

CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no additional text outside the JSON.

MATCH DATA:
- Title: ${match.title}
- Teams: ${match.teams[0]?.name || 'Team 1'} vs ${match.teams[1]?.name || 'Team 2'}
- Format: ${match.overs} overs
- Prediction Type: ${predictionType}
- Team 1 Players: ${match.teams[0]?.players?.length || 0}
- Team 2 Players: ${match.teams[1]?.players?.length || 0}

Consider these factors:
1. Team composition and balance
2. Match format implications
3. Player roles and potential impact
4. Historical context (if any)

Return this exact JSON structure:
{
  "prediction_text": "Detailed pre-match analysis based on team composition and format...",
  "win_probability": {
    "team1": 55.5,
    "team2": 44.5
  },
  "confidence": "High/Medium/Low",
  "key_factors": ["factor1", "factor2", "factor3"],
  "predicted_winner": "Team Name",
  "score_prediction": "XXX-XXX",
  "match_situation": "Analysis of match conditions and expectations"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return parseAIResponse(response);
  } catch (parseError) {
    console.error('Pre-match prediction error:', parseError);
    // Fallback response
    return {
      prediction_text: "Based on team composition and match format, this appears to be a competitive encounter where both teams have opportunities.",
      win_probability: { team1: 50, team2: 50 },
      confidence: "Medium",
      key_factors: ["Team composition", "Match format", "Player roles"],
      predicted_winner: "Too close to call",
      score_prediction: "Competitive total expected",
      match_situation: "Evenly matched contest with potential for exciting cricket"
    };
  }
}

// Generate in-match prediction based on current situation
async function generateInMatchPrediction(match) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  });

  const currentInnings = match.currentScore;
  const inningsScores = match.inningsScores || [];
  const commentary = match.commentary || [];

  // Get recent momentum
  const recentBalls = commentary.slice(-12);
  const recentRuns = recentBalls.reduce((sum, ball) => sum + (ball.event.runs || 0), 0);
  const recentBallsCount = recentBalls.length;
  const recentRunRate = recentBallsCount > 0 ? (recentRuns / (recentBallsCount / 6)).toFixed(2) : 0;

  const prompt = `
You are a cricket analyst. Analyze the current match situation and provide prediction.

CRITICAL: You MUST return ONLY valid JSON. No markdown, no code blocks, no additional text outside the JSON.

MATCH DATA:
- Title: ${match.title}
- Teams: ${match.teams[0]?.name || 'Team 1'} vs ${match.teams[1]?.name || 'Team 2'}
- Current Innings: ${currentInnings.innings}
- Current Score: ${currentInnings.runs}/${currentInnings.wickets}
- Overs: ${currentInnings.overs}.${currentInnings.balls}
- Current Run Rate: ${(currentInnings.runs / (currentInnings.overs + currentInnings.balls/6)).toFixed(2)}
${inningsScores.length > 0 ? `- First Innings: ${inningsScores[0].runs}/${inningsScores[0].wickets}` : ''}
${inningsScores.length > 0 && currentInnings.innings === 2 ? 
  `- Target: ${inningsScores[0].runs + 1}
   - Required Run Rate: ${(((inningsScores[0].runs + 1 - currentInnings.runs) / (match.overs - (currentInnings.overs + currentInnings.balls/6))) * 6).toFixed(2)}` : ''}
- Recent Performance: ${recentRuns} runs in last ${recentBallsCount} balls (RR: ${recentRunRate})

Consider these factors:
1. Current match situation and required rate
2. Wickets in hand and batting depth
3. Recent momentum and partnership status
4. Pressure situation and match context

Return this exact JSON structure:
{
  "prediction_text": "Analysis of current match situation and likely outcome...",
  "win_probability": {
    "team1": 55.5,
    "team2": 44.5
  },
  "confidence": "High/Medium/Low",
  "momentum": "Strong Positive/Positive/Neutral/Negative/Strong Negative",
  "key_factors": ["factor1", "factor2", "factor3"],
  "recent_run_rate": ${recentRunRate},
  "required_run_rate": ${inningsScores.length > 0 && currentInnings.innings === 2 ? 
    (((inningsScores[0].runs + 1 - currentInnings.runs) / (match.overs - (currentInnings.overs + currentInnings.balls/6))) * 6).toFixed(2) : 'null'}
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    return parseAIResponse(response);
  } catch (parseError) {
    console.error('In-match prediction error:', parseError);
    // Fallback response
    return {
      prediction_text: "Current match analysis suggests a closely contested game with the outcome depending on current partnerships and run rate management.",
      win_probability: { team1: 50, team2: 50 },
      confidence: "Medium",
      momentum: "Neutral",
      key_factors: ["Current run rate", "Wickets in hand", "Required rate"],
      recent_run_rate: recentRunRate,
      required_run_rate: inningsScores.length > 0 && currentInnings.innings === 2 ? 
        (((inningsScores[0].runs + 1 - currentInnings.runs) / (match.overs - (currentInnings.overs + currentInnings.balls/6))) * 6).toFixed(2) : null
    };
  }
}

module.exports = router;