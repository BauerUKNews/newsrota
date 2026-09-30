# Start here — News Rota v23

The maintained source is index.html: a single-page application with embedded JavaScript/CSS, public Supabase connection settings and static icons/manifest. Deploy index.html only for a v22.5 upgrade. No deployment has been performed.

## Weekend defaults

store.weekendDefaults is an array of {id,label,data:{rows:[{role,fri,sat,sun,mon}]}}. ensureStoreDefaults supplies an empty array. syncSnapshot already serializes settings generically; rota_save_changes uses the existing settings revision checks and Operations permission. No new SQL is needed. The whole defaults array is one revision-protected settings record.

openWeekendDefaults and WEEKEND_DRAFT manage a separate draft. saveWeekendDefault checks the saved base to reject stale edits. weekendDefaultPlan derives actual dates via weekDatesOf, consults holidayEntries, preserves matched cellVoid slots and clears inactive Friday/Monday assignments. applyWeekendDefaultPlan clones the target week, replaces rows and remaps cellColors/cellNotes/cellVoid/cellCover by uniquely matching normalized role names. Cover markers are removed when assignments change. Away, dates, week notes and publication remain untouched. Special/blocked/non-weekend pages cannot be targets.

previewWeekendDefault requires a saved unchanged default, captures the full sync snapshot and refuses to apply if either the week or snapshot changes while confirmation is open. Applying is manual for one weekend. Renaming or removing roles intentionally breaks marker matching; the preview lists removed roles. The usual persistent history supports undo.

Imports validate the defaults' array shape and unique role names. Person renaming and leaver cleanup traverse weekend defaults as well as weekday templates. No per-week default selection or automatic generation is introduced.

## Cosmetic colours

store.cellColors values accept existing colour-key IDs or a six-digit #rrggbb value. resolvedCellColor validates raw colours and resolves key IDs. setCosmeticCellColor changes only cellColors. tagCls retains cover/freelance classes and adds has-custom-color; CSS prioritizes the override and suppresses automatic striping/pulsing on that cell. cellStyle selects contrasting text. Automatic reset deletes the colour value. emailCellBg and the mobile day list use the same resolver/style.

Colour overrides are cell-level settings, not personnel or cover metadata. Existing server publication/profile rules remain. Editor/Staff cannot invoke save actions; phone layout remains Staff-only. Defaults are shared settings, so do not put secrets in their names or assignments. Settings are protected by existing RPC authorization/revision logic, not by hiding controls alone.

## Verification and deployment

See TEST-RESULTS.md and README.md. All browser checks used a separate local fixture server and fictional staff. No production data was modified. The optional fixed test date belongs to the local test server, never the delivered HTML. No new runtime dependencies.

## Previous context

# Start here — News Rota v22.5

Replace index.html only when upgrading from v22.4. todaySearchResults uses mobileDayData(localISO(new Date())) to share existing date, publication, blocked-page and void-slot rules. mobileDayData entries now carry cell keys; gaps also carry weekId. The desktop dropdown puts these results before people and DOM-based current-week matches, deduplicated by cell key except in template mode. openTodaySearchResult rechecks the date/visibility, selects the week, switches to Rota and focuses/scrolls on the next animation frame. Today's date follows the device's local calendar as elsewhere in the app.

Five new tests cover date-specific names, role/section/person matching, unpublished/deleted/blocked/void/bank-holiday cases, weekend/special/unfilled roles, revalidated navigation and result grouping/deduplication. Local test-server supports optional NEWS_ROTA_TEST_DATE to freeze a fictional preview's date; it is never injected into the shipped HTML. No production deployment occurred.

## Previous context

# Start here — News Rota v22.4

Replace index.html only when upgrading from v22.3. personalScheduleWeeks now retains personSchedule entries with kind 'na'. openPersonModal renders these as dated rows with a dash and aria-label='No assignment', before the assignment renderer. Counts still explicitly filter for work/conflict/holiday. Entirely unassigned published weeks retain a summary message below their daily rows. Publication and profile restrictions are unchanged. No live deployment occurred.

## Previous context

# Start here — News Rota v22.3

Use top-level index.html. personalScheduleWeeks builds Monday-based buckets from weekDatesOf for every retained RAW.weeks page, then adds permitted personSchedule entries. The model separates visible, unpublished and blocked dates. It keeps the existing Upcoming (current Monday onward) / All dates controls and groups date ranges without adding excluded dates. canViewWeek remains the visibility gate. personSchedule also skips deleted and blocked pages. openPersonModal renders empty/partial weekly cards and counts only visible shifts/holidays.

Replace index.html when upgrading from v22.2. SQL, manifest and icons are unchanged. No production deployment occurred. Six new tests cover restricted data, blank and partial weeks, profile/publication changes, separate and deleted pages, sorting/year boundaries/ranges, and date labels across daylight-saving changes.

## Previous context

# Start here — News Rota v22.2

