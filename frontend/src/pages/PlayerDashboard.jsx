import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function PlayerDashboard() {
  const [player, setPlayer] = useState({});
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await axios.get(
          `https://sportslytics-2.onrender.com/api/players/me/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setPlayer(response.data);
      } catch (err) {
        console.log("Error fetching player data:", err);
      }
    };
    fetchPlayer();
  }, []);

  const lineData = {
    labels: ["2019", "2020", "2021", "2022", "2023"],
    datasets: [
      {
        label: "Runs Scored",
        data: [450, 780, 1020, 890, 1305], 
        borderColor: "#4e79a7",
        backgroundColor: "#4e79a7",
        tension: 0.3,
        pointRadius: 5,
        fill: false,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Player Runs Over Seasons" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Runs" },
      },
      x: {
        title: { display: true, text: "Season" },
      },
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">Player Dashboard</h2>
        <p className="text-lg text-gray-500">Welcome, {player.name}</p>
      </div>


      <div className="flex flex-col md:flex-row items-center gap-6 bg-white shadow-md rounded-lg p-6">
        <img
          src={player.image}
          alt="Player"
          className="w-32 h-32 rounded-full object-cover border-2 border-blue-500"
        />
        <div className="text-left space-y-2">
          <h3 className="text-xl font-semibold text-gray-700">{player.name}</h3>
          <p className="text-gray-600">Role: {player.role}</p>
          <p className="text-gray-600">Batting Style: {player.battingStyle}</p>
          <p className="text-gray-600">Bowling Style: {player.bowlingStyle}</p>
          <p className="text-gray-600">
            DOB: {new Date(player.dob).toLocaleDateString()}
          </p>
          <p className="text-gray-600">
            Team: {player.team ? player.team.name : "No Team Assigned"}
          </p>
        </div>
      </div>

      {/* Line Chart Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Performance Overview
        </h3>
        <Line data={lineData} options={lineOptions} />
      </div>

      {/* Career Highlights */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">
          Career Highlights
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>Matches Played: {player.matches}</li>
          <li>Total Runs: {player.runs}</li>
          <li>Wickets Taken: {player.wickets}</li>
          <li>Batting Average: {player.average}</li>
        </ul>
      </div>
    </div>
  );
}