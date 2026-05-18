import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/userContext';

interface Props {
  needsTeam?: boolean;
  needsRole?: boolean;
}

export default function RequireAuth({ needsTeam = true, needsRole = true }: Props) {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-2)' }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (needsTeam && !user.team) {
    return <Navigate to="/onboarding/team" replace />;
  }

  if (needsRole && user.team && !user.role) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <Outlet />;
}
