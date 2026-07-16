# GitHub Pages deployment

[中文说明](./GITHUB_PAGES.zh-CN.md)

## Compatibility

The demo is compatible with GitHub Pages. GitHub Pages publishes static HTML, CSS, and JavaScript, and this repository's `demo/` has no server-side runtime or build step. Its JavaScript data files and GIFs use relative URLs, so they continue to work at the project-site URL.

Expected production URL: <https://giraffe-tree.github.io/awesome-interaction/>

## Enable it once

1. On GitHub, open **Settings → Pages** for this repository.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main`, or open **Actions → Deploy demo to GitHub Pages → Run workflow**.
4. Open the URL shown in the workflow's `github-pages` deployment environment. The expected URL is listed above.

The workflow publishes `demo/` as the site root. It does not copy the repository root, run Jekyll, or create a `gh-pages` branch.

## Verify

Before pushing, serve the same directory locally instead of opening the HTML through a `file://` URL:

```sh
python3 -m http.server 8000 --directory demo
```

Then open <http://localhost:8000/> and check that the effect rows, source details, filters, scripts, and GIF previews load. After deployment, confirm the same behavior at the production URL and check the browser console and network panel for missing files.

## Operational limits

- GitHub Pages is static hosting: server-side code, private API keys, and runtime environment variables are unavailable. External APIs would need a separate backend, and no secret should be embedded in browser code.
- Project sites live under `/<repository>/`. Keep internal assets relative (as they are now), or include the repository base path when adding root-relative URLs.
- Pages sites are public on the internet, including sites published from private repositories where the account plan permits Pages.
- GitHub documents a maximum published-site size of 1 GB, a soft bandwidth limit of 100 GB per month, and a 10-minute deployment timeout. Keeping GIFs small reduces repository size, deployment time, and bandwidth.

## Official references

- [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
