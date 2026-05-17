import config from "../config.js";

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

export default async function demoteallCommand(message, client) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄𝐀𝐋𝐋 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
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
        text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄𝐀𝐋𝐋 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    // Récupérer tous les admins (sauf le bot et l'utilisateur qui lance la commande)
    const admins = meta.participants.filter(p => {
      const estAdminP = p.admin === "admin" || p.admin === "superadmin";
      const numero = getNumero(p.id);
      const botNumero = getNumero(client.user.id);
      const isBot = numero === botNumero;
      const isSelf = numero === senderNumero;
      return estAdminP && !isBot && !isSelf;
    });

    if (admins.length === 0) {
      return await client.sendMessage(remoteJid, {
        text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄𝐀𝐋𝐋 〕━⬣\n┃ ⚠️ Aucun admin à rétrograder !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      }, { quoted: message });
    }

    await client.sendMessage(remoteJid, {
      text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄𝐀𝐋𝐋 〕━⬣
┃ 👥 Admins trouvés : *${admins.length}*
┃ ⏳ Rétrogradation en cours...
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
    }, { quoted: message });

    let demoted = 0;
    let echecs = 0;

    for (const admin of admins) {
      try {
        await client.groupParticipantsUpdate(remoteJid, [admin.id], "demote");
        demoted++;
        console.log(`✅ Rétrogradé : ${admin.id}`);
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        echecs++;
        console.log(`❌ Échec démotion ${admin.id} :`, e.message);
      }
    }

    await client.sendMessage(remoteJid, {
      text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄𝐀𝐋𝐋 〕━⬣
┃ ✅ Rétrogradés : *${demoted}*
┃ ❌ Échecs : *${echecs}*
┃ 👑 Dev : ${config.nameCreator}
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas
> 🔗 Voir la chaîne : ${config.Channel}`
    }, { quoted: message });

  } catch (err) {
    console.error("Erreur demoteall:", err.message);
    await client.sendMessage(remoteJid, {
      text: `╭━〔 ⬇️ 𝐃𝐄𝐌𝐎𝐓𝐄𝐀𝐋𝐋 〕━⬣\n┃ ⚠️ Erreur : ${err.message}\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    }, { quoted: message });
  }
}
