import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors, Typography, Layout } from '../../styles/designSystem';
import { weatherService, WeatherData } from '../../services/weatherService';

interface WelcomeCardProps {
  userName: string;
  streak?: number;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName, streak = 0 }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  // Get current date info
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Load weather data
  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async () => {
    try {
      setIsLoadingWeather(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const weatherData = await weatherService.getWeatherByCoords(
          location.coords.latitude,
          location.coords.longitude
        );
        setWeather(weatherData);
      } else {
        // Fallback to default city
        const weatherData = await weatherService.getWeatherByCity('London');
        setWeather(weatherData);
      }
    } catch (error) {
      console.error('Error loading weather:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Row: Greeting and Weather */}
      <View style={styles.topRow}>
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        {/* Weather Section */}
        {isLoadingWeather ? (
          <View style={styles.weatherSection}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : weather ? (
          <View style={styles.weatherSection}>
            <Text style={styles.weatherEmoji}>
              {weatherService.getWeatherEmoji(weather.description)}
            </Text>
            <View style={styles.weatherInfo}>
              <Text style={styles.temperature}>{weather.temperature}°C</Text>
              <Text style={styles.weatherDesc}>
                {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Bottom Row: Date and Streak */}
      <View style={styles.bottomRow}>
        <View style={styles.dateInfo}>
          <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.dateText}>
            {dayOfWeek}, {date}
          </Text>
        </View>

        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FF6B35" />
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
  },
  weatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherEmoji: {
    fontSize: 32,
  },
  weatherInfo: {
    alignItems: 'flex-end',
  },
  temperature: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  weatherDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
});

export default WelcomeCard;

