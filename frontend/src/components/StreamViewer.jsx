
////////////////////////////////////////////////////////////////////

import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SIGNALING_URL = 'https://sportslytics-2.onrender.com';
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function StreamViewer({ match, onMatchUpdate }) {
  const token = localStorage.getItem('token');
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const [live, setLive] = useState(!!match?.stream?.isLive);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [viewMode, setViewMode] = useState('live');
  const [uploadProgress, setUploadProgress] = useState({});

  // ImageKit URL validation
  const isValidImageKitUrl = (url) => {
    if (!url) return false;
    return url.includes('ik.imagekit.io') || url.includes('imagekit.io');
  };

  const getVideoSource = (stream) => {
    if (!stream.recordingUrl) return null;
    
    if (isValidImageKitUrl(stream.recordingUrl)) {
      return stream.recordingUrl;
    }
    
    if (stream.recordingUrl.startsWith('/')) {
      return `https://sportslytics-2.onrender.com${stream.recordingUrl}`;
    }
    
    return stream.recordingUrl;
  };

  // Update live status when match changes
  useEffect(() => {
    setLive(!!match?.stream?.isLive);
  }, [match?.stream?.isLive]);

  // Socket effects for upload progress
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SIGNALING_URL, { auth: { token } });
    }

    const socket = socketRef.current;

    const handleUploadProgress = (data) => {
      if (data.matchId === match._id) {
        setUploadProgress(prev => ({
          ...prev,
          [data.recordingId]: data.progress
        }));
      }
    };

    const handleUploadComplete = (data) => {
      if (data.matchId === match._id) {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[data.recordingId];
          return newProgress;
        });
        if (onMatchUpdate) onMatchUpdate();
      }
    };

    socket.on('recording_upload_progress', handleUploadProgress);
    socket.on('recording_uploaded', handleUploadComplete);

    return () => {
      socket.off('recording_upload_progress', handleUploadProgress);
      socket.off('recording_uploaded', handleUploadComplete);
    };
  }, [match._id, token, onMatchUpdate]);

  // WebRTC live streaming setup
  useEffect(() => {
    if (!live || viewMode !== 'live') return;

    const socket = io(SIGNALING_URL, { auth: { token } });
    socketRef.current = socket;
    socket.emit('join', { matchId: match._id, as: 'viewer' });

    socket.on('offer', async ({ from, sdp }) => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      pc.ontrack = (e) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
      };
      
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('ice-candidate', { to: from, candidate: e.candidate });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('answer', { to: from, sdp: answer });
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (pcRef.current && candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });

    socket.on('stream-ended', () => {
      setLive(false);
      if (onMatchUpdate) onMatchUpdate();
    });

    return () => {
      socket.disconnect();
      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [live, match._id, token, viewMode]);

  // Get available recordings from pastStreams
  const availableRecordings = match?.pastStreams?.filter(stream => 
    stream.recordingUrl && 
    stream.processed !== false
  ) || [];

  // Sort recordings by start time (newest first)
  const sortedRecordings = [...availableRecordings].sort((a, b) => 
    new Date(b.startedAt) - new Date(a.startedAt)
  );

  return (
    <div className="p-4 border rounded-lg bg-white shadow mt-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-lg font-semibold">Stream & Recordings</h4>
        
        {/* Toggle between live and recordings */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('live')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'live' 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-gray-100 text-gray-700'
            }`}
            disabled={!live}
          >
            Live {live && '🔴'}
          </button>
          <button
            onClick={() => setViewMode('recordings')}
            className={`px-3 py-1 rounded text-sm ${
              viewMode === 'recordings' 
                ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Recordings ({sortedRecordings.length})
          </button>
        </div>
      </div>

      {viewMode === 'live' ? (
        // Live stream mode
        live ? (
          <div>
            <div className="flex items-center mb-2">
              <span className="w-3 h-3 bg-red-600 rounded-full mr-2 animate-pulse"></span>
              <span className="text-red-600 font-semibold">LIVE STREAM</span>
            </div>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              controls
              className="w-full rounded border"
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>📡 Stream is not currently live</p>
            {sortedRecordings.length > 0 && (
              <p className="text-sm mt-1">Switch to Recordings to watch highlights</p>
            )}
          </div>
        )
      ) : (
        // Recordings mode
        <div>
          {sortedRecordings.length > 0 ? (
            <div>
              {/* Recording selector dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Recording:
                </label>
                <select
                  value={selectedRecording !== null ? selectedRecording : ''}
                  onChange={(e) => setSelectedRecording(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full border rounded px-3 py-2 bg-white"
                >
                  <option value="">Choose a recording...</option>
                  {sortedRecordings.map((stream, index) => (
                    <option key={index} value={index}>
                      {new Date(stream.startedAt).toLocaleString()}
                      {stream.endedAt && ` - ${new Date(stream.endedAt).toLocaleTimeString()}`}
                      {stream.fileSize && ` (${Math.round(stream.fileSize / 1024 / 1024)}MB)`}
                      {isValidImageKitUrl(stream.recordingUrl) && ` 🌐`}
                      {uploadProgress[stream.recordingId] > 0 && uploadProgress[stream.recordingId] < 100 && 
                        ` ⏳ ${uploadProgress[stream.recordingId]}%`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload progress for selected recording */}
              {selectedRecording !== null && 
               uploadProgress[sortedRecordings[selectedRecording]?.recordingId] > 0 &&
               uploadProgress[sortedRecordings[selectedRecording]?.recordingId] < 100 && (
                <div className="mb-4 p-3 bg-blue-50 rounded">
                  <div className="flex justify-between text-sm text-blue-700 mb-1">
                    <span>Uploading to ImageKit...</span>
                    <span>{uploadProgress[sortedRecordings[selectedRecording].recordingId]}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[sortedRecordings[selectedRecording].recordingId]}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Video player */}
              {selectedRecording !== null && sortedRecordings[selectedRecording] ? (
                <div>
                  <video
                    key={sortedRecordings[selectedRecording].recordingUrl}
                    src={getVideoSource(sortedRecordings[selectedRecording])}
                    controls
                    className="w-full rounded border"
                    onError={(e) => {
                      console.error('Video playback error:', e);
                      console.log('Failed URL:', sortedRecordings[selectedRecording].recordingUrl);
                    }}
                  />
                  
                  {/* Recording info */}
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <p className="text-gray-600">
                        <strong>Started:</strong> {new Date(sortedRecordings[selectedRecording].startedAt).toLocaleString()}
                      </p>
                      {sortedRecordings[selectedRecording].endedAt && (
                        <p className="text-gray-600">
                          <strong>Ended:</strong> {new Date(sortedRecordings[selectedRecording].endedAt).toLocaleString()}
                        </p>
                      )}
                      {sortedRecordings[selectedRecording].fileSize && (
                        <p className="text-gray-600">
                          <strong>Size:</strong> {Math.round(sortedRecordings[selectedRecording].fileSize / 1024 / 1024)} MB
                        </p>
                      )}
                      <p className="text-gray-600">
                        <strong>Status:</strong> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                          sortedRecordings[selectedRecording].uploadStatus === 'completed' ? 'bg-green-100 text-green-800' :
                          sortedRecordings[selectedRecording].uploadStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sortedRecordings[selectedRecording].uploadStatus || 'Available'}
                        </span>
                      </p>
                    </div>
                    
                    {/* ImageKit info */}
                    {isValidImageKitUrl(sortedRecordings[selectedRecording].recordingUrl) && (
                      <div className="mt-2 p-2 bg-purple-50 rounded border border-purple-200">
                        <p className="text-purple-700 text-xs flex items-center">
                          <span className="mr-1">🌐</span>
                          Served via ImageKit CDN
                          {sortedRecordings[selectedRecording].imagekitFileId && (
                            <span className="ml-2">(ID: {sortedRecordings[selectedRecording].imagekitFileId})</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Select a recording to watch</p>
                  <p className="text-sm mt-1">All recordings are stored in cloud storage</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recordings available yet</p>
              <p className="text-sm mt-1">Recordings will appear here after streaming ends</p>
              
              {/* Show uploads in progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-yellow-700 text-sm">
                    ⏳ Uploads in progress: {Object.keys(uploadProgress).length} recording(s) being processed
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}