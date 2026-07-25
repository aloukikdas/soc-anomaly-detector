from fastapi import FastAPI, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pandas as pd
import json
import asyncio
import os
from database import SessionLocal, engine, Base, Alert
from detector import AnomalyDetector

Base.metadata.create_all(bind=engine)
app = FastAPI(title="SOC Anomaly Detection API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

detector = AnomalyDetector()

class AcknowledgeRequest(BaseModel):
    alert_id: int

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db), limit: int = 50):
    """Fetches the most recent security alerts for the dashboard."""
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).limit(limit).all()
    return alerts

@app.post("/api/alerts/acknowledge")
def acknowledge_alert(req: AcknowledgeRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == req.alert_id).first()
    if alert:
        alert.is_acknowledged = True
        db.commit()
        return {"status": "success", "message": f"Alert {req.alert_id} acknowledged."}
    return {"status": "error", "message": "Alert not found."}

@app.get("/api/simulate")
async def simulate_stream(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    def run_simulation():
        csv_path = os.path.join(os.path.dirname(__file__), 'data', 'synthetic_logs.csv')
        df = pd.read_csv(csv_path)
        demo_stream = df.sample(frac=1, random_state=42).head(100)
        db_session = SessionLocal()
        for _, row in demo_stream.iterrows():
            log_data = row.to_dict()
            analysis = detector.analyze_event(log_data)
            if analysis["is_anomaly"] or analysis["risk_score"] > 80:
                new_alert = Alert(
                    timestamp=pd.to_datetime(log_data["timestamp"]),
                    entity_id=log_data["entity_id"],
                    entity_type=log_data["entity_type"],
                    source_ip=log_data["source_ip"],
                    resource_accessed=log_data["resource_accessed"],
                    risk_score=analysis["risk_score"],
                    anomaly_type=analysis["anomaly_type"],
                    explanation=analysis["explanation"]
                )
                db_session.add(new_alert)
                db_session.commit()
                
        db_session.close()

    background_tasks.add_task(run_simulation)
    return {"message": "Simulation started in the background. Generating alerts..."}