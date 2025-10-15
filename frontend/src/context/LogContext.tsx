import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Workout, NutritionLog, BodyStat, DailySummary } from '../types';
import { fitnessService } from '../services/fitnessService';
import { nutritionService } from '../services/nutritionService';
import { bodyStatsService } from '../services/bodyStatsService';

interface LogState {
  workouts: Workout[];
  nutritionLogs: NutritionLog[];
  bodyStats: BodyStat[];
  dailySummary: DailySummary | null;
  isLoading: boolean;
  lastSync: Date | null;
}

type LogAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_WORKOUTS'; payload: Workout[] }
  | { type: 'ADD_WORKOUT'; payload: Workout }
  | { type: 'UPDATE_WORKOUT'; payload: Workout }
  | { type: 'DELETE_WORKOUT'; payload: number }
  | { type: 'SET_NUTRITION_LOGS'; payload: NutritionLog[] }
  | { type: 'ADD_NUTRITION_LOG'; payload: NutritionLog }
  | { type: 'UPDATE_NUTRITION_LOG'; payload: NutritionLog }
  | { type: 'DELETE_NUTRITION_LOG'; payload: number }
  | { type: 'SET_BODY_STATS'; payload: BodyStat[] }
  | { type: 'ADD_BODY_STAT'; payload: BodyStat }
  | { type: 'UPDATE_BODY_STAT'; payload: BodyStat }
  | { type: 'DELETE_BODY_STAT'; payload: number }
  | { type: 'SET_DAILY_SUMMARY'; payload: DailySummary }
  | { type: 'SET_LAST_SYNC'; payload: Date };

const initialState: LogState = {
  workouts: [],
  nutritionLogs: [],
  bodyStats: [],
  dailySummary: null,
  isLoading: false,
  lastSync: null,
};

const logReducer = (state: LogState, action: LogAction): LogState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    // Workout actions
    case 'SET_WORKOUTS':
      return { ...state, workouts: action.payload };
    case 'ADD_WORKOUT':
      return { ...state, workouts: [...state.workouts, action.payload] };
    case 'UPDATE_WORKOUT':
      return {
        ...state,
        workouts: state.workouts.map(w => 
          w.id === action.payload.id ? action.payload : w
        ),
      };
    case 'DELETE_WORKOUT':
      return {
        ...state,
        workouts: state.workouts.filter(w => w.id !== action.payload),
      };
    
    // Nutrition actions
    case 'SET_NUTRITION_LOGS':
      return { ...state, nutritionLogs: action.payload };
    case 'ADD_NUTRITION_LOG':
      return { ...state, nutritionLogs: [...state.nutritionLogs, action.payload] };
    case 'UPDATE_NUTRITION_LOG':
      return {
        ...state,
        nutritionLogs: state.nutritionLogs.map(n => 
          n.id === action.payload.id ? action.payload : n
        ),
      };
    case 'DELETE_NUTRITION_LOG':
      return {
        ...state,
        nutritionLogs: state.nutritionLogs.filter(n => n.id !== action.payload),
      };
    
    // Body stats actions
    case 'SET_BODY_STATS':
      return { ...state, bodyStats: action.payload };
    case 'ADD_BODY_STAT':
      return { ...state, bodyStats: [...state.bodyStats, action.payload] };
    case 'UPDATE_BODY_STAT':
      return {
        ...state,
        bodyStats: state.bodyStats.map(b => 
          b.id === action.payload.id ? action.payload : b
        ),
      };
    case 'DELETE_BODY_STAT':
      return {
        ...state,
        bodyStats: state.bodyStats.filter(b => b.id !== action.payload),
      };
    
    // Summary actions
    case 'SET_DAILY_SUMMARY':
      return { ...state, dailySummary: action.payload };
    case 'SET_LAST_SYNC':
      return { ...state, lastSync: action.payload };
    
    default:
      return state;
  }
};

interface LogContextType {
  state: LogState;
  // Fitness methods
  loadFitnessSessions: (userId: number) => Promise<void>;
  addFitnessSession: (userId: number, fitnessSession: any) => Promise<void>;
  updateFitnessSession: (userId: number, fitnessId: number, fitnessSession: any) => Promise<void>;
  deleteFitnessSession: (userId: number, fitnessId: number) => Promise<void>;
  
  // Nutrition methods
  loadNutritionLogs: (userId: number) => Promise<void>;
  addNutritionLog: (userId: number, log: any) => Promise<void>;
  updateNutritionLog: (userId: number, logId: number, log: any) => Promise<void>;
  deleteNutritionLog: (userId: number, logId: number) => Promise<void>;
  
  // Body stats methods
  loadBodyStats: (userId: number) => Promise<void>;
  addBodyStat: (userId: number, stat: any) => Promise<void>;
  updateBodyStat: (userId: number, statId: number, stat: any) => Promise<void>;
  deleteBodyStat: (userId: number, statId: number) => Promise<void>;
  
  // Summary methods
  loadDailySummary: (userId: number, date: string) => Promise<void>;
  
  // Sync methods
  syncAllData: (userId: number) => Promise<void>;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

export const LogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(logReducer, initialState);

