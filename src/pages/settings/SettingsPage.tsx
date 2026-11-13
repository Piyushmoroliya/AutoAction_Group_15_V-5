import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { User, Bell, Shield, Trash2, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/Dialog';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const [profileData, setProfileData] = useState({
    name: 'Demo User',
    email: 'demo@autoaction.ai',
  });

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleDeleteData = () => {
    toast.success('All data has been deleted');
    setShowDeleteDialog(false);
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    setShowLogoutDialog(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
          Settings
        </h1>
        <p className="text-navy-500 dark:text-navy-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
              Name
            </label>
            <Input
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            />
          </div>
          <Button onClick={handleSaveProfile}>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy-900 dark:text-white">Theme</p>
              <p className="text-sm text-navy-500 dark:text-navy-400">
                Switch between light and dark mode
              </p>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark Mode
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  Light Mode
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy-900 dark:text-white">Email Notifications</p>
              <p className="text-sm text-navy-500 dark:text-navy-400">
                Receive email updates about your captures and reminders
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-navy-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy-900 dark:text-white">Push Notifications</p>
              <p className="text-sm text-navy-500 dark:text-navy-400">
                Receive push notifications for upcoming deadlines
              </p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-navy-300 text-primary-600 focus:ring-primary-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-navy-900 dark:text-white mb-2">Data Privacy</p>
            <p className="text-sm text-navy-600 dark:text-navy-400 mb-4">
              Your screenshots and data are processed locally. We do not store your personal information on external servers. All data remains on your device until you choose to delete it.
            </p>
          </div>
          <div>
            <p className="font-medium text-navy-900 dark:text-white mb-2">Screenshot Privacy</p>
            <p className="text-sm text-navy-600 dark:text-navy-400 mb-4">
              Screenshots may contain sensitive information. Ensure you only upload images you are comfortable processing. You can delete any capture at any time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-error-200">
        <CardHeader>
          <CardTitle className="text-error-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy-900 dark:text-white">Delete All Data</p>
              <p className="text-sm text-navy-500 dark:text-navy-400">
                Permanently delete all your captures, tasks, and data
              </p>
            </div>
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Data
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-navy-900 dark:text-white">Sign Out</p>
              <p className="text-sm text-navy-500 dark:text-navy-400">
                Sign out of your account
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowLogoutDialog(true)}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Data</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600 dark:text-navy-400">
            Are you sure you want to delete all your data? This action cannot be undone and will permanently delete all your captures, tasks, expenses, and other information.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteData}>
              Delete All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog isOpen={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600 dark:text-navy-400">
            Are you sure you want to sign out?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogout}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
