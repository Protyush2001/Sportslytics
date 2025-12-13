
import { useState, useEffect } from 'react';
import axios from 'axios';

const MatchesPrediction = ({ match, onPredictionUpdate, socket }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictionType, setPredictionType] = useState('pre_match');
  const [isLiveMode, setIsLiveMode] = useState(false);

  const token = localStorage.getItem("token");

  // Listen for live prediction updates via socket
  useEffect(() => {
    if (!socket || !match) return;

    const handleLivePrediction = (data) => {
      console.log('Live prediction update:', data);
      setPrediction(prev => ({
        ...prev,
        ...data,
        isLive: true
      }));
    };

    socket.on('live_prediction_update', handleLivePrediction);

    return () => {
      socket.off('live_prediction_update', handleLivePrediction);
    };
  }, [socket, match]);

  // Auto-generate live prediction on ball updates
  useEffect(() => {
    if (isLiveMode && match?.commentary?.length > 0) {
      // Debounce to avoid too many API calls
      const timeoutId = setTimeout(() => {
        generateLivePrediction();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [match?.commentary?.length, isLiveMode]);

  const generatePrediction = async (type = 'pre_match') => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = type === 'pre_match' 
        ? '/api/predictions/predict-match' 
        : type === 'in_match'
        ? '/api/predictions/predict-in-match'
        : '/api/predictions/predict-live';

      const response = await axios.post(
        `https://sportslytics-2.onrender.com${endpoint}`,
        { 
          matchId: match._id,
          predictionType: type
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPrediction({
        ...response.data,
        isLive: type === 'live'
      });
      onPredictionUpdate?.(response.data);
      
    } catch (err) {
      console.error('Prediction error:', err);
      setError(err.response?.data?.msg || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const generateLivePrediction = async () => {
    try {
      const response = await axios.post(
        `https://sportslytics-2.onrender.com/api/predictions/predict-live`,
        { 
          matchId: match._id
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPrediction({
        ...response.data,
        isLive: true
      });
      
    } catch (err) {
      console.error('Live prediction error:', err);
      // Don't show error for live updates to avoid spam
    }
  };

  const toggleLiveMode = () => {
    const newMode = !isLiveMode;
    setIsLiveMode(newMode);
    if (newMode) {
      generateLivePrediction();
    }
  };

  const getWinProbabilityColor = (probability) => {
    if (probability >= 70) return 'text-green-600';
    if (probability >= 60) return 'text-green-500';
    if (probability >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMomentumColor = (momentum) => {
    switch (momentum?.toLowerCase()) {
      case 'strong positive': return 'bg-green-500';
      case 'positive': return 'bg-green-300';
      case 'neutral': return 'bg-yellow-300';
      case 'negative': return 'bg-red-300';
      case 'strong negative': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getTeamName = (index) => {
    if (match.teams && match.teams[index]) {
      return match.teams[index].name || `Team ${index + 1}`;
    }
    return `Team ${index + 1}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          🎯 AI Match Prediction 
          {prediction?.isLive && (
            <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full animate-pulse">
              LIVE
            </span>
          )}
        </h3>
        
        <div className="flex gap-2">
          {/* Live Mode Toggle */}
          <button
            onClick={toggleLiveMode}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              isLiveMode 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isLiveMode ? '🔴 Live' : '⚪ Live'}
          </button>

          <select 
            value={predictionType}
            onChange={(e) => setPredictionType(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
            disabled={isLiveMode}
          >
            <option value="pre_match">Pre-match</option>
            <option value="in_match">In-match</option>
            <option value="live">Live Update</option>
          </select>
          
          <button
            onClick={() => generatePrediction(isLiveMode ? 'live' : predictionType)}
            disabled={loading || isLiveMode}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : isLiveMode ? (
              'Auto Updating'
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {prediction && (
        <div className="space-y-6">
          {/* Win Probability with Team Names - DYNAMIC BARS */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[0, 1].map((index) => {
              const teamKey = `team${index + 1}`;
              const probability = prediction.win_probability?.[teamKey] || 0;
              
              return (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-600 mb-1">
                    {getTeamName(index)}
                  </div>
                  <div className={`text-2xl font-bold ${getWinProbabilityColor(probability)}`}>
                    {probability}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                    <div 
                      className="h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${probability}%`,
                        backgroundColor: probability >= 60 ? '#10b981' : 
                                        probability >= 40 ? '#f59e0b' : '#ef4444'
                      }}
                    ></div>
                  </div>
                  {prediction.isLive && (
                    <div className="text-xs text-gray-500 mt-1">
                      Updated live
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Momentum Indicator */}
          {prediction.momentum && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-blue-800">📈 Current Momentum</h4>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${getMomentumColor(prediction.momentum)}`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {prediction.momentum}
                  </span>
                </div>
              </div>
              {prediction.recent_run_rate > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Recent RR: {prediction.recent_run_rate} | 
                  {prediction.required_run_rate && ` Required RR: ${prediction.required_run_rate}`}
                </p>
              )}
            </div>
          )}

          {/* Prediction Analysis */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-800 mb-2">
              {prediction.isLive ? '🔄 Live Analysis' : '📊 Match Analysis'}
            </h4>
            <p className="text-indigo-700 leading-relaxed">{prediction.prediction}</p>
          </div>

          {/* Confidence Level */}
          {prediction.confidence && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <span className="text-sm font-medium text-gray-700">Confidence Level:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                {prediction.confidence} Confidence
              </span>
            </div>
          )}

          {/* Key Factors */}
          {prediction.key_factors && prediction.key_factors.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-3">
                {prediction.isLive ? '🎯 Live Factors' : '🔑 Key Factors'}
              </h4>
              <ul className="space-y-2">
                {prediction.key_factors.map((factor, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">•</span>
                    <span className="text-orange-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* No prediction state */}
      {!prediction && !loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <p className="text-lg font-medium mb-2">AI Match Prediction</p>
          <p className="text-sm">Get live updates or pre-match analysis</p>
          <p className="text-sm">Enable Live mode for automatic ball-by-ball updates</p>
        </div>
      )}
    </div>
  );
};

export default MatchesPrediction;