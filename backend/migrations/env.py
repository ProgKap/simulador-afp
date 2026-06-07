from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context
from dotenv import load_dotenv
import os

load_dotenv()

from app.database import Base
import app.models_db

config = context.config
fileConfig(config.config_file_name)
target_metadata = Base.metadata


def runMigrations():
    url = os.getenv("DATABASE_URL")
    connectable = create_engine(url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


runMigrations()