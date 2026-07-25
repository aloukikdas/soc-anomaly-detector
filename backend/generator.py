"""
backend/generator.py
What this does: Generates baseline enterprise logs and injects specific cyber attack patterns.
Why it exists: Provides the imbalanced, labeled dataset required to train our anomaly detection models.
"""

import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
import random
import os

fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

# --- CONFIGURATION ---
NUM_USERS = 50
NUM_DAYS = 30
START_DATE = datetime(2026, 6, 25)
OUTPUT_DIR = "data"

# Enterprise Resources
RESOURCES = ['VPN_Gateway', 'HR_Portal', 'Finance_DB', 'GitLab', 'AWS_Console', 'Jira']
AUTH_METHODS = ['Password', 'MFA_Token', 'Biometric', 'SSO']

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- 1. GENERATE ENTITIES ---
def generate_entities(num_users):
    """Creates a baseline profile for each user."""
    users = []
    for _ in range(num_users):
        users.append({
            'entity_id': fake.uuid4(),
            'role': np.random.choice(['Employee', 'Admin', 'Contractor'], p=[0.8, 0.1, 0.1]),
            'base_ip': fake.ipv4(),
            'usual_location': fake.city(),
            'primary_device': fake.mac_address(),
            'working_hours': (random.randint(7, 9), random.randint(16, 18))
        })
    return users

# --- 2. GENERATE NORMAL LOGS ---
def generate_normal_logs(users, start_date, days):
    """Generates benign daily activity based on user profiles."""
    logs = []
    current_time = start_date
    end_date = start_date + timedelta(days=days)

    while current_time < end_date:
        for user in users:
            if user['working_hours'][0] <= current_time.hour <= user['working_hours'][1]:
                if random.random() < 0.8: # 80% chance of activity during working hours
                    logs.append({
                        'timestamp': current_time + timedelta(minutes=random.randint(0, 59)),
                        'entity_id': user['entity_id'],
                        'entity_type': user['role'],
                        'source_ip': user['base_ip'] if random.random() < 0.9 else fake.ipv4(),
                        'geo_location': user['usual_location'],
                        'resource_accessed': random.choice(RESOURCES) if user['role'] == 'Admin' else random.choice(['VPN_Gateway', 'HR_Portal', 'Jira']),
                        'auth_method': np.random.choice(AUTH_METHODS, p=[0.1, 0.7, 0.1, 0.1]),
                        'device_fingerprint': user['primary_device'],
                        'session_duration': random.randint(300, 7200),
                        'status': 'SUCCESS',
                        'label': 'normal'
                    })
        current_time += timedelta(hours=1)
    return logs

# --- 3. INJECT ATTACKS ---
def inject_brute_force(users, logs, start_date, num_attacks=10):
    """Simulates rapid failed login attempts from a single IP."""
    attack_logs = []
    for _ in range(num_attacks):
        target = random.choice(users)
        malicious_ip = fake.ipv4()
        attack_time = start_date + timedelta(days=random.randint(0, NUM_DAYS-1), hours=random.randint(0, 23))
        
        # Generate 15-30 failed attempts in a 2-minute window
        for i in range(random.randint(15, 30)):
            attack_logs.append({
                'timestamp': attack_time + timedelta(seconds=i*4),
                'entity_id': target['entity_id'],
                'entity_type': target['role'],
                'source_ip': malicious_ip,
                'geo_location': 'Unknown',
                'resource_accessed': 'VPN_Gateway',
                'auth_method': 'Password',
                'device_fingerprint': fake.mac_address(),
                'session_duration': 0,
                'status': 'FAILURE',
                'label': 'brute_force'
            })
    return logs + attack_logs

def inject_impossible_travel(users, logs, start_date, num_attacks=5):
    """Simulates logins from two distant geographical locations in an impossible timeframe."""
    attack_logs = []
    for _ in range(num_attacks):
        target = random.choice(users)
        attack_time = start_date + timedelta(days=random.randint(0, NUM_DAYS-1), hours=random.randint(8, 15))
        
        # Log 1: Normal location
        attack_logs.append({
            'timestamp': attack_time,
            'entity_id': target['entity_id'],
            'entity_type': target['role'],
            'source_ip': target['base_ip'],
            'geo_location': target['usual_location'],
            'resource_accessed': 'Jira',
            'auth_method': 'SSO',
            'device_fingerprint': target['primary_device'],
            'session_duration': 1200,
            'status': 'SUCCESS',
            'label': 'normal'
        })
        
        # Log 2: Distant location 15 minutes later
        attack_logs.append({
            'timestamp': attack_time + timedelta(minutes=15),
            'entity_id': target['entity_id'],
            'entity_type': target['role'],
            'source_ip': fake.ipv4(),
            'geo_location': 'Moscow, RU', # Clear anomaly
            'resource_accessed': 'VPN_Gateway',
            'auth_method': 'Password',
            'device_fingerprint': fake.mac_address(),
            'session_duration': 300,
            'status': 'SUCCESS',
            'label': 'impossible_travel'
        })
    return logs + attack_logs

def inject_lateral_movement(users, logs, start_date, num_attacks=5):
    """Simulates a standard employee suddenly accessing restricted databases."""
    attack_logs = []
    employees = [u for u in users if u['role'] == 'Employee']
    
    for _ in range(num_attacks):
        target = random.choice(employees)
        attack_time = start_date + timedelta(days=random.randint(0, NUM_DAYS-1), hours=random.randint(1, 4)) # Off-hours
        
        # Sequence of unusual access
        for i, resource in enumerate(['Finance_DB', 'AWS_Console']):
            attack_logs.append({
                'timestamp': attack_time + timedelta(minutes=i*10),
                'entity_id': target['entity_id'],
                'entity_type': target['role'],
                'source_ip': target['base_ip'], # Same IP (insider threat/compromised machine)
                'geo_location': target['usual_location'],
                'resource_accessed': resource,
                'auth_method': 'MFA_Token',
                'device_fingerprint': target['primary_device'],
                'session_duration': 4500,
                'status': 'SUCCESS',
                'label': 'lateral_movement'
            })
    return logs + attack_logs

if __name__ == "__main__":
    print("Initializing Enterprise Entities...")
    users = generate_entities(NUM_USERS)
    
    print(f"Generating normal logs for {NUM_DAYS} days...")
    base_logs = generate_normal_logs(users, START_DATE, NUM_DAYS)
    
    print("Injecting Cyber Attacks...")
    logs_with_bf = inject_brute_force(users, base_logs, START_DATE)
    logs_with_travel = inject_impossible_travel(users, logs_with_bf, START_DATE)
    final_logs = inject_lateral_movement(users, logs_with_travel, START_DATE)
    
    # Convert to DataFrame and sort by time
    df = pd.DataFrame(final_logs)
    df = df.sort_values(by='timestamp').reset_index(drop=True)
    
    # Save to CSV
    output_path = os.path.join(OUTPUT_DIR, "synthetic_logs.csv")
    df.to_csv(output_path, index=False)
    
    print(f"\n--- Generation Complete ---")
    print(f"Total events generated: {len(df)}")
    print(f"Dataset saved to: {output_path}")
    print("\nClass Distribution:")
    print(df['label'].value_counts())