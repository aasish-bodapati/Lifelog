from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import User as UserModel
from app.schemas import UserCreate, User as UserSchema, UserUpdate, UserLogin
from passlib.context import CryptContext
from typing import List

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/register", response_model=UserSchema)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    print(f"Registration attempt for email: {user.email}, username: {user.username}")
    
    # Check if user already exists
    db_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if db_user:
        print(f"Registration failed: Email {user.email} already exists")
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Check if username already exists
    db_user = db.query(UserModel).filter(UserModel.username == user.username).first()
    if db_user:
        print(f"Registration failed: Username {user.username} already taken")
        raise HTTPException(
            status_code=400,
            detail="Username already taken"
        )
    
    # Create new user
    print(f"Creating new user: {user.email}")
    hashed_password = get_password_hash(user.password)
    db_user = UserModel(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=hashed_password,
        goal=user.goal,
        activity_level=user.activity_level,
        target_weight=user.target_weight,
        target_calories=user.target_calories
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    print(f"User created successfully with ID: {db_user.id}")
    return db_user

@router.post("/login")
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    print(f"Login attempt for email: {login_data.email}")
    
    # Find user by email
    user = db.query(UserModel).filter(UserModel.email == login_data.email).first()
    if not user:
        print(f"Login failed: User not found for email {login_data.email}")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.hashed_password):
        print(f"Login failed: Invalid password for email {login_data.email}")
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    
    print(f"Login successful for user: {user.email}")
    # Return user data and a simple token (in production, use JWT)
    return {
        "user": user,
        "token": f"token_{user.id}_{user.email}"  # Simple token for now
    }

@router.get("/me", response_model=UserSchema)
def get_current_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user

@router.put("/me", response_model=UserSchema)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    # Update only provided fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/me")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}
