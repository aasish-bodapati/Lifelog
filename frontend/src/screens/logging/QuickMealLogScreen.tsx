import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, LocalNutritionLog } from '../../services/databaseService';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { toastService } from '../../services/toastService';
import FoodSearchDropdown from '../../components/FoodSearchDropdown';
import { Food } from '../../services/foodLibraryService';

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
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
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
    setMealType(food.meal_type);
  };

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    setFoodName(food.name);
  };

  const handleSave = async () => {
    if (!userState.user?.id) {
      toastService.error('Error', 'User not logged in');
      return;
    }

    if (!foodName.trim()) {
      toastService.error('Error', 'Food name is required');
      return;
    }

    setIsLoading(true);

    try {
      const nutritionData = {
        user_id: userState.user.id,
        meal_type: mealType,
        food_name: foodName.trim(),
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
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
    <View style={styles.overlay}>
      <View style={styles.popupContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Quick Log Meal</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
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
                  size={16}
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
            <Text style={styles.inputLabel}>Search and select a food</Text>
            <FoodSearchDropdown
              value=""
              onSelect={handleFoodSelect}
              placeholder="Search for a food..."
              style={styles.foodDropdown}
            />
          </View>

          {/* Show selected food or allow custom input */}
          {selectedFood ? (
            <View style={styles.selectedFoodCard}>
              <View style={styles.selectedFoodHeader}>
                <View>
                  <Text style={styles.selectedFoodName}>{selectedFood.name}</Text>
                  <Text style={styles.selectedFoodServing}>{selectedFood.commonServing}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedFood(null);
                    setFoodName('');
                  }}
                  style={styles.removeFoodButton}
                >
                  <Ionicons name="close-circle" size={20} color="#DC3545" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Or enter custom food name *</Text>
              <TextInput
                style={styles.textInput}
                value={foodName}
                onChangeText={setFoodName}
                placeholder="e.g., Grilled Chicken Breast"
              />
            </View>
          )}
        </View>
      </ScrollView>

        {/* Footer with buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Logging...' : 'Log Meal'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  mealTypeTextSelected: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  foodDropdown: {
    marginBottom: 0,
  },
  selectedFoodCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedFoodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedFoodServing: {
    fontSize: 13,
    color: '#666',
  },
  removeFoodButton: {
    padding: 4,
  },
});

export default QuickMealLogScreen;

