'use strict';

/**
 * Migration: Migrate blog_posts category enumeration to blog_categories relation
 *
 * 1. Creates blog_categories and blog_posts_category_lnk if they do not exist yet.
 * 2. Seeds the standard blog categories as draft/published document pairs.
 * 3. Back-fills links for legacy blog_post rows that still carry a string `category`
 *    column. Once Strapi's schema sync has dropped that column the back-fill can no
 *    longer run, so a database that reaches this migration late keeps its posts
 *    uncategorised.
 */

const { blogCategories } = require('../../src/categories.json');

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
    const hasBlogCategories = await knex.schema.hasTable('blog_categories');
    if (!hasBlogCategories) {
      await knex.schema.createTable('blog_categories', (table) => {
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

    const hasBlogPostsLnk = await knex.schema.hasTable('blog_posts_category_lnk');
    if (!hasBlogPostsLnk) {
      await knex.schema.createTable('blog_posts_category_lnk', (table) => {
        table.increments('id').primary();
        table.integer('blog_post_id').references('id').inTable('blog_posts').onDelete('CASCADE');
        table
          .integer('blog_category_id')
          .references('id')
          .inTable('blog_categories')
          .onDelete('CASCADE');
        table.float('blog_post_ord');
      });
    }

    const now = Date.now();
    for (const cat of blogCategories) {
      const existing = await knex('blog_categories').where({ slug: cat.slug }).first();
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
        await knex('blog_categories').insert({ ...base, published_at: null });
        await knex('blog_categories').insert({ ...base, published_at: now });
      }
    }

    const hasBlogPosts = await knex.schema.hasTable('blog_posts');
    const hasCategoryCol = hasBlogPosts && (await knex.schema.hasColumn('blog_posts', 'category'));
    if (!hasCategoryCol) {
      console.info(
        '[migrate-blog-categories] Legacy `blog_posts.category` column is absent; skipping back-fill of blog_posts_category_lnk.'
      );
      return;
    }

    const postsWithCategory = await knex('blog_posts').whereNotNull('category').whereNot('category', '');

    const allCategories = await knex('blog_categories').select('id', 'slug', 'name', 'published_at');
    const categoryMap = new Map();
    for (const cat of allCategories) {
      const target = categoryMap.get(cat.slug && cat.slug.toLowerCase()) || {};
      const entry = { ...target, [cat.published_at ? 'published' : 'draft']: cat.id };
      if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), entry);
      if (cat.name) categoryMap.set(cat.name.toLowerCase(), entry);
    }

    let linked = 0;
    for (const post of postsWithCategory) {
      const rawCat = String(post.category).trim().toLowerCase();
      const target = categoryMap.get(rawCat) || categoryMap.get('engineering');
      // Strapi pairs a draft entry with a draft relation and a published one with a published relation.
      const targetCategoryId = target && (post.published_at ? target.published : target.draft);
      if (!targetCategoryId) continue;

      const existingLink = await knex('blog_posts_category_lnk').where({ blog_post_id: post.id }).first();
      if (!existingLink) {
        await knex('blog_posts_category_lnk').insert({
          blog_post_id: post.id,
          blog_category_id: targetCategoryId,
          blog_post_ord: 1,
        });
        linked += 1;
      }
    }

    console.info(
      `[migrate-blog-categories] Back-filled ${linked} of ${postsWithCategory.length} legacy blog post category values.`
    );
  },

  async down(knex) {
    // Non-destructive rollback
  },
};
