# Live Shop and Settings panels

Date: 2026-10-18. User-requested correction to the previous combat-control milestone.
This supersedes **menu input gating and menu-triggered gesture cancellation** in
older rules/reports. It does not change the Layla kit, economy, balance or model.

## Behavior

- Normal Layla mode uses **non-modal side panels**, not a modal backdrop or focus
  trap. Simulation continues; **WASD, Space/basic attack, keyboard skills and exposed
  HUD/battlefield pointer controls stay usable** with Shop or Settings open.
- Opening, switching, toggling or closing a panel does not clear held movement or
  cancel a held skill. Key release still stops movement or completes the gesture.
  While aiming, moving the actual pointer to a panel also moves the aim; aim back
  at the intended destination before releasing the skill key.
- Click a panel trigger again to toggle it closed. Opening the other panel switches
  panels. X closes it. **Escape cancels an active skill first; another Escape closes
  the panel.** Closing returns focus to the battlefield without requiring a new
  movement-key press.
- **Editors keep their keys:** key-binding/select/input controls do not turn typing
  or native selection into attacks/casts. WASD is allowed on closed selects and
  checkbox/radio controls; actual text/number entry suspends movement too. A native
  expanded select popup owns its OS keyboard interaction. Deliberately clicking a
  visible skill or the battlefield leaves editing focus and acts on the first click.
- Combat still obeys range, resources, cooldowns, target locks and collision rules.
  The full **1.05s Shoot/cast movement lock** remains intentional; held WASD resumes
  after it. Blur, visibility changes and reset still clear stale inputs. Key-binding
  edits cancel in-progress gestures safely.
- Shop remains **empty slots only**: no purchases, items, money or economy added.
  No joystick, new hero, animation, rig, map, actor or AI added. The approved GLB
  remains byte-unchanged, SHA256
  `963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.
- Explicit `?hero=training` retains the historical modal policy solely for older
  foundation regression coverage. It is not used to claim default-mode validation.

## Implementation

`Controls` defaults to `allowMenuGameplay: true`; main explicitly opts the historical
fixture out. Separate movement/combat editor guards replace the global dialog guard
for the normal game. Keyboard dispatch and skill gestures use the same combat policy.
An intentional battlefield/HUD pointer press transfers focus before validation so a
previously focused editor does not swallow the first gameplay click.

Shop/Settings use `dialog.show()` instead of `showModal()` in normal mode. They
retain their existing contents/accessibility labels but become fixed left-side
panels with compact-height sizing. The visible right-side battlefield and attack/
three-skill HUD stay reachable. Skill cancel/help renders above panels. No gameplay
rules or damage ownership moved into UI code.

## Validation

Final fresh results: **170/170 unit checks, 16/16 live-panel browser checks,
19/19 default combat browser checks and 50/50 historical foundation browser checks
passed**. All three offline browser suites recorded zero runtime errors, warnings
and subresource requests. Detailed results are in the adjacent `live-panels-*.json`
files. The full unchanged foundation rerun exited successfully with the supported
`BROWSER_PATH` override; the earlier screenshot timeout remains recorded below.
Run browser suites **serially** with software WebGL:

```sh
npm test
npm run package:source
npm run test:browser:panels
npm run test:browser:layla
npm run test:browser
npm run validate:offline
```

The new default-mode panel suite tests held/fresh WASD, keyup, real damage from
skills/basic shortcuts, pointer skill hold/release, battlefield LMB, preserved
ongoing aim, Escape precedence, panel switching/toggling/X, editor safety and
first-click pointer refocus, blur clearing, plus both panels at 1440×900, 960×540
and 800×450 with reachable close/attack/all three skills. It runs the actual
standalone HTML at offline `file://`, not a mocked UI.

The first updated default combat-suite attempt passed 12 cases, then failed its
new menu case because the test clicked Settings while holding manual aim and
incorrectly expected the aim to remain on the former enemy. The moving real pointer
correctly redirected the preserved sight. The next attempt projected the elevated
enemy label rather than its ground position,
so it also missed the manual sight acquisition radius. The test now explicitly aims
at the enemy ground position before release, still requiring the exact real damage.
Both results are retained in `live-panels-initial-browser-attempt.json` and
`live-panels-ground-projection-attempt.json`; neither produced app errors or justified
relaxing damage assertions. A focused real-browser reproduction verified the corrected
ground-aim case before the final full-suite rerun.

The first foundation rerun completed 48 functional checks with no app errors,
warnings or network requests, then hit a 30s screenshot timeout in the historical
single-process Chromium configuration. It is retained in
`live-panels-foundation-initial-attempt.json`. The full unchanged suite was rerun
with its supported `BROWSER_PATH` override and the same safe multiprocess software-
WebGL launch used by the default suites; assertions were not relaxed. On this
minimal Linux image the bundled NSS library directory was supplied through
`LD_LIBRARY_PATH`. Browser binaries/libraries remain outside the source ZIP.

See [changed files](LIVE_PANELS_CHANGED_FILES.md).

Earlier combat-control reports retain historical counts/results; see
[COMBAT_CONTROLS.md](COMBAT_CONTROLS.md) for unchanged kit and movement-lock details.
Generated screenshots and build downloads stay outside source control. The source
ZIP includes editable source/tests/docs and the playable root HTML, not dependencies
or uploaded references. Root/build/download HTML must remain byte-identical.

**Limitations:** automated acceptance uses Linux Chromium/software WebGL. Native
Windows Chrome/Edge double-click and physical touch remain manual; no all-device or
portrait certification. This remains a keyboard-movement training game.

The user subsequently authorized committing and pushing this verified milestone to
`arena/55ce0f80-mobile-legend-lite`, because the remote branch still served the older
menu-blocking build. Stop after updating that branch; no additional gameplay is authorized.
