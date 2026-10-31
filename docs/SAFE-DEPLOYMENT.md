# Automatic runtime deployment

Hostinger's repository-root automatic deployment must remain **off**. Do not use
its Redeploy button: that publishes authoring sources and can remove `/offline/`.

## Release flow

1. A push to online `main` runs Site QA. Only after all tests, source audits and
   publish-tree checks pass does it produce `audited-online-runtime` (one-day
   retention). Pull requests cannot deploy and do not receive production keys.
2. The publication workflow downloads that exact run's artifact, checks out the
   separate private offline source, builds its PWA from the audited online tree,
   and tests all five language downloads, offline reading, illustrations, mobile
   widths and service-worker isolation.
3. Both trees pass a second runtime-only allowlist and SHA-256 manifest check.
   Online and offline are published using different restricted SSH keys.
4. The installed receiver stages files **outside** `public_html`, validates every
   member and hash, obtains one shared lock, and changes only the assigned edition.
   It refuses stale workflow runs, archive traversal, symlinks, duplicate files,
   unexpected files, authoring files, archives and uploaded secrets.
5. Online promotion preserves the current `offline/` directory and existing
   `private/turnstile.json`. Offline promotion changes only `public_html/offline`.
   The runtime's existing access-denial configuration continues to protect private
   server configuration. Other new server-managed files must be explicitly added
   to the preservation policy before introduction.
6. Live checks compare entry-page hashes for every language and verify the other
   edition remains available. A failed check requests rollback of that exact run;
   it cannot roll back a later release. One previous release per edition is kept
   privately for recovery. No archives are uploaded into the public directory.

A push to `BSirajov/birinci-offline` independently tests and publishes **only** the
offline edition. It uses the current online commit only if Site QA passed, rebuilds
and audits its runtime, then imports that tree. Packages and Word/HTML manuals
remain local, outside Git. USB packages can still be built with `tools/package.py`.

## Hosting setup

Install `tools/deployment_receiver.py` and `tools/runtime_bundle.py` in a private
directory beside `public_html`. Receiver updates are manual and reviewed: CI
credentials cannot replace the receiver or run an unrestricted shell.

Each SSH authorized-key entry must specify a fixed forced command:

```
restrict,command="/usr/bin/python3 /FIXED/PRIVATE/deployment_receiver.py /FIXED/DOMAIN online" ssh-ed25519 ...
restrict,command="/usr/bin/python3 /FIXED/PRIVATE/deployment_receiver.py /FIXED/DOMAIN offline" ssh-ed25519 ...
```

Only `deploy RUN_ID`, `status`, and `rollback RUN_ID` are accepted. There is no
SFTP, arbitrary shell command, forwarding, agent forwarding, or PTY access.
The temporary bootstrap key must be removed after setup.

GitHub's `production` environment is restricted to `main` in both repositories.
Online environment secrets: `ONLINE_DEPLOY_KEY`, `OFFLINE_DEPLOY_KEY`, and
`OFFLINE_SOURCE_READ_KEY` (a read-only deploy key for the private offline repo).
Offline environment secret: `OFFLINE_DEPLOY_KEY` only. Neither repository stores
the hosting password or a general-purpose GitHub token.

Both environments use `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, and
`DEPLOY_KNOWN_HOSTS`. Verify the ED25519 host fingerprint against hPanel before
setting known_hosts. Never use `StrictHostKeyChecking=no`.

## Operation and recovery

- Push reviewed changes to the relevant repository's `main`; inspect its Actions
  run. To retry online, run Site QA with **Run workflow**. For offline, use
  **Offline QA and deployment → Run workflow**. A new run is required after a
  rollback or successful publication; reusing an already-published run is refused.
- Keep GitHub collaborators and workflow-edit permissions limited: a main-branch
  workflow can access its environment's deployment credentials.
- Deployment uses two same-filesystem directory renames. This avoids partial-file
  uploads but can leave a very brief gap between renames; it is not a guarantee of
  zero downtime. A rename failure restores the previous directory. A host crash
  between renames requires an administrator to restore the private previous tree.
- If deployment fails after the online edition succeeds, the offline edition
  remains on its previous release; rerun the workflow to bring it up to date.
- Offline users keep their downloaded packs and see the application's normal
  update option. Online promotion never modifies their browser caches.
- No schedules, monitors, recurring audits, or automatic repository-root uploads
  are installed by this setup.
