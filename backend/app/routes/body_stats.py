from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import BodyStat as BodyStatModel, User as UserModel
from app.schemas import BodyStatCreate, BodyStat as BodyStatSchema, BodyStatUpdate
from typing import List
from datetime import datetime, date

router = APIRouter()

@router.post("/", response_model=BodyStatSchema)
def create_body_stat(body_stat: BodyStatCreate, user_id: int, db: Session = Depends(get_db)):
    # Verify user exists
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create body stat entry
    db_body_stat = BodyStatModel(
        user_id=user_id,
        date=body_stat.date,
        weight=body_stat.weight,
        body_fat_percentage=body_stat.body_fat_percentage,
        muscle_mass=body_stat.muscle_mass,
        bone_density=body_stat.bone_density,
        height=body_stat.height,
        chest=body_stat.chest,
        waist=body_stat.waist,
        hips=body_stat.hips,
        bicep_left=body_stat.bicep_left,
        bicep_right=body_stat.bicep_right,
        thigh_left=body_stat.thigh_left,
        thigh_right=body_stat.thigh_right,
        blood_pressure_systolic=body_stat.blood_pressure_systolic,
        blood_pressure_diastolic=body_stat.blood_pressure_diastolic,
        resting_heart_rate=body_stat.resting_heart_rate,
        notes=body_stat.notes
    )
    
    db.add(db_body_stat)
    db.commit()
    db.refresh(db_body_stat)
    
    return db_body_stat

@router.get("/", response_model=List[BodyStatSchema])
def get_body_stats(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db)
):
    query = db.query(BodyStatModel).filter(BodyStatModel.user_id == user_id)
    
    if start_date:
        query = query.filter(BodyStatModel.date >= start_date)
    if end_date:
        query = query.filter(BodyStatModel.date <= end_date)
    
    stats = query.order_by(BodyStatModel.date.desc()).offset(skip).limit(limit).all()
    return stats

@router.get("/latest", response_model=BodyStatSchema)
def get_latest_body_stat(user_id: int, db: Session = Depends(get_db)):
    stat = db.query(BodyStatModel).filter(
        BodyStatModel.user_id == user_id
    ).order_by(BodyStatModel.date.desc()).first()
    
    if not stat:
        raise HTTPException(status_code=404, detail="No body stats found")
    
    return stat

@router.get("/{stat_id}", response_model=BodyStatSchema)
def get_body_stat(stat_id: int, user_id: int, db: Session = Depends(get_db)):
    stat = db.query(BodyStatModel).filter(
        BodyStatModel.id == stat_id,
        BodyStatModel.user_id == user_id
    ).first()
    
    if not stat:
        raise HTTPException(status_code=404, detail="Body stat not found")
    
    return stat

@router.put("/{stat_id}", response_model=BodyStatSchema)
def update_body_stat(
    stat_id: int,
    stat_update: BodyStatUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):
    stat = db.query(BodyStatModel).filter(
        BodyStatModel.id == stat_id,
        BodyStatModel.user_id == user_id
    ).first()
    
    if not stat:
        raise HTTPException(status_code=404, detail="Body stat not found")
    
    # Update only provided fields
    update_data = stat_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(stat, field, value)
    
    db.commit()
    db.refresh(stat)
    
    return stat

@router.delete("/{stat_id}")
def delete_body_stat(stat_id: int, user_id: int, db: Session = Depends(get_db)):
    stat = db.query(BodyStatModel).filter(
        BodyStatModel.id == stat_id,
        BodyStatModel.user_id == user_id
    ).first()
    
    if not stat:
        raise HTTPException(status_code=404, detail="Body stat not found")
    
    db.delete(stat)
    db.commit()
    
    return {"message": "Body stat deleted successfully"}

@router.get("/weight/history")
def get_weight_history(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    from datetime import timedelta
    
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=days)
    
    stats = db.query(BodyStat).filter(
        BodyStat.user_id == user_id,
        BodyStat.date >= start_date,
        BodyStat.date <= end_date,
        BodyStat.weight.isnot(None)
    ).order_by(BodyStat.date.asc()).all()
    
    weight_data = [
        {
            "date": stat.date,
            "weight": stat.weight
        }
        for stat in stats
    ]
    
    return {
        "period_days": days,
        "start_date": start_date,
        "end_date": end_date,
        "weight_history": weight_data,
        "data_points": len(weight_data)
    }
