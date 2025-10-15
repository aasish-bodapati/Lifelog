import api from './api';
import { Workout, WorkoutCreate, DailySummary } from '../types';

export const fitnessService = {
  async getFitnessSessions(userId: number, params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<Workout[]> {
    const response = await api.get('/fitness/', {
      params: { user_id: userId, ...params }
    });
    return response.data;
  },

  async getFitnessSession(userId: number, fitnessId: number): Promise<Workout> {
    const response = await api.get(`/fitness/${fitnessId}`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async createFitnessSession(userId: number, fitnessSession: WorkoutCreate): Promise<Workout> {
    const response = await api.post('/fitness/', fitnessSession, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async updateFitnessSession(userId: number, fitnessId: number, fitnessSession: Partial<WorkoutCreate>): Promise<Workout> {
    const response = await api.put(`/fitness/${fitnessId}`, fitnessSession, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async deleteFitnessSession(userId: number, fitnessId: number): Promise<void> {
    await api.delete(`/fitness/${fitnessId}`, {
      params: { user_id: userId }
    });
  },

  async getRecentFitnessSessions(userId: number, limit: number = 5): Promise<Workout[]> {
    const response = await api.get(`/fitness/recent/${limit}`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async getDailySummary(userId: number, date: string): Promise<DailySummary> {
    const response = await api.get(`/summary/daily/${date}`, {
      params: { user_id: userId }
    });
    return response.data;
  },
};
