# Dracula scripting API v1

Each plugin is a single UTF-8 JavaScript file, at most 128 KiB. There is no Node,
browser DOM, QML, package loader, direct filesystem, network, or Discord backend
access. Define handlers and commands at the top level using the global `dracula`.
JavaScript runs synchronously; promises and asynchronous handlers are unsupported.

## Execution and state

A fresh JavaScript engine runs in a separate child process for every lifecycle
event, app event, or command invocation. Top-level code is evaluated again each
time; global variables do not persist. Put side effects inside handlers and use
`dracula.storage` for persistent state. The parent enforces a two second limit and
bounded input/output. These API restrictions are not an OS security sandbox.

Errors, crashes, permission violations, or timeouts disable the plugin. Failed
invocations discard changes to its storage and notifications. Other plugins and
the application continue running. Installations, enable state, and storage survive
restarts in Dracula's config directory, under `plugins/store.json`. Storage belongs
to the local installation; plugins receiving messages must partition it by `accountId`. Other plugin data is shared across accounts; do not store secrets there.

## Identity and logging

- `dracula.apiVersion`: `1`.
- `dracula.plugin`: `{id, name, version}`.
- `dracula.log(text)`: write to Dracula's debug log (debug logging must be enabled).

## Permissions

Declare only the permissions your plugin needs in its catalog entry:

| Permission | Functions and data |
| --- | --- |
| `storage` | `dracula.storage.get(key, fallback)` and `.set(key, value)` |
| `commands` | `dracula.commands.register({id, title, run})` |
| `notifications` | `dracula.ui.notify(text)` |
| `events` | Read `ready` and `channelChanged` events |
| `messages` | Read received message snapshots, creations, edits, and deletions |
| `panels` | `dracula.ui.showLog(title, entries)` opens a plain-text searchable log viewer |

Storage accepts JSON values, with a total limit of 16 KiB (256 KiB for plugins declaring `messages`) and keys of at most 100
characters. No more than 20 commands or 20 log/notification effects may be emitted
per invocation. Command IDs use lowercase letters, numbers, and hyphens, begin
with a letter, and contain at most 64 characters. Notifications/logs are limited
to 1,000 characters, and command titles to 100 characters.

## Events

`dracula.on(name, handler)` registers a synchronous handler:

| Event | Payload | When |
| --- | --- | --- |
| `load` | `{}` | Enabled, or app starts with plugin enabled |
| `unload` | `{}` | Disabled, removed, or replaced by an update |
| `ready` | `{ready: boolean}` | Account readiness changes |
| `channelChanged` | `{id: string}` | Selected channel changes; empty ID means no selection |

`load` and `unload` need no `events` permission. App events are changes, rather
than snapshots; a plugin enabled after sign-in waits for the next readiness
change. `unload` is best effort when replacing/removing a plugin and is not called
on application shutdown. Plugins cannot read tokens or profiles, or send messages. Message access requires the separate `messages` permission.

## Commands

Registered commands appear as buttons on the plugin's card in Settings → Plugins.
The `run` callback receives `{id, accountId}`; `accountId` is the currently signed-in account, or an empty string when signed out. Register commands during top-level setup,
so the callback is available when the script is evaluated for its invocation.

## Catalog

The root JSON file uses `{"schema_version": 1, "plugins": [...]}`. Every entry has:
`id`, `name`, `version`, `description`, `author`, `api_version: 1`, `entry`, `sha256`,
and `permissions`. Only relative `.js` paths within this repository are supported.
Duplicate IDs, unsupported permissions, and unsupported API versions are rejected.
The client reads this public repository anonymously through GitHub's Contents
API. No token or login is required. Repository write permissions control who
can publish plugins.

Change `version` and `sha256` when publishing updates. Downloads are verified
against `sha256`, which detects mismatched files; it is not an author signature.
The client never automatically installs new remote code. Updating preserves local
storage and disables the plugin until users review and enable it again. Removing
a plugin deletes its storage.

## Message events and log viewers

`messageCreate` carries `{accountId, id, channelId, guildId, authorId, author, bot,
content, attachments: [{name, url}], mentioned, time}`. IDs are strings; `time` is
an observed Unix timestamp in milliseconds, and `mentioned` means a direct mention
of the current account or `@everyone`. Role mentions are not included in that flag.

`messageSnapshot` carries `{accountId, time, messages: [...]}` for loaded history,
in batches of at most 50. These are current baselines, not edit notifications.
`messageUpdate` carries `{accountId, id, channelId, time}` and only changed
`content`, `attachments`, and `mentioned` fields; absent fields mean unchanged.
`messageDelete` carries `{accountId, id, channelId, time}`. `messageDeleteBulk`
carries `{accountId, channelId, ids: [...], time}` in batches of at most 100.
Deletion events have no old content: a logger must have observed and retained it.
Message events go only to enabled plugins declaring `messages`, without granting
network, credentials, or direct Discord backend access. A bounded host event queue
can drop events under extreme load; such gaps are reported in Dracula's log.

`dracula.ui.showLog(title, entries)` needs `panels`. Each entry can contain string
`id`, `channelId`, `author`, `content`, `previous`, `kind` (`edited`, `deleted`, or
`purged`), `time`, boolean `ghostPing`, and `attachments: [{name, url}]`. At most
500 entries and 256 KiB total are allowed. Text is rendered plainly; attachments
are displayed as copyable names/URLs and are not downloaded. The viewer supports
search, kind/channel filters, refresh (`view-log` command), and confirmed deletion
of that plugin's saved data across all accounts.

## Local development

**Install local plugin…** lets you select `plugin.js` with an adjacent
`manifest.json` containing the same metadata as its catalog entry. The client
checks the SHA-256 and installs it disabled for permission review. No publication
is needed. Regenerate both manifest and catalog hashes after script edits.
