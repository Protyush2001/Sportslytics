import React from "react";

const VideoStream = ({
  isStreaming,
  startStreaming,
  stopStreaming,
  localVideoRef,
}) => {
  return (
    <div className="my-6 p-6 bg-gray-50 rounded-2xl shadow-inner">
      <h3 className="text-xl font-semibold mb-4">🎥 Live Streaming</h3>

      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="w-full max-w-3xl rounded-lg border shadow"
        style={{ maxHeight: "400px" }}
      />

      <div className="mt-4 flex gap-4">
        {!isStreaming ? (
          <button
            onClick={startStreaming}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all"
          >
            Start Streaming
          </button>
        ) : (
          <button
            onClick={stopStreaming}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
          >
            Stop Streaming
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoStream;
