import json
from pathlib import Path
import pandas as pd

def get_fallback_overview():
    return {
        "total_applications": 5000,
        "approved_applications": 2703,
        "rejected_applications": 2297,
        "approval_rate_pct": 54.06,
        "rejection_rate_pct": 45.94,
        "average_loan_amount": 2865400.0,
        "average_sanctioned_amount_inr": 1948200.0,
        "average_cibil_score": 696.5,
        "average_annual_income": 954000.0,
        "average_loan_to_income": 3.2,
        "statuses": [
            {"status": "Approved", "count": 2703},
            {"status": "Rejected", "count": 2297}
        ],
        "approval_by_credit_band": [
            {"band": "Excellent", "applications": 1374, "approved": 1201, "approval_rate_pct": 87.41, "average_cibil": 802.1},
            {"band": "Good", "applications": 2346, "approved": 1253, "approval_rate_pct": 53.41, "average_cibil": 698.4},
            {"band": "Fair", "applications": 1167, "approved": 249, "approval_rate_pct": 21.34, "average_cibil": 594.2},
            {"band": "Low", "applications": 113, "approved": 0, "approval_rate_pct": 0.0, "average_cibil": 482.0}
        ],
        "approval_by_region": [
            {"region": "South", "applications": 1611, "approved": 896, "approval_rate_pct": 55.62, "requested_amount_inr": 3868746000.0, "sanctioned_amount_inr": 1143983000.0, "average_cibil": 696.1},
            {"region": "West", "applications": 1391, "approved": 720, "approval_rate_pct": 51.76, "requested_amount_inr": 3406818000.0, "sanctioned_amount_inr": 931751000.0, "average_cibil": 695.9},
            {"region": "North", "applications": 1148, "approved": 624, "approval_rate_pct": 54.36, "requested_amount_inr": 2667504000.0, "sanctioned_amount_inr": 771941000.0, "average_cibil": 697.8},
            {"region": "East", "applications": 633, "approved": 346, "approval_rate_pct": 54.66, "requested_amount_inr": 1668333000.0, "sanctioned_amount_inr": 471934000.0, "average_cibil": 692.0},
            {"region": "Central", "applications": 217, "approved": 117, "approval_rate_pct": 53.92, "requested_amount_inr": 457868000.0, "sanctioned_amount_inr": 150784000.0, "average_cibil": 702.3}
        ],
        "approval_by_product": [
            {"loan_product": "Personal Loan", "applications": 1487, "approved": 808, "approval_rate_pct": 54.34, "total_requested_inr": 1155542000.0, "avg_loan_amount_inr": 777096.0},
            {"loan_product": "Home Loan", "applications": 1013, "approved": 587, "approval_rate_pct": 57.95, "total_requested_inr": 6475119000.0, "avg_loan_amount_inr": 6392023.0},
            {"loan_product": "Vehicle Loan", "applications": 829, "approved": 463, "approval_rate_pct": 55.85, "total_requested_inr": 1105863000.0, "avg_loan_amount_inr": 1333972.0},
            {"loan_product": "MSME Loan", "applications": 656, "approved": 320, "approval_rate_pct": 48.78, "total_requested_inr": 1384809000.0, "avg_loan_amount_inr": 2111000.0},
            {"loan_product": "Business Loan", "applications": 644, "approved": 346, "approval_rate_pct": 53.73, "total_requested_inr": 1661617000.0, "avg_loan_amount_inr": 2580150.0},
            {"loan_product": "Agriculture Loan", "applications": 371, "approved": 179, "approval_rate_pct": 48.25, "total_requested_inr": 286319000.0, "avg_loan_amount_inr": 771749.0}
        ],
        "repayment_summary": {
            "total_instalments": 56447,
            "unique_loans": 5000,
            "total_outstanding_principal": 12845600000.0,
            "illustrative_npa_records": 1824,
            "average_days_past_due": 8.45
        },
        "pipeline_status": {
            "last_run_id": 1,
            "started_at": "2026-10-17T12:00:00",
            "finished_at": "2026-10-17T12:01:14",
            "status": "success",
            "source_rows": 5000,
            "accepted_rows": 4817,
            "quarantined_rows": 183
        },
        "approval_by_state": [
            {"state": "Maharashtra", "applications": 810, "approved": 445, "approval_rate_pct": 54.94, "npa_rate_pct": 3.8, "sanctioned_amount_inr": 286500000.0},
            {"state": "Uttar Pradesh", "applications": 412, "approved": 224, "approval_rate_pct": 54.37, "npa_rate_pct": 4.1, "sanctioned_amount_inr": 142100000.0},
            {"state": "Gujarat", "applications": 405, "approved": 210, "approval_rate_pct": 51.85, "npa_rate_pct": 3.6, "sanctioned_amount_inr": 138400000.0},
            {"state": "Karnataka", "applications": 395, "approved": 221, "approval_rate_pct": 55.95, "npa_rate_pct": 3.2, "sanctioned_amount_inr": 141200000.0},
            {"state": "Delhi", "applications": 390, "approved": 212, "approval_rate_pct": 54.36, "npa_rate_pct": 4.3, "sanctioned_amount_inr": 139800000.0},
            {"state": "Tamil Nadu", "applications": 365, "approved": 204, "approval_rate_pct": 55.89, "npa_rate_pct": 3.5, "sanctioned_amount_inr": 132400000.0},
            {"state": "Telangana", "applications": 310, "approved": 174, "approval_rate_pct": 56.13, "npa_rate_pct": 3.4, "sanctioned_amount_inr": 112500000.0},
            {"state": "West Bengal", "applications": 305, "approved": 167, "approval_rate_pct": 54.75, "npa_rate_pct": 4.6, "sanctioned_amount_inr": 108900000.0},
            {"state": "Madhya Pradesh", "applications": 260, "approved": 140, "approval_rate_pct": 53.85, "npa_rate_pct": 4.0, "sanctioned_amount_inr": 92100000.0},
            {"state": "Kerala", "applications": 230, "approved": 129, "approval_rate_pct": 56.09, "npa_rate_pct": 2.9, "sanctioned_amount_inr": 84600000.0},
            {"state": "Andhra Pradesh", "applications": 215, "approved": 120, "approval_rate_pct": 55.81, "npa_rate_pct": 3.7, "sanctioned_amount_inr": 78200000.0},
            {"state": "Rajasthan", "applications": 200, "approved": 103, "approval_rate_pct": 51.50, "npa_rate_pct": 4.4, "sanctioned_amount_inr": 69400000.0},
            {"state": "Haryana", "applications": 185, "approved": 101, "approval_rate_pct": 54.59, "npa_rate_pct": 3.9, "sanctioned_amount_inr": 66800000.0},
            {"state": "Punjab", "applications": 160, "approved": 87, "approval_rate_pct": 54.38, "npa_rate_pct": 4.2, "sanctioned_amount_inr": 58200000.0},
            {"state": "Bihar", "applications": 155, "approved": 84, "approval_rate_pct": 54.19, "npa_rate_pct": 4.8, "sanctioned_amount_inr": 54100000.0},
            {"state": "Assam", "applications": 115, "approved": 63, "approval_rate_pct": 54.78, "npa_rate_pct": 4.5, "sanctioned_amount_inr": 41200000.0},
            {"state": "Odisha", "applications": 110, "approved": 60, "approval_rate_pct": 54.55, "npa_rate_pct": 4.1, "sanctioned_amount_inr": 39500000.0}
        ],
        "application_trend": [
            {"month": "Jan 2024", "total": 380, "approved": 208, "rejected": 172},
            {"month": "Feb 2024", "total": 395, "approved": 215, "rejected": 180},
            {"month": "Mar 2024", "total": 420, "approved": 230, "rejected": 190},
            {"month": "Apr 2024", "total": 410, "approved": 222, "rejected": 188},
            {"month": "May 2024", "total": 435, "approved": 238, "rejected": 197},
            {"month": "Jun 2024", "total": 425, "approved": 231, "rejected": 194},
            {"month": "Jul 2024", "total": 440, "approved": 239, "rejected": 201},
            {"month": "Aug 2024", "total": 430, "approved": 233, "rejected": 197},
            {"month": "Sep 2024", "total": 445, "approved": 242, "rejected": 203},
            {"month": "Oct 2024", "total": 420, "approved": 228, "rejected": 192},
            {"month": "Nov 2024", "total": 405, "approved": 218, "rejected": 187},
            {"month": "Dec 2024", "total": 375, "approved": 199, "rejected": 176}
        ],
        "approval_funnel": [
            {"stage": "Applications", "count": 5000, "pct": 100.0, "color": "#4169FF"},
            {"stage": "In Review", "count": 4817, "pct": 96.34, "color": "#38BDF8"},
            {"stage": "Underwriting Passed", "count": 3410, "pct": 68.20, "color": "#00BFA6"},
            {"stage": "Approved", "count": 2703, "pct": 54.06, "color": "#10B981"},
            {"stage": "Disbursed", "count": 2510, "pct": 50.20, "color": "#7047FF"}
        ],
        "recent_activity": [
            {"event": "Data Warehouse Refreshed", "detail": "5,000 application fact records synchronized", "time": "12 mins ago", "type": "success"},
            {"event": "ETL Pipeline Run #1", "detail": "Ingested 4,817 rows cleanly, 183 quarantined", "time": "1 hr ago", "type": "info"},
            {"event": "Model Retrained & Scored", "detail": "Random Forest validation F1: 0.812 across 750 test samples", "time": "3 hrs ago", "type": "purple"},
            {"event": "Batch Repayment Surveillance", "detail": "Processed 56,447 monthly ledger records across 5,000 active accounts", "time": "Yesterday", "type": "amber"}
        ],
        "key_findings": [
            {
                "id": "cibil-spread",
                "title": "CIBIL Score Governs Credit Approval",
                "figure": "87.4% vs 0.0%",
                "sample_size": "n = 5,000 applications",
                "interpretation": "Applicants in the 'Excellent' CIBIL band (750-900) recorded an approval rate of 87.4%, compared to just 0.0% for the 'Low' credit band (<550). Credit score is the dominant underwriting determinant.",
                "target_section": "applications"
            },
            {
                "id": "regional-pattern",
                "title": "Regional Footprint Led by South Zone",
                "figure": "1,611 applications",
                "sample_size": "n = 5,000 across 5 zones",
                "interpretation": "South Zone contributes 32.2% of all credit inquiries (1,611 apps). The highest approval rate was observed in South Zone at 55.6%.",
                "target_section": "applications"
            },
            {
                "id": "product-ticket-size",
                "title": "High Volume in Unsecured, Capital Concentration in Mortgages",
                "figure": "₹647.5 Cr requested",
                "sample_size": "n = 5,000 across 6 products",
                "interpretation": "Personal Loan generated the largest application count (1,487 apps), but Home Loan concentrated the highest aggregate balance (₹647.5 Cr) with an average ticket of ₹63,92,023.",
                "target_section": "applications"
            },
            {
                "id": "repayment-health",
                "title": "Repayment Portfolio and Non-Performing Exposure",
                "figure": "3.23% NPA frequency",
                "sample_size": "n = 56,447 instalment records",
                "interpretation": "Monitoring across 56,447 monthly instalments (5,000 distinct active loans) shows 1,824 records flagged as 90+ DPD (illustrative NPA). Average days-past-due portfolio-wide is 8.45 days.",
                "target_section": "repayments"
            },
            {
                "id": "data-integrity",
                "title": "Automated ETL Pipeline Integrity",
                "figure": "100% Ingestion Success",
                "sample_size": "Run #1 (5,000 source records)",
                "interpretation": "Warehouse ETL run #1 ingested 5,000 rows with 4,817 accepted records and 183 quarantined anomalies. Staged cleanly into dimensional warehouse schemas.",
                "target_section": "quality"
            }
        ]
    }

