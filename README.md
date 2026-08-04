# SOC Sentinel: Dual-Model Behavioral Anomaly Engine

## Overview
SOC Sentinel is an edge-deployable, real-time anomaly detection engine. It bypasses traditional signature-based security by utilizing a two-stage machine learning ensemble to establish behavioral baselines and classify specific threat vectors in access-log telemetry.

## Key Features
* **Dual-Model ML Pipeline:** Uses an Isolation Forest for unsupervised baseline outlier detection, and a Random Forest Classifier for supervised threat categorization.
* **Explainable AI:** Translates mathematical model confidence (`predict_proba`) into an actionable 0-100 Risk Score, appending human-readable context to every alert.
* **Cold-Start Resilient:** Evaluates new entities against global enterprise baselines rather than requiring historical data for every new user or device.
* **Tactical SOC Dashboard:** A React.js interface featuring a live threat queue, dynamic Risk Volatility charting, and CSV export functionality.

## Project Structure
* `/backend`: FastAPI server, Scikit-Learn ML models, and Pandas synthetic data generator.
* `/frontend`: React.js, TailwindCSS, and Recharts frontend UI.

## Prerequisites
* Python 3.10+
* Node.js 18+

## 📚 Detailed Documentation
**IMPORTANT:** For a deep dive into the model evaluation metrics, handling of extreme class imbalances, concept drift, and the mathematical architecture, please read the `SOC_Sentinel_Technical_Report.pdf`.

---

## Installation & Quickstart

### 1. Backend & Machine Learning Pipeline
* Open a terminal and navigate to the backend directory:
  ```bash
  cd backend
  ```
* Install the required Python dependencies:
  ```bash
  pip install -r requirements.txt
  ```
* Generate the synthetic access logs (simulates 75,000+ events with injected attack taxonomies):
  ```bash
  python data/generator.py
  ```
* Train the Isolation Forest (Baseline) and Random Forest (Classifier) models:
  ```bash
  python ml/train.py
  ```
* Start the FastAPI backend server:
  ```bash
  uvicorn main:app --reload
  ```

*The backend API will now be running at `http://127.0.0.1:8000`*

### 2. Frontend SOC Dashboard
* Open a second, separate terminal and navigate to the frontend directory:
  ```bash
  cd frontend
  ```
* Install the Node modules:
  ```bash
  npm install
  ```
* Start the Vite development server:
  ```bash
  npm run dev
  ```

*The React dashboard will now be running at `http://localhost:5173`*

## Live Simulation
Once both servers are running, open your browser to the frontend URL. Click the **"Simulate Live Traffic"** button in the top right corner of the dashboard to trigger the FastAPI endpoint, evaluate the generated logs against the trained ML ensemble, and watch the Threat Detection Queue populate with scored, explainable anomalies.

---

## 👨‍💻 Author

**Aloukik Das**
* **GitHub:** [https://github.com/aloukikdas](https://github.com/aloukikdas)
* **LinkedIn:** [https://www.linkedin.com/in/aloukik-das-0a8685304](https://www.linkedin.com/in/aloukik-das-0a8685304)
* **Project Link:** [https://github.com/aloukikdas/soc-anomaly-detetor](https://github.com/aloukikdas/soc-anomaly-detector)

## 🏆 Acknowledgement
Developed for the **Honeywell Technologies Campus Connect 2026**. 

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
