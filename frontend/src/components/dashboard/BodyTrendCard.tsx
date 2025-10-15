import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, LocalBodyStat } from '../../services/databaseService';

interface BodyTrendCardProps {
  userId: number;
  isLoading?: boolean;
}

interface WeightDataPoint {
  date: string;
  weight: number;
  day: string;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80; // Account for padding
const CHART_HEIGHT = 80;

const BodyTrendCard: React.FC<BodyTrendCardProps> = ({
  userId,
  isLoading = false,
}) => {
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [weightChange, setWeightChange] = useState<number | null>(null);
  const chartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (userId > 0) {
      loadWeightData();
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoading && weightData.length > 0) {
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }
  }, [weightData, isLoading, chartAnim]);

  const loadWeightData = async () => {
    try {
      const bodyStats = await databaseService.getBodyStats(userId, 7);
      
      // Filter and sort by date
      const weightEntries = bodyStats
        .filter(stat => stat.weight_kg !== null && stat.weight_kg !== undefined)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (weightEntries.length === 0) {
        setWeightData([]);
        setCurrentWeight(null);
        setWeightChange(null);
        return;
      }

      // Create data points for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const dataPoints: WeightDataPoint[] = last7Days.map(date => {
        const entry = weightEntries.find(stat => stat.date === date);
        return {
          date,
          weight: entry?.weight_kg || 0,
          day: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
        };
      }).filter(point => point.weight > 0);

      setWeightData(dataPoints);

      // Set current weight and change
      if (dataPoints.length > 0) {
        const latest = dataPoints[dataPoints.length - 1];
        const previous = dataPoints.length > 1 ? dataPoints[dataPoints.length - 2] : null;
        
        setCurrentWeight(latest.weight);
        setWeightChange(previous ? latest.weight - previous.weight : null);
      }
    } catch (error) {
      console.error('Error loading weight data:', error);
    }
  };

  const getMinMaxWeight = () => {
    if (weightData.length === 0) return { min: 0, max: 100 };
    
    const weights = weightData.map(d => d.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const padding = (max - min) * 0.1 || 1;
    
    return {
      min: min - padding,
      max: max + padding,
    };
  };

  const getWeightColor = () => {
    if (weightChange === null) return '#666666';
    if (weightChange > 0) return '#FF6B6B';
    if (weightChange < 0) return '#4ECDC4';
    return '#666666';
  };

  const getWeightChangeText = () => {
    if (weightChange === null) return 'No change';
    if (weightChange > 0) return `+${weightChange.toFixed(1)} kg`;
    if (weightChange < 0) return `${weightChange.toFixed(1)} kg`;
    return 'No change';
  };

  const renderChart = () => {
    if (weightData.length < 2) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="trending-up" size={32} color="#CCCCCC" />
          <Text style={styles.noDataText}>No weight data</Text>
        </View>
      );
    }

    const { min, max } = getMinMaxWeight();
    const range = max - min;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {weightData.map((point, index) => {
            if (index === 0) return null;
            
            const prevPoint = weightData[index - 1];
            const x1 = ((index - 1) / (weightData.length - 1)) * CHART_WIDTH;
            const y1 = CHART_HEIGHT - ((prevPoint.weight - min) / range) * CHART_HEIGHT;
            const x2 = (index / (weightData.length - 1)) * CHART_WIDTH;
            const y2 = CHART_HEIGHT - ((point.weight - min) / range) * CHART_HEIGHT;

            return (
              <Animated.View
                key={index}
                style={[
                  styles.chartLine,
                  {
                    left: x1,
                    top: y1,
                    width: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
                    transform: [
                      {
                        rotate: `${Math.atan2(y2 - y1, x2 - x1)}rad`,
                      },
                    ],
                    opacity: chartAnim,
                  },
                ]}
              />
            );
          })}
          
          {weightData.map((point, index) => (
            <Animated.View
              key={index}
              style={[
                styles.chartPoint,
                {
                  left: (index / (weightData.length - 1)) * CHART_WIDTH - 4,
                  top: CHART_HEIGHT - ((point.weight - min) / range) * CHART_HEIGHT - 4,
                  opacity: chartAnim,
                },
              ]}
            />
          ))}
        </View>
        
        <View style={styles.chartLabels}>
          {weightData.map((point, index) => (
            <Text key={index} style={styles.chartLabel}>
              {point.day}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="body" size={24} color="#E67E22" />
          <Text style={styles.title}>Body Trend</Text>
        </View>
        {currentWeight && (
          <View style={styles.weightContainer}>
            <Text style={styles.currentWeight}>{currentWeight.toFixed(1)} kg</Text>
            {weightChange !== null && (
              <Text style={[styles.weightChange, { color: getWeightColor() }]}>
                {getWeightChangeText()}
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        {renderChart()}
        
        {weightData.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {weightChange !== null && weightChange < 0
                ? 'Great progress! 📉'
                : weightChange !== null && weightChange > 0
                ? 'Keep working! 📈'
                : 'Stay consistent! 📊'
              }
            </Text>
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  weightContainer: {
    alignItems: 'flex-end',
  },
  currentWeight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  weightChange: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  content: {
    alignItems: 'center',
  },
  chartContainer: {
    width: '100%',
    marginBottom: 16,
  },
  chart: {
    height: CHART_HEIGHT,
    position: 'relative',
    marginBottom: 8,
  },
  chartLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#4ECDC4',
    borderRadius: 1,
  },
  chartPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  noDataContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 8,
  },
  summary: {
    marginTop: 8,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
});

export default BodyTrendCard;
