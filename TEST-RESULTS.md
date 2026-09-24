# News Rota v22.4 — validation

75 frontend checks pass, including inline-script parsing, a complete Monday–Sunday timeline with an unassigned Wednesday and weekend, and rendering the blank date row with an accessible label without inflating shift/holiday counts. Existing publication tests confirm hidden assignments remain inaccessible and unpublished dates do not become blank published days.

Local browser checks using fictional fixtures confirm the published 2–8 November week includes Sunday with a dash after Saturday's assignment. The empty 18–24 January week includes all seven dated rows. Desktop and 390-pixel phone layouts were checked; no horizontal overflow or browser errors were observed.

Packaged HTML matches working source; ZIP and checksums verified. SQL, icons and manifest are unchanged. Database suites and physical iPhone installation were not repeated for this presentation change. No live deployment or production writes occurred.
