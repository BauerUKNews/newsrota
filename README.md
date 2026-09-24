# News Rota v22.4 — desktop and phone interface update

Prepared 24 September 2026. Includes the previous releases. This package has not been deployed to the live site.

## Install

If v21 through v22.3 is already installed, replace **index.html** in the GitHub repository. Keep the existing icons/ folder and manifest.webmanifest. Wait for GitHub Pages to deploy, reload, and check the footer says **News Rota v22.4**. No new SQL is required. Rota data, allowances, generation rules and publication settings are unchanged.

For older installations, README-v21.md explains the icon assets and cumulative SQL requirements; use this package's index.html. SQL remains identical to v19 onward. Keep a backup of the currently deployed HTML. rollback/previous-v22.3.html is the previous delivered candidate.

## Phone use

Phone layout is **Staff-only** (up to 760 CSS pixels wide). There is no profile switch or editing control. Use a desktop for Editor or Operations access and editing. This is an interface rule; server password permissions remain unchanged.

Rota, Holidays, Offices and Booths sit in the bottom navigation. The header is slimmer. Tap a day in the Monday–Sunday strip; tap the date heading for the date picker. Today returns to the real current day, even when no rota exists for it.

Everyone and My rota are separate buttons. Choose your name once, then switch between the team and your assignments without losing that name. Change person selects someone else. The personal name is stored on this device only. Searching a role, section or person searches everyone on the selected day; clearing the search restores the chosen view.

Summary calendars start with a single month. Use the month arrows, Summary year or Year overview to navigate. Tap a month in the overview to focus it. Tap a day for a larger panel containing the total and names. The existing all-week public holiday, office and booth totals are preserved.

If a desktop session is resized to phone width, a clean elevated session switches to Staff. If Operations has pending edits, a save in progress, a conflict or a refresh still being checked, the narrow screen shows a message to continue on desktop. The existing data and token are retained so the edits can finish saving. Returning to a wider window restores that session; once saving completes, the phone can switch to Staff. No pending edits are discarded just to change the layout. Opening a fresh page always starts as Staff.

## Desktop use

Click the large date heading to open the week calendar. The heading is also a keyboard-accessible button: focus it and press Enter or Space. Use the left/right arrows for adjacent weeks. The separate Choose week and This week buttons have been removed. The extra Everyone / My rota / Choose person row has been removed. Search for a name and choose its Personal rota result to open that person's schedule.

Search finds people, roles and sections. Results show the job, person, group and date, including unfilled slots. Person results open their full schedule; assignment results scroll to the slot. A visible filtered-by label and Clear button keep the search state explicit. Desktop assignment search covers the current week; phone search covers the selected day. Both respect publication and profile visibility.

Section shortcuts highlight the group currently being read. Faded edges indicate additional shortcuts off to the side. Clicking a shortcut leaves the heading below the fixed header. Keyboard users can move from desktop search into its result buttons with Arrow Down and clear it with Escape.

## Personal rota and presentation

The personal rota opens with Upcoming, starting at the current Monday week. All dates includes previous weeks. Every scheduled week appears in chronological order, including weeks without personal assignments. Unpublished dates show a Rota coming soon box, including unpublished weekends within a partly published week. Every published day has a dated row, including unassigned weekdays and weekends, which show an accessible dash. Blank days do not count towards shifts or holidays. Entirely empty published weeks also have an explanatory note, and dates covered by a separate rota are labelled separately. Excluded or deleted dates are not invented. Holiday/conflict entries and year-aware headings remain; today is marked when present. Normal capitalisation on phones preserves AM/PM and common station acronyms.

Controls use consistent sizing and spacing. Routine sync confirmation is quieter, while errors remain prominent. The status indicator still opens connection details. Help using the rota has been updated.

## Checks and limits

75 frontend checks pass, including retention of an empty Wednesday between working days and rendering of accessible empty rows without changing totals. Local desktop and phone-width browser checks confirm blank daily rows alongside assignments. See TEST-RESULTS.md.

No SQL or icon assets changed, so database suites were not repeated for this release. Physical iPhone/Safari installation and the live deployment remain to be checked after upload. Test fixtures are fictional and local; never run them against production. Run npm install then npm test for the packaged regression suites.
