import React, { useState, useEffect } from "react";
import axios from "axios";
import PlayerSelect from "./PlayerSelect";

const MatchForm = ({ onMatchCreated }) => {
  const [title, setTitle] = useState("");
  const [teams,setTeams] = useState([])
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [overs, setOvers] = useState(20);
  const [battingTeam, setBattingTeam] = useState("Team 1");
  const [status, setStatus] = useState("Upcoming");
  const [registeredPlayers, setRegisteredPlayers] = useState([]);
  // const [team1Players,setTeam1Players] = useState([])
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");

  const filteredTeam1 = teams.filter((team)=>{
    return team._id != team2;
  })

    const filteredTeam2 = teams.filter((team)=>{
    return team._id != team1;
  })

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await axios.get(`http://localhost:3018/api/teams/${team1}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam1Players(res.data.players || []);
      } catch (err) {
        console.error("Failed to fetch players:", err);
        // If API fails, allow manual player names
        setTeam1Players([]);
      }
    };

    fetchPlayers();
  }, [team1]);

  
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await axios.get(`http://localhost:3018/api/teams/${team2}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam2Players(res.data.players || []);
      } catch (err) {
        console.error("Failed to fetch players:", err);
        // If API fails, allow manual player names
        setTeam2Players([]);
      }
    };

    fetchPlayers();
  }, [team2]);

  // fetching teams 

    useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await axios.get("http://localhost:3018/api/teams", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(res.data || []);
      } catch (err) {
        console.error("Failed to fetch players:", err);
        // If API fails, allow manual player names
        setRegisteredPlayers([]);
      }
    };

    fetchPlayers();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!title.trim() || !team1.trim() || !team2.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    if (team1.trim() === team2.trim()) {
      alert("Team names must be different");
      return;
    }

    if (overs < 1 || overs > 50) {
      alert("Overs must be between 1 and 50");
      return;
    }

    // Check for duplicate players across teams
    const duplicatePlayers = team1Players.filter(p1 => 
      team2Players.some(p2 => p1 === p2)
    );
    
    if (duplicatePlayers.length > 0) {
      alert("Same player cannot be in both teams");
      return;
    }

    setIsLoading(true);

    const team1Data = teams.find(t => t._id === team1);
const team2Data = teams.find(t => t._id === team2);

    // const matchData = {
    //   title: title.trim(),
    //   teams: [
    //     { name: team1.trim(), players: team1Players },
    //     { name: team2.trim(), players: team2Players },
    //   ],
    //   overs: Number(overs),
    //   status,
    //   currentScore: {
    //     team: battingTeam === "Team 1" ? 0 : 1,
    //     runs: 0,
    //     wickets: 0,
    //     overs: 0,
    //     balls: 0,
    //     innings: 1,
    //   },
    //   createdBy: localStorage.getItem("userId"),
    //   inningsScores: [],
    //   date: new Date(),
    // };


