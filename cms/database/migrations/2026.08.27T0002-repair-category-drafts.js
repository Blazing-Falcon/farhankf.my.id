'use strict';

/**
 * Migration: Repair category documents created by the earlier category migrations
 *
 * Those migrations inserted a single published row per category and linked both the
 * draft and the published row of a photo/post to it. This migration repairs already
 * migrated databases:
 * 1. Adds the missing draft row for every published category document, without which
 *    the category is invisible in the admin content manager.
 * 2. Re-points relation links so a draft entry references the draft category and a
 *    published entry references the published one.
 * 3. Rebuilds blog_posts_category_lnk with the cascading foreign keys Strapi
 *    generates, which the hand-written table creation left out.
 *
 * Every step is idempotent.
 */

const CATEGORY_TABLES = [
  { table: 'photo_categories', link: 'photos_category_lnk', source: 'photos', sourceColumn: 'photo_id', targetColumn: 'photo_category_id' },
  { table: 'blog_categories', link: 'blog_posts_category_lnk', source: 'blog_posts', sourceColumn: 'blog_post_id', targetColumn: 'blog_category_id' },
];

async function addMissingDrafts(knex, table) {
  const rows = await knex(table).whereNotNull('published_at');
  const draftDocumentIds = new Set(
    (await knex(table).whereNull('published_at').select('document_id')).map((r) => r.document_id)
  );

  let created = 0;
  for (const row of rows) {
    if (draftDocumentIds.has(row.document_id)) continue;
    const { id, ...rest } = row;
    await knex(table).insert({ ...rest, published_at: null });
    draftDocumentIds.add(row.document_id);
    created += 1;
  }
  console.info(`[repair-category-drafts] Added ${created} missing draft rows to ${table}.`);
}

async function repairLinks(knex, { table, link, source, sourceColumn, targetColumn }) {
  const categories = await knex(table).select('id', 'document_id', 'published_at');
  const siblingFor = new Map();
  for (const cat of categories) {
    const key = `${cat.document_id}:${cat.published_at ? 'published' : 'draft'}`;
    siblingFor.set(key, cat.id);
  }
  const categoryById = new Map(categories.map((cat) => [cat.id, cat]));

  const entryStatus = new Map(
    (await knex(source).select('id', 'published_at')).map((row) => [row.id, row.published_at ? 'published' : 'draft'])
  );

  let repaired = 0;
  for (const row of await knex(link).select('*')) {
    const category = categoryById.get(row[targetColumn]);
    const status = entryStatus.get(row[sourceColumn]);
    if (!category || !status) continue;

    const wanted = siblingFor.get(`${category.document_id}:${status}`);
    if (wanted && wanted !== row[targetColumn]) {
      await knex(link).where({ id: row.id }).update({ [targetColumn]: wanted });
      repaired += 1;
    }
  }
  console.info(`[repair-category-drafts] Re-pointed ${repaired} cross-status links in ${link}.`);
}

async function rebuildBlogPostLinkTable(knex) {
  const [{ sql }] = await knex('sqlite_master').where({ type: 'table', name: 'blog_posts_category_lnk' }).select('sql');
  if (/foreign key/i.test(sql)) {
    console.info('[repair-category-drafts] blog_posts_category_lnk already has foreign keys; skipping rebuild.');
    return;
  }

  await knex.raw(
    'CREATE TABLE `blog_posts_category_lnk__new` (' +
      '`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL, ' +
      '`blog_post_id` integer NULL, ' +
      '`blog_category_id` integer NULL, ' +
      '`blog_post_ord` float NULL, ' +
      'CONSTRAINT `blog_posts_category_lnk_fk` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE, ' +
      'CONSTRAINT `blog_posts_category_lnk_ifk` FOREIGN KEY (`blog_category_id`) REFERENCES `blog_categories` (`id`) ON DELETE CASCADE)'
  );
  await knex.raw(
    'INSERT INTO `blog_posts_category_lnk__new` (`id`, `blog_post_id`, `blog_category_id`, `blog_post_ord`) ' +
      'SELECT `id`, `blog_post_id`, `blog_category_id`, `blog_post_ord` FROM `blog_posts_category_lnk`'
  );
  await knex.raw('DROP TABLE `blog_posts_category_lnk`');
  await knex.raw('ALTER TABLE `blog_posts_category_lnk__new` RENAME TO `blog_posts_category_lnk`');
  await knex.raw('CREATE INDEX `blog_posts_category_lnk_fk` on `blog_posts_category_lnk` (`blog_post_id`)');
  await knex.raw('CREATE INDEX `blog_posts_category_lnk_ifk` on `blog_posts_category_lnk` (`blog_category_id`)');
  await knex.raw('CREATE UNIQUE INDEX `blog_posts_category_lnk_uq` on `blog_posts_category_lnk` (`blog_post_id`, `blog_category_id`)');
  await knex.raw('CREATE INDEX `blog_posts_category_lnk_oifk` on `blog_posts_category_lnk` (`blog_post_ord`)');
  console.info('[repair-category-drafts] Rebuilt blog_posts_category_lnk with cascading foreign keys.');
}

module.exports = {
  async up(knex) {
    for (const config of CATEGORY_TABLES) {
      if (!(await knex.schema.hasTable(config.table))) continue;
      await addMissingDrafts(knex, config.table);
    }

    if (knex.client.dialect === 'sqlite3' && (await knex.schema.hasTable('blog_posts_category_lnk'))) {
      await rebuildBlogPostLinkTable(knex);
    }

    for (const config of CATEGORY_TABLES) {
      const ready =
        (await knex.schema.hasTable(config.table)) &&
        (await knex.schema.hasTable(config.link)) &&
        (await knex.schema.hasTable(config.source));
      if (ready) await repairLinks(knex, config);
    }
  },

  async down(knex) {
    // Non-destructive rollback
  },
};
