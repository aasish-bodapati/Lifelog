// Custom Toast Service - Compatible with React 19
// This is a placeholder that will be overridden by the ToastProvider context
let toastInstance: any = null;

export const setToastInstance = (instance: any) => {
  toastInstance = instance;
};

export const toastService = {
  success: (title: string, message?: string) => {
    const text = message ? `${title}: ${message}` : title;
    if (toastInstance) {
      toastInstance.showToast(text, 'success');
    } else {
      console.log(`✅ ${text}`);
    }
  },

  error: (title: string, message?: string) => {
    const text = message ? `${title}: ${message}` : title;
    if (toastInstance) {
      toastInstance.showToast(text, 'error', 4000);
    } else {
      console.error(`❌ ${text}`);
    }
  },

  info: (title: string, message?: string) => {
    const text = message ? `${title}: ${message}` : title;
    if (toastInstance) {
      toastInstance.showToast(text, 'info');
    } else {
      console.info(`ℹ️ ${text}`);
    }
  },

  warning: (title: string, message?: string) => {
    const text = message ? `${title}: ${message}` : title;
    if (toastInstance) {
      toastInstance.showToast(text, 'warning');
    } else {
      console.warn(`⚠️ ${text}`);
    }
  },
};
