



const mongoose = require('mongoose');

// const commentarySchema = new mongoose.Schema({
//   commentary: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
//   ballNumber: { type: String, required: true },
//   ballData: {
//     runs: Number,
//     isWicket: Boolean,
//     striker: { name: String, id: String },
//     bowler: { name: String, id: String },
//     extras: String
//   }
// });

// Enhanced commentary schema in customMatchSchema
const ballEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['dot', 'run', 'boundary', 'six', 'wicket', 'extra', 'maiden'],
    required: true
  },
  runs: { type: Number, default: 0 },
  isWicket: { type: Boolean, default: false },
  wicketType: {
    type: String,
    enum: ['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket', null]
  },
  extras: {
    type: String,
    enum: ['wide', 'noball', 'byes', 'legbyes', null]
  }
});

const commentarySchema = new mongoose.Schema({
  ballNumber: { 
    over: { type: Number, required: true },
    ball: { type: Number, required: true }
  },
  batsman: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    name: { type: String, required: true },
    runs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 }
  },
  bowler: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    name: { type: String, required: true },
    overs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 }
  },
  event: ballEventSchema,
  commentary: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  matchSituation: {
    runs: { type: Number, required: true },
    wickets: { type: Number, required: true },
    overs: { type: Number, required: true },
    balls: { type: Number, required: true },
    runRate: { type: Number, required: true },
    requiredRunRate: { type: Number, default: null }
  }
});


///////////////////////////////////////////////////////////////
const predictionSchema = new mongoose.Schema({
  type: { type: String, enum: ['player', 'match', 'momentum'], required: true },
  prediction: { type: String, required: true },
  // confidence: { type: Number, min: 0, max: 100 },
  confidence: {
  type: String,
  enum: ['High', 'Medium', 'Low'],
  required: true
},

  timestamp: { type: Date, default: Date.now },
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  winProbability: {
    team1: { type: Number, min: 0, max: 100 },
    team2: { type: Number, min: 0, max: 100 }
  }
});

const customMatchSchema = new mongoose.Schema({
  title: { type: String, required: true },
  teams: [
    {
      name: { type: String, required: true },
      players: [{ type: String }]
    }
  ],
  overs: { type: Number, default: 20 },
  currentScore: {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    team: { type: Number, default: 0 },
    innings: { type: Number, default: 1 }
  },
  inningsScores: [
    {
      team: { type: Number, required: true },
      runs: { type: Number, required: true },
      wickets: { type: Number, required: true },
      overs: { type: Number, required: true },
      balls: { type: Number, required: true },
      innings: { type: Number, required: true }
    }
  ],
  
  // AI Commentary Features
  commentary: [commentarySchema],
  predictions: [predictionSchema],
  aiInsights: {
    momentum: {
      status: { type: String, enum: ['Strong Positive', 'Positive', 'Neutral', 'Negative', 'Strong Negative'] },
      recentRunRate: Number,
      requiredRunRate: Number,
      lastUpdated: { type: Date, default: Date.now }
    },
    keyPlayers: {
      keyBatsman: String,
      keyBowler: String,
      impact: String,
      lastUpdated: { type: Date, default: Date.now }
    },
    winProbability: {
      team1: { type: Number, min: 0, max: 100, default: 50 },
      team2: { type: Number, min: 0, max: 100, default: 50 },
      lastUpdated: { type: Date, default: Date.now }
    }
  },
  
  // Updated stream schema for WebRTC recording
  stream: {
    isLive: { type: Boolean, default: false },
    roomId: { type: String, default: null },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    startedAt: { type: Date, default: null },
    // Additional fields for recording support
    recordingStatus: { 
      type: String, 
      enum: ['not_started', 'recording', 'stopping', 'processing', 'completed', 'failed'], 
      default: 'not_started' 
    },
    activeRecordingId: { type: String, default: null }
  },
  
  // Enhanced pastStreams schema with recording metadata
  pastStreams: [
    {
      roomId: String,
      startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      startedAt: Date,
      endedAt: Date,
      recordingUrl: String,
      // New recording fields
      fileSize: { type: Number }, // in bytes
      duration: { type: Number }, // in seconds
      mimeType: { type: String, default: 'video/webm' },
      processed: { type: Boolean, default: false },
      recordingId: { type: String }, // unique identifier for the recording
      uploadStatus: { 
        type: String, 
        enum: ['pending', 'uploading', 'completed', 'failed'], 
        default: 'pending' 
      },
      uploadProgress: { type: Number, min: 0, max: 100, default: 0 },
      errorMessage: { type: String } // for debugging failed uploads
    }
  ],
  
  status: { type: String, default: "Upcoming" },
  result: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  
  // AI Settings
  aiEnabled: { type: Boolean, default: true },
  commentaryFrequency: { type: String, enum: ['every_ball', 'key_moments', 'overs'], default: 'every_ball' }
  
}, { timestamps: true });

// Indexes for performance
customMatchSchema.index({ status: 1, createdBy: 1 });
customMatchSchema.index({ 'commentary.timestamp': -1 });
customMatchSchema.index({ 'predictions.timestamp': -1 });
customMatchSchema.index({ 'pastStreams.recordingId': 1 }); // New index for recording lookups

// Virtual to get active recordings
customMatchSchema.virtual('activeRecording').get(function() {
  return this.pastStreams.find(stream => stream.uploadStatus === 'uploading' || stream.uploadStatus === 'pending');
});

// Method to add a new recording entry
customMatchSchema.methods.startRecording = function(recordingId, roomId, userId) {
  this.stream.recordingStatus = 'recording';
  this.stream.activeRecordingId = recordingId;
  this.stream.isLive = true;
  this.stream.roomId = roomId;
  this.stream.startedBy = userId;
  this.stream.startedAt = new Date();
  
  // Add to pastStreams with pending status
  this.pastStreams.push({
    roomId: roomId,
    startedBy: userId,
    startedAt: new Date(),
    recordingId: recordingId,
    uploadStatus: 'pending'
  });
};

// Method to update recording status
customMatchSchema.methods.updateRecordingStatus = function(recordingId, status, metadata = {}) {
  const recording = this.pastStreams.find(stream => stream.recordingId === recordingId);
  if (recording) {
    recording.uploadStatus = status;
    if (metadata.recordingUrl) recording.recordingUrl = metadata.recordingUrl;
    if (metadata.fileSize) recording.fileSize = metadata.fileSize;
    if (metadata.duration) recording.duration = metadata.duration;
    if (metadata.mimeType) recording.mimeType = metadata.mimeType;
    if (metadata.processed !== undefined) recording.processed = metadata.processed;
    if (metadata.uploadProgress) recording.uploadProgress = metadata.uploadProgress;
    if (metadata.errorMessage) recording.errorMessage = metadata.errorMessage;
    if (status === 'completed') recording.endedAt = new Date();
  }
  
  // Update stream status
  if (this.stream.activeRecordingId === recordingId) {
    if (status === 'completed' || status === 'failed') {
      this.stream.recordingStatus = status === 'completed' ? 'completed' : 'failed';
      this.stream.isLive = false;
      this.stream.activeRecordingId = null;
    } else {
      this.stream.recordingStatus = status;
    }
  }
};

const CustomMatch = mongoose.model("CustomMatch", customMatchSchema);
module.exports = CustomMatch;