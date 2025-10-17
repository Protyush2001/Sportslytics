const mongoose = require('mongoose');
//third party matches schema fetched by the third party api----

const matchSchema = new mongoose.Schema({
    id: String,
    name: String,
    score: String,
    status: String,
    teams: [String],
    dateTime: String,
    type: String
},{timestamps: true});

const Match = mongoose.model('match',matchSchema);

module.exports = Match;