import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, LocalNutritionLog } from '../../services/databaseService';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { toastService } from '../../services/toastService';

interface QuickMealLogScreenProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const QuickMealLogScreen: React.FC<QuickMealLogScreenProps> = ({
  onClose,
  onSuccess,
}) => {
  const { state: userState } = useUser();
  const { forceSync } = useSync();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  // Recent foods for autofill
  const [recentFoods, setRecentFoods] = useState<LocalNutritionLog[]>([]);

  useEffect(() => {
    loadRecentFoods();
  }, []);

  const loadRecentFoods = async () => {
    if (!userState.user?.id) return;

    try {
      const foods = await databaseService.getNutritionLogs(userState.user.id, undefined, 10);
      setRecentFoods(foods);
    } catch (error) {
      console.error('Error loading recent foods:', error);
    }
  };

  const handleQuickFill = (food: LocalNutritionLog) => {
    setFoodName(food.food_name);
    setCalories(food.calories.toString());
    setProtein(food.protein_g.toString());
    setCarbs(food.carbs_g.toString());
    setFat(food.fat_g.toString());
    setMealType(food.meal_type);
  };

  const handleSave = async () => {
    if (!userState.user?.id) {
      toastService.error('Error', 'User not logged in');
      return;
    }

    if (!foodName.trim() || !calories.trim()) {
      toastService.error('Error', 'Food name and calories are required');
      return;
    }

    setIsLoading(true);

    try {
      const nutritionData = {
        user_id: userState.user.id,
        meal_type: mealType,
        food_name: foodName.trim(),
        calories: parseInt(calories) || 0,
        protein_g: parseFloat(protein) || 0,
        carbs_g: parseFloat(carbs) || 0,
        fat_g: parseFloat(fat) || 0,
        date: new Date().toISOString().split('T')[0],
      };

      await databaseService.saveNutritionLog(nutritionData);
      
      // Trigger sync
      await forceSync();
      
      // Schedule follow-up reminder if user hasn't logged other meals today
      const today = new Date().toISOString().split('T')[0];
      const todayMeals = await databaseService.getNutritionLogs(userState.user.id, today, 100);
      const otherMeals = todayMeals.filter(meal => meal.meal_type !== selectedMealType);
      
      
      toastService.success('Success', 'Meal logged successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving meal:', error);
      toastService.error('Error', 'Failed to log meal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', icon: 'sunny' },
    { key: 'lunch', label: 'Lunch', icon: 'partly-sunny' },
    { key: 'dinner', label: 'Dinner', icon: 'moon' },
    { key: 'snack', label: 'Snack', icon: 'cafe' },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Quick Log Meal</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Recent Foods */}
        {recentFoods.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Foods</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentFoods.map((food, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentFoodCard}
                  onPress={() => handleQuickFill(food)}
                >
                  <Text style={styles.recentFoodName}>{food.food_name}</Text>
                  <Text style={styles.recentFoodCalories}>{food.calories} cal</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Meal Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Type</Text>
          <View style={styles.mealTypeContainer}>
            {mealTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.mealTypeButton,
                  mealType === type.key && styles.mealTypeButtonSelected,
                ]}
                onPress={() => setMealType(type.key)}
              >
                <Ionicons
                  name={type.icon as any}
                  size={20}
                  color={mealType === type.key ? '#FFFFFF' : '#666'}
                />
                <Text
                  style={[
                    styles.mealTypeText,
                    mealType === type.key && styles.mealTypeTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Food Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Food Name *</Text>
            <TextInput
              style={styles.textInput}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="e.g., Grilled Chicken Breast"
              autoFocus
            />
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Calories *</Text>
              <TextInput
                style={styles.textInput}
                value={calories}
                onChangeText={setCalories}
                placeholder="250"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Protein (g)</Text>
              <TextInput
                style={styles.textInput}
                value={protein}
                onChangeText={setProtein}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Carbs (g)</Text>
              <TextInput
                style={styles.textInput}
                value={carbs}
                onChangeText={setCarbs}
                placeholder="15"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.macroInput}>
              <Text style={styles.inputLabel}>Fat (g)</Text>
              <TextInput
                style={styles.textInput}
                value={fat}
                onChangeText={setFat}
                placeholder="8"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recentFoodCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentFoodName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  recentFoodCalories: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  mealTypeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  mealTypeText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  mealTypeTextSelected: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
});

export default QuickMealLogScreen;

