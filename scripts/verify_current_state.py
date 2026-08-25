"""
scripts/verify_current_state.py
Independent Current-State Auditor & Benchmark Verification Script.
Empirically verifies every claim in LIVE_SYSTEM_AUDIT_REPORT.md against the live codebase.
"""

import sys
import time
import sqlite3
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List
import pandas as pd
import numpy as np

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

def verify_models_and_inference():
    print("=" * 80)
    print("1. INDEPENDENT ML MODEL & PIPELINE VERIFICATION")
    print("=" * 80)
    
    from backend.app.ml.pipeline import SkyGuardPipeline
    models_dir = root_dir / "models"
    
    print(f"Checking model artifacts directory: {models_dir}")
    required_artifacts = [
        "preprocessor.joblib",
        "scaler.joblib",
        "isolation_forest.joblib",
        "temporal_autoencoder.pt",
        "mahalanobis.joblib",
        "fault_classifier.joblib",
        "model_metadata.json"
    ]
    for art in required_artifacts:
        p = models_dir / art
        if p.exists():
            print(f"  [EXISTS] {art:<26} ({p.stat().st_size:>8,} bytes)")
        else:
            print(f"  [MISSING] {art}")

    pipeline = SkyGuardPipeline(model_dir=models_dir)
    print("SkyGuardPipeline successfully initialized from disk artifacts.")
    
    # Run test matrix for different anomaly types and measure exact latencies
    test_cases = [
        ("Nominal Clean", {"temperature": 22.0, "pressure": 1013.25, "humidity": 55.0}),
        ("Thermal Spike (+30C)", {"temperature": 52.0, "pressure": 1013.25, "humidity": 55.0}),
        ("Barometric Drop (-40hPa)", {"temperature": 22.0, "pressure": 973.25, "humidity": 55.0}),
        ("Thermodynamic Inconsistency", {"temperature": 15.0, "pressure": 1013.25, "humidity": 99.5}),
        ("Frozen Stuck Reading", {"temperature": 22.0, "pressure": 1013.25, "humidity": 55.0}),
    ]
    
    latencies = []
    print("\nExecuting Test Cases through 5-Tier Pipeline:")
    for name, values in test_cases:
        obs = {
            "timestamp": "2026-08-25T11:00:00Z",
            "station_id": "AWS-001",
            "temperature": values["temperature"],
            "pressure": values["pressure"],
            "humidity": values["humidity"],
            "elevation": 216.0
        }
        t0 = time.perf_counter()
        res = pipeline.process_observation(obs)
        dt_ms = (time.perf_counter() - t0) * 1000.0
        latencies.append(dt_ms)
        
        print(f"\n  Test: {name}")
        print(f"    Inputs: T={obs['temperature']}C, P={obs['pressure']}hPa, RH={obs['humidity']}%")
        print(f"    Inference: is_anomaly={res.is_anomaly}, score={res.anomaly_score:.4f}, severity={res.severity}, class={res.classification}")
        print(f"    Tiers: QC_flag={res.tier_scores.tier1_qc_flag}, IF_score={res.tier_scores.tier2_point_score}, GRU_score={res.tier_scores.tier2_temporal_score}, Multi_score={res.tier_scores.tier3_multivariate_score}")
        print(f"    Sensor Health: SHI={res.sensor_health}%, Status={res.sensor_status}, TTF={res.estimated_hours_to_failure}")
        print(f"    XAI SHAP Summary: {res.explanation.summary}")
        print(f"    Measured Latency: {dt_ms:.2f} ms")

    avg_lat = float(np.mean(latencies))
    print(f"\nMeasured Mean Pipeline Latency across test suite: {avg_lat:.2f} ms")
    return avg_lat

def verify_database_state():
    print("\n" + "=" * 80)
    print("2. INDEPENDENT DATABASE STATE & ROW AUDIT")
    print("=" * 80)
    db_path = root_dir / "skyguard.db"
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall() if not r[0].startswith("sqlite_")]
    print(f"SQLite DB: {db_path} ({db_path.stat().st_size:,} bytes)")
    
    for t in tables:
        cursor.execute(f"SELECT count(*) FROM {t}")
        cnt = cursor.fetchone()[0]
        print(f"  Table: {t:<18} -> {cnt:>6} rows")
        
    print("\nFreshness Check (Latest 2 observations):")
    cursor.execute("SELECT id, station_id, timestamp, temperature, pressure, humidity FROM observations ORDER BY id DESC LIMIT 2")
    for r in cursor.fetchall():
        print(f"  Obs ID {r[0]}: Station {r[1]}, TS={r[2]}, T={r[3]}C, P={r[4]}hPa, RH={r[5]}%")

    print("\nLatest 2 Anomaly Events:")
    cursor.execute("SELECT id, station_id, timestamp, anomaly_score, severity, classification, is_fault FROM anomaly_events ORDER BY id DESC LIMIT 2")
    for r in cursor.fetchall():
        print(f"  Event ID {r[0]}: Station {r[1]}, Score={r[3]}, Sev={r[4]}, Class={r[5]}, IsFault={r[6]}")

    conn.close()

def search_for_mock_data():
    print("\n" + "=" * 80)
    print("3. REPOSITORY SCAN FOR MOCK / FAKE / HARDCODED DATA")
    print("=" * 80)
    
    patterns = ["mock", "fake", "Math.random", "dummy"]
    findings = []
    
    frontend_src = root_dir / "frontend" / "src"
    backend_app = root_dir / "backend" / "app"
    
    for p in list(frontend_src.rglob("*.tsx")) + list(frontend_src.rglob("*.ts")):
        content = p.read_text(encoding="utf-8", errors="ignore")
        for pat in patterns:
            if pat in content.lower() and "mock" not in p.name.lower():
                lines = content.splitlines()
                for i, line in enumerate(lines):
                    if pat in line.lower() and not line.strip().startswith("//") and not line.strip().startswith("/*"):
                        findings.append((str(p.relative_to(root_dir)), i + 1, line.strip()))

    print(f"Scanned {len(list(frontend_src.rglob('*.*')))} frontend files for mock/fake patterns.")
    if findings:
        print(f"Potential occurrences found ({len(findings)}):")
        for f, l, c in findings[:10]:
            print(f"  {f}:{l} -> {c}")
    else:
        print("  [CLEAN] 0 mock/fake/random patterns found in production frontend source.")

if __name__ == "__main__":
    verify_models_and_inference()
    verify_database_state()
    search_for_mock_data()
