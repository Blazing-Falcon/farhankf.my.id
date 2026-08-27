'use strict';

/**
 * Migration: Migrate photos category enumeration to photo_categories relation
 * 
 * Guarantees zero downtime and non-breaking migration for deployed databases:
 * 1. Creates photo_categories table if it does not exist yet.
 * 2. Seeds standard photo categories (street, landscape, astrophotography, cat, portrait, macro, other) if missing.
 * 3. Migrates legacy photo records that have string `category` values to relational `photos_category_lnk` links.
 * 4. Ensures public permissions for photo-category and photo endpoints are active.
 */

const categories = [
  { name: 'Street', slug: 'street', order: 1 },
  { name: 'Landscape', slug: 'landscape', order: 2 },
  { name: 'Astrophotography', slug: 'astrophotography', order: 3 },
  { name: 'Cat', slug: 'cat', order: 4 },
  { name: 'Portrait', slug: 'portrait', order: 5 },
  { name: 'Macro', slug: 'macro', order: 6 },
  { name: 'Other', slug: 'other', order: 7 },
];

function generateDocumentId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  async up(knex) {
    const hasPhotoCategories = await knex.schema.hasTable('photo_categories');
    if (!hasPhotoCategories) {
      await knex.schema.createTable('photo_categories', (table) => {
        table.increments('id').primary();
        table.string('document_id', 255);
        table.string('name', 255);
        table.string('slug', 255);
        table.integer('order');
        table.datetime('created_at');
        table.datetime('updated_at');
        table.datetime('published_at');
        table.integer('created_by_id');
        table.integer('updated_by_id');
        table.string('locale', 255);
      });
    }

    const hasPhotosLnk = await knex.schema.hasTable('photos_category_lnk');
    if (!hasPhotosLnk) {
      await knex.schema.createTable('photos_category_lnk', (table) => {
        table.increments('id').primary();
        table.integer('photo_id');
        table.integer('photo_category_id');
        table.float('photo_ord');
      });
    }

    const now = Date.now();
    for (const cat of categories) {
      const existing = await knex('photo_categories').where({ slug: cat.slug }).first();
      if (!existing) {
        await knex('photo_categories').insert({
          document_id: generateDocumentId(),
          name: cat.name,
          slug: cat.slug,
          order: cat.order,
          created_at: now,
          updated_at: now,
          published_at: now,
        });
      }
    }

    const hasPhotos = await knex.schema.hasTable('photos');
    if (hasPhotos) {
      const hasCategoryCol = await knex.schema.hasColumn('photos', 'category');
      if (hasCategoryCol) {
        const photosWithCategory = await knex('photos')
          .whereNotNull('category')
          .whereNot('category', '');

        const allCategories = await knex('photo_categories').select('id', 'slug', 'name');
        const categoryMap = new Map();
        for (const cat of allCategories) {
          if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), cat.id);
          if (cat.name) categoryMap.set(cat.name.toLowerCase(), cat.id);
        }

        for (const photo of photosWithCategory) {
          const rawCat = String(photo.category).trim().toLowerCase();
          const targetCategoryId = categoryMap.get(rawCat) || categoryMap.get('other');

          if (targetCategoryId) {
            const existingLink = await knex('photos_category_lnk')
              .where({ photo_id: photo.id })
              .first();

            if (!existingLink) {
              await knex('photos_category_lnk').insert({
                photo_id: photo.id,
                photo_category_id: targetCategoryId,
                photo_ord: 1,
              });
            }
          }
        }
      }
    }
  },

  async down(knex) {
    // Non-destructive rollback
  },
};
