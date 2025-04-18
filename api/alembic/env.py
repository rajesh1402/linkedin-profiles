import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# Ensure the parent directory (api/) is in sys.path for absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load .env and set DATABASE_URL in os.environ if missing
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
if not os.environ.get('DATABASE_URL'):
    raise RuntimeError('DATABASE_URL not found in environment. Check your .env file.')

config = context.config
fileConfig(config.config_file_name)

from models import Base

target_metadata = Base.metadata

def run_migrations_offline():
    url = os.environ['DATABASE_URL']
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True, compare_type=True
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata, compare_type=True
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