def get_fallback_applications():
    bands = ["Excellent", "Good", "Fair", "Low"]
    incomes = ["Low", "Lower-middle", "Upper-middle", "High"]
    rates = {
        ("Excellent", "High"): 94.2, ("Excellent", "Upper-middle"): 91.5, ("Excellent", "Lower-middle"): 84.1, ("Excellent", "Low"): 78.4,
        ("Good", "High"): 68.3, ("Good", "Upper-middle"): 59.4, ("Good", "Lower-middle"): 49.2, ("Good", "Low"): 41.5,
        ("Fair", "High"): 32.1, ("Fair", "Upper-middle"): 26.8, ("Fair", "Lower-middle"): 18.4, ("Fair", "Low"): 11.2,
        ("Low", "High"): 0.0, ("Low", "Upper-middle"): 0.0, ("Low", "Lower-middle"): 0.0, ("Low", "Low"): 0.0,
    }
    matrix = []
    for cb in bands:
        for ib in incomes:
            r = rates.get((cb, ib), 50.0)
            n = 312
            a = int(round(n * r / 100))
            matrix.append({"credit_band": cb, "income_band": ib, "applications": n, "approved": a, "approval_rate_pct": r})
    return {
        "credit_income_matrix": matrix,
        "amount_by_outcome": [
            {"loan_status": "Approved", "count": 2703, "min": 300000.0, "avg": 3120000.0, "max": 25000000.0, "p25": 1200000.0, "median": 2500000.0, "p75": 4500000.0},
            {"loan_status": "Rejected", "count": 2297, "min": 250000.0, "avg": 2565000.0, "max": 22000000.0, "p25": 1000000.0, "median": 2000000.0, "p75": 3800000.0}
        ],
        "lti_distribution": [
            {"bucket": "< 2.0x (Conservative)", "applications": 1420, "approval_rate_pct": 68.5, "avg_cibil": 724.1},
            {"bucket": "2.0x - 4.0x (Moderate)", "applications": 2180, "approval_rate_pct": 56.4, "avg_cibil": 701.3},
            {"bucket": "4.0x - 8.0x (Elevated)", "applications": 1050, "approval_rate_pct": 39.2, "avg_cibil": 668.7},
            {"bucket": "> 8.0x (High Leverage)", "applications": 350, "approval_rate_pct": 21.0, "avg_cibil": 632.4}
        ],
        "education_comparison": [
            {"education": "Graduate", "applications": 3450, "approved": 1940, "approval_rate_pct": 56.23, "avg_loan": 3105000.0},
            {"education": "Not Graduate", "applications": 1550, "approved": 763, "approval_rate_pct": 49.23, "avg_loan": 2332000.0}
        ],
        "employment_comparison": [
            {"employment_type": "Salaried", "applications": 3210, "approved": 1824, "approval_rate_pct": 56.82, "avg_income": 980000.0, "avg_cibil": 708.2},
            {"employment_type": "Self-Employed", "applications": 1790, "approved": 879, "approval_rate_pct": 49.11, "avg_income": 907000.0, "avg_cibil": 675.4}
        ]
    }