const matchData = {
      title: title.trim(),
      teams: [
        { 
          name: team1Data?.name || "Team 1", 
          players: team1Players.map(p => typeof p === 'object' ? p.name : p)
        },
        { 
          name: team2Data?.name || "Team 2", 
          players: team2Players.map(p => typeof p === 'object' ? p.name : p)
        },
      ],
      overs: Number(overs),
      status,
      currentScore: {
        team: battingTeam === "Team 1" ? 0 : 1,
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        innings: 1,
      },
      createdBy: localStorage.getItem("userId"),
      inningsScores: [],
      date: new Date(),
    };

    try {
      const res = await axios.post("http://localhost:3018/matches", matchData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      alert("Match created successfully!");
      onMatchCreated(res.data);
      
      // Reset form
      setTitle("");
      setTeam1("");
      setTeam2("");
      setTeam1Players([]);
      setTeam2Players([]);
      setOvers(20);
      setBattingTeam("Team 1");
      setStatus("Upcoming");
      
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg ||
        err.response?.data?.error ||
        err.message ||
        "Unknown error";
      console.error("Error creating match:", err.response?.data || err.message);
      alert(`Failed to create match: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to add manual player

const addManualPlayer = (teamSetter, currentPlayers, teamName) => {
  const playerName = prompt(`Enter player name for ${teamName}:`);
  if (playerName && playerName.trim()) {
    const trimmedName = playerName.trim();
    if (!currentPlayers.includes(trimmedName)) {
      teamSetter([...currentPlayers, trimmedName]);
    } else {
      alert("Player already added to this team");
    }
  }
};

// Helper function to remove player
const removePlayer = (teamSetter, currentPlayers, playerToRemove) => {
  teamSetter(currentPlayers.filter(p => p !== playerToRemove));
};

const team1PlayersData = teams.find((t) => t._id === team1)?.players || [];
const team2PlayersData = teams.find((t) => t._id === team2)?.players || [];

const team1Name = teams.find((t) => t._id === team1)?.name || "Team 1";
const team2Name = teams.find((t) => t._id === team2)?.name || "Team 2";



return (
  <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
    <h2 className="text-xl font-bold text-blue-700 mb-4">Create Custom Match</h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Match Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Match Title *
        </label>
        <input
          type="text"
          placeholder="e.g., Team A vs Team B"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          required
          maxLength={100}
        />
      </div>

      {/* Team 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team 1 Name *
        </label>
        {/* <input
          type="text"
          placeholder="Enter team 1 name"
          value={team1}
          onChange={(e) => setTeam1(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          required
          maxLength={50}
        /> */}
        <select name="" value={team1} onChange={(e)=>{setTeam1(e.target.value)}}>
          <option value="">Select Team</option>
          {filteredTeam1.map((team,i)=>{
            return <option key={team._id} value={team._id}>{team.name}</option>
          })}
        </select>
      </div>

      {/* Team 1 Players */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team 1 Players
        </label>
        {team1Players.length > 0 && (
          <PlayerSelect
            label=""
            players={team1PlayersData}
            isMulti
            value={team1Players}
            onChange={setTeam1Players}
            placeholder="Select players from registered list"
          />
        )}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => addManualPlayer(setTeam1Players, team1Players, team1 || "Team 1")}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            Add Player Manually
          </button>
        </div>
        {team1Players.length > 0 && (
          <div className="mt-2 p-2 border rounded bg-gray-50">
            <p className="text-xs text-gray-600 mb-1">Selected Players ({team1Players.length}):</p>
            <div className="flex flex-wrap gap-1">
              {team1Players.map((player, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center"
                >
                  {typeof player === 'object' ? player.name : player}
                  <button
                    type="button"
                    onClick={() => removePlayer(setTeam1Players, team1Players, player)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Team 2 - Similar structure */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team 2 Name *
        </label>
        {/* <input
          type="text"
          placeholder="Enter team 2 name"
          value={team2}
          onChange={(e) => setTeam2(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          required
          maxLength={50}
        /> */}
        <select name="" value={team2} onChange={(e)=>{setTeam2(e.target.value)}}>
          <option value="">Select Team</option>
            {filteredTeam2.map((team,i)=>{
            return <option key={team._id} value={team._id}>{team.name}</option>
          })}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team 2 Players
        </label>
        {team2Players.length > 0 && (
          <PlayerSelect
            label=""
            players={team2PlayersData}
            isMulti
            value={team2Players}
            onChange={setTeam2Players}
            placeholder="Select players from registered list"
          />
        )}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => addManualPlayer(setTeam2Players, team2Players, team2 || "Team 2")}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            Add Player Manually
          </button>
        </div>
        {team2Players.length > 0 && (
          <div className="mt-2 p-2 border rounded bg-gray-50">
            <p className="text-xs text-gray-600 mb-1">Selected Players ({team2Players.length}):</p>
            <div className="flex flex-wrap gap-1">
              {team2Players.map((player, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs flex items-center"
                >
                  {typeof player === 'object' ? player.name : player}
                  <button
                    type="button"
                    onClick={() => removePlayer(setTeam2Players, team2Players, player)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Match Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overs *
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={overs}
            onChange={(e) => setOvers(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Batting Team
          </label>
          <select
            value={battingTeam}
            onChange={(e) => setBattingTeam(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="Team 1">{team1Name || "Team 1"}</option>
            <option value="Team 2">{team2Name || "Team 2"}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Match Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="Upcoming">Upcoming</option>
          <option value="Live">Live</option>
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {isLoading ? "Creating..." : "Create Match"}
        </button>
        <button
          type="button"
          onClick={() => {
            setTitle("");
            setTeam1("");
            setTeam2("");
            setTeam1Players([]);
            setTeam2Players([]);
            setOvers(20);
            setBattingTeam("Team 1");
            setStatus("Upcoming");
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          disabled={isLoading}
        >
          Reset
        </button>
      </div>
    </form>
  </div>
);
};

export default MatchForm;