import React from "react";

const PredictionPanel = ({ prediction, currentScore }) => {
  if (!prediction && !currentScore) return null;

  return (
    <div className="my-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl shadow-sm">
      <h3 className="text-lg font-semibold mb-3 text-blue-700">
        Match Insights
      </h3>

      {currentScore && (
        <p className="text-gray-800 font-medium">
          🏏 Current Score:{" "}
          <span className="font-bold text-gray-900">{currentScore}</span>
        </p>
      )}

      {prediction && (
        <p className="mt-2 text-gray-700">
          🔮 <span className="font-medium">AI Prediction:</span>{" "}
          <span className="italic">{prediction}</span>
        </p>
      )}
    </div>
  );
};

export default PredictionPanel;
