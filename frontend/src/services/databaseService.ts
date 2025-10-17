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
  exercises?: LocalExercise[];
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
  notes?: string;
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
  water_intake?: number;
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
    
    // Add water_intake column if it doesn't exist (migration)
    try {
      await this.db.execAsync(`
        ALTER TABLE local_body_stats ADD COLUMN water_intake REAL;
      `);
      console.log('Added water_intake column to local_body_stats');
    } catch (error) {
      // Column might already exist, ignore error
      console.log('water_intake column already exists or migration failed:', error);
    }
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
    try {
      // Wait for database initialization if needed
      if (!this.db) {
        console.warn('Database not initialized in getUnsyncedItems, waiting...');
        await this.init();
      }

      // Double-check after potential initialization
      if (!this.db) {
        console.error('Database still not initialized after wait in getUnsyncedItems');
        return [];
      }

      const query = `
        SELECT * FROM sync_queue 
        WHERE synced = FALSE 
        ORDER BY created_at ASC
      `;

      // Store reference to avoid race condition
      const dbRef = this.db;
      const result = await dbRef.getAllAsync(query);
      return result as SyncQueueItem[];
    } catch (error) {
      console.error('Error fetching unsynced items from database:', error);
      // Gracefully handle NullPointerException and other database errors
      if (error instanceof Error && error.message.includes('NullPointerException')) {
        console.warn('Database NullPointerException in getUnsyncedItems - returning empty array');
      }
      return []; // Return empty array instead of throwing
    }
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
    if (!this.db) {
      console.error('Database not initialized');
      throw new Error('Database not initialized');
    }

    try {
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

      console.log(`Workout saved successfully: ${localId}`);

      // Add to sync queue
      await this.addToSyncQueue('workouts', localId, 'INSERT', {
        ...workout,
        local_id: localId,
        created_at: now,
        updated_at: now
      });

      return localId;
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error;
    }
  }

  async getWorkouts(userId: number, limit: number = 50): Promise<LocalWorkout[]> {
    try {
      // Wait for database initialization if needed
      if (!this.db) {
        console.warn('Database not initialized in getWorkouts, waiting...');
        await this.init();
      }

      // Double-check after potential initialization
      if (!this.db) {
        console.error('Database still not initialized after wait in getWorkouts');
        return [];
      }

      const query = `
        SELECT * FROM local_workouts 
        WHERE user_id = ? 
        ORDER BY date DESC, created_at DESC 
        LIMIT ?
      `;

      // Store reference to avoid race condition
      const dbRef = this.db;
      const result = await dbRef.getAllAsync(query, [userId, limit]);
      return result as LocalWorkout[];
    } catch (error) {
      console.error('Error fetching workouts from database:', error);
      // Gracefully handle NullPointerException and other database errors
      if (error instanceof Error && error.message.includes('NullPointerException')) {
        console.warn('Database NullPointerException in getWorkouts - returning empty array');
      } else if (!this.db) {
        console.warn('Database became null during getWorkouts operation');
      }
      return []; // Return empty array instead of throwing
    }
  }

  async updateWorkout(localId: string, updates: Partial<Pick<LocalWorkout, 'name' | 'duration_minutes' | 'notes'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }
    if (updates.duration_minutes !== undefined) {
      setClauses.push('duration_minutes = ?');
      values.push(updates.duration_minutes);
    }
    if (updates.notes !== undefined) {
      setClauses.push('notes = ?');
      values.push(updates.notes);
    }

    setClauses.push('updated_at = ?');
    values.push(now);
    setClauses.push('synced = ?');
    values.push(false);

    values.push(localId);

    const query = `
      UPDATE local_workouts 
      SET ${setClauses.join(', ')}
      WHERE local_id = ?
    `;

    await this.db.runAsync(query, values);

    // Add to sync queue
    await this.addToSyncQueue('workouts', localId, 'UPDATE', {
      local_id: localId,
      ...updates,
      updated_at: now
    });
  }

  async deleteWorkout(localId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // First, get the workout data before deleting
    const workout = await this.db.getFirstAsync(
      'SELECT * FROM local_workouts WHERE local_id = ?',
      [localId]
    );

    // Delete the workout
    const query = 'DELETE FROM local_workouts WHERE local_id = ?';
    await this.db.runAsync(query, [localId]);

    // Add to sync queue for backend deletion
    if (workout) {
      await this.addToSyncQueue('workouts', localId, 'DELETE', workout);
    }
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
    try {
      // Wait for database initialization if needed
      if (!this.db) {
        console.warn('Database not initialized in getNutritionLogs, waiting...');
        await this.init();
      }

      // Double-check after potential initialization
      if (!this.db) {
        console.error('Database still not initialized after wait in getNutritionLogs');
        return [];
      }

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

      // Store reference to avoid race condition
      const dbRef = this.db;
      const result = await dbRef.getAllAsync(query, params);
      return result as LocalNutritionLog[];
    } catch (error) {
      console.error('Error fetching nutrition logs from database:', error);
      // Gracefully handle NullPointerException and other database errors
      if (error instanceof Error && error.message.includes('NullPointerException')) {
        console.warn('Database NullPointerException in getNutritionLogs - returning empty array');
      }
      return []; // Return empty array instead of throwing
    }
  }

  async updateNutritionLog(localId: string, updates: Partial<Pick<LocalNutritionLog, 'food_name' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.food_name !== undefined) {
      setClauses.push('food_name = ?');
      values.push(updates.food_name);
    }
    if (updates.calories !== undefined) {
      setClauses.push('calories = ?');
      values.push(updates.calories);
    }
    if (updates.protein_g !== undefined) {
      setClauses.push('protein_g = ?');
      values.push(updates.protein_g);
    }
    if (updates.carbs_g !== undefined) {
      setClauses.push('carbs_g = ?');
      values.push(updates.carbs_g);
    }
    if (updates.fat_g !== undefined) {
      setClauses.push('fat_g = ?');
      values.push(updates.fat_g);
    }

    setClauses.push('updated_at = ?');
    values.push(now);

    setClauses.push('synced = ?');
    values.push(false);

    values.push(localId);

    const query = `UPDATE local_nutrition_logs SET ${setClauses.join(', ')} WHERE local_id = ?`;

    await this.db.runAsync(query, values);

    // Fetch the updated item for the sync queue
    const updatedItem = await this.db.getFirstAsync<LocalNutritionLog>(
      'SELECT * FROM local_nutrition_logs WHERE local_id = ?',
      [localId]
    );

    if (updatedItem) {
      await this.addToSyncQueue('nutrition', localId, 'UPDATE', updatedItem);
    }

    console.log(`Updated nutrition log locally: ${localId}`);
  }

  async deleteNutritionLog(localId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Fetch the item before deletion for the sync queue
    const itemToDelete = await this.db.getFirstAsync<LocalNutritionLog>(
      'SELECT * FROM local_nutrition_logs WHERE local_id = ?',
      [localId]
    );

    if (itemToDelete) {
      await this.db.runAsync('DELETE FROM local_nutrition_logs WHERE local_id = ?', [localId]);
      await this.addToSyncQueue(
        'nutrition',
        localId,
        'DELETE',
        itemToDelete
      );
      console.log(`Deleted nutrition log locally: ${localId}`);
    } else {
      console.warn(`Nutrition log with local_id ${localId} not found for deletion.`);
    }
  }

  // Body Stats Operations
  async saveBodyStat(bodyStat: Omit<LocalBodyStat, 'id' | 'synced' | 'created_at' | 'updated_at'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const localId = `bodystat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const query = `
      INSERT INTO local_body_stats (local_id, user_id, weight_kg, body_fat_percentage, muscle_mass_kg, waist_cm, chest_cm, arm_cm, thigh_cm, water_intake, date, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      bodyStat.water_intake || null,
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

  async updateBodyStat(localId: string, updates: Partial<Pick<LocalBodyStat, 'weight_kg' | 'body_fat_percentage' | 'muscle_mass_kg' | 'waist_cm' | 'chest_cm' | 'arm_cm' | 'thigh_cm' | 'water_intake'>>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const now = new Date().toISOString();
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.weight_kg !== undefined) {
      setClauses.push('weight_kg = ?');
      values.push(updates.weight_kg);
    }
    if (updates.body_fat_percentage !== undefined) {
      setClauses.push('body_fat_percentage = ?');
      values.push(updates.body_fat_percentage);
    }
    if (updates.muscle_mass_kg !== undefined) {
      setClauses.push('muscle_mass_kg = ?');
      values.push(updates.muscle_mass_kg);
    }
    if (updates.waist_cm !== undefined) {
      setClauses.push('waist_cm = ?');
      values.push(updates.waist_cm);
    }
    if (updates.chest_cm !== undefined) {
      setClauses.push('chest_cm = ?');
      values.push(updates.chest_cm);
    }
    if (updates.arm_cm !== undefined) {
      setClauses.push('arm_cm = ?');
      values.push(updates.arm_cm);
    }
    if (updates.thigh_cm !== undefined) {
      setClauses.push('thigh_cm = ?');
      values.push(updates.thigh_cm);
    }
    if (updates.water_intake !== undefined) {
      setClauses.push('water_intake = ?');
      values.push(updates.water_intake);
    }

    setClauses.push('updated_at = ?');
    values.push(now);
    setClauses.push('synced = ?');
    values.push(false);

    values.push(localId);

    const query = `
      UPDATE local_body_stats 
      SET ${setClauses.join(', ')}
      WHERE local_id = ?
    `;

    await this.db.runAsync(query, values);

    // Fetch the updated item for the sync queue
    const updatedItem = await this.db.getFirstAsync<LocalBodyStat>(
      'SELECT * FROM local_body_stats WHERE local_id = ?',
      [localId]
    );

    if (updatedItem) {
      await this.addToSyncQueue('body_stats', localId, 'UPDATE', updatedItem);
    }
  }

  async getBodyStats(userId: number, limit: number = 50): Promise<LocalBodyStat[]> {
    try {
      // Wait for database initialization if needed
      if (!this.db) {
        console.warn('Database not initialized in getBodyStats, waiting...');
        await this.init();
      }

      // Double-check after potential initialization
      if (!this.db) {
        console.error('Database still not initialized after wait in getBodyStats');
        return [];
      }

      const query = `
        SELECT * FROM local_body_stats 
        WHERE user_id = ? 
        ORDER BY date DESC, created_at DESC 
        LIMIT ?
      `;

      // Store reference to avoid race condition
      const dbRef = this.db;
      const result = await dbRef.getAllAsync(query, [userId, limit]);
      return result as LocalBodyStat[];
    } catch (error) {
      console.error('Error fetching body stats from database:', error);
      // Gracefully handle NullPointerException and other database errors
      if (error instanceof Error && error.message.includes('NullPointerException')) {
        console.warn('Database NullPointerException in getBodyStats - returning empty array');
      }
      return []; // Return empty array instead of throwing
    }
  }

  // Utility Methods
  async getUnsyncedCount(): Promise<number> {
    try {
      // Wait for database initialization if needed
      if (!this.db) {
        console.warn('Database not initialized in getUnsyncedCount, waiting...');
        await this.init();
      }

      // Double-check after potential initialization
      if (!this.db) {
        console.error('Database still not initialized after wait in getUnsyncedCount');
        return 0;
      }

      const query = `
        SELECT COUNT(*) as count FROM sync_queue 
        WHERE synced = FALSE
      `;

      // Store reference to avoid race condition
      const dbRef = this.db;
      const result = await dbRef.getFirstAsync(query);
      return (result as any)?.count || 0;
    } catch (error) {
      console.error('Error getting unsynced count from database:', error);
      // Gracefully handle NullPointerException and other database errors
      if (error instanceof Error && error.message.includes('NullPointerException')) {
        console.warn('Database NullPointerException in getUnsyncedCount - returning 0');
      }
      return 0; // Return 0 instead of throwing
    }
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

