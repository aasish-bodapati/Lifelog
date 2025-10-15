# Lifelog Onboarding System

## 🎯 Goal
Help users get to logging ASAP — ideally within 60 seconds. Capture just enough info to personalize recommendations and make them feel clarity + progress, not setup fatigue.

## 🧩 Step-by-Step Flow

### Step 1: Complete Profile & Goals (Combined)
**Purpose**: Capture all essential information in one comprehensive screen.

**Basic Information**:
| Field | Example | Logic |
|-------|---------|-------|
| Age | 29 | Used for BMR calc |
| Gender | M/F/Other | Used for BMR calc |
| Height | 180 cm | Used for calorie/goal est. |
| Weight | 70 kg | Used for progress baseline |

**Goal Selection**:
- ⚖️ Maintain weight
- ⬆️ Gain muscle  
- ⬇️ Lose fat

**Activity Level**:
- Sedentary (1.2x BMR)
- Lightly active (1.375x BMR)
- Moderately active (1.55x BMR)
- Very active (1.725x BMR)
- Extra active (1.9x BMR)

**Features**:
- Real-time BMI calculation as user enters height/weight
- Visual goal selection with descriptions
- Activity level picker with multipliers displayed
- All essential data captured in one screen

**Logic**:
- Store all data locally immediately (AsyncStorage)
- Send to API after onboarding completes
- Moves to Step 2

### Step 2: Preferences (Optional)
**Purpose**: Customize notification and reminder settings.

**Toggles**:
- "Remind me to log meals"
- "Remind me to hydrate"
- "Remind me to check progress weekly"

**Logic**:
- Store notification preferences locally + in backend user profile
- Can be skipped
- Moves to Step 3

### Step 3: Summary + Confirm
**Purpose**: Show personalized targets and confirm setup.

**Display**:
```
Your personalized targets:
Calories: 2,422 kcal
Protein: 140g (realistic cap)
Carbs: 357g
Fat: 60g
Hydration: 2.5L/day
```

**CTA**: "Start Logging" → takes user to Dashboard.

**Logic**:
- Persist all data (profile, preferences, goals)
- Generate first local user session
- Mark `onboardingComplete = true` in AsyncStorage → skip onboarding next launch

## 🧮 Calculation Formulas

### 1️⃣ Basal Metabolic Rate (BMR)
BMR estimates the calories your body needs at rest to maintain basic functions.

**Mifflin-St Jeor Equation**

For men:
```
BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
```

For women:
```
BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
```

**Example**: Aasish, male, 29y, 70kg, 180cm
```
BMR = (10 × 70) + (6.25 × 180) - (5 × 29) + 5
BMR = 700 + 1125 - 145 + 5 = 1685 kcal/day
```

### 2️⃣ Total Daily Energy Expenditure (TDEE)
TDEE accounts for activity level, multiplying BMR by an activity factor:

| Activity Level | Multiplier |
|----------------|------------|
| Sedentary | 1.2 |
| Lightly active | 1.375 |
| Moderately active | 1.55 |
| Very active | 1.725 |
| Extra active | 1.9 |

**Example**: Aasish's BMR = 1685, moderately active
```
TDEE = 1685 × 1.55 ≈ 2610 kcal/day
```

### 3️⃣ Goal Adjustments
| Goal | Adjustment |
|------|------------|
| Maintain | TDEE (no change) |
| Gain | TDEE + 300–500 kcal |
| Lose | TDEE - 300–500 kcal |

**Example**: Want to gain muscle
```
CalorieTarget = 2610 + 400 = 3010 kcal/day
```

### 4️⃣ Macronutrient Split
Common ratios (adjustable later in settings):

| Goal | Protein | Carbs | Fat |
|------|---------|-------|-----|
| Maintain | 30% | 45% | 25% |
| Gain | 30–35% | 45–50% | 20–25% |
| Lose | 35–40% | 35–45% | 20–25% |

**Convert to grams**:
```
Protein(g) = (Calories × Protein%) / 4
Carbs(g) = (Calories × Carb%) / 4
Fat(g) = (Calories × Fat%) / 9
```

