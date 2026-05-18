import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './hooks/useUser';
import RequireAuth from './components/RequireAuth';
import Layout from './components/Shell/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import TeamSetup from './pages/TeamSetup';
import RoleHomeRouter from './pages/RoleHomeRouter';
import RowerLineups from './pages/RowerLineups';
import RowerAvailability from './pages/RowerAvailability';
import CoachSessions from './pages/CoachSessions';
import SessionDetail from './pages/SessionDetail';
import CoachPlan from './pages/CoachPlan';
import CoachCrews from './pages/CoachCrews';
import CoachPrefs from './pages/CoachPrefs';
import TeamRoster from './pages/TeamRoster';
import Regattas from './pages/Regattas';

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<RequireAuth needsTeam={false} needsRole={false} />}>
            <Route path="/onboarding/team" element={<TeamSetup />} />
            <Route path="/onboarding/profile" element={<ProfileSetup />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<RoleHomeRouter />} />
              <Route path="/lineups" element={<RowerLineups />} />
              <Route path="/availability" element={<RowerAvailability />} />
              <Route path="/sessions" element={<CoachSessions />} />
              <Route path="/sessions/:id" element={<SessionDetail />} />
              <Route path="/plan" element={<CoachPlan />} />
              <Route path="/crews" element={<CoachCrews />} />
              <Route path="/team" element={<TeamRoster />} />
              <Route path="/preferences" element={<CoachPrefs />} />
              <Route path="/regattas" element={<Regattas />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
