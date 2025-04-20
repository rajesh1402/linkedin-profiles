"""
Revision ID: b7c8d9e0f1a2
Revises: a1b2c3d4e5f6
Create Date: 2025-04-19
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b7c8d9e0f1a2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('profiles', sa.Column('about', sa.String(), nullable=True))
    op.add_column('profiles', sa.Column('notes', sa.String(), nullable=True))

def downgrade():
    op.drop_column('profiles', 'about')
    op.drop_column('profiles', 'notes')