Use top-level index.html. #weekTitle is now a native button inside the h1, styled to retain the large date heading. Its click handler calls openJump("jump"); native keyboard activation opens the same dialog. The existing textContent updates target the button without replacing its event handler. Removed #chooseWeek, #thisWeekBtn and #rotaYear. The hidden #weekSel remains for existing navigation code. Phone daily date selection is unchanged.

Replace index.html when upgrading from v22.1. SQL, manifest and icons are unchanged. No production deployment occurred.

## Previous context

# Start here — News Rota v22.1

Use top-level index.html. The desktop personal-navigation row introduced in v22 has been removed, along with desktopEveryone, desktopPersonal, desktopChangePerson and desktopPicking handling. The phone Everyone/My rota/Change person controls remain. openPersonModal is still available from desktop search results and the other existing entry points. Built-in help now directs desktop users to name search.

No database schema, SQL or assets changed. Replace index.html when upgrading from v22; see README.md. The previous implementation notes below describe v22 before this small removal.

## Previous v22 context

# Start here — News Rota v22

Use top-level index.html and README.md. No production deployment occurred. SQL and assets are unchanged from v21.1.

## Current implementation

UI22 holds transient personalRange, personalName, summaryMonth, yearOverview and desktopPicking values. MOBILE.audience separates the Everyone/My rota choice from MOBILE.person; the remembered name still uses news_rota_my_person localStorage and never enters shared settings. Personal schedules filter existing personSchedule items at mondayOf(today) for Upcoming; All dates uses all existing entries. No scheduling calculation was replaced.

The existing #tabs bar becomes fixed bottom navigation at widths up to 760px. The selected-day strip uses local date arithmetic, with year/DST boundary regression checks. The date heading reveals the native date input. This week only selects a real page belonging to the current Monday week.

Desktop search derives role/name/section/date results from the rendered grid, so unavailable weeks cannot contribute assignments. It highlights matching cells and dims other rows; it does not remove editable rows or change data. Result indices refer to the current rendered cell collection. Person-name matches retain the existing roster-based lookup. Phone search still uses mobileDayData/filterMobileDay. Printing labels Everyone correctly even when a personal name remains remembered.

updateSectionPosition marks the currently read section and scroll-strip overflow, with a requestAnimationFrame scroll handler. Targets scroll below the measured header height. Summary month selection changes presentation only; summaryMonths/inSummaryPeriod and all public totals remain intact. Empty office days can now be tapped to see a zero total. Phone day details use #summaryDayModal and the existing accessible dialog infrastructure.

## Phone access safeguard

enforcePhoneStaff runs before renderCurrentView/render/renderMobileDay. Fresh unauthenticated startup clamps to Staff. A clean elevated session calls switchToStaff and refreshes with the Staff token state. Pending changes, in-flight saves, conflicts or active refreshes instead show #phoneAccessPending, retain the original data/token, suppress editing controls and keyboard editing shortcuts, and allow returning to desktop to finish. updateSaveUI rechecks a pending transition. Guard recursion is bounded by phoneAccessBusy. openRoleGate, submitRolePassword, its asynchronous completion and setEditing reject phone elevation/editing. Fresh loads still discard elevated tokens as in v21. This is a viewport UI policy, not a new server security boundary or a physical-device detector.

## Validation

67 frontend tests pass. Added tests cover personal range boundaries, local week-strip dates, summary month/year selection, role capitalisation, print audience, and clean/pending phone access transitions. Browser checks include both an actual protected pending desktop session and a clean automatic downgrade. No production data changed.

## Earlier implementation context

# Start here — News Rota v21.1

Current source: top-level index.html. Use README.md for deployment. No live deployment occurred. SQL, icon assets, stored schema and data calculations are unchanged.

## Current UI changes

openPersonModal groups existing personSchedule entries by local Monday using mondayOf/localISO. It omits NA rows, renders accessible Date/Role tables inside .pweek cards, and retains holiday/bank-holiday/conflict rows. Removed personMeta markup and its cleanup/test fixture; personnel editing remains available to Operations.

Both desktop render and renderMobileDay hide generationInfoBtn for Staff. openGenerationInfo refuses Staff calls; refreshOpenViews also closes a report when access changes. This is a UI visibility change, not a new backend redaction boundary for stored generationReport data.

A role-staff CSS override gives .dc.vacant and .pline.vacant the same static background. Other roles retain their existing shiftgap animation and reduced-motion behaviour.

renderSectionJumps derives shortcuts from rendered group headings, not hidden/unpublished raw data. The .rota-nav wrapper places them beside the existing tabs, with horizontal scrolling and responsive wrapping. Jump handling focuses the target and subtracts the actual header height, respecting reduced-motion preferences. Desktop and daily render paths rebuild shortcuts; summary views clear them. No shortcuts or selected state are saved to Supabase.

## Previous implementation notes (v21 and earlier)

# Start here — News Rota v21

Use top-level index.html, manifest.webmanifest and icons/. No production deployment occurred. README.md has the installation and user flows. The previous v20 architecture notes follow below.

