# Lifelog Onboarding System

## 🎯 Goal
Help users get to logging ASAP — ideally within 60 seconds. Capture just enough info to personalize recommendations and make them feel clarity + progress, not setup fatigue.

## ✨ Gender-Specific Optimizations
The onboarding system now includes physiologically accurate, gender-specific calculations:

- **BMR**: Gender-specific constants (+5 for men, -161 for women)
- **Calorie Adjustments**: Men ±400kcal, Women ±300kcal (more sustainable)
- **Protein Caps**: Men 1.8-2.2g/kg, Women 1.6-2.0g/kg (realistic limits)
- **Macro Ratios**: Men higher carbs, Women higher fat (hormone support)
- **Hydration**: Men 35ml/kg, Women 31ml/kg (metabolic differences)

This ensures more accurate, sustainable, and personalized targets for each user.

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

### 3️⃣ Goal Adjustments (Gender-Specific)
Gender-specific calorie adjustments for more sustainable results:

| Goal | Male Adjustment | Female Adjustment |
|------|-----------------|-------------------|
| Maintain | TDEE (no change) | TDEE (no change) |
| Gain | TDEE + 400 kcal | TDEE + 300 kcal |
| Lose | TDEE - 400 kcal | TDEE - 300 kcal |

**Example**: Want to gain muscle
- **Male**: 2610 + 400 = 3010 kcal/day
- **Female**: 2354 + 300 = 2654 kcal/day

### 4️⃣ Macronutrient Split (Gender-Specific)
Physiologically accurate ratios based on gender differences:

#### **Male Ratios** (Higher carb utilization)
| Goal | Protein | Carbs | Fat |
|------|---------|-------|-----|
| Maintain | 30% | 45% | 25% |
| Gain | 32% | 48% | 20% |
| Lose | 37% | 40% | 23% |

#### **Female Ratios** (Higher fat for hormones)
| Goal | Protein | Carbs | Fat |
|------|---------|-------|-----|
| Maintain | 30% | 40% | 30% |
| Gain | 32% | 45% | 23% |
| Lose | 37% | 35% | 28% |

**Convert to grams**:
```
Protein(g) = (Calories × Protein%) / 4
Carbs(g) = (Calories × Carb%) / 4
Fat(g) = (Calories × Fat%) / 9
```

**Example**: Male, Gain goal, 3010 kcal
```
Protein: 3010 × 0.32 / 4 ≈ 241 g
Carbs: 3010 × 0.48 / 4 ≈ 361 g
Fat: 3010 × 0.20 / 9 ≈ 67 g
```

**Example**: Female, Gain goal, 2654 kcal
```
Protein: 2654 × 0.32 / 4 ≈ 212 g
Carbs: 2654 × 0.45 / 4 ≈ 299 g
Fat: 2654 × 0.23 / 9 ≈ 68 g
```

### 5️⃣ Protein Caps (Gender-Specific)
Realistic protein limits based on body weight and gender:

| Goal | Male (g/kg) | Female (g/kg) |
|------|-------------|---------------|
| Maintain | 1.8 | 1.6 |
| Gain | 2.2 | 2.0 |
| Lose | 2.0 | 1.8 |

**Example**: 70kg person
- **Male, Gain**: Max 154g protein (70 × 2.2)
- **Female, Gain**: Max 140g protein (70 × 2.0)

### 6️⃣ Hydration (Gender-Specific)
Dynamic water intake based on gender and activity:

| Gender | Base (ml/kg) | Example (70kg) |
|--------|--------------|----------------|
| Male | 35 | 2.45 L/day |
| Female | 31 | 2.17 L/day |

**Activity Bonus**:
- Sedentary: +0ml
- Light: +200ml
- Moderate: +400ml
- Active: +600ml
- Extra: +800ml

### 7️⃣ Optional Micro Adjustments
- **Workout energy**: Add ~200–400 kcal per workout depending on intensity
- **Quick defaults**: If user skips activity or goal, use "Maintain + lightly active"

