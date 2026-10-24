---
version: 1
slug: "src-ui-features-workspace-workspace-tsx"
primary_target: "src/ui/features/workspace/Workspace.tsx"
related_targets: ["src/app/App.tsx","src/styles.css","src/ui/features/workspace/PlotToolbar.tsx"]
---

# Research workspace

Mode: Operate. Audience: genomics researchers preparing analyses and publication figures. The owner explicitly chose commit `4dfd9238410fc9f22af9c5e05290460b1eba79e4` as the exact visual reference across desktop and mobile, superseding the later atlas redesign. Keep scientific values, row identity, local processing, source versus edited groups, exports, and offline archives compatible.

## Direction contract

THESIS: Restore the chosen compact research viewer, giving the chart most of the window while keeping every tool available.

OWN-WORLD: The reference commit's black/grey interface: light grey header, black brand tile, Arial labels, small controls, fine grey rules, white chart, and floating legend. Population colours are scientific encodings and remain unchanged.

STORY: Open results, select axes, navigate/inspect/style directly from the integrated toolbar, then export. Samples Table leads the tool row; Settings and Export remain visible tools instead of new header actions.

FIRST VIEWPORT: At 1440×1000, match a 42px header, 38px integrated toolbar, 25px footer, and full-width 895px chart. At 390×844, match a 38px header, 66px two-row toolbar with horizontally scrolling tools, 19px footer, and 721px chart. Restore the original floating legend and empty surface. Keep the reusable axis component and split feature/settings architecture.

FORM: User-pinned existing implementation, reference commit `4dfd9238410fc9f22af9c5e05290460b1eba79e4`; no concept reroll or new comp. Reference and restored browser captures live in `.impeccable/review/classic-restore/`. Earlier seed:7159a573b82cdede belongs to the superseded visual world.

FINISH: Compare actual renders to the named commit, verify scientific/render/export/keyboard workflows, obtain independent review, and document the restored system. Retain meaningful bug fixes such as the visible grid control, accurate table inclusion counts, bounded export resources, keyboard ownership, and an accessible maximize/restore path. No shipping raster assets are required.
