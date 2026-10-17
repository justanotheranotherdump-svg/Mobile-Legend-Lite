# Regenerable downloads

`npm run build` generates `MOBA-Lab-Phase-1.1.html`, a single self-contained game.
`npm run package:source` generates `MOBA-Lab-Phase-1.1-source.zip`.

The root ../index.html is also the same standalone game and is intentionally
tracked in Git so downloaded GitHub ZIPs play without building. Edit ../dev.html
and ../src/, not the generated index. Duplicate downloads are ignored by Git; they are
reproducible from the preserved source and lockfile. Windows offline file://
acceptance still requires manual testing. See ../README.md and ../docs/PHASE_1_1.md.
