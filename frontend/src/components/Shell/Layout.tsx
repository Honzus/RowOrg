import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileTabs from './MobileTabs';

export default function Layout() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <TopBar />
        <div className="content">
          <Outlet />
        </div>
      </main>
      <MobileTabs />
    </div>
  );
}
