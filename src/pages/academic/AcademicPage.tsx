import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import { BookOpen, Plus, Trash2, Eye, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/Dialog';
import Input from '../../components/common/Input';
import { toast } from 'sonner';
import { academicService, type AcademicMaterial, type AcademicMaterialCreate } from '../../services/academic';

export default function AcademicPage() {
  const [academicMaterials, setAcademicMaterials] = useState<AcademicMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<AcademicMaterial | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    subtopic: '',
    content: '',
    summary: '',
    explanation: '',
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await academicService.listAcademicMaterials();
      setAcademicMaterials(data);
    } catch (error: any) {
      console.error('Failed to load materials:', error);
      toast.error(error.response?.data?.detail || 'Failed to load materials');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = academicMaterials.filter((material) => {
    const matchesSearch =
      material.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.content && material.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = subjectFilter === 'all' || material.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  const subjects = Array.from(new Set(academicMaterials.map((m) => m.subject)));

  const handleAdd = async () => {
    if (!formData.subject || !formData.topic) {
      toast.error('Subject and topic are required');
      return;
    }

    try {
      const data: AcademicMaterialCreate = {
        subject: formData.subject,
        topic: formData.topic,
        subtopic: formData.subtopic || undefined,
        content: formData.content || undefined,
        summary: formData.summary || undefined,
        explanation: formData.explanation || undefined,
      };

      await academicService.createAcademicMaterial(data);
      toast.success('Academic material added successfully');
      setShowAddDialog(false);
      setFormData({ subject: '', topic: '', subtopic: '', content: '', summary: '', explanation: '' });
      loadMaterials();
    } catch (error: any) {
      console.error('Add failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to add material');
    }
  };

  const handleDelete = (id: number) => {
    setMaterialToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (materialToDelete) {
      try {
        await academicService.deleteAcademicMaterial(materialToDelete);
        toast.success('Material deleted successfully');
        setShowDeleteDialog(false);
        setMaterialToDelete(null);
        loadMaterials();
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.response?.data?.detail || 'Failed to delete material');
      }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Academic Memory
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1">
            {academicMaterials.length} materials saved
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMaterials}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput placeholder="Search materials..." value={searchQuery} onSearch={setSearchQuery} />
            </div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-navy-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-navy-400 mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">No materials found</h3>
            <p className="text-navy-500 dark:text-navy-400 mb-4">Start by adding your first academic material</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <Badge variant="info" className="w-fit mb-2">{material.subject}</Badge>
                <CardTitle className="text-base">{material.topic}</CardTitle>
                {material.subtopic && <p className="text-sm text-navy-500 dark:text-navy-400">{material.subtopic}</p>}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-navy-600 dark:text-navy-400 line-clamp-3 mb-4">
                  {material.content || material.summary || 'No content'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedMaterial(material)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(material.id)}>
                    <Trash2 className="h-4 w-4 text-error-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedMaterial && (
        <Dialog isOpen={!!selectedMaterial} onOpenChange={() => setSelectedMaterial(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedMaterial.topic}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Badge variant="info">{selectedMaterial.subject}</Badge>
              {selectedMaterial.subtopic && <p className="text-sm text-navy-500 dark:text-navy-400">{selectedMaterial.subtopic}</p>}
              {selectedMaterial.content && (
                <div>
                  <p className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Content</p>
                  <p className="text-sm text-navy-900 dark:text-white bg-navy-50 dark:bg-navy-800 p-3 rounded-lg whitespace-pre-wrap">{selectedMaterial.content}</p>
                </div>
              )}
              {selectedMaterial.summary && (
                <div>
                  <p className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Summary</p>
                  <p className="text-sm text-navy-900 dark:text-white bg-navy-50 dark:bg-navy-800 p-3 rounded-lg">{selectedMaterial.summary}</p>
                </div>
              )}
              {selectedMaterial.explanation && (
                <div>
                  <p className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Explanation</p>
                  <p className="text-sm text-navy-900 dark:text-white bg-navy-50 dark:bg-navy-800 p-3 rounded-lg">{selectedMaterial.explanation}</p>
                </div>
              )}
              <p className="text-xs text-navy-500 dark:text-navy-400">Added on {format(new Date(selectedMaterial.created_at), 'MMM d, yyyy')}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMaterial(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog isOpen={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Academic Material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Subject *</label>
                <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="e.g., Data Structures" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Topic *</label>
                <Input value={formData.topic} onChange={(e) => setFormData({ ...formData, topic: e.target.value })} placeholder="e.g., Binary Search Trees" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Subtopic</label>
              <Input value={formData.subtopic} onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })} placeholder="e.g., Tree Traversals" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Content</label>
              <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Your notes..." className="flex w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:bg-navy-800 dark:ring-offset-navy-800 dark:placeholder:text-navy-500 min-h-[120px]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Summary</label>
              <textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Brief summary..." className="flex w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:bg-navy-800 dark:ring-offset-navy-800 dark:placeholder:text-navy-500 min-h-[80px]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Explanation</label>
              <textarea value={formData.explanation} onChange={(e) => setFormData({ ...formData, explanation: e.target.value })} placeholder="Detailed explanation..." className="flex w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:bg-navy-800 dark:ring-offset-navy-800 dark:placeholder:text-navy-500 min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Material</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Material</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600 dark:text-navy-400">Are you sure you want to delete this material? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
