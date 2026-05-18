import {
  Home,
  Calendar,
  Anchor,
  Users,
  Zap,
  Filter,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  X,
  Search,
  Settings,
  Bell,
  Trophy,
  Grid3x3,
  List,
  Menu,
  Sun,
  Moon,
  Play,
  Flag,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

const map: Record<string, LucideIcon> = {
  home: Home,
  calendar: Calendar,
  boat: Anchor,
  users: Users,
  bolt: Zap,
  filter: Filter,
  chevL: ChevronLeft,
  chevR: ChevronRight,
  plus: Plus,
  check: Check,
  x: X,
  search: Search,
  settings: Settings,
  bell: Bell,
  trophy: Trophy,
  grid: Grid3x3,
  list: List,
  menu: Menu,
  sun: Sun,
  moon: Moon,
  play: Play,
  flag: Flag,
  logout: LogOut,
};

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 14, className }: Props) {
  const Component = map[name];
  if (!Component) return null;
  return <Component size={size} strokeWidth={1.8} className={className} />;
}
