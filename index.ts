import * as DiscordJS from "discord.js";
import * as env from "dotenv";
import express from "express";
import { Commands } from "./interfaces/main";
import {
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
  AudioPlayerStatus,
  joinVoiceChannel,
  AudioPlayer,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import nodeCron from "node-cron";

env.config();

interface Wave {
  quantity: number;
  time: number;
}

function createClient() {
  console.log("Creating client");
  return new DiscordJS.Client({
    intents: ["GUILD_VOICE_STATES", "GUILD_MESSAGES", "GUILDS"],
  });
}

const client = createClient();
const player = createAudioPlayer();
const guildId = process.env.GUILD_ID || "";
const channelId = process.env.CHANNEL_ID || "";

class War {
  player: AudioPlayer;

  constructor() {
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    player.on(AudioPlayerStatus.Playing, () => {
      console.log("The audio player has started playing!");
    });

    player.on("error", (error) => {
      console.error(`Error: ${error.message} with resource`);
    });
  }

  start() {
    const guild = client.guilds.cache.get(guildId);

    if (!guild) return;

    const connection = joinVoiceChannel({
      channelId: channelId,
      guildId: guildId,
      adapterCreator: guild.channels.guild.voiceAdapterCreator as any,
    });

    const subscription = connection.subscribe(this.player);

    connection.on("stateChange", (state) => {
      if (state.status === VoiceConnectionStatus.Destroyed) {
        subscription?.unsubscribe();
        connection.disconnect();
      }
    });

    this.respawnWaves();

    const task = nodeCron.schedule("*/30 * * * *", () => {
      subscription?.unsubscribe();
      connection.disconnect();
      task.stop();
    });
  }

  private async respawnWaves() {
    const waves: Wave[] = [
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

    const timer = (wave: Wave) => {
      return new Promise<void>((resolve) => {
        let currentSeconds = 0;
        let quantity = wave.quantity;

        const interval = setInterval(() => {
          const timeLeft = wave.time - currentSeconds;
          currentSeconds = currentSeconds + 1;

          console.log("Tempo restante: ", timeLeft);

          if (timeLeft === 15) {
            const audio_15_seconds = createAudioResource(
              `${__dirname}/audio/15_seconds_to_respawn_PTBR.mp3`
            );

            this.player.play(audio_15_seconds);
            console.log("15 SEGUNDOS PARA O RESPAWN");
          }

          if (timeLeft === 5) {
            const audio_5_seconds = createAudioResource(
              `${__dirname}/audio/5_seconds_to_respawn_PTBR.mp3`
            );

            this.player.play(audio_5_seconds);
            console.log("5 SEGUNDOS PARA O RESPAWN");
          }

          if (timeLeft === 0) {
            console.log("RESPAWNOU");
            const respawn = createAudioResource(
              `${__dirname}/audio/respawn.mp3`
            );

            this.player.play(respawn);

            currentSeconds = 0;
            quantity = quantity - 1;

            if (quantity === 0) clearInterval(interval);
          }

          if (quantity === 0) {
            console.log("Próxima onda");
            resolve();
          }
        }, 1000);
      });
    };

    waves
      .reduce((chain, item) => chain.then(() => timer(item)), Promise.resolve())
      .then(() => console.log("All waves finished"));
  }
}
const app = express();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(PORT, () => {
  client.login(process.env.TOKEN);
  console.log(`Example app listening on port ${PORT}`);

  client.on("ready", () => {
    console.log("Bot is ready!!");

    const guild = client.guilds.cache.get(guildId);

    let commands;

    if (!guild) {
      commands = client.application?.commands;
    }

    commands = guild?.commands;

    commands?.create({
      name: "war",
      defaultPermission: true,
      description: "Inicia uma guerra e faz a contagem dos timers de respawn.",
      options: [
        {
          name: "time",
          description: "Horário para a guerra ser agendada",
          type: "STRING",
        },
      ],
    });
  });

  client.on("messageCreate", (message) => {
    console.log("message sent:", message.content);
  });

  client.on("interactionCreate", (interaction) => {
    try {
      if (!interaction.isCommand()) {
        return;
      }

      const { commandName, options } = interaction;

      if (commandName === Commands.WAR) {
        const time = options.getString("time");
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
          return;
        }

        try {
          console.log("Starting war.");
          const [hours, minutes] = (time && time?.split(":")) || [];

          const war = new War();

          if (!hours || !minutes) {
            war.start();
            interaction.reply({
              content: `Guerra iniciando agora!`,
              ephemeral: true,
            });
          }

          const task = nodeCron.schedule(
            `${minutes} ${hours} * * *`,
            () => {
              war.start();
              task.stop();
            },
            {
              scheduled: true,
              timezone: "America/Sao_Paulo",
            }
          );

          task.start();

          interaction.reply({
            content: `Guerra agendada com sucesso para ${hours}:${minutes} de hoje.`,
            ephemeral: true,
          });
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err) {
      console.log(err);
    }
  });
});