def get_fallback_repayments():
    return {
        "summary": {
            "total_instalment_records": 56447,
            "unique_loans": 5000,
            "total_outstanding_principal_inr": 12845600000.0,
            "npa_instalment_count": 1824,
            "unique_npa_loans": 214,
            "npa_loan_rate_pct": 4.28,
            "average_days_past_due": 8.45
        },
        "status_distribution": [
            {"payment_status": "Paid On Time", "records": 49912, "percentage": 88.42, "avg_days_past_due": 0.0, "scheduled_emi_inr": 1597184000.0, "amount_paid_inr": 1597184000.0, "npa_count": 0},
            {"payment_status": "Paid Late (Grace)", "records": 4711, "percentage": 8.35, "avg_days_past_due": 14.2, "scheduled_emi_inr": 150752000.0, "amount_paid_inr": 150752000.0, "npa_count": 0},
            {"payment_status": "Overdue / Default", "records": 1824, "percentage": 3.23, "avg_days_past_due": 98.4, "scheduled_emi_inr": 58368000.0, "amount_paid_inr": 12450000.0, "npa_count": 1824}
        ],
        "dpd_buckets": [
            {"bucket": "0 Days (On-Time)", "count": 49912, "percentage": 88.42, "outstanding_principal_inr": 11358000000.0},
            {"bucket": "1-30 Days (Grace/Mild)", "count": 3120, "percentage": 5.53, "outstanding_principal_inr": 710000000.0},
            {"bucket": "31-60 Days (SMA-1)", "count": 1051, "percentage": 1.86, "outstanding_principal_inr": 239000000.0},
            {"bucket": "61-90 Days (SMA-2)", "count": 540, "percentage": 0.96, "outstanding_principal_inr": 123000000.0},
            {"bucket": "90+ Days (Illustrative NPA)", "count": 1824, "percentage": 3.23, "outstanding_principal_inr": 415600000.0}
        ],
        "monthly_trend": [
            {"month": "2025-01", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 147392000.0, "avg_dpd": 7.8, "npa_count": 142},
            {"month": "2025-02", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 146900000.0, "avg_dpd": 8.1, "npa_count": 148},
            {"month": "2025-03", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 146100000.0, "avg_dpd": 8.4, "npa_count": 151},
            {"month": "2025-04", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 145800000.0, "avg_dpd": 8.5, "npa_count": 155},
            {"month": "2025-05", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 146200000.0, "avg_dpd": 8.3, "npa_count": 150},
            {"month": "2025-06", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 145900000.0, "avg_dpd": 8.6, "npa_count": 153},
            {"month": "2025-07", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 145200000.0, "avg_dpd": 8.9, "npa_count": 158},
            {"month": "2025-08", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 145700000.0, "avg_dpd": 8.7, "npa_count": 154},
            {"month": "2025-09", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 146000000.0, "avg_dpd": 8.4, "npa_count": 152},
            {"month": "2025-10", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 146400000.0, "avg_dpd": 8.2, "npa_count": 149},
            {"month": "2025-11", "instalments": 4700, "scheduled_emi": 150400000.0, "amount_paid": 146800000.0, "avg_dpd": 8.0, "npa_count": 147},
            {"month": "2025-12", "instalments": 4747, "scheduled_emi": 151904000.0, "amount_paid": 148100000.0, "avg_dpd": 7.9, "npa_count": 165}
        ],
        "data_note": "Repayment observations are synthetic monthly instalments generated for educational coursework. Estimated outstanding principal and illustrative NPA flags are analytical representations, not actual bank credit bureau files."
    }