  // Fitness methods
  const loadFitnessSessions = async (userId: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const fitnessSessions = await fitnessService.getFitnessSessions(userId);
      dispatch({ type: 'SET_WORKOUTS', payload: fitnessSessions });
    } catch (error) {
      console.error('Failed to load fitness sessions:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addFitnessSession = async (userId: number, fitnessSession: any) => {
    try {
      const newFitnessSession = await fitnessService.createFitnessSession(userId, fitnessSession);
      dispatch({ type: 'ADD_WORKOUT', payload: newFitnessSession });
    } catch (error) {
      console.error('Failed to add fitness session:', error);
      throw error;
    }
  };

  const updateFitnessSession = async (userId: number, fitnessId: number, fitnessSession: any) => {
    try {
      const updatedFitnessSession = await fitnessService.updateFitnessSession(userId, fitnessId, fitnessSession);
      dispatch({ type: 'UPDATE_WORKOUT', payload: updatedFitnessSession });
    } catch (error) {
      console.error('Failed to update fitness session:', error);
      throw error;
    }
  };

  const deleteFitnessSession = async (userId: number, fitnessId: number) => {
    try {
      await fitnessService.deleteFitnessSession(userId, fitnessId);
      dispatch({ type: 'DELETE_WORKOUT', payload: fitnessId });
    } catch (error) {
      console.error('Failed to delete fitness session:', error);
      throw error;
    }
  };

  // Nutrition methods
  const loadNutritionLogs = async (userId: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const logs = await nutritionService.getNutritionLogs(userId);
      dispatch({ type: 'SET_NUTRITION_LOGS', payload: logs });
    } catch (error) {
      console.error('Failed to load nutrition logs:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addNutritionLog = async (userId: number, log: any) => {
    try {
      const newLog = await nutritionService.createNutritionLog(userId, log);
      dispatch({ type: 'ADD_NUTRITION_LOG', payload: newLog });
    } catch (error) {
      console.error('Failed to add nutrition log:', error);
      throw error;
    }
  };

  const updateNutritionLog = async (userId: number, logId: number, log: any) => {
    try {
      const updatedLog = await nutritionService.updateNutritionLog(userId, logId, log);
      dispatch({ type: 'UPDATE_NUTRITION_LOG', payload: updatedLog });
    } catch (error) {
      console.error('Failed to update nutrition log:', error);
      throw error;
    }
  };

  const deleteNutritionLog = async (userId: number, logId: number) => {
    try {
      await nutritionService.deleteNutritionLog(userId, logId);
      dispatch({ type: 'DELETE_NUTRITION_LOG', payload: logId });
    } catch (error) {
      console.error('Failed to delete nutrition log:', error);
      throw error;
    }
  };

  // Body stats methods
  const loadBodyStats = async (userId: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const stats = await bodyStatsService.getBodyStats(userId);
      dispatch({ type: 'SET_BODY_STATS', payload: stats });
    } catch (error) {
      console.error('Failed to load body stats:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addBodyStat = async (userId: number, stat: any) => {
    try {
      const newStat = await bodyStatsService.createBodyStat(userId, stat);
      dispatch({ type: 'ADD_BODY_STAT', payload: newStat });
    } catch (error) {
      console.error('Failed to add body stat:', error);
      throw error;
    }
  };

  const updateBodyStat = async (userId: number, statId: number, stat: any) => {
    try {
      const updatedStat = await bodyStatsService.updateBodyStat(userId, statId, stat);
      dispatch({ type: 'UPDATE_BODY_STAT', payload: updatedStat });
    } catch (error) {
      console.error('Failed to update body stat:', error);
      throw error;
    }
  };

  const deleteBodyStat = async (userId: number, statId: number) => {
    try {
      await bodyStatsService.deleteBodyStat(userId, statId);
      dispatch({ type: 'DELETE_BODY_STAT', payload: statId });
    } catch (error) {
      console.error('Failed to delete body stat:', error);
      throw error;
    }
  };

  // Summary methods
  const loadDailySummary = async (userId: number, date: string) => {
    try {
      const summary = await fitnessService.getDailySummary(userId, date);
      dispatch({ type: 'SET_DAILY_SUMMARY', payload: summary });
    } catch (error) {
      console.error('Failed to load daily summary:', error);
    }
  };

  // Sync methods
  const syncAllData = async (userId: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await Promise.all([
        loadFitnessSessions(userId),
        loadNutritionLogs(userId),
        loadBodyStats(userId),
      ]);
      
      dispatch({ type: 'SET_LAST_SYNC', payload: new Date() });
    } catch (error) {
      console.error('Failed to sync data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: LogContextType = {
    state,
    loadFitnessSessions,
    addFitnessSession,
    updateFitnessSession,
    deleteFitnessSession,
    loadNutritionLogs,
    addNutritionLog,
    updateNutritionLog,
    deleteNutritionLog,
    loadBodyStats,
    addBodyStat,
    updateBodyStat,
    deleteBodyStat,
    loadDailySummary,
    syncAllData,
  };

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>;
};

export const useLog = (): LogContextType => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLog must be used within a LogProvider');
  }
  return context;
};
