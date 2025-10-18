// Lifelog Design System
// Consistent spacing, colors, and typography across all screens

export const Spacing = {
  // Base spacing unit (8px)
  xs: 4,    // 0.5x
  sm: 8,    // 1x
  md: 12,   // 1.5x
  lg: 16,   // 2x
  xl: 20,   // 2.5x
  xxl: 24,  // 3x
  xxxl: 32, // 4x
} as const;

export const Colors = {
  // Primary colors
  primary: '#007AFF',
  primaryLight: '#F0F8FF',
  primaryDark: '#0056B3',
  
  // Background colors
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8F9FA',
  
  // Text colors
  text: '#1A1A1A',          // Primary text
  textSecondary: '#666666',  // Secondary text
  textTertiary: '#999999',   // Tertiary text / placeholders
  textLight: '#FFFFFF',      // Light text (on dark backgrounds)
  
  // Border colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  divider: '#E0E0E0',
  
  // Semantic colors
  disabled: '#CCCCCC',
  placeholder: '#999999',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Status colors
  success: '#28A745',
  warning: '#FFA500',
  error: '#DC3545',
  info: '#17A2B8',
  
  // Exercise type colors
  strength: '#4ECDC4',
  cardio: '#FF6B6B',
  flexibility: '#A29BFE',
  other: '#45B7D1',
  
  // Macro colors
  protein: '#4ECDC4',
  carbs: '#FFD93D',
  fat: '#FF6B6B',
} as const;

export const Typography = {
  // Headers
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  
  // Labels
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  
  // Button text
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
} as const;

