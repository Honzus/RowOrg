import { useUser } from '../hooks/userContext';
import RowerHome from './RowerHome';
import CoachHome from './CoachHome';

export default function RoleHomeRouter() {
  const { user } = useUser();
  if (!user) return null;
  return user.role === 'coach' ? <CoachHome /> : <RowerHome />;
}
