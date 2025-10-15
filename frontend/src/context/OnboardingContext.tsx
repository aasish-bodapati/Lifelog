import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingContextType, OnboardingData, OnboardingStep } from '../types/onboarding';
import { calculationService } from '../services/calculationService';

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  data: Partial<OnboardingData>;
  steps: OnboardingStep[];
  isComplete: boolean;
  isLoading: boolean;
}

type OnboardingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'UPDATE_DATA'; payload: Partial<OnboardingData> }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'RESET_ONBOARDING' }
  | { type: 'SET_STEPS'; payload: OnboardingStep[] };

const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: 5,
  data: {},
  steps: [],
  isComplete: false,
  isLoading: false,
};

const onboardingReducer = (state: OnboardingState, action: OnboardingAction): OnboardingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'NEXT_STEP':
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1),
      };
    
    case 'PREVIOUS_STEP':
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      };
    
    case 'GO_TO_STEP':
      return {
        ...state,
        currentStep: Math.max(0, Math.min(action.payload, state.totalSteps - 1)),
      };
    
    case 'UPDATE_DATA':
      return {
        ...state,
        data: { ...state.data, ...action.payload },
      };
    
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        isComplete: true,
        isLoading: false,
      };
    
    case 'RESET_ONBOARDING':
      return {
        ...initialState,
        steps: state.steps,
      };
    
    case 'SET_STEPS':
      return {
        ...state,
        steps: action.payload,
      };
    
    default:
      return state;
  }
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  // Initialize steps
  useEffect(() => {
    const steps: OnboardingStep[] = [
      {
        id: 'profile',
        title: 'Your Profile',
        description: 'Tell us about yourself',
        isComplete: false,
        isOptional: false,
      },
      {
        id: 'goal',
        title: 'Your Goal',
        description: 'What do you want to achieve?',
        isComplete: false,
        isOptional: false,
      },
      {
        id: 'activity',
        title: 'Activity Level',
        description: 'How active are you?',
        isComplete: false,
        isOptional: false,
      },
      {
        id: 'preferences',
        title: 'Preferences',
        description: 'Customize your experience',
        isComplete: false,
        isOptional: true,
      },
      {
        id: 'summary',
        title: 'Summary',
        description: 'Review your goals',
        isComplete: false,
        isOptional: false,
      },
    ];
    dispatch({ type: 'SET_STEPS', payload: steps });
  }, []);

  // Check if onboarding is complete on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const isComplete = await AsyncStorage.getItem('onboardingComplete');
        if (isComplete === 'true') {
          dispatch({ type: 'COMPLETE_ONBOARDING' });
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    checkOnboardingStatus();
  }, []);

  const nextStep = () => {
    console.log('OnboardingContext: nextStep called, current step:', state.currentStep);
    dispatch({ type: 'NEXT_STEP' });
    console.log('OnboardingContext: nextStep dispatched');
  };

  const previousStep = () => {
    dispatch({ type: 'PREVIOUS_STEP' });
  };

  const goToStep = (step: number) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  };

  const updateData = (data: Partial<OnboardingData>) => {
    dispatch({ type: 'UPDATE_DATA', payload: data });
  };

  const completeOnboarding = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Calculate targets if we have all required data
      if (state.data.profile && state.data.goal && state.data.activity) {
        const targets = calculationService.calculateDailyTargets(
          state.data.profile,
          state.data.goal,
          state.data.activity
        );
        
        // Update data with calculated targets
        dispatch({ 
          type: 'UPDATE_DATA', 
          payload: { 
            ...state.data, 
            targets 
          } 
        });
      }
      
      // Store onboarding completion status
      await AsyncStorage.setItem('onboardingComplete', 'true');
      
      // Store user data
      await AsyncStorage.setItem('onboardingData', JSON.stringify(state.data));
      
      dispatch({ type: 'COMPLETE_ONBOARDING' });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboardingComplete');
      await AsyncStorage.removeItem('onboardingData');
      dispatch({ type: 'RESET_ONBOARDING' });
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const isComplete = await AsyncStorage.getItem('onboardingComplete');
      if (isComplete === 'true') {
        dispatch({ type: 'COMPLETE_ONBOARDING' });
      } else {
        // Reset onboarding state if not complete
        dispatch({ type: 'RESET_ONBOARDING' });
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const restartOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboardingComplete');
      await AsyncStorage.removeItem('onboardingData');
      dispatch({ type: 'RESET_ONBOARDING' });
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  };

  const value: OnboardingContextType = {
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    data: state.data,
    steps: state.steps,
    isComplete: state.isComplete,
    isLoading: state.isLoading,
    nextStep,
    previousStep,
    goToStep,
    updateData,
    completeOnboarding,
    resetOnboarding,
    checkOnboardingStatus,
    restartOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

