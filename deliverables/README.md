> **Current review follow-up:** editable Computer rosters, timed hero selection/actual team loading, 37 Attack/Movement items in the restored wide shop, queued skills, Recall/Regen and flipped improved lane. See [../docs/ROSTER_EQUIPMENT_FOLLOWUP.md](../docs/ROSTER_EQUIPMENT_FOLLOWUP.md). This follow-up is uncommitted pending review.

# Regenerable offline downloads — AI Training / Brawl

- `npm run build`: **MOBA-Lab-Phase-3.html**, the complete self-contained game.
- `npm run package:source`: **MOBA-Lab-Phase-3-source.zip**, editable source + tests + docs + playable root index.
- Root `../index.html`, `../dist/index.html` and the named HTML are byte-identical. The historical Phase-3 filename is retained solely for packaging compatibility.

Open either HTML alone in Chrome/Edge with WebGL2, including offline. No Node, server, sibling assets or CDN is required to play. Edit `src/` / `dev.html`, not generated index. Dependencies, reference screenshots, test screenshots and duplicate builds are excluded from the source ZIP.

Main Menu → MODE → AI TRAINING ROOM → choose scenario, or BRAWL → local room → START GAME → choose Layla → CONFIRM → local loading → countdown/gameplay. Practice is the preserved separate dummy map; lane modes have real waves, Training Bots, sequential towers/cores, XP/gold, six-slot items, death/respawn, actual results and fresh replay/menu return. Only Layla is selectable. Classic/Ranked remain disabled.

The approved GLB/creation PNG are unchanged. Newly authored PNG controls and procedural causeway/bot geometry are original temporary prototype art. Recall/Regen/spell controls remain art-only reserved slots. Match gold never alters the persistent account wallet (30,000 coins / 0 diamonds granted once). Shop and Settings retain centered non-modal gameplay behavior; match pause/quit actually freezes the simulation.

See `../docs/AI_TRAINING_BRAWL.md` for values, limits, verification, play steps and changed-file references. Automated Linux offline/touch-emulated results do not certify native Windows/physical touch/speakers. The user subsequently authorized committing and pushing the reviewed expansion to `arena/55ce0f80-mobile-legend-lite`.
