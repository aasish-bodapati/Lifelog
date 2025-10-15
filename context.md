📋 Lifelog Project - Complete Context
🎯 Project Overview
Lifelog is a fitness and nutrition tracking app designed for busy professionals who need efficient tracking without complexity.
Target Audience
Busy professionals who don't have time to learn complex apps
Users who want 1-tap logging and minimal friction
People who need offline-first functionality with sync
🏗️ Architecture
Tech Stack
Frontend: React Native (converted to Expo SDK 54)
Backend: FastAPI with Python
Database: SQLite
Development: TypeScript, Expo Go for testing
Project Structure
🚀 Current Status
✅ Completed
Backend API - Complete FastAPI server with all endpoints
Database Models - User, Workout, Exercise, Nutrition, BodyStats
Frontend Structure - React Native app with navigation
Expo Conversion - Converted from React Native CLI to Expo
TypeScript Setup - Full TypeScript configuration
Context Management - User and Log contexts for state
API Services - Complete service layer for backend communication
🔧 Current Issue
Expo is running but has a Babel plugin error:
Missing react-native-worklets/plugin dependency
This is preventing the app from bundling properly
The QR code is displayed but the app won't load
📱 Features Implemented
Backend Features
User Management: Registration, login, profile updates
Fitness Tracking: Log exercises, sets, reps, weight (renamed from Workout)
Nutrition Logging: Track meals, macros, calories
Body Stats: Weight, measurements, health metrics
Analytics: Daily/weekly summaries and progress tracking
RESTful API: Complete CRUD operations for all entities
Frontend Features
Authentication: Login/Register screens
Navigation: Bottom tab navigation with 5 main screens
State Management: React Context for user and log data
Offline-First: AsyncStorage with API sync
TypeScript: Full type safety throughout
Modern UI: Clean, professional design for busy professionals
🎯 Core Philosophy
Speed over complexity: 1-tap logging, auto-fill defaults
Offline-first: Local SQLite with API sync
Minimal friction: Clean UI, simple navigation
Professional focus: Built for busy schedules

📝 Naming Conventions (CRITICAL)
Consistency is essential for long-term maintainability. All naming must follow these standards:

Frontend (React Native/TypeScript):
- Files: PascalCase for components (HomeScreen.tsx), camelCase for utilities (userService.ts)
- Components: PascalCase (const HomeScreen: React.FC = () => {})
- Functions: camelCase (handleLogin, getGreeting)
- Variables: camelCase (userState, logState)
- Types/Interfaces: PascalCase (User, Workout, NutritionLog)
- Constants: UPPER_SNAKE_CASE

Backend (Python/FastAPI):
- Files: snake_case (fitness.py, body_stats.py, nutrition.py)
- Classes: PascalCase (User, Workout, NutritionLog, BodyStat)
- Functions: snake_case (create_fitness_session, get_body_stats)
- Variables: snake_case (user_id, fitness_id)
- API Endpoints: snake_case (/api/fitness, /api/nutrition, /api/body)

Database:
- Tables: snake_case (workouts, nutrition_logs, body_stats)
- Columns: snake_case (user_id, created_at, body_fat_percentage)

IMPORTANT: When renaming components (like Workout → Fitness), ALL references must be updated:
- Frontend: Component names, service files, navigation, types
- Backend: Route files, function names, API endpoints, imports
- Database: Table names, column references (if applicable)
- Documentation: All references in comments and docs

This prevents confusion and maintains code clarity across the entire project.
🔧 Current Technical Issues
1. Babel Plugin Error
Solution needed: Install missing dependencies or remove reanimated plugin
2. Package Version Mismatches
Expo SDK 54 expects different package versions than what's installed:
React Native: 0.76.5 → 0.81.4
React: 18.3.1 → 19.1.0
Various other packages need updates
3. Asset Files
Created placeholder asset files (icon.png, splash.png, etc.)
Need proper app icons and splash screens
🚀 Next Steps to Get Running
Immediate Fix
Long-term Improvements
Update all packages to Expo SDK 54 compatible versions
Add proper app icons and splash screens
Implement the actual logging forms
Add charts and progress visualization
Test on real devices
💡 Development Workflow
Backend: .\start-backend.ps1 (FastAPI on port 8000)
Frontend: .\start-frontend.ps1 (Expo on port 8081)
Testing: Scan QR code with Expo Go app
Development: Hot reload, instant testing on device
The project is 90% complete - just needs the Babel plugin issue resolved to start development! 🎉


Use only powershell commands
Do not touch servers, always assume they are running