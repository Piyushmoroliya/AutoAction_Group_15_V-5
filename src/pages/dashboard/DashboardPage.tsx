import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Camera, CheckSquare, Calendar, Wallet, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import { capturesService } from '../../services/captures';
import { assignmentsService } from '../../services/tasks';
import { expensesService } from '../../services/expenses';
import { analyticsService } from '../../services/analytics';
import { useAuth } from '../../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [totalCaptures, setTotalCaptures] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [recentCaptures, setRecentCaptures] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Load captures
      const captures = await capturesService.listCaptures(0, 4);
      setTotalCaptures(captures.length);
      setRecentCaptures(captures);

      // Load tasks
      const tasks = await assignmentsService.listAssignments(0, 100);
      const pending = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
      setPendingTasks(pending);

      const deadlines = tasks
        .filter((t) => t.deadline && new Date(t.deadline) >= new Date())
        .sort((a, b) => (a.deadline && b.deadline ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime() : 0))
        .slice(0, 5);
      setUpcomingDeadlines(deadlines);

      // Load expenses for this month
      const expenses = await expensesService.listExpenses(0, 100);
      const now = new Date();
      const currentMonthExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.transaction_date || e.created_at);
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      });
      const total = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      setMonthlyExpenses(total);

      // Load upcoming events
      const eventsData = await analyticsService.getUpcomingEvents(30);
      setUpcomingEvents(eventsData.count);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-navy-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-navy-600 dark:text-navy-300 mt-1 font-medium">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link to="/capture">
            <Button className="shadow-xl shadow-primary-500/30">
              <Camera className="h-4 w-4 mr-2" />
              Capture Screenshot
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-0 shadow-xl shadow-primary-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Total Captures
            </CardTitle>
            <Camera className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCaptures}</div>
            <p className="text-xs text-white/80 mt-1">
              Screenshots processed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white border-0 shadow-xl shadow-secondary-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Pending Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendingTasks}</div>
            <p className="text-xs text-white/80 mt-1">
              Tasks to complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success-500 to-success-600 text-white border-0 shadow-xl shadow-success-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Upcoming Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{upcomingEvents}</div>
            <p className="text-xs text-white/80 mt-1">
              Events this month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning-500 to-warning-600 text-white border-0 shadow-xl shadow-warning-500/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Monthly Expenses
            </CardTitle>
            <Wallet className="h-4 w-4 text-white" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              ₹{monthlyExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-white/80 mt-1">
              Total spending this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/capture">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center border-primary-300 hover:bg-primary-50 text-primary-700 dark:border-primary-600 dark:hover:bg-primary-900/30 dark:text-primary-300">
                <Camera className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Upload Screenshot</span>
              </Button>
            </Link>
            <Link to="/tasks">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center border-secondary-300 hover:bg-secondary-50 text-secondary-700 dark:border-secondary-600 dark:hover:bg-secondary-900/30 dark:text-secondary-300">
                <CheckSquare className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Add Task</span>
              </Button>
            </Link>
            <Link to="/academic">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center border-success-300 hover:bg-success-50 text-success-700 dark:border-success-600 dark:hover:bg-success-900/30 dark:text-success-300">
                <TrendingUp className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Academic Memory</span>
              </Button>
            </Link>
            <Link to="/assistant">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center border-accent-300 hover:bg-accent-50 text-accent-700 dark:border-accent-600 dark:hover:bg-accent-900/30 dark:text-accent-300">
                <AlertCircle className="h-6 w-6 mb-2" />
                <span className="text-sm font-medium">Ask AI Assistant</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Captures */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Captures</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCaptures.length === 0 ? (
              <div className="text-center py-8 text-navy-500 dark:text-navy-400">
                No captures yet. Start by uploading a screenshot.
              </div>
            ) : (
              <div className="space-y-3">
                {recentCaptures.map((capture) => (
                  <div
                    key={capture.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
                  >
                    <div className="h-12 w-12 rounded bg-navy-100 dark:bg-navy-700 flex items-center justify-center">
                      <Camera className="h-6 w-6 text-navy-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 dark:text-white truncate">
                        {capture.filename}
                      </p>
                      <p className="text-xs text-navy-600 dark:text-navy-300 font-medium">
                        {format(new Date(capture.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge variant={capture.processing_status === 'completed' ? 'success' : 'warning'}>
                      {capture.processing_status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDeadlines.length === 0 ? (
              <div className="text-center py-8 text-navy-500 dark:text-navy-400">
                No upcoming deadlines. Great job!
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 dark:text-white truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-navy-600 dark:text-navy-300 font-medium">
                        {task.subject}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-navy-900 dark:text-white">
                        {task.deadline ? format(new Date(task.deadline), 'MMM d') : ''}
                      </p>
                      <Badge variant={task.status === 'pending' ? 'info' : 'default'}>
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
