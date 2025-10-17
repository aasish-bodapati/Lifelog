from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    goal: str = "maintain"
    activity_level: str = "moderate"
    target_weight: Optional[float] = None
    target_calories: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    goal: Optional[str] = None
    activity_level: Optional[str] = None
    target_weight: Optional[float] = None
    target_calories: Optional[int] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Workout schemas
class ExerciseBase(BaseModel):
    name: str
    sets: int
    reps: Optional[int] = None
    weight: Optional[float] = None
    duration_seconds: Optional[int] = None
    distance: Optional[float] = None
    notes: Optional[str] = None
    order: int = 0

class ExerciseCreate(ExerciseBase):
    pass

class Exercise(ExerciseBase):
    id: int
    workout_id: int
    
    class Config:
        from_attributes = True

class WorkoutBase(BaseModel):
    date: datetime
    name: str
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class WorkoutCreate(WorkoutBase):
    exercises: List[ExerciseCreate] = []

class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class Workout(WorkoutBase):
    id: int
    user_id: int
    created_at: datetime
    exercises: List[Exercise] = []
    
    class Config:
        from_attributes = True

# Nutrition schemas
class NutritionLogBase(BaseModel):
    date: datetime
    meal_type: str
    food_name: str
    quantity: float
    unit: str
    calories: float
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0
    sugar: float = 0
    sodium: float = 0
    notes: Optional[str] = None

class NutritionLogCreate(NutritionLogBase):
    pass

class NutritionLogUpdate(BaseModel):
    quantity: Optional[float] = None
    notes: Optional[str] = None

class NutritionLog(NutritionLogBase):
    id: int
    user_id: int
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    created_at: datetime
    
    class Config:
        from_attributes = True

# Body stats schemas
class BodyStatBase(BaseModel):
    date: datetime
    weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    bone_density: Optional[float] = None
    height: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hips: Optional[float] = None
    bicep_left: Optional[float] = None
    bicep_right: Optional[float] = None
    thigh_left: Optional[float] = None
    thigh_right: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    resting_heart_rate: Optional[int] = None
    water_intake: Optional[float] = None
    sleep_hours: Optional[float] = None
    notes: Optional[str] = None

class BodyStatCreate(BodyStatBase):
    pass

class BodyStatUpdate(BaseModel):
    weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    water_intake: Optional[float] = None
    sleep_hours: Optional[float] = None
    notes: Optional[str] = None

class BodyStat(BodyStatBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Summary schemas
class DailySummary(BaseModel):
    date: str
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    workout_count: int
    total_workout_duration: int  # minutes
    weight: Optional[float] = None

class WeeklySummary(BaseModel):
    week_start: str
    week_end: str
    avg_daily_calories: float
    avg_daily_protein: float
    total_workouts: int
    total_workout_duration: int  # minutes
    weight_change: Optional[float] = None

# Sync schemas
class SyncRequest(BaseModel):
    user_id: int
    data: Dict[str, List[Dict[str, Any]]]

class SyncItem(BaseModel):
    table: str
    record_id: str
    operation: str

class FailedItem(BaseModel):
    table: str
    record_id: str
    error: str

class SyncResponse(BaseModel):
    success: bool
    synced_count: int
    failed_count: int
    synced_items: List[SyncItem]
    failed_items: List[FailedItem]
    sync_timestamp: str

class SyncStatusResponse(BaseModel):
    user_id: int
    total_records: int
    workout_count: int
    nutrition_count: int
    body_stat_count: int
    last_sync_time: Optional[str] = None
    sync_healthy: bool
