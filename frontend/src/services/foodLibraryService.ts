export interface Food {
  id: string;
  name: string;
  category: 'protein' | 'carbs' | 'vegetables' | 'fruits' | 'dairy' | 'snacks' | 'beverages' | 'other';
  commonServing: string;
  estimatedCalories?: number;
  searchTerms?: string[];
}

class FoodLibraryService {
  private foods: Food[] = [
    // Protein
    { id: 'chicken_breast', name: 'Chicken Breast', category: 'protein', commonServing: '100g', estimatedCalories: 165, searchTerms: ['chicken', 'breast', 'grilled'] },
    { id: 'salmon', name: 'Salmon', category: 'protein', commonServing: '100g', estimatedCalories: 208, searchTerms: ['fish', 'salmon', 'grilled'] },
    { id: 'eggs', name: 'Eggs', category: 'protein', commonServing: '2 large', estimatedCalories: 140, searchTerms: ['egg', 'boiled', 'scrambled'] },
    { id: 'tofu', name: 'Tofu', category: 'protein', commonServing: '100g', estimatedCalories: 76, searchTerms: ['tofu', 'soy', 'vegetarian'] },
    { id: 'beef', name: 'Beef', category: 'protein', commonServing: '100g', estimatedCalories: 250, searchTerms: ['beef', 'steak', 'meat'] },
    { id: 'turkey', name: 'Turkey', category: 'protein', commonServing: '100g', estimatedCalories: 135, searchTerms: ['turkey', 'poultry'] },
    { id: 'tuna', name: 'Tuna', category: 'protein', commonServing: '100g', estimatedCalories: 132, searchTerms: ['tuna', 'fish', 'canned'] },
    { id: 'shrimp', name: 'Shrimp', category: 'protein', commonServing: '100g', estimatedCalories: 99, searchTerms: ['shrimp', 'prawn', 'seafood'] },

    // Carbs
    { id: 'brown_rice', name: 'Brown Rice', category: 'carbs', commonServing: '1 cup', estimatedCalories: 215, searchTerms: ['rice', 'brown', 'grain'] },
    { id: 'white_rice', name: 'White Rice', category: 'carbs', commonServing: '1 cup', estimatedCalories: 205, searchTerms: ['rice', 'white', 'steamed'] },
    { id: 'oatmeal', name: 'Oatmeal', category: 'carbs', commonServing: '1 cup', estimatedCalories: 154, searchTerms: ['oats', 'oatmeal', 'porridge'] },
    { id: 'sweet_potato', name: 'Sweet Potato', category: 'carbs', commonServing: '1 medium', estimatedCalories: 112, searchTerms: ['potato', 'sweet', 'yam'] },
    { id: 'quinoa', name: 'Quinoa', category: 'carbs', commonServing: '1 cup', estimatedCalories: 222, searchTerms: ['quinoa', 'grain'] },
    { id: 'whole_wheat_bread', name: 'Whole Wheat Bread', category: 'carbs', commonServing: '2 slices', estimatedCalories: 160, searchTerms: ['bread', 'wheat', 'toast'] },
    { id: 'pasta', name: 'Pasta', category: 'carbs', commonServing: '1 cup', estimatedCalories: 220, searchTerms: ['pasta', 'spaghetti', 'noodles'] },
    { id: 'potato', name: 'Potato', category: 'carbs', commonServing: '1 medium', estimatedCalories: 163, searchTerms: ['potato', 'baked', 'mashed'] },

    // Vegetables
    { id: 'broccoli', name: 'Broccoli', category: 'vegetables', commonServing: '1 cup', estimatedCalories: 55, searchTerms: ['broccoli', 'green', 'vegetable'] },
    { id: 'spinach', name: 'Spinach', category: 'vegetables', commonServing: '1 cup', estimatedCalories: 7, searchTerms: ['spinach', 'greens', 'leafy'] },
    { id: 'carrots', name: 'Carrots', category: 'vegetables', commonServing: '1 cup', estimatedCalories: 52, searchTerms: ['carrot', 'orange', 'vegetable'] },
    { id: 'tomatoes', name: 'Tomatoes', category: 'vegetables', commonServing: '1 medium', estimatedCalories: 22, searchTerms: ['tomato', 'red', 'salad'] },
    { id: 'bell_peppers', name: 'Bell Peppers', category: 'vegetables', commonServing: '1 cup', estimatedCalories: 39, searchTerms: ['pepper', 'bell', 'capsicum'] },
    { id: 'cucumber', name: 'Cucumber', category: 'vegetables', commonServing: '1 cup', estimatedCalories: 16, searchTerms: ['cucumber', 'salad'] },
    { id: 'lettuce', name: 'Lettuce', category: 'vegetables', commonServing: '1 cup', estimatedCalories: 5, searchTerms: ['lettuce', 'salad', 'greens'] },

    // Fruits
    { id: 'banana', name: 'Banana', category: 'fruits', commonServing: '1 medium', estimatedCalories: 105, searchTerms: ['banana', 'yellow'] },
    { id: 'apple', name: 'Apple', category: 'fruits', commonServing: '1 medium', estimatedCalories: 95, searchTerms: ['apple', 'red', 'green'] },
    { id: 'orange', name: 'Orange', category: 'fruits', commonServing: '1 medium', estimatedCalories: 62, searchTerms: ['orange', 'citrus'] },
    { id: 'berries', name: 'Mixed Berries', category: 'fruits', commonServing: '1 cup', estimatedCalories: 84, searchTerms: ['berries', 'strawberry', 'blueberry'] },
    { id: 'grapes', name: 'Grapes', category: 'fruits', commonServing: '1 cup', estimatedCalories: 104, searchTerms: ['grapes', 'green', 'red'] },
    { id: 'watermelon', name: 'Watermelon', category: 'fruits', commonServing: '1 cup', estimatedCalories: 46, searchTerms: ['watermelon', 'melon'] },
    { id: 'mango', name: 'Mango', category: 'fruits', commonServing: '1 cup', estimatedCalories: 99, searchTerms: ['mango', 'tropical'] },

    // Dairy
    { id: 'greek_yogurt', name: 'Greek Yogurt', category: 'dairy', commonServing: '1 cup', estimatedCalories: 100, searchTerms: ['yogurt', 'greek', 'dairy'] },
    { id: 'milk', name: 'Milk', category: 'dairy', commonServing: '1 cup', estimatedCalories: 149, searchTerms: ['milk', 'dairy', 'whole'] },
    { id: 'cheese', name: 'Cheese', category: 'dairy', commonServing: '30g', estimatedCalories: 113, searchTerms: ['cheese', 'cheddar', 'dairy'] },
    { id: 'cottage_cheese', name: 'Cottage Cheese', category: 'dairy', commonServing: '1 cup', estimatedCalories: 163, searchTerms: ['cottage', 'cheese', 'dairy'] },

    // Snacks
    { id: 'almonds', name: 'Almonds', category: 'snacks', commonServing: '30g', estimatedCalories: 170, searchTerms: ['almonds', 'nuts', 'snack'] },
    { id: 'peanut_butter', name: 'Peanut Butter', category: 'snacks', commonServing: '2 tbsp', estimatedCalories: 188, searchTerms: ['peanut', 'butter', 'spread'] },
    { id: 'protein_bar', name: 'Protein Bar', category: 'snacks', commonServing: '1 bar', estimatedCalories: 200, searchTerms: ['protein', 'bar', 'snack'] },
    { id: 'dark_chocolate', name: 'Dark Chocolate', category: 'snacks', commonServing: '30g', estimatedCalories: 170, searchTerms: ['chocolate', 'dark', 'snack'] },
    { id: 'popcorn', name: 'Popcorn', category: 'snacks', commonServing: '3 cups', estimatedCalories: 93, searchTerms: ['popcorn', 'snack'] },

    // Beverages
    { id: 'coffee', name: 'Coffee (Black)', category: 'beverages', commonServing: '1 cup', estimatedCalories: 2, searchTerms: ['coffee', 'black', 'espresso'] },
    { id: 'tea', name: 'Tea', category: 'beverages', commonServing: '1 cup', estimatedCalories: 2, searchTerms: ['tea', 'green', 'black'] },
    { id: 'protein_shake', name: 'Protein Shake', category: 'beverages', commonServing: '1 scoop', estimatedCalories: 120, searchTerms: ['protein', 'shake', 'smoothie'] },
    { id: 'orange_juice', name: 'Orange Juice', category: 'beverages', commonServing: '1 cup', estimatedCalories: 112, searchTerms: ['juice', 'orange'] },
    { id: 'smoothie', name: 'Fruit Smoothie', category: 'beverages', commonServing: '1 cup', estimatedCalories: 150, searchTerms: ['smoothie', 'fruit', 'blend'] },
  ];

