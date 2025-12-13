import { useState, useEffect, useRef } from 'react';
import axios from "axios"
import { io } from "socket.io-client";

const CommentaryFeed = ({ matchId, isLive = true }) => {
  const [commentary, setCommentary] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const commentaryEndRef = useRef(null);

  const scrollToBottom = () => {
    commentaryEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [commentary]);

  useEffect(() => {
    if (!matchId) return;


    const fetchCommentary = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`https://sportslytics-2.onrender.com/api/matches/${matchId}/commentary`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        

        const commentaryData = Array.isArray(response.data) ? response.data : [];
        setCommentary(commentaryData);
      } catch (error) {
        console.error('Error fetching commentary:', error);
        setCommentary([]); 
      }
    };

    fetchCommentary();


    const socket = io('https://sportslytics-2.onrender.com');
    socket.emit('join_match', matchId);

    socket.on('ball_update', (data) => {
      if (data.commentary) {
        setCommentary(prev => {
          const newCommentary = Array.isArray(prev) ? [...prev] : [];
          return [...newCommentary, data.commentary];
        });
      }
      if (data.aiInsights) {
        setAiInsights(data.aiInsights);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [matchId]);

  const formatBallNumber = (ball) => {
    if (!ball) return '0.0';
    return `${ball.over || 0}.${ball.ball || 0}`;
  };

  const getEventIcon = (event) => {
    if (!event) return '•';
    if (event.isWicket) return '🎯';
    if (event.runs === 4) return '🔴';
    if (event.runs === 6) return '💥';
    if (event.runs > 0) return '🏃';
    return '•';
  };


  const reversedCommentary = Array.isArray(commentary) 
    ? [...commentary].reverse() 
    : [];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        🎙️ Live Commentary
        {isLive && <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">LIVE</span>}
      </h3>


      {aiInsights && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤖</span>
            <span className="font-semibold text-blue-800">AI Insight</span>
          </div>
          <p className="text-sm text-blue-700">
            Momentum: <span className="font-medium">{aiInsights.momentum || 'Neutral'}</span>
            {aiInsights.keyPlayers && ` | Key: ${aiInsights.keyPlayers.keyBatsman || 'TBD'}`}
          </p>
          {aiInsights.winProbability && (
            <p className="text-xs text-blue-600 mt-1">
              Win Probability: Team 1: {aiInsights.winProbability.team1 || 50}% | Team 2: {aiInsights.winProbability.team2 || 50}%
            </p>
          )}
        </div>
      )}


      <div className="space-y-3">
        {reversedCommentary.length > 0 ? (
          reversedCommentary.map((ball, index) => (
            <div key={index} className="border-l-4 border-green-500 pl-3 py-2 bg-gray-50 rounded-r">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getEventIcon(ball.event)}</span>
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                    {formatBallNumber(ball.ballNumber)}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {ball.timestamp ? new Date(ball.timestamp).toLocaleTimeString() : '--:--'}
                </span>
              </div>
              
              <p className="text-sm text-gray-800 mb-1">{ball.commentary || 'No commentary available'}</p>
              
              <div className="text-xs text-gray-600 flex flex-wrap gap-2">
                <span>Batsman: {ball.batsman?.name || 'Unknown'} ({ball.batsman?.runs || 0})</span>
                <span>Bowler: {ball.bowler?.name || 'Unknown'}</span>
                {ball.event?.runs > 0 && (
                  <span className="font-semibold text-green-600">
                    {ball.event.runs} run{ball.event.runs !== 1 ? 's' : ''}
                  </span>
                )}
                {ball.event?.isWicket && (
                  <span className="font-semibold text-red-600">
                    Wicket! ({ball.event.wicketType || 'unknown'})
                  </span>
                )}
                {ball.event?.extras && (
                  <span className="font-semibold text-orange-600">
                    {ball.event.extras}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No commentary yet. Match starting soon...</p>
          </div>
        )}
        
        <div ref={commentaryEndRef} />
      </div>


    </div>
  );
};

export default CommentaryFeed;