"""
Database configuration for 28Hub Connect backend.
Handles PostgreSQL connection and session management.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from typing import Generator

# Database URL from environment variable with fallback
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:28hub2025@postgres:5432/28hub"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_size=10,        # Number of connections to maintain
    max_overflow=20,     # Additional connections allowed beyond pool_size
    echo=os.getenv("SQL_ECHO", "false").lower() == "true"  # Log SQL queries in debug mode
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that yields a database session.
    Ensures the session is properly closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database tables.
    This creates all tables defined in the models.
    Note: This function should be called from models.py or main.py to avoid circular imports.
    """
    Base.metadata.create_all(bind=engine)
