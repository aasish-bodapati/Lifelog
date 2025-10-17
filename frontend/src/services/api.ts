import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure base URL - adjust for your development setup
// For mobile development, use your computer's IP address instead of localhost
const BASE_URL = 'http://192.168.1.11:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    // Only log in development mode, and only for non-sync operations
    if (__DEV__ && !config.url?.includes('/body') && !config.url?.includes('/sync')) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Only log in development mode, and only for non-sync operations
    if (__DEV__ && !response.config.url?.includes('/body') && !response.config.url?.includes('/sync')) {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    // Always log errors
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url
    });
    
    if (error.response?.status === 401) {
      // Token expired or invalid, clear storage and redirect to login
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_id');
      // TODO: Navigate to login screen
    }
    return Promise.reject(error);
  }
);

// API Service class with all endpoints
class ApiService {
  // User endpoints
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  }

  async register(username: string, email: string, password: string) {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  }

  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  }

  async updateUser(userId: number, userData: any) {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  }

  // Workout endpoints
  async createWorkout(workoutData: any) {
    const { user_id, date, ...bodyData } = workoutData;
    // Convert date string to datetime format expected by backend
    const datetime = date.includes('T') ? date : `${date}T00:00:00.000Z`;
    
    console.log('🔍 DEBUG createWorkout - user_id:', user_id);
    console.log('🔍 DEBUG createWorkout - date:', date, '→', datetime);
    console.log('🔍 DEBUG createWorkout - bodyData:', JSON.stringify(bodyData, null, 2));
    
    // Add trailing slash to match backend route definition and prevent 307 redirect
    const response = await api.post(`/fitness/?user_id=${user_id}`, {
      ...bodyData,
      date: datetime,
      exercises: [], // Backend expects exercises array, send empty for now
    });
    
    console.log('✅ DEBUG createWorkout - Success:', response.status);
    return response.data;
  }

  async getWorkouts(userId: number, limit: number = 50) {
    const response = await api.get(`/fitness?user_id=${userId}&limit=${limit}`);
    return response.data;
  }

  async updateWorkout(workoutId: string, workoutData: any) {
    const response = await api.put(`/fitness/${workoutId}`, workoutData);
    return response.data;
  }

  async deleteWorkout(workoutId: string) {
    const userId = await AsyncStorage.getItem('userId');
    const response = await api.delete(`/fitness/${workoutId}`, {
      params: { user_id: userId }
    });
    return response.data;
  }

  // Nutrition endpoints
  async createNutritionLog(nutritionData: any) {
    // Extract and map fields to match backend schema
    const { user_id, meal_type, food_name, calories, protein_g, carbs_g, fat_g, date, notes } = nutritionData;
    const cleanData = {
      // user_id is passed as query param, NOT in body
      meal_type,
      food_name,
      quantity: 1, // Default quantity
      unit: 'serving', // Required field - default to 'serving'
      calories: Number(calories) || 0,
      protein: Number(protein_g) || 0,  // Map protein_g to protein
      carbs: Number(carbs_g) || 0,      // Map carbs_g to carbs
      fat: Number(fat_g) || 0,          // Map fat_g to fat
      fiber: 0,
      sugar: 0,
      sodium: 0,
      date,
      ...(notes && { notes }), // Only include notes if it exists
    };
    const response = await api.post(`/nutrition/?user_id=${user_id}`, cleanData);
    return response.data;
  }

  async getNutritionLogs(userId: number, date?: string, limit: number = 50) {
    let url = `/nutrition/?user_id=${userId}&limit=${limit}`; // Added trailing slash
    if (date) {
      url += `&date=${date}`;
    }
    const response = await api.get(url);
    return response.data;
  }

  async updateNutritionLog(nutritionId: string, nutritionData: any) {
    // Map field names to match backend schema if they exist
    const cleanData: any = {};
    if (nutritionData.quantity !== undefined) cleanData.quantity = Number(nutritionData.quantity);
    if (nutritionData.notes !== undefined) cleanData.notes = nutritionData.notes;
    
    const response = await api.put(`/nutrition/${nutritionId}`, cleanData);
    return response.data;
  }

  async deleteNutritionLog(nutritionId: string) {
    const response = await api.delete(`/nutrition/${nutritionId}`);
    return response.data;
  }

  // Body stats endpoints
  async createBodyStat(bodyStatData: any) {
    const { user_id, ...data } = bodyStatData;
    const response = await api.post(`/body/?user_id=${user_id}`, data);
    return response.data;
  }

  async getBodyStats(userId: number, limit: number = 50) {
    const response = await api.get(`/body/?user_id=${userId}&limit=${limit}`);
    return response.data;
  }

  async updateBodyStat(bodyStatId: string, bodyStatData: any) {
    const response = await api.put(`/body/${bodyStatId}`, bodyStatData);
    return response.data;
  }

  async deleteBodyStat(bodyStatId: string) {
    const response = await api.delete(`/body/${bodyStatId}`);
    return response.data;
  }

  // Analytics endpoints
  async getDailyAnalytics(userId: number, date: string) {
    const response = await api.get(`/analytics/daily?user_id=${userId}&date=${date}`);
    return response.data;
  }

  async getWeeklyAnalytics(userId: number, startDate: string) {
    const response = await api.get(`/analytics/weekly?user_id=${userId}&start_date=${startDate}`);
    return response.data;
  }

  async getConsistencyStreak(userId: number) {
    const response = await api.get(`/analytics/streak?user_id=${userId}`);
    return response.data;
  }

  async getProgressMetrics(userId: number, days: number = 30) {
    const response = await api.get(`/analytics/progress?user_id=${userId}&days=${days}`);
    return response.data;
  }

  // Sync endpoints
  async syncData(syncData: any) {
    const response = await api.post('/sync', syncData);
    return response.data;
  }

  async getSyncStatus(userId: number) {
    const response = await api.get(`/sync/status?user_id=${userId}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default api;
