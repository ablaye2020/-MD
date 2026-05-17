import config from "../config.js";

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function tagCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 📢 𝐓𝐀𝐆 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  try {
    const meta = await client.groupMetadata(remoteJid);
    const senderJidBrut = message.key.participant || message.key.remoteJid;
    const senderNumero = getNumero(senderJidBrut);
    const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
    const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";
    const isOwner = senderNumero === "221769725470";

    if (!estAdmin && !isOwner) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 📢 𝐓𝐀𝐆 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    // Récupérer la cible (mention ou réponse)
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    const mentions = ctx?.mentionedJid || [];
    let cibleJid = null;

    if (ctx?.participant) {
      cibleJid = ctx.participant;
    } else if (mentions.length > 0) {
      cibleJid = mentions[0];
    } else if (args[0]) {
      cibleJid = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    }

    if (!cibleJid) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 📢 𝐓𝐀𝐆 〕━⬣\n┃ ❌ Mentionne quelqu'un ou réponds\n┃ à son message !\n┃ 📌 Ex: *.tag @personne Bonjour*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    const cibleNumero = getNumero(cibleJid);
    const messageTexte = args.length > 1 ? args.slice(1).join(" ") : "👋 Message pour toi !";

    await client.sendMessage(remoteJid, {
      text: `╭━〔 📢 𝐓𝐀𝐆 〕━⬣
┃ 👑 Admin : @${senderNumero}
┃ 🎯 Cible : @${cibleNumero}
┃ 💬 Message : ${messageTexte}
┣━━━━━━━━━━━━━━━━━━━━⬣
┃ @${cibleNumero} regarde ce message ! 👀
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`,
      mentions: [cibleJid, senderJidBrut]
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur tagCommand:", err.message);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 📢 𝐓𝐀𝐆 〕━⬣\n┃ ⚠️ Erreur : ${err.message}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }
}
