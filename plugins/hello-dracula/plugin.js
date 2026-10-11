// Register commands and event handlers at the top level. Put effects in handlers.
dracula.on("load", function () {
    dracula.log("Hello Dracula enabled");
});

dracula.on("ready", function (event) {
    if (event.ready) dracula.ui.notify("Welcome back to Dracula!");
});

dracula.commands.register({
    id: "say-hello",
    title: "Say hello",
    run: function () {
        var count = dracula.storage.get("greetings", 0) + 1;
        dracula.storage.set("greetings", count);
        dracula.ui.notify("Hello from your first plugin! Greeting #" + count);
    }
});

dracula.on("unload", function () {
    dracula.log("Hello Dracula disabled");
});
