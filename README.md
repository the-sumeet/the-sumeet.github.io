# Sumeet's Blog

A personal blog built with Hugo and the Terminal theme.

## Prerequisites

- [Hugo Extended](https://gohugo.io/installation/) version 0.131.0 or later
- Git

## Installation

1. Clone the repository with submodules:
```bash
git clone --recurse-submodules https://github.com/the-sumeet/the-sumeet.github.io.git
cd the-sumeet.github.io
```

If you already cloned without submodules, run:
```bash
git submodule update --init --recursive
```

## Local Development

### Run the development server

```bash
hugo server -D
```

This will start a local server at `http://localhost:1313/`. The `-D` flag includes draft posts.

### Run without drafts

```bash
hugo server
```

## Creating Content

### Create a new blog post

```bash
hugo new posts/my-post-name.md
```

This creates a new post in `content/posts/` with front matter pre-filled.

### Post front matter example

```toml
+++
title = 'My Post Title'
description = 'A brief summary of your post for SEO (150-160 characters)'
date = 2025-11-17T17:13:56+05:30
draft = true
tags = ['tag1', 'tag2']
+++

Your content here...
```

### Writing a Blog Post - Best Practices

For each blog post, follow these guidelines:

**1. Front Matter (Required)**
- `title`: Clear, descriptive title
- `description`: SEO-friendly summary (150-160 characters)
- `date`: Publication date
- `tags`: Relevant tags for categorization

**2. Content Structure**
- Start with an engaging introduction
- Use proper heading hierarchy (H1 for title, H2 for sections, H3 for subsections)
- Break content into readable paragraphs
- Include code examples in fenced code blocks with language specification

**3. SEO Optimization**
- Write descriptive headings that include keywords
- Aim for 300+ words per post
- Add alt text to images: `![Alt text](image.jpg)`
- Link to related posts when relevant
- Use descriptive URLs (Hugo generates these from titles)

**4. Before Publishing**
- Set `draft = false` or remove the draft line
- Preview locally with `hugo server`
- Check for spelling and grammar
- Test all links and images
- Verify code examples work

**5. After Publishing**
- Share on social media (Open Graph tags are auto-generated)
- Monitor Google Search Console for indexing
- Respond to comments/feedback

## Building for Production

### Build the site

```bash
hugo --minify
```

This generates the static site in the `public/` directory.

### Clean build

```bash
hugo --gc --minify
```

The `--gc` flag runs garbage collection to remove unused cache files.

## Deployment

### GitHub Pages (Automatic)

This repository uses GitHub Actions to automatically build and deploy to GitHub Pages.

1. Push your changes to the `main` branch:
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. GitHub Actions will automatically:
   - Build the site
   - Deploy to GitHub Pages

3. Your site will be available at: `https://the-sumeet.github.io/`

### Manual Deployment

If deploying manually:

1. Build the site: `hugo --minify`
2. Deploy the contents of the `public/` directory to your hosting provider

## Configuration

Site configuration is in `hugo.toml`. Key settings:

- `baseURL`: Your site's URL
- `title`: Site title
- `theme`: Hugo theme (terminal)
- `paginate`: Number of posts per page
- `[params]`: Theme-specific parameters

## Theme

This site uses the [Terminal theme](https://github.com/panr/hugo-theme-terminal) by panr.
