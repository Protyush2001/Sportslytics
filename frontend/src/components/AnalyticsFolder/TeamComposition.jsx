


const TeamComposition = ({ playerStats, expertise }) => {
  return (
    <div className="bg-white shadow-xl rounded-3xl p-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800">Team Composition</h2>
      </div>
      
      <div className="space-y-4">
        {expertise.map((exp) => {
          const roleCount = playerStats.filter(player => player.role === exp.role).length;
          const percentage = playerStats.length > 0 ? (roleCount / playerStats.length * 100).toFixed(1) : 0;
          return (
            <div key={exp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                <span className="font-medium text-gray-700 capitalize">{exp.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">{roleCount}</span>
                <span className="text-sm text-gray-500">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamComposition;