  searchFoods(query: string, limit: number = 20): Food[] {
    if (!query.trim()) {
      return this.getPopularFoods().slice(0, limit);
    }

    const lowerQuery = query.toLowerCase();
    
    // Filter and sort results - prioritize name matches
    return this.foods
      .filter(food => {
        // Search in name
        if (food.name.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        // Search in search terms
        if (food.searchTerms?.some(term => term.includes(lowerQuery))) {
          return true;
        }
        // Search in category
        if (food.category.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        return false;
      })
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Prioritize foods with search term in name
        const aInName = aName.includes(lowerQuery);
        const bInName = bName.includes(lowerQuery);
        
        if (aInName && !bInName) return -1;
        if (!aInName && bInName) return 1;
        
        // If both have it in name, prioritize those starting with the search term
        if (aInName && bInName) {
          const aStarts = aName.startsWith(lowerQuery);
          const bStarts = bName.startsWith(lowerQuery);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
        }
        
        // Otherwise maintain original order
        return 0;
      })
      .slice(0, limit);
  }

  getFoodsByCategory(category: Food['category']): Food[] {
    return this.foods.filter(food => food.category === category);
  }

  getPopularFoods(limit: number = 10): Food[] {
    // Return most commonly logged foods (for now, just return first 10)
    return this.foods.slice(0, limit);
  }

  getFoodById(id: string): Food | undefined {
    return this.foods.find(food => food.id === id);
  }

  getAllCategories(): Food['category'][] {
    return ['protein', 'carbs', 'vegetables', 'fruits', 'dairy', 'snacks', 'beverages', 'other'];
  }
}

export const foodLibraryService = new FoodLibraryService();

