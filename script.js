/* ==========================================================================
   Configuration — personnalise uniquement les valeurs de cet objet.
   Les liens et numéros ci-dessous sont personnalisés ; vérifie-les avant publication.
   Les couleurs sont aussi définies dans style.css et seront synchronisées ici.
   ========================================================================== */
const CONFIG = {
  createur: "Aï D'ou",
  photo: "moi.jpg",

  // Ce lien ouvre le profil Facebook fourni; il ne garantit pas un DM direct.
  facebookProfileUrl: "https://www.facebook.com/profile.php?id=100085084740548",
  messengerLink: "https://m.me/100085084740548",
  whatsappNumber: "261323818029", // format international, chiffres uniquement
  smsNumber: "+261323818029",
  emailRecipient: "ravoniarisonaidous032@gmail.com",

  couleurs: {
    ink: "#100D18",
    plum: "#30144D",
    rose: "#FF5C93",
    lilac: "#A78BFA",
    paper: "#F8F5FC",
  },

  compliments: [
    "Tu as ce petit quelque chose qui rend une conversation ordinaire beaucoup plus intéressante.",
    "Certaines personnes attirent l’attention. D’autres donnent envie de rester discuter. Je te laisse deviner dans quelle catégorie tu es. 😌",
    "Ton sourire doit avoir une sacrée équipe marketing. Il donne envie d’en savoir plus. 😂",
    "Tu as l’air d’être le genre de personne qu’on ne découvre pas complètement en une seule conversation.",
    "Je ne vais pas te faire un discours de dix pages. Je préfère apprendre à te connaître pour de vrai.",
    "Le charme, ce n’est pas seulement une question d’apparence. C’est aussi une façon d’être, de parler et de faire sourire les autres.",
    "Tu dégages ce petit mélange de douceur et de caractère qui rend les gens curieux.",
    "Il y a des gens avec qui le temps passe vite. J’ai comme l’impression que tu pourrais être de cette équipe.",
    "Tu as l’air d’avoir une belle façon de voir les choses — et ça, c’est franchement attirant.",
    "Même cette page un peu trop préparée avait besoin de quelqu’un d’intéressant pour avoir une raison d’exister.",
  ],
};

const COMPAT_QUESTIONS = [
  {
    key: "conversation",
    question: "Une conversation jusqu’à tard dans la nuit ou une sortie improvisée ?",
    options: [
      "Une conversation jusqu’à tard dans la nuit 🌙",
      "Une sortie improvisée ✨",
    ],
  },
  {
    key: "style",
    question: "Un compliment direct ou une taquinerie intelligente ?",
    options: [
      "Un compliment direct 💗",
      "Une taquinerie intelligente 😏",
    ],
  },
  {
    key: "personnalite",
    question: "Une personne mystérieuse ou quelqu’un qui dit franchement ce qu’il pense ?",
    options: [
      "Quelqu’un d’un peu mystérieux 👀",
      "Quelqu’un qui dit franchement ce qu’il pense 💬",
    ],
  },
  {
    key: "rendezVous",
    question: "Un rendez-vous autour d’un bon repas ou une promenade tranquille ?",
    options: [
      "Un bon repas 🍝",
      "Une promenade tranquille 🌿",
    ],
  },
  {
    key: "priorite",
    question: "L’humour, la sincérité ou les petites attentions : qu’est-ce qui compte le plus pour toi ?",
    options: [
      "L’humour 😂",
      "La sincérité 🤍",
      "Les petites attentions ✨",
    ],
  },
];

const REPONSE_VIDE = () => ({
  createur: CONFIG.createur,
  questionnaire: {
    briseGlace: "",
    compatibilite: {},
    questionSurprise: "",
    reponseLibreSurprise: "",
  },
  reactionsCompliments: [],
  avisCreateur: "",
  commentaire: "",
  reactionFinale: "",
  messageFinal: "",
  consentementPartage: false,
});

// Les réponses ne sont gardées qu'en mémoire pendant l'ouverture de cette page.
// Pas de localStorage, de serveur, d'analytics ou de requête réseau.
const reponses = REPONSE_VIDE();
const etat = {
  etape: 0,
  complimentIndex: 0,
  complimentsVus: [],
  portraitOpener: null,
  messageVisible: false,
  particulesLancees: false,
  toastTimer: null,
};

const app = document.querySelector("#app");
const progression = document.querySelector("#progress-track");
const progressionRemplie = document.querySelector("#progress-fill");
const progressionTexte = document.querySelector("#progress-caption");
const progressionEtape = document.querySelector("#progress-count");
const toast = document.querySelector("#toast");
const boutonEffacer = document.querySelector("#clear-responses");
const motionReduite = window.matchMedia("(prefers-reduced-motion: reduce)");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[caractere]);
}

function setTheme() {
  const root = document.documentElement;
  root.style.setProperty("--ink", CONFIG.couleurs.ink);
  root.style.setProperty("--plum", CONFIG.couleurs.plum);
  root.style.setProperty("--rose", CONFIG.couleurs.rose);
  root.style.setProperty("--lilac", CONFIG.couleurs.lilac);
  root.style.setProperty("--paper", CONFIG.couleurs.paper);
}

function imageMarkup(extraClass = "") {
  return `
    <button
      class="portrait-frame ${extraClass}"
      type="button"
      data-portrait-trigger
      disabled
      aria-label="Chargement du portrait de ${escapeHtml(CONFIG.createur)}"
    >
      <span class="portrait-crop">
        <img class="portrait-img" src="${escapeHtml(CONFIG.photo)}" alt="Portrait de ${escapeHtml(CONFIG.createur)}">
        <span class="portrait-fallback" hidden>
          <strong>Photo indisponible</strong>
          <span>Ajoute ton portrait dans <b>moi.jpg</b>.</span>
        </span>
      </span>
      <span class="portrait-zoom-hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <circle cx="10.8" cy="10.8" r="5.8"></circle>
          <path d="m15.2 15.2 5 5m-9.4-9.4h4.2m-2.1-2.1v4.2"></path>
        </svg>
      </span>
    </button>
  `;
}

