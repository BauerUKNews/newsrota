# News Rota v22.4 — show unassigned days in personal rotas

- Keep a dated row for each published day, including unassigned weekdays and weekends.
- Show a quiet dash in the role column for no assignment, with an accessible label.
- Preserve coming-soon placeholders, separate-rota messages, date-range controls and assignment/holiday totals.
- No SQL, icon, manifest or shared-data changes.

## Previous releases

# News Rota v22.3 — complete personal weekly timeline

- Personal rotas now show every scheduled week within Upcoming or All dates, in date order.
- Unpublished dates get a Rota coming soon box, including unpublished portions of a partly published week.
- Published weeks with no personal shifts/holiday entries remain visible with an explicit empty-state message.
- Separate-rota dates are labelled; deleted pages and excluded dates are not added to the timeline.
- Hidden assignments remain restricted to the existing profile permissions. Counts include actual visible entries only.
- No SQL, icon, manifest or shared-data changes.

## Previous releases

# News Rota v22.2 — clickable date heading

- Removed the separate Choose week and This week buttons from the desktop week header.
- Clicking the large date now opens the existing week calendar. Enter and Space work too.
- Kept previous/next week arrows, the relative-week label and the phone date controls.
- Updated help and removed unused button handlers/styles. No SQL, assets or data changes.

## Previous releases

# News Rota v22.1 — desktop header simplification

- Removed the desktop Everyone, My rota and Choose person row beneath the relative-week label.
- Personal schedules remain accessible through name search.
- Removed the unused desktop picker handlers and styling; updated the built-in help.
- Phone personal controls, Staff-only phone access and all other v22 features remain unchanged.
- No SQL, asset or rota-data changes.

## Previous releases

# News Rota v22 — changes

- Moved phone navigation to the bottom and reduced header clutter.
- Added Everyone/My rota controls that retain the chosen person and a desktop personal-rota shortcut.
- Added Monday–Sunday phone date buttons, a date-heading picker and desktop This week.
- Added current-section highlighting and overflow hints to section shortcuts.
- Added desktop person/role/section search with labelled assignment results, current-week highlights and explicit clearing.
- Added Upcoming/All dates to personal schedules and a today marker.
- Added single-month phone summary calendars, year overview and larger day-detail panels with names and counts.
- Standardised control styling and phone role capitalisation; made healthy sync quieter and errors prominent.
- Made phone layout Staff-only. Desktop remains the place to change profile or edit; resizing cannot discard pending Operations changes.
- No stored rota schema, SQL, icon, allowance, publication or generation-rule changes.

## Previous releases

# News Rota v21.1 — changes

- Simplified personal schedule and added weekly cards with year-aware date headings.
- Hid Generation info in Staff mode, retaining it for elevated profiles.
- Made all Staff grid gaps a steady pale red, preserving existing elevated-profile pulses.
- Added responsive section jump buttons beside the top navigation.
- No database migration, saved data or asset changes.

## Previous releases

# News Rota v21 — changes

- Generated a purple, white and teal News Rota icon; supplied Apple touch icon, favicon and 192/512-pixel manifest icons, with standalone Safari metadata and project-relative URLs.
- Added a compact daily reading view at phone widths, starting on today with date selection, previous/next and Today controls. Dates outside the rota are identified honestly.
- Added a searchable My rota selector, remembered locally on the device, and quick access to the full personal schedule.
- Added role/section/person search for the selected day. It searches all visible team assignments regardless of the personal filter and shows matching unfilled positions.
- Kept holiday, office and booth views one tap away, with short phone labels. Full-week viewing and Operations editing remain available.
- Daily view honours publication, blocked pages, deleted weeks, actual weekday/weekend/special dates, void markers, cover tags and notes. Requested public absence summaries can still show people off on unpublished dates.
- New loads always start as Staff; existing elevated browser tokens no longer automatically restore an elevated profile. The top-right profile chooser still verifies passwords with Supabase.
- Added daily print headings/content and a clear route to full-week email copying.
- No SQL or saved rota schema changes in this release.

## Previous changes

# News Rota v20 — changes

- Removed user-facing 2026 trial banners, copied-allowance note and trial labels. Preserved annual separation and recorded-period semantics.
- Added global fixed weekday rules, a personnel/role/day form, template right-click actions and template badges.
- Protected reservations through template selection, holiday cover, rotation assignment and priority sweeps. Fixed people cannot be stolen for cover or duplicated elsewhere that day. Fixed roles override void markers; invalid or contradictory rules stop generation.
- Added a persisted week-generation report with placement reasons, gaps, holidays, unassigned staff and unassigned freelancers by day. Reports reopen after reload, inherit publication access, and flag later week edits.
- Added import validation, personnel rename/removal integration, shared revision handling and regression tests for the new data.
- Improved rules navigation, context-menu bounds and the report toolbar button’s contrast.
- SQL is byte-for-byte identical to v19; no extra database migration is needed after v19.

## Earlier cumulative release history

# News Rota v19 — changes

## 2026 trial and annual figures

Added sixteen pages covering exactly 1 November–24 December 2026, including Sunday-only and four-day boundary pages. Existing 2027 IDs and metadata are preserved. All summary views have a year selector and filter the chosen year; the 2026 calendars show only the trial months and exclude the separate Christmas period. Weekend parsing and new weekday columns retain their year. Date navigation derives its months from actual data.

