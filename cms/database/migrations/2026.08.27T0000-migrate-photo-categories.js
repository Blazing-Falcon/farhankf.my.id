'use strict';

/**
 * Migration: Migrate photos category enumeration to photo_categories relation
 *
 * 1. Creates photo_categories and photos_category_lnk if they do not exist yet.
 * 2. Seeds the standard photo categories as draft/published document pairs.
 * 3. Back-fills links for legacy photo rows that still carry a string `category`
 *    column. Once Strapi's schema sync has dropped that column the back-fill can
 *    no longer run, so a database that reaches this migration late keeps its
 *    photos uncategorised.
 */

const { photoCategories } = require('../../src/categories.json');

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
        table.integer('photo_id').references('id').inTable('photos').onDelete('CASCADE');
        table.integer('photo_category_id').references('id').inTable('photo_categories').onDelete('CASCADE');
        table.float('photo_ord');
      });
    }

    const now = Date.now();
    for (const cat of photoCategories) {
      const existing = await knex('photo_categories').where({ slug: cat.slug }).first();
      if (!existing) {
        // Draft-and-publish needs two rows per document: a draft and a published one.
        const documentId = generateDocumentId();
        const base = {
          document_id: documentId,
          name: cat.name,
          slug: cat.slug,
          order: cat.order,
          created_at: now,
          updated_at: now,
        };
        await knex('photo_categories').insert({ ...base, published_at: null });
        await knex('photo_categories').insert({ ...base, published_at: now });
      }
    }

    const hasPhotos = await knex.schema.hasTable('photos');
    const hasCategoryCol = hasPhotos && (await knex.schema.hasColumn('photos', 'category'));
    if (!hasCategoryCol) {
      console.info(
        '[migrate-photo-categories] Legacy `photos.category` column is absent; skipping back-fill of photos_category_lnk.'
      );
      return;
    }

    const photosWithCategory = await knex('photos').whereNotNull('category').whereNot('category', '');

    const allCategories = await knex('photo_categories').select('id', 'slug', 'name', 'published_at');
    const categoryMap = new Map();
    for (const cat of allCategories) {
      const target = categoryMap.get(cat.slug && cat.slug.toLowerCase()) || {};
      const entry = { ...target, [cat.published_at ? 'published' : 'draft']: cat.id };
      if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), entry);
      if (cat.name) categoryMap.set(cat.name.toLowerCase(), entry);
    }

    let linked = 0;
    for (const photo of photosWithCategory) {
      const rawCat = String(photo.category).trim().toLowerCase();
      const target = categoryMap.get(rawCat) || categoryMap.get('other');
      // Strapi pairs a draft entry with a draft relation and a published one with a published relation.
      const targetCategoryId = target && (photo.published_at ? target.published : target.draft);
      if (!targetCategoryId) continue;

      const existingLink = await knex('photos_category_lnk').where({ photo_id: photo.id }).first();
      if (!existingLink) {
        await knex('photos_category_lnk').insert({
          photo_id: photo.id,
          photo_category_id: targetCategoryId,
          photo_ord: 1,
        });
        linked += 1;
      }
    }

    console.info(
      `[migrate-photo-categories] Back-filled ${linked} of ${photosWithCategory.length} legacy photo category values.`
    );
  },

  async down(knex) {
    // Non-destructive rollback
  },
};
