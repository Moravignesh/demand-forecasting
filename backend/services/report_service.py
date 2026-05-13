import json
import os
import pandas as pd
from io import BytesIO
from sqlalchemy.orm import Session
from models.forecast import Forecast
from models.dataset import Dataset
from fastapi import HTTPException


def generate_excel_report(db: Session, forecast_id: int, user_id: int) -> BytesIO:
    forecast = db.query(Forecast).filter(Forecast.id == forecast_id, Forecast.user_id == user_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    if forecast.status != "completed":
        raise HTTPException(status_code=400, detail="Forecast not completed")

    predictions = json.loads(forecast.predictions)
    output = BytesIO()

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        # Summary sheet
        summary_data = {
            "Metric": ["Model Type", "Periods Forecasted", "Target Column", "Date Column",
                       "MAE (Mean Absolute Error)", "R² Score", "Status", "Created At"],
            "Value": [
                forecast.model_type.replace("_", " ").title(),
                forecast.periods,
                forecast.target_column,
                forecast.date_column,
                round(forecast.accuracy, 4) if forecast.accuracy else "N/A",
                round(forecast.r2_score, 4) if forecast.r2_score else "N/A",
                forecast.status,
                str(forecast.created_at)
            ]
        }
        pd.DataFrame(summary_data).to_excel(writer, sheet_name="Summary", index=False)

        # Future predictions
        if predictions.get("future"):
            future_df = pd.DataFrame(predictions["future"])
            future_df.columns = [c.title() for c in future_df.columns]
            future_df.to_excel(writer, sheet_name="Future Predictions", index=False)

        # Historical predictions
        if predictions.get("historical"):
            hist_df = pd.DataFrame(predictions["historical"])
            hist_df.columns = [c.title() for c in hist_df.columns]
            hist_df.to_excel(writer, sheet_name="Historical Data", index=False)

    output.seek(0)
    return output


def generate_pdf_report(db: Session, forecast_id: int, user_id: int) -> BytesIO:
    try:
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    except ImportError:
        raise HTTPException(status_code=500, detail="ReportLab not installed")

    forecast = db.query(Forecast).filter(Forecast.id == forecast_id, Forecast.user_id == user_id).first()
    if not forecast:
        raise HTTPException(status_code=404, detail="Forecast not found")
    if forecast.status != "completed":
        raise HTTPException(status_code=400, detail="Forecast not completed")

    predictions = json.loads(forecast.predictions)
    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=A4, topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=18,
                                  textColor=colors.HexColor("#1e3a5f"), spaceAfter=12)
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], fontSize=13,
                                    textColor=colors.HexColor("#2563eb"), spaceAfter=8)

    story = []
    story.append(Paragraph("AI Demand Forecasting Report", title_style))
    story.append(Spacer(1, 0.2*inch))

    # Summary table
    story.append(Paragraph("Forecast Summary", heading_style))
    summary = [
        ["Metric", "Value"],
        ["Model Type", forecast.model_type.replace("_", " ").title()],
        ["Periods Forecasted", str(forecast.periods)],
        ["Target Column", forecast.target_column or "N/A"],
        ["Date Column", forecast.date_column or "N/A"],
        ["MAE", str(round(forecast.accuracy, 4)) if forecast.accuracy else "N/A"],
        ["R² Score", str(round(forecast.r2_score, 4)) if forecast.r2_score else "N/A"],
        ["Generated At", str(forecast.created_at)[:19]],
    ]
    t = Table(summary, colWidths=[2.5*inch, 3.5*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f1f5f9")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3*inch))

    # Future predictions table (first 20)
    future = predictions.get("future", [])[:20]
    if future:
        story.append(Paragraph("Future Demand Predictions (First 20)", heading_style))
        rows = [["Date", "Predicted Demand"]]
        for r in future:
            rows.append([r["date"], str(r["predicted"])])
        ft = Table(rows, colWidths=[2.5*inch, 3.5*inch])
        ft.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563eb")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#eff6ff")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#bfdbfe")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(ft)

    doc.build(story)
    output.seek(0)
    return output
