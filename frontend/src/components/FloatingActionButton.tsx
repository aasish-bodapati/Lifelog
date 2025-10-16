import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingActionButtonProps {
  onMealPress: () => void;
  onWorkoutPress: () => void;
  onBodyStatPress: () => void;
  onRepeatYesterdayPress: () => void;
}

const { width, height } = Dimensions.get('window');

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onMealPress,
  onWorkoutPress,
  onBodyStatPress,
  onRepeatYesterdayPress,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isOpen ? 1 : 0.95,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAction = (action: () => void) => {
    closeMenu();
    action();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <Modal
          transparent
          visible={isOpen}
          animationType="fade"
          onRequestClose={closeMenu}
        >
          <Pressable style={styles.overlay} onPress={closeMenu} />
        </Modal>
      )}

      {/* Action Menu */}
      <View style={styles.container}>
        {isOpen && (
          <View style={styles.actionMenu}>
            {/* Repeat Yesterday */}
            <TouchableOpacity
              style={[styles.actionButton, styles.repeatButton]}
              onPress={() => handleAction(onRepeatYesterdayPress)}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Repeat Yesterday</Text>
            </TouchableOpacity>

            {/* Body Stat */}
            <TouchableOpacity
              style={[styles.actionButton, styles.bodyStatButton]}
              onPress={() => handleAction(onBodyStatPress)}
            >
              <Ionicons name="body" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Body Stat</Text>
            </TouchableOpacity>

            {/* Workout */}
            <TouchableOpacity
              style={[styles.actionButton, styles.workoutButton]}
              onPress={() => handleAction(onWorkoutPress)}
            >
              <Ionicons name="fitness" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Workout</Text>
            </TouchableOpacity>

            {/* Meal */}
            <TouchableOpacity
              style={[styles.actionButton, styles.mealButton]}
              onPress={() => handleAction(onMealPress)}
            >
              <Ionicons name="restaurant" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Meal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main FAB */}
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: rotateInterpolate },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.fabButton}
            onPress={toggleMenu}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isOpen ? 'close' : 'add'}
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  actionMenu: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 12,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  repeatButton: {
    backgroundColor: '#8E44AD',
  },
  bodyStatButton: {
    backgroundColor: '#E67E22',
  },
  workoutButton: {
    backgroundColor: '#E74C3C',
  },
  mealButton: {
    backgroundColor: '#27AE60',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FloatingActionButton;

