from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./soc_alerts.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    entity_id = Column(String, index=True)
    entity_type = Column(String)
    source_ip = Column(String)
    resource_accessed = Column(String)
    risk_score = Column(Float)
    anomaly_type = Column(String)
    explanation = Column(String)
    is_acknowledged = Column(Boolean, default=False)