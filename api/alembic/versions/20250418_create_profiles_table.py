"""
Revision ID: 20250418_create_profiles_table
Revises: 
Create Date: 2025-04-18
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250418_create_profiles_table'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'profiles',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('name', sa.String, nullable=False),
        sa.Column('headline', sa.String, nullable=False),
        sa.Column('url', sa.String, unique=True, nullable=False),
        sa.Column('current_title', sa.String, nullable=False),
        sa.Column('location', sa.String, nullable=False),
        sa.Column('profile_pic', sa.String, nullable=True)
    )

def downgrade():
    op.drop_table('profiles')
