const Filters = ({
  selectedRole,
  setSelectedRole,
  playerA,
  setPlayerA,
  playerB,
  setPlayerB,
  selectedTeamId,
  setSelectedTeamId,
  role,
  teams,
  playerStats,
  filteredStats,
  expertise,
  selectedPlayer, 
  setSelectedPlayer 
}) => {
  const filteredPlayerA = filteredStats.filter((player) => player._id !== playerB);
  const filteredPlayerB = filteredStats.filter((player) => player._id !== playerA);

  return (
    <div className="bg-white shadow-xl rounded-3xl p-6 mb-8 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800">Player Comparison & Filters</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
          >
            <option value="">All Players</option>
            {expertise.map((exp) => (
              <option key={exp.id} value={exp.role}>
                {exp.role.charAt(0).toUpperCase() + exp.role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Player A</label>
          <select 
            value={playerA} 
            onChange={(e) => setPlayerA(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
          >
            <option value="">Select Player A</option>
            {filteredPlayerA.map((player) => (
              <option key={player._id} value={player._id}>{player.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Player B</label>
          <select 
            value={playerB} 
            onChange={(e) => setPlayerB(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
          >
            <option value="">Select Player B</option>
            {filteredPlayerB.map((player) => (
              <option key={player._id} value={player._id}>{player.name}</option>
            ))}
          </select>
        </div>

        {role === "admin" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Team</label>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-all"
            >
              <option value="">All Teams</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            View Player Match Performance
          </label>
          <select
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select a player</option>
            {playerStats.map((player) => (
              <option key={player._id} value={player._id}>
                {player.name} ({player.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Filters;