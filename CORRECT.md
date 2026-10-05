# CORRECT — workchat-pip (trivial repo, honest audit)
No qualifying class: only 2 commits (bebb724 first, 25349c2 scrollback 200), zero fix/revert/review commits — nothing happened twice, so no guard was invented. Watch, not a class: `tm.js:to_popup_html` interpolates `msg.text/group` raw and `send_mesage_to_popup` inserts via `escapeHTMLPolicy.createHTML` (single-file Tampermonkey script; Workplace DOM updates break selectors per README) — escape/sanitise there first if touched.
| Rule | Do | Never |
|---|---|---|
| Scope | single `tm.js`, paste-into-Tampermonkey per README | add build/deps/server |
| Scrollback | one named limit (currently slice 200 in render_all_messages) | scatter magic numbers |
