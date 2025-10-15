import api from './api';
import { User, UserCreate } from '../types';

export const userService = {
  async register(userData: UserCreate): Promise<User> {
    console.log('Making registration API call to /users/register');
    const response = await api.post('/users/register', userData);
    console.log('Registration API response:', response.data);
    return response.data;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    console.log('Making login API call to /users/login');
    const response = await api.post('/users/login', { email, password });
    console.log('Login API response:', response.data);
    return response.data;
  },

  async getUser(userId: number): Promise<User> {
    const response = await api.get(`/users/me?user_id=${userId}`);
    return response.data;
  },

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const response = await api.put(`/users/me?user_id=${userId}`, userData);
    return response.data;
  },

  async deleteUser(userId: number): Promise<void> {
    await api.delete(`/users/me?user_id=${userId}`);
  },
};
