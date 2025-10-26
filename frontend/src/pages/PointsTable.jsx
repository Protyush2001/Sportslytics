
import { useEffect, useState } from 'react';
import axios from 'axios';

const PointsTable = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  const token = localStorage.getItem("token");

  useEffect(() => {
  const fetchPointsTable = async () => {
    try {
      const response = await axios.get('http://localhost:3018/api/teams/points-table', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("Points table raw data:", response.data);

      const mappedTeams = response.data.map(team => {

        const name = team.teamName || team.name;
        const wins = team.wins ?? team.won ?? 0;
        const losses = team.losses ?? team.lost ?? 0;
        const matchesPlayed = team.matchesPlayed ?? (wins + losses);
        const points = team.points ?? wins * 2; 

        return {
          name,
          wins,
          losses,
          matchesPlayed,
          points,
        };
      });

  
      const sortedTeams = mappedTeams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.wins - a.wins;
      });

      setTeams(sortedTeams);
    } catch (err) {
      console.error('Error fetching points table:', err);
      setError('Failed to load points table');
    } finally {
      setLoading(false);
    }
  };

  fetchPointsTable();
}, [token]);


  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg text-gray-600">Loading points table...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8 bg-red-50 rounded-lg mx-4">
        <p className="text-lg font-semibold">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Tournament Points Table</h2>
      
 
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Position</th>
                <th className="px-6 py-4 text-left font-semibold">Team</th>
                <th className="px-6 py-4 text-center font-semibold">Played</th>
                <th className="px-6 py-4 text-center font-semibold">Wins</th>
                <th className="px-6 py-4 text-center font-semibold">Losses</th>
                <th className="px-6 py-4 text-center font-semibold">Points</th>
                <th className="px-6 py-4 text-center font-semibold">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(teams) && teams.length > 0 ? (
                teams.map((team, index) => {
                  const winRate = team.matchesPlayed > 0 
                    ? ((team.wins / team.matchesPlayed) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <tr 
                      key={team._id || team.name} 
                      className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                            ${index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-600' : 'bg-gray-300'}
                          `}>
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{team.name}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{team.matchesPlayed ?? 0}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-green-600 font-semibold">{team.wins ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-600 font-semibold">{team.losses ?? 0}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                          {team.points ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-700">{winRate}%</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <p className="text-lg font-medium">No team data available</p>
                      <p className="text-sm">Teams will appear here after matches are played</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      

      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Points System: Win = 2 points, Loss = 0 points</p>
      </div>
    </div>
  );
};

export default PointsTable;