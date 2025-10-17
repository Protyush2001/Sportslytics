


const mongoose = require("mongoose");
const { type } = require("../validations/customMatch-validation");

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String, // e.g., Batsman, Bowler, All-Rounder, Wicket-Keeper
      required: true,
    },
    battingStyle: {
      type: String, // Right-hand, Left-hand
    },
    bowlingStyle: {
      type: String, // Right-arm, Left-arm
    },
    image: {
      type: String,
      default:"https://images.unsplash.com/photo-1575936123452-b67c3203c357?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aW1hZ2V8ZW58MHx8MHx8fDA%3D", // base64 string or URL
      required: true,
      validate: {
        validator: (v) =>
          typeof v === "string" &&
          (v.startsWith("data:image") || v.startsWith("http")),
        message: "Image must be a valid base64 string or URL",
      },
      // createdBy:{
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "User",
      //   required: true
      // }
    },
          createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      teamId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Team",
  default: null,
},


    matches: {
      type: Number,
      default: 0,
    },
    average:{
        type: Number,
        default: 0,
    },
    runs: {
      type: Number,
      default: 0,
    },
    wickets: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Player = mongoose.model("Player", playerSchema);
module.exports = Player;

