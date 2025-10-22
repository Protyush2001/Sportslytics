// src/components/matches/MatchFormModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import PlayerSelect from "../PlayerSelect";

const MatchFormModal = ({ isOpen, onClose, onMatchCreated }) => {
  const [title, setTitle] = useState("");
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [overs, setOvers] = useState(20);
  const [battingTeam, setBattingTeam] = useState("Team 1");
  const [status, setStatus] = useState("Upcoming");
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");

  // Filter teams so user can't select the same team twice
  const filteredTeam1 = teams.filter((team) => team._id !== team2);
  const filteredTeam2 = teams.filter((team) => team._id !== team1);

  // Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get("http://localhost:3018/api/teams", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(res.data || []);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };
    fetchTeams();
  }, [token]);

  // Fetch players for team1
  useEffect(() => {
    if (!team1) return;
    const fetchPlayers = async () => {
      try {
        const res = await axios.get(`http://localhost:3018/api/teams/${team1}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam1Players(res.data.players || []);
      } catch (err) {
        console.error("Failed to fetch players for Team 1:", err);
        setTeam1Players([]);
      }
    };
    fetchPlayers();
  }, [team1, token]);

  // Fetch players for team2
  useEffect(() => {
    if (!team2) return;
    const fetchPlayers = async () => {
      try {
        const res = await axios.get(`http://localhost:3018/api/teams/${team2}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam2Players(res.data.players || []);
      } catch (err) {
        console.error("Failed to fetch players for Team 2:", err);
        setTeam2Players([]);
      }
    };
    fetchPlayers();
  }, [team2, token]);

  // Add manual player
  const addManualPlayer = (teamSetter, currentPlayers, teamName) => {
    const playerName = prompt(`Enter player name for ${teamName}:`);
    if (playerName && playerName.trim()) {
      const trimmed = playerName.trim();
      if (!currentPlayers.includes(trimmed)) {
        teamSetter([...currentPlayers, trimmed]);
      } else {
        alert("Player already added to this team");
      }
    }
  };

  // Remove player
  const removePlayer = (teamSetter, currentPlayers, player) => {
    teamSetter(currentPlayers.filter((p) => p !== player));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!title.trim() || !team1 || !team2) {
      alert("Please fill in all required fields");
      return;
    }
    if (team1 === team2) {
      alert("Teams must be different");
      return;
    }
    if (overs < 1 || overs > 50) {
      alert("Overs must be between 1 and 50");
      return;
    }

    const duplicatePlayers = team1Players.filter((p1) =>
      team2Players.some((p2) => p1 === p2)
    );
    if (duplicatePlayers.length > 0) {
      alert("Same player cannot be in both teams");
      return;
    }

    setIsLoading(true);

    const team1Data = teams.find((t) => t._id === team1);
    const team2Data = teams.find((t) => t._id === team2);

    const matchData = {
      title: title.trim(),
      teams: [
        { name: team1Data?.name || "Team 1", players: team1Players },
        { name: team2Data?.name || "Team 2", players: team2Players },
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
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
      onClose();
    } catch (err) {
      console.error("Error creating match:", err.response?.data || err.message);
      alert("Failed to create match");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null; // Modal hidden

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold text-lg"
        >
          ×
        </button>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Team 1 *</label>
            <select value={team1} onChange={(e) => setTeam1(e.target.value)} className="w-full border border-gray-300 p-2 rounded">
              <option value="">Select Team</option>
              {filteredTeam1.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team 1 Players */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team 1 Players</label>
            {team1Players.length > 0 && (
              <PlayerSelect
                label=""
                players={team1Players}
                isMulti
                value={team1Players}
                onChange={setTeam1Players}
              />
            )}
            <button
              type="button"
              onClick={() => addManualPlayer(setTeam1Players, team1Players, team1 || "Team 1")}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2 hover:bg-green-600"
            >
              Add Player Manually
            </button>
          </div>

          {/* Team 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team 2 *</label>
            <select value={team2} onChange={(e) => setTeam2(e.target.value)} className="w-full border border-gray-300 p-2 rounded">
              <option value="">Select Team</option>
              {filteredTeam2.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Team 2 Players */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team 2 Players</label>
            {team2Players.length > 0 && (
              <PlayerSelect
                label=""
                players={team2Players}
                isMulti
                value={team2Players}
                onChange={setTeam2Players}
              />
            )}
            <button
              type="button"
              onClick={() => addManualPlayer(setTeam2Players, team2Players, team2 || "Team 2")}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm mt-2 hover:bg-green-600"
            >
              Add Player Manually
            </button>
          </div>

          {/* Match Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Overs *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">First Batting Team</label>
              <select
                value={battingTeam}
                onChange={(e) => setBattingTeam(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              >
                <option value="Team 1">Team 1</option>
                <option value="Team 2">Team 2</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Match Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded"
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
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Match"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchFormModal;
