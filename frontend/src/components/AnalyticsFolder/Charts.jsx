
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const Charts = ({ playerStats, filteredStats, playerA, playerB, selectedRole }) => {
  const selectedPlayerA = playerStats.find((p) => p._id === playerA);
  const selectedPlayerB = playerStats.find((p) => p._id === playerB);
  const isComparing = selectedPlayerA && selectedPlayerB;

  const playersToShow = isComparing
    ? playerStats.filter(p => p._id === playerA || p._id === playerB)
    : filteredStats;

 
  const barChartKey = `bar-${playersToShow.map(p => p._id).join('-')}-${selectedRole}`;
  const lineChartKey = `line-${playerA}-${playerB}`;

  const teamChartData = {
    labels: playersToShow.map((player) => player.name),
    datasets: [
      {
        label: "Runs",
        data: playersToShow.map((player) => player.runs || 0),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "#3B82F6",
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: "Wickets",
        data: playersToShow.map((player) => player.wickets || 0),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "#22C55E",
        borderWidth: 2,
        borderRadius: 8,
      },
      {
        label: "Batting Average",
        data: playersToShow.map((player) => player.average || 0),
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        borderColor: "#F59E0B",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const comparisonLineData = {
    labels: ["Runs", "Wickets", "Batting Average"],
    datasets: [],
  };

  if (selectedPlayerA && selectedPlayerB) {
    comparisonLineData.datasets = [
      {
        label: selectedPlayerA.name,
        data: [
          selectedPlayerA.runs || 0,
          selectedPlayerA.wickets || 0,
          selectedPlayerA.average || 0,
        ],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#3B82F6",
        pointBorderWidth: 3,
        pointRadius: 6,
      },
      {
        label: selectedPlayerB.name,
        data: [
          selectedPlayerB.runs || 0,
          selectedPlayerB.wickets || 0,
          selectedPlayerB.average || 0,
        ],
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: "#EF4444",
        pointBorderWidth: 3,
        pointRadius: 6,
      },
    ];
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "top",
        labels: {
          padding: 20,
          font: { size: 12, weight: 'bold' }
        }
      },
      title: { 
        display: true, 
        text: "Player Performance Comparison",
        font: { size: 16, weight: 'bold' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear',
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        type: 'category',
        grid: {
          display: false,
        }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "top",
        labels: {
          padding: 20,
          font: { size: 12, weight: 'bold' }
        }
      },
      title: {
        display: true,
        text: "Player vs Player Comparison",
        font: { size: 16, weight: 'bold' }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        type: 'linear',
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        }
      },
      x: {
        type: 'category',
      }
    }
  };

  return (
    <>
      {playerStats.length > 0 && playersToShow.length > 0 ? (
        <div className="bg-white shadow-xl rounded-3xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedPlayerA && selectedPlayerB ? "Selected Players Overview" : "Team/Role Performance Overview"}
            </h2>
          </div>
          <div className="h-96 p-4">
            <Bar 
              key={barChartKey}
              data={teamChartData} 
              options={chartOptions} 
              redraw={true}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-xl rounded-3xl p-8 text-center border border-gray-100">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-600 text-lg">No players found. Add players to see analytics.</p>
        </div>
      )}

      {selectedPlayerA && selectedPlayerB && (
        <div className="bg-white shadow-xl rounded-3xl p-8 mb-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800">Player vs Player Line Comparison</h2>
          </div>
          <div className="h-96 p-4">
            <Line 
              key={lineChartKey}
              data={comparisonLineData} 
              options={lineOptions} 
              redraw={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Charts;