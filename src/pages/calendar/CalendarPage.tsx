import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { ChevronLeft, ChevronRight, Bell, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/Dialog';
import Input from '../../components/common/Input';
import { toast } from 'sonner';
import { remindersService, type Reminder, type ReminderCreate } from '../../services/calendar';
import { notificationService } from '../../services/notifications';

export default function CalendarPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_time: '',
  });

  useEffect(() => {
    loadReminders();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      console.log('Notification permission granted');
    }
  };

  const loadReminders = async () => {
    try {
      setIsLoading(true);
      const data = await remindersService.listReminders();
      setReminders(data);
      // Schedule notifications for upcoming reminders
      data.forEach((reminder) => {
        if (reminder.status !== 'sent' && new Date(reminder.reminder_time) > new Date()) {
          notificationService.scheduleReminder(
            reminder.title,
            new Date(reminder.reminder_time),
            reminder.description || ''
          );
        }
      });
    } catch (error: any) {
      console.error('Failed to load reminders:', error);
      toast.error(error.response?.data?.detail || 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayReminders = (date: Date) => {
    return reminders.filter((r) => isSameDay(new Date(r.reminder_time), date));
  };

  const handleAddReminder = async () => {
    if (!formData.title || !formData.reminder_time) {
      toast.error('Title and time are required');
      return;
    }

    try {
      const data: ReminderCreate = {
        title: formData.title,
        description: formData.description || undefined,
        reminder_time: new Date(formData.reminder_time).toISOString(),
      };

      await remindersService.createReminder(data);
      toast.success('Reminder added successfully');
      setShowAddDialog(false);
      setSelectedDate(null);
      setFormData({ title: '', description: '', reminder_time: '' });
      loadReminders();
    } catch (error: any) {
      console.error('Add failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to add reminder');
    }
  };

  const handleCompleteReminder = async (id: number) => {
    try {
      await remindersService.updateReminder(id, { status: 'sent' });
      toast.success('Reminder marked as complete');
      loadReminders();
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to update reminder');
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await remindersService.deleteReminder(id);
      toast.success('Reminder deleted successfully');
      loadReminders();
    } catch (error: any) {
      console.error('Delete failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete reminder');
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowAddDialog(true);
    setFormData({ ...formData, reminder_time: format(date, 'yyyy-MM-dd') + 'T09:00' });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Calendar & Reminders
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1">
            {format(currentDate, 'MMMM yyyy')} • {reminders.length} reminders
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReminders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-navy-500 dark:text-navy-400 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date) => {
              const dayReminders = getDayReminders(date);
              const hasReminders = dayReminders.length > 0;
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isDayToday = isToday(date);

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => handleDayClick(date)}
                  className={`
                    relative p-2 min-h-[80px] rounded-lg border transition-colors
                    ${isCurrentMonth
                      ? 'bg-white dark:bg-navy-800 border-navy-200 dark:border-navy-700 hover:bg-navy-50 dark:hover:bg-navy-700'
                      : 'bg-navy-50 dark:bg-navy-900 border-transparent opacity-50'
                    }
                    ${isDayToday ? 'ring-2 ring-primary-500' : ''}
                  `}
                >
                  <span className={`text-sm ${isDayToday ? 'font-bold text-primary-600' : 'text-navy-900 dark:text-white'}`}>
                    {format(date, 'd')}
                  </span>
                  {hasReminders && (
                    <div className="mt-1 space-y-1">
                      {dayReminders.slice(0, 2).map((reminder) => (
                        <div
                          key={reminder.id}
                          className={`text-xs px-1 py-0.5 rounded truncate ${
                            reminder.status === 'sent'
                              ? 'bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-400 line-through'
                              : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                          }`}
                        >
                          {reminder.title}
                        </div>
                      ))}
                      {dayReminders.length > 2 && (
                        <div className="text-xs text-navy-500 dark:text-navy-400">
                          +{dayReminders.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reminders
              .filter((r) => r.status !== 'sent' && new Date(r.reminder_time) >= new Date())
              .sort((a, b) => new Date(a.reminder_time).getTime() - new Date(b.reminder_time).getTime())
              .slice(0, 5)
              .map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg border border-navy-200 dark:border-navy-700">
                  <div className="flex-1">
                    <p className="font-medium text-navy-900 dark:text-white">{reminder.title}</p>
                    <p className="text-sm text-navy-500 dark:text-navy-400">
                      {format(new Date(reminder.reminder_time), 'MMM d, yyyy • h:mm a')}
                    </p>
                    {reminder.description && (
                      <p className="text-sm text-navy-600 dark:text-navy-400 mt-1">{reminder.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleCompleteReminder(reminder.id)}>
                      ✓
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteReminder(reminder.id)}>
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            {reminders.filter((r) => r.status !== 'sent' && new Date(r.reminder_time) >= new Date()).length === 0 && (
              <p className="text-center text-navy-500 dark:text-navy-400 py-4">
                No upcoming reminders
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Reminder Dialog */}
      <Dialog isOpen={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Reminder {selectedDate ? `for ${format(selectedDate, 'MMM d, yyyy')}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Date & Time *
              </label>
              <Input
                type="datetime-local"
                value={formData.reminder_time}
                onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Reminder title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details (optional)"
                className="flex w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:bg-navy-800 dark:ring-offset-navy-800 dark:placeholder:text-navy-500 min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReminder}>
              Add Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
