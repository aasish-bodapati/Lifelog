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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, LocalNutritionLog } from '../../services/databaseService';
import { useUser } from '../../context/UserContext';
import { useSync } from '../../context/SyncContext';
import { toastService } from '../../services/toastService';
import FoodSearchDropdown from '../../components/FoodSearchDropdown';
import { Food } from '../../services/foodLibraryService';
import { Colors, Layout, Spacing } from '../../styles/designSystem';

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
  const [weightInGrams, setWeightInGrams] = useState('100');
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
      // Calculate macros based on weight
      const weight = parseFloat(weightInGrams || '100');
      const baseCalories = selectedFood?.estimatedCalories || 0;
      const calories = Math.round(baseCalories * weight / 100);
      const protein = Math.round(baseCalories * 0.2 * weight / 100 / 4);
      const carbs = Math.round(baseCalories * 0.5 * weight / 100 / 4);
      const fat = Math.round(baseCalories * 0.3 * weight / 100 / 9);

      const nutritionData = {
        local_id: `nutrition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userState.user.id,
        meal_type: mealType,
        food_name: foodName.trim(),
        calories: calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        date: new Date().toISOString().split('T')[0],
      };

      await databaseService.saveNutritionLog(nutritionData);
      
      // Trigger sync
      await forceSync();
      
      // Schedule follow-up reminder if user hasn't logged other meals today
      const today = new Date().toISOString().split('T')[0];
      const todayMeals = await databaseService.getNutritionLogs(userState.user.id, today, 100);
      const otherMeals = todayMeals.filter(meal => meal.meal_type !== mealType);
      
      
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'protein': return '#E74C3C';
      case 'carbs': return '#F39C12';
      case 'vegetables': return '#27AE60';
      case 'fruits': return '#E91E63';
      case 'dairy': return '#3498DB';
      case 'snacks': return '#9B59B6';
      case 'beverages': return '#16A085';
      default: return '#95A5A6';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protein': return 'barbell';
      case 'carbs': return 'leaf';
      case 'vegetables': return 'nutrition';
      case 'fruits': return 'leaf-outline';
      case 'dairy': return 'water';
      case 'snacks': return 'fast-food';
      case 'beverages': return 'beer';
      default: return 'restaurant';
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingView}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Quick Log Meal</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
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
            <Text style={styles.inputLabel}>Search and select a food *</Text>
            <FoodSearchDropdown
              value=""
              onSelect={handleFoodSelect}
              placeholder="Search for a food..."
              style={styles.foodDropdown}
            />
          </View>

          {/* Show selected food */}
          {selectedFood && (
            <View style={styles.selectedFoodCard}>
              <View style={styles.foodCardHeader}>
                <View style={[styles.foodIconContainer, { backgroundColor: getCategoryColor(selectedFood.category) + '20' }]}>
                  <Ionicons
                    name={getCategoryIcon(selectedFood.category) as any}
                    size={20}
                    color={getCategoryColor(selectedFood.category)}
                  />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{selectedFood.name}</Text>
                  <View style={styles.foodMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(selectedFood.category) + '20' }]}>
                      <Text style={[styles.categoryText, { color: getCategoryColor(selectedFood.category) }]}>
                        {selectedFood.category}
                      </Text>
                    </View>
                    <Text style={styles.servingText}>{selectedFood.commonServing}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedFood(null);
                    setFoodName('');
                    setWeightInGrams('100');
                  }}
                  style={styles.removeFoodButton}
                >
                  <Ionicons name="close-circle" size={20} color="#DC3545" />
                </TouchableOpacity>
              </View>
              
              {/* Weight Input */}
              <View style={styles.servingInputRow}>
                <Text style={styles.servingLabel}>Weight:</Text>
                <TextInput
                  style={styles.servingInput}
                  value={weightInGrams}
                  onChangeText={setWeightInGrams}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.servingUnit}>grams</Text>
              </View>

              {/* Macros Display */}
              <View style={styles.macrosContainer}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Calories</Text>
                  <Text style={styles.macroValue}>
                    {Math.round((selectedFood.estimatedCalories || 0) * parseFloat(weightInGrams || '100') / 100)}
                  </Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>~{Math.round((selectedFood.estimatedCalories || 0) * 0.2 * parseFloat(weightInGrams || '100') / 100 / 4)}g</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>~{Math.round((selectedFood.estimatedCalories || 0) * 0.5 * parseFloat(weightInGrams || '100') / 100 / 4)}g</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroValue}>~{Math.round((selectedFood.estimatedCalories || 0) * 0.3 * parseFloat(weightInGrams || '100') / 100 / 9)}g</Text>
                </View>
              </View>
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
    </KeyboardAvoidingView>
  );
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  popupContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.6,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLarge,
    ...Layout.shadowLarge,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  scrollContent: {
    paddingBottom: 300, // Extra padding to allow scrolling when dropdown is open
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Layout.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  saveButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  recentFoodCard: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: Layout.radiusSmall,
    marginRight: Spacing.sm,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentFoodName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  recentFoodCalories: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  mealTypeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderRadius: Layout.radiusSmall,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minWidth: 0,
  },
  mealTypeButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  mealTypeText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    flexShrink: 1,
    lineHeight: 13,
    includeFontPadding: false,
    textAlign: 'center',
  },
  mealTypeTextSelected: {
    color: Colors.textLight,
  },
  inputGroup: {
    marginBottom: 20,
    zIndex: 1000, // Ensure dropdown appears above other content
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSmall,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
  },
  foodDropdown: {
    marginBottom: 0,
  },
  selectedFoodCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Layout.shadowSmall,
  },
  foodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  foodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Layout.radiusSmall,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
  },
  servingText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  caloriesText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  removeFoodButton: {
    padding: 4,
  },
  servingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  servingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  servingInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
    backgroundColor: Colors.background,
  },
  servingUnit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  macrosContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  macroDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
  },
});

export default QuickMealLogScreen;


