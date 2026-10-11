/** Dracula scripting API v1. Compile TypeScript to a single plain JS file. */
declare const dracula: {
    readonly apiVersion: 1;
    readonly plugin: Readonly<{id: string; name: string; version: string}>;
    log(text: string): void;
    on(event: "load" | "unload", handler: (event: {}) => void): void;
    on(event: "ready", handler: (event: {ready: boolean}) => void): void;
    on(event: "channelChanged", handler: (event: {id: string}) => void): void;
    on(event: "messageCreate", handler: (event: DraculaMessage & {accountId: string; time: number}) => void): void;
    on(event: "messageSnapshot", handler: (event: {accountId: string; time: number; messages: DraculaMessage[]}) => void): void;
    on(event: "messageUpdate", handler: (event: {accountId: string; id: string; channelId: string; time: number; content?: string; attachments?: DraculaAttachment[]; mentioned?: boolean}) => void): void;
    on(event: "messageDelete", handler: (event: {accountId: string; id: string; channelId: string; time: number}) => void): void;
    on(event: "messageDeleteBulk", handler: (event: {accountId: string; channelId: string; ids: string[]; time: number}) => void): void;
    storage: {
        get<T>(key: string, fallback: T): T;
        set(key: string, value: null | boolean | number | string | object): void;
    };
    ui: {notify(text: string): void; showLog(title: string, entries: DraculaLogEntry[]): void};
    commands: {register(command: {id: string; title: string; run(event: {id: string; accountId: string}): void}): void};
};

interface DraculaAttachment {name: string; url: string}
interface DraculaMessage {id: string; channelId: string; guildId: string | null; authorId: string; author: string; bot: boolean; content: string | null; attachments: DraculaAttachment[]; mentioned: boolean}
interface DraculaLogEntry {id: string; channelId: string; author: string; content: string; previous?: string; kind: "edited" | "deleted" | "purged"; time: string; ghostPing?: boolean; attachments?: DraculaAttachment[]}
