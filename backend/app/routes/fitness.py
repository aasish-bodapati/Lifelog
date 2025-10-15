from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Workout as WorkoutModel, Exercise as ExerciseModel, User as UserModel
from app.schemas import WorkoutCreate, Workout as WorkoutSchema, WorkoutUpdate, ExerciseCreate, Exercise as ExerciseSchema
from typing import List
from datetime import datetime, date

router = APIRouter()

@router.post("/", response_model=WorkoutSchema)
def create_fitness_session(workout: WorkoutCreate, user_id: int, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create fitness session
    db_workout = WorkoutModel(
        user_id=user_id,
        date=workout.date,
        name=workout.name,
        duration_minutes=workout.duration_minutes,
        notes=workout.notes
    )
    
    db.add(db_workout)
    db.commit()
    db.refresh(db_workout)
    
    # Create exercises
    for exercise_data in workout.exercises:
        db_exercise = ExerciseModel(
            workout_id=db_workout.id,
            name=exercise_data.name,
            sets=exercise_data.sets,
            reps=exercise_data.reps,
            weight=exercise_data.weight,
            duration_seconds=exercise_data.duration_seconds,
            distance=exercise_data.distance,
            notes=exercise_data.notes,
            order=exercise_data.order
        )
        db.add(db_exercise)
    
    db.commit()
    db.refresh(db_workout)
    
    return db_workout

@router.get("/", response_model=List[WorkoutSchema])
def get_fitness_sessions(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    query = db.query(WorkoutModel).filter(WorkoutModel.user_id == user_id)
    
    if start_date:
        query = query.filter(WorkoutModel.date >= start_date)
    if end_date:
        query = query.filter(WorkoutModel.date <= end_date)
    
    fitness_sessions = query.offset(skip).limit(limit).all()
    return fitness_sessions

@router.get("/{fitness_id}", response_model=WorkoutSchema)
def get_fitness_session(fitness_id: int, user_id: int, db: Session = Depends(get_db)):
    fitness_session = db.query(WorkoutModel).filter(
        WorkoutModel.id == fitness_id,
        WorkoutModel.user_id == user_id
    ).first()
    
    if not fitness_session:
        raise HTTPException(status_code=404, detail="Fitness session not found")
    
    return fitness_session

@router.put("/{fitness_id}", response_model=WorkoutSchema)
def update_fitness_session(
    fitness_id: int,
    fitness_update: WorkoutUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    fitness_session = db.query(WorkoutModel).filter(
        WorkoutModel.id == fitness_id,
        WorkoutModel.user_id == user_id
    ).first()
    
    if not fitness_session:
        raise HTTPException(status_code=404, detail="Fitness session not found")
    
    # Update only provided fields
    update_data = fitness_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(fitness_session, field, value)
    
    db.commit()
    db.refresh(fitness_session)
    
    return fitness_session

@router.delete("/{fitness_id}")
def delete_fitness_session(fitness_id: int, user_id: int, db: Session = Depends(get_db)):
    fitness_session = db.query(WorkoutModel).filter(
        WorkoutModel.id == fitness_id,
        WorkoutModel.user_id == user_id
    ).first()
    
    if not fitness_session:
        raise HTTPException(status_code=404, detail="Fitness session not found")
    
    db.delete(fitness_session)
    db.commit()
    
    return {"message": "Fitness session deleted successfully"}

@router.get("/recent/{limit}", response_model=List[WorkoutSchema])
def get_recent_fitness_sessions(user_id: int, limit: int = 5, db: Session = Depends(get_db)):
    fitness_sessions = db.query(WorkoutModel).filter(
        WorkoutModel.user_id == user_id
    ).order_by(WorkoutModel.date.desc()).limit(limit).all()
    
    return fitness_sessions
