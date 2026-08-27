import { stat } from 'node:fs/promises';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

type UploadedFile = {
  id: number;
  documentId: string;
  name: string;
};

async function uploadSeedAsset(
  strapi: Core.Strapi,
  folder: 'images' | 'documents',
  fileName: string,
  mimeType: string,
  alternativeText?: string,
  caption = 'Sample asset for development. Replace with real content.'
): Promise<UploadedFile> {
  const existing = await strapi.db.query('plugin::upload.file').findOne({ where: { name: fileName } });
  if (existing) return existing as UploadedFile;

  const filePath = path.resolve(process.cwd(), 'seed-assets', folder, fileName);
  try {
    const fileStat = await stat(filePath);
    const [uploaded] = await strapi.plugin('upload').service('upload').upload({
      data: {
        fileInfo: {
          name: fileName,
          alternativeText,
          caption,
        },
      },
      files: [{
        filepath: filePath,
        originalFilename: fileName,
        newFilename: fileName,
        mimetype: mimeType,
        size: fileStat.size,
      }],
    });
    return uploaded as UploadedFile;
  } catch (err) {
    console.warn(`Could not upload seed asset ${fileName}:`, err);
    return null as any;
  }
}

export async function seedExampleContent(strapi: Core.Strapi) {
  const existingPosts = await strapi.documents('api::blog-post.blog-post').count({});
  if (existingPosts === 0) {
    const pdfDoc = await uploadSeedAsset(
      strapi,
      'documents',
      'example-research-paper.pdf',
      'application/pdf',
      'Example Research Paper PDF'
    );

    await strapi.documents('api::blog-post.blog-post').create({
      data: {
        title: 'Building Distributed ML Pipelines on Proxmox',
        slug: 'building-distributed-ml-pipelines-on-proxmox',
        summary: 'A deep dive into setting up high-throughput inference nodes with zero-downtime container updates and local SQLite replication.',
        category: 'engineering',
        featured: true,
        readTime: '6 min read',
        publishedDate: '2026-08-20',
        contentBlocks: [
          {
            __component: 'article.markdown-text' as const,
            body: `### High-Throughput Inference on Budget Hardware\n\nWhen running machine learning workloads locally, resource utilization efficiency is everything. This architecture outlines the setup for scaling containerized workers on Proxmox VE without incurring cloud egress penalties.\n\nKey advantages:\n- **Isolated memory pools** via LXC containers\n- **Sub-millisecond IPC** across co-located service pods\n- **Automated snapshot failover** using ZFS storage pools`,
          },
          ...(pdfDoc ? [{
            __component: 'article.pdf-document' as const,
            title: 'Cluster Architecture & Benchmark Report',
            description: 'Full hardware spec sheet, network topology diagram, and load test results under synthetic traffic.',
            pdfFile: pdfDoc.id,
          }] : []),
          {
            __component: 'article.markdown-text' as const,
            body: `### Lessons Learned & Production Considerations\n\nMonitoring state with Prometheus and lightweight exporter agents revealed that memory thrashing occurs primarily during batch quantization. Enforcing hard swap limits on worker nodes resolved all tail latency spikes.`,
          },
        ],
      },
      status: 'published',
    });

    await strapi.documents('api::blog-post.blog-post').create({
      data: {
        title: 'The Unreasonable Effectiveness of Space Mono and Tangerine Accents',
        slug: 'the-unreasonable-effectiveness-of-space-mono',
        summary: 'Notes on typography, brutalist brutalism vs playful neo-brutalism, and designing developer portfolios that do not look like resume templates.',
        category: 'design',
        featured: false,
        readTime: '4 min read',
        publishedDate: '2026-08-15',
        contentBlocks: [
          {
            __component: 'article.markdown-text' as const,
            body: `### Why Neo-Brutalism Resonates\n\nMost modern tech portfolios look virtually identical: sterile dark mode, glassmorphic cards, purple gradients, and generic inter-sans typography.\n\nEmbracing bold borders, tactile paper shadows, monospaced data accents, and high-contrast color palettes like **Tangerine & Ink** gives technical documentation character without sacrificing readability.`,
          },
          {
            __component: 'article.youtube-video' as const,
            title: 'Design Systems & Typography in Action',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            caption: 'Video walkthrough of modular UI components and responsive layout mechanics.',
          },
        ],
      },
      status: 'published',
    });
  }

  const defaultCategories = [
    { name: 'Street', slug: 'street', order: 1 },
    { name: 'Landscape', slug: 'landscape', order: 2 },
    { name: 'Astrophotography', slug: 'astrophotography', order: 3 },
    { name: 'Cat', slug: 'cat', order: 4 },
    { name: 'Portrait', slug: 'portrait', order: 5 },
    { name: 'Macro', slug: 'macro', order: 6 },
    { name: 'Other', slug: 'other', order: 7 },
  ];

  for (const cat of defaultCategories) {
    const existing = await strapi.db.query('api::photo-category.photo-category').findOne({
      where: { slug: cat.slug },
    });
    if (!existing) {
      await strapi.documents('api::photo-category.photo-category').create({
        data: cat,
        status: 'published',
      });
    }
  }

  const defaultBlogCategories = [
    { name: 'Engineering', slug: 'engineering', order: 1 },
    { name: 'Design', slug: 'design', order: 2 },
    { name: 'Data Science', slug: 'data-science', order: 3 },
    { name: 'Notes', slug: 'notes', order: 4 },
    { name: 'Cats', slug: 'cats', order: 5 },
  ];

  for (const cat of defaultBlogCategories) {
    const existing = await strapi.db.query('api::blog-category.blog-category').findOne({
      where: { slug: cat.slug },
    });
    if (!existing) {
      await strapi.documents('api::blog-category.blog-category').create({
        data: cat,
        status: 'published',
      });
    }
  }
}