**Example**: Gain goal, 3010 kcal, ratio 30P/50C/20F
```
Protein: 3010 × 0.3 / 4 ≈ 226 g
Carbs: 3010 × 0.5 / 4 ≈ 376 g
Fat: 3010 × 0.2 / 9 ≈ 67 g
```

### 5️⃣ Optional Micro Adjustments
- **Hydration**: 35 ml per kg body weight → 70kg × 35 ≈ 2.45 L/day
- **Workout energy**: Add ~200–400 kcal per workout depending on intensity
- **Quick defaults**: If user skips activity or goal, use "Maintain + lightly active"

## 💻 Implementation Logic

```typescript
function calculateDailyTargets(weight: number, height: number, age: number, gender: string, activityLevel: string, goal: string) {
    // 1. BMR
    const BMR = gender === 'M' 
        ? 10*weight + 6.25*height - 5*age + 5 
        : 10*weight + 6.25*height - 5*age - 161;

    // 2. TDEE
    const activityMultiplier = getActivityMultiplier(activityLevel); // e.g., 1.55
    let TDEE = BMR * activityMultiplier;

    // 3. Adjust for goal
    if (goal === 'gain') TDEE += 400;
    else if (goal === 'lose') TDEE -= 400;

    // 4. Macro split
    const macroRatio = getMacroRatio(goal); // e.g., {P:0.3, C:0.5, F:0.2}
    const proteinG = (TDEE * macroRatio.P) / 4;
    const carbsG = (TDEE * macroRatio.C) / 4;
    const fatG = (TDEE * macroRatio.F) / 9;

    return { 
        calories: Math.round(TDEE), 
        protein: Math.round(proteinG), 
        carbs: Math.round(carbsG), 
        fat: Math.round(fatG) 
    };
}

function getActivityMultiplier(level: string): number {
    const multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'extra': 1.9
    };
    return multipliers[level] || 1.55;
}

function getMacroRatio(goal: string): {P: number, C: number, F: number} {
    const ratios = {
        'maintain': {P: 0.30, C: 0.45, F: 0.25},
        'gain': {P: 0.32, C: 0.48, F: 0.20},
        'lose': {P: 0.37, C: 0.40, F: 0.23}
    };
    return ratios[goal] || ratios['maintain'];
}
```

## ⚙️ Technical Implementation

### Frontend Structure
```
src/
├── screens/
│   └── onboarding/
│       ├── Onboarding1Screen.tsx    # Combined: Profile + Goal + Activity
│       ├── Onboarding2Screen.tsx    # Preferences
│       └── Onboarding3Screen.tsx    # Summary
├── context/
│   └── OnboardingContext.tsx
├── services/
│   └── calculationService.ts
└── types/
    └── onboarding.ts
```

### State Management
- Create `OnboardingContext` to manage multi-step state
- Each step → child screen in horizontal scroll view or stack
- Store data progressively in local state; only hit API at the end
- Use progress indicator (dots or bar) to keep flow predictable

### Data Flow
1. **Local Storage**: Store each step's data in AsyncStorage immediately
2. **API Sync**: Send complete profile to backend after Step 5
3. **Session Management**: Mark `onboardingComplete = true` to skip next launch
4. **Navigation**: Redirect to main app after successful completion

## 🎨 UI/UX Considerations

### Progress Indicator
- Show current step (e.g., "Step 1 of 3")
- Visual progress bar or dots
- Allow back navigation within onboarding

### Input Validation
- Real-time validation for numeric inputs (age, height, weight)
- Range checks (e.g., age 13-120, height 100-250cm, weight 30-300kg)
- Clear error messages for invalid inputs

### Accessibility
- Large touch targets for mobile
- Clear labels and instructions
- Support for screen readers
- High contrast colors

### Performance
- Lazy load screens as needed
- Optimize images and animations
- Smooth transitions between steps
- Fast local storage operations

## 🔄 Future Enhancements

### Advanced Personalization
- Machine learning-based goal recommendations
- Integration with fitness trackers (Apple Health, Google Fit)
- Photo-based body fat estimation
- Meal preference learning

### Social Features
- Share goals with friends
- Community challenges
- Progress celebrations
- Expert consultations

### Analytics
- Track onboarding completion rates
- A/B test different flows
- Measure time to first log
- User satisfaction surveys

