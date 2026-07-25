import pandas as pd
import numpy as np
from faker import Faker
from datetime import datetime, timedelta
import random

fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

NUM_USERS = 50
NUM_DAYS = 30
START_DATE = datetime(2026, 6, 25)

RESOURCES = ['VPN_Gateway', 'HR_Portal', 'Finance_DB', 'GitLab', 'AWS_Console', 'Jira']
AUTH_METHODS = ['Password', 'MFA_Token', 'Biometric', 'SSO']

def generate_entities(num_users):
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

def generate_normal_logs(users, start_date, days):
    logs = []
    current_time = start_date
    end_date = start_date + timedelta(days=days)

    while current_time < end_date:
        for user in users:
            if user['working_hours'][0] <= current_time.hour <= user['working_hours'][1]:
                if random.random() < 0.8:
                    logs.append({
                        'timestamp': current_time + timedelta(minutes=random.randint(0, 59)),
                        'entity_id': user['entity_id'],
                        'entity_type': user['role'],
                        'source_ip': user['base_ip'] if random.random() < 0.9 else fake.ipv4(),
                        'geo_location': user['usual_location'],
                        'resource_accessed': random.choice(RESOURCES),
                        'auth_method': np.random.choice(AUTH_METHODS, p=[0.1, 0.7, 0.1, 0.1]),
                        'device_fingerprint': user['primary_device'],
                        'session_duration': random.randint(300, 7200),
                        'label': 'normal'
                    })
        current_time += timedelta(hours=1)
    
    return pd.DataFrame(logs)

if __name__ == "__main__":
    print("Initializing Enterprise Entities...")
    users = generate_entities(NUM_USERS)
    
    print(f"Generating normal logs for {NUM_DAYS} days...")
    df_normal = generate_normal_logs(users, START_DATE, NUM_DAYS)
    
    print(f"Generated {len(df_normal)} normal events.")