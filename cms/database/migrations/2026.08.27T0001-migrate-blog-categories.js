'use strict';

/**
 * Migration: Migrate blog_posts category enumeration to blog_categories relation
 * 
 * Guarantees zero downtime and non-breaking migration for deployed databases:
 * 1. Creates blog_categories table if it does not exist yet.
 * 2. Seeds standard blog categories (engineering, design, data-science, notes, cats) if missing.
 * 3. Migrates existing blog_post records that have string `category` values to relational `blog_posts_category_lnk` links.
 */

const categories = [
  { name: 'Engineering', slug: 'engineering', order: 1 },
  { name: 'Design', slug: 'design', order: 2 },
  { name: 'Data Science', slug: 'data-science', order: 3 },
  { name: 'Notes', slug: 'notes', order: 4 },
  { name: 'Cats', slug: 'cats', order: 5 },
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
        table.integer('blog_post_id');
        table.integer('blog_category_id');
        table.float('blog_post_ord');
      });
    }

    const now = Date.now();
    for (const cat of categories) {
      const existing = await knex('blog_categories').where({ slug: cat.slug }).first();
      if (!existing) {
        await knex('blog_categories').insert({
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

    const hasBlogPosts = await knex.schema.hasTable('blog_posts');
    if (hasBlogPosts) {
      const hasCategoryCol = await knex.schema.hasColumn('blog_posts', 'category');
      if (hasCategoryCol) {
        const postsWithCategory = await knex('blog_posts')
          .whereNotNull('category')
          .whereNot('category', '');

        const allCategories = await knex('blog_categories').select('id', 'slug', 'name');
        const categoryMap = new Map();
        for (const cat of allCategories) {
          if (cat.slug) categoryMap.set(cat.slug.toLowerCase(), cat.id);
          if (cat.name) categoryMap.set(cat.name.toLowerCase(), cat.id);
        }

        for (const post of postsWithCategory) {
          const rawCat = String(post.category).trim().toLowerCase();
          const targetCategoryId = categoryMap.get(rawCat) || categoryMap.get('engineering');

          if (targetCategoryId) {
            const existingLink = await knex('blog_posts_category_lnk')
              .where({ blog_post_id: post.id })
              .first();

            if (!existingLink) {
              await knex('blog_posts_category_lnk').insert({
                blog_post_id: post.id,
                blog_category_id: targetCategoryId,
                blog_post_ord: 1,
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
