import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, NotificationSettings } from '../../services/notificationService';
import { hapticService } from '../../services/hapticService';
import TimePicker from '../../components/TimePicker';

const NotificationSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    mealReminders: true,
    hydrationReminders: true,
    weeklyProgress: true,
    achievementCelebrations: true,
    mealReminderTimes: {
      lunch: '13:00',
      dinner: '19:00',
    },
    hydrationInterval: 120,
    weeklyProgressDay: 0,
    weeklyProgressTime: '20:00',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = notificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    try {
      hapticService.light();
      setIsLoading(true);

      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      await notificationService.updateSettings({ [key]: value });
    } catch (error) {
      console.error('Error updating notification setting:', error);
      Alert.alert('Error', 'Failed to update notification setting');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMealTime = async (mealType: 'lunch' | 'dinner', time: string) => {
    try {
      hapticService.light();
      setIsLoading(true);

      const newSettings = {
        ...settings,
        mealReminderTimes: {
          ...settings.mealReminderTimes,
          [mealType]: time,
        },
      };
      setSettings(newSettings);
      
      await notificationService.updateSettings({
        mealReminderTimes: newSettings.mealReminderTimes,
      });
    } catch (error) {
      console.error('Error updating meal time:', error);
      Alert.alert('Error', 'Failed to update meal reminder time');
    } finally {
      setIsLoading(false);
    }
  };

  const updateHydrationInterval = async (interval: number) => {
    try {
      hapticService.light();
      setIsLoading(true);

      const newSettings = { ...settings, hydrationInterval: interval };
      setSettings(newSettings);
      
      await notificationService.updateSettings({ hydrationInterval: interval });
    } catch (error) {
      console.error('Error updating hydration interval:', error);
      Alert.alert('Error', 'Failed to update hydration interval');
    } finally {
      setIsLoading(false);
    }
  };

  const updateWeeklyProgress = async (day: number, time: string) => {
    try {
      hapticService.light();
      setIsLoading(true);

      const newSettings = {
        ...settings,
        weeklyProgressDay: day,
        weeklyProgressTime: time,
      };
      setSettings(newSettings);
      
      await notificationService.updateSettings({
        weeklyProgressDay: day,
        weeklyProgressTime: time,
      });
    } catch (error) {
      console.error('Error updating weekly progress:', error);
      Alert.alert('Error', 'Failed to update weekly progress settings');
    } finally {
      setIsLoading(false);
    }
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const getHydrationIntervalText = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    icon, 
    disabled = false 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
    disabled?: boolean;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <Ionicons name={icon as any} size={20} color="#007AFF" />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
        trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Notification Settings</Text>
            <Text style={styles.subtitle}>Customize your reminders</Text>
          </View>

          {/* Meal Reminders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Reminders</Text>
            
            <SettingRow
              title="Meal Logging Reminders"
              subtitle="Get reminded to log your meals"
              value={settings.mealReminders}
              onValueChange={(value) => updateSetting('mealReminders', value)}
              icon="restaurant"
            />

            {settings.mealReminders && (
              <View style={styles.timeSettings}>
                <View style={styles.timeRow}>
                  <View style={styles.timeInfo}>
                    <Ionicons name="sunny" size={16} color="#FF9500" />
                    <Text style={styles.timeLabel}>Lunch Reminder</Text>
                  </View>
                  <TimePicker
                    value={settings.mealReminderTimes.lunch}
                    onTimeChange={(time) => updateMealTime('lunch', time)}
                    disabled={isLoading}
                  />
                </View>

                <View style={styles.timeRow}>
                  <View style={styles.timeInfo}>
                    <Ionicons name="moon" size={16} color="#5856D6" />
                    <Text style={styles.timeLabel}>Dinner Reminder</Text>
                  </View>
                  <TimePicker
                    value={settings.mealReminderTimes.dinner}
                    onTimeChange={(time) => updateMealTime('dinner', time)}
                    disabled={isLoading}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Hydration Reminders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hydration Reminders</Text>
            
            <SettingRow
              title="Water Intake Reminders"
              subtitle="Stay hydrated throughout the day"
              value={settings.hydrationReminders}
              onValueChange={(value) => updateSetting('hydrationReminders', value)}
              icon="water"
            />

            {settings.hydrationReminders && (
              <View style={styles.intervalSettings}>
                <Text style={styles.intervalLabel}>Reminder Interval</Text>
                <View style={styles.intervalButtons}>
                  {[60, 90, 120, 180, 240].map((interval) => (
                    <TouchableOpacity
                      key={interval}
                      style={[
                        styles.intervalButton,
                        settings.hydrationInterval === interval && styles.intervalButtonActive,
                      ]}
                      onPress={() => updateHydrationInterval(interval)}
                      disabled={isLoading}
                    >
                      <Text
                        style={[
                          styles.intervalButtonText,
                          settings.hydrationInterval === interval && styles.intervalButtonTextActive,
                        ]}
                      >
                        {getHydrationIntervalText(interval)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Weekly Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Progress</Text>
            
            <SettingRow
              title="Weekly Summary"
              subtitle="Get your weekly progress report"
              value={settings.weeklyProgress}
              onValueChange={(value) => updateSetting('weeklyProgress', value)}
              icon="bar-chart"
            />

            {settings.weeklyProgress && (
              <View style={styles.weeklySettings}>
                <View style={styles.weeklyRow}>
                  <Text style={styles.weeklyLabel}>Day</Text>
                  <View style={styles.dayButtons}>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          settings.weeklyProgressDay === day && styles.dayButtonActive,
                        ]}
                        onPress={() => updateWeeklyProgress(day, settings.weeklyProgressTime)}
                        disabled={isLoading}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            settings.weeklyProgressDay === day && styles.dayButtonTextActive,
                          ]}
                        >
                          {getDayName(day).slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.weeklyRow}>
                  <Text style={styles.weeklyLabel}>Time</Text>
                  <TimePicker
                    value={settings.weeklyProgressTime}
                    onTimeChange={(time) => updateWeeklyProgress(settings.weeklyProgressDay, time)}
                    disabled={isLoading}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Achievement Celebrations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            
            <SettingRow
              title="Achievement Celebrations"
              subtitle="Get notified when you unlock achievements"
              value={settings.achievementCelebrations}
              onValueChange={(value) => updateSetting('achievementCelebrations', value)}
              icon="trophy"
            />
          </View>

          {/* Test Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Notifications</Text>
            
            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                hapticService.light();
                await notificationService.scheduleAchievementNotification({
                  title: 'Test Achievement',
                  description: 'This is a test notification!',
                });
                Alert.alert('Test Sent', 'Check your notifications!');
              }}
              disabled={isLoading}
            >
              <Ionicons name="notifications" size={20} color="#007AFF" />
              <Text style={styles.testButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 28,
  },
  timeSettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  intervalSettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  intervalLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  intervalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  intervalButtonActive: {
    backgroundColor: '#007AFF',
  },
  intervalButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  intervalButtonTextActive: {
    color: '#FFFFFF',
  },
  weeklySettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  weeklyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  weeklyLabel: {
    fontSize: 14,
    color: '#666666',
    minWidth: 40,
  },
  dayButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  dayButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  dayButtonTextActive: {
    color: '#FFFFFF',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 8,
  },
});

export default NotificationSettingsScreen;
