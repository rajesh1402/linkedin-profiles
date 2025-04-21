"""create companies table

Revision ID: c123456789ab
Revises: b7c8d9e0f1a2
Create Date: 2025-04-20 22:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c123456789ab'
down_revision = 'b7c8d9e0f1a2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'companies',
        sa.Column('id', sa.Integer, primary_key=True, index=True),
        sa.Column('name', sa.String, nullable=False),
        sa.Column('industry', sa.String, nullable=True),
        sa.Column('location', sa.String, nullable=True),
        sa.Column('website', sa.String, nullable=True),
        sa.Column('linkedin_url', sa.String, unique=True, nullable=False),
        sa.Column('profile_pic', sa.String, nullable=True),
        sa.Column('about', sa.String, nullable=True),
        sa.Column('notes', sa.String, nullable=True),
        sa.Column('date_saved', sa.String, nullable=True)
    )

def downgrade():
    op.drop_table('companies')
