import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import { CheckSquare, Plus, Trash2, Edit, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/Dialog';
import Input from '../../components/common/Input';
import { toast } from 'sonner';
import { assignmentsService, type Assignment, type AssignmentCreate, type AssignmentUpdate } from '../../services/tasks';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<Assignment | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    deadline: '',
    platform: '',
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await assignmentsService.listAssignments();
      setTasks(data);
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
      toast.error(error.response?.data?.detail || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.subject && task.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAdd = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const data: AssignmentCreate = {
        title: formData.title,
        subject: formData.subject || undefined,
        description: formData.description || undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        platform: formData.platform || undefined,
        status: 'pending',
      };

      await assignmentsService.createAssignment(data);
      toast.success('Task added successfully');
      setShowAddDialog(false);
      setFormData({ title: '', subject: '', description: '', deadline: '', platform: '' });
      loadTasks();
    } catch (error: any) {
      console.error('Add failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to add task');
    }
  };

  const handleEdit = async () => {
    if (!editingTask || !formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const data: AssignmentUpdate = {
        title: formData.title,
        subject: formData.subject || undefined,
        description: formData.description || undefined,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
        platform: formData.platform || undefined,
      };

      await assignmentsService.updateAssignment(editingTask.id, data);
      toast.success('Task updated successfully');
      setEditingTask(null);
      setFormData({ title: '', subject: '', description: '', deadline: '', platform: '' });
      loadTasks();
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to update task');
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await assignmentsService.updateAssignment(id, { status: newStatus as any });
      toast.success('Task status updated');
      loadTasks();
    } catch (error: any) {
      console.error('Status update failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to update status');
    }
  };

  const handleDelete = (id: number) => {
    setTaskToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (taskToDelete) {
      try {
        await assignmentsService.deleteAssignment(taskToDelete);
        toast.success('Task deleted successfully');
        setShowDeleteDialog(false);
        setTaskToDelete(null);
        loadTasks();
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.response?.data?.detail || 'Failed to delete task');
      }
    }
  };

  const openEditDialog = (task: Assignment) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      subject: task.subject || '',
      description: task.description || '',
      deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
      platform: task.platform || '',
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'in_progress':
        return 'info';
      default:
        return 'default';
    }
  };

  const isOverdue = (task: Assignment) => {
    if (!task.deadline || task.status === 'completed') return false;
    return new Date(task.deadline) < new Date();
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
            Tasks & Assignments
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1">
            {tasks.length} tasks total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadTasks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search tasks..."
                value={searchQuery}
                onSearch={setSearchQuery}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-navy-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-navy-400 mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
              No tasks found
            </h3>
            <p className="text-navy-500 dark:text-navy-400 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by adding your first task'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={isOverdue(task) ? 'border-error-300' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold text-navy-900 dark:text-white ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                        {task.title}
                      </h3>
                      {isOverdue(task) && <Badge variant="error">Overdue</Badge>}
                    </div>
                    {task.subject && (
                      <p className="text-sm text-navy-500 dark:text-navy-400 mb-1">{task.subject}</p>
                    )}
                    {task.description && (
                      <p className="text-sm text-navy-600 dark:text-navy-400 mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {task.deadline && (
                        <div className="flex items-center text-sm text-navy-500 dark:text-navy-400">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {format(new Date(task.deadline), 'MMM d, yyyy')}
                        </div>
                      )}
                      <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="px-2 py-1 text-sm rounded border border-navy-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="h-4 w-4 text-error-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog isOpen={showAddDialog || !!editingTask} onOpenChange={() => { setShowAddDialog(false); setEditingTask(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Subject
              </label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Subject (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description (optional)"
                className="flex w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:bg-navy-800 dark:ring-offset-navy-800 dark:placeholder:text-navy-500 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Deadline
                </label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                  Platform
                </label>
                <Input
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="Platform (optional)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setEditingTask(null);
                setFormData({ title: '', subject: '', description: '', deadline: '', platform: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingTask ? handleEdit : handleAdd}>
              {editingTask ? 'Update' : 'Add'} Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600 dark:text-navy-400">
            Are you sure you want to delete this task? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
