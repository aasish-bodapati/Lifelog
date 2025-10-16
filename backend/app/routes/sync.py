from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime

from ..db import get_db
from ..models import User, Workout, Exercise, NutritionLog, BodyStat
from ..schemas import SyncRequest, SyncResponse, SyncStatusResponse

router = APIRouter()

@router.post("/sync", response_model=SyncResponse)
async def sync_data(
    sync_request: SyncRequest,
    db: Session = Depends(get_db)
):
    """
    Sync data from client to server
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == sync_request.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        synced_items = []
        failed_items = []

        # Process each table's data
        for table_name, items in sync_request.data.items():
            for item in items:
                try:
                    if table_name == "workouts":
                        await _sync_workout(db, item)
                    elif table_name == "nutrition":
                        await _sync_nutrition(db, item)
                    elif table_name == "body_stats":
                        await _sync_body_stat(db, item)
                    
                    synced_items.append({
                        "table": table_name,
                        "record_id": item.get("local_id"),
                        "operation": item.get("operation", "INSERT")
                    })
                except Exception as e:
                    failed_items.append({
                        "table": table_name,
                        "record_id": item.get("local_id"),
                        "error": str(e)
                    })

        return SyncResponse(
            success=True,
            synced_count=len(synced_items),
            failed_count=len(failed_items),
            synced_items=synced_items,
            failed_items=failed_items,
            sync_timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@router.get("/sync/status", response_model=SyncStatusResponse)
async def get_sync_status(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get sync status for a user
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get counts for each table
        workout_count = db.query(Workout).filter(Workout.user_id == user_id).count()
        nutrition_count = db.query(NutritionLog).filter(NutritionLog.user_id == user_id).count()
        body_stat_count = db.query(BodyStat).filter(BodyStat.user_id == user_id).count()

        # Get last sync time (most recent updated_at from any table)
        last_workout = db.query(Workout).filter(Workout.user_id == user_id).order_by(Workout.updated_at.desc()).first()
        last_nutrition = db.query(NutritionLog).filter(NutritionLog.user_id == user_id).order_by(NutritionLog.updated_at.desc()).first()
        last_body_stat = db.query(BodyStat).filter(BodyStat.user_id == user_id).order_by(BodyStat.updated_at.desc()).first()

        last_sync_times = []
        if last_workout:
            last_sync_times.append(last_workout.updated_at)
        if last_nutrition:
            last_sync_times.append(last_nutrition.updated_at)
        if last_body_stat:
            last_sync_times.append(last_body_stat.updated_at)

        last_sync = max(last_sync_times) if last_sync_times else None

        return SyncStatusResponse(
            user_id=user_id,
            total_records=workout_count + nutrition_count + body_stat_count,
            workout_count=workout_count,
            nutrition_count=nutrition_count,
            body_stat_count=body_stat_count,
            last_sync_time=last_sync.isoformat() if last_sync else None,
            sync_healthy=True
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sync status: {str(e)}")

async def _sync_workout(db: Session, workout_data: Dict[str, Any]):
    """Sync workout data"""
    local_id = workout_data.get("local_id")
    operation = workout_data.get("operation", "INSERT")

    if operation == "INSERT":
        # Create new workout
        workout = Workout(
            user_id=workout_data["user_id"],
            name=workout_data["name"],
            date=workout_data["date"],
            duration_minutes=workout_data.get("duration_minutes"),
            notes=workout_data.get("notes")
        )
        db.add(workout)
        db.flush()  # Get the ID

        # Add exercises if they exist
        if "exercises" in workout_data:
            for exercise_data in workout_data["exercises"]:
                exercise = Exercise(
                    workout_id=workout.id,
                    name=exercise_data["name"],
                    sets=exercise_data["sets"],
                    reps=exercise_data["reps"],
                    weight_kg=exercise_data.get("weight_kg"),
                    duration_seconds=exercise_data.get("duration_seconds"),
                    distance_km=exercise_data.get("distance_km")
                )
                db.add(exercise)

    elif operation == "UPDATE":
        # Update existing workout
        workout = db.query(Workout).filter(Workout.id == local_id).first()
        if workout:
            workout.name = workout_data.get("name", workout.name)
            workout.date = workout_data.get("date", workout.date)
            workout.duration_minutes = workout_data.get("duration_minutes", workout.duration_minutes)
            workout.notes = workout_data.get("notes", workout.notes)
            workout.updated_at = datetime.utcnow()

    elif operation == "DELETE":
        # Delete workout
        workout = db.query(Workout).filter(Workout.id == local_id).first()
        if workout:
            db.delete(workout)

    db.commit()

async def _sync_nutrition(db: Session, nutrition_data: Dict[str, Any]):
    """Sync nutrition data"""
    local_id = nutrition_data.get("local_id")
    operation = nutrition_data.get("operation", "INSERT")

    if operation == "INSERT":
        nutrition = NutritionLog(
            user_id=nutrition_data["user_id"],
            meal_type=nutrition_data["meal_type"],
            food_name=nutrition_data["food_name"],
            calories=nutrition_data["calories"],
            protein_g=nutrition_data["protein_g"],
            carbs_g=nutrition_data["carbs_g"],
            fat_g=nutrition_data["fat_g"],
            fiber_g=nutrition_data.get("fiber_g"),
            sugar_g=nutrition_data.get("sugar_g"),
            sodium_mg=nutrition_data.get("sodium_mg"),
            date=nutrition_data["date"]
        )
        db.add(nutrition)

    elif operation == "UPDATE":
        nutrition = db.query(NutritionLog).filter(NutritionLog.id == local_id).first()
        if nutrition:
            nutrition.meal_type = nutrition_data.get("meal_type", nutrition.meal_type)
            nutrition.food_name = nutrition_data.get("food_name", nutrition.food_name)
            nutrition.calories = nutrition_data.get("calories", nutrition.calories)
            nutrition.protein_g = nutrition_data.get("protein_g", nutrition.protein_g)
            nutrition.carbs_g = nutrition_data.get("carbs_g", nutrition.carbs_g)
            nutrition.fat_g = nutrition_data.get("fat_g", nutrition.fat_g)
            nutrition.fiber_g = nutrition_data.get("fiber_g", nutrition.fiber_g)
            nutrition.sugar_g = nutrition_data.get("sugar_g", nutrition.sugar_g)
            nutrition.sodium_mg = nutrition_data.get("sodium_mg", nutrition.sodium_mg)
            nutrition.date = nutrition_data.get("date", nutrition.date)
            nutrition.updated_at = datetime.utcnow()

    elif operation == "DELETE":
        nutrition = db.query(NutritionLog).filter(NutritionLog.id == local_id).first()
        if nutrition:
            db.delete(nutrition)

    db.commit()

async def _sync_body_stat(db: Session, body_stat_data: Dict[str, Any]):
    """Sync body stat data"""
    local_id = body_stat_data.get("local_id")
    operation = body_stat_data.get("operation", "INSERT")

    if operation == "INSERT":
        body_stat = BodyStat(
            user_id=body_stat_data["user_id"],
            weight_kg=body_stat_data.get("weight_kg"),
            body_fat_percentage=body_stat_data.get("body_fat_percentage"),
            muscle_mass_kg=body_stat_data.get("muscle_mass_kg"),
            waist_cm=body_stat_data.get("waist_cm"),
            chest_cm=body_stat_data.get("chest_cm"),
            arm_cm=body_stat_data.get("arm_cm"),
            thigh_cm=body_stat_data.get("thigh_cm"),
            date=body_stat_data["date"]
        )
        db.add(body_stat)

    elif operation == "UPDATE":
        body_stat = db.query(BodyStat).filter(BodyStat.id == local_id).first()
        if body_stat:
            body_stat.weight_kg = body_stat_data.get("weight_kg", body_stat.weight_kg)
            body_stat.body_fat_percentage = body_stat_data.get("body_fat_percentage", body_stat.body_fat_percentage)
            body_stat.muscle_mass_kg = body_stat_data.get("muscle_mass_kg", body_stat.muscle_mass_kg)
            body_stat.waist_cm = body_stat_data.get("waist_cm", body_stat.waist_cm)
            body_stat.chest_cm = body_stat_data.get("chest_cm", body_stat.chest_cm)
            body_stat.arm_cm = body_stat_data.get("arm_cm", body_stat.arm_cm)
            body_stat.thigh_cm = body_stat_data.get("thigh_cm", body_stat.thigh_cm)
            body_stat.date = body_stat_data.get("date", body_stat.date)
            body_stat.updated_at = datetime.utcnow()

    elif operation == "DELETE":
        body_stat = db.query(BodyStat).filter(BodyStat.id == local_id).first()
        if body_stat:
            db.delete(body_stat)

    db.commit()

