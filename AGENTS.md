# Project instructions

These rules apply to all work in this repository.

- **Deploy only runtime files.** Publish only files required to run the website, using the repository's existing deployment process. Exclude Word documents and other authoring material, reports, tests, tools, backups, `.env` files, secrets, and temporary files. Validate the deployment file list before uploading. Keep deployment archives outside the public web directory.
- **Keep testing proportional to the change.** Test the changed behavior and its affected dependencies. When shared code changes, cover the affected languages and relevant mobile/dark-mode behavior. Run required automated checks and a brief live check after deployment. Reserve full-site audits for major changes, evidence of a widespread problem, or an explicit user request; do not repeat broad QA without a new reason.
- **No unsolicited recurring QA.** Do not create, enable, or restart scheduled QA checks, monitors, or recurring verification loops unless the user explicitly asks. Stop when the authorized checks are complete.
