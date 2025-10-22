
import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/AnalyticsFolder/Header";
import Filters from "../components/AnalyticsFolder/Filters";
import StatsCards from "../components/AnalyticsFolder/StatsCard";
import Charts from "../components/AnalyticsFolder/Charts";
import BestPlaying11 from "../components/AnalyticsFolder/BestPlaying11";
import PerformanceInsights from "../components/AnalyticsFolder/PerformanceInsights";
import TeamComposition from "../components/AnalyticsFolder/TeamComposition";
import QuickStats from "../components/AnalyticsFolder/QuickStats";
import MatchPerformance from "../components/AnalyticsFolder/MatchPerformance";

const API_BASE = "http://localhost:3018/api/players";

const Analytics = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState([]);
  const [error, setError] = useState("");
  const [bestTeam, setBestTeam] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [teams, setTeams] = useState([]);
  const [playerA, setPlayerA] = useState("");
  const [playerB, setPlayerB] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isGeneratingTeam, setIsGeneratingTeam] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const role = localStorage.getItem("role");

  const expertise = [
    { id: 1, role: "batsman" },
    { id: 2, role: "bowler" },
    { id: 3, role: "allrounder" },
    { id: 4, role: "keeper" }
  ];

  useEffect(() => {
    if (!token) {
      alert("You need to log in first!");
      navigate("/login");
      return;
    }
    if (!["player", "team_owner", "admin"].includes(role)) {
      alert("Access denied! Only players, team owners, and admins can view this page.");
      navigate("/");
      return;
    }
    setIsAuthenticated(true);
    fetchPlayerStats();
  }, [token, role, navigate, selectedTeamId]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get('http://localhost:3018/api/teams', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeams(response.data);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        setTeams([]);
      }
    };

    if (token && role === "admin") {
      fetchTeams();
    }
  }, [token, role]);

  const fetchPlayerStats = async () => {
    try {
      setLoading(true);
      let endpoint = API_BASE;
      let params = {};

      if (role === "admin") {
        endpoint = `${API_BASE}/all`;
        if (selectedTeamId) {
          params.teamId = selectedTeamId;
        }
      } else if (role === "team_owner") {
        params.createdBy = userId;
      } else if (role === "player") {
        params.playerId = userId;
      }

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const players = Array.isArray(res.data) ? res.data : res.data.players || [];
      setPlayerStats(players);
      setError("");
    } catch (err) {
      console.error("Error fetching player stats:", err.response?.data || err.message);
      setError("Failed to fetch player stats: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchBestTeam = async () => {
    try {
      setIsGeneratingTeam(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const res = await axios.get(`${API_BASE}/select-team`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { teamId: selectedTeamId || undefined },
      });
      setBestTeam(res.data.bestTeam);
    } catch (err) {
      setError("Failed to select best team: " + (err.response?.data?.error || err.message));
    } finally {
      setIsGeneratingTeam(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const filteredStats = selectedRole ? playerStats.filter((player) => player.role === selectedRole) : playerStats;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        <Header 
          error={error} 
          onRefresh={fetchPlayerStats}
          onNavigateToPointsTable={() => navigate('/points-table')}
        />

        <Filters
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          playerA={playerA}
          setPlayerA={setPlayerA}
          playerB={playerB}
          setPlayerB={setPlayerB}
          selectedTeamId={selectedTeamId}
          setSelectedTeamId={setSelectedTeamId}
          role={role}
          teams={teams}
          playerStats={playerStats}
          filteredStats={filteredStats}
          expertise={expertise}
           selectedPlayer={selectedPlayer} 
          setSelectedPlayer={setSelectedPlayer} 
        />

        <StatsCards filteredStats={filteredStats} />

               
        <div className="mt-8">
          <MatchPerformance 
            playerId={selectedPlayer}
            playerName={playerStats.find(p => p._id === selectedPlayer)?.name}
          />
        </div>

        <Charts
          playerStats={playerStats}
          filteredStats={filteredStats}
          playerA={playerA}
          playerB={playerB}
          selectedRole={selectedRole}
        />

        <BestPlaying11
          bestTeam={bestTeam}
          onGenerateTeam={fetchBestTeam}
          isGenerating={isGeneratingTeam}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <PerformanceInsights filteredStats={filteredStats} />
          <TeamComposition playerStats={playerStats} expertise={expertise} />
        </div>

        <QuickStats 
          playerStats={playerStats} 
          filteredStats={filteredStats} 
        />
      </div>
    </div>
  );
};

export default Analytics;