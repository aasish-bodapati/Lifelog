import * as SQLite from 'expo-sqlite';

export interface SyncQueueItem {
  id?: number;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  data: string; // JSON string
  created_at: string;
  synced: boolean;
}

export interface LocalWorkout {
  id?: number;
  local_id: string;
  user_id: number;
  name: string;
  date: string;
  duration_minutes?: number;
  notes?: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalExercise {
  id?: number;
  local_id: string;
  workout_id: string;
  name: string;
  sets: number;
  reps: number;
  weight_kg?: number;
  duration_seconds?: number;
  distance_km?: number;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalNutritionLog {
  id?: number;
  local_id: string;
  user_id: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  date: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalBodyStat {
  id?: number;
  local_id: string;
  user_id: number;
  weight_kg?: number;
  body_fat_percentage?: number;
  muscle_mass_kg?: number;
  waist_cm?: number;
  chest_cm?: number;
  arm_cm?: number;
  thigh_cm?: number;
  date: string;
  synced: boolean;
  created_at: string;
  updated_at: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('lifelog_local.db');
      await this.createTables();
      console.log('Local database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize local database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create SyncQueue table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced BOOLEAN DEFAULT FALSE
      );
    `);

    // Create local_workouts table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_minutes INTEGER,
        notes TEXT,
        synced BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create local_exercises table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_id TEXT UNIQUE NOT NULL,
        workout_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sets INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        weight_kg REAL,
        duration_seconds INTEGER,
        distance_km REAL,
        synced BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create local_nutrition_logs table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_nutrition_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
        food_name TEXT NOT NULL,
        calories INTEGER NOT NULL,
        protein_g REAL NOT NULL,
        carbs_g REAL NOT NULL,
        fat_g REAL NOT NULL,
        fiber_g REAL,
        sugar_g REAL,
        sodium_mg REAL,
        date TEXT NOT NULL,
        synced BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create local_body_stats table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_body_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        local_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        weight_kg REAL,
        body_fat_percentage REAL,
        muscle_mass_kg REAL,
        waist_cm REAL,
        chest_cm REAL,
        arm_cm REAL,
        thigh_cm REAL,
        date TEXT NOT NULL,
        synced BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Local database tables created successfully');
  }

  // Sync Queue Operations
  async addToSyncQueue(tableName: string, recordId: string, operation: 'INSERT' | 'UPDATE' | 'DELETE', data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO sync_queue (table_name, record_id, operation, data)
      VALUES (?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [tableName, recordId, operation, JSON.stringify(data)]);
  }

  async getUnsyncedItems(): Promise<SyncQueueItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT * FROM sync_queue 
      WHERE synced = FALSE 
      ORDER BY created_at ASC
    `;

    const result = await this.db.getAllAsync(query);
    return result as SyncQueueItem[];
  }

  async markAsSynced(syncQueueId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      UPDATE sync_queue 
      SET synced = TRUE 
      WHERE id = ?
    `;

    await this.db.runAsync(query, [syncQueueId]);
  }

  async clearSyncedItems(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      DELETE FROM sync_queue 
      WHERE synced = TRUE
    `;

    await this.db.runAsync(query);
  }

  // Workout Operations
  async saveWorkout(workout: Omit<LocalWorkout, 'id' | 'synced' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const localId = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO local_workouts (local_id, user_id, name, date, duration_minutes, notes, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [
      localId,
      workout.user_id,
      workout.name,
      workout.date,
      workout.duration_minutes || null,
      workout.notes || null,
      false,
      now,
      now
    ]);

    // Add to sync queue
    await this.addToSyncQueue('workouts', localId, 'INSERT', {
      ...workout,
      local_id: localId,
      created_at: now,
      updated_at: now
    });

    return localId;
  }

  async getWorkouts(userId: number, limit: number = 50): Promise<LocalWorkout[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT * FROM local_workouts 
      WHERE user_id = ? 
      ORDER BY date DESC, created_at DESC 
      LIMIT ?
    `;

    const result = await this.db.getAllAsync(query, [userId, limit]);
    return result as LocalWorkout[];
  }

  // Nutrition Operations
  async saveNutritionLog(nutrition: Omit<LocalNutritionLog, 'id' | 'synced' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const localId = `nutrition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO local_nutrition_logs (local_id, user_id, meal_type, food_name, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, date, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [
      localId,
      nutrition.user_id,
      nutrition.meal_type,
      nutrition.food_name,
      nutrition.calories,
      nutrition.protein_g,
      nutrition.carbs_g,
      nutrition.fat_g,
      nutrition.fiber_g || null,
      nutrition.sugar_g || null,
      nutrition.sodium_mg || null,
      nutrition.date,
      false,
      now,
      now
    ]);

    // Add to sync queue
    await this.addToSyncQueue('nutrition', localId, 'INSERT', {
      ...nutrition,
      local_id: localId,
      created_at: now,
      updated_at: now
    });

    return localId;
  }

  async getNutritionLogs(userId: number, date?: string, limit: number = 50): Promise<LocalNutritionLog[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT * FROM local_nutrition_logs 
      WHERE user_id = ?
    `;
    const params: any[] = [userId];

    if (date) {
      query += ` AND date = ?`;
      params.push(date);
    }

    query += ` ORDER BY date DESC, created_at DESC LIMIT ?`;
    params.push(limit);

    const result = await this.db.getAllAsync(query, params);
    return result as LocalNutritionLog[];
  }

  // Body Stats Operations
  async saveBodyStat(bodyStat: Omit<LocalBodyStat, 'id' | 'synced' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const localId = `bodystat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO local_body_stats (local_id, user_id, weight_kg, body_fat_percentage, muscle_mass_kg, waist_cm, chest_cm, arm_cm, thigh_cm, date, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.runAsync(query, [
      localId,
      bodyStat.user_id,
      bodyStat.weight_kg || null,
      bodyStat.body_fat_percentage || null,
      bodyStat.muscle_mass_kg || null,
      bodyStat.waist_cm || null,
      bodyStat.chest_cm || null,
      bodyStat.arm_cm || null,
      bodyStat.thigh_cm || null,
      bodyStat.date,
      false,
      now,
      now
    ]);

    // Add to sync queue
    await this.addToSyncQueue('body_stats', localId, 'INSERT', {
      ...bodyStat,
      local_id: localId,
      created_at: now,
      updated_at: now
    });

    return localId;
  }

  async getBodyStats(userId: number, limit: number = 50): Promise<LocalBodyStat[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT * FROM local_body_stats 
      WHERE user_id = ? 
      ORDER BY date DESC, created_at DESC 
      LIMIT ?
    `;

    const result = await this.db.getAllAsync(query, [userId, limit]);
    return result as LocalBodyStat[];
  }

  // Utility Methods
  async getUnsyncedCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT COUNT(*) as count FROM sync_queue 
      WHERE synced = FALSE
    `;

    const result = await this.db.getFirstAsync(query);
    return (result as any)?.count || 0;
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DELETE FROM sync_queue;
      DELETE FROM local_workouts;
      DELETE FROM local_exercises;
      DELETE FROM local_nutrition_logs;
      DELETE FROM local_body_stats;
    `);
  }
}

export const databaseService = new DatabaseService();

