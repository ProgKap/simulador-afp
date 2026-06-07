from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase
from app.config import settings


class Base(DeclarativeBase):
    pass


def getEngine():
    return create_engine(settings.DATABASE_URL)