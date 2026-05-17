import config from "../config.js";

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function kickCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const meta = await client.groupMetadata(remoteJid);

  const senderJid = message.key.participant || message.key.remoteJid;
  const senderNumero = getNumero(senderJid);
  const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

  if (!estAdmin) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  let cibleJid = null;

  const contextInfo = message.message?.extendedTextMessage?.contextInfo;
  const quotedParticipant = contextInfo?.participant;
  const mentions = contextInfo?.mentionedJid || [];

  if (quotedParticipant) {
    cibleJid = quotedParticipant;
  } else if (mentions.length > 0) {
    cibleJid = mentions[0];
  } else if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, "");
    cibleJid = num + "@s.whatsapp.net";
  }

  if (!cibleJid) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Mentionne quelqu'un ou réponds\n┃ à son message !\n┃ 📌 Ex: *.kick @personne*\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const cibleNumero = getNumero(cibleJid);
  const botNumero = getNumero(client.user.id);

  if (cibleNumero === senderNumero) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ 😂 Tu ne peux pas t'expulser toi-même !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  if (cibleNumero === botNumero) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ 😂 Tu ne peux pas m'expulser !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const cibleInfo = meta.participants.find(p => getNumero(p.id) === cibleNumero);
  if (!cibleInfo) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Ce membre n'est pas dans le groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  const cibleEstAdmin = cibleInfo?.admin === "admin" || cibleInfo?.admin === "superadmin";
  if (cibleEstAdmin) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ❌ Tu ne peux pas expulser un *admin* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }

  try {
    await client.groupParticipantsUpdate(remoteJid, [cibleInfo.id], "remove");

    await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ✅ @${cibleNumero} a été expulsé !\n┃ 🚪 Au revoir !\n┃ 👑 Dev : ${config.nameCreator}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`,
      mentions: [cibleInfo.id]
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur kickCommand:", err.message);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 👢 𝐊𝐈𝐂𝐊 〕━⬣\n┃ ⚠️ Impossible d'expulser @${cibleNumero}\n┃ Vérifie que le bot est *admin* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`,
      mentions: [cibleInfo.id]
    }, { quoted: message });
  }
}
