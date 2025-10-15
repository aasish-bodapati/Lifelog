import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MacrosCardProps {
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  isLoading?: boolean;
}

const MacrosCard: React.FC<MacrosCardProps> = ({
  protein,
  carbs,
  fat,
  proteinTarget,
  carbsTarget,
  fatTarget,
  isLoading = false,
}) => {
  const proteinAnim = useRef(new Animated.Value(0)).current;
  const carbsAnim = useRef(new Animated.Value(0)).current;
  const fatAnim = useRef(new Animated.Value(0)).current;

  const proteinProgress = proteinTarget > 0 ? Math.min(protein / proteinTarget, 1) : 0;
  const carbsProgress = carbsTarget > 0 ? Math.min(carbs / carbsTarget, 1) : 0;
  const fatProgress = fatTarget > 0 ? Math.min(fat / fatTarget, 1) : 0;

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(proteinAnim, {
          toValue: proteinProgress,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(carbsAnim, {
          toValue: carbsProgress,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(fatAnim, {
          toValue: fatProgress,
          duration: 1400,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [proteinProgress, carbsProgress, fatProgress, isLoading, proteinAnim, carbsAnim, fatAnim]);

  const getMacroColor = (progress: number) => {
    if (progress < 0.5) return '#FF6B6B';
    if (progress < 0.8) return '#FFE66D';
    if (progress < 1) return '#4ECDC4';
    return '#45B7D1';
  };

  const getMacroStatus = (current: number, target: number, progress: number) => {
    if (progress < 0.5) return 'Low';
    if (progress < 0.8) return 'Good';
    if (progress < 1) return 'Great';
    return 'Complete';
  };

  const MacroBar = ({ 
    label, 
    current, 
    target, 
    progress, 
    color, 
    icon, 
    animValue 
  }: {
    label: string;
    current: number;
    target: number;
    progress: number;
    color: string;
    icon: string;
    animValue: Animated.Value;
  }) => (
    <View style={styles.macroItem}>
      <View style={styles.macroHeader}>
        <View style={styles.macroTitleContainer}>
          <Ionicons name={icon as any} size={16} color={color} />
          <Text style={styles.macroLabel}>{label}</Text>
        </View>
        <Text style={styles.macroStatus}>
          {getMacroStatus(current, target, progress)}
        </Text>
      </View>
      
      <View style={styles.macroBarContainer}>
        <View style={styles.macroBar}>
          <Animated.View
            style={[
              styles.macroBarFill,
              {
                backgroundColor: color,
                transform: [
                  {
                    scaleX: animValue,
                  },
                ],
              },
            ]}
          />
        </View>
        <Text style={styles.macroNumbers}>
          {Math.round(current)}g / {Math.round(target)}g
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="nutrition" size={24} color="#4ECDC4" />
          <Text style={styles.title}>Macros</Text>
        </View>
        <Text style={styles.subtitle}>Today's breakdown</Text>
      </View>

      <View style={styles.content}>
        <MacroBar
          label="Protein"
          current={protein}
          target={proteinTarget}
          progress={proteinProgress}
          color={getMacroColor(proteinProgress)}
          icon="fitness"
          animValue={proteinAnim}
        />
        
        <MacroBar
          label="Carbs"
          current={carbs}
          target={carbsTarget}
          progress={carbsProgress}
          color={getMacroColor(carbsProgress)}
          icon="leaf"
          animValue={carbsAnim}
        />
        
        <MacroBar
          label="Fat"
          current={fat}
          target={fatTarget}
          progress={fatProgress}
          color={getMacroColor(fatProgress)}
          icon="water"
          animValue={fatAnim}
        />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {proteinProgress > 0.8 && carbsProgress > 0.8 && fatProgress > 0.8
            ? 'Excellent macro balance! 🎉'
            : proteinProgress > 0.5 && carbsProgress > 0.5 && fatProgress > 0.5
            ? 'Good macro distribution! 👍'
            : 'Keep working on your macros! 💪'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 32,
  },
  content: {
    gap: 16,
  },
  macroItem: {
    marginBottom: 4,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  macroStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  macroBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  macroBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
    transformOrigin: 'left center',
  },
  macroNumbers: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    minWidth: 80,
    textAlign: 'right',
  },
  summary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
});

export default MacrosCard;
