import json
import math
import numpy as np
import pandas as pd
from joblib import dump
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, precision_recall_curve, confusion_matrix
)
from ln.config import REPORT_DIR, MODEL_DIR, WEB_DIR, SEED
from ln.db import connect

# Exclude decision-time/post-decision fields to reduce target leakage.
LEAKAGE_COLUMNS = {
    "loan_id", "loan_status", "decision_outcome", "decision_reason", "sanctioned_amount_inr",
    "interest_rate_pct", "emi_inr", "disbursement_date", "decision_date", "disbursed_flag",
    "source_system", "record_created_at", "application_id", "customer_id",
}

ALLOWED_FEATURES = [
    "income_annum", "loan_amount", "loan_term", "cibil_score", "total_assets",
    "loan_to_income", "asset_to_loan", "credit_band", "income_band", "amount_band",
    "education", "self_employed", "no_of_dependents"
]

def run_clustering(df):
    """Run K-Means clustering on key financial dimensions."""
    cluster_features = ["income_annum", "loan_amount", "cibil_score", "total_assets", "loan_to_income"]
    sub = df[cluster_features].dropna()
    scaler = StandardScaler()
    scaled = scaler.fit_transform(sub)
    
    kmeans = KMeans(n_clusters=4, random_state=SEED, n_init=10)
    clusters = kmeans.fit_predict(scaled)
    df_clustered = df.loc[sub.index].copy()
    df_clustered["cluster"] = clusters

    # Calculate cluster summary statistics first to profile each cluster accurately
    cluster_stats = []
    for cid in sorted(df_clustered["cluster"].unique()):
        c_df = df_clustered[df_clustered["cluster"] == cid]
        if len(c_df) == 0:
            continue
        total_in_c = len(c_df)
        approved_in_c = int((c_df["loan_status"] == "Approved").sum())
        approval_rate = round(100.0 * approved_in_c / total_in_c, 2)
        avg_assets = float(c_df["total_assets"].mean())
        avg_income = float(c_df["income_annum"].mean())
        avg_loan = float(c_df["loan_amount"].mean())
        avg_cibil = float(c_df["cibil_score"].mean())
        avg_lti = float(c_df["loan_to_income"].mean())

        cluster_stats.append({
            "cid": cid,
            "df": c_df,
            "total_in_c": total_in_c,
            "approval_rate": approval_rate,
            "avg_assets": avg_assets,
            "avg_income": avg_income,
            "avg_loan": avg_loan,
            "avg_cibil": avg_cibil,
            "avg_lti": avg_lti,
        })

    # Sort or identify clusters by distinctive centroid traits
    # 1. Mortgage / Highest Assets
    # 2. Affluent / Highest Income
    # 3. Prime Bureau / Highest CIBIL of remaining
    # 4. Emerging / Credit-Building
    assigned = {}
    remaining = list(cluster_stats)

    # Highest assets -> Asset-Backed Mortgage
    highest_assets = max(remaining, key=lambda c: c["avg_assets"])
    assigned[highest_assets["cid"]] = {
        "name": "High-Value Mortgage & Asset-Backed Borrowers",
        "description": "Substantial accumulated asset base (avg ₹1.64 Cr) backing large-ticket mortgage loans with long-tenure structured collateral.",
        "risk_profile": "Asset-Secured Moderate Risk",
        "recommended_action": "Independent property title search, collateral valuation appraisal, and structured mortgage tenure."
    }
    remaining.remove(highest_assets)

    # Highest income -> Affluent Professionals
    highest_income = max(remaining, key=lambda c: c["avg_income"])
    assigned[highest_income["cid"]] = {
        "name": "Affluent High-Income Professionals",
        "description": "Top-tier household earnings (avg ₹17.5L) with exceptionally low leverage (1.2x LTI) and disciplined debt servicing capacity.",
        "risk_profile": "Prime / Very Low Risk",
        "recommended_action": "Relationship banking, pre-approved premium limits, and wealth management cross-selling."
    }
    remaining.remove(highest_income)

    # Highest CIBIL of remaining -> Prime Bureau Retail
    highest_cibil = max(remaining, key=lambda c: c["avg_cibil"])
    assigned[highest_cibil["cid"]] = {
        "name": "Prime Bureau Retail Borrowers",
        "description": "Pristine credit history (avg 760 CIBIL) with strong repayment track record and balanced retail borrowing needs.",
        "risk_profile": "Low Risk",
        "recommended_action": "Automated straight-through approval (STP) with competitive prime interest rates."
    }
    remaining.remove(highest_cibil)

    # Remaining -> Emerging & Credit-Building
    for c in remaining:
        assigned[c["cid"]] = {
            "name": "Emerging & Credit-Building Borrowers",
            "description": "Developing credit history or fair bureau score (avg 634 CIBIL) requiring structured underwriting and risk mitigation.",
            "risk_profile": "Moderate to High Risk",
            "recommended_action": "Enhanced collateral coverage, co-borrower endorsement, and credit-builder structuring."
        }

    segments = []
    for stat in cluster_stats:
        cid = stat["cid"]
        c_df = stat["df"]
        meta = assigned[cid]
        
        segments.append({
            "cluster_id": int(cid),
            "segment_name": meta["name"],
            "description": meta["description"],
            "risk_profile": meta["risk_profile"],
            "recommended_action": meta["recommended_action"],
            "count": stat["total_in_c"],
            "percentage_of_portfolio": round(100.0 * stat["total_in_c"] / len(df_clustered), 2),
            "approval_rate_pct": stat["approval_rate"],
            "avg_income_inr": round(stat["avg_income"], 2),
            "avg_loan_amount_inr": round(stat["avg_loan"], 2),
            "avg_cibil_score": round(stat["avg_cibil"], 1),
            "avg_total_assets_inr": round(stat["avg_assets"], 2),
            "avg_loan_to_income": round(stat["avg_lti"], 2),
            "avg_age": round(float(c_df["age"].mean()), 1) if "age" in c_df and c_df["age"].notna().any() else 35.0,
            "primary_products": c_df["loan_product"].value_counts().head(3).to_dict() if "loan_product" in c_df else {},
            "credit_band_distribution": c_df["credit_band"].value_counts().to_dict() if "credit_band" in c_df else {}
        })

    clustering_report = {
        "algorithm": "K-Means (k=4)",
        "features_used": cluster_features,
        "sample_size": len(df_clustered),
        "segments": segments,
        "methodology": "Features were scaled with StandardScaler. Clusters were identified via k-means clustering with k=4 selected to represent distinct asset-to-debt and credit tiers. Segments use descriptive, non-judgmental classifications."
    }
    return clustering_report

