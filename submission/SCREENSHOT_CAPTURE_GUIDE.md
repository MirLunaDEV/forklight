# Devpost Screenshot Capture Guide

The automated browser successfully controlled and verified the live app, but its built-in screenshot command timed out on the WebGL page. Capture these five images manually from the public URL without opening DevTools.

## General framing

- Use a clean browser window with no personal tabs, bookmarks, notifications, profile menu, or DevTools visible.
- Use a 3:2 viewport or crop, such as 1440×960 or 1200×800.
- Save PNG or high-quality JPG under 5 MB each.
- Keep the full Forklight header, 3D warehouse, right-side decision panel, and relevant status visible.
- Do not use `?qa=1`; the QA panel must remain hidden.
- Start from a fresh tab before the first shot.

Save files under `submission/media/` with these exact names.

## 01-human-policy-draft.png

1. Open the public URL in a fresh tab.
2. Do not lock policy.
3. Capture MAIN rev 1, `Policy draft`, HUMAN POLICY, `Exploration paused`, and the empty Futures area.

## 02-policy-locked.png

1. Click **Lock policy**.
2. Capture `Policy locked` and `Agent exploration enabled` with the policy values visible.

## 03-futures-comparison.png

1. Run the A/B/C prompt from `docs/JUDGE_TESTING.md` through comparison.
2. Capture the Futures cards showing:
   - route-a FAIL with distance +10.5%;
   - route-b VERIFIED;
   - route-c FAIL with protected count 1.
3. Keep the metrics and MAIN rev 1 visible.

## 04-capability-unlocked.png

1. Click **Approve for Merge** on route-b.
2. Capture `Approved for Merge` and the capability-unlocked message.
3. If the browser exposes its WebMCP tool list without DevTools, include the visible merge-capability indication; otherwise rely on the product banner.

## 05-merged-main.png

1. In a WebMCP-capable session that permits the call, invoke `merge_verified_branch` for route-b.
2. Capture MAIN rev 2, route-b merged, and route-a/route-c stale.
3. Ensure the capability-unlocked state has disappeared.

The fifth image requires a browser host that permits the production merge call. Do not fake the merged UI. If the host denies the call, use the first four images and explain that the verified live-local merge evidence is documented in `docs/LIVE_WEBMCP_RESULT.md`.
