import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { MainTabParamList, MainStackParamList } from '../types';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import FitnessScreen from '../screens/main/FitnessScreen';
import NutritionScreen from '../screens/main/NutritionScreen';
import ProgressScreen from '../screens/main/ProgressScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import WorkoutLogScreen from '../screens/log/WorkoutLogScreen';
import NutritionLogScreen from '../screens/log/NutritionLogScreen';
import BodyStatsLogScreen from '../screens/log/BodyStatsLogScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Fitness':
              iconName = 'fitness-center';
              break;
            case 'Nutrition':
              iconName = 'restaurant';
              break;
            case 'Progress':
              iconName = 'trending-up';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Fitness" component={FitnessScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen 
        name="WorkoutLog" 
        component={WorkoutLogScreen}
        options={{ headerShown: true, title: 'Log Workout' }}
      />
      <Stack.Screen 
        name="NutritionLog" 
        component={NutritionLogScreen}
        options={{ headerShown: true, title: 'Log Food' }}
      />
      <Stack.Screen 
        name="BodyStatsLog" 
        component={BodyStatsLogScreen}
        options={{ headerShown: true, title: 'Log Body Stats' }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
