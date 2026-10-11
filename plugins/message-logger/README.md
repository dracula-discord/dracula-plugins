# Message Logger

Original Dracula plugin using message events, not BetterDiscord code.

Install locally: Settings → Plugins → Install local plugin… → choose `plugin.js`
from this folder, review permissions, and enable. Then use **View message log**.
The adjacent `manifest.json` verifies the script checksum. Publication uses the
entry in the root catalog.

Retains edits, deletions, and bulk deletions of observed messages; marks deleted
messages that directly mentioned you or `@everyone` as ghost pings. Fetching a
channel while enabled establishes a current baseline without inventing edits.
Bot messages are excluded by default; your own messages are included. The two
command buttons toggle these settings. Add channel IDs to `DEFAULTS.ignoredChannels`
before first installation to exclude channels (clear saved data to reset defaults).

Limits: 250 cached messages and 350 log entries across all accounts, with oldest
entries evicted to stay below a 190,000-byte payload budget. Text is retained up
to 2,000 UTF-16 code units per version; up to three attachment names/URLs are
retained. Attachment files are not downloaded and URLs may expire. Logs survive
restarts, but temporary baselines are reset on enable/start/disable. Viewers show
only the active account. Clear saved data removes all accounts' data for this plugin.

The logger cannot recover unseen or evicted deleted content and captures nothing
while disabled or the app is closed. Under extreme load the bounded host event
queue may drop callbacks and report a gap in Dracula's log. This first version
has a separate viewer; it does not restore deleted rows inline in chat, reproduce
all MessageLoggerV2 settings, cache images, or detect role-mention ghost pings.
