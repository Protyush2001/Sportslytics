
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", coach: "", selectedPlayers: [] });
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  const fetchTeams = async () => {
    try {
      const res = await axios.get("http://localhost:3018/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(res.data);
    } catch (err) {
      console.error("Error fetching teams:", err.message);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [token]);

  const fetchPlayers = async () => {
    try {
      setLoadingPlayers(true);
      const teamRes = await axios.get("http://localhost:3018/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const playerRes = await axios.get("http://localhost:3018/api/players/unassigned", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allPlayers = Array.isArray(playerRes.data)
        ? playerRes.data
        : playerRes.data.players || [];

      const assignedPlayerIds = teamRes.data.flatMap((team) =>
        team.players.map((p) => String(p._id))
      );

      const availablePlayers = allPlayers.filter((player) => {
        const id = String(player._id);
        return id && !assignedPlayerIds.includes(id);
      });

      setPlayers(availablePlayers);
    } catch (err) {
      console.error("Error fetching players:", err.message);
      setPlayers([]);
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlayerSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
    if (selected.length <= 20) {
      setFormData((prev) => ({ ...prev, selectedPlayers: selected }));
    } else {
      alert("Maximum 20 players allowed per team.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedPlayers.length > 20) {
      alert("You can only select up to 20 players.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:3018/api/teams",
        {
          name: formData.name,
          coach: formData.coach,
          players: formData.selectedPlayers,
          createdBy: userId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Team created successfully!");
      setShowModal(false);
      setFormData({ name: "", coach: "", selectedPlayers: [] });
      fetchTeams();
    } catch (err) {
      console.error("Error creating team:", err.message);
    }
  };

  const handleDelete = async (teamId) => {
    if (window.confirm("Are you sure you want to delete this team?")) {
      try {
        await axios.delete(`http://localhost:3018/api/teams/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams((prev) => prev.filter((team) => team._id !== teamId));
      } catch (err) {
        console.error("Error deleting team:", err.message);
      }
    }
  };

  const handleAddPlayerToTeam = async (teamId, playerId) => {
    try {
      const res = await axios.patch(
        `http://localhost:3018/api/teams/${teamId}/add-player/${playerId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Player added successfully!");
      fetchTeams();
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || err.message || "Unknown error";
      console.error("Error adding player:", errorMessage);
      alert(`Failed to add player: ${errorMessage}`);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    if (window.confirm("Remove this player from the team?")) {
      try {
        const res = await axios.patch(
          `http://localhost:3018/api/teams/${selectedTeam._id}/remove-player/${playerId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSelectedTeam({ ...res.data });
        fetchTeams();
      } catch (err) {
        console.error("Error removing player:", err.message);
      }
    }
  };

  const handleAddPlayers = async (e, teamId) => {
    e.preventDefault();
    try {
      await axios.patch(
        `http://localhost:3018/api/teams/${teamId}/add-players`,
        { players: formData.selectedPlayers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Players added successfully!");
      setAddModal(false);
      setFormData((prev) => ({ ...prev, selectedPlayers: [] }));

      const updatedTeam = await axios.get(`http://localhost:3018/api/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSelectedTeam(updatedTeam.data);
      fetchTeams();
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      console.error("Error adding players:", errorMessage);
      alert(`Failed to add players: ${errorMessage}`);
    }
  };

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          🏏 Team Management
        </h1>

        <div className="mb-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
              />
            </svg>
          </div>
        </div>

        {(role === "team_owner" || role === "admin") && (
          <div className="text-center mb-10">
            <button
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg"
              onClick={async () => {
                await fetchPlayers();
                setShowModal(true);
              }}
            >
              ➕ Create New Team
            </button>
          </div>
        )}

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.length > 0 ? (
            filteredTeams.map((team) => (
              <div
                key={team._id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300"
              >
                <h2 className="text-xl font-semibold text-indigo-600 mb-3">{team.name}</h2>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Coach:</span> {team.coach || "Not Assigned"}
                </p>
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">Players:</span> {team.players.length}
                </p>
                <div className="flex gap-3">
                  <button
                    className="bg-indigo-600 text-white px-5 py-2 rounded-full hover:bg-indigo-700 transition-all duration-300 font-medium"
                    onClick={() => setSelectedTeam(team)}
                  >
                    View Details
                  </button>
                  {(role === "admin" || team.createdBy === userId) && (
                    <button
                      className="bg-red-500 text-white px-5 py-2 rounded-full hover:bg-red-600 transition-all duration-300 font-medium"
                      onClick={() => handleDelete(team._id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              No teams found matching your search.
            </div>
          )}
        </div>

       
        {showModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Team</h2>
                <button
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter team name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coach Name
                  </label>
                  <input
                    type="text"
                    name="coach"
                    placeholder="Enter coach name"
                    value={formData.coach}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Players (Max 20)
                  </label>
                  {loadingPlayers ? (
                    <p className="text-sm text-gray-500">Loading players...</p>
                  ) : Array.isArray(players) && players.length > 0 ? (
                    <select
                      multiple
                      value={formData.selectedPlayers}
                      onChange={handlePlayerSelect}
                      className="w-full border border-gray-300 px-4 py-2 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {players.map((player) => (
                        <option key={player._id} value={player._id}>
                          {player.name} — {player.role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-red-500">All players are already assigned to teams.</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-all duration-300 font-medium"
                  >
                    Create Team
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-400 transition-all duration-300 font-medium"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Players Modal */}
        {addModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Add Players to {selectedTeam?.name}</h2>
                <button
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors"
                  onClick={() => setAddModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={(e) => handleAddPlayers(e, selectedTeam._id)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Players
                  </label>
                  {loadingPlayers ? (
                    <p className="text-sm text-gray-500">Loading players...</p>
                  ) : Array.isArray(players) && players.length > 0 ? (
                    <select
                      multiple
                      value={formData.selectedPlayers}
                      onChange={handlePlayerSelect}
                      className="w-full border border-gray-300 px-4 py-2 rounded-lg h-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {players.map((player) => (
                        <option key={player._id} value={player._id}>
                          {player.name} — {player.role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-red-500">No available players to add.</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition-all duration-300 font-medium"
                  >
                    Add Players
                  </button>
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-400 transition-all duration-300 font-medium"
                    onClick={() => setAddModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Team Details Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedTeam.name}</h2>
                <button
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors"
                  onClick={() => setSelectedTeam(null)}
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-3">
                <span className="font-medium">Coach:</span> {selectedTeam.coach}
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Players</h3>
              <ul className="space-y-4">
                {selectedTeam.players.length > 0 ? (
                  selectedTeam.players.map((player) => (
                    <li key={player._id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                      <img
                        src={player.image}
                        alt={player.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/48?text=No+Image";
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{player.name}</p>
                        <p className="text-sm text-gray-500">{player.role}</p>
                      </div>
                      {(role === "admin" || selectedTeam.createdBy === userId) && (
                        <button
                          title="Remove player from team"
                          className="bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition-all duration-300"
                          onClick={() => handleRemovePlayer(player._id)}
                        >
                          🗑️
                        </button>
                      )}
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500">No players assigned to this team.</p>
                )}
              </ul>
              <div className="mt-6 flex gap-3">
                {(role === "admin" || selectedTeam.createdBy === userId) && (
                  <button
                    className="bg-green-500 text-white px-5 py-2 rounded-full hover:bg-green-600 transition-all duration-300 font-medium"
                    onClick={async () => {
                      await fetchPlayers();
                      setAddModal(true);
                      setFormData((prev) => ({ ...prev, selectedPlayers: [] }));
                    }}
                  >
                    ➕ Add Players
                  </button>
                )}
                <button
                  className="bg-gray-300 text-gray-800 px-5 py-2 rounded-full hover:bg-gray-400 transition-all duration-300 font-medium"
                  onClick={() => setSelectedTeam(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;
