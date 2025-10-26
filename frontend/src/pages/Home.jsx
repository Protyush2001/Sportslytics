

import Body from "../components/Body";
import ReviewCarousel from "../components/ReviewCarousel";

const Home = () => {
  return (
    <div className="bg-gray-50 min-h-screen">

      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 text-center shadow-md">
        <h1 className="text-4xl md:text-5xl font-extrabold">🏏 Cricket Analytics App</h1>
        <p className="text-lg mt-3 max-w-2xl mx-auto">
          Track Live, Upcoming & Completed Matches in Real-Time
        </p>
      </header>


      <Body />

      {/* Review Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            What Our Users Say
          </h2>
          <ReviewCarousel />
        </div>
      </section>
    </div>
  );
};

export default Home;

