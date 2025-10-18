import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { foodLibraryService, Food } from '../services/foodLibraryService';
import { Colors, Typography, Layout, Spacing } from '../styles/designSystem';

interface FoodSearchDropdownProps {
  value: string;
  onSelect: (food: Food) => void;
  placeholder?: string;
  style?: any;
}

const FoodSearchDropdown: React.FC<FoodSearchDropdownProps> = ({
  value,
  onSelect,
  placeholder = 'Search for a food...',
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Food[]>([]);

  useEffect(() => {
    // Debounce search - wait 300ms after user stops typing
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        const results = foodLibraryService.searchFoods(searchQuery, 3);
        console.log('Food search results for "' + searchQuery + '":', results.length, 'foods');
        setSearchResults(results);
        setIsOpen(true); // Always open when there's a search query
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    }, 300); // Reduced from 500ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelect = (food: Food) => {
    onSelect(food);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsOpen(false);
  };

  const getCategoryColor = (category: Food['category']) => {
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

  const getCategoryIcon = (category: Food['category']) => {
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
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Search Input */}
      <View style={styles.inputContainer} pointerEvents="auto">
        <Ionicons name="search" size={18} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.textInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={placeholder}
          placeholderTextColor={Colors.textSecondary}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown Results */}
      {isOpen && (
        <View style={styles.dropdownContainer} pointerEvents="auto">
          {searchResults.length > 0 ? (
            <ScrollView
              style={styles.foodsList}
              contentContainerStyle={styles.foodsListContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={true}
              bounces={true}
              alwaysBounceVertical={false}
              overScrollMode="never"
              removeClippedSubviews={false}
            >
              {searchResults.map((food) => (
              <TouchableOpacity
                key={food.id}
                style={styles.foodItem}
                onPress={() => handleSelect(food)}
              >
                <View style={[styles.foodIconContainer, { backgroundColor: getCategoryColor(food.category) + '20' }]}>
                  <Ionicons
                    name={getCategoryIcon(food.category) as any}
                    size={18}
                    color={getCategoryColor(food.category)}
                  />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <View style={styles.foodMeta}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(food.category) + '20' }]}>
                      <Text style={[styles.categoryText, { color: getCategoryColor(food.category) }]}>
                        {food.category}
                      </Text>
                    </View>
                    <Text style={styles.servingText}>{food.commonServing}</Text>
                    {food.estimatedCalories && (
                      <Text style={styles.caloriesText}>~{food.estimatedCalories} cal</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={20} color={Colors.disabled} />
              <Text style={styles.noResultsText}>No foods found</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusMedium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusMedium,
    zIndex: 1000,
    elevation: 10,
    marginTop: Spacing.xs,
    height: 260,
    overflow: 'hidden',
    ...Layout.shadowMedium,
  },
  foodsList: {
    flex: 1,
  },
  foodsListContent: {
    paddingVertical: Spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  foodIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  foodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs + 2,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: Layout.radiusSmall,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  servingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  caloriesText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  noResultsContainer: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  noResultsText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});

export default FoodSearchDropdown;

