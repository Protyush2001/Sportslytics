


const PerformanceInsights = ({ filteredStats }) => {
  if (filteredStats.length === 0) {
    return (
      <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800">Performance Insights</h2>
        </div>
        <p className="text-gray-500 text-center">No data available</p>
      </div>
    );
  }

  const topScorer = filteredStats.reduce((prev, current) => 
    (prev.runs || 0) > (current.runs || 0) ? prev : current
  );

  const topBowler = filteredStats.reduce((prev, current) => 
    (prev.wickets || 0) > (current.wickets || 0) ? prev : current
  );

  const bestAverage = filteredStats.reduce((prev, current) => 
    (prev.average || 0) > (current.average || 0) ? prev : current
  );

  return (
    <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800">Performance Insights</h2>
      </div>
      
      <div className="space-y-4">
        <InsightCard
          title="Top Performer"
          player={topScorer}
          value={`${topScorer.runs || 0} runs`}
          gradient="from-blue-50 to-indigo-50"
          border="border-blue-200"
          color="blue"
        />
        
        <InsightCard
          title="Best Bowler"
          player={topBowler}
          value={`${topBowler.wickets || 0} wickets`}
          gradient="from-green-50 to-emerald-50"
          border="border-green-200"
          color="green"
        />
        
        <InsightCard
          title="Highest Average"
          player={bestAverage}
          value={`${bestAverage.average || 0} avg`}
          gradient="from-purple-50 to-pink-50"
          border="border-purple-200"
          color="purple"
        />
      </div>
    </div>
  );
};

const InsightCard = ({ title, player, value, gradient, border, color }) => (
  <div className={`bg-gradient-to-r ${gradient} p-4 rounded-2xl border ${border}`}>
    <h3 className={`font-semibold text-${color}-800 mb-2`}>{title}</h3>
    <p className={`text-${color}-700`}>
      <span className="font-bold">{player.name}</span> - {value}
    </p>
  </div>
);

export default PerformanceInsights;
