import config from "../config.js";

// ──────────────────────────────────────────
//  QUESTIONS
// ──────────────────────────────────────────
const QUIZ_QUESTIONS = [
  { question: "Qui est le fondateur d’info purge 24?", reponse: "William MORIARTY " },
  { question: "Qui est le chef du clan killer ?", reponse: "Muzan killer" },
  { question: "Quels est le clan qui a crée feu feu feu 🔥 ?", reponse: "HADÉS " },
  { question: "Quel est le nom du premier chef de la famille Butterfly ?", reponse: "inconnue boy" },
  { question: "Qui dirige le clan Zetsu ?", reponse: "black tobi zetsu " },
  { question: "La vraie purge est la !! Qui est l’auteur?", reponse: "Zeal big deal" },
  { question: "Qui est du maison journalistique SALVATOR ?", reponse: "MR AURA" },
  { question: "LA MAJORITÉ DES JAP ÉTAIT DES PURGEURS ! Vrai ou faux?", reponse: "vrai" },
  { question: "Qui a purger beaucoup de maisons journalistiques et des clans en une journée ?", reponse: "whatsapp " },
  { question: "Qui est le chef incontesté du clan des OMBRES ?", reponse: "monarque des ombres" },
  { question: "Quel est le nom du créateur originel du clan Shelby ?", reponse: "izana shelby" },
  { question: "Qui a purgé le clan Ghost pour la première fois ?", reponse: "dark gamer" },
  { question: "Qui a purgé Angel TV pour la deuxième fois ?", reponse: "saitama" },
  { question: "Qui est le fondateur du clan Ghost ?", reponse: "James GHOST " },
  { question: "Quel est le nom de l'Éternel sous-chef de la famille Butterfly ?", reponse: "le mec idéal butterfly 16" },
  { question: "Quel est le nom du premier sous-chef du clan Big Deal ?", reponse: "grady big deal" },
  { question: "Quel est le nom du premier sous-chef du clan Hadès ?", reponse: "brunis uchiwa" },
  { question: "Quel est le titre de la deuxième génération ?", reponse: "la génération de la révolution" },
  { question: "Quel clan a purgé NY HADÈS TV pour la première fois ?", reponse: "worker" },
  { question: "Quel clan a purgé Furioza pour la première fois ?", reponse: "worker" },
  { question: "Qui est marque Antoine ?", reponse: "le chef des anti purgeur de la troisième génération" },
  { question: "Qui a popularisé les images personnalisées des membres des clans ?", reponse: "benny hadès" },
  { question: "Qui a créé prime purge ?", reponse: "no name" },
  { question: "Joyboy était un purgeurs ?", reponse: "oui" }
];

// ──────────────────────────────────────────
//  INSULTES pour les perdants 😂
// ──────────────────────────────────────────
const INSULTES = [
  "t'es plus nul qu'un GPS sans internet 🗺️❌",
  "même mon chien ferait mieux et il sait pas lire 🐕",
  "tu joues au quiz comme tu vis ta vie : sans succès 💀",
  "c'est honteux, va faire le recrutement des maboule je te nomme admin 📚😭",
  "t'as confondu le quiz avec un porno ? 😫",
  "on dirait que t'as répondu avec tes pieds 🦶",
  "score de misère, retourne chez ton maître 🏫",
  "même une calculette cassée fait mieux que toi 🧮",
  "t'as pas honte de montrer ce score en public ? 😬",
  "tu mérites un trophée de la médiocrité 🏆🗑️",
];

// ──────────────────────────────────────────
//  MÉDAILLES
// ──────────────────────────────────────────
const MEDAILLES = ["🥇", "🥈", "🥉"];

// ──────────────────────────────────────────
//  SESSIONS ACTIVES
// ──────────────────────────────────────────
const activeQuizzes = new Map();
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ──────────────────────────────────────────
//  NORMALISATION
// ──────────────────────────────────────────
function normaliser(str) {
  return str.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "");
}

