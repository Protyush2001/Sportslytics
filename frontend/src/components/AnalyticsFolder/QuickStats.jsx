import React from "react";

const QuickStats = ({ playerStats, filteredStats }) => {
  const totalRuns = filteredStats.reduce((sum, player) => sum + (player.runs || 0), 0);
  const totalWickets = filteredStats.reduce((sum, player) => sum + (player.wickets || 0), 0);
  const averageBattingAvg = filteredStats.length > 0
    ? (filteredStats.reduce((sum, player) => sum + (player.average || 0), 0) / filteredStats.length).toFixed(2)
    : 0;

  return (
    <div className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl p-8 mt-8 text-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
        <QuickStatItem value={playerStats.length} label="Total Players" color="blue" />
        <QuickStatItem value={totalRuns} label="Total Runs" color="green" />
        <QuickStatItem value={totalWickets} label="Total Wickets" color="yellow" />
        <QuickStatItem value={averageBattingAvg} label="Avg Batting" color="purple" />
      </div>
    </div>
  );
};

const QuickStatItem = ({ value, label, color }) => (
  <div>
    <div className={`text-3xl font-bold text-${color}-300 mb-2`}>{value}</div>
    <div className="text-gray-300">{label}</div>
  </div>
);

export default QuickStats;