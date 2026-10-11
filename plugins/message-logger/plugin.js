// Dracula Message Logger. Original implementation using the scripting API.
var DEFAULTS = {ignoreBots: true, ignoreSelf: false, ignoredChannels: []};
var state = dracula.storage.get("logger", {messages: [], logs: [], settings: DEFAULTS});
var settings = state.settings || DEFAULTS;
function cut(text, limit) { return String(text || "").slice(0, limit).replace(/[\uD800-\uDBFF]$/, ""); }
function key(e) { return [e.accountId, e.channelId, e.id].join("/"); }
function eligible(e) { return !!e.accountId && (!settings.ignoreBots || !e.bot) && (!settings.ignoreSelf || e.authorId !== e.accountId) && settings.ignoredChannels.indexOf(e.channelId) < 0; }
function attachments(items) { return (items || []).slice(0, 3).map(function(a) { return {name: cut(a.name || "Attachment", 150), url: cut(a.url || "", 700)}; }); }
function snapshot(e) { return {key: key(e), accountId: e.accountId, id: e.id, channelId: e.channelId, authorId: e.authorId, author: cut(e.author || "Unknown author", 100), bot: !!e.bot, content: cut(e.content || "", 2000), attachments: attachments(e.attachments), mentioned: !!e.mentioned}; }
function utf8Size(text) {
    return encodeURIComponent(text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "\uFFFD")).replace(/%[0-9A-F]{2}|./g, "x").length;
}
function save() {
    while (state.messages.length > 250) state.messages.shift();
    while (state.logs.length > 350) state.logs.shift();
    while (utf8Size(JSON.stringify(state)) > 190000) {
        if (state.messages.length) state.messages.shift();
        else if (state.logs.length) state.logs.shift(); else break;
    }
    dracula.storage.set("logger", state);
}
function index(e) { var k = key(e); return state.messages.findIndex(function(m) { return m.key === k; }); }
function remember(e) { if (!eligible(e)) return; var i = index(e); if (i < 0) state.messages.push(snapshot(e)); else state.messages[i] = snapshot(e); }
function log(kind, e, m, previous) {
    state.logs.push({accountId: e.accountId, id: e.id, channelId: e.channelId, author: m.author, content: m.content, attachments: m.attachments, previous: previous || "", kind: kind, ghostPing: kind !== "edited" && !!m.mentioned, time: new Date(e.time || Date.now()).toISOString()});
}
function remove(e, kind) { var i = index(e); if (i < 0) return; var m = state.messages.splice(i, 1)[0]; if (eligible(m)) log(kind, e, m); }
dracula.on("load", function() { state.messages = []; save(); });
dracula.on("unload", function() { state.messages = []; save(); });
dracula.on("messageCreate", function(e) { remember(e); save(); });
dracula.on("messageSnapshot", function(e) { (e.messages || []).forEach(function(m) { m.accountId = e.accountId; if (index(m) < 0) remember(m); }); save(); });
dracula.on("messageUpdate", function(e) {
    var i = index(e); if (i < 0) return;
    var m = state.messages[i], previous = m.content, oldAttachments = JSON.stringify(m.attachments);
    if (Object.prototype.hasOwnProperty.call(e, "content")) m.content = cut(e.content || "", 2000);
    if (Object.prototype.hasOwnProperty.call(e, "attachments")) m.attachments = attachments(e.attachments);
    if (Object.prototype.hasOwnProperty.call(e, "mentioned")) m.mentioned = !!e.mentioned;
    if (eligible(m) && (previous !== m.content || oldAttachments !== JSON.stringify(m.attachments))) log("edited", e, m, previous);
    save();
});
dracula.on("messageDelete", function(e) { remove(e, "deleted"); save(); });
dracula.on("messageDeleteBulk", function(e) { (e.ids || []).forEach(function(id) { remove({id: id, channelId: e.channelId, accountId: e.accountId, time: e.time}, "purged"); }); save(); });
dracula.commands.register({id: "view-log", title: "View message log", run: function(e) { dracula.ui.showLog(e.accountId ? "Message log" : "Sign in to view message logs", state.logs.filter(function(m) { return m.accountId === e.accountId; }).slice().reverse()); }});
dracula.commands.register({id: "toggle-bots", title: "Toggle bot logging", run: function() { settings.ignoreBots = !settings.ignoreBots; state.settings = settings; state.messages = state.messages.filter(eligible); save(); dracula.ui.notify(settings.ignoreBots ? "Bot messages excluded." : "Bot messages included."); }});
dracula.commands.register({id: "toggle-self", title: "Toggle own messages", run: function() { settings.ignoreSelf = !settings.ignoreSelf; state.settings = settings; state.messages = state.messages.filter(eligible); save(); dracula.ui.notify(settings.ignoreSelf ? "Own messages excluded." : "Own messages included."); }});