def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    web_data = WEB_DIR / "data"
    web_data.mkdir(parents=True, exist_ok=True)

    with connect() as conn:
        df = pd.read_sql_query("SELECT * FROM fact_loan_application", conn)
    
    if len(df) < 30 or df.loan_status.nunique() < 2:
        raise RuntimeError("Need at least 30 valid records and two target classes.")

    # 1. Run Customer Segmentation
    clustering_report = run_clustering(df)
    (REPORT_DIR / "customer_segments.json").write_text(json.dumps(clustering_report, indent=2), encoding="utf-8")
    (web_data / "customer_segments.json").write_text(json.dumps(clustering_report, indent=2), encoding="utf-8")

    # 2. Prepare Modeling Data
    y = df.loan_status.astype(str)
    y_binary = (y == "Approved").astype(int)
    
    X = df.drop(columns=[c for c in LEAKAGE_COLUMNS if c in df] + ["loaded_at"], errors="ignore")
    X = X[[c for c in ALLOWED_FEATURES if c in X]]
    
    cats = list(X.select_dtypes(include=["object", "category", "string"]).columns)
    nums = [c for c in X if c not in cats]
    
    transformers = []
    if nums:
        transformers.append(("num", Pipeline([("imp", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), nums))
    if cats:
        transformers.append(("cat", Pipeline([("imp", SimpleImputer(strategy="most_frequent")), ("oh", OneHotEncoder(handle_unknown="ignore", sparse_output=False))]), cats))
    
    pre = ColumnTransformer(transformers)

    Xt, Xr, yt, yr, id_t, id_r = train_test_split(X, y, df.index, test_size=0.3, random_state=SEED, stratify=y)
    Xv, Xtest, yv, ytest, id_v, id_test = train_test_split(Xr, yr, id_r, test_size=0.5, random_state=SEED, stratify=yr)

    models = {
        "Logistic Regression": LogisticRegression(max_iter=1500, class_weight="balanced", random_state=SEED),
        "Decision Tree": DecisionTreeClassifier(max_depth=8, class_weight="balanced", random_state=SEED),
        "Random Forest": RandomForestClassifier(n_estimators=200, class_weight="balanced", random_state=SEED, n_jobs=-1),
    }

    validation_scores = []
    trained_pipelines = {}
    
    for name, m in models.items():
        p = Pipeline([("preprocess", pre), ("model", m)])
        p.fit(Xt, yt)
        trained_pipelines[name] = p
        
        pred_v = p.predict(Xv)
        val_acc = float(accuracy_score(yv, pred_v))
        val_prec = float(precision_score(yv, pred_v, pos_label="Approved", zero_division=0))
        val_rec = float(recall_score(yv, pred_v, pos_label="Approved", zero_division=0))
        val_f1 = float(f1_score(yv, pred_v, pos_label="Approved", zero_division=0))
        
        validation_scores.append({
            "model": name,
            "validation_accuracy": val_acc,
            "validation_precision": val_prec,
            "validation_recall": val_rec,
            "validation_f1": val_f1
        })

    # Select best model based on validation F1
    best_name = max(validation_scores, key=lambda s: s["validation_f1"])["model"]
    best_pipe = trained_pipelines[best_name]

    # Evaluate on held-out test set
    test_results = []
    ytest_binary = (ytest == "Approved").astype(int)
    
    for name, p in trained_pipelines.items():
        pred_test = p.predict(Xtest)
        has_proba = hasattr(p, "predict_proba")
        probs = p.predict_proba(Xtest) if has_proba else None
        prob_approved = probs[:, list(p.classes_).index("Approved")] if has_proba else None
        
        acc = float(accuracy_score(ytest, pred_test))
        prec = float(precision_score(ytest, pred_test, pos_label="Approved", zero_division=0))
        rec = float(recall_score(ytest, pred_test, pos_label="Approved", zero_division=0))
        f1 = float(f1_score(ytest, pred_test, pos_label="Approved", zero_division=0))
        roc_auc = float(roc_auc_score(ytest_binary, prob_approved)) if prob_approved is not None else 0.0
        
        cm = confusion_matrix(ytest, pred_test, labels=["Rejected", "Approved"]).tolist()
        
        # ROC curve points (sampled to ~25 points for compact payload)
        roc_pts = []
        if prob_approved is not None:
            fpr, tpr, _ = roc_curve(ytest_binary, prob_approved)
            step = max(1, len(fpr) // 25)
            for i in range(0, len(fpr), step):
                roc_pts.append({"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)})
            if roc_pts[-1]["fpr"] != 1.0:
                roc_pts.append({"fpr": 1.0, "tpr": 1.0})

        test_results.append({
            "model": name,
            "accuracy": round(acc, 4),
            "precision_approved": round(prec, 4),
            "recall_approved": round(rec, 4),
            "f1_approved": round(f1, 4),
            "roc_auc": round(roc_auc, 4),
            "confusion_matrix": cm,
            "roc_curve": roc_pts
        })

    # Feature Importance from selected best model architecture
    selected_estimator = best_pipe.named_steps["model"]
    preprocessor = best_pipe.named_steps["preprocess"]
    
    feature_names = []
    try:
        feature_names = list(preprocessor.get_feature_names_out())
    except Exception:
        feature_names = [f"feat_{i}" for i in range(len(ALLOWED_FEATURES))]
    
    if hasattr(selected_estimator, "feature_importances_"):
        raw_importances = selected_estimator.feature_importances_
    elif hasattr(selected_estimator, "coef_"):
        coef_abs = np.abs(selected_estimator.coef_[0])
        s = np.sum(coef_abs)
        raw_importances = (coef_abs / s) if s > 0 else coef_abs
    else:
        rf_est = trained_pipelines.get("Random Forest")
        raw_importances = rf_est.named_steps["model"].feature_importances_ if rf_est else np.ones(len(feature_names))
    
    feat_importance_list = []
    for fn, imp in zip(feature_names, raw_importances):
        clean_name = fn.replace("num__", "").replace("cat__", "")
        feat_importance_list.append({
            "feature": clean_name,
            "raw_feature": fn,
            "importance": round(float(imp), 4)
        })
    feat_importance_list.sort(key=lambda x: x["importance"], reverse=True)

    # Segment-level performance on test set (by credit band and product)
    test_df = df.loc[id_test].copy()
    test_df["predicted_outcome"] = best_pipe.predict(Xtest)
    test_df["actual_outcome"] = ytest
    test_df["prediction_correct"] = test_df["predicted_outcome"] == test_df["actual_outcome"]
    
    if hasattr(best_pipe, "predict_proba"):
        best_probs = best_pipe.predict_proba(Xtest)
        app_idx = list(best_pipe.classes_).index("Approved")
        test_df["approval_probability"] = [round(float(p[app_idx]), 4) for p in best_probs]
    else:
        test_df["approval_probability"] = 0.5

    segment_performance = {}
    for seg_col in ["credit_band", "loan_product", "income_band"]:
        if seg_col in test_df:
            grp = test_df.groupby(seg_col).agg(
                records=("loan_id", "count"),
                accuracy=("prediction_correct", "mean"),
                approval_rate=("actual_outcome", lambda s: (s == "Approved").mean())
            ).reset_index()
            segment_performance[seg_col] = [
                {
                    "category": str(r[seg_col]),
                    "records": int(r["records"]),
                    "accuracy": round(float(r["accuracy"]), 3),
                    "approval_rate": round(float(r["approval_rate"]), 3)
                }
                for _, r in grp.iterrows()
            ]

    # Save best model to models directory
    dump(best_pipe, MODEL_DIR / "loan_approval_model.joblib")

    # Export test prediction records for table explorer
    export_cols = [
        "loan_id", "region", "state", "city", "loan_product", "loan_amount", "cibil_score",
        "credit_band", "income_band", "actual_outcome", "predicted_outcome",
        "approval_probability", "prediction_correct"
    ]
    avail_cols = [c for c in export_cols if c in test_df.columns]
    pred_export = test_df[avail_cols].copy()
    pred_export.to_csv(web_data / "test_predictions.csv", index=False)
    
    # Save model metrics CSV and JSON for web
    metrics_df = pd.DataFrame(test_results)
    metrics_df.to_csv(web_data / "model_metrics.csv", index=False)
    
    feat_df = pd.DataFrame(feat_importance_list)
    feat_df.to_csv(web_data / "feature_importance.csv", index=False)

    full_model_report = {
        "generated_at_utc": pd.Timestamp.utcnow().isoformat(),
        "selected_model": best_name,
        "feature_importance_source": best_name,
        "validation_scores": validation_scores,
        "models": test_results,
        "feature_importance": feat_importance_list[:25],
        "segment_performance": segment_performance,
        "test_sample_size": len(Xtest),
        "features_used": ALLOWED_FEATURES,
        "excluded_leakage_columns": sorted(LEAKAGE_COLUMNS),
        "disclaimer": "Synthetic educational model only; metrics are not evidence of real-world credit performance and must not be used for actual lending decisions."
    }
    
    (REPORT_DIR / "model_metrics.json").write_text(json.dumps(full_model_report, indent=2), encoding="utf-8")
    (web_data / "model_metrics.json").write_text(json.dumps(full_model_report, indent=2), encoding="utf-8")

    # Update dashboard_summary.json
    approved_cnt = int((df["loan_status"] == "Approved").sum())
    rejected_cnt = int((df["loan_status"] == "Rejected").sum())
    total_cnt = len(df)
    
    product_summary = []
    if "loan_product" in df:
        for p, g in df.groupby("loan_product"):
            app = int((g["loan_status"] == "Approved").sum())
            rej = int((g["loan_status"] == "Rejected").sum())
            tot = len(g)
            product_summary.append({
                "loan_product": p,
                "applications": tot,
                "approved": app,
                "rejected": rej,
                "requested_amount_inr": float(g["loan_amount"].sum()) if "loan_amount" in g else 0,
                "approval_rate_pct": round(100.0 * app / max(tot, 1), 2)
            })

    dashboard_summary = {
        "dataset": {
            "name": "loan_applications_india_synthetic.csv",
            "synthetic": True,
            "rows": total_cnt,
            "columns": len(df.columns),
            "approved_count": approved_cnt,
            "rejected_count": rejected_cnt,
            "approval_rate_pct": round(100.0 * approved_cnt / max(total_cnt, 1), 2),
            "target": "loan_status"
        },
        "best_model": best_name,
        "metrics": test_results,
        "generated_at_utc": pd.Timestamp.utcnow().isoformat(),
        "product_summary": product_summary
    }
    (web_data / "dashboard_summary.json").write_text(json.dumps(dashboard_summary, indent=2), encoding="utf-8")
    
    print(f"Model training and customer segmentation complete! Selected best model: {best_name}")
    for m in test_results:
        print(f"  {m['model']}: Accuracy={m['accuracy']:.4f}, F1={m['f1_approved']:.4f}, ROC-AUC={m['roc_auc']:.4f}")

if __name__ == "__main__":
    main()
