import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import { Camera, Trash2, Eye, RefreshCw } from 'lucide-react';
import { CAPTURE_CATEGORIES } from '../../constants/categories';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/Dialog';
import { toast } from 'sonner';
import { capturesService, type Capture } from '../../services/captures';

export default function CapturesListPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [captureToDelete, setCaptureToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadCaptures();
  }, []);

  const loadCaptures = async () => {
    try {
      setIsLoading(true);
      const data = await capturesService.listCaptures();
      setCaptures(data);
    } catch (error: any) {
      console.error('Failed to load captures:', error);
      toast.error(error.response?.data?.detail || 'Failed to load captures');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCaptures = captures.filter((capture) => {
    const matchesSearch =
      capture.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (capture.ocr_text && capture.ocr_text.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || capture.predicted_category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || capture.processing_status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleView = (capture: Capture) => {
    setSelectedCapture(capture);
  };

  const handleDelete = (id: number) => {
    setCaptureToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (captureToDelete) {
      try {
        await capturesService.deleteCapture(captureToDelete);
        toast.success('Capture deleted successfully');
        setShowDeleteDialog(false);
        setCaptureToDelete(null);
        loadCaptures();
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.response?.data?.detail || 'Failed to delete capture');
      }
    }
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'N/A';
    const labels: Record<string, string> = {
      [CAPTURE_CATEGORIES.PAYMENT]: 'Payment',
      [CAPTURE_CATEGORIES.ASSIGNMENT]: 'Assignment',
      [CAPTURE_CATEGORIES.ACADEMIC]: 'Academic',
      [CAPTURE_CATEGORIES.EVENT]: 'Event',
      [CAPTURE_CATEGORIES.EXAMINATION]: 'Examination',
      [CAPTURE_CATEGORIES.OTHER]: 'Other',
    };
    return labels[category] || category;
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
            My Captures
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1">
            {captures.length} screenshots processed
          </p>
        </div>
        <Button variant="outline" onClick={loadCaptures}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search captures..."
                value={searchQuery}
                onSearch={setSearchQuery}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-navy-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              >
                <option value="all">All Categories</option>
                <option value={CAPTURE_CATEGORIES.PAYMENT}>Payment</option>
                <option value={CAPTURE_CATEGORIES.ASSIGNMENT}>Assignment</option>
                <option value={CAPTURE_CATEGORIES.ACADEMIC}>Academic</option>
                <option value={CAPTURE_CATEGORIES.EVENT}>Event</option>
                <option value={CAPTURE_CATEGORIES.EXAMINATION}>Examination</option>
                <option value={CAPTURE_CATEGORIES.OTHER}>Other</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-navy-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Captures Grid */}
      {filteredCaptures.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Camera className="h-12 w-12 mx-auto text-navy-400 mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
              No captures found
            </h3>
            <p className="text-navy-500 dark:text-navy-400 mb-4">
              {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by capturing your first screenshot'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCaptures.map((capture) => (
            <Card key={capture.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base truncate">{capture.filename}</CardTitle>
                    <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
                      {format(new Date(capture.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant={capture.processing_status === 'completed' ? 'success' : 'warning'}>
                    {capture.processing_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-navy-100 dark:bg-navy-700 rounded-lg mb-3 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-navy-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500 dark:text-navy-400">Category</span>
                    <Badge variant="info">{getCategoryLabel(capture.predicted_category)}</Badge>
                  </div>
                  {capture.confidence_score && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-navy-500 dark:text-navy-400">Confidence</span>
                      <span className="font-medium text-navy-900 dark:text-white">
                        {(capture.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(capture)}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(capture.id)}
                  >
                    <Trash2 className="h-4 w-4 text-error-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      {selectedCapture && (
        <Dialog isOpen={!!selectedCapture} onOpenChange={() => setSelectedCapture(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCapture.filename}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-navy-100 dark:bg-navy-700 rounded-lg flex items-center justify-center">
                <Camera className="h-12 w-12 text-navy-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-navy-500 dark:text-navy-400">Category</p>
                  <p className="font-medium text-navy-900 dark:text-white">
                    {getCategoryLabel(selectedCapture.predicted_category)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-navy-500 dark:text-navy-400">Status</p>
                  <Badge variant={selectedCapture.processing_status === 'completed' ? 'success' : 'warning'}>
                    {selectedCapture.processing_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-navy-500 dark:text-navy-400">Date</p>
                  <p className="font-medium text-navy-900 dark:text-white">
                    {format(new Date(selectedCapture.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {selectedCapture.confidence_score && (
                  <div>
                    <p className="text-sm text-navy-500 dark:text-navy-400">Confidence</p>
                    <p className="font-medium text-navy-900 dark:text-white">
                      {(selectedCapture.confidence_score * 100).toFixed(0)}%
                    </p>
                  </div>
                )}
              </div>
              {selectedCapture.ocr_text && (
                <div>
                  <p className="text-sm text-navy-500 dark:text-navy-400 mb-1">Extracted Text</p>
                  <p className="text-sm text-navy-900 dark:text-white bg-navy-50 dark:bg-navy-800 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedCapture.ocr_text}
                  </p>
                </div>
              )}
              {selectedCapture.error_message && (
                <div>
                  <p className="text-sm text-navy-500 dark:text-navy-400 mb-1">Error</p>
                  <p className="text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 p-3 rounded-lg">
                    {selectedCapture.error_message}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCapture(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Capture</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600 dark:text-navy-400">
            Are you sure you want to delete this capture? This action cannot be undone.
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
