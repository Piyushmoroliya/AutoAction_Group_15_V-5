import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { CalendarDays, Plus, Trash2, MapPin, Clock, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/Dialog';
import Input from '../../components/common/Input';
import { toast } from 'sonner';
import { eventsService, type Event, type EventCreate } from '../../services/events';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    event_time: '',
    venue: '',
    description: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await eventsService.listEvents();
      setEvents(data);
    } catch (error: any) {
      console.error('Failed to load events:', error);
      toast.error(error.response?.data?.detail || 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter((e) => new Date(e.event_date) < new Date());

  const handleAdd = async () => {
    if (!formData.event_name || !formData.event_date) {
      toast.error('Name and date are required');
      return;
    }

    try {
      const data: EventCreate = {
        event_name: formData.event_name,
        event_date: new Date(formData.event_date).toISOString(),
        event_time: formData.event_time || undefined,
        venue: formData.venue || undefined,
        description: formData.description || undefined,
      };

      await eventsService.createEvent(data);
      toast.success('Event added successfully');
      setShowAddDialog(false);
      setFormData({ event_name: '', event_date: '', event_time: '', venue: '', description: '' });
      loadEvents();
    } catch (error: any) {
      console.error('Add failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to add event');
    }
  };

  const handleDelete = (id: number) => {
    setEventToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
      try {
        await eventsService.deleteEvent(eventToDelete);
        toast.success('Event deleted successfully');
        setShowDeleteDialog(false);
        setEventToDelete(null);
        loadEvents();
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.response?.data?.detail || 'Failed to delete event');
      }
    }
  };

  const EventCard = ({ event }: { event: Event }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-navy-900 dark:text-white mb-2">{event.event_name}</h3>
            <div className="space-y-1 text-sm text-navy-500 dark:text-navy-400">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {format(new Date(event.event_date), 'MMMM d, yyyy')}
              </div>
              {event.event_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {event.event_time}
                </div>
              )}
              {event.venue && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.venue}
                </div>
              )}
            </div>
          </div>
          <div className="ml-4">
            <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
              <Trash2 className="h-4 w-4 text-error-500" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">Events</h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1">{events.length} events total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEvents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {upcomingEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-3">Upcoming Events</h2>
          <div className="space-y-3">{upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </div>
      )}

      {pastEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy-900 dark:text-white mb-3">Past Events</h2>
          <div className="space-y-3">{pastEvents.map((event) => <EventCard key={event.id} event={event} />)}</div>
        </div>
      )}

      {events.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-navy-400 mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">No events yet</h3>
            <p className="text-navy-500 dark:text-navy-400 mb-4">Start by adding your first event</p>
          </CardContent>
        </Card>
      )}

      <Dialog isOpen={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Event Name *</label>
              <Input value={formData.event_name} onChange={(e) => setFormData({ ...formData, event_name: e.target.value })} placeholder="Event name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Date *</label>
              <Input type="date" value={formData.event_date} onChange={(e) => setFormData({ ...formData, event_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Time</label>
              <Input type="time" value={formData.event_time} onChange={(e) => setFormData({ ...formData, event_time: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Venue</label>
              <Input value={formData.venue} onChange={(e) => setFormData({ ...formData, venue: e.target.value })} placeholder="Event venue" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Event description" className="flex w-full rounded-lg border border-navy-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-navy-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-600 dark:bg-navy-800 dark:ring-offset-navy-800 dark:placeholder:text-navy-500 min-h-[80px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600 dark:text-navy-400">Are you sure you want to delete this event? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
