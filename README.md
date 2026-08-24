# SkyGuard AI — Intelligent Real-Time Anomaly Detection & Sensor Health for AWS

SkyGuard AI is a production-grade, real-time meteorological anomaly detection, fault classification, explainability, and sensor health monitoring platform for Automatic Weather Stations (AWS).

## Key Capabilities
- **Physics-Informed Quality Control (Tier 1)**: WMO range bounds, rate-of-change, and persistence checks.
- **Multivariate ML & Deep Learning (Tier 2-3)**: Isolation Forest point detector, PyTorch GRU/LSTM Autoencoder temporal detector, Clausius-Clapeyron physical dew-point consistency, and Mahalanobis covariance distance.
- **Fault Taxonomy Classification (Tier 4)**: Differentiates SPIKE, DRIFT, FROZEN, DROPOUT, MULTIVARIATE_INCONSISTENCY, DATA_CORRUPTION, and METEOROLOGICAL_EXTREMES.
- **Sensor Health Index & Explainability (Tier 5)**: Rolling 24h Sensor Health score (0-100) and TreeSHAP/feature attribution explanations.
- **Operational Dashboard**: Real-time telemetry monitoring, alert center, interactive on-the-fly anomaly injector UI, and live WebSocket streaming.

## Getting Started

### 1. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run test suite
pytest tests/ -v

# Start FastAPI backend
uvicorn backend.app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Docker Deployment
```bash
docker-compose up --build
```
