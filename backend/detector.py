import os
import joblib
import pandas as pd
import random
from datetime import datetime

class AnomalyDetector:
    def __init__(self):
        model_dir = os.path.join(os.path.dirname(__file__), 'ml', 'models')
        self.iso_forest = joblib.load(os.path.join(model_dir, 'isolation_forest.joblib'))
        self.classifier = joblib.load(os.path.join(model_dir, 'random_forest.joblib'))
        self.label_encoders = joblib.load(os.path.join(model_dir, 'label_encoders.joblib'))
        self.feature_names = joblib.load(os.path.join(model_dir, 'feature_names.joblib'))
        
    def _engineer_single_event(self, log_data: dict) -> pd.DataFrame:
        df = pd.DataFrame([log_data])
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        for col, le in self.label_encoders.items():
            if col in df.columns:
                try:
                    df[col] = le.transform(df[col].astype(str))
                except ValueError:
                    df[col] = 0
                    
        return df[self.feature_names]

    def _generate_explanation(self, anomaly_type: str, log_data: dict) -> str:
        if anomaly_type == 'brute_force':
            return f"High volume of failed auth attempts from IP {log_data.get('source_ip')}."
        elif anomaly_type == 'lateral_movement':
            return f"Unusual access to restricted resource '{log_data.get('resource_accessed')}' by a standard {log_data.get('entity_type')}."
        elif anomaly_type == 'impossible_travel':
            return f"Geographical velocity anomaly detected. Implausible login from {log_data.get('geo_location')}."
        return "Statistical deviation from baseline behaviour profile."

    def analyze_event(self, log_data: dict) -> dict:
        features = self._engineer_single_event(log_data)
        base_score = self.iso_forest.decision_function(features)[0]
        base_risk = float(100 - ((base_score - (-0.3)) / (0.3 - (-0.3)) * 100))
        base_risk = max(0.0, min(100.0, base_risk))
        is_anomaly = bool(self.iso_forest.predict(features)[0] == -1)
        result = {
            "is_anomaly": is_anomaly,
            "risk_score": round(base_risk, 2),
            "anomaly_type": "normal",
            "explanation": "Normal behavior."
        }
        probabilities = self.classifier.predict_proba(features)[0]
        classes = self.classifier.classes_
        attack_probs = {cls: prob for cls, prob in zip(classes, probabilities) if cls != 'normal'}
        if attack_probs:
            top_attack = max(attack_probs, key=attack_probs.get)
            ai_confidence = float(attack_probs[top_attack])
            if ai_confidence > 0.40:
                result["is_anomaly"] = True
                result["anomaly_type"] = top_attack
                base_exp = self._generate_explanation(top_attack, log_data)
                result["explanation"] = f"{base_exp} (AI Confidence: {int(ai_confidence * 100)}%)"
                calculated_risk = 60 + (ai_confidence * 40)
                feature_jitter = (log_data.get('session_duration', 0) % 100) / 100.0
                result["risk_score"] = round(min(99.9, calculated_risk + feature_jitter), 1)
        return result