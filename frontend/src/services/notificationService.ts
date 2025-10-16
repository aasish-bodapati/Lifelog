import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './databaseService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  mealReminders: boolean;
  hydrationReminders: boolean;
  weeklyProgress: boolean;
  achievementCelebrations: boolean;
  mealReminderTimes: {
    lunch: string; // "13:00"
    dinner: string; // "19:00"
  };
  hydrationInterval: number; // minutes between reminders
  weeklyProgressDay: number; // 0 = Sunday, 1 = Monday, etc.
  weeklyProgressTime: string; // "20:00"
}

export interface ScheduledNotification {
  id: string;
  type: 'meal' | 'hydration' | 'weekly' | 'achievement';
  title: string;
  body: string;
  scheduledTime: Date;
  data?: any;
}

class NotificationService {
  private settings: NotificationSettings = {
    mealReminders: true,
    hydrationReminders: true,
    weeklyProgress: true,
    achievementCelebrations: true,
    mealReminderTimes: {
      lunch: '13:00',
      dinner: '19:00',
    },
    hydrationInterval: 120, // 2 hours
    weeklyProgressDay: 0, // Sunday
    weeklyProgressTime: '20:00',
  };

  private scheduledNotifications: ScheduledNotification[] = [];

  async initialize() {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Load settings from storage
      await this.loadSettings();

      // Schedule initial notifications
      await this.scheduleAllNotifications();

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async loadSettings() {
    try {
      const stored = await AsyncStorage.getItem('notificationSettings');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  async saveSettings() {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  async updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
    await this.scheduleAllNotifications();
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  async scheduleAllNotifications() {
    try {
      // Cancel existing notifications
      await this.cancelAllNotifications();

      // Schedule meal reminders
      if (this.settings.mealReminders) {
        await this.scheduleMealReminders();
      }

      // Schedule hydration reminders
      if (this.settings.hydrationReminders) {
        await this.scheduleHydrationReminders();
      }

      // Schedule weekly progress
      if (this.settings.weeklyProgress) {
        await this.scheduleWeeklyProgress();
      }

      console.log('All notifications scheduled successfully');
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  private async scheduleMealReminders() {
    const today = new Date();
    
    // Schedule lunch reminder
    const lunchTime = this.parseTime(this.settings.mealReminderTimes.lunch);
    const lunchDate = new Date(today);
    lunchDate.setHours(lunchTime.hours, lunchTime.minutes, 0, 0);
    
    if (lunchDate > today) {
      await this.scheduleNotification({
        id: 'meal_lunch',
        type: 'meal',
        title: '🍽️ Lunch Time!',
        body: 'Don\'t forget to log your lunch. What are you having today?',
        scheduledTime: lunchDate,
        data: { mealType: 'lunch' },
      });
    }

    // Schedule dinner reminder
    const dinnerTime = this.parseTime(this.settings.mealReminderTimes.dinner);
    const dinnerDate = new Date(today);
    dinnerDate.setHours(dinnerTime.hours, dinnerTime.minutes, 0, 0);
    
    if (dinnerDate > today) {
      await this.scheduleNotification({
        id: 'meal_dinner',
        type: 'meal',
        title: '🍽️ Dinner Time!',
        body: 'Time to log your dinner. Keep tracking your nutrition!',
        scheduledTime: dinnerDate,
        data: { mealType: 'dinner' },
      });
    }
  }

  private async scheduleHydrationReminders() {
    const today = new Date();
    const interval = this.settings.hydrationInterval;
    
    // Schedule multiple hydration reminders throughout the day
    const startHour = 8; // 8 AM
    const endHour = 22; // 10 PM
    const totalReminders = Math.floor((endHour - startHour) * 60 / interval);
    
    for (let i = 0; i < totalReminders; i++) {
      const reminderTime = new Date(today);
      reminderTime.setHours(startHour + Math.floor(i * interval / 60), (i * interval) % 60, 0, 0);
      
      if (reminderTime > today) {
        await this.scheduleNotification({
          id: `hydration_${i}`,
          type: 'hydration',
          title: '💧 Stay Hydrated!',
          body: 'Time for a glass of water. Your body will thank you!',
          scheduledTime: reminderTime,
          data: { reminderIndex: i },
        });
      }
    }
  }

  private async scheduleWeeklyProgress() {
    const today = new Date();
    const targetDay = this.settings.weeklyProgressDay;
    const targetTime = this.parseTime(this.settings.weeklyProgressTime);
    
    // Calculate next occurrence of target day
    const daysUntilTarget = (targetDay - today.getDay() + 7) % 7;
    const nextOccurrence = new Date(today);
    nextOccurrence.setDate(today.getDate() + daysUntilTarget);
    nextOccurrence.setHours(targetTime.hours, targetTime.minutes, 0, 0);
    
    // If it's the same day but time has passed, schedule for next week
    if (nextOccurrence <= today) {
      nextOccurrence.setDate(nextOccurrence.getDate() + 7);
    }
    
    await this.scheduleNotification({
      id: 'weekly_progress',
      type: 'weekly',
      title: '📊 Weekly Progress',
      body: 'Check out your progress this week! You\'re doing great!',
      scheduledTime: nextOccurrence,
      data: { weekStart: nextOccurrence.toISOString().split('T')[0] },
    });
  }

  private async scheduleNotification(notification: ScheduledNotification) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: 'default',
        },
        trigger: {
          date: notification.scheduledTime,
        },
      });

      this.scheduledNotifications.push({
        ...notification,
        id: notificationId,
      });

      console.log(`Scheduled notification: ${notification.title} at ${notification.scheduledTime}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  async scheduleAchievementNotification(achievement: { title: string; description: string }) {
    if (!this.settings.achievementCelebrations) return;

    await this.scheduleNotification({
      id: `achievement_${Date.now()}`,
      type: 'achievement',
      title: '🏆 Achievement Unlocked!',
      body: `${achievement.title}: ${achievement.description}`,
      scheduledTime: new Date(Date.now() + 1000), // 1 second delay
      data: { achievement },
    });
  }

  async scheduleMealLoggingReminder(mealType: string, delayMinutes: number = 30) {
    const reminderTime = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    await this.scheduleNotification({
      id: `meal_reminder_${Date.now()}`,
      type: 'meal',
      title: `🍽️ ${mealType} Reminder`,
      body: 'Did you remember to log your meal? Quick logging is just a tap away!',
      scheduledTime: reminderTime,
      data: { mealType, isReminder: true },
    });
  }

  async scheduleHydrationReminder(delayMinutes: number = 60) {
    const reminderTime = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    await this.scheduleNotification({
      id: `hydration_reminder_${Date.now()}`,
      type: 'hydration',
      title: '💧 Hydration Check',
      body: 'How\'s your water intake today? Stay hydrated!',
      scheduledTime: reminderTime,
      data: { isReminder: true },
    });
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications = [];
      console.log('All notifications cancelled');
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.scheduledNotifications = this.scheduledNotifications.filter(
        n => n.id !== notificationId
      );
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  async getScheduledNotifications() {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      return scheduled;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  private parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  }

  // Smart notification scheduling based on user behavior
  async scheduleSmartReminders(userId: number) {
    try {
      // Get user's recent activity patterns
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      // Analyze meal logging patterns
      const mealPatterns = await this.analyzeMealPatterns(userId, last7Days);
      
      // Adjust meal reminder times based on patterns
      if (mealPatterns.lunchAverage) {
        const lunchTime = this.formatTime(mealPatterns.lunchAverage);
        await this.updateSettings({
          mealReminderTimes: {
            ...this.settings.mealReminderTimes,
            lunch: lunchTime,
          },
        });
      }

      if (mealPatterns.dinnerAverage) {
        const dinnerTime = this.formatTime(mealPatterns.dinnerAverage);
        await this.updateSettings({
          mealReminderTimes: {
            ...this.settings.mealReminderTimes,
            dinner: dinnerTime,
          },
        });
      }

      // Analyze hydration patterns
      const hydrationPatterns = await this.analyzeHydrationPatterns(userId, last7Days);
      
      // Adjust hydration interval based on patterns
      if (hydrationPatterns.averageInterval) {
        await this.updateSettings({
          hydrationInterval: Math.max(60, Math.min(240, hydrationPatterns.averageInterval)),
        });
      }

    } catch (error) {
      console.error('Error scheduling smart reminders:', error);
    }
  }

  private async analyzeMealPatterns(userId: number, dates: string[]) {
    const patterns = {
      lunchAverage: null as number | null,
      dinnerAverage: null as number | null,
    };

    try {
      const lunchTimes: number[] = [];
      const dinnerTimes: number[] = [];

      for (const date of dates) {
        const nutritionLogs = await databaseService.getNutritionLogs(userId, date, 100);
        
        for (const log of nutritionLogs) {
          const logTime = new Date(log.created_at);
          const hour = logTime.getHours() + logTime.getMinutes() / 60;
          
          if (log.meal_type === 'lunch') {
            lunchTimes.push(hour);
          } else if (log.meal_type === 'dinner') {
            dinnerTimes.push(hour);
          }
        }
      }

      if (lunchTimes.length > 0) {
        patterns.lunchAverage = lunchTimes.reduce((sum, time) => sum + time, 0) / lunchTimes.length;
      }

      if (dinnerTimes.length > 0) {
        patterns.dinnerAverage = dinnerTimes.reduce((sum, time) => sum + time, 0) / dinnerTimes.length;
      }
    } catch (error) {
      console.error('Error analyzing meal patterns:', error);
    }

    return patterns;
  }

  private async analyzeHydrationPatterns(userId: number, dates: string[]) {
    const patterns = {
      averageInterval: null as number | null,
    };

    try {
      // This would analyze hydration logging patterns
      // For now, return default interval
      patterns.averageInterval = 120; // 2 hours
    } catch (error) {
      console.error('Error analyzing hydration patterns:', error);
    }

    return patterns;
  }

  private formatTime(hourDecimal: number): string {
    const hours = Math.floor(hourDecimal);
    const minutes = Math.round((hourDecimal - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

export const notificationService = new NotificationService();
