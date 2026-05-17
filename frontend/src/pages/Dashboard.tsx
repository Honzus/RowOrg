import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe, logout } from '../api/auth';
import type { User } from '../types';
import TeamSetup from './TeamSetup';
import ProfileSetup from './ProfileSetup';
import CoachDashboard from './CoachDashboard';
import RowerDashboard from './RowerDashboard';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  if (loading) return <p>Loading...</p>;
  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Step 1: Need to join/create a team
  if (!user.team) {
    return <TeamSetup onComplete={loadUser} />;
  }

  // Step 2: Need to complete profile (select role)
  if (!user.role) {
    return <ProfileSetup user={user} onComplete={loadUser} />;
  }

  return (
    <div className="dashboard">
      <header>
        <h1>RowOrg</h1>
        <span>Welcome, {user.first_name || user.email}</span>
        <button onClick={handleLogout}>Logout</button>
      </header>
      {user.role === 'coach' ? (
        <CoachDashboard user={user} />
      ) : (
        <RowerDashboard user={user} />
      )}
    </div>
  );
}
