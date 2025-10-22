

const StatsCards = ({ filteredStats }) => {
  const totalRuns = filteredStats.reduce((sum, player) => sum + (player.runs || 0), 0);
  const totalWickets = filteredStats.reduce((sum, player) => sum + (player.wickets || 0), 0);
  const averageBattingAvg = filteredStats.length > 0
    ? (filteredStats.reduce((sum, player) => sum + (player.average || 0), 0) / filteredStats.length).toFixed(2)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <StatCard
        title="Batting Stats"
        icon={
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        }
        gradient="from-blue-50 to-indigo-50"
        border="border-blue-200"
        iconBg="bg-blue-500"
        items={[
          { label: "Total Runs:", value: totalRuns, color: "text-blue-600" },
          { label: "Average Batting:", value: averageBattingAvg, color: "text-blue-600" }
        ]}
      />

      <StatCard
        title="Bowling Insights"
        icon={
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        }
        gradient="from-green-50 to-emerald-50"
        border="border-green-200"
        iconBg="bg-green-500"
        items={[
          { label: "Total Wickets:", value: totalWickets, color: "text-green-600" }
        ]}
      />

      <StatCard
        title="Team Overview"
        icon={
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        gradient="from-purple-50 to-pink-50"
        border="border-purple-200"
        iconBg="bg-purple-500"
        items={[
          { label: "Players Analyzed:", value: filteredStats.length, color: "text-purple-600" }
        ]}
      />
    </div>
  );
};

const StatCard = ({ title, icon, gradient, border, iconBg, items }) => (
  <div className={`bg-gradient-to-br ${gradient} border ${border} shadow-lg rounded-3xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-105`}>
    <div className="flex items-center gap-4 mb-4">
      <div className={`${iconBg} p-3 rounded-2xl`}>
        {icon}
      </div>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
    </div>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-gray-600">{item.label}</span>
          <span className={`font-bold ${item.color} text-2xl`}>{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default StatsCards;