import api from './api';
import { BodyStat, BodyStatCreate } from '../types';

export const bodyStatsService = {
  async getBodyStats(userId: number, params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<BodyStat[]> {
    const response = await api.get('/body/', {
      params: { user_id: userId, ...params }
    });
    return response.data;
  },

  async getLatestBodyStat(userId: number): Promise<BodyStat> {
    const response = await api.get('/body/latest', {
      params: { user_id: userId }
    });
    return response.data;
  },

  async getBodyStat(userId: number, statId: number): Promise<BodyStat> {
    const response = await api.get(`/body/${statId}`, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async createBodyStat(userId: number, stat: BodyStatCreate): Promise<BodyStat> {
    const response = await api.post('/body/', stat, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async updateBodyStat(userId: number, statId: number, stat: Partial<BodyStatCreate>): Promise<BodyStat> {
    const response = await api.put(`/body/${statId}`, stat, {
      params: { user_id: userId }
    });
    return response.data;
  },

  async deleteBodyStat(userId: number, statId: number): Promise<void> {
    await api.delete(`/body/${statId}`, {
      params: { user_id: userId }
    });
  },

  async getWeightHistory(userId: number, days: number = 30): Promise<{
    period_days: number;
    start_date: string;
    end_date: string;
    weight_history: Array<{ date: string; weight: number }>;
    data_points: number;
  }> {
    const response = await api.get('/body/weight/history', {
      params: { user_id: userId, days }
    });
    return response.data;
  },
};
