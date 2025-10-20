
import React, { useState, useEffect } from "react";
import axios from "axios";
import PlayerSelect from "./PlayerSelect";

const ScoreUpdater = ({ match, onScoreUpdated }) => {
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [opponentPlayers, setOpponentPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [extras, setExtras] = useState("");

  const token = localStorage.getItem("token");
  const currentTeamIndex = match?.currentScore?.team ?? 0;
  const opponentTeamIndex = (currentTeamIndex + 1) % 2;

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!match?.teams?.[currentTeamIndex]?.players || !match?.teams?.[opponentTeamIndex]?.players) {
        console.warn("Team players not available");
        return;
      }

      const teamIds = match.teams[currentTeamIndex].players || [];
      const opponentIds = match.teams[opponentTeamIndex].players || [];

      if (teamIds.length === 0 || opponentIds.length === 0) {
        console.warn("No player IDs found");
        return;
      }

      try {
        // If using bulk fetch endpoint
        const res = await axios.post(
          "http://localhost:3018/api/players/bulk",
          { ids: [...teamIds, ...opponentIds] },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const allPlayers = res.data.players || [];
        setTeamPlayers(allPlayers.filter(p => teamIds.includes(p._id)));
        setOpponentPlayers(allPlayers.filter(p => opponentIds.includes(p._id)));
      } catch (err) {
        console.error("Failed to fetch player details:", err);
        
        // Fallback: Create dummy players with names from the teams array
        const teamDummyPlayers = teamIds.map((id, index) => ({
          _id: id,
          name: typeof id === 'string' ? id : `Player ${index + 1}`,
          email: `player${index + 1}@team.com`
        }));
        
        const opponentDummyPlayers = opponentIds.map((id, index) => ({
          _id: id,
          name: typeof id === 'string' ? id : `Player ${index + 1}`,
          email: `player${index + 1}@opponent.com`
        }));
        
        setTeamPlayers(teamDummyPlayers);
        setOpponentPlayers(opponentDummyPlayers);
      }
    };

    fetchPlayers();
  }, [match._id, match.currentScore.team, token]);

  const handleBallUpdate = async (runs, isWicket = false) => {
    if (!match?.currentScore || match.status === "Completed") {
      alert("Match is already completed or invalid.");
      return;
    }

    // Validation
    if (!strikerId || !nonStrikerId || !bowlerId) {
      alert("Please select striker, non-striker, and bowler");
      return;
    }

    if (strikerId === nonStrikerId) {
      alert("Striker and non-striker cannot be the same player");
      return;
    }

    setIsLoading(true);

    const requestData = {
      strikerId,
      nonStrikerId,
      bowlerId,
      runs,
      isWicket
    };

    // Add extras if specified
    if (extras) {
      requestData.extras = extras;
    }

    try {
      const res = await axios.patch(
        `http://localhost:3018/matches/${match._id}/ball`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "Completed") {
        alert(`Match completed! Result: ${res.data.result || "Check match details"}`);
      }

      onScoreUpdated(res.data);
      
      // Reset extras after successful update
      setExtras("");

    } catch (err) {
      console.error("Error updating ball:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.msg || err.response?.data?.error || "Failed to update score";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-rotate strike on single runs (1, 3, 5)
  const handleRunsWithRotation = (runs) => {
    handleBallUpdate(runs);
    
    // Rotate strike for odd runs
    if (runs % 2 === 1) {
      setTimeout(() => {
        const temp = strikerId;
        setStrikerId(nonStrikerId);
        setNonStrikerId(temp);
      }, 1000);
    }
  };

  const currentBattingTeam = match?.teams?.[currentTeamIndex]?.name || `Team ${currentTeamIndex + 1}`;
  const currentBowlingTeam = match?.teams?.[opponentTeamIndex]?.name || `Team ${opponentTeamIndex + 1}`;

  if (!match?.currentScore) {
    return (
      <div className="mt-6 p-4 border rounded shadow bg-gray-50">
        <p className="text-gray-500">Match not ready for scoring</p>
      </div>
    );
  }

  return (
    <div className="mt-6 p-4 border rounded-lg shadow-lg bg-white">
      <h3 className="text-lg font-bold mb-4 text-blue-700">🎯 Update Ball</h3>
      
      {/* Current Match Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p className="text-sm text-blue-600">
          <span className="font-semibold">{currentBattingTeam}</span> batting vs{' '}
          <span className="font-semibold">{currentBowlingTeam}</span>
        </p>
        <p className="text-lg font-bold text-blue-800">
          {match.currentScore.runs}/{match.currentScore.wickets} 
          <span className="text-sm ml-2">
            ({match.currentScore.overs}.{match.currentScore.balls} overs)
          </span>
        </p>
      </div>

      {/* Player Selection */}
      <div className="space-y-3 mb-4">
        <PlayerSelect 
          label={`Striker (${currentBattingTeam})`}
          players={teamPlayers} 
          value={strikerId} 
          onChange={setStrikerId} 
        />
        <PlayerSelect 
          label={`Non-Striker (${currentBattingTeam})`}
          players={teamPlayers} 
          value={nonStrikerId} 
          onChange={setNonStrikerId} 
        />
        <PlayerSelect 
          label={`Bowler (${currentBowlingTeam})`}
          players={opponentPlayers} 
          value={bowlerId} 
          onChange={setBowlerId} 
        />
      </div>

      {/* Extras Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Extras (Optional)</label>
        <select
          value={extras}
          onChange={(e) => setExtras(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No extras</option>
          <option value="wide">Wide</option>
          <option value="no-ball">No Ball</option>
          <option value="bye">Bye</option>
          <option value="leg-bye">Leg Bye</option>
        </select>
      </div>

      {/* Runs Buttons */}
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <h4 className="w-full text-sm font-medium text-gray-700 mb-1">Runs:</h4>
          {[0, 1, 2, 3, 4, 6].map((run) => (
            <button
              key={run}
              onClick={() => handleRunsWithRotation(run)}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
            >
              {run}
            </button>
          ))}
        </div>

        {/* Special Actions */}
        <div className="flex gap-2 flex-wrap">
          <h4 className="w-full text-sm font-medium text-gray-700 mb-1">Special:</h4>
          <button
            onClick={() => handleBallUpdate(0, true)}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            Wicket
          </button>
          <button
            onClick={() => handleBallUpdate(5)} // 5 runs (rare but possible)
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            5 Runs
          </button>
        </div>
      </div>

      {/* Strike Rotation Helper */}
      <div className="mt-4 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
        <p className="text-xs text-yellow-700">
          <strong>Note:</strong> Strike will auto-rotate for odd runs (1, 3, 5). 
          You can manually swap players if needed.
        </p>
      </div>

      {/* Manual Strike Rotation */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            const temp = strikerId;
            setStrikerId(nonStrikerId);
            setNonStrikerId(temp);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Rotate Strike
        </button>
        <button
          onClick={() => {
            setStrikerId("");
            setNonStrikerId("");
            setBowlerId("");
            setExtras("");
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
        >
          Reset Selection
        </button>
      </div>

      {isLoading && (
        <div className="mt-2 text-center text-blue-600">
          <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
          Updating score...
        </div>
      )}
    </div>
  );
};

export default ScoreUpdater;