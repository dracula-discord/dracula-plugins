# Dracula plugins

JavaScript plugins for Dracula's **Settings → Plugins** tab. The client reads
`catalog.json` from this repository's default branch. No release or npm package
is needed. The catalog and script download are pinned to the same Git commit.
The repository is public. Dracula loads its catalog automatically, without a
GitHub account, token, or key. Upload rights stay with the GitHub
collaborators or teams you grant write access to.

## Publish a plugin

1. Create `plugins/<id>/plugin.js`. Use the example in `plugins/hello-dracula`.
2. Add an entry to `catalog.json` with a unique ID, version, API version, script
   path, SHA-256, author, description, and permissions.
3. Recompute `sha256` after every script change. Hash the exact UTF-8 file bytes.
   PowerShell: `(Get-FileHash plugins/<id>/plugin.js -Algorithm SHA256).Hash.ToLower()`.
4. Commit and publish the files when ready. Users press **Refresh**, then **Install**
   and **Enable**. Updates stay disabled until users review the permissions again.

See [API.md](API.md) and [dracula.d.ts](dracula.d.ts) for the scripting API. JavaScript
works directly; TypeScript authors must compile their code to one JavaScript file.

Git must preserve script line endings because each checksum covers its exact bytes.
Use the provided `.gitattributes` when adding or updating plugins.
