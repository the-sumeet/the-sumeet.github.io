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
date = 2025-11-17T17:13:56+05:30
draft = true
tags = ['tag1', 'tag2']
+++

Your content here...
```

Set `draft = false` or remove the line when ready to publish.

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
