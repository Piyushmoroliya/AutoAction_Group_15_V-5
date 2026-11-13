import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { GraduationCap, Plus, Trash2, MapPin, Clock, CalendarDays, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/Dialog';
import Input from '../../components/common/Input';
import { toast } from 'sonner';
import { examsService, type Exam, type ExamCreate } from '../../services/exams';

export default function ExamsPage() {
  const [examinations, setExaminations] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [examToDelete, setExamToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    exam_date: '',
    exam_time: '',
    room_venue: '',
  });

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setIsLoading(true);
      const data = await examsService.listExams();
      setExaminations(data);
    } catch (error: any) {
      console.error('Failed to load exams:', error);
      toast.error(error.response?.data?.detail || 'Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingExams = examinations.filter((e) => new Date(e.exam_date) >= new Date());
  const pastExams = examinations.filter((e) => new Date(e.exam_date) < new Date());

  const handleAdd = async () => {
    if (!formData.subject || !formData.exam_date) {
      toast.error('Subject and date are required');
      return;
    }

    try {
      const data: ExamCreate = {
        subject: formData.subject,
        exam_date: new Date(formData.exam_date).toISOString(),
        exam_time: formData.exam_time || undefined,
        room_venue: formData.room_venue || undefined,
      };

      await examsService.createExam(data);
      toast.success('Examination added successfully');
      setShowAddDialog(false);
      setFormData({ subject: '', exam_date: '', exam_time: '', room_venue: '' });
      loadExams();
    } catch (error: any) {
      console.error('Add failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to add examination');
    }
  };

  const handleDelete = (id: number) => {
    setExamToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (examToDelete) {
      try {
        await examsService.deleteExam(examToDelete);
        toast.success('Examination deleted successfully');
        setShowDeleteDialog(false);
        setExamToDelete(null);
        loadExams();
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.response?.data?.detail || 'Failed to delete examination');
      }
    }
  };

  const ExamCard = ({ exam }: { exam: Exam }) => {
    const isUpcoming = new Date(exam.exam_date) >= new Date();
    return (
      <Card className={isUpcoming ? 'border-primary-200' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-navy-900 dark:text-white">{exam.subject}</h3>
                {isUpcoming && <Badge variant="warning">Upcoming</Badge>}
              </div>
              <div className="space-y-1 text-sm text-navy-500 dark:text-navy-400">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {format(new Date(exam.exam_date), 'MMMM d, yyyy')}
                </div>
                {exam.exam_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {exam.exam_time}
                  </div>
                )}
                {exam.room_venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {exam.room_venue}
                  </div>
                )}
              </div>
            </div>
            <div className="ml-4">
              <Button variant="ghost" size="sm" onClick={() => handleDelete(exam.id)}>
                <Trash2 className="h-4 w-4 text-error-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Examinations</h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1">{examinations.length} examinations total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadExams}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Examination
          </Button>
        </div>
      </div>

      {upcomingExams.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-3">Upcoming Examinations</h2>
          <div className="space-y-3">{upcomingExams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}</div>
        </div>
      )}

      {pastExams.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-3">Past Examinations</h2>
          <div className="space-y-3">{pastExams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}</div>
        </div>
      )}

      {examinations.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-navy-400 mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">No examinations yet</h3>
            <p className="text-navy-500 dark:text-navy-400 mb-4">Start by adding your first examination</p>
          </CardContent>
        </Card>
      )}

      <Dialog isOpen={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Examination</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Subject *</label>
              <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Subject name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Date *</label>
              <Input type="date" value={formData.exam_date} onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Time</label>
              <Input type="time" value={formData.exam_time} onChange={(e) => setFormData({ ...formData, exam_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Venue</label>
              <Input value={formData.room_venue} onChange={(e) => setFormData({ ...formData, room_venue: e.target.value })} placeholder="Exam venue" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Examination</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Examination</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600 dark:text-navy-400">Are you sure you want to delete this examination? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
