from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # User goals and preferences
    goal = Column(String, default="maintain")  # maintain, lose, gain
    activity_level = Column(String, default="moderate")  # sedentary, light, moderate, active, very_active
    target_weight = Column(Float)
    target_calories = Column(Integer)
    
    # Relationships
    workouts = relationship("Workout", back_populates="user")
    nutrition_logs = relationship("NutritionLog", back_populates="user")
    body_stats = relationship("BodyStat", back_populates="user")

class Workout(Base):
    __tablename__ = "workouts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    name = Column(String, nullable=False)  # e.g., "Push Day", "Cardio"
    duration_minutes = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="workouts")
    exercises = relationship("Exercise", back_populates="workout")

class Exercise(Base):
    __tablename__ = "exercises"
    
    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False)
    name = Column(String, nullable=False)  # e.g., "Bench Press", "Squats"
    sets = Column(Integer, nullable=False)
    reps = Column(Integer)
    weight = Column(Float)  # in kg or lbs
    duration_seconds = Column(Integer)  # for time-based exercises
    distance = Column(Float)  # for cardio
    notes = Column(Text)
    order = Column(Integer, default=0)  # for ordering exercises in workout
    
    # Relationships
    workout = relationship("Workout", back_populates="exercises")

class NutritionLog(Base):
    __tablename__ = "nutrition_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    meal_type = Column(String, nullable=False)  # breakfast, lunch, dinner, snack
    food_name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # g, ml, cup, piece, etc.
    
    # Nutritional values per unit
    calories = Column(Float, nullable=False)
    protein = Column(Float, default=0)
    carbs = Column(Float, default=0)
    fat = Column(Float, default=0)
    fiber = Column(Float, default=0)
    sugar = Column(Float, default=0)
    sodium = Column(Float, default=0)
    
    # Calculated totals for this entry
    total_calories = Column(Float, nullable=False)
    total_protein = Column(Float, default=0)
    total_carbs = Column(Float, default=0)
    total_fat = Column(Float, default=0)
    
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="nutrition_logs")

class BodyStat(Base):
    __tablename__ = "body_stats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    
    # Weight and body composition
    weight = Column(Float)  # in kg
    body_fat_percentage = Column(Float)
    muscle_mass = Column(Float)
    bone_density = Column(Float)
    
    # Measurements (in cm)
    height = Column(Float)
    chest = Column(Float)
    waist = Column(Float)
    hips = Column(Float)
    bicep_left = Column(Float)
    bicep_right = Column(Float)
    thigh_left = Column(Float)
    thigh_right = Column(Float)
    
    # Health metrics
    blood_pressure_systolic = Column(Integer)
    blood_pressure_diastolic = Column(Integer)
    resting_heart_rate = Column(Integer)
    
    # Lifestyle metrics
    water_intake = Column(Float)  # in liters
    sleep_hours = Column(Float)
    
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="body_stats")
