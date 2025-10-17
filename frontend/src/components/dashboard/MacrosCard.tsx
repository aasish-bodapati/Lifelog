import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MacrosCardProps {
  calories: number;
  caloriesTarget: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  isLoading?: boolean;
}

const MacrosCard: React.FC<MacrosCardProps> = ({
  calories,
  caloriesTarget,
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

  const caloriesProgress = caloriesTarget > 0 ? Math.min(calories / caloriesTarget, 1) : 0;
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
    if (progress < 0.5) return '#FF6B6B';      // Red: Low (<50%)
    if (progress < 0.8) return '#FFE66D';      // Yellow: Good (50-80%)
    if (progress < 1) return '#4ECDC4';        // Teal: Great (80-100%)
    if (progress < 1.2) return '#45B7D1';      // Blue: Complete (100-120%)
    return '#FF9800';                          // Orange: Over (>120%)
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
          <Text style={[styles.macroLabel, { color }]}>{label}</Text>
        </View>
        <Text style={[styles.macroNumbers, { color }]}>
          {Math.round(current)}g / {Math.round(target)}g
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
      </View>
    </View>
  );

  const getCalorieColor = (progress: number) => {
    if (progress < 0.5) return '#FF6B6B';      // Red: Low (<50%)
    if (progress < 0.8) return '#FFE66D';      // Yellow: Good (50-80%)
    if (progress < 1) return '#4ECDC4';        // Teal: Great (80-100%)
    if (progress < 1.2) return '#45B7D1';      // Blue: Complete (100-120%)
    return '#FF9800';                          // Orange: Over (>120%)
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="nutrition" size={24} color="#4ECDC4" />
          <Text style={styles.title}>Nutrition</Text>
        </View>
        <Text style={styles.subtitle}>Today's breakdown</Text>
      </View>

      {/* Calories Section */}
      <View style={styles.caloriesSection}>
        <View style={styles.caloriesHeader}>
          <View style={styles.caloriesTitleContainer}>
            <Ionicons name="flame" size={20} color={getCalorieColor(caloriesProgress)} />
            <Text style={styles.caloriesLabel}>Calories</Text>
          </View>
          <Text style={[styles.caloriesValue, { color: getCalorieColor(caloriesProgress) }]}>
            {Math.round(calories)} / {Math.round(caloriesTarget)}
          </Text>
        </View>
        <View style={styles.caloriesBarContainer}>
          <View style={styles.caloriesBar}>
            <View
              style={[
                styles.caloriesBarFill,
                {
                  backgroundColor: getCalorieColor(caloriesProgress),
                  width: `${Math.min(caloriesProgress * 100, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.caloriesPercentage}>
            {Math.round(caloriesProgress * 100)}%
          </Text>
        </View>
      </View>

      {/* Macros Section */}
      <View style={styles.macrosDivider} />
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
    padding: 16,
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
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 32,
  },
  content: {
    gap: 12,
  },
  macroItem: {
    marginBottom: 0,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  macroBarContainer: {
    marginTop: 6,
  },
  macroBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 3,
    transformOrigin: 'left center',
  },
  macroNumbers: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  caloriesSection: {
    marginBottom: 12,
  },
  caloriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caloriesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caloriesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  caloriesValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  caloriesBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  caloriesBar: {
    flex: 1,
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  caloriesBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  caloriesPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666666',
    minWidth: 45,
    textAlign: 'right',
  },
  macrosDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  summary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
});

export default MacrosCard;