export const Layout = {
  // Screen padding
  screenPadding: 16, // Spacing.lg
  
  // Section spacing
  sectionSpacing: 16, // Spacing.lg
  sectionSpacingLarge: 20, // Spacing.xl
  
  // Card spacing
  cardSpacing: 12, // Spacing.md
  cardPadding: 16, // Spacing.lg
  cardPaddingLarge: 20, // Spacing.xl
  
  // Header
  headerPadding: 16, // Spacing.lg
  headerHeight: 60,
  
  // Grid gaps
  gridGap: 12, // Spacing.md
  gridGapSmall: 8, // Spacing.sm
  
  // Border radius
  radiusSmall: 8,
  radiusMedium: 12,
  radiusLarge: 16,
  
  // Shadows
  shadowSmall: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const CommonStyles = {
  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Colors.background
  },
  
  // Scroll view
  scrollView: {
    flex: 1,
  },
  
  // Content container
  content: {
    paddingHorizontal: 16, // Layout.screenPadding
  },
  
  // Section
  section: {
    marginBottom: 16, // Layout.sectionSpacing
  },
  
  // Section header
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12, // Layout.cardSpacing
  },
  
  // Card
  card: {
    backgroundColor: '#FFFFFF', // Colors.surface
    borderRadius: 12, // Layout.radiusMedium
    padding: 16, // Layout.cardPadding
    marginBottom: 12, // Layout.cardSpacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Card large
  cardLarge: {
    backgroundColor: '#FFFFFF', // Colors.surface
    borderRadius: 16, // Layout.radiusLarge
    padding: 20, // Layout.cardPaddingLarge
    marginBottom: 12, // Layout.cardSpacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Grid
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12, // Layout.gridGap
  },
  
  // Grid small
  gridSmall: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8, // Layout.gridGapSmall
  },
  
  // Button primary
  buttonPrimary: {
    backgroundColor: '#007AFF', // Colors.primary
    paddingVertical: 16, // Spacing.lg
    paddingHorizontal: 24, // Spacing.xxl
    borderRadius: 12, // Layout.radiusMedium
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Button secondary
  buttonSecondary: {
    backgroundColor: '#F0F8FF', // Colors.primaryLight
    paddingVertical: 12, // Spacing.md
    paddingHorizontal: 16, // Spacing.lg
    borderRadius: 8, // Layout.radiusSmall
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Button outline
  buttonOutline: {
    backgroundColor: 'transparent' as const,
    paddingVertical: 12, // Spacing.md
    paddingHorizontal: 16, // Spacing.lg
    borderRadius: 12, // Layout.radiusMedium
    borderWidth: 1,
    borderColor: '#E0E0E0', // Colors.border
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Button text
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF', // Colors.textLight
  },
  
  // Input styles
  input: {
    backgroundColor: '#FFFFFF', // Colors.surface
    borderWidth: 1,
    borderColor: '#E0E0E0', // Colors.border
    borderRadius: 12, // Layout.radiusMedium
    paddingHorizontal: 12, // Spacing.md
    paddingVertical: 12, // Spacing.md
    fontSize: 16,
    color: '#1A1A1A', // Colors.text
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A', // Colors.text
    marginBottom: 8, // Spacing.sm
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Colors.overlay
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20, // Spacing.xl
  },
  
  modalContainer: {
    backgroundColor: '#FFFFFF', // Colors.surface
    borderRadius: 16, // Layout.radiusLarge
    padding: 20, // Spacing.xl
    width: '100%' as const,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  modalHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 16, // Spacing.lg
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0', // Colors.border
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 32, // Spacing.xxxl
    paddingHorizontal: 24, // Spacing.xxl
  },
  
  // Card variants
  cardCompact: {
    backgroundColor: '#FFFFFF', // Colors.surface
    borderRadius: 12, // Layout.radiusMedium
    padding: 12, // Spacing.md
    marginBottom: 12, // Layout.cardSpacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  cardElevated: {
    backgroundColor: '#FFFFFF', // Colors.surface
    borderRadius: 16, // Layout.radiusLarge
    padding: 16, // Layout.cardPadding
    marginBottom: 12, // Layout.cardSpacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// Progress/Status Colors
export const ProgressColors = {
  veryLow: '#FF6B6B',    // Red: < 30%
  low: '#FF6B6B',        // Red: < 50%
  medium: '#FFE66D',     // Yellow: 50-80%
  good: '#4ECDC4',       // Teal: 80-100%
  complete: '#45B7D1',   // Blue: 100-120%
  over: '#FF9800',       // Orange: > 120%
} as const;

// Utility Functions

/**
 * Get color based on progress percentage (0-1 scale)
 * @param progress - Progress value between 0 and 1+ (e.g., 0.5 for 50%, 1.2 for 120%)
 * @returns Hex color string
 */
export const getProgressColor = (progress: number): string => {
  if (progress < 0.5) return ProgressColors.low;
  if (progress < 0.8) return ProgressColors.medium;
  if (progress < 1) return ProgressColors.good;
  if (progress < 1.2) return ProgressColors.complete;
  return ProgressColors.over;
};

/**
 * Get color based on macro/calorie progress with same logic
 * Alias for getProgressColor for backward compatibility
 */
export const getMacroProgressColor = getProgressColor;

/**
 * Get color based on hydration progress
 * Uses slightly different thresholds for water intake
 */
export const getHydrationProgressColor = (progress: number): string => {
  if (progress < 0.3) return ProgressColors.veryLow;
  if (progress < 0.6) return ProgressColors.low;
  if (progress < 0.8) return ProgressColors.medium;
  if (progress < 1) return ProgressColors.good;
  if (progress < 1.2) return ProgressColors.complete;
  return ProgressColors.over;
};

/**
 * Get status message based on progress
 * @param progress - Progress value between 0 and 1+
 * @param type - Type of progress (general, hydration, macro)
 * @returns Motivational status message
 */
export const getProgressMessage = (
  progress: number, 
  type: 'general' | 'hydration' | 'macro' = 'general'
): string => {
  if (type === 'hydration') {
    if (progress < 0.3) return 'Stay hydrated! 💧';
    if (progress < 0.6) return 'Keep drinking! 💪';
    if (progress < 0.8) return 'Almost there! 🌊';
    if (progress < 1) return 'Great job! 🎉';
    return 'Hydration master! 🏆';
  }
  
  if (type === 'macro') {
    if (progress < 0.5) return 'Keep going! 💪';
    if (progress < 0.8) return 'Good progress! 👍';
    if (progress < 1) return 'Almost there! 🎯';
    if (progress < 1.2) return 'Target reached! 🎉';
    return 'Excellent! 🏆';
  }
  
  // General progress
  if (progress < 0.5) return 'Getting started! 🚀';
  if (progress < 0.8) return 'Making progress! 💪';
  if (progress < 1) return 'Almost done! 🎯';
  return 'Completed! 🎉';
};