The private allowances record now stores independent 2026 values under __years, initially copied from 2027. The SQL seed preserves later annual adjustments, default/zero values and existing publication choices on rerun. Annual metadata survives backup validation, rename and removal. Admin shows Trial usage and copied annual allowance for 2026, without Left or full-year remaining cards. Personnel allowance fields explicitly refer to 2027.

Future dated templates no longer apply before their start date. The rotation anchor remains 4 January 2027, so adding the trial cannot shift the existing cycle. New trial rota pages start hidden while all three public summary views retain their requested visibility.


## Data correctness and saving

| Reviewed issue | Result |
| --- | --- |
| Undo/Redo only changed the local browser | Both now queue a shared save. History records the logical keys changed by an action and preserves unrelated remote updates. Undo refuses to overwrite a target that has since changed. |
| Old Autofill preview could overwrite newer changes | Apply checks the preview's data version. Changed data disables Apply and offers Rebuild preview. The check is conservative: even a change elsewhere can require rebuilding. |
| Leaving Edit exposed unsaved data to a poll overwrite | Pending changes flush while editing permission remains valid; dirty keys remain protected outside Edit mode. |
| Older JSON migration removed week data | Migration retains overrides and extra weeks. Imports are validated in a separate copy before replacing live state and retain the current server reset epoch. Malformed and future-version imports are rejected. |
| Late responses could regress saved revisions | Per-key revision checks, request generations and access tokens reject stale responses. Polls do not overlap; saving schedules follow-up work when required. |
| Small rotations reused the same people | Duplicate names/roles are removed from the rotation candidates; roles beyond available distinct people remain unfilled for review. |
| Private details could remain open after access changed | Restricted overlays close and their content is cleared; refreshed data rebuilds open details. |
| Initial connection recovery could be incomplete | Retry performs a full bootstrap until initialization succeeds. |
| Save text could be misleading | Pending, saving, saved, local-storage failure and connection/save errors have distinct states. |

## Booth usage at every access level

Booth usage now uses saved summaries from every week for Staff, Editor / senior leadership and Operations, including unpublished weeks. The tab was already public; filtered local rota data made its figures incomplete for Staff. The summary includes AM/PM names and counts by office/date and refreshes with the other public views. Missing or outdated SQL produces an explicit unavailable message rather than misleading empty results.

The existing calculation is retained: weekday AM/PM reading roles in FOCUS and NATIONALS, plus DELIVERY in HUB sections; one booth per person/half-day/office. It excludes Behind the Headlines, other roles, bank holidays, blocked pages and voided cells. Weekend and special-page booth modelling remains outside the existing calculation.

## Holiday and occupancy totals

- A public daily-summary database function aggregates all saved weeks independently of publication flags. Staff receive names and counts for people away and people working by office/date. It does not expose the full unpublished rota, notes or role assignments.
- Holiday heat-map and office occupancy numbers use these authoritative totals. Date details include the corresponding people even when their week is unpublished.
- Every Away date contributes to holiday allowance usage, including weekend, bank-holiday and special pages. Person/date duplicates count once, case-insensitively.
- Counts exclude removed weeks. Office work counts also exclude voided work cells, blocked substitute pages and weekday bank-holiday work cells, matching the rota's existing work rules.
- Special dates handle year rollover and named extra-week years. Missing totals never silently fall back to incomplete Staff data; last-loaded totals are labelled if the connection fails.
- Annual office totals are labelled person-days, to distinguish them from individual shifts.

## Drag-to-copy reliability

- Replaced rectangle-overlap targeting with logical row/column targeting and a direction lock. Tiny boundary overlaps also no longer include adjacent rows during ordinary selection.
- Enlarged the corner handle to an 18-pixel target and added pointer capture so the gesture stays tracked.
- Added live destination highlighting, edge scrolling, Escape cancellation and cancellation on lost pointer, window/view/access changes, or dropping outside the section.
- The release checks that data has not changed since the drag started. A stale preview cannot overwrite newer data.
- Multiple source rows/columns repeat their own value patterns, including leftwards/upwards copying, without mixing one row's names into another.

## Interface and accessibility

- Phone weekday tables have readable minimum column widths, sideways scrolling and sticky role/header labels, with a scroll hint.
- The toolbar wraps; tabs scroll within their own strip. Editing, access and save controls remain within the viewport.
- Dialog bodies scroll within the available screen height while headings, Close and footer actions remain accessible.
- A visible Choose week button includes the year. Calendar dates are labelled buttons and announce selection.
- Dialogs have names, contain keyboard focus, make background content inert and restore focus after closing.
- Rota rows expose table relationships and full assignment labels. Arrow keys move between cells in read mode; Enter opens person details without changing weeks.
- Secondary text is darker/larger and compact controls have larger targets. Rotation fields and actions use consistent styles and labels.
- Setup presents Personnel, Templates, Rotations, Cover rules, Colour key and Publication settings in one place.
- Notes guidance reflects the current Edit mode; everyday help uses plain language while connection details remain available for support.

## Compatibility

The single-page architecture, existing Supabase URL/public key, database storage keys, schema 10, shared passwords and concurrent-editing protocol are retained. The new SQL updates summary functions and seeds missing trial allowances/publication settings with revision updates; private helper functions and tables remain inaccessible to anonymous callers.
