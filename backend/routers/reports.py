from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from services.auth_service import get_current_user
from services.report_service import generate_excel_report, generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/{forecast_id}/excel")
def download_excel(forecast_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    output = generate_excel_report(db, forecast_id, current_user.id)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=forecast_{forecast_id}_report.xlsx"}
    )


@router.get("/{forecast_id}/pdf")
def download_pdf(forecast_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    output = generate_pdf_report(db, forecast_id, current_user.id)
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=forecast_{forecast_id}_report.pdf"}
    )
