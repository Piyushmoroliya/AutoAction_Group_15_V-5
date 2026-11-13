import { Bell, Search, User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useLocation } from 'react-router';

interface TopbarProps {
  className?: string;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/capture': 'Capture Screenshot',
  '/captures': 'My Captures',
  '/tasks': 'Tasks & Assignments',
  '/calendar': 'Calendar & Reminders',
  '/academic': 'Academic Memory',
  '/expenses': 'Expense Intelligence',
  '/events': 'Events',
  '/exams': 'Examinations',
  '/assistant': 'AI Assistant',
  '/settings': 'Settings',
};

export default function Topbar({ className }: TopbarProps) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'AutoAction';

  return (
    <header className={cn('h-16 border-b border-navy-200 bg-white/80 dark:border-navy-700 dark:bg-navy-900/80 backdrop-blur-sm shadow-sm', className)}>
      <div className="flex h-full items-center justify-between px-6">
        {/* Title */}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-navy-900 dark:text-white">{title}</h1>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-500" />
            <input
              type="search"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 rounded-lg border border-primary-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-primary-600 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-400"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
            <Bell className="h-5 w-5 text-navy-700 dark:text-navy-200" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-error-500 rounded-full shadow-sm" />
          </button>

          {/* User avatar */}
          <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-md">
              <User className="h-4 w-4 text-white" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
