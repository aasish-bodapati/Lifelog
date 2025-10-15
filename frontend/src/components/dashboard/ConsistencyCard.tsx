import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SyncStatus } from '../../services/syncService';

interface ConsistencyCardProps {
  streak: number;
  lastSyncTime: string | null;
  syncStatus: SyncStatus;
  isLoading?: boolean;
}

const ConsistencyCard: React.FC<ConsistencyCardProps> = ({
  streak,
  lastSyncTime,
  syncStatus,
  isLoading = false,
}) => {
  const streakAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(streakAnim, {
        toValue: streak,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      // Pulse animation for high streaks
      if (streak >= 7) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [streak, isLoading, streakAnim, pulseAnim]);

  const getStreakColor = () => {
    if (streak === 0) return '#CCCCCC';
    if (streak < 3) return '#FF6B6B';
    if (streak < 7) return '#FFE66D';
    if (streak < 30) return '#4ECDC4';
    return '#45B7D1';
  };

  const getStreakMessage = () => {
    if (streak === 0) return 'Start your streak today!';
    if (streak === 1) return 'Great start! Keep it up!';
    if (streak < 7) return `You're on fire! ${streak} days strong!`;
    if (streak < 30) return `Amazing ${streak}-day streak!`;
    return `Incredible ${streak}-day streak! You're unstoppable!`;
  };

  const getStreakIcon = () => {
    if (streak === 0) return 'flame-outline';
    if (streak < 7) return 'flame';
    if (streak < 30) return 'flame';
    return 'trophy';
  };

  const getSyncStatusText = () => {
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.error) return 'Sync failed';
    if (syncStatus.unsyncedCount > 0) return `${syncStatus.unsyncedCount} pending`;
    return 'All synced';
  };

  const getSyncStatusColor = () => {
    if (syncStatus.isSyncing) return '#007AFF';
    if (syncStatus.error) return '#FF3B30';
    if (syncStatus.unsyncedCount > 0) return '#FF9500';
    return '#34C759';
  };

  const formatLastSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const syncTime = new Date(lastSyncTime);
    const diffMinutes = Math.floor((now.getTime() - syncTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const renderStreakFlames = () => {
    const flames = Math.min(streak, 10); // Max 10 flames
    return Array.from({ length: 10 }, (_, i) => (
      <Animated.View
        key={i}
        style={[
          styles.flame,
          {
            opacity: i < flames ? 1 : 0.2,
            transform: [
              {
                scale: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: i < flames ? [1, 1.2] : [1, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons 
          name="flame" 
          size={16} 
          color={i < flames ? getStreakColor() : '#CCCCCC'} 
        />
      </Animated.View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="trending-up" size={24} color="#8E44AD" />
          <Text style={styles.title}>Consistency</Text>
        </View>
        <Animated.Text 
          style={[
            styles.streakNumber,
            { color: getStreakColor() }
          ]}
        >
          {streak}
        </Animated.Text>
      </View>

      <View style={styles.content}>
        {/* Streak Section */}
        <View style={styles.streakSection}>
          <View style={styles.flamesContainer}>
            {renderStreakFlames()}
          </View>
          
          <Text style={[styles.streakMessage, { color: getStreakColor() }]}>
            {getStreakMessage()}
          </Text>
        </View>

        {/* Sync Status Section */}
        <View style={styles.syncSection}>
          <View style={styles.syncHeader}>
            <Ionicons 
              name="cloud" 
              size={16} 
              color={getSyncStatusColor()} 
            />
            <Text style={styles.syncTitle}>Sync Status</Text>
          </View>
          
          <View style={styles.syncInfo}>
            <Text style={[styles.syncStatus, { color: getSyncStatusColor() }]}>
              {getSyncStatusText()}
            </Text>
            <Text style={styles.syncTime}>
              Last sync: {formatLastSyncTime()}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {syncStatus.unsyncedCount}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {streak >= 7 ? '🔥' : streak >= 3 ? '💪' : '🌱'}
            </Text>
            <Text style={styles.statLabel}>Status</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    gap: 20,
  },
  streakSection: {
    alignItems: 'center',
  },
  flamesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 4,
  },
  flame: {
    margin: 2,
  },
  streakMessage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  syncSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  syncTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  syncInfo: {
    gap: 4,
  },
  syncStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  syncTime: {
    fontSize: 12,
    color: '#666666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});

export default ConsistencyCard;
