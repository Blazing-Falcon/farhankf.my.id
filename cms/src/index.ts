import type { Core } from '@strapi/strapi';
import { seedExampleContent } from './seed-examples';

async function setPublicApiPermissions(strapi: Core.Strapi) {
  try {
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });
    if (!publicRole) return;

    const actions = [
      'api::photo.photo.find',
      'api::photo.photo.findOne',
      'api::photo-category.photo-category.find',
      'api::photo-category.photo-category.findOne',
      'api::blog-category.blog-category.find',
      'api::blog-category.blog-category.findOne',
      'api::blog-post.blog-post.find',
      'api::blog-post.blog-post.findOne',
      'api::project.project.find',
      'api::project.project.findOne',
      'api::about.about.find',
      'api::cat.cat.find',
      'api::cat.cat.findOne',
      'api::lab-note.lab-note.find',
      'api::lab-note.lab-note.findOne',
      'api::social-link.social-link.find',
      'api::social-link.social-link.findOne',
      'api::ticker.ticker.find',
    ];

    for (const action of actions) {
      const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
        where: { action, role: publicRole.id },
      });
      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: {
            action,
            role: publicRole.id,
            enabled: true,
          },
        });
      }
    }
  } catch (err) {
    strapi.log.error('Could not ensure public API permissions; the public API would answer 403.');
    throw err;
  }
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setPublicApiPermissions(strapi);
    if (process.env.SEED_EXAMPLES) {
      await seedExampleContent(strapi);
    }
  },
};
