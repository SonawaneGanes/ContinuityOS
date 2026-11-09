from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    status = Column(String(30), default="draft", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    documents = relationship(
        "Document", back_populates="project", cascade="all, delete-orphan"
    )
    claims = relationship(
        "Claim", back_populates="project", cascade="all, delete-orphan"
    )


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    project = relationship("Project", back_populates="documents")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)

    kind = Column(String(20))
    subject = Column(String(255))
    owner = Column(String(100), nullable=True)
    due_date = Column(String(20), nullable=True)
    status = Column(String(30), nullable=True)
    depends_on = Column(String(255), nullable=True)
    last_updated = Column(String(20), nullable=True)

    quote = Column(Text)
    start_char = Column(Integer)
    end_char = Column(Integer)
    label = Column(String(20), default="VERIFIED", nullable=False)

    project = relationship("Project", back_populates="claims")
