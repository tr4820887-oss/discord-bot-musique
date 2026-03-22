import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  TextChannel,
  Message,
} from "discord.js";
import { DisTube } from "distube";
import { YtDlpPlugin } from "@distube/yt-dlp";

const PREFIX = "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const distube = new DisTube(client, {
  plugins: [new YtDlpPlugin({ update: false })],
});

client.once("clientReady", () => {
  console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
  console.log(`🎵 Préfixe : ${PREFIX}`);
});

client.on("messageCreate", async (message: Message) => {
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(PREFIX)
  )
    return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();
  const voiceChannel = message.member?.voice.channel;

  try {
    switch (command) {
      case "play":
      case "p": {
        if (!voiceChannel) {
          await message.reply(
            "❌ Tu dois être dans un salon vocal pour jouer de la musique !"
          );
          return;
        }
        const query = args.join(" ");
        if (!query) {
          await message.reply(
            "❌ Donne-moi une URL YouTube ou un titre à rechercher !\n**Exemple :** `!play Daft Punk Get Lucky`"
          );
          return;
        }
        await message.react("🔍");
        await distube.play(voiceChannel, query, {
          message,
          textChannel: message.channel as TextChannel,
        });
        break;
      }

      case "skip":
      case "s": {
        const queue = distube.getQueue(message.guild);
        if (!queue) {
          await message.reply("❌ Aucune musique en cours de lecture !");
          return;
        }
        await queue.skip();
        await message.reply("⏭️ Musique suivante !");
        break;
      }

      case "stop": {
        const queue = distube.getQueue(message.guild);
        if (!queue) {
          await message.reply("❌ Aucune musique en cours de lecture !");
          return;
        }
        await queue.stop();
        await message.reply("⏹️ Musique arrêtée et file d'attente vidée !");
        break;
      }

      case "pause": {
        const queue = distube.getQueue(message.guild);
        if (!queue) {
          await message.reply("❌ Aucune musique en cours de lecture !");
          return;
        }
        if (queue.paused) {
          await message.reply("⚠️ La musique est déjà en pause ! (`!resume`)");
          return;
        }
        queue.pause();
        await message.reply("⏸️ Musique mise en pause !");
        break;
      }

      case "resume":
      case "r": {
        const queue = distube.getQueue(message.guild);
        if (!queue) {
          await message.reply("❌ Aucune musique en cours !");
          return;
        }
        if (!queue.paused) {
          await message.reply("⚠️ La musique n'est pas en pause !");
          return;
        }
        queue.resume();
        await message.reply("▶️ Lecture reprise !");
        break;
      }

      case "queue":
      case "q": {
        const queue = distube.getQueue(message.guild);
        if (!queue || queue.songs.length === 0) {
          await message.reply("📭 La file d'attente est vide !");
          return;
        }
        const songs = queue.songs
          .slice(0, 10)
          .map(
            (s, i) =>
              `${i === 0 ? "🎵 **En cours**" : `\`${i}.\``} ${s.name} — \`${s.formattedDuration}\``
          )
          .join("\n");

        const embed = new EmbedBuilder()
          .setTitle("🎶 File d'attente")
          .setDescription(songs)
          .setColor(0x5865f2)
          .setFooter({
            text:
              queue.songs.length > 10
                ? `+ ${queue.songs.length - 10} autre(s) musique(s) dans la file`
                : `${queue.songs.length} musique(s) au total`,
          });

        await message.channel.send({ embeds: [embed] });
        break;
      }

      case "np":
      case "nowplaying": {
        const queue = distube.getQueue(message.guild);
        if (!queue) {
          await message.reply("❌ Aucune musique en cours de lecture !");
          return;
        }
        const song = queue.songs[0];
        const embed = new EmbedBuilder()
          .setTitle("🎵 En cours de lecture")
          .setDescription(`**[${song.name}](${song.url})**`)
          .setThumbnail(song.thumbnail ?? null)
          .addFields(
            { name: "Durée", value: `\`${song.formattedDuration}\``, inline: true },
            {
              name: "Demandé par",
              value: `${song.member?.user.username ?? "Inconnu"}`,
              inline: true,
            },
            {
              name: "Volume",
              value: `\`${queue.volume}%\``,
              inline: true,
            }
          )
          .setColor(0x5865f2);
        await message.channel.send({ embeds: [embed] });
        break;
      }

      case "volume":
      case "v": {
        const queue = distube.getQueue(message.guild);
        if (!queue) {
          await message.reply("❌ Aucune musique en cours de lecture !");
          return;
        }
        const vol = parseInt(args[0]);
        if (isNaN(vol) || vol < 0 || vol > 100) {
          await message.reply(
            "❌ Volume invalide ! Utilise un nombre entre `0` et `100`.\n**Exemple :** `!volume 80`"
          );
          return;
        }
        queue.setVolume(vol);
        await message.reply(`🔊 Volume réglé à **${vol}%** !`);
        break;
      }

      case "shuffle": {
        const queue = distube.getQueue(message.guild);
        if (!queue) {
          await message.reply("❌ Aucune musique en cours de lecture !");
          return;
        }
        await queue.shuffle();
        await message.reply("🔀 File d'attente mélangée !");
        break;
      }

      case "loop":
      case "repeat": {
        const queue = distube.getQueue(message.guild);
        if (!queue) {
          await message.reply("❌ Aucune musique en cours de lecture !");
          return;
        }
        const mode = queue.repeatMode;
        const newMode = (mode + 1) % 3;
        queue.setRepeatMode(newMode);
        const modes = ["🚫 Répétition désactivée", "🔂 Répétition de la musique", "🔁 Répétition de la file"];
        await message.reply(modes[newMode]);
        break;
      }

      case "leave":
      case "dc": {
        const queue = distube.getQueue(message.guild);
        if (queue) await queue.stop();
        message.guild.members.me?.voice.disconnect();
        await message.reply("👋 Déconnecté du salon vocal !");
        break;
      }

      case "help":
      case "aide": {
        const embed = new EmbedBuilder()
          .setTitle("🎵 Bot Musique — Commandes")
          .setDescription(`Préfixe : \`${PREFIX}\`\nSupporte YouTube, YouTube Music`)
          .addFields(
            {
              name: "🎵 Lecture",
              value:
                "`!play <titre ou URL>` — Joue une musique\n" +
                "`!pause` — Met en pause\n" +
                "`!resume` — Reprend la lecture\n" +
                "`!stop` — Arrête et vide la file\n" +
                "`!skip` — Passe à la suivante",
            },
            {
              name: "📋 File d'attente",
              value:
                "`!queue` — Affiche la file d'attente\n" +
                "`!shuffle` — Mélange la file\n" +
                "`!loop` — Active/désactive la répétition",
            },
            {
              name: "⚙️ Paramètres",
              value:
                "`!np` — Musique en cours\n" +
                "`!volume <0-100>` — Règle le volume\n" +
                "`!leave` — Déconnecte le bot",
            }
          )
          .setColor(0x5865f2)
          .setFooter({ text: "Bot Musique • 24/7" });
        await message.channel.send({ embeds: [embed] });
        break;
      }
    }
  } catch (error) {
    const err = error as Error;
    console.error("Erreur commande:", err.message);
    await message
      .reply(`❌ Erreur : ${err.message}`)
      .catch(() => {});
  }
});

