from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta

from ..db import get_db
from ..models import User, Workout, Exercise, NutritionLog, BodyStat
from ..schemas import DailySummary, WeeklySummary

router = APIRouter()

@router.get("/daily", response_model=DailySummary)
async def get_daily_analytics(
    user_id: int,
    date: str,
    db: Session = Depends(get_db)
):
    """
    Get daily analytics for a specific user and date
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Parse date
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        # Get nutrition totals for the day
        nutrition_totals = db.query(
            func.sum(NutritionLog.calories).label('total_calories'),
            func.sum(NutritionLog.total_protein).label('total_protein'),
            func.sum(NutritionLog.total_carbs).label('total_carbs'),
            func.sum(NutritionLog.total_fat).label('total_fat')
        ).filter(
            NutritionLog.user_id == user_id,
            func.date(NutritionLog.date) == target_date
        ).first()

        # Get workout count and total duration for the day
        workout_stats = db.query(
            func.count(Workout.id).label('workout_count'),
            func.sum(Workout.duration_minutes).label('total_duration')
        ).filter(
            Workout.user_id == user_id,
            func.date(Workout.date) == target_date
        ).first()

        # Get latest weight for the day
        latest_weight = db.query(BodyStat.weight).filter(
            BodyStat.user_id == user_id,
            func.date(BodyStat.date) == target_date,
            BodyStat.weight.isnot(None)
        ).order_by(desc(BodyStat.created_at)).first()

        return DailySummary(
            date=date,
            total_calories=int(nutrition_totals.total_calories or 0),
            total_protein=float(nutrition_totals.total_protein or 0),
            total_carbs=float(nutrition_totals.total_carbs or 0),
            total_fat=float(nutrition_totals.total_fat or 0),
            workout_count=int(workout_stats.workout_count or 0),
            total_workout_duration=int(workout_stats.total_duration or 0),
            weight=float(latest_weight.weight) if latest_weight else None
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get daily analytics: {str(e)}")

@router.get("/weekly", response_model=WeeklySummary)
async def get_weekly_analytics(
    user_id: int,
    start_date: str,
    db: Session = Depends(get_db)
):
    """
    Get weekly analytics for a specific user and week
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Parse start date
        try:
            week_start = datetime.strptime(start_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

        week_end = week_start + timedelta(days=6)

        # Get nutrition averages for the week
        nutrition_avg = db.query(
            func.avg(NutritionLog.calories).label('avg_calories'),
            func.avg(NutritionLog.total_protein).label('avg_protein')
        ).filter(
            NutritionLog.user_id == user_id,
            func.date(NutritionLog.date) >= week_start,
            func.date(NutritionLog.date) <= week_end
        ).first()

        # Get workout stats for the week
        workout_stats = db.query(
            func.count(Workout.id).label('total_workouts'),
            func.sum(Workout.duration_minutes).label('total_duration')
        ).filter(
            Workout.user_id == user_id,
            func.date(Workout.date) >= week_start,
            func.date(Workout.date) <= week_end
        ).first()

        # Get weight change for the week
        start_weight = db.query(BodyStat.weight).filter(
            BodyStat.user_id == user_id,
            func.date(BodyStat.date) == week_start,
            BodyStat.weight.isnot(None)
        ).order_by(desc(BodyStat.created_at)).first()

        end_weight = db.query(BodyStat.weight).filter(
            BodyStat.user_id == user_id,
            func.date(BodyStat.date) == week_end,
            BodyStat.weight.isnot(None)
        ).order_by(desc(BodyStat.created_at)).first()

        weight_change = None
        if start_weight and end_weight:
            weight_change = float(end_weight.weight) - float(start_weight.weight)

        return WeeklySummary(
            week_start=week_start.isoformat(),
            week_end=week_end.isoformat(),
            avg_daily_calories=float(nutrition_avg.avg_calories or 0),
            avg_daily_protein=float(nutrition_avg.avg_protein or 0),
            total_workouts=int(workout_stats.total_workouts or 0),
            total_workout_duration=int(workout_stats.total_duration or 0),
            weight_change=weight_change
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get weekly analytics: {str(e)}")

@router.get("/streak")
async def get_consistency_streak(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get user's current consistency streak
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Calculate streak by checking consecutive days with any logged data
        today = datetime.now().date()
        streak = 0
        
        for i in range(30):  # Check last 30 days
            check_date = today - timedelta(days=i)
            date_str = check_date.isoformat()
            
            # Check if user has any data for this date
            has_nutrition = db.query(NutritionLog).filter(
                NutritionLog.user_id == user_id,
                func.date(NutritionLog.date) == check_date
            ).first()
            
            has_workout = db.query(Workout).filter(
                Workout.user_id == user_id,
                func.date(Workout.date) == check_date
            ).first()
            
            has_body_stat = db.query(BodyStat).filter(
                BodyStat.user_id == user_id,
                func.date(BodyStat.date) == check_date
            ).first()
            
            if has_nutrition or has_workout or has_body_stat:
                streak += 1
            else:
                break

        return {
            "user_id": user_id,
            "current_streak": streak,
            "last_updated": today.isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get streak: {str(e)}")

@router.get("/progress")
async def get_progress_metrics(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    Get progress metrics for the last N days
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days-1)

        # Get daily summaries for the period
        daily_summaries = []
        for i in range(days):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.isoformat()
            
            # Get daily data
            daily_data = await get_daily_analytics(user_id, date_str, db)
            daily_summaries.append(daily_data)

        # Calculate trends
        calories_trend = []
        weight_trend = []
        
        for summary in daily_summaries:
            calories_trend.append(summary.total_calories)
            if summary.weight:
                weight_trend.append(summary.weight)

        return {
            "user_id": user_id,
            "period_days": days,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily_summaries": daily_summaries,
            "calories_trend": calories_trend,
            "weight_trend": weight_trend,
            "avg_daily_calories": sum(calories_trend) / len(calories_trend) if calories_trend else 0,
            "weight_change": weight_trend[-1] - weight_trend[0] if len(weight_trend) > 1 else 0
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress metrics: {str(e)}")

