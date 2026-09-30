# News Rota v23 — validation

## Frontend

88 checks pass, including script parsing and all 80 previous checks. New cases cover weekend defaults with target-date holiday exceptions; Away/notes preservation; role-based marker remapping; not-needed slots; cover-marker removal when names change; bank-holiday Friday/Monday selection; special/blocked/weekday rejection; stale save and preview refusal; backup round trips and validation; direct colour isolation and automatic reset; existing colour-key compatibility and unsafe colour rejection.

## Local database

The real RPC suite passes against PGlite using original setup, concurrent-editing upgrade and cumulative public-totals SQL. Two Operations sessions save/read weekend defaults and direct cell colours. Stale settings revisions conflict, Staff writes are denied, and public summary data stays identical after cosmetic/default-setting changes. Existing concurrent-week, same-week conflict, token-expiry, fixed-rule and publication tests also pass.

## Browser

Fictional fixture with Alice Example and Bob Example; fixed test date 7 November 2026. Verified Operations login, Edit, weekend manager, copy current weekend, save named default, persistence after reload, edit default, preview one changed assignment and apply to the target weekend. Palette and custom #123456 shading preserve the name; the dark custom colour uses white text. Automatic colour removes the override. Unsaved edits show a discard confirmation; Escape confirmation was repaired and retested. Narrow desktop layout was checked at 820 CSS pixels; the table scrolls horizontally where needed. No browser errors were logged. The saved preview contains fictional data.

## Packaging and limits

Packaged HTML matches working source; ZIP integrity and SHA-256 checksums verified. SQL, manifest and icons are unchanged from v22.5. Physical iPhone/Safari installation and live deployment were not tested. No production data was changed. The remaining inherited summary/trial/asset suites are included; they were not rerun for this release because these changes do not alter those implementations.
