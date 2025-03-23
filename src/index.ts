import { Client, GatewayIntentBits, EmbedBuilder, TextChannel ,Message} from "discord.js";
import si from "systeminformation";
import * as dotenv from 'dotenv'
dotenv.config()
// Replace with your bot token and channel ID
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID||''
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });
  
  let lastMessage: Message | null = null; // Store the last message
  
  client.once("ready", async () => {
    console.log(`✅ Logged in as ${client.user?.tag}`);
    const channel = client.channels.cache.get(CHANNEL_ID) as TextChannel;
    if (!channel) {
      console.log("❌ Invalid Channel ID");
      return;
    }
  
    setInterval(async () => {
      const cpu = await si.currentLoad();
      const mem = await si.mem();
      const net1 = await si.networkStats();
      const fs = await si.fsSize(); // Get disk stats
      await new Promise((r) => setTimeout(r, 2000)); // Wait 2 sec
      const net2 = await si.networkStats();
  
      const downloadSpeed = ((net2[0].rx_bytes - net1[0].rx_bytes) / 1024).toFixed(2);
      const uploadSpeed = ((net2[0].tx_bytes - net1[0].tx_bytes) / 1024).toFixed(2);
  
      // Create a text-based graph for CPU, RAM, and Disk usage
      const bar = (value: number) => "█".repeat(Math.round(value / 10)) + "░".repeat(10 - Math.round(value / 10));
      
      // Disk Usage and Storage Graphs
      const disk = fs[0]; // Assuming first disk is the main one
      const diskUsagePercentage = ((disk.used / disk.size) * 100).toFixed(2);
      const totalDiskSize = (disk.size / 1024 / 1024 / 1024).toFixed(2); // in GB
      const usedDiskSpace = (disk.used / 1024 / 1024 / 1024).toFixed(2); // in GB
      const freeDiskSpace = ((disk.size - disk.used) / 1024 / 1024 / 1024).toFixed(2); // in GB
      
      // Graphs for Storage usage and free space
      const usedStorageGraph = bar((disk.used / disk.size) * 100); // Graph for used storage
      const freeStorageGraph = bar(((disk.size - disk.used) / disk.size) * 100); // Graph for free storage
  
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle("📊 System Status")
        .setDescription("Real-time system stats update")
        .addFields(
          { name: "🖥 CPU Usage", value: `${cpu.currentLoad.toFixed(2)}% ${bar(cpu.currentLoad)}`, inline: false },
          { name: "🧠 RAM Usage", value: `${((mem.used / mem.total) * 100).toFixed(2)}% ${bar((mem.used / mem.total) * 100)}`, inline: false },
          { name: "📥 Download Speed", value: `${downloadSpeed} KB/s`, inline: true },
          { name: "📤 Upload Speed", value: `${uploadSpeed} KB/s`, inline: true },
          { name: "💾 Disk Usage", value: `${diskUsagePercentage}% ${bar(parseFloat(diskUsagePercentage))}`, inline: false },
          { name: "🖴 Total Storage", value: `${totalDiskSize} GB`, inline: true },
          { name: "📂 Used Storage", value: `${usedDiskSpace} GB ${usedStorageGraph}`, inline: true },
          { name: "📥 Free Storage", value: `${freeDiskSpace} GB ${freeStorageGraph}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "System Monitor Bot", iconURL: client.user?.displayAvatarURL() || undefined });
  
      // If message exists, edit it. Otherwise, send a new message.
      if (lastMessage) {
        lastMessage.edit({ embeds: [embed] }).catch(console.error);
      } else {
        lastMessage = await channel.send({ embeds: [embed] });
      }
    }, 1000); // Updates every 5 sec
  });
  
  client.login(TOKEN);