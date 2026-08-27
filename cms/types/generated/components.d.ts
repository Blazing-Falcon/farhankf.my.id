import type { Schema, Struct } from '@strapi/strapi';

export interface ArticleCaptionedImage extends Struct.ComponentSchema {
  collectionName: 'components_article_captioned_images';
  info: {
    description: 'Article image with alternative text, caption, and optional source.';
    displayName: 'Captioned Image';
  };
  attributes: {
    altText: Schema.Attribute.String & Schema.Attribute.Required;
    caption: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    source: Schema.Attribute.String;
  };
}

export interface ArticleMarkdownText extends Struct.ComponentSchema {
  collectionName: 'components_article_markdown_texts';
  info: {
    description: 'Rich text section supporting headings, paragraphs, lists, quotes, links, and code blocks.';
    displayName: 'Markdown Text';
  };
  attributes: {
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
  };
}

export interface ArticlePdfDocument extends Struct.ComponentSchema {
  collectionName: 'components_article_pdf_documents';
  info: {
    description: 'Embedded interactive PDF viewer with open and download options.';
    displayName: 'PDF Document';
  };
  attributes: {
    description: Schema.Attribute.Text;
    pdfFile: Schema.Attribute.Media<'files'> & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ArticleYoutubeVideo extends Struct.ComponentSchema {
  collectionName: 'components_article_youtube_videos';
  info: {
    description: 'Responsive YouTube video embed supporting watch, share, shorts, and embed links.';
    displayName: 'YouTube Video';
  };
  attributes: {
    caption: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    youtubeUrl: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'article.captioned-image': ArticleCaptionedImage;
      'article.markdown-text': ArticleMarkdownText;
      'article.pdf-document': ArticlePdfDocument;
      'article.youtube-video': ArticleYoutubeVideo;
    }
  }
}
