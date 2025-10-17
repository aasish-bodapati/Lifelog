import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserCreate } from '../types';
import { userService } from '../services/userService';

interface UserState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'LOGOUT' };

const initialState: UserState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

const userReducer = (state: UserState, action: UserAction): UserState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

interface UserContextType {
  state: UserState;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userId = await AsyncStorage.getItem('user_id');
      
      if (token && userId) {
        // TODO: Verify token with backend
        const user = await userService.getUser(parseInt(userId));
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await userService.login(email, password);
      
      await AsyncStorage.setItem('auth_token', response.token);
      await AsyncStorage.setItem('user_id', response.user.id.toString());
      
      dispatch({ type: 'SET_USER', payload: response.user });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData: UserCreate) => {
    try {
      console.log('Starting registration with data:', userData);
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Clear any existing onboarding data for new users
      await AsyncStorage.removeItem('onboardingComplete');
      await AsyncStorage.removeItem('onboardingData');
      console.log('Cleared previous onboarding data for new user');
      
      const user = await userService.register(userData);
      console.log('Registration successful:', user);
      
      // Auto-login after registration
      console.log('Attempting auto-login...');
      try {
        await login(userData.email, userData.password);
        console.log('Auto-login successful');
      } catch (loginError) {
        console.error('Auto-login failed, but registration was successful:', loginError);
        // Don't throw error here - registration was successful
        // User can manually login later
        dispatch({ type: 'SET_LOADING', payload: false });
        return; // Exit early, don't throw
      }
    } catch (error) {
      console.error('Registration failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_id');
      // Note: We don't remove onboarding data here so users don't have to redo onboarding
      // If you want users to redo onboarding on each login, uncomment the next lines:
      // await AsyncStorage.removeItem('onboardingComplete');
      // await AsyncStorage.removeItem('onboardingData');
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!state.user) throw new Error('No user logged in');
      
      const updatedUser = await userService.updateUser(state.user.id, userData);
      dispatch({ type: 'SET_USER', payload: updatedUser });
    } catch (error) {
      throw error;
    }
  };

  const value: UserContextType = {
    state,
    login,
    register,
    logout,
    updateUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
