"""Initial database migration: UHCR and Manufacturer Data Schema v1.0.

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-11-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. manufacturers
    op.create_table(
        'manufacturers',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=255), nullable=False),
        sa.Column('country_of_origin', sa.String(length=100), nullable=True),
        sa.Column('supported_markets', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.Column('website', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='ACTIVE', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
    )

    # 2. catalogue_versions
    op.create_table(
        'catalogue_versions',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('manufacturer_id', sa.UUID(), nullable=False),
        sa.Column('market', sa.String(length=100), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='DRAFT', nullable=False),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('supersedes_version_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['manufacturer_id'], ['manufacturers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['supersedes_version_id'], ['catalogue_versions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_catalogue_version', 'catalogue_versions', ['manufacturer_id', 'market', 'status'], unique=False)

    # 3. source_documents
    op.create_table(
        'source_documents',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('manufacturer_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('publisher', sa.Text(), nullable=True),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('market', sa.String(length=100), nullable=True),
        sa.Column('language', sa.String(length=10), nullable=True),
        sa.Column('document_version', sa.String(length=50), nullable=True),
        sa.Column('published_date', sa.Date(), nullable=True),
        sa.Column('effective_date', sa.Date(), nullable=True),
        sa.Column('retrieved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('checksum', sa.String(length=128), nullable=True),
        sa.Column('permission_status', sa.String(length=30), server_default='PENDING', nullable=False),
        sa.Column('verification_status', sa.String(length=30), server_default='UNVERIFIED', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['manufacturer_id'], ['manufacturers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # 4. product_lines
    op.create_table(
        'product_lines',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('manufacturer_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('service_type', sa.String(length=50), nullable=False),
        sa.Column('market', sa.String(length=100), nullable=False),
        sa.Column('status', sa.String(length=20), server_default='ACTIVE', nullable=False),
        sa.Column('catalogue_version_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['catalogue_version_id'], ['catalogue_versions.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['manufacturer_id'], ['manufacturers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # 5. manufacturer_products
    op.create_table(
        'manufacturer_products',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('product_line_id', sa.UUID(), nullable=False),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('product_code', sa.String(length=100), nullable=True),
        sa.Column('product_type', sa.String(length=50), nullable=False),
        sa.Column('market', sa.String(length=100), nullable=False),
        sa.Column('active_status', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('source_document_id', sa.UUID(), nullable=True),
        sa.Column('verification_status', sa.String(length=30), server_default='UNVERIFIED', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_line_id'], ['product_lines.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_document_id'], ['source_documents.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # 6. manufacturer_shades
    op.create_table(
        'manufacturer_shades',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('shade_code', sa.String(length=50), nullable=False),
        sa.Column('shade_name', sa.String(length=255), nullable=True),
        sa.Column('manufacturer_depth', sa.String(length=50), nullable=True),
        sa.Column('manufacturer_tone_code', sa.String(length=50), nullable=True),
        sa.Column('manufacturer_family', sa.String(length=100), nullable=True),
        sa.Column('original_description', sa.Text(), nullable=True),
        sa.Column('market', sa.String(length=100), nullable=False),
        sa.Column('active_status', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('catalogue_version_id', sa.UUID(), nullable=False),
        sa.Column('source_document_id', sa.UUID(), nullable=True),
        sa.Column('verification_status', sa.String(length=30), server_default='UNVERIFIED', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['catalogue_version_id'], ['catalogue_versions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['manufacturer_products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_document_id'], ['source_documents.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id', 'market', 'catalogue_version_id', 'shade_code', name='uq_product_market_cat_shade'),
    )
    op.create_index('idx_shades_market', 'manufacturer_shades', ['market'], unique=False)
    op.create_index('idx_shades_product_code', 'manufacturer_shades', ['product_id', 'shade_code'], unique=False)

    # 7. shade_mappings
    op.create_table(
        'shade_mappings',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('manufacturer_shade_id', sa.UUID(), nullable=False),
        sa.Column('uhcr_level', sa.SmallInteger(), nullable=False),
        sa.Column('primary_tone', sa.String(length=50), nullable=False),
        sa.Column('secondary_tone', sa.String(length=50), nullable=True),
        sa.Column('tone_intensity', sa.String(length=30), server_default='UNKNOWN', nullable=False),
        sa.Column('colour_family', sa.String(length=50), nullable=True),
        sa.Column('mapping_method', sa.String(length=50), nullable=False),
        sa.Column('mapping_confidence', sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column('verification_status', sa.String(length=30), server_default='UNVERIFIED', nullable=False),
        sa.Column('evidence_reference', sa.UUID(), nullable=True),
        sa.Column('reviewer_id', sa.UUID(), nullable=True),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint('uhcr_level >= 1 AND uhcr_level <= 10', name='ck_shade_mapping_uhcr_level_range'),
        sa.CheckConstraint('mapping_confidence >= 0.0 AND mapping_confidence <= 1.0', name='ck_shade_mapping_confidence_range'),
        sa.ForeignKeyConstraint(['manufacturer_shade_id'], ['manufacturer_shades.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_shade_mapping_level', 'shade_mappings', ['uhcr_level'], unique=False)

    # 8. developers
    op.create_table(
        'developers',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('manufacturer_id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=True),
        sa.Column('product_name', sa.String(length=255), nullable=False),
        sa.Column('concentration_percent', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('concentration_type', sa.String(length=30), nullable=False),
        sa.Column('intended_use', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('market', sa.String(length=100), nullable=False),
        sa.Column('source_document_id', sa.UUID(), nullable=True),
        sa.Column('verification_status', sa.String(length=30), server_default='UNVERIFIED', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['manufacturer_id'], ['manufacturers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['manufacturer_products.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['source_document_id'], ['source_documents.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # 9. product_rules
    op.create_table(
        'product_rules',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('market', sa.String(length=100), nullable=False),
        sa.Column('service_type', sa.String(length=50), nullable=False),
        sa.Column('rule_type', sa.String(length=50), nullable=False),
        sa.Column('conditions', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('actions', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('priority', sa.Integer(), server_default='0', nullable=False),
        sa.Column('source_document_id', sa.UUID(), nullable=True),
        sa.Column('source_section', sa.Text(), nullable=True),
        sa.Column('effective_from', sa.Date(), nullable=True),
        sa.Column('effective_until', sa.Date(), nullable=True),
        sa.Column('verification_status', sa.String(length=30), server_default='UNVERIFIED', nullable=False),
        sa.Column('rule_version', sa.String(length=20), server_default='1.0', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['manufacturer_products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_document_id'], ['source_documents.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_product_rules_product', 'product_rules', ['product_id'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_product_rules_product', table_name='product_rules')
    op.drop_table('product_rules')
    op.drop_table('developers')
    op.drop_index('idx_shade_mapping_level', table_name='shade_mappings')
    op.drop_table('shade_mappings')
    op.drop_index('idx_shades_product_code', table_name='manufacturer_shades')
    op.drop_index('idx_shades_market', table_name='manufacturer_shades')
    op.drop_table('manufacturer_shades')
    op.drop_table('manufacturer_products')
    op.drop_table('product_lines')
    op.drop_table('source_documents')
    op.drop_index('idx_catalogue_version', table_name='catalogue_versions')
    op.drop_table('catalogue_versions')
    op.drop_table('manufacturers')
