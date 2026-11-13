// Browser Push Notification Service
export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  showNotification: (title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.svg',
      });
    }
  },

  scheduleReminder: (title: string, time: Date, description: string) => {
    const now = new Date().getTime();
    const reminderTime = new Date(time).getTime();
    const delay = reminderTime - now;

    if (delay > 0) {
      setTimeout(() => {
        notificationService.showNotification(title, description);
      }, delay);
    }
  },
};
