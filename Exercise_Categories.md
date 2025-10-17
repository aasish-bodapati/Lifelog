# Exercise Categories

## Overview

LifeLog supports **5 exercise categories**, each with specific tracking fields based on the type of activity.

---

## Categories

### 1. **Strength** 💪
**Focus:** Building muscle, power, and strength

**Tracking Fields:**
- ✅ Sets
- ✅ Reps
- ✅ Weight (kg)

**Examples:**
- Push-ups
- Dumbbell Bench Press
- Squats
- Pull-ups
- Deadlifts
- Barbell Rows
- Leg Press
- Shoulder Press
- Bicep Curls

---

### 2. **Cardio** 🏃
**Focus:** Cardiovascular endurance and stamina

**Tracking Fields:**
- ✅ Duration (minutes)
- ✅ Distance (km)

**Examples:**
- Running
- Cycling
- Jump Rope
- Swimming

---

### 3. **Flexibility** 🧘
**Focus:** Stretching, mobility, and range of motion

**Tracking Fields:**
- ✅ Duration (minutes)

**Examples:**
- Yoga
- Static Stretching
- Pigeon Pose
- Dynamic Stretching

---

### 4. **Sports** ⚽
**Focus:** Sport-specific activities and games

**Tracking Fields:**
- ✅ Duration (minutes)
- ✅ Distance (km) - *optional*

**Examples:**
- Basketball
- Tennis
- Soccer
- Volleyball

---

### 5. **Other** 🚶
**Focus:** General activities and miscellaneous exercises

**Tracking Fields:**
- ✅ Duration (minutes)
- ✅ Distance (km) - *optional*

**Examples:**
- Walking
- Hiking
- Dancing
- General Activity

---

## Field Logic Summary

| Category | Sets | Reps | Weight | Duration | Distance |
|----------|:----:|:----:|:------:|:--------:|:--------:|
| **Strength** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Cardio** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Flexibility** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Sports** | ❌ | ❌ | ❌ | ✅ | ✅* |
| **Other** | ❌ | ❌ | ❌ | ✅ | ✅* |

*\* = Optional field*

---

## Design Principles

### Strength Exercises
- **No duration tracking** - Focus is on sets, reps, and progressive overload
- Weight is measured in kilograms (kg)
- Examples: "3 sets × 10 reps • 20kg"

### Cardio Exercises
- **Time and distance focused** - Measure cardiovascular performance
- Duration in minutes, distance in kilometers
- Examples: "30 minutes • 5km"

### Flexibility Exercises
- **Duration only** - Track time spent stretching
- No sets/reps needed as stretches are held
- Examples: "15 minutes"

### Sports & Other
- **Flexible tracking** - Duration is primary, distance optional
- Accommodates various activity types
- Examples: "45 minutes • 8km" or "30 minutes"

---

## Implementation Notes

### Workout Logging
- The app dynamically shows/hides fields based on exercise category
- Users only see relevant fields for their selected exercise
- Validation ensures required fields are filled

### Workout Display
- Logged workouts show only the fields that were recorded
- Example: Strength workout shows "Sets: 3 | Reps: 12 | Weight: 20 kg"
- Example: Cardio workout shows "Duration: 30 min | Distance: 5 km"

### Editing
- When editing a workout, only the originally logged fields are editable
- Category-specific fields cannot be added after logging
- Maintains data integrity and prevents category confusion

