import * as Haptics from 'expo-haptics';

class HapticService {
  /**
   * Light haptic feedback for button taps
   */
  light(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Medium haptic feedback for important actions
   */
  medium(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Heavy haptic feedback for major actions
   */
  heavy(): void {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Success haptic feedback for completed actions
   */
  success(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Warning haptic feedback for warnings
   */
  warning(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /**
   * Error haptic feedback for errors
   */
  error(): void {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * Selection haptic feedback for selection changes
   */
  selection(): void {
    Haptics.selectionAsync();
  }

  /**
   * Custom haptic feedback for specific actions
   */
  custom(action: 'button' | 'success' | 'error' | 'warning' | 'selection' | 'completion'): void {
    switch (action) {
      case 'button':
        this.light();
        break;
      case 'success':
        this.success();
        break;
      case 'error':
        this.error();
        break;
      case 'warning':
        this.warning();
        break;
      case 'selection':
        this.selection();
        break;
      case 'completion':
        this.medium();
        break;
      default:
        this.light();
    }
  }
}

export const hapticService = new HapticService();
