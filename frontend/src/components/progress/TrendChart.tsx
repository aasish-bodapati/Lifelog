import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DataPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: DataPoint[];
  color: string;
  unit: string;
}

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 120;

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  color,
  unit,
}) => {
  const chartAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(chartAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [chartAnim, fadeAnim]);

  const getMinMaxValues = () => {
    if (data.length === 0) return { min: 0, max: 100 };
    
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 1;
    
    return {
      min: min - padding,
      max: max + padding,
    };
  };

  const getAverageValue = () => {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.value, 0) / data.length;
  };

  const getTrend = () => {
    if (data.length < 2) return { direction: 'flat', percentage: 0 };
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    const change = last - first;
    const percentage = first > 0 ? (change / first) * 100 : 0;
    
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      percentage: Math.abs(percentage),
    };
  };

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Ionicons name="bar-chart" size={32} color="#CCCCCC" />
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      );
    }

    const { min, max } = getMinMaxValues();
    const range = max - min;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                {
                  top: ratio * CHART_HEIGHT,
                },
              ]}
            />
          ))}

          {/* Data line */}
          {data.map((point, index) => {
            if (index === 0) return null;
            
            const prevPoint = data[index - 1];
            const x1 = ((index - 1) / (data.length - 1)) * CHART_WIDTH;
            const y1 = CHART_HEIGHT - ((prevPoint.value - min) / range) * CHART_HEIGHT;
            const x2 = (index / (data.length - 1)) * CHART_WIDTH;
            const y2 = CHART_HEIGHT - ((point.value - min) / range) * CHART_HEIGHT;

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
          
          {/* Data points */}
          {data.map((point, index) => (
            <Animated.View
              key={index}
              style={[
                styles.chartPoint,
                {
                  left: (index / (data.length - 1)) * CHART_WIDTH - 4,
                  top: CHART_HEIGHT - ((point.value - min) / range) * CHART_HEIGHT - 4,
                  opacity: chartAnim,
                },
              ]}
            />
          ))}
        </View>
        
        {/* X-axis labels */}
        <View style={styles.xAxisLabels}>
          {data.map((point, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {new Date(point.date).toLocaleDateString('en', { weekday: 'short' })}
            </Text>
          ))}
        </View>
      </View>
    );
  };

  const average = getAverageValue();
  const trend = getTrend();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={[styles.colorIndicator, { backgroundColor: color }]} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.averageValue}>
            {Math.round(average).toLocaleString()}{unit}
          </Text>
          <View style={styles.trendContainer}>
            <Ionicons
              name={
                trend.direction === 'up' ? 'trending-up' :
                trend.direction === 'down' ? 'trending-down' : 'remove'
              }
              size={12}
              color={
                trend.direction === 'up' ? '#4ECDC4' :
                trend.direction === 'down' ? '#FF6B6B' : '#666666'
              }
            />
            <Text
              style={[
                styles.trendText,
                {
                  color:
                    trend.direction === 'up' ? '#4ECDC4' :
                    trend.direction === 'down' ? '#FF6B6B' : '#666666'
                }
              ]}
            >
              {trend.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartWrapper}>
        {renderChart()}
      </View>

      {/* Y-axis labels */}
      <View style={styles.yAxisLabels}>
        <Text style={styles.yAxisLabel}>{Math.round(getMinMaxValues().max).toLocaleString()}</Text>
        <Text style={styles.yAxisLabel}>{Math.round(getMinMaxValues().min).toLocaleString()}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  averageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  chartWrapper: {
    position: 'relative',
  },
  chartContainer: {
    position: 'relative',
    height: CHART_HEIGHT,
  },
  chart: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F0F0F0',
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
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  yAxisLabels: {
    position: 'absolute',
    left: -30,
    top: 0,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666666',
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
});

export default TrendChart;