function safeHttpsUrl(rawValue) {
  if (!rawValue || !String(rawValue).trim()) return "";
  try {
    const parsed = new URL(String(rawValue).trim());
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function creatorRail() {
  const profileUrl = safeHttpsUrl(CONFIG.facebookProfileUrl);
  return `
    <aside class="creator-rail" aria-label="À propos de la personne qui a créé cette page">
      ${imageMarkup()}
      <p class="rail-eyebrow">LA PERSONNE DERRIÈRE CETTE PAGE</p>
      <p class="creator-name">${escapeHtml(CONFIG.createur)}</p>
      <p class="creator-tagline">Developer by day, troublemaker by night. 😈</p>
      <p class="letter-note">Une petite surprise créée spécialement pour toi… <span>💌</span></p>
      ${profileUrl ? `<a class="profile-link" href="${escapeHtml(profileUrl)}" target="_blank" rel="noopener noreferrer">Mon profil Facebook ↗</a>` : ""}
    </aside>
  `;
}

function profileFeature() {
  return `
    <div class="feature-profile">
      ${imageMarkup()}
      <div class="feature-profile-copy">
        <strong>${escapeHtml(CONFIG.createur)}</strong>
        <span>Developer by day, troublemaker by night. 😈</span>
      </div>
    </div>
  `;
}

function choiceGroup({ name, answer, key = "", options, selected = "", ariaLabel = "" }) {
  return `
    <div class="choice-grid" role="radiogroup" aria-label="${escapeHtml(ariaLabel)}">
      ${options.map((option, index) => {
        const id = `${name}-${index}`;
        return `
          <label class="choice" for="${escapeHtml(id)}">
            <input
              id="${escapeHtml(id)}"
              type="radio"
              name="${escapeHtml(name)}"
              value="${escapeHtml(option)}"
              data-answer="${escapeHtml(answer)}"
              data-key="${escapeHtml(key)}"
              ${selected === option ? "checked" : ""}
            >
            <span class="choice-content">${escapeHtml(option)}</span>
          </label>
        `;
      }).join("")}
    </div>
  `;
}

function textField({ id, label, placeholder, value = "", max = 500, answer, optional = true }) {
  return `
    <div class="field-wrap">
      <label class="field-label" for="${escapeHtml(id)}">
        ${escapeHtml(label)}
        ${optional ? '<span class="optional">(facultatif)</span>' : ""}
      </label>
      <textarea
        class="text-field"
        id="${escapeHtml(id)}"
        maxlength="${max}"
        placeholder="${escapeHtml(placeholder)}"
        data-text-answer="${escapeHtml(answer)}"
      >${escapeHtml(value)}</textarea>
      <div class="field-meta">
        <span>Tu peux aussi laisser ce champ vide.</span>
        <span><span data-counter-for="${escapeHtml(id)}">${String(value).length}</span>/${max}</span>
      </div>
    </div>
  `;
}

function navButtons(previous, next, current, nextLabel = "Continuer") {
  return `
    <nav class="stage-nav" aria-label="Navigation du jeu">
      <button class="button button--quiet" type="button" data-action="back" ${previous === null ? "disabled" : ""}>
        ← Retour
      </button>
      <span class="step-caption">Étape ${current} sur 6</span>
      <button class="button button--primary" type="button" data-action="next" data-next="${next}">
        ${escapeHtml(nextLabel)} <span aria-hidden="true">→</span>
      </button>
    </nav>
  `;
}

function introContent() {
  return `
    <div class="stage-content">
      <p class="eyebrow">UNE PETITE LETTRE NUMÉRIQUE</p>
      <h1 class="screen-title" tabindex="-1">Hey toi ! <span class="accent">😏</span></h1>
      <div class="intro-copy">
        <p>Si tu es ici, c’est que quelqu’un a décidé de faire les choses un peu différemment.</p>
        <p>J’avais envie de te préparer une petite surprise : quelques questions, quelques compliments, un peu d’humour et peut-être quelques surprises inattendues.</p>
        <p class="intro-emphasis">Et oui, c’est bien moi, <strong>${escapeHtml(CONFIG.createur)}</strong>, qui ai créé cette page spécialement pour toi. 😂💗</p>
        <p>Alors, prête à jouer ?</p>
      </div>
      <div class="button-row">
        <button class="button button--primary" type="button" data-action="start">
          Découvrir ta surprise <span aria-hidden="true">✨</span>
        </button>
      </div>
    </div>
  `;
}

function iceContent() {
  const options = [
    "😇 Un ange qui ne fait jamais de bêtises.",
    "😈 Une petite diablesse qui assume.",
    "🤭 Ça dépend de la personne en face.",
    "😂 Un mélange des trois, attention aux dégâts.",
  ];
  const reactions = {
    [options[0]]: "Je note… mais les anges ont parfois les dossiers les plus surprenants. 😇",
    [options[1]]: "Au moins, le niveau d’avertissement est honnête. Je respecte. 😈",
    [options[2]]: "Réponse diplomatique… et mystérieuse. Joli coup. 👀",
    [options[3]]: "Un mélange des trois ? Je vais garder mon casque à portée de main. 😂",
  };
  const selected = reponses.questionnaire.briseGlace;
  return `
    <div class="stage-content">
      <p class="eyebrow">01 — BRISER LA GLACE</p>
      <h1 class="screen-title" tabindex="-1">Bon, commençons <span class="accent">doucement… 😏</span></h1>
      <div class="question-block">
        <span class="question-label" id="ice-question">Tu es plutôt quel genre de personne ?</span>
        ${choiceGroup({
          name: "ice",
          answer: "ice",
          options,
          selected,
          ariaLabel: "Tu es plutôt quel genre de personne ?",
        })}
        <p class="reaction-note" id="ice-reaction" aria-live="polite">
          ${selected ? escapeHtml(reactions[selected] || "") : "Choisis la réponse qui te ressemble le plus… ou le moins. 👀"}
        </p>
      </div>
      ${navButtons(0, 2, 1)}
    </div>
  `;
}

function chooseCompliment() {
  const total = CONFIG.compliments.length;
  if (!total) return;

  let candidats = Array.from({ length: total }, (_, index) => index)
    .filter((index) => !etat.complimentsVus.includes(index));
  if (candidats.length === 0) {
    etat.complimentsVus = [];
    candidats = Array.from({ length: total }, (_, index) => index);
  }
  if (candidats.length > 1) {
    candidats = candidats.filter((index) => index !== etat.complimentIndex);
  }
  etat.complimentIndex = candidats[Math.floor(Math.random() * candidats.length)];
  etat.complimentsVus.push(etat.complimentIndex);
}

function complimentsContent() {
  const compliments = CONFIG.compliments.length ? CONFIG.compliments : ["Tu mérites au moins un compliment — ajoute-en dans la configuration. 💗"];
  if (!etat.complimentsVus.includes(etat.complimentIndex)) {
    etat.complimentsVus.push(etat.complimentIndex);
  }
  const current = compliments[etat.complimentIndex % compliments.length];
  const liked = reponses.reactionsCompliments.includes(current);
  return `
    <div class="stage-content">
      <p class="eyebrow">02 — PETITE PAUSE</p>
      <h1 class="screen-title" tabindex="-1">Petite pause <span class="accent">compliments 💗</span></h1>
      <p class="lead">Promis, je vais essayer de rester naturel. Enfin… aussi naturel qu’un site fait spécialement pour toi peut l’être. 😂</p>
      <article class="compliment-card" aria-live="polite">
        <p class="compliment-count">Un compliment, sans petite ligne en bas</p>
        <p class="compliment-text">« ${escapeHtml(current)} »</p>
        <div class="compliment-actions">
          <button class="button button--secondary" type="button" data-action="another-compliment">
            Encore un compliment <span aria-hidden="true">😏</span>
          </button>
          <button class="button button--quiet" type="button" data-action="like-compliment" aria-pressed="${liked}">
            ${liked ? "Celui-là est noté 💗" : "Celui-là était pas mal 😂"}
          </button>
        </div>
      </article>
      ${navButtons(1, 3, 2, "Passons à la suite ✨")}
    </div>
  `;
}

function compatibilityReaction() {
  const answers = reponses.questionnaire.compatibilite;
  const count = Object.values(answers).filter(Boolean).length;
  if (count === 0) {
    return "Tu gardes encore toutes tes cartes… le mystère est intact. 👀";
  }
  const parts = [];
  if (answers.conversation?.includes("conversation jusqu’à tard")) {
    parts.push("les longues conversations");
  }
  if (answers.rendezVous?.includes("bon repas")) {
    parts.push("les bons repas");
  }
  if (answers.priorite?.includes("L’humour")) {
    parts.push("l’humour");
  }
  if (parts.length >= 2) {
    return `Je retiens ${parts.join(", ")} : voilà déjà de jolies pistes de conversation. Aucun verdict scientifique ici, juste de la curiosité. 😌`;
  }
  if (answers.style?.includes("taquinerie")) {
    return "La taquinerie intelligente est validée… je vais donc devoir soigner mes répliques. 😏";
  }
  if (answers.rendezVous?.includes("promenade")) {
    return "Team promenade tranquille : parfois, une bonne conversation suffit comme programme. 🌿";
  }
  return `${count} réponse${count > 1 ? "s" : ""} notée${count > 1 ? "s" : ""}. C’est juste un petit jeu, pas un test scientifique — la vraie vibe se découvre en discutant. ✨`;
}

function compatibilityContent() {
  return `
    <div class="stage-content">
      <p class="eyebrow">03 — PETIT JEU, ZÉRO SCIENCE</p>
      <h1 class="screen-title" tabindex="-1">Voyons si nos vibes sont <span class="accent">compatibles… 👀</span></h1>
      <p class="lead">Choisis au feeling. Tu peux aussi tout laisser sans réponse — aucun algorithme ne décidera de ta vie amoureuse ici. 😌</p>
      <div class="compat-list">
        ${COMPAT_QUESTIONS.map((item, index) => `
          <section class="compat-question" aria-labelledby="compat-label-${index}">
            <span class="question-label" id="compat-label-${index}">${index + 1}. ${escapeHtml(item.question)}</span>
            ${choiceGroup({
              name: `compat-${item.key}`,
              answer: "compat",
              key: item.key,
              options: item.options,
              selected: reponses.questionnaire.compatibilite[item.key] || "",
              ariaLabel: item.question,
            })}
          </section>
        `).join("")}
      </div>
      <div class="compat-reaction" id="compat-reaction" aria-live="polite">
        ${escapeHtml(compatibilityReaction())}
      </div>
      ${navButtons(2, 4, 3)}
    </div>
  `;
}

function surpriseContent() {
  const options = [
    "😂 Me faire rire.",
    "❤️ Être sincère avec moi.",
    "✨ Me surprendre.",
    "😌 Prendre le temps de me découvrir.",
    "💬 Me poser directement la question.",
  ];
  return `
    <div class="stage-content">
      <p class="eyebrow">04 — QUESTION SURPRISE</p>
      <h1 class="screen-title" tabindex="-1">Imagine que quelqu’un veuille apprendre à te connaître un peu mieux… <span class="accent">tu lui conseillerais quoi ? 😏</span></h1>
      <div class="question-block">
        <span class="question-label">Choisis une réponse, plusieurs, ou aucune. C’est toi qui vois.</span>
        ${choiceGroup({
          name: "surprise",
          answer: "surprise",
          options,
          selected: reponses.questionnaire.questionSurprise,
          ariaLabel: "Quel conseil donnerais-tu à quelqu’un qui veut apprendre à te connaître ?",
        })}
        ${textField({
          id: "surprise-custom",
          label: "Ou donne ta propre réponse ici…",
          placeholder: "Quelques mots, une idée, ou rien du tout…",
          value: reponses.questionnaire.reponseLibreSurprise,
          answer: "surprise-custom",
          max: 300,
        })}
      </div>
      ${navButtons(3, 5, 4)}
    </div>
  `;
}

function ratingContent() {
  const options = [
    "10/10, il a assuré 😂",
    "8/10, pas mal du tout.",
    "5/10, il peut mieux faire.",
    "0/10, qu’il retourne coder. 😭",
    "Je préfère lui donner mon propre avis.",
  ];
  return `
    <div class="stage-content">
      <p class="eyebrow">05 — LE RESPONSABLE DE LA SURPRISE</p>
      <h1 class="screen-title" tabindex="-1">Maintenant, parlons un peu du responsable de cette surprise. <span class="accent">😂</span></h1>
      ${profileFeature()}
      <div class="question-block">
        <span class="question-label">Alors, ${escapeHtml(CONFIG.createur)} mérite quelle note pour cette petite création ? 😏</span>
        ${choiceGroup({
          name: "creator-rating",
          answer: "rating",
          options,
          selected: reponses.avisCreateur,
          ariaLabel: `Quelle note donnes-tu à ${CONFIG.createur} ?`,
        })}
        ${textField({
          id: "rating-comment",
          label: "Un commentaire pour le créateur ?",
          placeholder: "Ton avis sincère, même en deux mots…",
          value: reponses.commentaire,
          answer: "rating-comment",
          max: 400,
        })}
      </div>
      ${navButtons(4, 6, 5, "Découvrir la suite ✨")}
    </div>
  `;
}

function finalContent() {
  const choices = [
    "Tu t’es bien débrouillé 😂",
    "Tu peux faire mieux 😌",
    "À toi de me surprendre 💌",
  ];
  const messages = {
    [choices[0]]: "Mission sourire : peut-être accomplie. Je prends cette victoire très modestement. 😌",
    [choices[1]]: "Message reçu. Le développeur accepte la mission d’amélioration. 😂",
    [choices[2]]: "Oh, le retournement de situation… je suis curieux de voir ça. 👀",
  };
  return `
    <div class="particle-field" id="particle-field" aria-hidden="true"></div>
    <div class="stage-content">
      <p class="eyebrow">06 — LA PETITE RÉVÉLATION</p>
      <h1 class="screen-title" tabindex="-1">Bon… maintenant, tu sais qui se cache derrière tout ça. <span class="accent">😂💗</span></h1>
      ${profileFeature()}
      <p class="lead">
        C’est bien moi, <strong>${escapeHtml(CONFIG.createur)}</strong>. J’ai créé cette petite page spécialement pour toi parce que je voulais te faire sourire d’une manière un peu différente.
      </p>
      <p class="body-copy">Pas besoin de réponse parfaite, pas de pression : je voulais simplement partager un petit moment sympa avec toi.</p>
      <p class="body-copy">Alors, mission accomplie ou je dois encore améliorer mon jeu ? 😏</p>
      <div class="final-choices" role="group" aria-label="Ton avis sur la surprise">
        ${choices.map((choice) => `
          <button
            class="final-choice"
            type="button"
            data-final-choice="${escapeHtml(choice)}"
            aria-pressed="${reponses.reactionFinale === choice}"
          >${escapeHtml(choice)}</button>
        `).join("")}
      </div>
      <p class="final-reaction" id="final-reaction" aria-live="polite">
        ${escapeHtml(messages[reponses.reactionFinale] || "")}
      </p>
      <div class="button-row">
        <button class="button button--secondary" type="button" data-action="toggle-message">
          ${etat.messageVisible ? "Masquer mon message" : "Lui laisser un message"}
        </button>
        <button class="button button--primary" type="button" data-action="open-consent">
          Voir les options de partage <span aria-hidden="true">💌</span>
        </button>
      </div>
      ${etat.messageVisible ? `
        <div class="message-composer">
          ${textField({
            id: "final-message",
            label: `Un message pour ${CONFIG.createur} ?`,
            placeholder: "Écris ce que tu veux — ou garde-le pour toi…",
            value: reponses.messageFinal,
            answer: "final-message",
            max: 600,
          })}
          <p class="quiet-note">Écrire ici ne l’envoie pas. Tu pourras décider plus tard si tu veux le partager.</p>
        </div>
      ` : ""}
      <nav class="stage-nav" aria-label="Navigation du jeu">
        <button class="button button--quiet" type="button" data-action="back">← Retour</button>
        <span class="step-caption">Étape 6 sur 6</span>
        <span aria-hidden="true"></span>
      </nav>
    </div>
  `;
}

function recapTexte() {
  const lignes = [
    `Une petite réponse pour ${reponses.createur}`,
    "—",
  ];
  const q = reponses.questionnaire;
  const ajouter = (label, value) => {
    if (value && String(value).trim()) lignes.push(`${label} ${String(value).trim()}`);
  };

  ajouter("Brise-glace :", q.briseGlace);
  COMPAT_QUESTIONS.forEach((item) => {
    ajouter(`${item.question}`, q.compatibilite[item.key]);
  });
  ajouter("Mon conseil :", q.questionSurprise);
  ajouter("Ma réponse personnelle :", q.reponseLibreSurprise);
  if (reponses.reactionsCompliments.length) {
    lignes.push("Les compliments que j’ai préférés :");
    reponses.reactionsCompliments.forEach((compliment) => lignes.push(`• « ${compliment} »`));
  }
  ajouter(`Ma note pour ${reponses.createur} :`, reponses.avisCreateur);
  ajouter("Mon commentaire :", reponses.commentaire);
  ajouter("Mon avis sur sa surprise :", reponses.reactionFinale);
  ajouter("Mon message :", reponses.messageFinal);

  if (lignes.length === 2) {
    lignes.push("Je préfère garder mes réponses légères pour l’instant. 😊");
  }
  lignes.push("", "— envoyé par moi, après vérification");
  return lignes.join("\n");
}


function normalizeInternationalNumber(value) {
  const compact = String(value ?? "").trim().replace(/[\s().-]/g, "");
  if (!/^\+?\d{7,15}$/.test(compact)) return "";
  return compact.startsWith("+") ? compact : `+${compact}`;
}

function buildWhatsAppUrl() {
  const number = normalizeInternationalNumber(CONFIG.whatsappNumber);
  if (!number) return "";

  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(recapTexte())}`;
}

function buildSmsUrl() {
  const number = normalizeInternationalNumber(CONFIG.smsNumber);
  if (!number) return "";

  return `sms:${number}?body=${encodeURIComponent(recapTexte())}`;
}

function buildEmailUrl() {
  const recipient = String(CONFIG.emailRecipient || "").trim();
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(recipient)) return "";

  const subject = `Réponses à la petite surprise — ${CONFIG.createur}`;
  return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(recapTexte())}`;
}

function shareContent() {
  const emailRecipient = String(CONFIG.emailRecipient || "").trim();
  if (!reponses.consentementPartage) {
    return `
      <div class="stage-content">
        <p class="eyebrow">AVANT TOUT PARTAGE</p>
        <h1 class="screen-title" tabindex="-1">Tu veux partager tes réponses avec <span class="accent">${escapeHtml(CONFIG.createur)} ? 💌</span></h1>
        <div class="consent-box">
          <p>Si tu acceptes, les réponses que tu as choisies seront préparées pour être partagées avec ${escapeHtml(CONFIG.createur)}. Pour l’e-mail, le destinataire configuré est <strong>${escapeHtml(emailRecipient || "aucune adresse configurée")}</strong>. Tu verras le récapitulatif avant d’ouvrir une application.</p>
          <p>Tu peux aussi terminer le jeu sans partager tes réponses. Le refus ne bloque rien et ne change pas la suite.</p>
        </div>
        <div class="privacy-callout">
          <strong>En clair</strong>
          <span>Cette page ne transmet rien automatiquement. Tu choisiras ensuite une application, tu vérifieras le texte et le destinataire, puis tu appuieras toi-même sur Envoyer. Pour l’e-mail, le bouton ouvre un brouillon dans ton application de messagerie.</span>
        </div>
        <div class="button-row">
          <button class="button button--primary" type="button" data-action="accept-share">Oui, je veux partager mes réponses 💗</button>
          <button class="button button--secondary" type="button" data-action="decline-share">Non merci, je préfère les garder privées</button>
        </div>
        <nav class="stage-nav" aria-label="Navigation du jeu">
          <button class="button button--quiet" type="button" data-action="back">← Retour</button>
          <span class="step-caption">Tu gardes le contrôle</span>
          <span aria-hidden="true"></span>
        </nav>
      </div>
    `;
  }

  const whatsappUrl = buildWhatsAppUrl();
  const smsUrl = buildSmsUrl();
  const emailUrl = buildEmailUrl();
  const messengerUrl = safeHttpsUrl(CONFIG.messengerLink) || safeHttpsUrl(CONFIG.facebookProfileUrl);
  const whatsappValue = String(CONFIG.whatsappNumber || "").trim();
  const smsValue = String(CONFIG.smsNumber || "").trim();
  const emailValue = String(CONFIG.emailRecipient || "").trim();
  const whatsappLabel = whatsappValue && !whatsappUrl
    ? "Le numéro WhatsApp configuré semble invalide. Corrige son format international dans script.js."
    : whatsappValue
      ? "Le numéro WhatsApp configuré sera prérempli."
      : "Aucun numéro WhatsApp n’est configuré : tu choisiras toi-même le destinataire.";
  const smsLabel = smsValue && !smsUrl
    ? "Le numéro SMS configuré semble invalide. Corrige-le dans script.js."
    : smsValue
      ? "Le numéro SMS configuré sera prérempli."
      : "Aucun numéro SMS n’est configuré : l’application pourra te laisser choisir le destinataire.";
  const emailLabel = emailValue && !emailUrl
    ? "L’adresse e-mail configurée semble invalide. Corrige-la dans script.js."
    : emailValue
      ? `Le brouillon e-mail sera adressé à ${emailValue}. Vérifie-le et appuie toi-même sur Envoyer.`
      : "Aucune adresse e-mail n’est configurée.";
  const messengerLabel = messengerUrl
    ? "Le lien Messenger/Facebook configuré peut être ouvert séparément."
    : (CONFIG.messengerLink || CONFIG.facebookProfileUrl)
      ? "Le lien Messenger/Facebook configuré n’est pas une URL HTTPS valide. Tu peux tout de même copier le texte."
      : "Aucun lien Messenger/Facebook n’est configuré : ouvre Messenger toi-même après avoir copié le texte.";

  return `
    <div class="stage-content">
      <p class="eyebrow">RÉCAPITULATIF — À RELIRE AVANT ENVOI</p>
      <h1 class="screen-title" tabindex="-1">Tu gardes la <span class="accent">main jusqu’au bout. 💗</span></h1>
      <p class="lead">Voici le texte qui sera préparé. Rien ne part de cette page : vérifie-le, puis envoie-le toi-même dans l’application choisie.</p>
      <div class="summary-card">
        <h2>Ton récapitulatif</h2>
        <pre class="summary-text" id="summary-text">${escapeHtml(recapTexte())}</pre>
      </div>
      <div class="share-actions">
        ${whatsappUrl
          ? `<a class="button button--primary" id="whatsapp-link" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" data-share-app="whatsapp">Partager sur WhatsApp <span aria-hidden="true">↗</span></a>`
          : `<button class="button button--primary" type="button" disabled title="Configure un numéro WhatsApp international valide dans script.js">${whatsappValue ? "WhatsApp — numéro mal configuré" : "WhatsApp — aucun numéro configuré"}</button>`}
        ${smsUrl
          ? `<a class="button button--secondary" id="sms-link" href="${escapeHtml(smsUrl)}" data-share-app="sms">Partager par SMS <span aria-hidden="true">↗</span></a>`
          : `<button class="button button--secondary" type="button" disabled title="Configure un numéro SMS international valide dans script.js">${smsValue ? "SMS — numéro mal configuré" : "SMS — aucun numéro configuré"}</button>`}
        ${emailUrl
          ? `<a class="button button--secondary" id="email-link" href="${escapeHtml(emailUrl)}" data-share-app="email">Partager par e-mail <span aria-hidden="true">↗</span></a>`
          : `<button class="button button--secondary" type="button" disabled title="Configure une adresse e-mail valide dans script.js">${emailValue ? "E-mail — adresse mal configurée" : "E-mail — aucune adresse configurée"}</button>`}
        <button class="button button--secondary" type="button" data-action="messenger-share">
          Partager sur Messenger <span aria-hidden="true">↗</span>
        </button>
        <button class="button button--quiet" type="button" data-action="copy-summary">
          Copier le récapitulatif
        </button>
        ${messengerUrl
          ? `<a class="button button--quiet" href="${escapeHtml(messengerUrl)}" target="_blank" rel="noopener noreferrer">Ouvrir mon lien Messenger / Facebook ↗</a>`
          : ""}
      </div>
      <p class="share-help">${escapeHtml(whatsappLabel)} ${escapeHtml(smsLabel)} ${escapeHtml(emailLabel)} ${escapeHtml(messengerLabel)} Messenger ne permet pas à une page statique d’envoyer un message privé automatiquement : copie le texte et colle-le toi-même dans la conversation.</p>
      <p class="share-status" id="share-status" role="status" aria-live="polite">${escapeHtml(etat.shareStatus || "Aucune confirmation d’envoi ne peut être faite par cette page.")}</p>
      <div class="button-row">
        <button class="button button--secondary" type="button" data-action="decline-share">Terminer</button>
      </div>
      <nav class="stage-nav" aria-label="Navigation du jeu">
        <button class="button button--quiet" type="button" data-action="back">← Retour</button>
        <span class="step-caption">Tu peux encore modifier tes réponses</span>
        <span aria-hidden="true"></span>
      </nav>
    </div>
  `;
}

function completionContent() {
  return `
    <div class="stage-content">
      <div class="completion-mark" aria-hidden="true">♡</div>
      <p class="eyebrow">FIN DE LA PETITE SURPRISE</p>
      <h1 class="screen-title" tabindex="-1">Merci d’avoir joué <span class="accent">à ton rythme. ✨</span></h1>
      <p class="completion-note">
        ${reponses.consentementPartage
          ? "Tu as choisi de préparer un partage. Seule l’application que tu as ouverte peut te demander d’envoyer le message — cette page ne peut pas vérifier s’il a été envoyé."
          : "Tu as choisi de garder tes réponses privées. Elles n’ont pas quitté cette page et ne seront pas envoyées par surprise."}
      </p>
      <p class="body-copy">J’espère au moins t’avoir arraché un petit sourire. À bientôt, peut-être. 😌</p>
      <div class="button-row">
        <button class="button button--secondary" type="button" data-action="edit-answers">Revoir mes réponses</button>
        <button class="button button--primary" type="button" data-action="restart">Recommencer</button>
      </div>
    </div>
  `;
}

function stageContent() {
  switch (etat.etape) {
    case 0: return introContent();
    case 1: return iceContent();
    case 2: return complimentsContent();
    case 3: return compatibilityContent();
    case 4: return surpriseContent();
    case 5: return ratingContent();
    case 6: return finalContent();
    case 7: return shareContent();
    case 8: return completionContent();
    default: return introContent();
  }
}

function mettreAJourProgression() {
  const percentage = Math.min(etat.etape, 6) / 6 * 100;
  progression.setAttribute("aria-valuenow", String(Math.round(percentage)));
  progressionRemplie.style.width = `${percentage}%`;

  if (etat.etape === 0) {
    progressionTexte.textContent = "À ton rythme";
    progressionEtape.textContent = "Le début";
  } else if (etat.etape <= 6) {
    progressionTexte.textContent = "Une petite étape à la fois";
    progressionEtape.textContent = `Étape ${etat.etape} / 6`;
  } else if (etat.etape === 7) {
    progressionTexte.textContent = "Tu gardes le contrôle";
    progressionEtape.textContent = "Avant tout partage";
  } else {
    progressionTexte.textContent = "Merci d’avoir joué";
    progressionEtape.textContent = "Terminé";
  }
}

function connecterPortraits() {
  app.querySelectorAll(".portrait-img").forEach((image) => {
    const trigger = image.closest("[data-portrait-trigger]");
    const activerPortrait = () => {
      if (!trigger || !image.naturalWidth) return;
      trigger.disabled = false;
      trigger.setAttribute("aria-label", `Afficher le portrait de ${CONFIG.createur} en grand`);
    };
    const signalerPhotoIndisponible = () => {
      image.hidden = true;
      if (trigger) {
        trigger.disabled = true;
        trigger.setAttribute("aria-label", `Portrait de ${CONFIG.createur} indisponible`);
      }
      const fallback = image.parentElement?.querySelector(".portrait-fallback");
      if (fallback) fallback.hidden = false;
    };

    image.addEventListener("load", activerPortrait, { once: true });
    image.addEventListener("error", () => {
      signalerPhotoIndisponible();
    }, { once: true });
    if (image.complete) {
      if (image.naturalWidth === 0) {
        image.dispatchEvent(new Event("error"));
      } else {
        activerPortrait();
      }
    }
  });
}

function render({ focusHeading = false } = {}) {
  mettreAJourProgression();
  app.innerHTML = `
    <div class="stage-layout">
      ${creatorRail()}
      <section class="stage-card" aria-label="Étape de la surprise">
        ${stageContent()}
      </section>
    </div>
  `;
  connecterPortraits();
  mettreAJourCompteurs();

  if (focusHeading) {
    app.querySelector(".screen-title")?.focus({ preventScroll: true });
  }

  if (etat.etape === 6 && !etat.particulesLancees) {
    etat.particulesLancees = true;
    lancerParticules();
  }
}

function mettreAJourCompteurs() {
  app.querySelectorAll("[data-counter-for]").forEach((counter) => {
    const field = document.getElementById(counter.dataset.counterFor);
    if (field) counter.textContent = String(field.value.length);
  });
}

function lancerParticules() {
  if (motionReduite.matches) return;
  const field = document.querySelector("#particle-field");
  if (!field) return;
  const colors = ["#FF5C93", "#A78BFA", "#ffd0e0", "#d7c1ff"];
  for (let index = 0; index < 18; index += 1) {
    const heart = document.createElement("span");
    heart.className = "heart-particle";
    heart.textContent = "♥";
    heart.style.setProperty("--left", `${8 + Math.random() * 84}%`);
    heart.style.setProperty("--size", `${9 + Math.random() * 11}px`);
    heart.style.setProperty("--duration", `${2.6 + Math.random() * 1.8}s`);
    heart.style.setProperty("--delay", `${Math.random() * 1.1}s`);
    heart.style.setProperty("--drift", `${Math.round(Math.random() * 46 - 23)}px`);
    heart.style.setProperty("--particle-color", colors[index % colors.length]);
    field.append(heart);
  }
}

function afficherToast(message) {
  window.clearTimeout(etat.toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  etat.toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 4800);
}

function modifierValeur(target, property, value) {
  if (target[property] === value) return;
  target[property] = value;
  if (reponses.consentementPartage) {
    reponses.consentementPartage = false;
    etat.shareStatus = "";
  }
}

function choisirRadio(input) {
  const value = input.value;
  switch (input.dataset.answer) {
    case "ice":
      modifierValeur(reponses.questionnaire, "briseGlace", value);
      mettreAJourReactionGlace();
      break;
    case "compat": {
      const key = input.dataset.key;
      if (reponses.questionnaire.compatibilite[key] !== value) {
        reponses.questionnaire.compatibilite[key] = value;
        if (reponses.consentementPartage) reponses.consentementPartage = false;
      }
      const reaction = document.querySelector("#compat-reaction");
      if (reaction) reaction.textContent = compatibilityReaction();
      break;
    }
    case "surprise":
      modifierValeur(reponses.questionnaire, "questionSurprise", value);
      break;
    case "rating":
      modifierValeur(reponses, "avisCreateur", value);
      break;
    default:
      return;
  }

  input.closest(".stage-content")?.querySelectorAll(".choice").forEach((label) => {
    label.classList.toggle("is-selected", Boolean(label.querySelector("input:checked")));
  });
}

function mettreAJourReactionGlace() {
  const reaction = document.querySelector("#ice-reaction");
  if (!reaction) return;
  const value = reponses.questionnaire.briseGlace;
  const reactions = [
    ["ange qui ne fait jamais", "Je note… mais les anges ont parfois les dossiers les plus surprenants. 😇"],
    ["petite diablesse", "Au moins, le niveau d’avertissement est honnête. Je respecte. 😈"],
    ["Ça dépend", "Réponse diplomatique… et mystérieuse. Joli coup. 👀"],
    ["mélange des trois", "Un mélange des trois ? Je vais garder mon casque à portée de main. 😂"],
  ];
  reaction.textContent = reactions.find(([needle]) => value.includes(needle))?.[1]
    || "Choisis la réponse qui te ressemble le plus… ou le moins. 👀";
}

function saveTextAnswer(field) {
  const value = field.value;
  switch (field.dataset.textAnswer) {
    case "surprise-custom":
      modifierValeur(reponses.questionnaire, "reponseLibreSurprise", value);
      break;
    case "rating-comment":
      modifierValeur(reponses, "commentaire", value);
      break;
    case "final-message":
      modifierValeur(reponses, "messageFinal", value);
      break;
    default:
      return;
  }
  const counter = app.querySelector(`[data-counter-for="${CSS.escape(field.id)}"]`);
  if (counter) counter.textContent = String(value.length);
}

function allerA(etape, { focus = true } = {}) {
  etat.etape = etape;
  etat.shareStatus = "";
  render({ focusHeading: focus });
  if (focus && window.innerWidth < 761) {
    window.scrollTo({ top: 0, behavior: motionReduite.matches ? "auto" : "smooth" });
  }
}

function setStatus(message) {
  etat.shareStatus = message;
  const status = document.querySelector("#share-status");
  if (status) status.textContent = message;
}

async function copierTexte(text) {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Essaie la méthode de repli ci-dessous si le presse-papiers est refusé.
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  helper.style.pointerEvents = "none";
  document.body.append(helper);
  helper.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  helper.remove();
  return copied;
}

async function partagerPourMessenger() {
  const messengerUrl = safeHttpsUrl(CONFIG.messengerLink) || safeHttpsUrl(CONFIG.facebookProfileUrl);
  let ouvertureDemandee = false;

  // Ouvre le lien directement pendant le clic utilisateur pour limiter le blocage des pop-ups.
  if (messengerUrl && typeof window.open === "function") {
    try {
      window.open(messengerUrl, "_blank", "noopener,noreferrer");
      ouvertureDemandee = true;
    } catch {
      // Le lien séparé reste disponible si le navigateur refuse cette ouverture.
    }
  }

  const copied = await copierTexte(recapTexte());
  const noteOuverture = ouvertureDemandee
    ? "J’ai aussi demandé l’ouverture de ton lien Messenger/Facebook dans un nouvel onglet. Si le navigateur l’a bloquée, utilise le lien séparé ci-dessous."
    : messengerUrl
      ? "Le navigateur n’a pas permis d’ouvrir le lien automatiquement ; utilise le lien séparé ci-dessous."
      : "Aucun lien Messenger/Facebook valide n’est configuré : ouvre Messenger toi-même.";

  if (copied) {
    setStatus(`Le récapitulatif a été copié. ${noteOuverture} Colle le texte, relis-le et envoie-le toi-même si tu le souhaites.`);
  } else {
    setStatus(`La copie automatique n’a pas fonctionné : sélectionne le récapitulatif ci-dessus et copie-le manuellement. ${noteOuverture}`);
  }
}

function retour() {
  if (etat.etape === 0) return;
  if (etat.etape === 7) {
    allerA(6);
    return;
  }
  if (etat.etape === 8) {
    allerA(6);
    return;
  }
  allerA(etat.etape - 1);
}

function reinitialiser({ confirmation = true } = {}) {
  if (confirmation && !window.confirm("Effacer toutes tes réponses de cette page et recommencer ?")) return;

  const vide = REPONSE_VIDE();
  Object.keys(reponses).forEach((key) => delete reponses[key]);
  Object.assign(reponses, vide);
  etat.etape = 0;
  etat.complimentIndex = 0;
  etat.complimentsVus = [];
  etat.messageVisible = false;
  etat.particulesLancees = false;
  etat.shareStatus = "";
  render({ focusHeading: true });
  afficherToast("Tes réponses ont été effacées de cette page.");
}

function handleClick(event) {
  const portraitTrigger = event.target.closest("[data-portrait-trigger]");
  const actionButton = event.target.closest("[data-action]");
  const finalChoice = event.target.closest("[data-final-choice]");
  const shareLink = event.target.closest("[data-share-app]");

  if (portraitTrigger) {
    ouvrirPortrait(portraitTrigger);
    return;
  }

  if (shareLink) {
    const appNames = {
      sms: "SMS",
      whatsapp: "WhatsApp",
      email: "e-mail",
    };
    const appName = appNames[shareLink.dataset.shareApp] || "l’application choisie";
    setStatus(`Le texte est préparé pour ${appName}. Vérifie le destinataire et le message dans l’application, puis envoie-le toi-même si tu le souhaites. Cette page ne saura pas s’il a été envoyé.`);
    return;
  }

  if (finalChoice) {
    modifierValeur(reponses, "reactionFinale", finalChoice.dataset.finalChoice);
    app.querySelectorAll("[data-final-choice]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button === finalChoice));
    });
    const reactions = {
      "Tu t’es bien débrouillé 😂": "Mission sourire : peut-être accomplie. Je prends cette victoire très modestement. 😌",
      "Tu peux faire mieux 😌": "Message reçu. Le développeur accepte la mission d’amélioration. 😂",
      "À toi de me surprendre 💌": "Oh, le retournement de situation… je suis curieux de voir ça. 👀",
    };
    const reaction = document.querySelector("#final-reaction");
    if (reaction) reaction.textContent = reactions[reponses.reactionFinale] || "";
    return;
  }

  if (!actionButton) return;
  switch (actionButton.dataset.action) {
    case "start":
      allerA(1);
      break;
    case "back":
      retour();
      break;
    case "next": {
      const next = Number(actionButton.dataset.next);
      if (Number.isInteger(next) && next >= 0 && next <= 6) allerA(next);
      break;
    }
    case "another-compliment":
      chooseCompliment();
      render({ focusHeading: false });
      break;
    case "like-compliment": {
      const current = CONFIG.compliments[etat.complimentIndex];
      if (current && reponses.reactionsCompliments.includes(current)) {
        reponses.reactionsCompliments = reponses.reactionsCompliments.filter((item) => item !== current);
      } else if (current) {
        reponses.reactionsCompliments.push(current);
      }
      if (reponses.consentementPartage) reponses.consentementPartage = false;
      render({ focusHeading: false });
      break;
    }
    case "toggle-message":
      etat.messageVisible = !etat.messageVisible;
      render({ focusHeading: false });
      if (etat.messageVisible) document.querySelector("#final-message")?.focus();
      break;
    case "open-consent":
      allerA(7);
      break;
    case "accept-share":
      reponses.consentementPartage = true;
      etat.shareStatus = "";
      render({ focusHeading: true });
      break;
    case "decline-share":
      reponses.consentementPartage = false;
      etat.shareStatus = "";
      allerA(8);
      break;
    case "messenger-share":
      void partagerPourMessenger();
      break;
    case "copy-summary":
      void copierTexte(recapTexte()).then((copied) => {
        setStatus(copied
          ? "Récapitulatif copié si le navigateur l’a autorisé. Rien n’a été envoyé."
          : "La copie automatique a échoué. Sélectionne le texte du récapitulatif pour le copier manuellement.");
      });
      break;
    case "edit-answers":
      allerA(1);
      break;
    case "restart":
      reinitialiser({ confirmation: false });
      break;
    default:
      break;
  }
}

function ouvrirPortrait(trigger) {
  const dialog = document.querySelector("#portrait-lightbox");
  const imageGrandFormat = document.querySelector("#portrait-lightbox-image");
  const titre = document.querySelector("#portrait-lightbox-title");
  const imageMiniature = trigger.querySelector(".portrait-img");

  if (
    !dialog
    || !imageGrandFormat
    || !titre
    || !imageMiniature?.naturalWidth
    || typeof dialog.showModal !== "function"
  ) {
    return;
  }

  etat.portraitOpener = trigger;
  imageGrandFormat.src = imageMiniature.currentSrc || imageMiniature.src;
  imageGrandFormat.alt = `Portrait de ${CONFIG.createur}, affiché en grand`;
  titre.textContent = `Portrait de ${CONFIG.createur}`;
  dialog.showModal();
}

function handleChange(event) {
  const target = event.target;
  if (target.matches('input[type="radio"][data-answer]')) {
    choisirRadio(target);
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.matches("[data-text-answer]")) saveTextAnswer(target);
}

function setup() {
  setTheme();
  const portraitDialog = document.querySelector("#portrait-lightbox");
  const portraitCloseButton = document.querySelector("#portrait-lightbox-close");

  portraitCloseButton?.addEventListener("click", () => portraitDialog?.close());
  portraitDialog?.addEventListener("click", (event) => {
    // Un clic sur le fond du dialogue ferme la photo ; un clic dans le panneau ne le fait pas.
    if (event.target === portraitDialog) portraitDialog.close();
  });
  portraitDialog?.addEventListener("close", () => {
    const opener = etat.portraitOpener;
    etat.portraitOpener = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });

  render();
  app.addEventListener("click", handleClick);
  app.addEventListener("change", handleChange);
  app.addEventListener("input", handleInput);
  boutonEffacer.addEventListener("click", () => reinitialiser());

  // Escape quitte la zone de partage sans lancer aucune transmission.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (portraitDialog?.open) return;
    if (etat.etape === 7) retour();
  });
}

setup();
