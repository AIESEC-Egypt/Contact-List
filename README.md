# Contact List Website — AIESEC in Egypt

Static site for MC and LC contacts by term.

**Live:** https://contactlist.aiesec.org.eg/

## Structure

```
├── index.html              # Landing page
├── contact-list.html       # Same landing page
├── styles.css
├── assets/                 # Logo and favicon
├── js/contact-list.js
└── contact-list/
    ├── 26-27.html          # 2026-2027 term
    ├── 25-26.html          # 2025-2026 term
    └── 24-25.html          # 2024-2025 term
```

Older terms (before 2024-2025) stay on the [official Google Sheet](https://docs.google.com/spreadsheets/d/1wLBWbUdxiKyqi1AAmL-JrdJiDLfNq7hILQp5L0w1Q6U/edit?usp=sharing).

## How deploy works

Push to `main` and GitHub Actions copies the site to the static server:

`/var/www/contact-list` on `167.172.253.162`

You can also run the **Deploy to static server** workflow by hand from the Actions tab.

## Local edits

1. Change the HTML for the term you need.
2. Commit and push to `main`.
3. Wait for the deploy workflow to go green, then refresh https://contactlist.aiesec.org.eg/
