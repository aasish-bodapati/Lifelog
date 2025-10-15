from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.db import get_db
from app.models import User, Workout, NutritionLog, BodyStat
from app.schemas import DailySummary, WeeklySummary
from typing import List
from datetime import datetime, date, timedelta

router = APIRouter()

@router.get("/daily/{target_date}", response_model=DailySummary)
def get_daily_summary(target_date: date, user_id: int, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get nutrition totals for the day
    nutrition_logs = db.query(NutritionLog).filter(
        NutritionLog.user_id == user_id,
        NutritionLog.date == target_date
    ).all()
    
    total_calories = sum(log.total_calories for log in nutrition_logs)
    total_protein = sum(log.total_protein for log in nutrition_logs)
    total_carbs = sum(log.total_carbs for log in nutrition_logs)
    total_fat = sum(log.total_fat for log in nutrition_logs)
    
    # Get workout data for the day
    workouts = db.query(Workout).filter(
        Workout.user_id == user_id,
        Workout.date == target_date
    ).all()
    
    workout_count = len(workouts)
    total_workout_duration = sum(w.duration_minutes or 0 for w in workouts)
    
    # Get weight for the day (most recent entry on or before target_date)
    weight_entry = db.query(BodyStat).filter(
        BodyStat.user_id == user_id,
        BodyStat.date <= target_date,
        BodyStat.weight.isnot(None)
    ).order_by(BodyStat.date.desc()).first()
    
    weight = weight_entry.weight if weight_entry else None
    
    return DailySummary(
        date=target_date,
        total_calories=total_calories,
        total_protein=total_protein,
        total_carbs=total_carbs,
        total_fat=total_fat,
        workout_count=workout_count,
        total_workout_duration=total_workout_duration,
        weight=weight
    )

@router.get("/weekly/{week_start}", response_model=WeeklySummary)
def get_weekly_summary(week_start: date, user_id: int, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    week_end = week_start + timedelta(days=6)
    
    # Get nutrition data for the week
    nutrition_logs = db.query(NutritionLog).filter(
        NutritionLog.user_id == user_id,
        NutritionLog.date >= week_start,
        NutritionLog.date <= week_end
    ).all()
    
    # Calculate daily averages
    days_in_week = 7
    total_calories = sum(log.total_calories for log in nutrition_logs)
    total_protein = sum(log.total_protein for log in nutrition_logs)
    
    avg_daily_calories = total_calories / days_in_week
    avg_daily_protein = total_protein / days_in_week
    
    # Get workout data for the week
    workouts = db.query(Workout).filter(
        Workout.user_id == user_id,
        Workout.date >= week_start,
        Workout.date <= week_end
    ).all()
    
    total_workouts = len(workouts)
    total_workout_duration = sum(w.duration_minutes or 0 for w in workouts)
    
    # Get weight change for the week
    start_weight = db.query(BodyStat).filter(
        BodyStat.user_id == user_id,
        BodyStat.date <= week_start,
        BodyStat.weight.isnot(None)
    ).order_by(BodyStat.date.desc()).first()
    
    end_weight = db.query(BodyStat).filter(
        BodyStat.user_id == user_id,
        BodyStat.date <= week_end,
        BodyStat.weight.isnot(None)
    ).order_by(BodyStat.date.desc()).first()
    
    weight_change = None
    if start_weight and end_weight:
        weight_change = end_weight.weight - start_weight.weight
    
    return WeeklySummary(
        week_start=week_start,
        week_end=week_end,
        avg_daily_calories=avg_daily_calories,
        avg_daily_protein=avg_daily_protein,
        total_workouts=total_workouts,
        total_workout_duration=total_workout_duration,
        weight_change=weight_change
    )

@router.get("/recent/{days}")
def get_recent_summary(days: int, user_id: int, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days-1)
    
    # Get daily summaries for the period
    daily_summaries = []
    current_date = start_date
    
    while current_date <= end_date:
        daily_summary = get_daily_summary(current_date, user_id, db)
        daily_summaries.append(daily_summary)
        current_date += timedelta(days=1)
    
    # Calculate period totals
    total_calories = sum(day.total_calories for day in daily_summaries)
    total_protein = sum(day.total_protein for day in daily_summaries)
    total_workouts = sum(day.workout_count for day in daily_summaries)
    total_workout_duration = sum(day.total_workout_duration for day in daily_summaries)
    
    # Get weight trend
    weight_entries = db.query(BodyStat).filter(
        BodyStat.user_id == user_id,
        BodyStat.date >= start_date,
        BodyStat.date <= end_date,
        BodyStat.weight.isnot(None)
    ).order_by(BodyStat.date.asc()).all()
    
    weight_trend = [
        {"date": entry.date, "weight": entry.weight}
        for entry in weight_entries
    ]
    
    return {
        "period_days": days,
        "start_date": start_date,
        "end_date": end_date,
        "daily_summaries": daily_summaries,
        "totals": {
            "calories": total_calories,
            "protein": total_protein,
            "workouts": total_workouts,
            "workout_duration_minutes": total_workout_duration
        },
        "averages": {
            "daily_calories": total_calories / days,
            "daily_protein": total_protein / days,
            "workouts_per_week": (total_workouts / days) * 7
        },
        "weight_trend": weight_trend
    }
