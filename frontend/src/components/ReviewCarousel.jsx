
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ReviewCard from "./ReviewCard";

const AUTO_SCROLL_INTERVAL = 4000;
const cardsPerPage = 4;

const ReviewCarousel = () => {
  const [reviews, setReviews] = useState([
    { name: "Alice", rating: 5, text: "Amazing experience!" },
    { name: "Bob", rating: 4, text: "Very good, will recommend." },
    { name: "Charlie", rating: 3, text: "It was okay." },
    { name: "Diana", rating: 5, text: "Loved it!" },
    { name: "Ethan", rating: 2, text: "Not great." },
    { name: "Fiona", rating: 4, text: "Pretty solid overall." },
    { name: "George", rating: 1, text: "Would not recommend." },
    { name: "Hannah", rating: 5, text: "Perfect in every way!" },
  ]);

  const [index, setIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReview, setNewReview] = useState({ name: "", rating: 5, text: "" });

  const handlePrev = () => {
    setIndex((prev) =>
      prev - cardsPerPage < 0 ? reviews.length - cardsPerPage : prev - cardsPerPage
    );
  };

  const handleNext = () => {
    setIndex((prev) =>
      prev + cardsPerPage >= reviews.length ? 0 : prev + cardsPerPage
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(interval);
  }, [reviews]);

  const visibleReviews = reviews.slice(index, index + cardsPerPage);

  // const handleAddReview = () => {
  //   if (newReview.name && newReview.text) {
  //     setReviews((prev) => [...prev, newReview]);
  //     setNewReview({ name: "", rating: 5, text: "" });
  //     setIsModalOpen(false);
  //   }
  // };
 const handleAddReview = async () => {
  if (newReview.name && newReview.text) {
    try {
      const response = await fetch('https://sportslytics-2.onrender.com/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          name: newReview.name,
          text: newReview.text,
          rating: newReview.rating
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const savedReview = await response.json();
      setReviews((prev) => [...prev, { user: newReview.user, ...savedReview }]);
      setNewReview({ user: "", rating: 5, text: "" });
      setIsModalOpen(false);
    } catch (err) {
      console.error('Review submission error:', err.message);
      alert('Could not submit review. Please try again.');
    }
  }
};



  return (
    <div className="w-full flex flex-col items-center">

      <div className="flex items-center justify-between w-full max-w-6xl mb-4 px-4">
        <button
          onClick={handlePrev}
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50"
        >
          <FaChevronLeft />
        </button>

        <div className="overflow-hidden w-full flex justify-center">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={index}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex gap-4"
            >
              {visibleReviews.map((review, i) => (
                <ReviewCard key={i} {...review} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          onClick={handleNext}
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50"
        >
          <FaChevronRight />
        </button>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        ⭐ Rate Us
      </button>


      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Add Your Review</h2>
            <input
              type="text"
              placeholder="Your Name"
              value={newReview.name}
              onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
              className="w-full p-2 border rounded mb-3"
            />
            <select
              value={newReview.rating}
              onChange={(e) =>
                setNewReview({ ...newReview, rating: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded mb-3"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} Stars
                </option>
              ))}
            </select>
            <textarea
              placeholder="Your Review"
              value={newReview.text}
              onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
              className="w-full p-2 border rounded mb-3"
              rows="3"
            ></textarea>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAddReview}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewCarousel;
