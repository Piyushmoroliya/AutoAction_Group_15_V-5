import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useDropzone } from 'react-dropzone';
import {
  Upload, X, CheckCircle, AlertCircle, Loader2,
  Sparkles, FileText, Check, Calendar, Wallet,
  GraduationCap, CalendarDays, BookOpen, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import { toast } from 'sonner';
import { capturesService, type Capture } from '../../services/captures';
import { getCaptureImageUrl } from '../../utils/imageUrl';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export default function CapturePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCapture, setProcessedCapture] = useState<Capture | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showOcrText, setShowOcrText] = useState(false);

  // Review & Confirm editable fields state
  const [confirmedCategory, setConfirmedCategory] = useState<string>('assignment');
  const [createReminder, setCreateReminder] = useState<boolean>(true);
  const [fields, setFields] = useState<Record<string, any>>({});

  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: '1', label: 'Image uploaded & received by server', status: 'pending' },
    { id: '2', label: 'CNN Classification & visual inference', status: 'pending' },
    { id: '3', label: 'OCR & text token extraction', status: 'pending' },
    { id: '4', label: 'Entity & intent detection engine', status: 'pending' },
    { id: '5', label: 'Structured record mapping & validation', status: 'pending' },
  ]);

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setProcessedCapture(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
  });

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setProcessedCapture(null);
    setFields({});
    setProcessingSteps([
      { id: '1', label: 'Image uploaded & received by server', status: 'pending' },
      { id: '2', label: 'CNN Classification & visual inference', status: 'pending' },
      { id: '3', label: 'OCR & text token extraction', status: 'pending' },
      { id: '4', label: 'Entity & intent detection engine', status: 'pending' },
      { id: '5', label: 'Structured record mapping & validation', status: 'pending' },
    ]);
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);

    try {
      // Animate Step 1 & 2
      setProcessingSteps((prev) =>
        prev.map((step, index) =>
          index === 0 ? { ...step, status: 'processing' } : step
        )
      );

      // Perform real backend upload + OCR + CNN + extraction
      const capture = await capturesService.uploadCapture(file);

      // Step 1 done
      setProcessingSteps((prev) =>
        prev.map((step, index) =>
          index === 0 ? { ...step, status: 'completed' } :
          index === 1 ? { ...step, status: 'processing' } : step
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 350));

      // Step 2 & 3 done
      setProcessingSteps((prev) =>
        prev.map((step, index) =>
          index <= 2 ? { ...step, status: 'completed' } :
          index === 3 ? { ...step, status: 'processing' } : step
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      // Steps 4 & 5 done
      setProcessingSteps((prev) =>
        prev.map((step) => ({ ...step, status: 'completed' }))
      );

      setProcessedCapture(capture);

      // Parse structured fields returned by backend
      const category = capture.predicted_category || 'assignment';
      setConfirmedCategory(category);

      let extracted: Record<string, any> = {};
      if (capture.extracted_data) {
        try {
          extracted = JSON.parse(capture.extracted_data);
        } catch {
          extracted = {};
        }
      }
      setFields(extracted);

      toast.success(`Classified as ${category.toUpperCase()} (${((capture.confidence_score || 0.85) * 100).toFixed(0)}% confidence)`);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to process screenshot');
      setProcessingSteps((prev) =>
        prev.map((step) =>
          step.status === 'processing' ? { ...step, status: 'error' } : step
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!processedCapture) return;

    setIsConfirming(true);
    try {
      const response = await capturesService.confirmAction(processedCapture.id, {
        category: confirmedCategory,
        fields: fields,
        create_reminder: createReminder,
      });

      toast.success(response.message || 'Action executed successfully!');

      // Redirect directly to the appropriate page to see the saved record
      if (confirmedCategory === 'expense' || confirmedCategory === 'payment') {
        navigate('/expenses');
      } else if (confirmedCategory === 'assignment' || confirmedCategory === 'task') {
        navigate('/tasks');
      } else if (confirmedCategory === 'academic' || confirmedCategory === 'academic_material') {
        navigate('/academic');
      } else if (confirmedCategory === 'event') {
        navigate('/events');
      } else if (confirmedCategory === 'exam' || confirmedCategory === 'examination') {
        navigate('/exams');
      } else {
        navigate('/captures');
      }
    } catch (error: any) {
      console.error('Action confirmation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to execute action');
    } finally {
      setIsConfirming(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'expense':
      case 'payment':
        return {
          icon: Wallet,
          color: 'text-emerald-500 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          btnText: 'Confirm Transaction & Add Expense',
        };
      case 'assignment':
      case 'task':
        return {
          icon: Calendar,
          color: 'text-blue-500 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/30',
          border: 'border-blue-200 dark:border-blue-800',
          btnText: 'Confirm Task & Create Reminder',
        };
      case 'academic':
      case 'academic_material':
        return {
          icon: BookOpen,
          color: 'text-purple-500 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-950/30',
          border: 'border-purple-200 dark:border-purple-800',
          btnText: 'Confirm Note & Add to Academic Memory',
        };
      case 'event':
        return {
          icon: CalendarDays,
          color: 'text-amber-500 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          btnText: 'Confirm Event & Schedule',
        };
      case 'exam':
      case 'examination':
        return {
          icon: GraduationCap,
          color: 'text-rose-500 dark:text-rose-400',
          bg: 'bg-rose-50 dark:bg-rose-950/30',
          border: 'border-rose-200 dark:border-rose-800',
          btnText: 'Confirm Exam Schedule & Set Reminder',
        };
      default:
        return {
          icon: Sparkles,
          color: 'text-primary-500',
          bg: 'bg-primary-50',
          border: 'border-primary-200',
          btnText: 'Save Record',
        };
    }
  };

  const themeConfig = getCategoryTheme(confirmedCategory);
  const CategoryIcon = themeConfig.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
          Intelligent Screenshot Capture
        </h1>
        <p className="text-navy-500 dark:text-navy-400 mt-1">
          AutoAction Pipeline: Screenshot Upload &rarr; CNN Classification &rarr; OCR &rarr; Information Extraction &rarr; Action Engine
        </p>
      </div>

      {!file ? (
        <Card>
          <CardContent className="p-12">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                ${isDragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-navy-300 hover:border-primary-500 dark:border-navy-600'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-navy-400 mb-4" />
              <p className="text-lg font-medium text-navy-900 dark:text-white mb-2">
                {isDragActive ? 'Drop the screenshot here' : 'Drag and drop screenshot or photograph here'}
              </p>
              <p className="text-sm text-navy-500 dark:text-navy-400 mb-4">
                or click to browse from your device
              </p>
              <p className="text-xs text-navy-400 dark:text-navy-500">
                Supports UPI payments, course assignments, lecture notes, exam timetables, and event flyers (PNG, JPG, WebP up to 10MB)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Image Preview & Details Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-navy-900 dark:text-white">{file.name}</h3>
                  <p className="text-sm text-navy-500 dark:text-navy-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB &bull; {file.type || 'image/jpeg'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemove} disabled={isProcessing || isConfirming}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-lg overflow-hidden border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900/40 p-2 flex justify-center">
                <img
                  src={preview || (processedCapture ? getCaptureImageUrl(processedCapture.filename) || undefined : undefined)}
                  alt="Screenshot Preview"
                  className="w-full h-auto max-h-80 object-contain rounded"
                />
              </div>
            </CardContent>
          </Card>

          {/* Processing Progress Status */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-navy-900 dark:text-white mb-4 flex items-center justify-between">
                <span>AI Pipeline Stages</span>
                {processedCapture && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Check className="h-3 w-3" /> Ready for Review
                  </Badge>
                )}
              </h3>
              <div className="space-y-3">
                {processingSteps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3">
                    {step.status === 'pending' && (
                      <div className="h-5 w-5 rounded-full border-2 border-navy-300 dark:border-navy-600" />
                    )}
                    {step.status === 'processing' && (
                      <Loader2 className="h-5 w-5 text-primary-600 animate-spin" />
                    )}
                    {step.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-success-500" />
                    )}
                    {step.status === 'error' && (
                      <AlertCircle className="h-5 w-5 text-error-500" />
                    )}
                    <span
                      className={`text-sm ${
                        step.status === 'completed'
                          ? 'text-navy-900 dark:text-white font-medium'
                          : 'text-navy-500 dark:text-navy-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {step.status === 'completed' && (
                      <Badge variant="success" className="ml-auto text-xs">
                        Done
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {!processedCapture && (
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-navy-100 dark:border-navy-800">
                  <Button variant="outline" onClick={handleRemove} disabled={isProcessing}>
                    Cancel
                  </Button>
                  <Button onClick={handleProcess} isLoading={isProcessing}>
                    {isProcessing ? 'Processing AI Pipeline...' : 'Run Pipeline Inference'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 4 & 5: Review & Confirm Category-Aware Analysis Section */}
          {processedCapture && (
            <Card className={`border-2 ${themeConfig.border} shadow-lg transition-all`}>
              <CardHeader className={`${themeConfig.bg} rounded-t-lg border-b ${themeConfig.border}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg bg-white dark:bg-navy-800 shadow-sm ${themeConfig.color}`}>
                      <CategoryIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-xl capitalize">
                          {confirmedCategory} Detected
                        </CardTitle>
                        <Badge variant="info">
                          {((processedCapture.confidence_score || 0.85) * 100).toFixed(0)}% Confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-navy-500 dark:text-navy-400 mt-0.5">
                        Verify extracted data below before committing to database and executing action.
                      </p>
                    </div>
                  </div>

                  {/* Category switcher if user wants to override */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-medium text-navy-500">Category:</span>
                    <select
                      value={confirmedCategory}
                      onChange={(e) => setConfirmedCategory(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-md border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                    >
                      <option value="assignment">Assignment / Task</option>
                      <option value="expense">Payment / Expense</option>
                      <option value="academic">Academic Material</option>
                      <option value="event">Campus Event</option>
                      <option value="exam">Examination</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Category-specific fields */}
                {(confirmedCategory === 'expense' || confirmedCategory === 'payment') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                        Amount (₹)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={fields.amount || ''}
                        onChange={(e) => updateField('amount', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 450.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                        Merchant / Recipient
                      </label>
                      <Input
                        type="text"
                        value={fields.merchant || ''}
                        onChange={(e) => updateField('merchant', e.target.value)}
                        placeholder="e.g. Swiggy, Uber, Starbucks"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                        Expense Category
                      </label>
                      <select
                        value={fields.category || 'Food & Dining'}
                        onChange={(e) => updateField('category', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                      >
                        <option value="Food & Dining">Food & Dining</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Education">Education</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                        Transaction Reference / UPI Ref
                      </label>
                      <Input
                        type="text"
                        value={fields.transaction_reference || ''}
                        onChange={(e) => updateField('transaction_reference', e.target.value)}
                        placeholder="UPI or Transaction ID"
                      />
                    </div>
                  </div>
                )}

                {(confirmedCategory === 'assignment' || confirmedCategory === 'task') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Assignment Title
                        </label>
                        <Input
                          type="text"
                          value={fields.title || ''}
                          onChange={(e) => updateField('title', e.target.value)}
                          placeholder="e.g. Assignment 3: CNN Implementation"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Subject / Course
                        </label>
                        <Input
                          type="text"
                          value={fields.subject || ''}
                          onChange={(e) => updateField('subject', e.target.value)}
                          placeholder="e.g. Deep Learning"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Deadline
                        </label>
                        <Input
                          type="datetime-local"
                          value={fields.deadline ? fields.deadline.substring(0, 16) : ''}
                          onChange={(e) => updateField('deadline', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Submission Platform
                        </label>
                        <Input
                          type="text"
                          value={fields.platform || ''}
                          onChange={(e) => updateField('platform', e.target.value)}
                          placeholder="e.g. Google Classroom, Canvas"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                        Instructions / Description
                      </label>
                      <textarea
                        rows={3}
                        value={fields.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                        placeholder="Key instructions or submission notes"
                      />
                    </div>
                    <label className="flex items-center space-x-2 text-sm text-navy-800 dark:text-navy-200 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={createReminder}
                        onChange={(e) => setCreateReminder(e.target.checked)}
                        className="rounded border-navy-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>Schedule automatic 24-hour deadline reminder</span>
                    </label>
                  </div>
                )}

                {(confirmedCategory === 'academic' || confirmedCategory === 'academic_material') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Topic
                        </label>
                        <Input
                          type="text"
                          value={fields.topic || ''}
                          onChange={(e) => updateField('topic', e.target.value)}
                          placeholder="e.g. Feature Maps and Convolution Layers"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Subject
                        </label>
                        <Input
                          type="text"
                          value={fields.subject || ''}
                          onChange={(e) => updateField('subject', e.target.value)}
                          placeholder="e.g. Computer Science"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                        Summary
                      </label>
                      <textarea
                        rows={3}
                        value={fields.summary || ''}
                        onChange={(e) => updateField('summary', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                        placeholder="Concise overview of the concept"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                        Explanation & Key Takeaways
                      </label>
                      <textarea
                        rows={3}
                        value={fields.explanation || ''}
                        onChange={(e) => updateField('explanation', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                        placeholder="Detailed theoretical or algorithmic breakdown"
                      />
                    </div>
                  </div>
                )}

                {confirmedCategory === 'event' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Event Name
                        </label>
                        <Input
                          type="text"
                          value={fields.event_name || ''}
                          onChange={(e) => updateField('event_name', e.target.value)}
                          placeholder="e.g. AI & Robotics Summit 2026"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Venue
                        </label>
                        <Input
                          type="text"
                          value={fields.venue || ''}
                          onChange={(e) => updateField('venue', e.target.value)}
                          placeholder="e.g. University Main Auditorium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Date & Time
                        </label>
                        <Input
                          type="datetime-local"
                          value={fields.date_time ? fields.date_time.substring(0, 16) : ''}
                          onChange={(e) => updateField('date_time', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                        Event Description
                      </label>
                      <textarea
                        rows={2}
                        value={fields.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-navy-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                        placeholder="Speaker information, agenda, or prerequisites"
                      />
                    </div>
                    <label className="flex items-center space-x-2 text-sm text-navy-800 dark:text-navy-200 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={createReminder}
                        onChange={(e) => setCreateReminder(e.target.checked)}
                        className="rounded border-navy-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>Create notification reminder before event</span>
                    </label>
                  </div>
                )}

                {(confirmedCategory === 'exam' || confirmedCategory === 'examination') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Course Subject
                        </label>
                        <Input
                          type="text"
                          value={fields.subject || ''}
                          onChange={(e) => updateField('subject', e.target.value)}
                          placeholder="e.g. Operating Systems"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Room / Venue
                        </label>
                        <Input
                          type="text"
                          value={fields.room_venue || ''}
                          onChange={(e) => updateField('room_venue', e.target.value)}
                          placeholder="e.g. Hall B-204"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-navy-700 dark:text-navy-300 mb-1">
                          Examination Date & Time
                        </label>
                        <Input
                          type="datetime-local"
                          value={fields.exam_date_time ? fields.exam_date_time.substring(0, 16) : ''}
                          onChange={(e) => updateField('exam_date_time', e.target.value)}
                        />
                      </div>
                    </div>
                    <label className="flex items-center space-x-2 text-sm text-navy-800 dark:text-navy-200 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={createReminder}
                        onChange={(e) => setCreateReminder(e.target.checked)}
                        className="rounded border-navy-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>Set revision & admit card reminder 24 hours prior</span>
                    </label>
                  </div>
                )}

                {/* Collapsible Extracted OCR Text */}
                {processedCapture.ocr_text && (
                  <div className="border border-navy-200 dark:border-navy-700 rounded-lg p-3 bg-navy-50/50 dark:bg-navy-900/30">
                    <button
                      type="button"
                      onClick={() => setShowOcrText(!showOcrText)}
                      className="flex items-center justify-between w-full text-xs font-medium text-navy-700 dark:text-navy-300 hover:text-navy-900"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-navy-500" />
                        Raw Extracted OCR Text ({processedCapture.ocr_text.length} characters)
                      </span>
                      {showOcrText ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    {showOcrText && (
                      <p className="mt-2 text-xs text-navy-600 dark:text-navy-400 whitespace-pre-wrap font-mono bg-white dark:bg-navy-800 p-2.5 rounded border border-navy-200 dark:border-navy-700 max-h-48 overflow-y-auto">
                        {processedCapture.ocr_text}
                      </p>
                    )}
                  </div>
                )}

                {/* Confirm Action Button */}
                <div className="pt-4 border-t border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button variant="outline" onClick={handleRemove} disabled={isConfirming}>
                    Discard & Upload Another
                  </Button>
                  <Button
                    onClick={handleConfirmAction}
                    isLoading={isConfirming}
                    className="w-full sm:w-auto shadow-md"
                  >
                    {isConfirming ? 'Executing Action...' : themeConfig.btnText}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
