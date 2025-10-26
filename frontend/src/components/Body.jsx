


import { Link } from "react-router-dom";

const Body = () => {

  return (
    <section className="home-main max-w-7xl mx-auto px-6 py-16">
    
      <div className="hero text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
          Unlock the Power of <span className="text-blue-600">Sports Analytics</span>
        </h1>
        <p className="text-gray-600 mt-6 max-w-3xl mx-auto text-lg">
          Track live scores, analyze player performance, and make data-driven decisions — all in one platform.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl shadow-lg text-lg font-semibold transform hover:scale-105 transition duration-300">
              Get Started
            </button>
          </Link>

          <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-50 transition">
            Learn More
          </button>
        </div>
      </div>


      <div className="features grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
        {[
          { icon: '📊', title: 'Real-Time Insights', desc: 'Live match tracking and player stats.' },
          { icon: '🧠', title: 'Smart Analytics', desc: 'Performance breakdowns across formats and venues.' },
          { icon: '🔍', title: 'Advanced Search', desc: 'Filter players by team, format, or match history.' },
          { icon: '🛡️', title: 'Role-Based Access', desc: 'Tailored dashboards for admins, players, and team owners.' }
        ].map((feature, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition duration-300 text-center"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Body;
