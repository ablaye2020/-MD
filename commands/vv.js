import config from "../config.js";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";

export const viewOnceCache = new Map();

export async function saveViewOnce(message, client) {
  try {
    const msg = message.message;
    if (!msg) return;

    const viewOnceContent =
      msg?.viewOnceMessage?.message ||
      msg?.viewOnceMessageV2?.message ||
      msg?.viewOnceMessageV2Extension?.message ||
      null;

    if (!viewOnceContent) return;

    const imageMsg = viewOnceContent?.imageMessage || null;
    const videoMsg = viewOnceContent?.videoMessage || null;
    if (!imageMsg && !videoMsg) return;

    const msgId = message.key.id;
    const from = message.key.participant || message.key.remoteJid;

    if (imageMsg) {
      const stream = await downloadContentFromMessage(imageMsg, "image");
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      viewOnceCache.set(msgId, {
        buffer: Buffer.concat(chunks),
        type: "image",
        from,
        remoteJid: message.key.remoteJid,
        timestamp: Date.now()
      });
      console.log(`✅ View once image sauvegardé : ${msgId}`);
    } else if (videoMsg) {
      const stream = await downloadContentFromMessage(videoMsg, "video");
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      viewOnceCache.set(msgId, {
        buffer: Buffer.concat(chunks),
        type: "video",
        from,
        remoteJid: message.key.remoteJid,
        timestamp: Date.now()
      });
      console.log(`✅ View once vidéo sauvegardé : ${msgId}`);
    }

    setTimeout(() => viewOnceCache.delete(msgId), 10 * 60 * 1000);

  } catch (err) {
    console.error("Erreur saveViewOnce:", err.message);
  }
}

export default async function vvCommand(message, client) {
  const remoteJid = message.key.remoteJid;

  try {
    const ctx =
      message.message?.extendedTextMessage?.contextInfo ||
      message.message?.imageMessage?.contextInfo ||
      message.message?.videoMessage?.contextInfo ||
      null;

    if (!ctx?.quotedMessage || !ctx?.stanzaId) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 👁️ 𝐕𝐕 〕━⬣\n┃ ❌ Réponds à un message view once !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    const quotedId = ctx.stanzaId;
    const saved = viewOnceCache.get(quotedId);

    if (!saved) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 👁️ 𝐕𝐕 〕━⬣\n┃ ❌ View once introuvable ou expiré !\n┃ 💡 Le bot doit recevoir le message\n┃ *avant* que tu l'ouvres\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    if (saved.type === "image") {
      await client.sendMessage(remoteJid, {
        image: saved.buffer,
        caption: `╭━〔 👁️ 𝐕𝐕 〕━⬣\n┃ ✅ Image révélée !\n┃ 👑 Dev : ${config.nameCreator}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    } else if (saved.type === "video") {
      await client.sendMessage(remoteJid, {
        video: saved.buffer,
        caption: `╭━〔 👁️ 𝐕𝐕 〕━⬣\n┃ ✅ Vidéo révélée !\n┃ 👑 Dev : ${config.nameCreator}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`,
        mimetype: "video/mp4"
      }, { quoted: message });
    }

  } catch (err) {
    console.error("Erreur vvCommand:", err.message);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 👁️ 𝐕𝐕 〕━⬣\n┃ ⚠️ Erreur : ${err.message}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }
}
