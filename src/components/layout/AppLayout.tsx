import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-navy-900 dark:via-navy-800 dark:to-navy-900">
      <Sidebar />
      <div className="lg:ml-64 min-h-screen">
        <Topbar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
