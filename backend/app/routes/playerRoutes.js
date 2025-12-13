


const express = require("express");
const router = express.Router();
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const Player = require('../models/player-model');
const Match = require('../models/match-model');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authenticateUser = require('../middlewares/authenticateUser');
const jwt = require('jsonwebtoken');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


router.post("/", authenticateUser, upload.single('image'), async (req, res) => {
  try {
      
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    const playerData = {
      ...req.body,

      createdBy: req.user._id,
      image: imageUrl,
    };
    console.log("Received player data:", playerData); // Debug
    const player = new Player(playerData);
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    console.error("Error creating player:", err.message);
    res.status(400).json({ error: err.message });
  }
});

const generateToken = (userId) => {
  return jwt.sign(
    { 
      userId: userId,
      role: 'player'
    }, 
    process.env.JWT_SECRET || 'fallback-secret-key-for-development',
    { expiresIn: '7d' }
  );
};


//   try {
//     const { email, dob } = req.body;
//     // const player = await Player.findOne({ email, dob });
//     const player = await Player.findOne({      email: email.toLowerCase().trim(),
//       dob: dob  });
//     if (!player) {
//       return res.status(401).json({ error: "Invalid email or date of birth" });
//     }
//     // Generate a token (implementation not shown)
//     const token = generateToken(player._id);
//     // res.json({ token });
//     return res.status(200).json({ message: "Login successful", player, token });
//   } catch (err) {
//     console.error("Error logging in:", err.message);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// Add this route to update player with email and DOB

// Updated Player Login Route - FIXED for Date comparison
router.post('/login', async (req, res) => {
  try {
    const { email, dob } = req.body;
    
    console.log("🔐 Player login attempt:", { email, dob });
    
    if (!email || !dob) {
      return res.status(400).json({ error: "Email and date of birth are required" });
    }

    const cleanEmail = email.toLowerCase().trim();
    

    const player = await Player.findOne({ email: cleanEmail });

    console.log(" Player found:", player ? `Yes - ${player.name}` : "No");

    if (!player) {
      return res.status(401).json({ error: "Invalid email or date of birth" });
    }


    const providedDOB = new Date(dob).toISOString().split('T')[0]; 
    const storedDOB = player.dob.toISOString().split('T')[0]; 
    
    console.log(" Date comparison:", {
      providedDOB,
      storedDOB,
      match: providedDOB === storedDOB
    });

    if (providedDOB !== storedDOB) {
      return res.status(401).json({ error: "Invalid email or date of birth" });
    }

    const token = generateToken(player._id);

    console.log(" Login successful for:", player.name);
    
    res.status(200).json({ 
      message: "Login successful", 
      token,
      player: {
        _id: player._id,
        name: player.name,
        email: player.email,
        role: 'player'
      }
    });
    
  } catch (err) {
    console.error(" Error logging in:", err.message);
    res.status(500).json({ error: "Server error during login" });
  }
});

router.patch('/:id/add-login-info', async (req, res) => {
  try {
    const { email, dob } = req.body;
    
    if (!email || !dob) {
      return res.status(400).json({ error: "Email and DOB are required" });
    }

    const player = await Player.findByIdAndUpdate(
      req.params.id,
      { 
        email: email.toLowerCase().trim(),
        dob: dob
      },
      { new: true, runValidators: true }
    );

    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    res.json({ message: "Login info added successfully", player });
  } catch (err) {
    console.error("Error adding login info:", err);
    res.status(400).json({ error: err.message });
  }
});



