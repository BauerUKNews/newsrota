# News Rota v21 — phone view and home-screen icon

Prepared 17 September 2026. Includes every previous fix. The live site has not been changed by this work.

## Install this update

1. Export a backup and let active editors finish saving.
2. In the GitHub repository, replace **index.html**, and upload **manifest.webmanifest** plus the entire **icons** folder beside it. Keep those names and folder structure. Uploading only the HTML will leave the home-screen icon missing.
3. If v19 or v20 SQL is already installed, no extra SQL is required. Otherwise use the included cumulative `upgrade_public_totals.sql` in the existing Supabase project first. The SQL has not changed since v19. Do not run test fixtures against production.
4. Wait for GitHub Pages to deploy and reload. The footer should say **News Rota v21**. The existing public Supabase configuration is preserved.

## On your phone

- The Rota tab opens on **today**, one day at a time. Use the arrows, date picker or Today button to navigate.
- Tap **My rota · choose your name**, search and select yourself. This device remembers the choice. **Everyone** restores the team view; **Full personal rota** opens the existing longer personal schedule.
- **Find a role or person** searches the selected day by job, section or name. Search includes everyone, even if My rota is selected. Clear the search to return to your personal filter. Matching unfilled jobs are shown too.
- **Holidays, Offices and Booths** stay available in the top navigation. These are the existing holiday heat map, office occupancy and booth usage views, including the requested names and totals from unpublished weeks.
- Filled positions are grouped by section. Empty roles and week notes are collapsed to keep the daily view compact. Cover labels and cell notes remain visible.
- Use **Full week view** if you need the original grid, then **Back to daily view**. Operations editing uses the full grid so existing editing tools remain available.
- If today falls outside the available rota dates, the page says so and offers the next rota date. It does not substitute a future rota and call it today. The separate Christmas period stays excluded.

## Staff first

Every fresh page load, on desktop or phone, starts as Staff without a welcome/profile prompt. Tap **Staff** at the top right to choose Editor or Operations and enter the relevant password. Reloading returns to Staff, so Operations users must choose their profile again after a reload. Switching tabs within the open page does not sign them out. Choosing a name for My rota is only a viewing filter and never grants editing or unpublished-rota access.

## Add to your iPhone home screen

After deployment, open the rota in Safari, choose **Share → Add to Home Screen**, and add **News Rota**. If Safari offers **Open as Web App**, leave it enabled. The purple and teal calendar icon is supplied through Apple touch-icon metadata and a web app manifest. If an existing shortcut retains an old icon, remove that shortcut and add it again after the update.

The app still needs its normal connection to load current shared data. This release does not add a separate offline cache. Installation on a physical iPhone has not been performed here; verify the final icon and standalone launch after deployment.

Implementation follows [Apple’s web application configuration guidance](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html) and [WebKit’s home-screen web app guidance](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/). Relative asset paths and manifest scope are configured for the existing `/newsrota/` GitHub Pages location.

## Validation and release contents

58 frontend checks, the three existing database suites, and icon/manifest checks pass. Local browser checks cover 320- and 390-pixel phone layouts, date navigation, role/person search, saved personal choice, weekend views, summaries, and Staff-first access. See TEST-RESULTS.md for details and limits.

The generated icon and web sizes are under `icons/`; the exact prompt and generation method are in `ICON-GENERATION.txt`. `START-HERE.md` explains the implementation for further work. `CHANGELOG.md` retains cumulative history. `SHA256SUMS.txt` lists file hashes.

To run the packaged tests: install Node.js, run `npm install`, then `npm test`. All database fixtures are local and fictional. For HTML rollback, `rollback/previous-v20.html` contains the previous candidate; keep a copy of whatever was actually deployed as well.
