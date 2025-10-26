const Team = require('../models/team-model');
const teamValidationSchema = require('../validations/team-validation');
const Player = require('../models/player-model');
const mongoose = require("mongoose");
const teamCtlr = {};


teamCtlr.createTeam = async (req, res) => {
  const payload = {
    ...req.body,
    createdBy: req.user._id,
  };

  const { error, value } = teamValidationSchema.validate(payload);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  if (value.players && value.players.length > 20) {
    return res.status(400).json({ error: "Maximum 20 players allowed per team." });
  }

  try {

const newTeam = new Team({
  name: value.name,
  coach: value.coach,
  players: value.players.map((id) => new mongoose.Types.ObjectId(id)),
  createdBy: req.user._id,
});


    await newTeam.save();


    await Player.updateMany(
      { _id: { $in: value.players } },
      { $set: { teamId: newTeam._id } }
    );

    res.status(201).json(newTeam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


teamCtlr.getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate({
        path: 'players',
        select: 'name role image', 
      })
      .lean(); 

    res.status(200).json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

teamCtlr.getTeamsById = async (req,res) =>{
  try{
    const id = req.params.id;
    const team = await Team.findById(id);
    return res.status(200).json(team)
  }catch(err){
    return res.status(500).json(err);
  }
}

teamCtlr.deleteTeam = async (req,res) =>{
  const id = req.params.id;
  try{
    await Team.findByIdAndDelete(id);
    res.status(204).send();
  }catch(err){
    console.log(err);
    res.status(500).json({error:err.message});
  }
}
teamCtlr.patchTeam = async (req, res) => {
  const { id } = req.params;
  const { name, coach, players } = req.body;

    try {
      const { teamId, playerId } = req.params;

      const updatedTeam = await Team.findByIdAndUpdate(
        teamId,
        { $pull: { players: playerId } },
        { new: true }
      ).populate("players");

      res.status(200).json(updatedTeam);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }

};






teamCtlr.addPlayersToTeam = async (req, res) => {
  const { teamId } = req.params;
  const { players } = req.body;

  if (!Array.isArray(players) || players.length === 0) {
    return res.status(400).json({ error: "No players provided." });
  }

  try {

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: "Team not found." });


    const unassignedPlayers = await Player.find({
      _id: { $in: players },
      teamId: null,
    });

    const unassignedIds = unassignedPlayers.map((p) => p._id);

    if (unassignedIds.length === 0) {
      return res.status(400).json({ error: "All selected players are already assigned." });
    }


    const totalAfterAdd = team.players.length + unassignedIds.length;
    if (totalAfterAdd > 20) {
      return res.status(400).json({ error: "Team cannot exceed 20 players." });
    }

    
    await Team.findByIdAndUpdate(
      teamId,
      { $addToSet: { players: { $each: unassignedIds } } },
      { new: true }
    );


    await Player.updateMany(
      { _id: { $in: unassignedIds } },
      { $set: { teamId: teamId } }
    );

    const updatedTeam = await Team.findById(teamId).populate("players");
    res.status(200).json(updatedTeam);
  } catch (err) {
    console.error("Error adding players to team:", err.message);
    res.status(500).json({ error: "Internal server error." });
  }
};
teamCtlr.getPointsTable = async (req, res) => {
  try {
    const teams = await Team.find()
      .select('name matchesPlayed wins losses points')
      .sort({ points: -1, wins: -1 })
      .lean();

    console.log("Fetched teams:", teams);

    if (!teams || teams.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(teams);
  } catch (err) {
    console.error('Error fetching points table:', err.message);
    res.status(500).json({ error: 'Failed to fetch points table' });
  }
};





module.exports = teamCtlr;