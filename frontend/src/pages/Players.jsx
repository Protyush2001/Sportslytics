
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PlayerCard from "../components/PlayerCard";
import axios from "axios";

const API_BASE = "http://localhost:3018/api/players";

const Players = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);


  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email:"",
    dob:"",
    role: "",
    runs: 0,
    matches: 0,
    average: 0,
    image: "",
    wickets: 0,
    battingStyle: "",
    bowlingStyle: "",
    age: 0,
  });


  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const params = role === "admin" ? {} : { createdBy: userId };
      const res = await axios.get(API_BASE, { headers, params });
      const playersList = res.data.players ?? res.data ?? [];

      setPlayers(playersList);
      setTotalPlayers(playersList.length);
      setTotalPages(Math.ceil(playersList.length / pageSize));
    } catch (err) {
      console.error("Error fetching players:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError("Failed to fetch players.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      alert("You need to log in first!");
      navigate("/login");
    } else if (!["player", "team_owner", "admin"].includes(role)) {
      alert("Access denied! Only players, team owners, and admins can view this page.");
      navigate("/");
    } else {
      fetchPlayers();
    }
  }, [token, role, navigate]);

  
  const handleUpdate = (player) => {
    setSelectedPlayer(player);
    setFormData({
      name: player.name || "",
      dob: player.dob || "",
      email: player.email || "",
      role: player.role || "",
      runs: player.runs || 0,
      matches: player.matches || 0,
      average: player.average || 0,
      image: player.image || "",
      wickets: player.wickets || 0,
      battingStyle: player.battingStyle || "",
      bowlingStyle: player.bowlingStyle || "",
      age: player.age || 0,
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  };

 
  const handleDelete = async (id) => {
    if (!id) return setError("Invalid player ID");
    if (!window.confirm("Are you sure you want to delete this player?")) return;

    try {
      await axios.delete(`${API_BASE}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlayers((prev) => prev.filter((p) => p._id !== id));
      setTotalPlayers((prev) => prev - 1);
      setError("");
    } catch (err) {
      console.error("Error deleting player:", err.response?.data || err.message);
      setError("Failed to delete player.");
    }
  };

  
  const handleAddPlayer = () => {
    setFormData({
      name: "",
      email:"",
      dob:"",
      role: "",
      runs: 0,
      matches: 0,
      average: 0,
      image: "",
      wickets: 0,
      battingStyle: "",
      bowlingStyle: "",
      age: 0,
    });
    setSelectedPlayer(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };


  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files?.[0]) {
      setImageFile(files[0]);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };


  const handleSave = async () => {
    try {
      if (!formData.name.trim() || !formData.role.trim()) {
        setError("Name and role are required.");
        return;
      }

      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val));
      data.append("createdBy", userId);
      if (imageFile) data.append("image", imageFile);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      };

      let res;
      if (isEditMode) {
        res = await axios.put(`${API_BASE}/${selectedPlayer._id}`, data, config);
        setPlayers((prev) =>
          prev.map((p) => (p._id === selectedPlayer._id ? res.data : p))
        );
      } else {
        res = await axios.post(API_BASE, data, config);
        setPlayers((prev) => [...prev, res.data]);
      }

      setIsModalOpen(false);
      setImageFile(null);
      setError("");
      fetchPlayers();
    } catch (err) {
      console.error(err);
      setError("Failed to save player. Please try again.");
    }
  };


  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedPlayers = filteredPlayers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  useEffect(() => {
    setTotalPlayers(filteredPlayers.length);
    setTotalPages(Math.ceil(filteredPlayers.length / pageSize));
  }, [filteredPlayers.length, pageSize]);


  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">🏏 Players</h1>
          {(role === "admin" || role === "team_owner" || role === "player") && (
            <button
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 font-semibold"
              onClick={handleAddPlayer}
            >
              Add New Player
            </button>
          )}
        </div>

        {/* Search + Pagination Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-md mx-auto sm:mx-0">
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              Showing {filteredPlayers.length === 0 ? 0 : (page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, totalPlayers)} of {totalPlayers}
            </div>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={6}>6 / page</option>
              <option value={9}>9 / page</option>
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 mt-10">Loading players...</div>
        ) : error ? (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedPlayers.length > 0 ? (
              paginatedPlayers.map((player) => (
                <PlayerCard
                  key={player._id}
                  player={player}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                No players found matching your search.
              </div>
            )}
          </div>
        )}

        {/* Pagination buttons */}
        <div className="flex justify-center mt-8 gap-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="font-medium text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Add/Edit Player Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? "Update Player" : "Add New Player"}
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form className="space-y-5">
                {[
                  { name: "name", label: "Name", type: "text", required: true },
                  { name: "role", label: "Role", type: "text", required: true },
                  { name: "email", label: "Email", type: "email" },
                  { name: "dob", label: "Date of Birth", type: "date" },
                  { name: "age", label: "Age", type: "number" },
                  { name: "battingStyle", label: "Batting Style", type: "text" },
                  { name: "bowlingStyle", label: "Bowling Style", type: "text" },
                  { name: "runs", label: "Runs", type: "number" },
                  { name: "matches", label: "Matches", type: "number" },
                  { name: "average", label: "Average", type: "number" },
                  { name: "wickets", label: "Wickets", type: "number" },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}{" "}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleInputChange}
                      required={field.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Player Image
                  </label>
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {(imageFile || formData.image) && (
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : formData.image}
                      alt="Preview"
                      className="mt-3 max-w-[200px] rounded-lg shadow-sm"
                    />
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-800 px-6 py-2 rounded-full hover:bg-gray-400 transition-all duration-300 font-medium"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-2 rounded-full hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 font-medium"
                  >
                    {isEditMode ? "Save Changes" : "Add Player"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;