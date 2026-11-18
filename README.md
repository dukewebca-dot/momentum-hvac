# Momentum HVAC Services: website redesign

Static site with no build step. Every file in this folder (except `_backup-original/` and this README) is what gets published.

```
index.html               Home
team.html                Our Team
services/*.html          Heating, Cooling, Plumbing, Sheet Metal, Electrical
404.html                 Not-found page
assets/css/main.css      All styles (shared by every page)
assets/js/main.js        All behaviour (shared, loaded with defer)
assets/fonts/            Self-hosted Archivo, Inter, JetBrains Mono (latin subset)
assets/img/              Optimized images (AVIF + WebP + JPG fallback)
netlify.toml             Netlify: redirects from old .php URLs, cache headers
.htaccess                Same, for Apache/cPanel hosting
robots.txt, sitemap.xml, site.webmanifest, favicons
```

## Publishing a preview (Netlify, recommended)

1. Delete `_backup-original/` (the old version of these files).
2. Drag the folder onto https://app.netlify.com/drop, or connect a Git repo with publish directory `.`.
3. The contact form uses **Netlify Forms**. Submissions appear under *Site → Forms*. Set up an email notification there that sends to the office address.

Every page has `<meta name="robots" content="noindex, nofollow">`, so the preview won't show up in Google or compete with the live site.

## Going live on momentumhvac.com

1. **Remove the noindex line** from every `.html` file (search for `PREVIEW ONLY`).
2. Point the domain at the host. Old URLs (`Heating.php`, `OurTeam.php`, …) 301-redirect to the new pages, which keeps their search rankings.
3. If hosting on Apache instead of Netlify, the form needs a backend. The simplest option is to set the form's `action` to a Formspree endpoint. The JS posts to whatever `action` is set.
4. Submit `sitemap.xml` in Google Search Console.

## Confirm with the owners before launch

- **Office email**: the old homepage uses `daryl@momentumhvac.ca`; the old team page uses `@momentumhvac.com` for everyone. Both domains receive mail. Which one should the site use?
- **Crew size**: the old homepage says 13 mechanics (10 journeymen, 3 apprentices); the old team page lists 6 + 6. This site uses **12 (6 + 6)**, matching the roster.
- **Service area**: the old service pages mention work "across Saskatchewan". The site says Regina and surrounding area, plus commercial and industrial projects across the province. Is that accurate?
- **Photos**: heating, plumbing and electrical use stock photos (Pexels, free licence). Real job-site photos would be better.
- Social media links: none on the old site. Add them to the footer if the company has any.
