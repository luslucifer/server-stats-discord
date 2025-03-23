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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const systeminformation_1 = __importDefault(require("systeminformation"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// Replace with your bot token and channel ID
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || '';
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds, discord_js_1.GatewayIntentBits.GuildMessages],
});
let lastMessage = null; // Store the last message
client.once("ready", () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log(`✅ Logged in as ${(_a = client.user) === null || _a === void 0 ? void 0 : _a.tag}`);
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.log("❌ Invalid Channel ID");
        return;
    }
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const cpu = yield systeminformation_1.default.currentLoad();
        const mem = yield systeminformation_1.default.mem();
        const net1 = yield systeminformation_1.default.networkStats();
        const fs = yield systeminformation_1.default.fsSize(); // Get disk stats
        yield new Promise((r) => setTimeout(r, 2000)); // Wait 2 sec
        const net2 = yield systeminformation_1.default.networkStats();
        // Convert speeds to MB/s
        const downloadSpeedMB = ((net2[0].rx_bytes - net1[0].rx_bytes) / 1024 / 1024).toFixed(2); // Convert to MB/s
        const uploadSpeedMB = ((net2[0].tx_bytes - net1[0].tx_bytes) / 1024 / 1024).toFixed(2); // Convert to MB/s
        // Create a text-based graph for CPU, RAM, and Disk usage
        const bar = (value) => "█".repeat(Math.round(value / 10)) + "░".repeat(10 - Math.round(value / 10));
        // Disk Usage and Storage Graphs
        const disk = fs[0]; // Assuming first disk is the main one
        const diskUsagePercentage = ((disk.used / disk.size) * 100).toFixed(2);
        const totalDiskSize = (disk.size / 1024 / 1024 / 1024).toFixed(2); // in GB
        const usedDiskSpace = (disk.used / 1024 / 1024 / 1024).toFixed(2); // in GB
        const freeDiskSpace = ((disk.size - disk.used) / 1024 / 1024 / 1024).toFixed(2); // in GB
        // Graphs for Storage usage and free space
        const usedStorageGraph = bar((disk.used / disk.size) * 100); // Graph for used storage
        const freeStorageGraph = bar(((disk.size - disk.used) / disk.size) * 100); // Graph for free storage
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle("📊 System Status")
            .setDescription("Real-time system stats update")
            .addFields({ name: "🖥 CPU Usage", value: `${cpu.currentLoad.toFixed(2)}% ${bar(cpu.currentLoad)}`, inline: false }, { name: "🧠 RAM Usage", value: `${((mem.used / mem.total) * 100).toFixed(2)}% ${bar((mem.used / mem.total) * 100)}`, inline: false }, { name: "📥 Download Speed", value: `${downloadSpeedMB} MB/s`, inline: true }, // Updated to MB/s
        { name: "📤 Upload Speed", value: `${uploadSpeedMB} MB/s`, inline: true }, // Updated to MB/s
        { name: "💾 Disk Usage", value: `${diskUsagePercentage}% ${bar(parseFloat(diskUsagePercentage))}`, inline: false }, { name: "🖴 Total Storage", value: `${totalDiskSize} GB`, inline: true }, { name: "📂 Used Storage", value: `${usedDiskSpace} GB ${usedStorageGraph}`, inline: true }, { name: "📥 Free Storage", value: `${freeDiskSpace} GB ${freeStorageGraph}`, inline: true })
            .setTimestamp()
            .setFooter({ text: "System Monitor Bot", iconURL: ((_a = client.user) === null || _a === void 0 ? void 0 : _a.displayAvatarURL()) || undefined });
        // If message exists, edit it. Otherwise, send a new message.
        if (lastMessage) {
            lastMessage.edit({ embeds: [embed] }).catch(console.error);
        }
        else {
            lastMessage = yield channel.send({ embeds: [embed] });
        }
    }), 1000); // Updates every 1 second
}));
client.login(TOKEN);
