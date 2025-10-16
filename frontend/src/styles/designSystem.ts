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
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  
  // Border colors
  border: '#E0E0E0',
  borderLight: '#F0F0F0',
  
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
} as const;

export const Layout = {
  // Screen padding
  screenPadding: Spacing.lg, // 16px
  
  // Section spacing
  sectionSpacing: Spacing.lg, // 16px
  sectionSpacingLarge: Spacing.xl, // 20px
  
  // Card spacing
  cardSpacing: Spacing.md, // 12px
  cardPadding: Spacing.lg, // 16px
  cardPaddingLarge: Spacing.xl, // 20px
  
  // Header
  headerPadding: Spacing.lg, // 16px
  headerHeight: 60,
  
  // Grid gaps
  gridGap: Spacing.md, // 12px
  gridGapSmall: Spacing.sm, // 8px
  
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
    backgroundColor: Colors.background,
  },
  
  // Scroll view
  scrollView: {
    flex: 1,
  },
  
  // Content container
  content: {
    paddingHorizontal: Layout.screenPadding,
  },
  
  // Section
  section: {
    marginBottom: Layout.sectionSpacing,
  },
  
  // Section header
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Layout.cardSpacing,
  },
  
  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusMedium,
    padding: Layout.cardPadding,
    marginBottom: Layout.cardSpacing,
    ...Layout.shadowMedium,
  },
  
  // Card large
  cardLarge: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLarge,
    padding: Layout.cardPaddingLarge,
    marginBottom: Layout.cardSpacing,
    ...Layout.shadowMedium,
  },
  
  // Grid
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Layout.gridGap,
  },
  
  // Grid small
  gridSmall: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Layout.gridGapSmall,
  },
  
  // Button primary
  buttonPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Layout.radiusMedium,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...Layout.shadowMedium,
  },
  
  // Button secondary
  buttonSecondary: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.radiusSmall,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Empty state
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
  },
} as const;
