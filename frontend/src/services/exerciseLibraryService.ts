/**
 * Exercise Library Service
 * Provides a comprehensive database of exercises with search functionality
 */

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  muscleGroups: string[];
  equipment: 'bodyweight' | 'dumbbells' | 'barbell' | 'machine' | 'cardio' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description?: string;
  instructions?: string[];
}

class ExerciseLibraryService {
  private exercises: Exercise[] = [
    // Strength Training - Bodyweight
    {
      id: 'push-ups',
      name: 'Push-ups',
      category: 'strength',
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      description: 'Classic upper body exercise',
      instructions: ['Start in plank position', 'Lower chest to ground', 'Push back up']
    },
    {
      id: 'pull-ups',
      name: 'Pull-ups',
      category: 'strength',
      muscleGroups: ['back', 'biceps', 'shoulders'],
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      description: 'Upper body pulling exercise',
      instructions: ['Hang from bar', 'Pull body up until chin over bar', 'Lower with control']
    },
    {
      id: 'squats',
      name: 'Squats',
      category: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      description: 'Fundamental lower body exercise',
      instructions: ['Stand with feet shoulder-width apart', 'Lower as if sitting back', 'Return to standing']
    },
    {
      id: 'lunges',
      name: 'Lunges',
      category: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      description: 'Single-leg lower body exercise',
      instructions: ['Step forward with one leg', 'Lower back knee toward ground', 'Push back to starting position']
    },
    {
      id: 'plank',
      name: 'Plank',
      category: 'strength',
      muscleGroups: ['core', 'shoulders'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      description: 'Isometric core exercise',
      instructions: ['Start in push-up position', 'Hold body straight', 'Engage core throughout']
    },
    {
      id: 'pike-push-ups',
      name: 'Pike Push-ups',
      category: 'strength',
      muscleGroups: ['shoulders', 'triceps'],
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      description: 'Bodyweight shoulder exercise',
      instructions: ['Start in downward dog position', 'Bend elbows to lower head toward ground', 'Push back up']
    },
    {
      id: 'handstand-push-ups',
      name: 'Handstand Push-ups',
      category: 'strength',
      muscleGroups: ['shoulders', 'triceps', 'core'],
      equipment: 'bodyweight',
      difficulty: 'advanced',
      description: 'Advanced bodyweight shoulder press',
      instructions: ['Kick up into handstand against wall', 'Lower head to ground', 'Press back up']
    },

    // Strength Training - Dumbbells
    {
      id: 'dumbbell-bench-press',
      name: 'Dumbbell Bench Press',
      category: 'strength',
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      equipment: 'dumbbells',
      difficulty: 'beginner',
      description: 'Chest exercise with dumbbells',
      instructions: ['Lie on bench', 'Press dumbbells up', 'Lower with control']
    },
    {
      id: 'dumbbell-rows',
      name: 'Dumbbell Rows',
      category: 'strength',
      muscleGroups: ['back', 'biceps'],
      equipment: 'dumbbells',
      difficulty: 'beginner',
      description: 'Back strengthening exercise',
      instructions: ['Bend forward at hips', 'Pull dumbbells to chest', 'Squeeze shoulder blades']
    },
    {
      id: 'dumbbell-squats',
      name: 'Dumbbell Squats',
      category: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: 'dumbbells',
      difficulty: 'beginner',
      description: 'Weighted squat variation',
      instructions: ['Hold dumbbells at sides', 'Perform squat motion', 'Keep chest up']
    },
    {
      id: 'dumbbell-shoulder-press',
      name: 'Dumbbell Shoulder Press',
      category: 'strength',
      muscleGroups: ['shoulders', 'triceps'],
      equipment: 'dumbbells',
      difficulty: 'beginner',
      description: 'Overhead pressing exercise for shoulders',
      instructions: ['Hold dumbbells at shoulder height', 'Press weights overhead', 'Lower with control']
    },
    {
      id: 'lateral-raises',
      name: 'Lateral Raises',
      category: 'strength',
      muscleGroups: ['shoulders'],
      equipment: 'dumbbells',
      difficulty: 'beginner',
      description: 'Isolation exercise for side delts',
      instructions: ['Hold dumbbells at sides', 'Raise arms to shoulder height', 'Lower slowly']
    },
    {
      id: 'front-raises',
      name: 'Front Raises',
      category: 'strength',
      muscleGroups: ['shoulders'],
      equipment: 'dumbbells',
      difficulty: 'beginner',
      description: 'Isolation exercise for front delts',
      instructions: ['Hold dumbbells in front of thighs', 'Raise arms to shoulder height', 'Lower with control']
    },

    // Strength Training - Barbell
    {
      id: 'barbell-bench-press',
      name: 'Barbell Bench Press',
      category: 'strength',
      muscleGroups: ['chest', 'shoulders', 'triceps'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      description: 'Classic chest exercise',
      instructions: ['Lie on bench', 'Grip bar slightly wider than shoulders', 'Press up and lower with control']
    },
    {
      id: 'barbell-squats',
      name: 'Barbell Squats',
      category: 'strength',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      description: 'King of lower body exercises',
      instructions: ['Position bar on upper back', 'Stand with feet shoulder-width apart', 'Squat down and up']
    },
    {
      id: 'deadlift',
      name: 'Deadlift',
      category: 'strength',
      muscleGroups: ['hamstrings', 'glutes', 'back', 'traps'],
      equipment: 'barbell',
      difficulty: 'advanced',
      description: 'Full body compound movement',
      instructions: ['Stand with feet hip-width apart', 'Bend at hips and knees', 'Lift bar by extending hips and knees']
    },
    {
      id: 'barbell-shoulder-press',
      name: 'Barbell Shoulder Press',
      category: 'strength',
      muscleGroups: ['shoulders', 'triceps'],
      equipment: 'barbell',
      difficulty: 'intermediate',
      description: 'Overhead barbell press',
      instructions: ['Start with bar at shoulder height', 'Press bar overhead', 'Lower to shoulders']
    },

    // Cardio
    {
      id: 'running',
      name: 'Running',
      category: 'cardio',
      muscleGroups: ['legs', 'core'],
      equipment: 'cardio',
      difficulty: 'beginner',
      description: 'Aerobic cardiovascular exercise',
      instructions: ['Maintain steady pace', 'Land on forefoot', 'Keep posture upright']
    },
    {
      id: 'cycling',
      name: 'Cycling',
      category: 'cardio',
      muscleGroups: ['quadriceps', 'hamstrings', 'calves'],
      equipment: 'cardio',
      difficulty: 'beginner',
      description: 'Low-impact cardio exercise',
      instructions: ['Maintain steady cadence', 'Keep core engaged', 'Adjust resistance as needed']
    },
    {
      id: 'jumping-jacks',
      name: 'Jumping Jacks',
      category: 'cardio',
      muscleGroups: ['full body'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      description: 'Full body cardio exercise',
      instructions: ['Jump feet apart while raising arms', 'Jump back to starting position', 'Repeat rhythmically']
    },
    {
      id: 'burpees',
      name: 'Burpees',
      category: 'cardio',
      muscleGroups: ['full body'],
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      description: 'High-intensity full body exercise',
      instructions: ['Start standing', 'Drop to push-up position', 'Do push-up', 'Jump feet to hands', 'Jump up with arms overhead']
    },

    // Flexibility
    {
      id: 'yoga-flow',
      name: 'Yoga Flow',
      category: 'flexibility',
      muscleGroups: ['full body'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      description: 'Dynamic stretching and strength',
      instructions: ['Move through poses fluidly', 'Focus on breath', 'Maintain proper alignment']
    },
    {
      id: 'static-stretching',
      name: 'Static Stretching',
      category: 'flexibility',
      muscleGroups: ['full body'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      description: 'Hold stretches for flexibility',
      instructions: ['Hold each stretch 30-60 seconds', 'Breathe deeply', 'Don\'t bounce']
    },
    {
      id: 'pigeon-pose',
      name: 'Pigeon Pose',
      category: 'flexibility',
      muscleGroups: ['hips', 'glutes'],
      equipment: 'bodyweight',
      difficulty: 'intermediate',
      description: 'Hip opening stretch',
      instructions: ['Start in downward dog', 'Bring knee forward', 'Extend back leg', 'Lower to forearms']
    },

    // Sports
    {
      id: 'basketball',
      name: 'Basketball',
      category: 'sports',
      muscleGroups: ['full body'],
      equipment: 'other',
      difficulty: 'beginner',
      description: 'Team sport with cardio and skill',
      instructions: ['Dribble and shoot', 'Play defense', 'Run up and down court']
    },
    {
      id: 'tennis',
      name: 'Tennis',
      category: 'sports',
      muscleGroups: ['arms', 'core', 'legs'],
      equipment: 'other',
      difficulty: 'intermediate',
      description: 'Racquet sport with quick movements',
      instructions: ['Serve and return', 'Move around court', 'Use proper technique']
    },
    {
      id: 'swimming',
      name: 'Swimming',
      category: 'sports',
      muscleGroups: ['full body'],
      equipment: 'other',
      difficulty: 'beginner',
      description: 'Low-impact full body exercise',
      instructions: ['Choose stroke', 'Maintain rhythm', 'Focus on technique']
    },

    // Other
    {
      id: 'walking',
      name: 'Walking',
      category: 'other',
      muscleGroups: ['legs', 'core'],
      equipment: 'bodyweight',
      difficulty: 'beginner',
      description: 'Gentle cardiovascular exercise',
      instructions: ['Maintain steady pace', 'Swing arms naturally', 'Keep posture upright']
    },
    {
      id: 'hiking',
      name: 'Hiking',
      category: 'other',
      muscleGroups: ['legs', 'core', 'glutes'],
      equipment: 'other',
      difficulty: 'intermediate',
      description: 'Outdoor cardio and strength',
      instructions: ['Wear proper footwear', 'Carry water', 'Pace yourself on inclines']
    }
  ];

  /**
   * Search exercises by name, category, or muscle group
   */
  searchExercises(query: string, limit: number = 20): Exercise[] {
    if (!query.trim()) {
      return this.exercises.slice(0, limit);
    }

    const searchTerm = query.toLowerCase().trim();
    
    // Filter and sort results - prioritize name matches
    return this.exercises
      .filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm) ||
        exercise.category.toLowerCase().includes(searchTerm) ||
        exercise.muscleGroups.some(muscle => muscle.toLowerCase().includes(searchTerm)) ||
        exercise.equipment.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Prioritize exercises with search term in name
        const aInName = aName.includes(searchTerm);
        const bInName = bName.includes(searchTerm);
        
        if (aInName && !bInName) return -1;
        if (!aInName && bInName) return 1;
        
        // If both have it in name, prioritize those starting with the search term
        if (aInName && bInName) {
          const aStarts = aName.startsWith(searchTerm);
          const bStarts = bName.startsWith(searchTerm);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
        }
        
        // Otherwise maintain original order
        return 0;
      })
      .slice(0, limit);
  }

  /**
   * Get exercises by category
   */
  getExercisesByCategory(category: Exercise['category']): Exercise[] {
    return this.exercises.filter(exercise => exercise.category === category);
  }

  /**
   * Get exercises by equipment
   */
  getExercisesByEquipment(equipment: Exercise['equipment']): Exercise[] {
    return this.exercises.filter(exercise => exercise.equipment === equipment);
  }

  /**
   * Get exercise by ID
   */
  getExerciseById(id: string): Exercise | undefined {
    return this.exercises.find(exercise => exercise.id === id);
  }

  /**
   * Get all categories
   */
  getCategories(): Exercise['category'][] {
    return ['strength', 'cardio', 'flexibility', 'sports', 'other'];
  }

  /**
   * Get all equipment types
   */
  getEquipmentTypes(): Exercise['equipment'][] {
    return ['bodyweight', 'dumbbells', 'barbell', 'machine', 'cardio', 'other'];
  }

  /**
   * Get all muscle groups
   */
  getMuscleGroups(): string[] {
    const allMuscles = this.exercises.flatMap((exercise: Exercise) => exercise.muscleGroups);
    return [...new Set(allMuscles)].sort();
  }

  /**
   * Get popular exercises (most commonly searched)
   */
  getPopularExercises(): Exercise[] {
    const popularIds = [
      'push-ups', 'squats', 'running', 'plank', 'lunges',
      'dumbbell-bench-press', 'cycling', 'yoga-flow', 'walking'
    ];
    
    return popularIds
      .map(id => this.getExerciseById(id))
      .filter(Boolean) as Exercise[];
  }
}

export const exerciseLibraryService = new ExerciseLibraryService();
