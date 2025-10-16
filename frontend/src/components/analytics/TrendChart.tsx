import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const chartWidth = width - 32;

export interface TrendDataPoint {
  date: string;
  value: number;
}

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  color: string;
  unit: string;
  height?: number;
  showDots?: boolean;
  showGrid?: boolean;
}

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  color,
  unit,
  height = 220,
  showDots = true,
  showGrid = true,
}) => {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </View>
    );
  }

  // Prepare data for chart
  const chartData = {
    labels: data.map(point => {
      const date = new Date(point.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        data: data.map(point => point.value),
        color: (opacity = 1) => color + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => color + Math.floor(opacity * 255).toString(16).padStart(2, '0'),
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: showDots ? '4' : '0',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: showGrid ? '5,5' : '0',
      stroke: '#E0E0E0',
      strokeWidth: 1,
    },
  };

  const maxValue = Math.max(...data.map(point => point.value));
  const minValue = Math.min(...data.map(point => point.value));
  const range = maxValue - minValue;
  const padding = range * 0.1; // 10% padding

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.currentValue}>
            {data[data.length - 1]?.value || 0} {unit}
          </Text>
          {data.length > 1 && (
            <Text style={[
              styles.trend,
              {
                color: data[data.length - 1].value > data[data.length - 2].value ? '#4CAF50' : '#F44336'
              }
            ]}>
              {data[data.length - 1].value > data[data.length - 2].value ? '↗' : '↘'}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={showDots}
          withShadow={false}
          withScrollableDot={false}
          withInnerLines={showGrid}
          withOuterLines={showGrid}
          withVerticalLines={showGrid}
          withHorizontalLines={showGrid}
          fromZero={false}
          segments={4}
        />
      </View>
      
      <View style={styles.footer}>
        <View style={styles.rangeContainer}>
          <Text style={styles.rangeText}>
            Min: {minValue.toFixed(0)} {unit}
          </Text>
          <Text style={styles.rangeText}>
            Max: {maxValue.toFixed(0)} {unit}
          </Text>
        </View>
        <Text style={styles.periodText}>
          Last {data.length} days
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  trend: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  rangeText: {
    fontSize: 12,
    color: '#666666',
  },
  periodText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  emptyState: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
});

export default TrendChart;
