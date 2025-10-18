import React from "react";

const BestPlaying11 = ({ bestTeam, onGenerateTeam, isGenerating }) => {
  const fieldPositions = [
    { top: "90%", left: "50%" },  // wicketkeeper
    { top: "75%", left: "42%" },  // slip 1
    { top: "75%", left: "58%" },  // slip 2
    { top: "55%", left: "30%" },  // point
    { top: "55%", left: "70%" },  // cover
    { top: "35%", left: "20%" },  // mid-off
    { top: "35%", left: "80%" },  // mid-on
    { top: "20%", left: "50%" },  // bowler
    { top: "10%", left: "30%" },  // long off
    { top: "10%", left: "70%" },  // long on
    { top: "5%", left: "50%" },   // extra deep fielder
  ];

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        Best Playing 11 on Field
      </h2>

      <button
        onClick={onGenerateTeam}
        disabled={isGenerating}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-full hover:scale-105 transition mb-6 disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "Generate Best Team"}
      </button>

      {bestTeam.length > 0 ? (
        <div className="relative w-full aspect-[4/3] bg-green-700 rounded-2xl overflow-hidden shadow-xl">
          <img
            src="https://www.shutterstock.com/image-photo/cricket-field-top-view-pitch-600nw-2593340443.jpg"
            alt="Cricket Ground"
            className="absolute inset-0 w-full h-full object-contain bg-black"
          />

          <div className="absolute inset-0 bg-black/10" />

          {bestTeam.map((player, index) => {
            const pos = fieldPositions[index] || { top: "50%", left: "50%" };
            return (
              <div
                key={index}
                className="absolute text-center transform -translate-x-1/2 -translate-y-1/2"
                style={{ top: pos.top, left: pos.left }}
              >
                <div className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-full px-4 py-2 text-xs shadow-md hover:shadow-lg hover:scale-105 transition-transform">
                  <p className="font-semibold text-gray-800">{player.name}</p>
                  <p className="text-[11px] text-gray-600">{player.role}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-4">
          <p>Click the button to generate the best playing 11.</p>
          <p className="text-sm mt-1">
            Based on performance, role balance, and match conditions.
          </p>
        </div>
      )}
    </div>
  );
};

export default BestPlaying11;