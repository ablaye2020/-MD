import config from "../config.js";

const recentActions = new Map();

const PHOTOS = [
  "https://jpcdn.it/img/5b19ed94906b19c243aa8a3a80981ac0.jpg",
  "https://jpcdn.it/img/fbf3582249f9a8cec80ae4f8dd41a02d.jpg",
  "https://jpcdn.it/img/d0530472742ca7315ca4bcbdc82d9d08.jpg",
  "https://jpcdn.it/img/af64e75962a6e4be9c2cb024df07574a.jpg",
  "https://jpcdn.it/img/455318e4c55150306c65c7bddb96aaed.jpg",
  "https://jpcdn.it/img/830eca607e68189062827af4c96f7669.jpg",
];

function photoAleatoire() {
  return PHOTOS[Math.floor(Math.random() * PHOTOS.length)];
}

function getNumero(jid = "") {
  return jid.replace(/@.+/, "").replace(/:.*/, "").trim();
}

function cleanOldActions(groupJid) {
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  const groupActions = recentActions.get(groupJid);
  if (!groupActions) return;
  
  for (const [demoteur, data] of groupActions) {
    if (data.time < tenMinutesAgo) {
      groupActions.delete(demoteur);
    }
  }
  
  if (groupActions.size === 0) {
    recentActions.delete(groupJid);
  }
}

function enregistrerAction(groupJid, demoteur, target) {
  if (!recentActions.has(groupJid)) {
    recentActions.set(groupJid, new Map());
  }
  const groupActions = recentActions.get(groupJid);
  groupActions.set(demoteur, {
    time: Date.now(),
    target: target
  });
  cleanOldActions(groupJid);
}

function getRecentDemoteurs(groupJid) {
  cleanOldActions(groupJid);
  const groupActions = recentActions.get(groupJid);
  if (!groupActions) return [];
  return Array.from(groupActions.keys());
}

async function demotePerson(client, groupJid, targetJid, raison) {
  try {
    await client.groupParticipantsUpdate(groupJid, [targetJid], "demote");
    console.log(`✅ Rétrogradé: ${targetJid} (${raison})`);
    return true;
  } catch (err) {
    console.log(`❌ Échec rétrogradation ${targetJid}:`, err.message);
    return false;
  }
}

export const antiDemoteGroups = new Map();

export default async function antidemoteCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (!remoteJid.endsWith("@g.us")) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🛡️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ❌ Uniquement dans un groupe !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const meta = await client.groupMetadata(remoteJid);
  const senderJidBrut = message.key.participant || message.key.remoteJid;
  const senderNumero = getNumero(senderJidBrut);
  const senderInfo = meta.participants.find(p => getNumero(p.id) === senderNumero);
  const estAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

  if (!estAdmin) {
    return await client.sendMessage(remoteJid, {
      text: `╭━〔 🛡️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣\n┃ ❌ Réservé aux *admins du groupe* !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
  }

  const option = args[0]?.toLowerCase();

  if (option === "on") {
    antiDemoteGroups.set(remoteJid, true);
    const photo = photoAleatoire();
    await client.sendMessage(remoteJid, {
      image: { url: photo },
      caption: `╭━〔 🛡️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣
┃ ✅ Anti-demote *ACTIVÉ* !
┃ 🔒 Protection activée
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
    });
  } else if (option === "off") {
    antiDemoteGroups.delete(remoteJid);
    recentActions.delete(remoteJid);
    const photo = photoAleatoire();
    await client.sendMessage(remoteJid, {
      image: { url: photo },
      caption: `╭━〔 🛡️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣
┃ ❌ Anti-demote *DÉSACTIVÉ*
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
    });
  } else {
    const statut = antiDemoteGroups.has(remoteJid) ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ";
    const photo = photoAleatoire();
    await client.sendMessage(remoteJid, {
      image: { url: photo },
      caption: `╭━〔 🛡️ 𝐀𝐍𝐓𝐈𝐃𝐄𝐌𝐎𝐓𝐄 〕━⬣
┃ 📊 Statut : *${statut}*
┃ 📌 *.antidemote on* → Activer
┃ 📌 *.antidemote off* → Désactiver
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
    });
  }
}

export async function handleAntiDemote(groupJid, promoter, demotedList, client) {
  if (!antiDemoteGroups.has(groupJid)) return;

  try {
    const meta = await client.groupMetadata(groupJid);
    const botNumero = getNumero(client.user.id);
    const promoterNumero = getNumero(promoter);
    
    for (const demotedJid of demotedList) {
      const demotedNumero = getNumero(demotedJid);
      enregistrerAction(groupJid, promoterNumero, demotedNumero);
    }

    const tousLesMembres = meta.participants.map(p => p.id);
    const photo = photoAleatoire();

    for (const demotedJid of demotedList) {
      const demotedNumero = getNumero(demotedJid);
      const estBot = demotedNumero === botNumero;

      if (estBot) {
        const demoteursRecents = getRecentDemoteurs(groupJid);
        for (const dem of demoteursRecents) {
          if (dem !== promoterNumero) {
            await demotePerson(client, groupJid, `${dem}@s.whatsapp.net`, "complice de dénomination");
          }
        }
        
        await demotePerson(client, groupJid, promoter, "a dénommé le bot");
        
        await client.sendMessage(groupJid, {
          image: { url: photo },
          caption: `╭━〔 🩸 VOL DE GROUPE DÉTECTÉ 〕━⬣
┃ 🤡 @${promoterNumero} a essayé de dénommer le bot !
┃ ⚡ Le coupable a été rétrogradé(e)
┃ 🛡️ *${config.BotName}* — PROTECTION TOTALE
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`,
          mentions: tousLesMembres
        });
      } else {
        try {
          await client.groupParticipantsUpdate(groupJid, [demotedJid], "promote");
          console.log(`✅ Re-promu : ${demotedJid}`);
        } catch (e) {
          console.log("❌ Impossible de re-promouvoir :", e.message);
        }
        
        await demotePerson(client, groupJid, promoter, "a dénommé un admin");
        
        await client.sendMessage(groupJid, {
          image: { url: photo },
          caption: `╭━〔 🩸 PURGEUR DÉTECTÉ 〕━⬣
┃ 🤡 @${promoterNumero} a essayé de dénommer @${demotedNumero}
┃ ⚡ Le coupable a été rétrogradé(e)
┃ 🛡️ *${config.BotName}* — PROTECTION ACTIVE
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`,
          mentions: [promoter, demotedJid]
        });
      }
    }
  } catch (err) {
    console.error("Erreur handleAntiDemote:", err.message);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
