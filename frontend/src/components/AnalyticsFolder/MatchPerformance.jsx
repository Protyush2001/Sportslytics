import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MatchPerformance = ({ playerId, playerName }) => {
  const [matchPerformances, setMatchPerformances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem("token");

  const fetchMatchPerformances = async () => {
    if (!playerId) return;
    
    try {
      setLoading(true);
      setError('');
      
      
      const response = await axios.get(`https://sportslytics-2.onrender.com/api/players/${playerId}/match-performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMatchPerformances(response.data);
    } catch (err) {
      console.error('Error fetching match performances:', err);
      setError('Failed to load match performances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchPerformances();
  }, [playerId]);

  const getPerformanceColor = (runs, wickets, isBatting) => {
    if (isBatting) {
      if (runs >= 50) return 'bg-green-50 border-green-200';
      if (runs >= 30) return 'bg-blue-50 border-blue-200';
      return 'bg-gray-50 border-gray-200';
    } else {
      if (wickets >= 3) return 'bg-green-50 border-green-200';
      if (wickets >= 2) return 'bg-blue-50 border-blue-200';
      return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!playerId) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Match Performance</h3>
        <p className="text-gray-500 text-center py-4">Select a player to view match performances</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">🎯 Match Performance</h3>
        <button
          onClick={fetchMatchPerformances}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {playerName && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
          <h4 className="font-semibold text-indigo-800">Player: {playerName}</h4>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading match performances...</p>
        </div>
      ) : matchPerformances.length > 0 ? (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {matchPerformances.map((match, index) => (
            <div
              key={match._id || index}
              className={`border rounded-lg p-4 ${getPerformanceColor(
                match.batting?.runs || 0,
                match.bowling?.wickets || 0,
                match.role === 'batsman'
              )}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{match.matchTitle}</h4>
                  <p className="text-sm text-gray-600">{formatDate(match.matchDate)}</p>
                  <p className="text-xs text-gray-500">vs {match.opponent}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  match.result === 'won' ? 'bg-green-100 text-green-800' :
                  match.result === 'lost' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {match.result || 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-3">
             
                <div className="text-center">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">🏏 Batting</h5>
                  {match.batting ? (
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-gray-800">
                        {match.batting.runs || 0}/{match.batting.wickets || 0}
                      </p>
                      <p className="text-xs text-gray-600">
                        {match.batting.balls || 0} balls • SR: {match.batting.strikeRate || 0}
                      </p>
                      {match.batting.fours > 0 && (
                        <p className="text-xs text-blue-600">{match.batting.fours} fours</p>
                      )}
                      {match.batting.sixes > 0 && (
                        <p className="text-xs text-green-600">{match.batting.sixes} sixes</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Did not bat</p>
                  )}
                </div>

               
                <div className="text-center">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">🎯 Bowling</h5>
                  {match.bowling ? (
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-gray-800">
                        {match.bowling.wickets || 0}/{match.bowling.runs || 0}
                      </p>
                      <p className="text-xs text-gray-600">
                        {match.bowling.overs || 0} overs • Econ: {match.bowling.economy || 0}
                      </p>
                      {match.bowling.maidens > 0 && (
                        <p className="text-xs text-purple-600">{match.bowling.maidens} maidens</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Did not bowl</p>
                  )}
                </div>
              </div>

             
              {(match.fielding?.catches > 0 || match.fielding?.runOuts > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">👐 Fielding</h5>
                  <div className="flex justify-center space-x-4 text-xs">
                    {match.fielding.catches > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {match.fielding.catches} catch{match.fielding.catches !== 1 ? 'es' : ''}
                      </span>
                    )}
                    {match.fielding.runOuts > 0 && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {match.fielding.runOuts} run out{match.fielding.runOuts !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No match performances found</p>
          <p className="text-sm">This player hasn't played any matches yet</p>
        </div>
      )}

      {matchPerformances.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Showing {matchPerformances.length} match{matchPerformances.length !== 1 ? 'es' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchPerformance;