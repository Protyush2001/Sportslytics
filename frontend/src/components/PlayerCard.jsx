import React from "react";

const PlayerCard = ({ player, onUpdate, onDelete }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex flex-col items-center">
      <img
        src={player.image || "https://via.placeholder.com/128?text=No+Image"}
        alt={player.name}
        className="w-32 h-32 object-cover rounded-full border-2 border-gray-200 mb-4"
        onError={(e) => {
          e.target.src = "https://via.placeholder.com/128?text=No+Image";
        }}
      />
      <h2 className="text-xl font-semibold text-gray-900 mb-1">{player.name}</h2>
      <p className="text-sm text-gray-500 mb-3">({player.role})</p>
      <div className="w-full space-y-2 text-gray-600 text-sm">
        <div className="flex justify-between">
          <span className="font-medium">Total Runs:</span>
          <span>{player.runs || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Matches Played:</span>
          <span>{player.matches || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Batting Avg:</span>
          <span>{player.average || 0}</span>
        </div>
        {player.wickets !== undefined && (
          <div className="flex justify-between">
            <span className="font-medium">Wickets:</span>
            <span>{player.wickets}</span>
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => onUpdate(player)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-2 rounded-full shadow hover:from-green-600 hover:to-green-700 transition-all duration-300 font-medium"
        >
          Update
        </button>
        <button
          onClick={() => onDelete(player._id)}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2 rounded-full shadow hover:from-red-600 hover:to-red-700 transition-all duration-300 font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default PlayerCard;