router.post("/bulk", authenticateUser, async (req, res) => {
  try {
    const { ids } = req.body;
    const players = await Player.find({ _id: { $in: ids } });
    res.json({ players });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

router.put("/:id", authenticateUser,upload.single('image'), async (req, res) => {
  try {
    const playerData = {
      ...req.body,
      createdBy: req.user._id, 
      image: req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : undefined,
    };
    console.log("Updating player with data:", playerData); // Debug
    const player = await Player.findByIdAndUpdate(req.params.id, playerData, {
      new: true,
      runValidators: true,
    });
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json(player);
  } catch (err) {
    console.error("Error updating player:", err.message);
    res.status(400).json({ error: err.message });
  }
});



router.get("/", authenticateUser, async (req, res) => {
  try {
    const { createdBy } = req.query;
    const query = createdBy ? { createdBy } : {};
    console.log("Fetching players with query:", query);
    const players = await Player.find(query).lean();
    console.log("Sending players:", players);
    res.json({ players });  
  } catch (err) {
    console.error("Error fetching players:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});






router.get("/unassigned", authenticateUser, async (req, res) => {
  try {
    const unassignedPlayers = await Player.find({ teamId: null });
    res.status(200).json(unassignedPlayers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:playerId/match-performance', async (req, res) => {
  try {
    const { playerId } = req.params;
    

    const matchPerformances = await Match.find({
      $or: [
        { 'players.playerId': playerId },
        { 'commentary.batsman.id': playerId },
        { 'commentary.bowler.id': playerId }
      ]
    })
    .populate('teams')
    .sort({ date: -1 })
    .limit(20);


    const performances = matchPerformances.map(match => {

      const playerPerformance = {
        matchId: match._id,
        matchTitle: match.title,
        matchDate: match.date,
        opponent: match.teams.find(team => 
          !team.players.some(p => p.playerId?.toString() === playerId)
        )?.name || 'Opponent',
        result: match.result,
      
      };
      
      return playerPerformance;
    });

    res.json(performances);
  } catch (error) {
    console.error('Error fetching match performances:', error);
    res.status(500).json({ error: 'Failed to fetch match performances' });
  }
});



router.get("/all", authenticateUser, async (req, res) => {
  try {
    const { teamId } = req.query;

    let query = {};
    if (teamId) {
      query.teamId = teamId; 
    }

    const players = await Player.find(query).populate("teamId", "name");
    res.status(200).json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get("/me/:id",authenticateUser,async(req,res)=>{
  try{
    const player = await Player.findById(req.params.id);
    if(!player){
      return res.status(404).json({error:"Player not found"});
    }
    return res.status(200).json(player);
  }catch(err){
    console.log("Error fetching player data:",err);
    res.status(500).json({ error: err.message });
  }
})


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



router.get("/select-team", authenticateUser, async (req, res) => {
  try {

    const players = await Player.find({ createdBy: req.user._id }).lean();
    if (players.length < 11) {
      return res.status(400).json({ error: "Not enough players to form a team (need at least 11)" });
    }


    const playerData = players.map(p => ({
      name: p.name,
      role: p.role,
      runs: p.runs || 0,
      wickets: p.wickets || 0,
      average: p.average || 0,
      matches: p.matches || 0,
    }));


    const prompt = `
Select the best possible cricket playing 11 from the following players.
Requirements:
- 4-5 batsmen (role: batsman or allrounder)
- 4-5 bowlers (role: bowler or allrounder)
- 1 wicket-keeper (role: keeper)
- 1-2 all-rounders (role: allrounder)
Prioritize players with high runs and batting average for batsmen, high wickets for bowlers, and balance for all-rounders.

Return ONLY a valid JSON object with a "bestTeam" array, no explanation, no markdown, and NO code fences.
Example:
{
  "bestTeam": [
    { "name": "Player 1", "role": "batsman", "reason": "High average" },
    { "name": "Player 2", "role": "bowler", "reason": "Most wickets" }
    // ...total 11 players
  ]
}

Player data: ${JSON.stringify(playerData, null, 2)}
`;

    // Call Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Remove markdown code fences if present
    responseText = responseText.replace(/```json|```/g, '').trim();

    let bestTeam;
    try {
      const parsed = JSON.parse(responseText);
      bestTeam = parsed.bestTeam || parsed;
    } catch (err) {
      console.error("Gemini response parse error:", err, responseText);
      return res.status(500).json({ error: "Gemini response parse error" });
    }

    res.json({ bestTeam });
  } catch (err) {
    console.error("Error selecting team:", err.message);
    res.status(500).json({ error: "Failed to select team" });
  }
});



// router.get("/select-team", authenticateUser, async (req, res) => {
//   try {
//     console.log("🏏 Starting team selection process...");
//     console.log("👤 User ID:", req.user._id);

//     // Step 1: Fetch players
//     const players = await Player.find({ createdBy: req.user._id }).lean();
//     console.log(`📊 Found ${players.length} players in database`);

//     if (players.length < 11) {
//       console.log("❌ Not enough players for a team");
//       return res.status(400).json({ 
//         error: `Not enough players to form a team. You have ${players.length} players, need at least 11.`,
//         playerCount: players.length,
//         requiredCount: 11
//       });
//     }

//     // Step 2: Check Gemini API key
//     if (!process.env.GEMINI_API_KEY) {
//       console.error("❌ GEMINI_API_KEY not found in environment variables");
//       return res.status(500).json({ error: "Gemini API key not configured" });
//     }

//     // Step 3: Prepare player data
//     const playerData = players.map(p => ({
//       name: p.name,
//       role: p.role,
//       runs: p.runs || 0,
//       wickets: p.wickets || 0,
//       average: p.average || 0,
//       matches: p.matches || 0,
//     }));

//     console.log("📋 Player roles distribution:");
//     const roleCount = playerData.reduce((acc, p) => {
//       acc[p.role] = (acc[p.role] || 0) + 1;
//       return acc;
//     }, {});
//     console.log(roleCount);

//     // Step 4: Enhanced prompt for better results
//     const prompt = `
// You are a cricket team selector. Select exactly 11 players from the following list to form the best possible playing XI.

// STRICT REQUIREMENTS:
// 1. Exactly 11 players total
// 2. At least 1 wicket-keeper (role: keeper)
// 3. 4-6 batsmen (role: batsman or allrounder)
// 4. 4-6 bowlers (role: bowler or allrounder)
// 5. Consider player statistics: runs, wickets, average, matches played

// IMPORTANT: Return ONLY valid JSON in this exact format:
// {
//   "bestTeam": [
//     {"name": "Player Name", "role": "batsman", "reason": "Good average"},
//     {"name": "Player Name", "role": "bowler", "reason": "High wickets"}
//   ]
// }

// Available Players:
// ${JSON.stringify(playerData, null, 2)}

// Select exactly 11 players and return only the JSON response, no explanations or markdown.`;

//     console.log("🤖 Calling Gemini AI...");

//     // Step 5: Call Gemini with timeout
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
//     const result = await Promise.race([
//       model.generateContent(prompt),
//       new Promise((_, reject) => 
//         setTimeout(() => reject(new Error('Gemini API timeout')), 15000)
//       )
//     ]);

//     const response = await result.response;
//     let responseText = response.text().trim();
    
//     console.log("🤖 Raw Gemini response:", responseText.substring(0, 200) + "...");

//     // Step 6: Clean and parse response
//     responseText = responseText.replace(/```json|```/g, '').trim();
    
//     // Remove any leading/trailing text that's not JSON
//     const jsonStart = responseText.indexOf('{');
//     const jsonEnd = responseText.lastIndexOf('}') + 1;
    
//     if (jsonStart !== -1 && jsonEnd !== -1) {
//       responseText = responseText.substring(jsonStart, jsonEnd);
//     }

//     let bestTeam;
//     try {
//       const parsed = JSON.parse(responseText);
//       bestTeam = parsed.bestTeam || parsed;
      
//       if (!Array.isArray(bestTeam)) {
//         throw new Error("Response is not an array");
//       }
      
//       if (bestTeam.length !== 11) {
//         console.warn(`⚠️ Gemini returned ${bestTeam.length} players instead of 11`);
//         // If we got close but not exactly 11, we can still return it
//         if (bestTeam.length >= 9 && bestTeam.length <= 13) {
//           console.log("📝 Adjusting team size...");
//           bestTeam = bestTeam.slice(0, 11); // Take first 11
//         } else {
//           throw new Error(`Invalid team size: ${bestTeam.length}`);
//         }
//       }

//       console.log("✅ Successfully parsed Gemini response");
//       console.log(`🏏 Selected team of ${bestTeam.length} players`);

//     } catch (parseError) {
//       console.error("❌ Failed to parse Gemini response:", parseError.message);
//       console.error("📄 Raw response:", responseText);
      
//       // Fallback: Create a simple team selection
//       console.log("🔄 Using fallback team selection...");
//       bestTeam = createFallbackTeam(players);
//     }

//     res.json({ 
//       bestTeam,
//       totalPlayersAvailable: players.length,
//       selectedCount: bestTeam.length
//     });

//   } catch (err) {
//     console.error("❌ Error in team selection:", err.message);
//     console.error("Stack:", err.stack);
    
//     if (err.message.includes('timeout')) {
//       return res.status(408).json({ 
//         error: "AI service timeout. Please try again.",
//         details: "The AI took too long to respond"
//       });
//     }
    
//     if (err.message.includes('API key')) {
//       return res.status(500).json({ 
//         error: "AI service configuration error",
//         details: "Please check server configuration"
//       });
//     }
    
//     res.status(500).json({ 
//       error: "Failed to select team", 
//       details: err.message,
//       suggestion: "Please try again or contact support"
//     });
//   }
// });

// Fallback team selection function
function createFallbackTeam(players) {
  console.log("🔄 Creating fallback team selection...");
  
  const team = [];
  
  // Group players by role
  const keepers = players.filter(p => p.role === 'keeper');
  const batsmen = players.filter(p => p.role === 'batsman');
  const bowlers = players.filter(p => p.role === 'bowler');
  const allrounders = players.filter(p => p.role === 'allrounder');
  
  // Select 1 keeper
  if (keepers.length > 0) {
    team.push({
      name: keepers[0].name,
      role: keepers[0].role,
      reason: "Wicket-keeper"
    });
  }
  
  // Select 4-5 batsmen
  const topBatsmen = batsmen
    .sort((a, b) => (b.runs || 0) - (a.runs || 0))
    .slice(0, Math.min(4, batsmen.length));
  
  topBatsmen.forEach(p => {
    team.push({
      name: p.name,
      role: p.role,
      reason: `${p.runs || 0} runs`
    });
  });
  
  // Select bowlers
  const topBowlers = bowlers
    .sort((a, b) => (b.wickets || 0) - (a.wickets || 0))
    .slice(0, Math.min(4, bowlers.length));
  
  topBowlers.forEach(p => {
    team.push({
      name: p.name,
      role: p.role,
      reason: `${p.wickets || 0} wickets`
    });
  });
  

  const remaining = 11 - team.length;
  const availableAllrounders = allrounders.slice(0, remaining);
  
  availableAllrounders.forEach(p => {
    team.push({
      name: p.name,
      role: p.role,
      reason: "All-rounder balance"
    });
  });
  

  if (team.length < 11) {
    const usedNames = new Set(team.map(p => p.name));
    const remainingPlayers = players.filter(p => !usedNames.has(p.name));
    
    remainingPlayers.slice(0, 11 - team.length).forEach(p => {
      team.push({
        name: p.name,
        role: p.role,
        reason: "Squad balance"
      });
    });
  }
  
  console.log(`Fallback team created with ${team.length} players`);
  return team.slice(0, 11); // Ensure exactly 11 players
}

router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    res.json({ message: "Player deleted" });
  } catch (err) {
    console.error("Error deleting player:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;