function verifierReponse(rep, bonne) {
  const r = normaliser(rep);
  const b = normaliser(bonne);
  if (b === "grady big deal") return r === "grady big deal" || r === "grady sadeus" || r === "grady";
  if (b === "le clan killer") return r === "le clan killer" || r === "clan killer" || r === "killer";
  if (b === "benny hades") return r === "benny hades" || r === "benny";
  return r === b;
}

// ──────────────────────────────────────────
//  MÉLANGEUR
// ──────────────────────────────────────────
function melanger(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function insulteAleatoire() {
  return INSULTES[Math.floor(Math.random() * INSULTES.length)];
}

// ──────────────────────────────────────────
//  COMMANDE PRINCIPALE
// ──────────────────────────────────────────
export default async function quizCommand(message, client, { args } = {}) {
  const remoteJid = message.key.remoteJid;

  if (args && args[0]?.toLowerCase() === "stop") {
    if (activeQuizzes.has(remoteJid)) {
      const s = activeQuizzes.get(remoteJid);
      s.active = false;
      if (s.timerInterval) clearInterval(s.timerInterval);
      if (s.responseHandler) client.ev.off("messages.upsert", s.responseHandler);
      activeQuizzes.delete(remoteJid);
      await client.sendMessage(remoteJid, {
        text: `╭━〔 📚 𝐐𝐔𝐈𝐙 〕━⬣\n┃ ❌ Quiz stoppé !\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      });
    } else {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 📚 𝐐𝐔𝐈𝐙 〕━⬣\n┃ ⚠️ Aucun quiz en cours.\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
      });
    }
    return;
  }

  if (activeQuizzes.has(remoteJid)) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 📚 𝐐𝐔𝐈𝐙 〕━⬣\n┃ ⚠️ Un quiz est déjà en cours !\n┃ 📌 *.quiz stop* pour l'arrêter\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
    return;
  }

  const joueurs = new Map();
  let phaseInscription = true;

  const session = {
    active: true,
    joueurs,
    questions: melanger(QUIZ_QUESTIONS).slice(0, 10),
    currentIndex: 0,
    timerInterval: null,
    responseHandler: null,
    phaseInscription: true,
  };

  activeQuizzes.set(remoteJid, session);

  await client.sendMessage(remoteJid, {
    text: `╭━〔 📚 𝐐𝐔𝐈𝐙 𝐌𝐔𝐋𝐓𝐈𝐉𝐎𝐔𝐄𝐔𝐑 〕━⬣
┃ 🎯 ${session.questions.length} questions au programme
┃ ⏰ 30 secondes pour rejoindre !
┃
┃ 👉 Écris *join* pour participer
┃ 💡 Seuls les joueurs inscrits peuvent répondre
┃ 🏆 Le premier à donner la bonne réponse gagne +1 pt
┃ 📌 *.quiz stop* pour annuler
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
  });

  const joinHandler = async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    if (msg.key.remoteJid !== remoteJid) return;
    if (!session.phaseInscription) return;

    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (normaliser(text) !== "join") return;

    const jid = msg.key.participant || msg.key.remoteJid;
    const name = msg.pushName || jid.replace(/[^0-9]/g, "");

    if (!joueurs.has(jid)) {
      joueurs.set(jid, { name, score: 0, reponsesQuiz: 0 });
      await client.sendMessage(remoteJid, {
        text: `✅ *${name}* a rejoint le quiz ! (${joueurs.size} joueur${joueurs.size > 1 ? "s" : ""})`,
        mentions: [jid]
      });
    }
  };

  client.ev.on("messages.upsert", joinHandler);

  let tempsInscription = 30;
  await new Promise((resolve) => {
    const t = setInterval(async () => {
      tempsInscription -= 10;
      if (!session.active) { clearInterval(t); resolve(); return; }
      if (tempsInscription === 20 || tempsInscription === 10) {
        await client.sendMessage(remoteJid, {
          text: `⏰ Plus que *${tempsInscription}s* pour écrire *join* ! (${joueurs.size} inscrit${joueurs.size > 1 ? "s" : ""})`
        }).catch(() => {});
      }
      if (tempsInscription <= 0) { clearInterval(t); resolve(); }
    }, 10000);
  });

  client.ev.off("messages.upsert", joinHandler);
  session.phaseInscription = false;

  if (!session.active) return;

  if (joueurs.size === 0) {
    await client.sendMessage(remoteJid, {
      text: `╭━〔 📚 𝐐𝐔𝐈𝐙 〕━⬣\n┃ 😴 Personne n'a rejoint... Quiz annulé !\n┃ 📌 *.quiz* pour réessayer\n╰━━〔 ⚡ ${config.BotName} 〕━⬣\n\n> le respect ne se demande pas`
    });
    activeQuizzes.delete(remoteJid);
    return;
  }

  const listeJoueurs = [...joueurs.values()].map(j => `┃ 👤 ${j.name}`).join("\n");
  await client.sendMessage(remoteJid, {
    text: `╭━〔 🚀 C'EST PARTI ! 〕━⬣
${listeJoueurs}
┃
┃ 🔥 ${joueurs.size} joueur${joueurs.size > 1 ? "s" : ""} en lice !
┃ ⚡ Le quiz commence dans 3 secondes...
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
  });

  await delay(3000);

  let reponsesRecues = new Map();
  let gagnantQuestion = null;
  let questionTerminee = false;

  async function terminerQuestion(timeoutForce = false) {
    if (questionTerminee) return;
    questionTerminee = true;

    if (session.timerInterval) { clearInterval(session.timerInterval); session.timerInterval = null; }

    const q = session.questions[session.currentIndex];

    if (gagnantQuestion) {
      const gagnant = joueurs.get(gagnantQuestion);
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ✅ BONNE RÉPONSE 〕━⬣
┃ 🏆 *${gagnant.name}* a trouvé en premier !
┃ 📖 Réponse : *${q.reponse}*
┃ 🎯 Score : ${gagnant.score} pt${gagnant.score > 1 ? "s" : ""}
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`,
        mentions: [gagnantQuestion]
      });
    } else {
      await client.sendMessage(remoteJid, {
        text: `╭━〔 ⏰ TEMPS ÉCOULÉ 〕━⬣
┃ 😬 Personne n'a trouvé !
┃ 📖 Réponse : *${q.reponse}*
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
      });
    }

    session.currentIndex++;
    await delay(2500);

    if (session.currentIndex >= session.questions.length) {
      await terminerQuiz();
    } else {
      await lancerQuestion();
    }
  }

  async function lancerQuestion() {
    if (!session.active) return;

    reponsesRecues = new Map();
    gagnantQuestion = null;
    questionTerminee = false;

    const q = session.questions[session.currentIndex];
    const num = session.currentIndex + 1;
    const total = session.questions.length;

    await client.sendMessage(remoteJid, {
      text: `╭━〔 📚 QUESTION ${num}/${total} 〕━⬣
┃ ❓ *${q.question}*
┃ ⏳ 30 secondes !
┃ 💬 Tous les joueurs doivent répondre
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`
    });

    let tempsRestant = 30;
    session.timerInterval = setInterval(async () => {
      tempsRestant--;
      if (!session.active) { clearInterval(session.timerInterval); return; }

      if ((tempsRestant === 20 || tempsRestant === 10 || tempsRestant === 5) && !questionTerminee) {
        const absents = [...joueurs.entries()]
          .filter(([jid]) => !reponsesRecues.has(jid))
          .map(([jid, j]) => `@${jid.replace(/[^0-9]/g, "")}`);

        if (absents.length > 0) {
          await client.sendMessage(remoteJid, {
            text: `⏰ *${tempsRestant}s* restantes ! En attente de : ${absents.join(", ")}`,
            mentions: [...joueurs.keys()].filter(jid => !reponsesRecues.has(jid))
          }).catch(() => {});
        }
      }

      if (tempsRestant <= 0 && !questionTerminee) {
        clearInterval(session.timerInterval);
        await terminerQuestion(true);
      }
    }, 1000);
  }

  const responseHandler = async (chatUpdate) => {
    const msg = chatUpdate.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    if (msg.key.remoteJid !== remoteJid) return;
    if (!session.active || questionTerminee) return;

    const jid = msg.key.participant || msg.key.remoteJid;

    if (!joueurs.has(jid)) return;

    let text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (!text || text.startsWith(".")) return;

    if (reponsesRecues.has(jid)) return;

    reponsesRecues.set(jid, text);

    const q = session.questions[session.currentIndex];
    const joueur = joueurs.get(jid);
    const correct = verifierReponse(text, q.reponse);

    if (correct && !gagnantQuestion) {
      gagnantQuestion = jid;
      joueur.score++;

      await client.sendMessage(remoteJid, {
        text: `🎯 @${jid.replace(/[^0-9]/g, "")} a répondu — en attente des autres...`,
        mentions: [jid]
      }).catch(() => {});

      const tousOntRepondu = [...joueurs.keys()].every(j => reponsesRecues.has(j));
      if (tousOntRepondu) await terminerQuestion();

    } else if (!correct) {
      await client.sendMessage(remoteJid, {
        text: `❌ @${jid.replace(/[^0-9]/g, "")} a répondu (faux 😬)`,
        mentions: [jid]
      }).catch(() => {});

      const tousOntRepondu = [...joueurs.keys()].every(j => reponsesRecues.has(j));
      if (tousOntRepondu) await terminerQuestion();

    } else {
      await client.sendMessage(remoteJid, {
        text: `✅ @${jid.replace(/[^0-9]/g, "")} a aussi trouvé... mais trop tard 😅`,
        mentions: [jid]
      }).catch(() => {});

      const tousOntRepondu = [...joueurs.keys()].every(j => reponsesRecues.has(j));
      if (tousOntRepondu) await terminerQuestion();
    }
  };

  session.responseHandler = responseHandler;
  client.ev.on("messages.upsert", responseHandler);

  async function terminerQuiz() {
    if (!session.active) return;
    session.active = false;

    if (session.timerInterval) clearInterval(session.timerInterval);
    if (session.responseHandler) client.ev.off("messages.upsert", session.responseHandler);

    const classement = [...joueurs.entries()]
      .sort((a, b) => b[1].score - a[1].score);

    const maxScore = session.questions.length;
    const mentions = classement.map(([jid]) => jid);

    let podium = "";
    classement.forEach(([jid, j], i) => {
      const medaille = MEDAILLES[i] || "🎖️";
      const numero = jid.replace(/[^0-9]/g, "");
      const pourcentage = Math.round((j.score / maxScore) * 100);
      podium += `┃ ${medaille} @${numero} — ${j.score} pt${j.score > 1 ? "s" : ""} (${pourcentage}%)\n`;
    });

    let insulteSection = "";
    if (classement.length > 1) {
      insulteSection = "\n┣━━━━━━━━━━━━━━━━━━━━⬣\n┃ 😂 QUE DES MABOULE :\n";
      classement.slice(1).forEach(([jid, j]) => {
        const numero = jid.replace(/[^0-9]/g, "");
        insulteSection += `┃ @${numero} ${insulteAleatoire()}\n`;
      });
    }

    const gagnant = classement[0];
    const gagnantJid = gagnant[0];

    await client.sendMessage(remoteJid, {
      text: `╭━〔 🏆 𝐅𝐈𝐍 𝐃𝐔 𝐐𝐔𝐈𝐙 〕━⬣
┃ 🎉 Quiz terminé ! ${classement.length} joueurs
┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 📊 CLASSEMENT FINAL :
${podium}┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 👑 Bravo à @${gagnantJid.replace(/[^0-9]/g, "")} !
┃ Tu domines ces loosers ! 🔥${insulteSection}┣━━━━━━━━━━━━━━━━━━━━⬣
┃ 👑 Dev : ${config.nameCreator}
╰━━〔 ⚡ ${config.BotName} 〕━⬣
> le respect ne se demande pas`,
      mentions
    });

    activeQuizzes.delete(remoteJid);
  }

  await lancerQuestion();
}
