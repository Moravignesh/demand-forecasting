from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    model_type = Column(String(50), default="linear_regression")  # linear_regression, prophet
    periods = Column(Integer, default=30)
    accuracy = Column(Float, nullable=True)    # MAE or MAPE
    r2_score = Column(Float, nullable=True)
    predictions = Column(Text, nullable=True)  # JSON string
    feature_column = Column(String(255), nullable=True)
    target_column = Column(String(255), nullable=True)
    date_column = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")  # pending, completed, error
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="forecasts")
