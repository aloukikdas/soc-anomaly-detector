import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import warnings
warnings.filterwarnings('ignore')
DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/synthetic_logs.csv')
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
NUMERIC_FEATURES = ['hour', 'day_of_week', 'session_duration']
CATEGORICAL_FEATURES = ['entity_type', 'resource_accessed', 'auth_method', 'status']

def engineer_features(df):
    df_engineered = df.copy()
    df_engineered['timestamp'] = pd.to_datetime(df_engineered['timestamp'])
    df_engineered['hour'] = df_engineered['timestamp'].dt.hour
    df_engineered['day_of_week'] = df_engineered['timestamp'].dt.dayofweek
    
    return df_engineered

def train_pipeline():
    print("1. Loading dataset...")
    df = pd.read_csv(DATA_PATH)
    
    print("2. Engineering features...")
    df = engineer_features(df)
    
    label_encoders = {}
    for col in CATEGORICAL_FEATURES:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        label_encoders[col] = le

    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y_true = df['label']
    print("3. Training Anomaly Detector (Isolation Forest)...")
    iso_forest = IsolationForest(n_estimators=100, contamination=0.02, random_state=42)
    iso_forest.fit(X)
    scores = iso_forest.decision_function(X)
    risk_scores = 100 - ((scores - scores.min()) / (scores.max() - scores.min()) * 100)
    
    print("4. Training Attack Classifier (Random Forest)...")
    clf = RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
    X_train, X_test, y_train, y_test = train_test_split(X, y_true, test_size=0.2, random_state=42)
    
    clf.fit(X_train, y_train)
    
    print("\n--- Classifier Evaluation ---")
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred))
    
    print("\n5. Saving Models & Artifacts...")
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    joblib.dump(iso_forest, os.path.join(MODEL_DIR, 'isolation_forest.joblib'))
    joblib.dump(clf, os.path.join(MODEL_DIR, 'random_forest.joblib'))
    joblib.dump(label_encoders, os.path.join(MODEL_DIR, 'label_encoders.joblib'))
    joblib.dump(X.columns.tolist(), os.path.join(MODEL_DIR, 'feature_names.joblib'))
    
    print(f"Models saved successfully to {MODEL_DIR}")

if __name__ == "__main__":
    train_pipeline()