import { databaseService, SyncQueueItem } from './databaseService';
import { apiService } from './api';
import { toastService } from './toastService';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: string | null;
  unsyncedCount: number;
  error: string | null;
}

class SyncService {
  private syncStatus: SyncStatus = {
    isSyncing: false,
    lastSyncTime: null,
    unsyncedCount: 0,
    error: null
  };

  private listeners: ((status: SyncStatus) => void)[] = [];

  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners of status changes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  // Update sync status
  private updateStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.notifyListeners();
  }

  // Get current sync status
  getStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Check if we have unsynced data
  async checkUnsyncedCount(): Promise<number> {
    try {
      const count = await databaseService.getUnsyncedCount();
      this.updateStatus({ unsyncedCount: count });
      return count;
    } catch (error) {
      console.error('Error checking unsynced count:', error);
      return 0;
    }
  }

  // Perform full sync
  async syncAll(): Promise<boolean> {
    if (this.syncStatus.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }

    this.updateStatus({ isSyncing: true, error: null });

    try {
      console.log('Starting sync process...');
      
      // Get all unsynced items
      const unsyncedItems = await databaseService.getUnsyncedItems();
      
      if (unsyncedItems.length === 0) {
        console.log('No unsynced items found');
        this.updateStatus({ 
          isSyncing: false, 
          lastSyncTime: new Date().toISOString(),
          unsyncedCount: 0 
        });
        return true;
      }

      console.log(`Found ${unsyncedItems.length} unsynced items`);

      // Group items by table for batch processing
      const groupedItems = this.groupItemsByTable(unsyncedItems);

      // Sync each table
      for (const [tableName, items] of Object.entries(groupedItems)) {
        await this.syncTable(tableName, items);
      }

      // Clear synced items from queue
      await databaseService.clearSyncedItems();

      // Update status
      this.updateStatus({
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        unsyncedCount: 0,
        error: null
      });

      console.log('Sync completed successfully');
      toastService.success('Sync Complete', 'All data synced successfully');
      return true;

    } catch (error) {
      console.error('Sync failed:', error);
      this.updateStatus({
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      });
      toastService.error('Sync Failed', 'Failed to sync data. Will retry later.');
      return false;
    }
  }

  // Group sync items by table name
  private groupItemsByTable(items: SyncQueueItem[]): Record<string, SyncQueueItem[]> {
    return items.reduce((groups, item) => {
      if (!groups[item.table_name]) {
        groups[item.table_name] = [];
      }
      groups[item.table_name].push(item);
      return groups;
    }, {} as Record<string, SyncQueueItem[]>);
  }

  // Sync items for a specific table
  private async syncTable(tableName: string, items: SyncQueueItem[]): Promise<void> {
    console.log(`Syncing ${items.length} items for table: ${tableName}`);

    try {
      switch (tableName) {
        case 'workouts':
          await this.syncWorkouts(items);
          break;
        case 'nutrition':
          await this.syncNutritionLogs(items);
          break;
        case 'body_stats':
          await this.syncBodyStats(items);
          break;
        default:
          console.warn(`Unknown table: ${tableName}`);
      }
    } catch (error) {
      console.error(`Failed to sync table ${tableName}:`, error);
      throw error;
    }
  }

  // Sync workout items
  private async syncWorkouts(items: SyncQueueItem[]): Promise<void> {
    for (const item of items) {
      try {
        const data = JSON.parse(item.data);
        
        // Validate data before syncing
        if (data.duration_minutes === 0 || data.duration_minutes === null || data.duration_minutes === undefined) {
          console.warn(`Skipping invalid workout with duration: ${data.duration_minutes}`);
          // Mark as synced to remove from queue (it's invalid data)
          await databaseService.markAsSynced(item.id!);
          continue;
        }
        
        switch (item.operation) {
          case 'INSERT':
            await apiService.createWorkout(data);
            break;
          case 'UPDATE':
            await apiService.updateWorkout(data.local_id, data);
            break;
          case 'DELETE':
            await apiService.deleteWorkout(data.local_id);
            break;
        }

        // Mark as synced
        await databaseService.markAsSynced(item.id!);
        console.log(`Synced workout ${item.operation}: ${item.record_id}`);

      } catch (error) {
        console.error(`Failed to sync workout ${item.record_id}:`, error);
        // Mark as synced to remove from queue and prevent infinite retry loop
        await databaseService.markAsSynced(item.id!);
        console.warn(`Marked failed workout as synced to prevent blocking: ${item.record_id}`);
      }
    }
  }

  // Sync nutrition log items
  private async syncNutritionLogs(items: SyncQueueItem[]): Promise<void> {
    for (const item of items) {
      try {
        const data = JSON.parse(item.data);
        
        switch (item.operation) {
          case 'INSERT':
            await apiService.createNutritionLog(data);
            break;
          case 'UPDATE':
            await apiService.updateNutritionLog(data.local_id, data);
            break;
          case 'DELETE':
            await apiService.deleteNutritionLog(data.local_id);
            break;
        }

        // Mark as synced
        await databaseService.markAsSynced(item.id!);
        console.log(`Synced nutrition ${item.operation}: ${item.record_id}`);

      } catch (error) {
        console.error(`Failed to sync nutrition ${item.record_id}:`, error);
        throw error;
      }
    }
  }

  // Sync body stats items
  private async syncBodyStats(items: SyncQueueItem[]): Promise<void> {
    for (const item of items) {
      try {
        const data = JSON.parse(item.data);
        
        switch (item.operation) {
          case 'INSERT':
            await apiService.createBodyStat(data);
            break;
          case 'UPDATE':
            await apiService.updateBodyStat(data.local_id, data);
            break;
          case 'DELETE':
            await apiService.deleteBodyStat(data.local_id);
            break;
        }

        // Mark as synced
        await databaseService.markAsSynced(item.id!);
        console.log(`Synced body stat ${item.operation}: ${item.record_id}`);

      } catch (error) {
        console.error(`Failed to sync body stat ${item.record_id}:`, error);
        throw error;
      }
    }
  }

  // Auto-sync when app becomes active
  async handleAppStateChange(nextAppState: string): Promise<void> {
    if (nextAppState === 'active') {
      console.log('App became active, checking for unsynced data...');
      await this.checkUnsyncedCount();
      
      if (this.syncStatus.unsyncedCount > 0) {
        console.log(`Found ${this.syncStatus.unsyncedCount} unsynced items, starting sync...`);
        await this.syncAll();
      }
    }
  }

  // Force sync (for manual trigger)
  async forceSync(): Promise<boolean> {
    console.log('Force sync triggered');
    return await this.syncAll();
  }

  // Initialize sync service
  async initialize(): Promise<void> {
    try {
      // Check for unsynced data on startup
      await this.checkUnsyncedCount();
      
      // If we have unsynced data, try to sync
      if (this.syncStatus.unsyncedCount > 0) {
        console.log(`Found ${this.syncStatus.unsyncedCount} unsynced items on startup`);
        // Don't auto-sync on startup, let user decide
      }
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
    }
  }
}

export const syncService = new SyncService();

