import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { syncService, SyncStatus } from '../services/syncService';

interface SyncIndicatorProps {
  onPress?: () => void;
}

const SyncIndicator: React.FC<SyncIndicatorProps> = ({ onPress }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    const unsubscribe = syncService.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  const getStatusColor = () => {
    if (syncStatus.isSyncing) return '#007AFF';
    if (syncStatus.error) return '#FF3B30';
    if (syncStatus.unsyncedCount > 0) return '#FF9500';
    return '#34C759';
  };

  const getStatusText = () => {
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.error) return 'Sync Failed';
    if (syncStatus.unsyncedCount > 0) return `${syncStatus.unsyncedCount} pending`;
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) {
      return <ActivityIndicator size="small" color="#FFFFFF" />;
    }
    if (syncStatus.error) {
      return <Text style={styles.iconText}>⚠️</Text>;
    }
    if (syncStatus.unsyncedCount > 0) {
      return <Text style={styles.iconText}>⏳</Text>;
    }
    return <Text style={styles.iconText}>✓</Text>;
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (syncStatus.unsyncedCount > 0 && !syncStatus.isSyncing) {
      syncService.forceSync();
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: getStatusColor() }]} 
      onPress={handlePress}
      disabled={syncStatus.isSyncing}
    >
      <View style={styles.content}>
        {getStatusIcon()}
        <Text style={styles.text}>{getStatusText()}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SyncIndicator;