distube.on("playSong", (queue, song) => {
  const embed = new EmbedBuilder()
    .setDescription(
      `🎵 **En train de jouer :** [${song.name}](${song.url})\n⏱️ Durée : \`${song.formattedDuration}\``
    )
    .setThumbnail(song.thumbnail ?? null)
    .setColor(0x57f287);
  queue.textChannel?.send({ embeds: [embed] }).catch(() => {});
});

distube.on("addSong", (queue, song) => {
  queue.textChannel
    ?.send(
      `✅ **${song.name}** (\`${song.formattedDuration}\`) ajouté à la file d'attente ! (Position : ${queue.songs.length - 1})`
    )
    .catch(() => {});
});

distube.on("addList", (queue, playlist) => {
  queue.textChannel
    ?.send(
      `✅ Playlist **${playlist.name}** avec **${playlist.songs.length}** musiques ajoutée !`
    )
    .catch(() => {});
});

distube.on("finish", (queue) => {
  queue.textChannel?.send("✅ File d'attente terminée !").catch(() => {});
});

distube.on("disconnect", (queue) => {
  queue.textChannel?.send("👋 Bot déconnecté du salon vocal.").catch(() => {});
});

distube.on("error", (error, queue) => {
  console.error("DisTube error:", error);
  queue?.textChannel
    ?.send(`❌ Erreur : ${error.message}`)
    .catch(() => {});
});

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error("❌ DISCORD_BOT_TOKEN manquant dans les variables d'environnement !");
}

client.login(token);
