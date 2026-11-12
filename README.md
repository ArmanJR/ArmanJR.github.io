# Arman's technical blog

A Markdown blog built by GitHub Pages with its supported Jekyll and Minima theme.

Primary address: https://dev.arman.ac. GitHub Pages redirects
https://armanjr.github.io to the custom domain once it is configured.

## Publish a post

Create `_posts/YYYY-MM-DD-your-title.md` (create the directory for the first post):

```markdown
---
title: "Your post title"
description: "A short summary."
---

Write your post in Markdown here.
```

Commit and push to `master`. GitHub Pages builds and publishes automatically.
Posts appear on the homepage and in `/feed.xml`; code fences support syntax
highlighting. Future-dated posts are not published until a build runs after their
date. Dates use the America/Toronto timezone.

Use `_drafts/first-post.md` as a writing template. Drafts are excluded from the
published site, but remain visible in a public repository.

Edit `about.md` for the About page and `_config.yml` for site metadata.

## Hosting

In repository Settings → Pages, publish from `master`, folder `/ (root)`.
Set the custom domain to `dev.arman.ac`. The tracked `CNAME` file preserves it
across deployments.

After GitHub accepts the custom domain, add this Cloudflare DNS record for
`arman.ac`: type `CNAME`, name `dev`, target `armanjr.github.io`, proxy **DNS only**,
TTL **Auto**. Enable **Enforce HTTPS** in GitHub Pages when the certificate is ready.

GitHub Free requires this repository to be public for Pages hosting.
See [GitHub's custom domain guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Verification

Check the repository's Pages build in Actions after pushing. Then run:

```sh
uv run tests/check_site.py https://dev.arman.ac
```

This checks the homepage, About page, RSS feed, missing-page behavior, and that
the draft and repository documentation are not published. It requires working
DNS and HTTPS. GitHub Pages provides the build environment; no local package
installation is required to publish.