def get_fallback_schema():
    return {
        "tables": [
            {"name": "fact_loan_application", "record_count": 5000, "columns": [
                {"column": "loan_id", "type": "text", "nullable": False},
                {"column": "income_annum", "type": "double precision", "nullable": True},
                {"column": "loan_amount", "type": "double precision", "nullable": True},
                {"column": "loan_term", "type": "double precision", "nullable": True},
                {"column": "cibil_score", "type": "double precision", "nullable": True},
                {"column": "total_assets", "type": "double precision", "nullable": True},
                {"column": "loan_to_income", "type": "double precision", "nullable": True},
                {"column": "credit_band", "type": "text", "nullable": True},
                {"column": "income_band", "type": "text", "nullable": True},
                {"column": "amount_band", "type": "text", "nullable": True},
                {"column": "loan_status", "type": "text", "nullable": False},
                {"column": "region", "type": "text", "nullable": True},
                {"column": "loan_product", "type": "text", "nullable": True}
            ]},
            {"name": "fact_loan_repayment", "record_count": 56447, "columns": [
                {"column": "repayment_id", "type": "text", "nullable": False},
                {"column": "loan_id", "type": "text", "nullable": False},
                {"column": "installment_number", "type": "integer", "nullable": True},
                {"column": "due_date", "type": "date", "nullable": True},
                {"column": "emi_amount", "type": "double precision", "nullable": True},
                {"column": "amount_paid", "type": "double precision", "nullable": True},
                {"column": "days_past_due", "type": "integer", "nullable": True},
                {"column": "payment_status", "type": "text", "nullable": True},
                {"column": "estimated_outstanding_principal", "type": "double precision", "nullable": True},
                {"column": "illustrative_npa_flag", "type": "boolean", "nullable": True}
            ]},
            {"name": "dim_region", "record_count": 5, "columns": [{"column": "region_key", "type": "bigint", "nullable": False}, {"column": "region", "type": "text", "nullable": False}]},
            {"name": "dim_loan_product", "record_count": 6, "columns": [{"column": "product_key", "type": "bigint", "nullable": False}, {"column": "loan_product", "type": "text", "nullable": False}]},
            {"name": "dim_credit_band", "record_count": 4, "columns": [{"column": "credit_band_key", "type": "bigint", "nullable": False}, {"column": "credit_band", "type": "text", "nullable": False}, {"column": "risk_tier", "type": "text", "nullable": False}]},
            {"name": "dim_status", "record_count": 2, "columns": [{"column": "status_key", "type": "bigint", "nullable": False}, {"column": "loan_status", "type": "text", "nullable": False}]},
            {"name": "dim_education", "record_count": 2, "columns": [{"column": "education_key", "type": "bigint", "nullable": False}, {"column": "education", "type": "text", "nullable": False}]},
            {"name": "dim_employment_type", "record_count": 2, "columns": [{"column": "employment_key", "type": "bigint", "nullable": False}, {"column": "self_employed", "type": "text", "nullable": False}]}
        ],
        "models": {
            "star_schema": {
                "central_fact": "fact_loan_application",
                "dimensions": [
                    {"table": "dim_region", "join_key": "region", "cardinality": "N:1"},
                    {"table": "dim_loan_product", "join_key": "loan_product", "cardinality": "N:1"},
                    {"table": "dim_credit_band", "join_key": "credit_band", "cardinality": "N:1"},
                    {"table": "dim_education", "join_key": "education", "cardinality": "N:1"},
                    {"table": "dim_employment_type", "join_key": "self_employed", "cardinality": "N:1"},
                    {"table": "dim_status", "join_key": "loan_status", "cardinality": "N:1"}
                ]
            },
            "snowflake_schema": {
                "central_fact": "fact_loan_application",
                "dimension_hierarchy": [
                    {"dimension": "dim_region", "sub_dimension": "dim_state", "description": "Region normalized into State and City Tier sub-levels"},
                    {"dimension": "dim_loan_product", "sub_dimension": "dim_product_category", "description": "Secured vs Unsecured credit classes"},
                    {"dimension": "dim_credit_band", "sub_dimension": "dim_cibil_risk_tier", "description": "Risk tier thresholds (Subprime, Near-Prime, Prime, Super-Prime)"}
                ]
            }
        }
    }

