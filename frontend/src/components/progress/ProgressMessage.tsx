import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProgressMessageProps {
  message: string;
}

const ProgressMessage: React.FC<ProgressMessageProps> = ({ message }) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [slideAnim, fadeAnim, pulseAnim]);

  const getMessageType = () => {
    if (message.includes('🎉') || message.includes('crushing')) {
      return { type: 'success', color: '#4ECDC4', icon: 'trophy' };
    }
    if (message.includes('💪') || message.includes('Great')) {
      return { type: 'motivation', color: '#45B7D1', icon: 'fitness' };
    }
    if (message.includes('🔥') || message.includes('fire')) {
      return { type: 'excitement', color: '#FF6B6B', icon: 'flame' };
    }
    if (message.includes('📈') || message.includes('increase')) {
      return { type: 'suggestion', color: '#FFE66D', icon: 'trending-up' };
    }
    return { type: 'default', color: '#8E44AD', icon: 'star' };
  };

  const messageType = getMessageType();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={[styles.messageCard, { borderLeftColor: messageType.color }]}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={messageType.icon as any}
            size={20}
            color={messageType.color}
          />
        </View>
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
  iconContainer: {
    marginRight: 12,
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 20,
  },
});

export default ProgressMessage;