## 💻 Implementation Logic

```typescript
function calculateDailyTargets(weight: number, height: number, age: number, gender: string, activityLevel: string, goal: string) {
    // 1. BMR (gender-specific)
    const BMR = gender === 'M' 
        ? 10*weight + 6.25*height - 5*age + 5 
        : 10*weight + 6.25*height - 5*age - 161;

    // 2. TDEE
    const activityMultiplier = getActivityMultiplier(activityLevel);
    const TDEE = BMR * activityMultiplier;

    // 3. Gender-specific goal adjustments
    const calorieAdjustment = getCalorieAdjustment(goal, gender);
    const targetCalories = TDEE + calorieAdjustment;

    // 4. Gender-specific macro ratios
    const macroRatio = getMacroRatio(goal, gender);
    const proteinFromCalories = (targetCalories * macroRatio.P) / 4;
    
    // 5. Gender-specific protein caps
    const maxProteinPerKg = getProteinCapPerKg(goal, gender);
    const maxProtein = weight * maxProteinPerKg;
    const protein = Math.min(proteinFromCalories, maxProtein);

    // 6. Split remaining calories between carbs and fat
    const proteinCalories = protein * 4;
    const remainingCalories = targetCalories - proteinCalories;
    const remainingRatio = getRemainingMacroRatio(goal, gender);
    
    const carbs = (remainingCalories * remainingRatio.C) / 4;
    const fat = (remainingCalories * remainingRatio.F) / 9;

    // 7. Gender-specific hydration
    const hydration = calculateHydration(weight, gender, activityLevel);

    return { 
        calories: Math.round(targetCalories), 
        protein: Math.round(protein), 
        carbs: Math.round(carbs), 
        fat: Math.round(fat),
        hydration: Math.round(hydration * 10) / 10
    };
}

function getCalorieAdjustment(goal: string, gender: string): number {
    const adjustments = {
        'maintain': 0,
        'gain': gender === 'M' ? 400 : 300,
        'lose': gender === 'M' ? -400 : -300
    };
    return adjustments[goal] || 0;
}

function getMacroRatio(goal: string, gender: string): {P: number, C: number, F: number} {
    const ratios = {
        'maintain': gender === 'M' 
            ? {P: 0.30, C: 0.45, F: 0.25}
            : {P: 0.30, C: 0.40, F: 0.30},
        'gain': gender === 'M'
            ? {P: 0.32, C: 0.48, F: 0.20}
            : {P: 0.32, C: 0.45, F: 0.23},
        'lose': gender === 'M'
            ? {P: 0.37, C: 0.40, F: 0.23}
            : {P: 0.37, C: 0.35, F: 0.28}
    };
    return ratios[goal] || ratios['maintain'];
}

function getProteinCapPerKg(goal: string, gender: string): number {
    const caps = {
        'maintain': gender === 'M' ? 1.8 : 1.6,
        'gain': gender === 'M' ? 2.2 : 2.0,
        'lose': gender === 'M' ? 2.0 : 1.8
    };
    return caps[goal] || caps['maintain'];
}

function getRemainingMacroRatio(goal: string, gender: string): {C: number, F: number} {
    const ratios = {
        'maintain': gender === 'M'
            ? {C: 0.60, F: 0.40}
            : {C: 0.57, F: 0.43},
        'gain': gender === 'M'
            ? {C: 0.70, F: 0.30}
            : {C: 0.65, F: 0.35},
        'lose': gender === 'M'
            ? {C: 0.50, F: 0.50}
            : {C: 0.45, F: 0.55}
    };
    return ratios[goal] || ratios['maintain'];
}

function calculateHydration(weight: number, gender: string, activityLevel: string): number {
    const basePerKg = gender === 'M' ? 35 : 31;
    const activityBonus = getActivityHydrationBonus(activityLevel);
    return ((weight * basePerKg) + activityBonus) / 1000;
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

