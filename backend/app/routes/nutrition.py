from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import NutritionLog as NutritionLogModel, User as UserModel
from app.schemas import NutritionLogCreate, NutritionLog as NutritionLogSchema, NutritionLogUpdate
from typing import List
from datetime import datetime, date

router = APIRouter()

@router.post("/", response_model=NutritionLogSchema)
def create_nutrition_log(nutrition_log: NutritionLogCreate, user_id: int, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate totals
    total_calories = nutrition_log.calories * nutrition_log.quantity
    total_protein = nutrition_log.protein * nutrition_log.quantity
    total_carbs = nutrition_log.carbs * nutrition_log.quantity
    total_fat = nutrition_log.fat * nutrition_log.quantity
    
    # Create nutrition log
    db_nutrition_log = NutritionLogModel(
        user_id=user_id,
        date=nutrition_log.date,
        meal_type=nutrition_log.meal_type,
        food_name=nutrition_log.food_name,
        quantity=nutrition_log.quantity,
        unit=nutrition_log.unit,
        calories=nutrition_log.calories,
        protein=nutrition_log.protein,
        carbs=nutrition_log.carbs,
        fat=nutrition_log.fat,
        fiber=nutrition_log.fiber,
        sugar=nutrition_log.sugar,
        sodium=nutrition_log.sodium,
        total_calories=total_calories,
        total_protein=total_protein,
        total_carbs=total_carbs,
        total_fat=total_fat,
        notes=nutrition_log.notes
    )
    
    db.add(db_nutrition_log)
    db.commit()
    db.refresh(db_nutrition_log)
    
    return db_nutrition_log

@router.get("/", response_model=List[NutritionLogSchema])
def get_nutrition_logs(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    start_date: date = None,
    end_date: date = None,
    meal_type: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(NutritionLogModel).filter(NutritionLogModel.user_id == user_id)
    
    if start_date:
        query = query.filter(NutritionLogModel.date >= start_date)
    if end_date:
        query = query.filter(NutritionLogModel.date <= end_date)
    if meal_type:
        query = query.filter(NutritionLogModel.meal_type == meal_type)
    
    logs = query.offset(skip).limit(limit).all()
    return logs

@router.get("/daily/{target_date}", response_model=List[NutritionLogSchema])
def get_daily_nutrition(target_date: date, user_id: int, db: Session = Depends(get_db)):
    logs = db.query(NutritionLogModel).filter(
        NutritionLogModel.user_id == user_id,
        NutritionLogModel.date == target_date
    ).all()
    
    return logs

@router.get("/{log_id}", response_model=NutritionLogSchema)
def get_nutrition_log(log_id: int, user_id: int, db: Session = Depends(get_db)):
    log = db.query(NutritionLogModel).filter(
        NutritionLogModel.id == log_id,
        NutritionLogModel.user_id == user_id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    
    return log

@router.put("/{log_id}", response_model=NutritionLogSchema)
def update_nutrition_log(
    log_id: int,
    log_update: NutritionLogUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    log = db.query(NutritionLogModel).filter(
        NutritionLogModel.id == log_id,
        NutritionLogModel.user_id == user_id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    
    # Update only provided fields
    update_data = log_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)
    
    # Recalculate totals if quantity changed
    if 'quantity' in update_data:
        log.total_calories = log.calories * log.quantity
        log.total_protein = log.protein * log.quantity
        log.total_carbs = log.carbs * log.quantity
        log.total_fat = log.fat * log.quantity
    
    db.commit()
    db.refresh(log)
    
    return log

@router.delete("/{log_id}")
def delete_nutrition_log(log_id: int, user_id: int, db: Session = Depends(get_db)):
    log = db.query(NutritionLogModel).filter(
        NutritionLogModel.id == log_id,
        NutritionLogModel.user_id == user_id
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    
    db.delete(log)
    db.commit()
    
    return {"message": "Nutrition log deleted successfully"}

@router.get("/summary/daily/{target_date}")
def get_daily_nutrition_summary(target_date: date, user_id: int, db: Session = Depends(get_db)):
    logs = db.query(NutritionLogModel).filter(
        NutritionLogModel.user_id == user_id,
        NutritionLogModel.date == target_date
    ).all()
    
    total_calories = sum(log.total_calories for log in logs)
    total_protein = sum(log.total_protein for log in logs)
    total_carbs = sum(log.total_carbs for log in logs)
    total_fat = sum(log.total_fat for log in logs)
    
    return {
        "date": target_date,
        "total_calories": total_calories,
        "total_protein": total_protein,
        "total_carbs": total_carbs,
        "total_fat": total_fat,
        "entry_count": len(logs)
    }
