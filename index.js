"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var DiscordJS = __importStar(require("discord.js"));
var env = __importStar(require("dotenv"));
var main_1 = require("./interfaces/main");
var voice_1 = require("@discordjs/voice");
var node_cron_1 = __importDefault(require("node-cron"));
env.config();
function createClient() {
    console.log("Creating client");
    return new DiscordJS.Client({
        intents: ["GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILDS"],
    });
}
var client = createClient();
var player = (0, voice_1.createAudioPlayer)();
var guildId = process.env.GUILD_ID || "";
var channelId = process.env.CHANNEL_ID || "";
client.on("ready", function () {
    var _a;
    console.log("Bot is ready!");
    var guild = client.guilds.cache.get(guildId);
    var commands;
    if (!guild) {
        commands = (_a = client.application) === null || _a === void 0 ? void 0 : _a.commands;
    }
    commands = guild === null || guild === void 0 ? void 0 : guild.commands;
    commands === null || commands === void 0 ? void 0 : commands.create({
        name: "war",
        defaultPermission: true,
        description: "Inicia uma guerra e os timers de respawn das mesmas.",
        options: [
            {
                name: "time",
                description: "Horário para a guerra ser agendada",
                type: "STRING",
            },
        ],
    });
});
client.on("messageCreate", function (message) {
    console.log("message sent:", message.content);
});
client.on("interactionCreate", function (interaction) {
    try {
        if (!interaction.isCommand()) {
            return;
        }
        var commandName = interaction.commandName, options = interaction.options;
        if (commandName === main_1.Commands.WAR) {
            var time = options.getString("time");
            var guild = client.guilds.cache.get(guildId);
            if (!guild) {
                return;
            }
            try {
                console.log("Starting war.");
                var _a = (time && (time === null || time === void 0 ? void 0 : time.split(":"))) || [], hours = _a[0], minutes = _a[1];
                var war_1 = new War();
                if (!hours || !minutes) {
                    war_1.start();
                    interaction.reply({
                        content: "Guerra iniciando agora!",
                        ephemeral: false,
                    });
                }
                var task_1 = node_cron_1.default.schedule("".concat(minutes, " ").concat(hours, " * * *"), function () {
                    war_1.start();
                    task_1.stop();
                }, {
                    scheduled: true,
                    timezone: "America/Sao_Paulo",
                });
                task_1.start();
                interaction.reply({
                    content: "Guerra agendada com sucesso para ".concat(hours, ":").concat(minutes, " de hoje."),
                    ephemeral: false,
                });
            }
            catch (err) {
                console.log(err);
            }
        }
    }
    catch (err) {
        console.log(err);
    }
});
var War = /** @class */ (function () {
    function War() {
        this.player = (0, voice_1.createAudioPlayer)({
            behaviors: {
                noSubscriber: voice_1.NoSubscriberBehavior.Pause,
            },
        });
        player.on(voice_1.AudioPlayerStatus.Playing, function () {
            console.log("The audio player has started playing!");
        });
        player.on("error", function (error) {
            console.error("Error: ".concat(error.message, " with resource"));
        });
    }
    War.prototype.start = function () {
        var guild = client.guilds.cache.get(guildId);
        if (!guild)
            return;
        var connection = (0, voice_1.joinVoiceChannel)({
            channelId: channelId,
            guildId: guildId,
            adapterCreator: guild.channels.guild.voiceAdapterCreator,
        });
        var subscription = connection.subscribe(this.player);
        this.respawnWaves();
        var task = node_cron_1.default.schedule("*/30 * * * *", function () {
            subscription === null || subscription === void 0 ? void 0 : subscription.unsubscribe();
            connection.disconnect();
            task.stop();
        });
    };
    War.prototype.respawnWaves = function () {
        return __awaiter(this, void 0, void 0, function () {
            var waves, timer;
            var _this = this;
            return __generator(this, function (_a) {
                waves = [
                    {
                        time: 20,
                        quantity: 14,
                    },
                    {
                        time: 28,
                        quantity: 12,
                    },
                    {
                        time: 36,
                        quantity: 9,
                    },
                    {
                        time: 44,
                        quantity: 7,
                    },
                    {
                        time: 52,
                        quantity: 5,
                    },
                    {
                        time: 60,
                        quantity: 5,
                    },
                ];
                timer = function (wave) {
                    return new Promise(function (resolve) {
                        var currentSeconds = 0;
                        var quantity = wave.quantity;
                        var interval = setInterval(function () {
                            var timeLeft = wave.time - currentSeconds;
                            currentSeconds = currentSeconds + 1;
                            console.log("Tempo restante: ", timeLeft);
                            if (timeLeft === 15) {
                                var audio_15_seconds = (0, voice_1.createAudioResource)("/home/matheus/Development/nw/nw-war-bot/audio/15_seconds_to_respawn_PTBR.mp3");
                                _this.player.play(audio_15_seconds);
                                console.log("10 SEGUNDOS PARA O RESPAWN");
                            }
                            if (timeLeft === 5) {
                                var audio_5_seconds = (0, voice_1.createAudioResource)("/home/matheus/Development/nw/nw-war-bot/audio/5_seconds_to_respawn_PTBR.mp3");
                                _this.player.play(audio_5_seconds);
                                console.log("5 SEGUNDOS PARA O RESPAWN");
                            }
                            if (timeLeft === 0) {
                                console.log("RESPAWNOU");
                                var respawn = (0, voice_1.createAudioResource)("/home/matheus/Development/nw/nw-war-bot/audio/respawn.mp3");
                                _this.player.play(respawn);
                                currentSeconds = 0;
                                quantity = quantity - 1;
                                if (quantity === 0)
                                    clearInterval(interval);
                            }
                            if (quantity === 0) {
                                console.log("Próxima onda");
                                resolve();
                            }
                        }, 1000);
                    });
                };
                waves
                    .reduce(function (chain, item) { return chain.then(function () { return timer(item); }); }, Promise.resolve())
                    .then(function () { return console.log("All waves finished"); });
                return [2 /*return*/];
            });
        });
    };
    return War;
}());
client.login(process.env.TOKEN);
