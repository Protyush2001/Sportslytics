import { useEffect, useState } from "react";
import axios from "axios";
import { FaUsers, FaChartLine, FaCalendarAlt,FaUserEdit,FaGamepad, FaShieldAlt } from "react-icons/fa";
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    activePlayers: 0,
    upcomingMatches: 0,
  });

  
  const [users, setUsers] = useState([]); 
  const [matches, setMatches] = useState([]); 
  const [showUsers, setShowUsers] = useState(false);
const [showMatches, setShowMatches] = useState(false);
const [pendingUsers, setPendingUsers] = useState([]);
const [showPending, setShowPending] = useState(false);



  const token = localStorage.getItem("token");

  const handleEditUser = async (userId) => {
  const newRole = prompt("Enter new role for this user (admin, player, team_owner):");
  if (!newRole) return;

  try {
    await axios.patch(`http://localhost:3018/admin/user/${userId}`, { role: newRole }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert("User role updated successfully");
 
    const res = await axios.get("http://localhost:3018/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUsers(res.data);
  } catch (err) {
    console.error("Failed to update user:", err);
    alert("Error updating user");
  }
};

const handleControlMatch = async (matchId) => {
  const action = prompt("Enter action: 'delete' or 'update-status'");
  if (action === "delete") {
    try {
      await axios.delete(`http://localhost:3018/admin/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Match deleted");
      const res = await axios.get("http://localhost:3018/admin/matches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(res.data);
    } catch (err) {
      console.error("Failed to delete match:", err);
      alert("Error deleting match");
    }
  } else if (action === "update-status") {
    const newStatus = prompt("Enter new status (Upcoming, Live, Completed):");
    if (!newStatus) return;
    try {
      await axios.patch(`http://localhost:3018/matches/${matchId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Match status updated");
      const res = await axios.get("http://localhost:3018/admin/matches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(res.data);
    } catch (err) {
      console.error("Failed to update match:", err);
      alert("Error updating match");
    }
  }
};

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:3018/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      }
    };

      const fetchDetails = async () => {
      try {
        const [userRes, matchRes] = await Promise.all([
          axios.get("http://localhost:3018/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:3018/admin/matches", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const pendingRes = await axios.get("http://localhost:3018/admin/pending-users", {
  headers: { Authorization: `Bearer ${token}` },
});
setPendingUsers(pendingRes.data);
        setUsers(userRes.data);
        setMatches(matchRes.data);
      } catch (err) {
        console.error("Failed to fetch users or matches:", err);
      }
    };


    fetchStats();
    fetchDetails();
  }, [token]);

  const handleApproveUser = async (userId) => {
  try {
    await axios.patch(`http://localhost:3018/admin/approve-user/${userId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("User approved");
    setPendingUsers(pendingUsers.filter(u => u._id !== userId));
  } catch (err) {
    console.error("Approval failed:", err);
    toast.error("Failed to approve user");
  }
};

const handleRejectUser = async (userId) => {
  try {
    await axios.patch(`http://localhost:3018/admin/reject-user/${userId}`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.info("User rejected");
    setPendingUsers(pendingUsers.filter(u => u._id !== userId));
  } catch (err) {
    console.error("Rejection failed:", err);
    toast.error("Failed to reject user");
  }
};

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashboardCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<FaUsers className="text-blue-600 text-2xl" />}
        />
        <DashboardCard
          title="Active Players"
          value={stats.activePlayers}
          icon={<FaShieldAlt className="text-green-600 text-2xl" />}
        />
        <DashboardCard
          title="Total Matches"
          value={stats.totalMatches}
          icon={<FaChartLine className="text-purple-600 text-2xl" />}
        />
        <DashboardCard
          title="Upcoming Matches"
          value={stats.upcomingMatches}
          icon={<FaCalendarAlt className="text-yellow-600 text-2xl" />}
        />
      </div>



           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

         <ManagementPanel title="User Management" description="View, edit, or remove users.">
    <button
      onClick={() => setShowUsers(!showUsers)}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
    >
      {showUsers ? "Hide Users" : "Manage Users"}
    </button>

    {showUsers && (
      <ul className="mt-4 text-sm text-gray-700 space-y-2">
        {users.map((user) => (
          <li key={user._id} className="flex justify-between items-center">
            <span>{user.username} ({user.role})</span>
            <FaUserEdit
              className="text-blue-500 cursor-pointer hover:text-blue-700"
              onClick={() => handleEditUser(user._id)}
            />
          </li>
        ))}
      </ul>
    )}
  </ManagementPanel>
 



  <ManagementPanel title="Match Control" description="Monitor match activity.">
    <button
      onClick={() => setShowMatches(!showMatches)}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
    >
      {showMatches ? "Hide Matches" : "Manage Matches"}
    </button>

    {showMatches && (
      <ul className="mt-4 text-sm text-gray-700 space-y-2">
        {matches.map((match) => (
          <li key={match._id} className="flex justify-between items-center">
            <span>{match.title} — {match.status}</span>
            <FaGamepad
              className="text-green-500 cursor-pointer hover:text-green-700"
              onClick={() => handleControlMatch(match._id)}
            />
          </li>
        ))}
      </ul>
    )}
  </ManagementPanel>

  {/* <ManagementPanel title="Team Owner Approvals" description="Approve or reject pending team owner requests.">
  <button
    onClick={() => setShowPending(!showPending)}
    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
  >
    {showPending ? "Hide Requests" : "Review Requests"}
  </button>

  {showPending && (
    <ul className="mt-4 text-sm text-gray-700 space-y-2">
      {pendingUsers.map((user) => (
        <li key={user._id} className="flex justify-between items-center">
          <span>{user.username} (requested: {user.requestedRole})</span>
          <div className="space-x-2">
            <button
              onClick={() => handleApproveUser(user._id)}
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
            >
              Approve
            </button>
            <button
              onClick={() => handleRejectUser(user._id)}
              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  )}
</ManagementPanel> */}

      </div>

    </div>
  );
};

const DashboardCard = ({ title, value, icon }) => (
  <div className="bg-white shadow-md rounded-lg p-6 flex items-center justify-between hover:shadow-lg transition">
    <div>
      <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
    {icon}
  </div>
);

const ManagementPanel = ({ title, description, children }) => (
  <div className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition">
    <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-600 mb-4">{description}</p>
    {children}
  </div>
);

export default AdminDashboard;