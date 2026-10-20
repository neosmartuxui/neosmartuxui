# NeoSmartUXUI — recovery and local release

## Source of truth

- GitHub organization: https://github.com/neosmartuxui
- Main source: https://github.com/neosmartuxui/neosmartuxui
- Generated Pages: https://github.com/neosmartuxui/neosmartuxui.github.io
- Development URL: https://neosmartuxui.github.io/
- Windows clone: D:\neosmartuxui-recovered\neosmartuxui
- Immutable backup: D:\Github Recovoery\github-api-recovery-20260923-120559\neosmartui

## Recovery integrity

All 11 original main branches were byte-verified and restored as new commits. This recovery used GitHub API tree snapshots, NOT a Git mirror. The original historical DAG, issues, PRs and release metadata are not recreated. The original main library snapshot set contains 43 branch snapshots; 42 passed the local Git-object audit including main. The old docs/component-first-roadmap branch is incomplete; do not import it.

Do not bulk-push old feature branches. Their old merge state cannot be proved from a complete history; the recovered main is canonical. If a missing feature is found, inspect a verified old snapshot locally and replay selected changes as a new reviewed PR, never reset main.

## Compatible schema protocol

Visible branding, GitHub organization/repository paths, and generated deployment metadata use NeoSmartUXUI. Existing neosmartui/*@1 component, theme, token, and preview schema IDs and theme.family=neosmartui stay unchanged intentionally to preserve stable v1 machine contracts. Old native events and Studio preview channel IDs remain compatible. Newly-generated deployment-record@1 identities instead use the new neosmartuxui namespace and source repo.

Original public-proof evidence and maintenance records retain old repository/URL/hash references. They are immutable historical records, not live proof for the new Pages host. Never edit them to manufacture validity.

## GitHub Actions restrictions

GitHub Actions MUST stay disabled on all NeoSmartUXUI repositories. No GitHub-hosted general compute, scraping, third-party website automations, persistent jobs, scheduled agents, or proof laundering. Test/build on your computer or controlled VPS and deploy static output through explicit Git push.

## Windows local verification

Use npm.cmd on PowerShell to avoid execution-policy blocks.

1. npm.cmd ci — reproducibly install local testing dependencies
2. npm.cmd run quality:restore — check recovery-compatible architecture/contracts and build both apps
3. Set NEOSMARTUXUI_BROWSER_CHANNEL=chrome for installed Chrome; omit for Playwright bundled Chromium
4. npm.cmd run test:browser — Foundry browser tests
5. npm.cmd run test:studio — Studio browser tests
6. After source commit, set NEOSMARTUXUI_SOURCE_SHA to that verified commit SHA, rebuild both artifacts, and deploy both generated outputs to the Pages repository
7. Confirm Actions permission enabled=false for both repositories, and verify the live /deployment.json and /studio/deployment.json records against the intended source SHA

The strict npm run quality still checks original pre-rebrand public-proof cryptographic evidence, so it is not considered green until legitimate new-site proof is obtained. A successful local build does not establish public-proof.

## Custom domain

Use GitHub Pages for now. Custom domain, registrar and DNS changes remain deferred; do not assume ownership of neosmartuxui.com.
