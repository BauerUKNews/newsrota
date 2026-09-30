# News Rota v23 — weekend defaults and cosmetic cell colours

Prepared 30 September 2026. Includes all previous releases. This package has not been deployed to the live site.

## Install

When upgrading from v22.5, replace **index.html** in the GitHub repository. No SQL, icon or manifest update is required. Wait for GitHub Pages to finish deploying, reload and check the footer says **News Rota v23**. Existing saved rota data is retained.

Keep a backup of your deployed HTML. rollback/previous-v22.5.html is the previous delivered candidate; it may differ from your deployed version. Older setup requirements are in README-v21.md. README-v22.5.md describes the existing desktop and phone interface.

## Weekend defaults

1. On desktop, select Operations and turn on Edit.
2. Open the weekend you want to copy, then More options (⋮) → Weekend defaults. The weekday Default templates manager also links here.
3. Choose Copy this weekend, or New blank default. Give it a name, edit its role names and assignments, then Save default. Duplicate creates another reusable version. Friday and Monday assignments are used only when those bank-holiday days belong to the target weekend.
4. Navigate to the weekend you want to populate. Open Weekend defaults and choose the saved default.
5. Select Preview and apply to this weekend. Review the changes and holiday exceptions, then Apply default.

Applying replaces the target weekend's job rows, including removal of roles not in the default. The preview lists removed roles. Dates, Away entries, week notes and publication settings are retained. People listed on holiday on the target dates are skipped. Existing not-needed slots remain blank for matching roles. Cell colours, notes and not-needed markers follow uniquely matching role names; cover flags survive only where the person is unchanged. Removed or renamed roles lose their old cell markers.

Saving a default does not change any existing weekend. Applying is an explicit action for the selected weekend; it does not regenerate all future weekends. Defaults store roles and names only, not colours, holidays, notes, dates or cover flags. Christmas and other special/separate rotas are excluded. Existing undo/history and backup export/import include these changes. Wait for the saved status before closing.

## Cell colours

In Operations Edit mode, right-click a rota cell. Choose a palette colour, a labelled colour from your existing key, or use Custom colour. Choose Automatic colour (freelance / cover) to remove the override.

The override is cosmetic: it does not change the name, freelance classification, cover flag, holiday allowance, rules or totals. The original automatic shading returns when the override is removed. Colours belong to cells, not people. They sync to other viewers and appear in the phone day view and email rendering too. Editing remains desktop-only.

## Validation

88 frontend checks pass, including weekend holiday exceptions, bank holidays, special-rota protection, marker remapping, stale previews, backup round trips and cosmetic colour isolation. Local database RPC tests pass for shared persistence, revision conflicts, Staff write denial and unchanged summary totals. Browser checks used fictional data. See TEST-RESULTS.md.

Physical iPhone/Safari installation and production deployment were not tested. Run npm install, then npm test for the packaged test suites. Tests use local fictional databases; never point them at production.
