import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { personalizationService, PersonalizedMessage } from '../../services/personalizationService';
import { useUser } from '../../context/UserContext';

interface PersonalizedHeaderProps {
  onRefresh?: () => void;
}

const PersonalizedHeader: React.FC<PersonalizedHeaderProps> = ({ onRefresh }) => {
  const { state: userState } = useUser();
  const [personalizedMessage, setPersonalizedMessage] = useState<PersonalizedMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadPersonalizedContent();
  }, [userState.user?.id]);

  useEffect(() => {
    if (personalizedMessage) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for high motivation
      if (personalizedMessage.color === '#4ECDC4') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.05,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [personalizedMessage, fadeAnim, slideAnim, pulseAnim]);

  const loadPersonalizedContent = async () => {
    if (!userState.user?.id) return;

    try {
      setIsLoading(true);

      // Generate personalized message
      const message = await personalizationService.generatePersonalizedGreeting(
        userState.user.id,
        userState.user.username
      );
      setPersonalizedMessage(message);
    } catch (error) {
      console.error('Error loading personalized content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPersonalizedContent();
    onRefresh?.();
  };

  if (isLoading || !personalizedMessage) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your personalized dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Main Header */}
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{personalizedMessage.greeting}</Text>
          <Text style={[styles.motivationalMessage, { color: personalizedMessage.color }]}>
            {personalizedMessage.motivationalMessage}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Tip Card */}
      <View style={[styles.tipCard, { borderLeftColor: personalizedMessage.color }]}>
        <Ionicons name="bulb" size={16} color={personalizedMessage.color} />
        <Text style={styles.tipText}>{personalizedMessage.tip}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greetingContainer: {
    flex: 1,
    marginRight: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  motivationalMessage: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

export default PersonalizedHeader;
