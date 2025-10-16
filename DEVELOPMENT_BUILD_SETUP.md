# Development Build Setup Guide
## For Full Notification Support in Lifelog

### 🚨 **Current Limitation**
Expo Go (SDK 53+) has removed support for push notifications. To use the full notification features of Lifelog, you need to create a development build.

### 📱 **What You'll Get with Development Build**
- ✅ Full notification support (meal reminders, hydration alerts, achievements)
- ✅ Better performance and debugging
- ✅ Access to all native features
- ✅ Production-like testing environment

### 🛠️ **Setup Instructions**

#### **Option 1: EAS Build (Recommended)**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Create development build for Android
eas build --profile development --platform android

# Or for iOS (requires Apple Developer account)
eas build --profile development --platform ios
```

#### **Option 2: Local Development Build**
```bash
# Install Expo CLI
npm install -g @expo/cli

# Create development build
npx expo run:android
# or
npx expo run:ios
```

### 📋 **Pre-requisites**

#### **For Android:**
- Android Studio installed
- Android SDK configured
- Physical device or emulator

#### **For iOS:**
- Xcode installed (macOS only)
- Apple Developer account
- Physical device (simulator has limited notification support)

### 🔧 **Configuration Files**

#### **app.json** (already configured)
```json
{
  "expo": {
    "name": "Lifelog",
    "slug": "lifelog",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.lifelog.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.lifelog.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-notifications"
    ]
  }
}
```

### 🚀 **Quick Start (EAS Build)**

1. **Install EAS CLI:**
   ```bash
   npm install -g @expo/eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure project:**
   ```bash
   eas build:configure
   ```

4. **Build for Android:**
   ```bash
   eas build --profile development --platform android
   ```

5. **Install on device:**
   - Download the APK from the build link
   - Install on your Android device
   - Run the app with full notification support

### 📱 **Testing Notifications**

Once you have the development build:

1. **Open the app** and complete onboarding
2. **Go to Settings** → **Notification Settings**
3. **Enable notifications** for meals, hydration, and weekly progress
4. **Test meal logging** - you should receive follow-up reminders
5. **Test hydration tracking** - you should get water reminders
6. **Check weekly progress** - you should get summary notifications

### 🔍 **Debugging Notifications**

If notifications don't work:

1. **Check device settings:**
   - Go to Settings → Apps → Lifelog → Notifications
   - Ensure notifications are enabled

2. **Check app permissions:**
   - The app should request notification permissions on first launch
   - Grant all notification permissions

3. **Check console logs:**
   - Look for "Notifications initialized successfully"
   - Check for any error messages

### 📊 **Current Status**

- ✅ **Expo Go**: Basic app functionality, limited notifications
- ✅ **Development Build**: Full functionality with complete notification support
- ✅ **Production Build**: Ready for app store deployment

### 🎯 **Next Steps**

1. **For Development**: Use development build for full testing
2. **For Production**: Use EAS Build to create production APK/IPA
3. **For Distribution**: Submit to Google Play Store / Apple App Store

### 💡 **Pro Tips**

- **Keep Expo Go**: Still useful for quick UI testing
- **Use Development Build**: For notification and native feature testing
- **EAS Build**: Best for sharing with testers and production deployment
- **Local Build**: Fastest for development iterations

---

**Note**: The app works perfectly in Expo Go for all features except notifications. For complete testing of the notification system, a development build is required.
