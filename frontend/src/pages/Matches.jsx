import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MatchForm from "../components/MatchForm";
import ScoreUpdater from "../components/ScoreUpdater";
import CommentaryFeed from "../components/CommentaryFeed";
import StreamViewer from "../components/StreamViewer";
import MatchPrediction from "../components/MatchesPrediction"; 

const BASE_URL = "http://localhost:3018/api/matches";

// Enhanced Video Player Component
const EnhancedVideoPlayer = ({ stream, className = "", style = {} }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef(null);

  const isValidImageKitUrl = (url) => {
    if (!url) return false;
    return url.includes('ik.imagekit.io');
  };

  const getVideoSources = (stream) => {
    if (!stream.recordingUrl) return [];
    
    const sources = [];
    const baseUrl = stream.recordingUrl;
    
    if (isValidImageKitUrl(baseUrl)) {
      sources.push({
        src: baseUrl,
        type: 'video/mp4'
      });
      
      if (stream.imagekitFilePath) {
        const fallbackUrl = `https://ik.imagekit.io/szpbdzzmt${stream.imagekitFilePath}/ik-video.mp4`;
        sources.push({
          src: fallbackUrl,
          type: 'video/mp4'
        });
      }
    } else {
      const url = stream.recordingUrl.startsWith('/') 
        ? `http://localhost:3018${stream.recordingUrl}`
        : stream.recordingUrl;
      
      sources.push({
        src: url,
        type: stream.mimeType || 'video/mp4'
      });
    }
    
    return sources;
  };

  const videoSources = getVideoSources(stream);

  const handleError = (e) => {
    console.error('Video error:', e.target.error);
    setError({
      message: 'Failed to load video',
      currentSource: e.target.currentSrc,
      code: e.target.error?.code
    });
    setLoading(false);
  };

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadedData = () => {
    setLoading(false);
    setError(null);
  };

  const handleRetry = () => {
    if (retryCount >= 2) return;
    
    setRetryCount(prev => prev + 1);
    setError(null);
    setLoading(true);
    
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleOpenInNewTab = () => {
    const url = videoSources[0]?.src;
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!videoSources.length) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={style}>
        <div className="text-center text-gray-500 p-4">
          <p>📹 No Video Available</p>
          <p className="text-sm mt-1">Status: {stream.uploadStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading video...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center z-10 p-4">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold">❌ Video Load Failed</p>
            <p className="text-sm mt-1">{error.message}</p>
            
            <div className="mt-4 flex gap-2 justify-center">
              {retryCount < 2 && (
                <button 
                  onClick={handleRetry}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Retry ({retryCount + 1}/3)
                </button>
              )}
              <button 
                onClick={handleOpenInNewTab}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Open URL
              </button>
            </div>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        key={`${stream.recordingUrl}-${retryCount}`}
        controls
        preload="metadata"
        className={`rounded-lg ${className} ${error ? 'opacity-30' : ''}`}
        style={style}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onCanPlay={handleLoadedData}
      >
        {videoSources.map((source, index) => (
          <source 
            key={index}
            src={source.src} 
            type={source.type}
          />
        ))}
        Your browser does not support the video tag.
      </video>
      
      <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
        <div>
          <span className={isValidImageKitUrl(stream.recordingUrl) ? 'text-purple-600' : 'text-blue-600'}>
            {isValidImageKitUrl(stream.recordingUrl) ? '🌐 ImageKit CDN' : '📁 Local Server'}
          </span>
          {stream.fileSize && (
            <span className="ml-2">
              • {(stream.fileSize / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded text-xs ${
            stream.uploadStatus === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {stream.uploadStatus || 'unknown'}
          </span>
        </div>
      </div>
    </div>
  );
};

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdMatch, setCreatedMatch] = useState(null);
  const [matchStatus, setMatchStatus] = useState("Live");
  const [showForm, setShowForm] = useState(false);
  const [recordingId, setRecordingId] = useState(null);
  const mediaRecorder = useRef(null);
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const localVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useRef(null);
  const [liveUpdates, setLiveUpdates] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiPredictions, setAiPredictions] = useState({});

  const isValidImageKitUrl = (url) => {
    if (!url) return false;
    return url.includes('ik.imagekit.io') || url.includes('imagekit.io');
  };

  useEffect(() => {
    socket.current = io("http://localhost:3018", {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.current.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3018/getAllMatches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(response.data || []);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (!createdMatch || !socket.current) return;

    const matchId = createdMatch._id;
    const ballEventName = `match-${matchId}-ballUpdate`;
    const scoreEventName = `score_update`;

    socket.current.on(ballEventName, (data) => {
      setLiveUpdates((prev) => [...prev, data]);
    });

    socket.current.on(scoreEventName, (data) => {
      if (data.matchId === createdMatch._id) {
        setCreatedMatch(prev => ({
          ...prev,
          currentScore: data.currentScore,
          inningsScores: data.inningsScores,
          status: data.status,
          result: data.result
        }));
      }
    });

    socket.current.on('recording_upload_progress', (data) => {
      if (data.matchId === createdMatch._id) {
        setUploadProgress(data.progress);
      }
    });

    socket.current.on('recording_uploaded', (data) => {
      if (data.matchId === createdMatch._id) {
        setUploadProgress(100);
        setTimeout(() => {
          setUploadProgress(0);
          refreshMatch(createdMatch._id);
        }, 2000);
      }
    });

    socket.current.on('prediction_update', (data) => {
      if (data.matchId === createdMatch._id) {
        setAiPredictions(prev => ({
          ...prev,
          [createdMatch._id]: data
        }));
      }
    });

    return () => {
      socket.current.off(ballEventName);
      socket.current.off(scoreEventName);
      socket.current.off('recording_upload_progress');
      socket.current.off('recording_uploaded');
      socket.current.off('prediction_update');
    };
  }, [createdMatch]);

  const refreshMatch = async (matchId) => {
    try {
      const res = await axios.get(`http://localhost:3018/getAllMatches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const allMatches = res.data || [];
      const currentMatch = allMatches.find(m => m._id === matchId);
      
      if (currentMatch) {
        setCreatedMatch(currentMatch);
        setMatchStatus(currentMatch.status);
      }
      
      setMatches(allMatches);
    } catch (err) {
      console.error("Failed to refresh match:", err);
    }
  };

  const handleMatchCreated = (match) => {
    setCreatedMatch(match);
    setMatchStatus(match.status);
    setShowForm(false);
    fetchMatches();
  };

  const handleScoreUpdated = (updatedMatch) => {
    setCreatedMatch(updatedMatch);
    setMatchStatus(updatedMatch.status);
    fetchMatches();
  };

  const handlePredictionUpdate = (prediction) => {
    if (createdMatch) {
      setAiPredictions(prev => ({
        ...prev,
        [createdMatch._id]: prediction
      }));
    }
  };

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setIsStreaming(true);

      peerConnection.current = new RTCPeerConnection();
      stream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, stream);
      });

      const options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/mp4';
        }
      }

      mediaRecorder.current = new MediaRecorder(stream, options);
      const chunks = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: options.mimeType });
          
          if (blob.size === 0) {
            return;
          }

          const formData = new FormData();
          formData.append('recording', blob, 'recording.webm');
          if (recordingId) {
            formData.append('recordingId', recordingId);
          }

          const uploadRes = await axios.post(
            `http://localhost:3018/api/matches/${createdMatch._id}/uploadRecording`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: (progressEvent) => {
                const progress = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                setUploadProgress(progress);
                
                if (socket.current) {
                  socket.current.emit('recording_upload_progress', {
                    matchId: createdMatch._id,
                    recordingId: recordingId,
                    progress: progress
                  });
                }
              },
            }
          );

          if (socket.current) {
            socket.current.emit('recording_uploaded', {
              matchId: createdMatch._id,
              recordingId: recordingId,
              recordingUrl: uploadRes.data.recordingUrl
            });
          }
          
          await refreshMatch(createdMatch._id);
          setUploadProgress(0);
          
        } catch (error) {
          console.error('ImageKit upload failed:', error);
          setUploadProgress(0);
        }
      };

      mediaRecorder.current.start(1000);

      const startResponse = await axios.post(
        `${BASE_URL}/${createdMatch._id}/start-stream`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (startResponse.data.recordingId) {
        setRecordingId(startResponse.data.recordingId);
      }

      await refreshMatch(createdMatch._id);

    } catch (err) {
      console.error("Error starting stream:", err);
      alert("Failed to start streaming. Please check your camera and microphone permissions.");
      setIsStreaming(false);
    }
  };

  const stopStreaming = async () => {
    try {
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach((track) => {
          track.stop();
        });
        localVideoRef.current.srcObject = null;
      }

      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }

      setIsStreaming(false);

      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      } else {
        await axios.post(
          `${BASE_URL}/${createdMatch._id}/stop-stream`,
          { recordingUrl: null },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await refreshMatch(createdMatch._id);
      }

      setRecordingId(null);

    } catch (err) {
      console.error("Error stopping stream:", err);
    }
  };

  const computeResult = (match) => {
    if (!match.inningsScores || match.inningsScores.length < 2) {
      return match.result || "Result pending";
    }
    
    const firstInnings = match.inningsScores.find(s => s.innings === 1);
    const secondInnings = match.inningsScores.find(s => s.innings === 2);
    
    if (!firstInnings || !secondInnings) {
      return match.result || "Result pending";
    }
    
    const team1Name = getTeamName(match, firstInnings.team);
    const team2Name = getTeamName(match, secondInnings.team);
    
    if (firstInnings.runs > secondInnings.runs) {
      const margin = firstInnings.runs - secondInnings.runs;
      return `${team1Name} won by ${margin} runs`;
    } else if (secondInnings.runs > firstInnings.runs) {
      const maxWickets = (match.teams?.[secondInnings.team]?.players?.length || 11) - 1;
      const remainingWickets = maxWickets - secondInnings.wickets;
      return `${team2Name} won by ${remainingWickets} wickets`;
    } else {
      return "Match tied";
    }
  };

  const formatOvers = (overs, balls) => {
    if (!balls || balls === 0) return `${overs}.0`;
    return `${overs}.${balls}`;
  };

  const getTeamName = (match, teamKey) => {
    if (!match?.teams) return "Unknown Team";

    if (typeof teamKey === "number") {
      const team = match.teams[teamKey];
      if (!team) return `Team ${teamKey + 1}`;
      if (typeof team === "string") {
        return `Team ${teamKey + 1}`;
      }
      return team.name || team.teamName || `Team ${teamKey + 1}`;
    }

    if (typeof teamKey === "string") {
      const teamObj = match.teams.find(
        (team, index) => {
          if (typeof team === "object") {
            return (
              team._id?.toString() === teamKey.toString() ||
              team.teamId?.toString() === teamKey.toString()
            );
          }
          return team.toString() === teamKey.toString();
        }
      );

      if (teamObj) {
        if (typeof teamObj === "object") {
          return teamObj.name || teamObj.teamName || "Unknown Team";
        }
        const teamIndex = match.teams.findIndex(t => 
          (typeof t === "string" ? t : (t._id || t.teamId))?.toString() === teamKey.toString()
        );
        return teamIndex !== -1 ? `Team ${teamIndex + 1}` : "Unknown Team";
      }
    }

    return "Unknown Team";
  };

  const completedMatches = matches.filter((m) => m.status === "Completed");
  const liveMatches = matches.filter(
    (m) => m.status === "Live" && m._id !== createdMatch?._id
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10 px-4 sm:px-6 lg:px-8">
      {/* Create Match Button */}
      {!createdMatch && (
        <div className="text-center mb-10">
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-8 py-3 rounded-full shadow-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg"
          >
            Create New Match
          </button>
        </div>
      )}

      {/* Match Form Modal */}
      {showForm && !createdMatch && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Create New Match</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition-colors"
              >
                ✕
              </button>
            </div>
            <MatchForm onMatchCreated={handleMatchCreated} />
          </div>
        </div>
      )}

      {/* Your Created Match */}
      {createdMatch && (
        <div className="mt-8 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
          <h3 className="text-3xl font-bold text-indigo-600 mb-6">
            {createdMatch.title}
          </h3>

          {/* Match Status */}
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Status:</span>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide ${
                matchStatus === "Completed"
                  ? "bg-green-100 text-green-700"
                  : matchStatus === "Live"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {matchStatus === "Completed" ? "Match Over" : matchStatus}
            </span>
          </div>

          {/* AI Match Prediction Component - ADDED HERE */}
          <MatchPrediction 
            match={createdMatch}
            onPredictionUpdate={handlePredictionUpdate}
            socket={socket.current}
          />

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between text-sm text-blue-700 mb-2">
                <span>📤 Uploading to ImageKit...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Streaming Section */}
          <div className="my-6 p-6 bg-gray-50 rounded-xl shadow-inner">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Live Streaming</h3>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full max-w-3xl rounded-lg border border-gray-200 shadow-md"
              style={{ maxHeight: '400px' }}
            />
            <div className="mt-4 flex flex-wrap gap-4 items-center">
              {!isStreaming ? (
                <button
                  onClick={startStreaming}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full shadow hover:from-green-600 hover:to-green-700 transition-all duration-300"
                >
                  Start Streaming
                </button>
              ) : (
                <>
                  <button
                    onClick={stopStreaming}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-2 rounded-full shadow hover:from-red-600 hover:to-red-700 transition-all duration-300"
                  >
                    Stop Streaming
                  </button>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 font-medium">Recording...</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stream Viewer Component */}
          <StreamViewer 
            match={createdMatch} 
            onMatchUpdate={() => refreshMatch(createdMatch._id)}
          />

          {/* Past Streams */}
          {createdMatch?.pastStreams?.length > 0 && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl shadow-inner">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">
                Past Streams & Highlights
              </h4>
              {createdMatch.pastStreams.map((stream, index) => (
                <div key={stream.recordingId || index} className="mb-6 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-600">
                    Started: {new Date(stream.startedAt).toLocaleString()}
                  </p>
                  {stream.endedAt && (
                    <p className="text-sm text-gray-600">
                      Ended: {new Date(stream.endedAt).toLocaleString()}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stream.uploadStatus === 'completed' ? 'bg-green-100 text-green-800' :
                      stream.uploadStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      stream.uploadStatus === 'pending' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {stream.uploadStatus || 'Unknown'}
                    </span>
                    
                    {stream.recordingUrl && isValidImageKitUrl(stream.recordingUrl) && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🌐 ImageKit CDN
                      </span>
                    )}
                    
                    {stream.uploadProgress !== undefined && stream.uploadProgress < 100 && (
                      <span className="text-sm text-gray-600">
                        {stream.uploadProgress}%
                      </span>
                    )}
                  </div>
                  {stream.recordingUrl && stream.processed ? (
                    <div className="mt-3">
                      <EnhancedVideoPlayer 
                        stream={stream}
                        className="w-full max-w-2xl rounded-lg shadow-md"
                        style={{ maxHeight: '300px' }}
                      />
                      {stream.fileSize && (
                        <p className="text-xs text-gray-500 mt-1">
                          Size: {(stream.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      )}
                    </div>
                  ) : stream.uploadStatus === "pending" || stream.uploadStatus === "processing" ? (
                    <p className="text-yellow-600 text-sm mt-2">
                      ⏳ Processing... {stream.uploadProgress || 0}%
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">
                      Recording not available
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Commentary Feed */}
          {createdMatch && matchStatus === "Live" && (
            <div className="mt-6">
              <CommentaryFeed 
                matchId={createdMatch._id} 
                isLive={true} 
              />
            </div>
          )}

          {/* Current Score / Result Display */}
          {matchStatus !== "Completed" && createdMatch.currentScore ? (
            <div className="mt-6 space-y-6">
              {/* Completed Innings Scores */}
              {createdMatch.inningsScores && createdMatch.inningsScores.length > 0 && (
                <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Innings Summary</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {createdMatch.inningsScores.map((innings, index) => (
                      <div 
                        key={index} 
                        className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-lg font-semibold text-gray-800">
                            {getTeamName(createdMatch, innings.team)} - Innings {innings.innings}
                          </h5>
                          <span className="text-sm text-gray-500">
                            {formatOvers(innings.overs, innings.balls)} overs
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-600">
                          {innings.runs}/{innings.wickets}
                        </p>
                        {innings.runs > 0 && innings.overs > 0 && (
                          <p className="text-sm text-gray-600">
                            Run Rate: {(innings.runs / (innings.overs + innings.balls/6)).toFixed(2)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Innings */}
              <div className="p-6 bg-indigo-50 rounded-xl shadow-inner">
                <h4 className="text-xl font-semibold text-indigo-900 mb-4">
                  Current Innings - Innings {createdMatch.currentScore.innings}
                </h4>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      <span className="font-semibold">
                        {getTeamName(createdMatch, createdMatch.currentScore.team)}
                      </span>{" "}
                      batting
                    </p>
                    <p className="text-3xl font-bold text-indigo-600 mb-2">
                      {createdMatch.currentScore.runs}/{createdMatch.currentScore.wickets}
                    </p>
                    <p className="text-sm text-gray-600">
                      Overs: {formatOvers(createdMatch.currentScore.overs, createdMatch.currentScore.balls)}
                    </p>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {createdMatch.currentScore.runs > 0 && createdMatch.currentScore.overs > 0 && (
                      <>
                        <p>Current RR: {(
                          createdMatch.currentScore.runs / 
                          (createdMatch.currentScore.overs + createdMatch.currentScore.balls/6)
                        ).toFixed(2)}</p>
                        {createdMatch.currentScore.innings === 2 && createdMatch.inningsScores.length > 0 && (
                          <p>Required RR: {(() => {
                            const target = createdMatch.inningsScores[0].runs + 1;
                            const remaining = createdMatch.overs - (createdMatch.currentScore.overs + createdMatch.currentScore.balls/6);
                            const required = target - createdMatch.currentScore.runs;
                            return remaining > 0 ? (required / remaining).toFixed(2) : '0.00';
                          })()}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {createdMatch.currentScore.innings === 2 && createdMatch.inningsScores.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-100">
                    <p className="text-center text-gray-700">
                      <span className="font-semibold">Target: </span>
                      {createdMatch.inningsScores[0].runs + 1} runs
                      <span className="text-sm text-gray-500 ml-2">
                        (Need {Math.max(0, createdMatch.inningsScores[0].runs + 1 - createdMatch.currentScore.runs)} more runs)
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : matchStatus?.toLowerCase() === "completed" ? (
            <div className="mt-6 space-y-6">
              {/* Final Scoreboard */}
              {createdMatch.inningsScores && createdMatch.inningsScores.length > 0 && (
                <div className="p-6 bg-gray-50 rounded-xl shadow-inner">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Final Scoreboard</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {createdMatch.inningsScores.map((innings, index) => (
                      <div 
                        key={index} 
                        className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="text-lg font-semibold text-gray-800">
                            {getTeamName(createdMatch, innings.team)} - Innings {innings.innings}
                          </h5>
                          <span className="text-sm text-gray-500">
                            {formatOvers(innings.overs, innings.balls)} overs
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-600 mb-2">
                          {innings.runs}/{innings.wickets}
                        </p>
                        {innings.runs > 0 && innings.overs > 0 && (
                          <p className="text-sm text-gray-600">
                            Run Rate: {(innings.runs / (innings.overs + innings.balls/6)).toFixed(2)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Match Result */}
              <div className="p-6 bg-green-50 rounded-xl shadow-inner text-center">
                <h4 className="text-xl font-semibold text-green-900 mb-2">Match Result</h4>
                <p className="text-xl font-bold text-green-700 mb-4">
                  {createdMatch.result || computeResult(createdMatch)}
                </p>
                <button
                  onClick={async () => {
                    try {
                      const computed = computeResult(createdMatch);
                      const winner = computed.includes("won by")
                        ? computed.split(" won by")[0]
                        : null;

                      if (!winner) {
                        alert("Unable to determine winner automatically.");
                        return;
                      }

                      await axios.post(
                        `http://localhost:3018/api/matches/${createdMatch._id}/matchResult`,
                        { winnerTeamName: winner },
                        { headers: { Authorization: `Bearer ${token}` } }
                      );

                      await refreshMatch(createdMatch._id);
                      alert("Match result finalized and team points updated.");
                    } catch (err) {
                      console.error("Error finalizing match:", err);
                      alert("Failed to finalize match.");
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full shadow hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold"
                >
                  Finalize Result & Update Points
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl shadow-inner text-center">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Match Setup</h4>
              <p className="text-gray-500">Waiting for match to start...</p>
            </div>
          )}

          {/* Score Updater */}
          {matchStatus !== "Completed" && createdMatch.currentScore && (
            <ScoreUpdater
              match={createdMatch}
              onScoreUpdated={handleScoreUpdated}
            />
          )}

          {/* Live Updates Feed */}
          {liveUpdates.length > 0 && (
            <div className="mt-6 p-6 bg-gray-50 rounded-xl shadow-inner">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Live Updates</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {liveUpdates.slice(-5).map((update, index) => (
                  <p key={index} className="text-sm text-gray-600 bg-white p-3 rounded-lg shadow-sm">
                    {JSON.stringify(update)}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Live Matches
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {liveMatches.map((match) => (
              <div
                key={match._id}
                className="p-6 bg-white rounded-xl shadow-lg border border-red-50 hover:shadow-xl transition-shadow duration-300"
              >
                <h3 className="text-lg font-bold text-red-600">{match.title}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Status: <span className="font-semibold">{match.status}</span>
                </p>
                {match.currentScore && (
                  <div className="text-sm">
                    <p className="text-gray-700">
                      <span className="font-semibold">
                        {getTeamName(match, match.currentScore.team)}
                      </span>{" "}
                      batting: {match.currentScore.runs}/{match.currentScore.wickets} (
                      {formatOvers(match.currentScore.overs, match.currentScore.balls)} overs)
                    </p>
                  </div>
                )}
                <StreamViewer 
                  match={match} 
                  onMatchUpdate={fetchMatches}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Matches List */}
      {completedMatches.length > 0 && (
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Completed Matches
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {completedMatches.map((match) => (
              <div
                key={match._id}
                className="p-6 bg-white rounded-xl shadow-lg border border-gray-50 hover:shadow-xl transition-shadow duration-300"
              >
                <h3 className="text-lg font-bold text-indigo-600">{match.title}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Result: <span className="font-semibold">{match.result || "Match completed"}</span>
                </p>
                
                {/* ImageKit Recordings */}
                {match.pastStreams?.length > 0 ? (
                  <div className="space-y-3">
                    {match.pastStreams
                      .filter(stream => stream.recordingUrl && stream.processed)
                      .slice(0, 2)
                      .map((stream, index) => (
                      <div key={stream.recordingId || index} className="border-t pt-3">
                        <p className="text-xs text-gray-500">
                          {new Date(stream.startedAt).toLocaleString()}
                          {isValidImageKitUrl(stream.recordingUrl) && (
                            <span className="ml-1 text-purple-500">🌐</span>
                          )}
                        </p>
                        {stream.recordingUrl && stream.processed ? (
                          <EnhancedVideoPlayer 
                            stream={stream}
                            className="w-full rounded-lg shadow-md mt-2"
                            style={{ maxHeight: '200px' }}
                          />
                        ) : (
                          <p className="text-sm text-gray-500 mt-1">
                            {stream.uploadStatus === 'pending' ? 'Processing...' : 'No recording available'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No highlights available</p>
                )}
                
                <CommentaryFeed 
                  matchId={match._id} 
                  isLive={false} 
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center mt-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-gray-500 mt-2 text-lg font-medium">
            Loading matches...
          </p>
        </div>
      )}
    </div>
  );
};

export default Matches;