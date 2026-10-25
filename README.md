# Indian Loan Intelligence Warehouse · Enterprise DWM & ML Platform

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-3776AB?logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.1-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Plotly.js](https://img.shields.io/badge/Plotly.js-2.35.2-3F4F75?logo=plotly&logoColor=white)](https://plotly.com/javascript/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.5.2-F7931E?logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Architecture](https://img.shields.io/badge/Data%20Warehouse-Star%20Schema-indigo)](#dimensional-data-warehouse-architecture)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, standalone web-based analytics, **Data Warehousing & Mining (DWM)**, multi-dimensional OLAP, and Machine Learning decision-support platform engineered for Indian retail lending portfolios.

---

## 🏛 Platform Overview

The **Loan Intelligence Warehouse** combines dimensional modeling, automated ETL data engineering, OLAP slicing/dicing, and supervised/unsupervised machine learning within a single, cohesive hybrid fintech interface.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MODERN HYBRID FINTECH UI                             │
│       Collapsible Sidebar · Micro-Animations · Live Alerts · Plotly.js       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      REST API (FastAPI / Uvicorn)
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────┐                             ┌───────────────────────┐
│ POSTGRESQL WAREHOUSE  │                             │  MACHINE LEARNING HUB │
│ • Star-Schema Schema  │                             │ • XGBoost / RF Engine │
│ • Fact & Dim Tables   │                             │ • K-Means (k=4)       │
│ • OLAP Aggregations   │                             │ • Underwrite Simulator│
│ • JSONB Raw Staging   │                             │ • Feature Importance  │
└───────────────────────┘                             └───────────────────────┘
```

> **Data Disclaimer:** Application and repayment datasets are synthetic Indian retail loan records designed for academic data mining, dimensional modeling, and decision-support coursework. Repayment histories and NPA flags are illustrative.

---

## 🚀 Key Modules & Capabilities

The platform is structured into **10 core analytical modules**:

### 1. Executive Overview
- **Real-Time Portfolio KPIs:** Total applications (5,000), approval rate (~55.3%), aggregate sanctioned capital (₹6,800+ Cr), portfolio CIBIL average (724), and active borrower count.
- **Dynamic Evidence-Based Insights:** Automated key findings with exact sample sizes ($n$), quantitative metrics, and direct analytical drill-downs.
- **Visual Analytics:** Monthly application intake trends, underwriting approval funnels, and interactive portfolio composition breakdowns.

### 2. Application Analytics
- **Risk Heatmap Matrix:** Approval rate cross-tabulation across Credit Score Tiers (Poor, Fair, Good, Excellent) and Income Bands (Low, Lower-Middle, Upper-Middle, High).
- **Distribution Profiles:** Kernel density and percentile distributions for requested amounts, sanctioned values, and Loan-to-Income (LTI) leverage ratios.
- **Demographic Analysis:** Multi-variable comparisons across applicant education levels, employment categories, and family dependency bands.

### 3. Repayment Analytics & Surveillance
- **Instalment Surveillance:** Tracking of 33,200+ monthly instalment records across 5,000 distinct loan accounts.
- **DPD Migration Buckets:** Delinquency tracking categorized into 0 DPD (Current), 1–30 DPD (Early Warning), 31–60 DPD (Pre-Substandard), 61–90 DPD (Substandard), and 90+ DPD (Illustrative NPA).
- **Cash Flow Recovery:** Expected principal vs. collected instalment cash flows over 36 repayment cycles.

### 4. Data Quality & ETL Pipeline
- **End-to-End Pipeline Audit:** Visual ingestion lineage: CSV Sources ➔ 12 Validation Rules ➔ Feature Derivation ➔ JSONB Staging (`raw_loan_application`) ➔ Dimensional Warehouse ➔ Serving Layer.
- **Execution Audit Logging:** Full historical execution tracking stored directly in `etl_run_log` with row counts, duration, and status.
- **Anomaly Quarantine:** Outlier isolation for negative incomes, invalid credit bands, or tenure anomalies.

### 5. Dimensional Warehouse Explorer
- **Interactive Schema Visualizer:** Visual diagram of star-schema tables with cardinalities, primary keys (PK), and foreign keys (FK).
- **Live Paginated Browser:** Real-time search, sorting, and pagination across every warehouse dimension and fact table.
- **Enterprise Data Dictionary:** Complete column definitions, data types, nullability constraints, and business calculation logic.

### 6. SQL & OLAP Studio
- **Multi-Dimensional OLAP Operations:** Native execution of **Roll-up**, **Drill-down**, **Slice**, **Dice**, and **Pivot** cross-tabulations across 12 dimensions and 6 financial measures.
- **Executable SQL Viewer:** Formatted syntax highlighting showing the exact SQL statement dispatched to PostgreSQL.
- **Automated Natural Language Explanations:** Real-time business summaries translating SQL aggregates into clear managerial insights.

### 7. Customer Segmentation
- **Unsupervised K-Means Clustering ($k=4$):** Trained on applicant income, loan amount, collateral asset backing, and bureau credit scores.
- **Segment Profiles:**
  - *Affluent Secured Borrowers:* High asset backing, prime credit score, high loan-to-value safety.
  - *Emerging Salaried Professionals:* Moderate incomes, disciplined repayment track record, mid-range credit.
  - *Micro-Leveraged Applicants:* High debt-to-income sensitivity requiring collateralized scrutiny.
  - *Prime High-Net-Worth Cohort:* Ultra-low default risk with prime CIBIL scores (>780).

### 8. Machine Learning Model Analytics
- **Supervised Underwriting Benchmark:** Rigorous comparison of Logistic Regression, Decision Tree, and Random Forest / XGBoost models.
- **Performance Scorecard:** Evaluation across Accuracy (96.4%), Precision (97.1%), Recall (96.5%), F1-Score (0.968), and ROC-AUC (0.988).
- **Model Explainability:** Confusion matrix heatmaps, ROC curves, feature importance ranking (CIBIL score, LTI, and total assets), and searchable test predictions with CSV export.

### 9. Interactive Prediction Lab
- **Live Underwriting Simulator:** Real-time applicant scoring sandbox.
- **Financial Controls:** Test custom applicant scenarios by modifying loan amount, tenure, annual income, CIBIL score, asset collateral, and employment type.
- **Decision Engine:** Instant approval probability meter, approved/rejected classification, and applicant risk factor breakdown.

### 10. Methodology & Governance
- **Comprehensive Documentation:** Full audit coverage of dataset provenance, dimensional design principles, feature engineering formulas, leakage prevention protocols, and ethical AI fairness guidelines.

---

## 🗄 Dimensional Data Warehouse Architecture

The PostgreSQL warehouse implements an industry-standard **Star Schema** optimized for high-performance OLAP analytical querying:

```mermaid
erDiagram
    dim_region ||--o{ fact_loan_application : "located in"
    dim_loan_product ||--o{ fact_loan_application : "classifies"
    dim_credit_band ||--o{ fact_loan_application : "evaluated by"
    dim_education ||--o{ fact_loan_application : "held by"
    dim_employment_type ||--o{ fact_loan_application : "employed as"
    dim_status ||--o{ fact_loan_application : "decided as"
    fact_loan_application ||--o{ fact_loan_repayment : "tracks instalments"

    fact_loan_application {
        varchar loan_id PK
        numeric income_annum
        numeric loan_amount
        int loan_term
        int cibil_score
        numeric total_assets
        numeric loan_to_income
        varchar credit_band
        varchar income_band
        varchar region
        varchar loan_product
        varchar loan_status
        timestamp loaded_at
    }

    fact_loan_repayment {
        bigserial repayment_id PK
        varchar loan_id FK
        int instalment_number
        numeric instalment_amount_due
        numeric amount_paid
        int days_past_due
        boolean illustrative_npa_flag
        varchar payment_status
    }

    dim_region {
        varchar region_key PK
        varchar region_name
        varchar zone
        varchar tier
    }

    dim_loan_product {
        varchar product_key PK
        varchar product_name
        varchar collateral_requirement
    }

    dim_credit_band {
        varchar credit_band_key PK
        int min_cibil
        int max_cibil
    }
```

### Warehouse Tables & Granularity

| Table Name | Type | Key Columns | Record Count | Description |
| :--- | :--- | :--- | :--- | :--- |
| `fact_loan_application` | Fact | `loan_id` (PK) | 5,000 | Core application fact with 53 dimensional & financial metrics |
| `fact_loan_repayment` | Fact | `repayment_id` (PK), `loan_id` (FK) | 33,204 | Accumulating snapshot of monthly payment instalments & DPD |
| `dim_region` | Dimension | `region_key` (PK) | 5 | Geographic zones (North, South, East, West, Central) |
| `dim_loan_product` | Dimension | `product_key` (PK) | 6 | Personal, Home, Auto, Education, Gold, Business Loans |
| `dim_credit_band` | Dimension | `credit_band_key` (PK) | 4 | Poor (<600), Fair (600–699), Good (700–799), Excellent (800+) |
| `dim_education` | Dimension | `education_key` (PK) | 2 | Graduate, Not Graduate |
| `dim_employment_type`| Dimension | `employment_key` (PK) | 3 | Salaried, Self-Employed, Business Owner |
| `dim_status` | Dimension | `status_key` (PK) | 2 | Approved, Rejected |
| `raw_loan_application`| Staging | `loan_id` (PK) | 5,000 | Raw JSONB payload storage preserving original source records |
| `etl_run_log` | Audit | `run_id` (PK) | Variable | Ingestion run timestamps, accepted rows, quarantined rows, status |

---

## 🛠 Tech Stack

- **Backend Framework:** FastAPI, Uvicorn, Python 3.11+
- **Database:** PostgreSQL 16 (Star-Schema OLAP, JSONB Staging, Window Functions)
- **Database Driver:** `psycopg[binary]`, `psycopg2`
- **Machine Learning & Data Science:** Scikit-Learn, Pandas, NumPy, Joblib
- **Frontend / Client:** Vanilla Modern JavaScript (ES6+), Modern Semantic HTML5
- **Styling & Design System:** Custom CSS Variables, Hybrid Light/Dark Theme System, Micro-Animations, Flexbox & CSS Grid
- **Enterprise Visualizations:** Plotly.js 2.35.2
- **Deployment & Cloud:** Vercel Serverless Function (`api/index.py`), Cloud PostgreSQL (Neon.tech / Supabase)

---

## ⚡ Quickstart Guide (Local Setup)

### 1. Prerequisites
- **Python 3.11+** installed
- **PostgreSQL 16** installed and running locally
- **Git**

### 2. Clone and Setup Environment

```bash
# Clone the repository
git clone https://github.com/srkhandagale1601-del/loan-approval-warehouse.git
cd loan-approval-warehouse

# Switch to the Loan approval Dwm branch
git checkout Loan-approval-Dwm

# Create and activate a Python virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

### 3. Configure Database Connection

Create a `.env` file in the project root:

```env
LN_DSN=postgresql://postgres:your_password@localhost:5432/loan_warehouse
LN_REPORT_DIR=reports
LN_MODEL_DIR=models
LN_RANDOM_SEED=42
```

### 4. Initialize Warehouse & Train Models

```powershell
# Set Python path to src directory
$env:PYTHONPATH = "src"

# Ingest data, create star-schema, and stage audit logs
python -m ln.etl_loans
python -m ln.warehouse
python -m ln.eda

# Train ML models and run K-Means segmentation
python -m ln.mining
```

### 5. Launch the Web Application

```powershell
uvicorn ln.api:app --app-dir "src" --host 127.0.0.1 --port 8078 --reload
```

- **Analytics Dashboard:** Open [http://127.0.0.1:8078](http://127.0.0.1:8078)
- **Interactive OpenAPI Docs:** Open [http://127.0.0.1:8078/docs](http://127.0.0.1:8078/docs)

---

## ☁ Deploying to Vercel

The platform is designed to deploy seamlessly to **Vercel** as a serverless ASGI application:

1. Push your repository to GitHub.
2. In the Vercel dashboard, click **Add New Project** and import `loan-approval-warehouse`.
3. Configure the build settings:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./`
   - **Build & Install Commands:** Leave toggle OFF (default)
4. Add the **Environment Variables**:
   - `LN_DSN`: Your cloud PostgreSQL connection string (e.g., from [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)).
   - `LN_REPORT_DIR`: `reports`
   - `LN_MODEL_DIR`: `models`
5. Click **Deploy**.

For detailed troubleshooting and cloud database setup, refer to [`DEPLOY_VERCEL.md`](DEPLOY_VERCEL.md).

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | PostgreSQL connectivity, ML model status, and table record counts |
| `GET` | `/api/overview` | Executive portfolio KPIs, dynamic key findings, and pipeline status |
| `GET` | `/api/applications/analytics`| Income × Credit heatmap, distributions, and demographic matrices |
| `GET` | `/api/repayments/analytics` | DPD buckets, NPA rates, and instalment cash-flow projections |
| `GET` | `/api/data-quality` | Validation rule compliance, completeness %, and quarantine audit logs |
| `GET` | `/api/warehouse/preview` | Paginated search across any warehouse dimension or fact table |
| `GET` | `/api/warehouse/schema` | Star and snowflake schema entity definitions and foreign key maps |
| `GET` | `/api/olap/query` | Dynamic OLAP aggregation engine (Roll-up, Slice, Dice, Pivot) |
| `GET` | `/api/segmentation` | K-Means applicant cluster centroids and risk profiles |
| `GET` | `/api/models/analytics` | Benchmark metrics (Accuracy, ROC-AUC, F1) and feature importance |
| `POST`| `/api/models/predict` | Real-time underwriting applicant inference simulator |

---

## 📄 License & Academic Note

This project is open-source under the [MIT License](LICENSE). Built for academic and research demonstrations in **Data Warehousing & Mining (DWM)** and Financial Decision Support Systems.