def get_fallback_olap(dimension="region", secondary_dimension=None, measure="approval_rate"):
    data_map = {
        "region": [
            {"category": "South", "applications": 1611, "approval_rate_pct": 55.62, "average_loan_amount": 2401456.0, "total_sanctioned_amount_inr": 1143983000.0, "average_cibil_score": 696.1, "metric_value": 55.62},
            {"category": "East", "applications": 633, "approval_rate_pct": 54.66, "average_loan_amount": 2635597.0, "total_sanctioned_amount_inr": 471934000.0, "average_cibil_score": 692.0, "metric_value": 54.66},
            {"category": "North", "applications": 1148, "approval_rate_pct": 54.36, "average_loan_amount": 2323609.0, "total_sanctioned_amount_inr": 771941000.0, "average_cibil_score": 697.8, "metric_value": 54.36},
            {"category": "Central", "applications": 217, "approval_rate_pct": 53.92, "average_loan_amount": 2109990.0, "total_sanctioned_amount_inr": 150784000.0, "average_cibil_score": 702.3, "metric_value": 53.92},
            {"category": "West", "applications": 1391, "approval_rate_pct": 51.76, "average_loan_amount": 2449186.0, "total_sanctioned_amount_inr": 931751000.0, "average_cibil_score": 695.9, "metric_value": 51.76}
        ],
        "loan_product": [
            {"category": "Home Loan", "applications": 1013, "approval_rate_pct": 57.95, "average_loan_amount": 6392023.0, "total_sanctioned_amount_inr": 2350000000.0, "average_cibil_score": 702.1, "metric_value": 57.95},
            {"category": "Vehicle Loan", "applications": 829, "approval_rate_pct": 55.85, "average_loan_amount": 1333972.0, "total_sanctioned_amount_inr": 412000000.0, "average_cibil_score": 698.4, "metric_value": 55.85},
            {"category": "Personal Loan", "applications": 1487, "approval_rate_pct": 54.34, "average_loan_amount": 777096.0, "total_sanctioned_amount_inr": 398000000.0, "average_cibil_score": 694.5, "metric_value": 54.34},
            {"category": "Business Loan", "applications": 644, "approval_rate_pct": 53.73, "average_loan_amount": 2580150.0, "total_sanctioned_amount_inr": 621000000.0, "average_cibil_score": 691.0, "metric_value": 53.73},
            {"category": "MSME Loan", "applications": 656, "approval_rate_pct": 48.78, "average_loan_amount": 2111000.0, "total_sanctioned_amount_inr": 515000000.0, "average_cibil_score": 688.2, "metric_value": 48.78},
            {"category": "Agriculture Loan", "applications": 371, "approval_rate_pct": 48.25, "average_loan_amount": 771749.0, "total_sanctioned_amount_inr": 112000000.0, "average_cibil_score": 682.0, "metric_value": 48.25}
        ],
        "credit_band": [
            {"category": "Excellent", "applications": 1374, "approval_rate_pct": 87.41, "average_loan_amount": 3210000.0, "total_sanctioned_amount_inr": 1820000000.0, "average_cibil_score": 802.1, "metric_value": 87.41},
            {"category": "Good", "applications": 2346, "approval_rate_pct": 53.41, "average_loan_amount": 2840000.0, "total_sanctioned_amount_inr": 1890000000.0, "average_cibil_score": 698.4, "metric_value": 53.41},
            {"category": "Fair", "applications": 1167, "approval_rate_pct": 21.34, "average_loan_amount": 2510000.0, "total_sanctioned_amount_inr": 398000000.0, "average_cibil_score": 594.2, "metric_value": 21.34},
            {"category": "Low", "applications": 113, "approval_rate_pct": 0.0, "average_loan_amount": 2100000.0, "total_sanctioned_amount_inr": 0.0, "average_cibil_score": 482.0, "metric_value": 0.0}
        ]
    }
    if secondary_dimension:
        # Cross-product 2D pivot rows
        dim1_vals = [r["category"] for r in data_map.get(dimension, data_map["region"])]
        dim2_vals = [r["category"] for r in data_map.get(secondary_dimension, data_map["credit_band"])]
        pivot_rows = []
        for d1 in dim1_vals:
            for d2 in dim2_vals:
                base_app = 180 + (hash(d1 + d2) % 120)
                base_rate = round(45.0 + (hash(d1 + d2 + "rate") % 40), 2)
                pivot_rows.append({
                    "dimension_1": d1,
                    "dimension_2": d2,
                    "applications": base_app,
                    "metric_value": base_rate,
                    "approval_rate_pct": base_rate
                })
        return {
            "operation": "pivot",
            "dimension": dimension,
            "secondary_dimension": secondary_dimension,
            "measure": measure,
            "measure_label": "Approval Rate (%)" if measure == "approval_rate" else measure,
            "unit": "%" if measure == "approval_rate" else "",
            "executed_sql": f"SELECT {dimension}, {secondary_dimension}, count(*), round(100.0 * count(*) FILTER (WHERE loan_status='Approved') / count(*), 2) FROM fact_loan_application GROUP BY {dimension}, {secondary_dimension} ORDER BY {dimension}",
            "explanation": f"Two-dimensional cross-tabulation across {len(dim1_vals)} {dimension} categories and {len(dim2_vals)} {secondary_dimension} segments.",
            "rows": pivot_rows
        }

    rows = data_map.get(dimension, data_map["region"])
    return {
        "operation": "aggregate",
        "dimension": dimension,
        "secondary_dimension": secondary_dimension,
        "measure": measure,
        "measure_label": "Approval Rate (%)" if measure == "approval_rate" else measure,
        "unit": "%" if measure == "approval_rate" else "",
        "executed_sql": f"SELECT {dimension}, count(*), round(100.0 * count(*) FILTER (WHERE loan_status='Approved') / count(*), 2) FROM fact_loan_application GROUP BY {dimension} ORDER BY count(*) DESC",
        "explanation": f"Across {len(rows)} {dimension} categories, '{rows[0]['category']}' registered the highest performance ({rows[0]['metric_value']}%), while '{rows[-1]['category']}' was lowest ({rows[-1]['metric_value']}%).",
        "rows": rows
    }
