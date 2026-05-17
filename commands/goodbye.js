import config from "../config.js";

export const goodbyeGroups = new Map();

export default async function goodbyeCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👋 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const meta = await client.groupMetadata(remoteJid);
  const senderJidBrut = message.key.participant || message.key.remoteJid;
  const senderNumero = senderJidBrut.replace(/@.+/, "").replace(/:.*/, "");
  const senderInfo = meta.participants.find(p => p.id.replace(/@.+/, "").replace(/:.*/, "") === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

  if (!estAdmin) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👋 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const option = args[0]?.toLowerCase();

  if (option === "on") {
    goodbyeGroups.set(remoteJid, true);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 👋 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 〕━⬣\n┃ ✅ Message de départ *ACTIVÉ* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  } else if (option === "off") {
    goodbyeGroups.delete(remoteJid);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 👋 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 〕━⬣\n┃ ❌ Message de départ *DÉSACTIVÉ*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  } else {
    const statut = goodbyeGroups.has(remoteJid) ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ";
    await client.sendMessage(remoteJid, {
      text: `╭━〔 👋 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 〕━⬣\n┃ 📊 Statut : *${statut}*\n┃ 📌 *.goodbye on* pour activer\n┃ 📌 *.goodbye off* pour désactiver\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }
}

export async function goodbyeHandler(groupJid, participants, client) {
  if (!goodbyeGroups.has(groupJid)) return;

  try {
    let groupName = "le groupe";
    try {
      const meta = await client.groupMetadata(groupJid);
      groupName = meta.subject || "le groupe";
    } catch (_) {}

    for (const participant of participants) {
      const number = participant.replace(/[^0-9]/g, "");

      await client.sendMessage(groupJid, {
        text: `╭━〔 👋 𝐀𝐔 𝐑𝐄𝐕𝐎𝐈𝐑 〕━⬣
┃ 🚪 @${number} a quitté le groupe !
┃ 🏠 Groupe : *${groupName}*
┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 🥀 On espère te revoir un jour !
┣━━〔 ⚡ ${config.BotName} 〕━⬣
┃ 👑 Dev : ${config.nameCreator}
╰━━━━━━━━━━━━━━━━━━━━⬣
> le respect ne se demande pas`,
        mentions: [participant],
      });
    }
  } catch (err) {
    console.error("Erreur goodbyeHandler:", err);
  }
}
