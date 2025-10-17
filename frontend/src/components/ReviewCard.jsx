import React from 'react';
import { FaStar } from 'react-icons/fa';

const ReviewCard = ({ name, rating, text }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 w-64 mx-2 flex-shrink-0 transition-transform duration-300 hover:scale-105">
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <div className="flex text-yellow-400 mb-2">
        {[...Array(5)].map((_, i) => (
          <FaStar key={i} className={i < rating ? '' : 'text-gray-300'} />
        ))}
      </div>
      <p className="text-gray-600">{text}</p>
    </div>
  );
};

export default ReviewCard;