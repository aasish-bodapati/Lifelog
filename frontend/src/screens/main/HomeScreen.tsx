import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { useUser } from '../../context/UserContext';
import { useLog } from '../../context/LogContext';
import { useSync } from '../../context/SyncContext';
import SyncIndicator from '../../components/SyncIndicator';
import FloatingActionButton from '../../components/FloatingActionButton';
import QuickMealLogScreen from '../logging/QuickMealLogScreen';
import QuickWorkoutLogScreen from '../logging/QuickWorkoutLogScreen';
import QuickBodyStatLogScreen from '../logging/QuickBodyStatLogScreen';
import RepeatYesterdayModal from '../../components/RepeatYesterdayModal';
import { hapticService } from '../../services/hapticService';

const HomeScreen: React.FC = () => {
  const { state: userState } = useUser();
  const { state: logState, syncAllData } = useLog();
  const { forceSync } = useSync();

  // Quick logging modals
  const [showMealLog, setShowMealLog] = useState(false);
  const [showWorkoutLog, setShowWorkoutLog] = useState(false);
  const [showBodyStatLog, setShowBodyStatLog] = useState(false);
  const [showRepeatYesterday, setShowRepeatYesterday] = useState(false);

  useEffect(() => {
    if (userState.user) {
      syncAllData(userState.user.id);
    }
  }, [userState.user]);

  const handleRefresh = async () => {
    if (userState.user) {
      await syncAllData(userState.user.id);
      await forceSync();
    }
  };

  // Quick logging handlers
  const handleMealPress = () => {
    hapticService.light();
    setShowMealLog(true);
  };

  const handleWorkoutPress = () => {
    hapticService.light();
    setShowWorkoutLog(true);
  };

  const handleBodyStatPress = () => {
    hapticService.light();
    setShowBodyStatLog(true);
  };

  const handleRepeatYesterdayPress = () => {
    hapticService.light();
    setShowRepeatYesterday(true);
  };

  const handleLoggingSuccess = () => {
    hapticService.success();
    // Refresh data after successful logging
    if (userState.user) {
      syncAllData(userState.user.id);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <View style={styles.container}>
      <SyncIndicator />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={logState.isLoading} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.content}>
        <Text style={styles.greeting}>
          {getGreeting()}, {userState.user?.username || 'User'}!
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{logState.workouts.length}</Text>
            <Text style={styles.statLabel}>Fitness</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {logState.dailySummary?.total_calories || 0}
            </Text>
            <Text style={styles.statLabel}>Calories Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {logState.bodyStats.length > 0 ? 
                logState.bodyStats[0].weight || '--' : '--'}
            </Text>
            <Text style={styles.statLabel}>Weight (kg)</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Log Workout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Log Food</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Log Weight</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.emptyText}>No recent activity</Text>
        </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onMealPress={handleMealPress}
        onWorkoutPress={handleWorkoutPress}
        onBodyStatPress={handleBodyStatPress}
        onRepeatYesterdayPress={handleRepeatYesterdayPress}
      />

      {/* Quick Logging Modals */}
      <Modal
        visible={showMealLog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMealLog(false)}
      >
        <QuickMealLogScreen
          onClose={() => setShowMealLog(false)}
          onSuccess={handleLoggingSuccess}
        />
      </Modal>

      <Modal
        visible={showWorkoutLog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWorkoutLog(false)}
      >
        <QuickWorkoutLogScreen
          onClose={() => setShowWorkoutLog(false)}
          onSuccess={handleLoggingSuccess}
        />
      </Modal>

      <Modal
        visible={showBodyStatLog}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBodyStatLog(false)}
      >
        <QuickBodyStatLogScreen
          onClose={() => setShowBodyStatLog(false)}
          onSuccess={handleLoggingSuccess}
        />
      </Modal>

      <RepeatYesterdayModal
        visible={showRepeatYesterday}
        onClose={() => setShowRepeatYesterday(false)}
        onSuccess={handleLoggingSuccess}
      />
    </View>
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  recentActivity: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HomeScreen;
