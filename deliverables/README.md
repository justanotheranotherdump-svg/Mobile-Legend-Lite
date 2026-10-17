# Regenerable downloads

`npm run build` generates `MOBA-Lab-Phase-1.html`, a single self-contained game.
`npm run package:source` generates `MOBA-Lab-Phase-1-source.zip`.

Downloads are ignored by Git to avoid storing regenerable bundles; they are
reproducible from the preserved source and lockfile. Windows offline file://
acceptance still requires manual testing. See ../README.md and ../docs/PHASE_1.md.
