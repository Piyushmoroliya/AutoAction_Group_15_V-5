import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Camera,
  Image as ImageIcon,
  CheckSquare,
  Calendar,
  BookOpen,
  Wallet,
  CalendarDays,
  GraduationCap,
  MessageSquare,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useTheme } from '../../context/ThemeContext';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Capture Screenshot', href: '/capture', icon: Camera },
  { name: 'My Captures', href: '/captures', icon: ImageIcon },
  { name: 'Tasks & Assignments', href: '/tasks', icon: CheckSquare },
  { name: 'Calendar & Reminders', href: '/calendar', icon: Calendar },
  { name: 'Academic Memory', href: '/academic', icon: BookOpen },
  { name: 'Expense Intelligence', href: '/expenses', icon: Wallet },
  { name: 'Events', href: '/events', icon: CalendarDays },
  { name: 'Examinations', href: '/exams', icon: GraduationCap },
  { name: 'AI Assistant', href: '/assistant', icon: MessageSquare },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md dark:bg-navy-800"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-white border-r border-navy-200 dark:bg-navy-900 dark:border-navy-700 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-navy-200 dark:border-navy-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-lg">
                <Camera className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-navy-900 dark:text-white font-bold">AutoAction</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1 rounded hover:bg-navy-100 dark:hover:bg-navy-800"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-navy-600 dark:text-navy-400" />
            ) : (
              <X className="h-5 w-5 text-navy-600 dark:text-navy-400" />
            )}
          </button>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-navy-100 dark:hover:bg-navy-800"
          >
            <X className="h-5 w-5 text-navy-600 dark:text-navy-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'text-navy-700 hover:bg-primary-100 dark:text-navy-200 dark:hover:bg-primary-900/30',
                  isCollapsed && 'justify-center'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', isActive ? 'text-white' : 'text-primary-600')} />
                {!isCollapsed && <span>{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div className="border-t border-navy-200 dark:border-navy-700 p-4">
          <button
            onClick={toggleTheme}
            className={cn(
              'flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-navy-600 hover:bg-navy-50 dark:text-navy-400 dark:hover:bg-navy-800 transition-colors',
              isCollapsed && 'justify-center'
            )}
          >
            {theme === 'light' ? (
              <>
                <span className="h-5 w-5">🌙</span>
                {!isCollapsed && <span>Dark Mode</span>}
              </>
            ) : (
              <>
                <span className="h-5 w-5">☀️</span>
                {!isCollapsed && <span>Light Mode</span>}
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