## v21 implementation

`MOBILE` holds page-local date, followToday, personal selection, query and fullWeek state. `news_rota_my_person` is a separate localStorage preference and never enters the shared settings snapshot. Dates are parsed locally from YYYY-MM-DD and navigated with calendar-day arithmetic; Today follows midnight/resume while explicitly selected dates stay selected.

`mobileDayData` builds a read-only view from existing stored weeks/templates after checking canViewWeek. It respects blocked/deleted/voided entries and supports weekday, ordinary weekend, bank-holiday weekend columns and special-day column keys. Public absence names remain intentionally available through the existing summary RPC. `filterMobileDay` searches section/role/person; while a query is present, renderMobileDay searches everyone instead of the selected person. Empty jobs are visible as gaps, with matches expanded during search.

At widths up to 760px, `syncMobileLayout` chooses daily viewing on the Rota tab unless editing, editing a template, or explicitly choosing full-week mode. It keeps all existing summary views. The mobile name picker uses the existing modal accessibility system. No changes to automatic generation or write permissions are introduced. The current local browser fixture lives outside this distribution and routes all requests to a fictional database.

`loadAccessToken` now clears any remembered token and returns an empty token on page load. Tokens obtained through an explicit profile choice still work in memory for the open page. Bootstrap, server role checks, race guards and write authorization remain authoritative. A fresh load must not automatically restore Operations or Editor, even if a role/token existed in storage. The My rota name is not an identity verification or access level.

The manifest uses relative id, scope and start_url, so it launches within /newsrota/. Apple uses icons/apple-touch-icon.png (180px); manifest icons are 192px and 512px. These assets must deploy alongside HTML. No service worker or extra offline cache was added. Physical iOS installation remains a deployment acceptance check. The exact built-in image-generation prompt is preserved in ICON-GENERATION.txt.

Run npm test: 58 frontend cases, three database suites and an asset test. Preserve all earlier fixes and tests. SQL is identical to v19/v20.

## Earlier architecture context

# Start here — News Rota v20

This self-contained HTML/CSS/JS app runs on GitHub Pages and uses Supabase RPCs for shared JSON records. The current source is the top-level index.html; no production deployment occurred during this work. Read README.md for installation, workflows and behavioural boundaries. Preserve all cumulative fixes from v18–v19.

## New data and concurrency

`store.fixedRules` is an array of `{role, day, person}` records. `role` uses the existing normalized section/area/slot identity; `day` is ISO weekday 1–5. It synchronizes as `settings:fixedRules`, using existing per-key baseRev checks and ordinary settings visibility, like cover/rotation configuration. No passwords or access changes are involved. One person can have one fixed role each weekday. A role/day can have one fixed person. Ambiguous or missing template identities block generation; never silently guess a replacement row.

`fixedReservations` resolves fixed roles against the selected template and actual week dates. Non-holiday fixed people are reserved by day; fixed cells remain protected from cover moves and the rotation priority sweep. Holiday absence releases the reservation for cover. Fixed positions override cellVoid markers, cleared on apply. Existing bank-holiday and blocked-page exclusions remain. Fixed rules are not a general availability model, and apply only during weekday Autofill. The weekly rotation anchor remains 4 January 2027.

`autofillVersion` covers the whole logical snapshot, including fixed rules. Do not weaken stale-preview refusal. Each report is `week.generationReport`, version 1, with generation time, week ID/name, template-relative moves, gaps, three grouped name/day lists, and a signature of generated sections/dates. Saving it in the same week record makes the report and assignments share one revision/conflict decision. Publication filtering already protects hidden week records. No separate public report RPC was added. Later assignment/structure/date edits mark the snapshot stale; it is not a rolling audit log. Personnel changes also do not rewrite a historical report. Imports validate its shape.

## Preserved behaviour

All Away dates count once per person/date, including weekends/special rotas. Public holiday, office and booth summary names/counts include unpublished weeks as explicitly requested; full week records still follow publication. 2026 covers exactly 1 November–24 December, with independent annual allowances under allowances.__years['2026']; flat allowance values remain 2027. Visible trial notes are removed, but 2026 does not claim a full-year remaining balance. Internal trial IDs remain stable.

Undo/Redo works per logical key. Pending writes, remote callbacks and save acknowledgements retain their race guards. Drag-copy locks logical rows/columns and cancels stale or invalid gestures. Preserve these protections.

## Continue safely

Run npm test after further changes. The fixture SQL belongs only in temporary test databases. The production candidate retains the public Supabase URL/key; never insert a service-role key. The SQL in this release equals v19. Tests cover 46 frontend cases plus summary, full integration and 2026 upgrade suites. Browser checks use fictional personnel with all requests redirected to a local database.

Known limits: whole-week and whole-settings-group conflict granularity; shared-role authentication; office occupancy inferred from assignments and office configuration; no universal non-working-day model; weekday-only generation reports; one report per week rather than complete history. The original handover remains historical context, but use v20 as the source candidate.
