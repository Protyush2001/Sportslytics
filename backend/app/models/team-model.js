const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: String,
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],
    createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true,
},

    coach: String,
    matchesPlayed: {type:Number,default:0},
    wins: {type:Number,default:0},
    losses: {type:Number,default:0},
    points: {type:Number,default:0}
});

const Team = mongoose.model('Team',teamSchema);
module.exports = Team;