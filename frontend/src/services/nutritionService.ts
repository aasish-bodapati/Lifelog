import api from './api';
import { NutritionLog, NutritionLogCreate } from '../types';

export const nutritionService = {
  async getNutritionLogs(userId: number, params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    meal_type?: string;
  }): Promise<NutritionLog[]> {
    const response = await api.get('/nutrition/', {
      params: { user_id: userId, ...params }
    });
    return response.data;
  },

  async getDailyNutrition(userId: number, date: string): Promise<NutritionLog[]> {
    const response = await api.get(`/nutrition/daily/${date}`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async getNutritionLog(userId: number, logId: number): Promise<NutritionLog> {
    const response = await api.get(`/nutrition/${logId}`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async createNutritionLog(userId: number, log: NutritionLogCreate): Promise<NutritionLog> {
    const response = await api.post('/nutrition/', log, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async updateNutritionLog(userId: number, logId: number, log: Partial<NutritionLogCreate>): Promise<NutritionLog> {
    const response = await api.put(`/nutrition/${logId}`, log, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async deleteNutritionLog(userId: number, logId: number): Promise<void> {
    await api.delete(`/nutrition/${logId}`, {
      params: { user_id: userId }
    });
  },

  async getDailyNutritionSummary(userId: number, date: string): Promise<{
    date: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    entry_count: number;
  }> {
    const response = await api.get(`/nutrition/summary/daily/${date}`, {
      params: { user_id: userId }
    });
    return response.data;
  },
};
