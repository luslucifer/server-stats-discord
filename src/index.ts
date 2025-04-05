import { Client, GatewayIntentBits, EmbedBuilder, TextChannel, Message } from "discord.js";
import si from "systeminformation";
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || '';
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let lastMessage: Message | null = null;

// Helper function to format bytes to human-readable sizes
const formatSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
};

// Text-based bar graph generator
const bar = (value: number) => 
  '█'.repeat(Math.round(value / 10)) + '░'.repeat(10 - Math.round(value / 10));

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user?.tag}`);
  const channel = client.channels.cache.get(CHANNEL_ID) as TextChannel;
  if (!channel) {
    console.log("❌ Invalid Channel ID");
    return;
  }

  setInterval(async () => {
    try {
      // System stats collection
      const [cpu, mem, net1, fs] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.networkStats(),
        si.fsSize(),
      ]);

      // Network calculation
      await new Promise(resolve => setTimeout(resolve, 2000));
      const net2 = await si.networkStats();
      const download = (net2[0].rx_bytes - net1[0].rx_bytes) / 1024 / 1024;
      const upload = (net2[0].tx_bytes - net1[0].tx_bytes) / 1024 / 1024;

      // CPU Cores Information
      const coresInfo = cpu.cpus.map((core, i) => 
        `Core ${i + 1}: ${core.load.toFixed(1)}% ${bar(core.load)}`
      ).join('\n');

      // Detailed Disk Information
      const disksInfo = fs.map(disk => {
        const usage = (disk.used / disk.size) * 100;
        return [
          `**${disk.mount}** (${disk.fs})`,
          `${usage.toFixed(1)}% ${bar(usage)}`,
          `Total: ${formatSize(disk.size)} | Used: ${formatSize(disk.used)}`,
          `Free: ${formatSize(disk.size - disk.used)}`
        ].join('\n');
      }).join('\n\n');

      // RAM Calculation
      const ramUsage = (mem.used / mem.total) * 100;

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("📊 Detailed System Status")
        .setDescription("Real-time system monitoring with detailed metrics")
        .addFields(
          { 
            name: "🖥 CPU Overview", 
            value: `${cpu.currentLoad.toFixed(1)}% ${bar(cpu.currentLoad)}`,
            inline: false
          },
          { 
            name: `⚙️ CPU Cores (${cpu.cpus.length})`,
            value: coresInfo,
            inline: false
          },
          { 
            name: "🧠 RAM Usage", 
            value: `${ramUsage.toFixed(1)}% ${bar(ramUsage)}\n` +
                   `Total: ${formatSize(mem.total)} | Used: ${formatSize(mem.used)}`,
            inline: false
          },
          { 
            name: "🌐 Network", 
            value: `📥 ${download.toFixed(2)} MB/s\n📤 ${upload.toFixed(2)} MB/s`,
            inline: true
          },
          { 
            name: `💾 Storage (${fs.length} volumes)`, 
            value: disksInfo,
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({ text: "System Monitor Bot", iconURL: client.user?.displayAvatarURL() || undefined });

      // Update message
      if (lastMessage) {
        await lastMessage.edit({ embeds: [embed] });
      } else {
        lastMessage = await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, 5000); // Update every 5 seconds
});

client.login(TOKEN);