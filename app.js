/* Rivet · application (interface). Les données passent par window.RivetAPI (api.js). */
(() => {
'use strict';
const api = window.RivetAPI;

/* ===================================================================
   Utilitaires
   =================================================================== */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sid = () => Math.random().toString(36).slice(2, 9);
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* idem */ } },
};
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayIso = () => isoOf(new Date());
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoOf(d); };
const fmtShort = (s) => (s ? new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '');
const fmtDay = (s) => new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtDate = (ts) => new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtStamp = (ts) => new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtNum = (n) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
const initials = (n) => (String(n || '?').split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?');
const firstName = (n) => String(n || '').split(' ')[0];
const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const validSlug = (s) => /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(s);
const mapsUrl = (a) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
const telUrl = (p) => 'tel:' + String(p).replace(/[^\d+]/g, '');
const sameEmail = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const svg = (p, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICON = {
  today: svg('<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/><path d="m9 15 2 2 4-4"/>'),
  board: svg('<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M9 9v12"/>'),
  settings: svg('<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>'),
  pin: svg('<path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
  phone: svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  chev: svg('<path d="m6 9 6 6 6-6"/>', 14),
  left: svg('<path d="m15 18-6-6 6-6"/>'),
  right: svg('<path d="m9 18 6-6-6-6"/>'),
  caret: svg('<path d="m9 6 6 6-6 6"/>', 14),
  dots: svg('<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>'),
  close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>', 20),
  check: svg('<path d="m5 12 5 5L20 7"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 14),
  users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
  logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
  mail: svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>'),
  user: svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  building: svg('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>'),
};

/* ===================================================================
   Métiers ciblés (dépannage à domicile) et modèles de tableaux
   =================================================================== */
const TRADES = {
  plomberie: { label: 'Plomberie', prestations: ["Fuite d'eau", 'Débouchage', 'Chauffe-eau', 'Robinetterie', 'Sanitaires', 'Recherche de fuite'] },
  electricite: { label: 'Électricité', prestations: ['Panne électrique', 'Tableau électrique', 'Prises et éclairage', 'Mise en conformité', 'Borne de recharge', 'Interphone'] },
  chauffage: { label: 'Chauffage et climatisation', prestations: ['Panne de chaudière', 'Entretien annuel', 'Pompe à chaleur', 'Radiateurs', 'Climatisation', 'Ramonage'] },
  serrurerie: { label: 'Serrurerie', prestations: ['Ouverture de porte', 'Changement de serrure', 'Porte blindée', 'Cylindre', 'Porte de garage'] },
  vitrerie: { label: 'Vitrerie et menuiserie', prestations: ['Vitre cassée', 'Double vitrage', 'Volet roulant', 'Fenêtre', 'Mise en sécurité'] },
  electromenager: { label: 'Électroménager', prestations: ['Lave-linge', 'Lave-vaisselle', 'Réfrigérateur', 'Four et plaques', 'Sèche-linge'] },
  multiservice: { label: 'Multiservice et maintenance', prestations: ['Plomberie', 'Électricité', 'Chauffage', 'Serrurerie', 'Petits travaux'] },
};
const COLORS = ['blue', 'green', 'orange', 'violet', 'red', 'yellow', 'grey'];
const COLOR_NAMES = { blue: 'Bleu', green: 'Vert', orange: 'Orange', violet: 'Violet', red: 'Rouge', yellow: 'Jaune', grey: 'Gris' };
const PRESTA_COLORS = ['blue', 'violet', 'orange', 'green', 'yellow', 'grey'];
const LEVELS = { none: 'Aucun accès', view: 'Lecture', edit: 'Édition' };
const ROLE_LABEL = { owner: 'Propriétaire', admin: 'Administrateur', member: 'Membre' };
const NOUN_INT = { cap: 'Intervention', add: 'une intervention', neu: 'Nouvelle intervention' };
const NOUN_GEN = { cap: 'Élément', add: 'un élément', neu: 'Nouvel élément' };
const FIELD_STATUS = () => [
  { id: 'todo', label: 'À planifier', color: 'grey' },
  { id: 'plan', label: 'Planifiée', color: 'blue' },
  { id: 'route', label: 'En route', color: 'violet' },
  { id: 'site', label: 'Sur place', color: 'yellow' },
  { id: 'done', label: 'Terminée', color: 'green' },
  { id: 'resched', label: 'À reprogrammer', color: 'orange' },
  { id: 'cancel', label: 'Annulée', color: 'red' },
];
const URGENCY = () => [
  { id: 'norm', label: 'Normale', color: 'grey' },
  { id: 'urg', label: 'Urgente', color: 'orange' },
  { id: 'now', label: 'Dépannage immédiat', color: 'red' },
];
const COL_TYPES = [
  { type: 'text', label: 'Texte', hint: 'Client, référence, matériel' },
  { type: 'status', label: 'Statut', hint: "Étapes de l'intervention" },
  { type: 'priority', label: 'Urgence', hint: 'Normale, urgente, immédiate' },
  { type: 'people', label: 'Personne', hint: 'Technicien assigné' },
  { type: 'date', label: 'Date', hint: 'Jour du passage' },
  { type: 'time', label: 'Heure', hint: 'Créneau de passage' },
  { type: 'address', label: 'Adresse', hint: "Ouvre l'itinéraire" },
  { type: 'phone', label: 'Téléphone', hint: 'Appel en un geste' },
  { type: 'number', label: 'Nombre', hint: 'Durée, montant, quantité' },
  { type: 'check', label: 'Case à cocher', hint: 'Bon signé, pièce reçue' },
];
const COL_W = { text: 180, status: 150, people: 170, date: 140, time: 100, address: 240, phone: 160, number: 120, check: 104 };

function savTemplate(trade) {
  const T = TRADES[trade] || TRADES.multiservice;
  return {
    noun: NOUN_INT,
    column_defs: [
      { id: 'client', name: 'Client', type: 'text' },
      { id: 'adresse', name: 'Adresse', type: 'address' },
      { id: 'tel', name: 'Téléphone', type: 'phone' },
      { id: 'presta', name: 'Prestation', type: 'status', options: T.prestations.map((l, i) => ({ id: 'p' + i, label: l, color: PRESTA_COLORS[i % PRESTA_COLORS.length] })) },
      { id: 'tech', name: 'Technicien', type: 'people' },
      { id: 'statut', name: 'Statut', type: 'status', options: FIELD_STATUS() },
      { id: 'urgence', name: 'Urgence', type: 'status', options: URGENCY() },
      { id: 'date', name: 'Date', type: 'date' },
      { id: 'heure', name: 'Heure', type: 'time' },
      { id: 'duree', name: 'Durée (h)', type: 'number' },
      { id: 'montant', name: 'Montant TTC (€)', type: 'number' },
      { id: 'bon', name: 'Bon signé', type: 'check' },
    ],
    group_defs: [
      { id: 'g-urg', name: 'Urgences', color: 'red' },
      { id: 'g-plan', name: 'Planifiées', color: 'blue' },
      { id: 'g-rep', name: 'À reprogrammer', color: 'orange' },
      { id: 'g-done', name: 'Clôturées', color: 'green' },
    ],
  };
}
function blankTemplate() {
  return {
    noun: NOUN_GEN,
    column_defs: [
      { id: sid(), name: 'Statut', type: 'status', options: FIELD_STATUS() },
      { id: sid(), name: 'Responsable', type: 'people' },
      { id: sid(), name: 'Date', type: 'date' },
    ],
    group_defs: [{ id: sid(), name: 'Groupe principal', color: 'blue' }],
  };
}

/* ===================================================================
   État
   =================================================================== */
const st = {
  screen: 'loading',
  auth: { step: 'instance', org: null, err: '', info: '', busy: false, inviteToken: null, invite: null, slugTouched: false, wantOrgId: null, form: {} },
  session: null, user: null, orgs: [], org: null, role: 'member',
  members: [], workspaces: [], boards: [], wsAccess: [], boardAccess: [], items: [], updates: {}, invitations: [], myInvites: [],
  page: null, boardId: null, search: '', person: '', day: null, dayScope: 'me',
  expanded: new Set(), pop: null, modal: null, drawer: null, armed: null, toast: null, side: false, drag: null,
  focus: null, selectAll: false, settingsTab: 'team', accessUser: null, calMonth: null, loadingOrg: false, pendingRemote: false,
};
let unsubscribe = null;

/* ===================================================================
   Droits (miroir des règles RLS, pour l'affichage uniquement)
   =================================================================== */
const meId = () => (st.user ? st.user.id : null);
const isAdminRole = (r) => r === 'owner' || r === 'admin';
const isAdmin = () => isAdminRole(st.role);
const memberById = (id) => st.members.find((m) => m.user_id === id);
const memberName = (m) => (m ? (m.full_name || m.email) : 'Ancien membre');
function wsLevelFor(userId, role, wsId) {
  if (isAdminRole(role)) return 'edit';
  const a = st.wsAccess.find((x) => x.workspace_id === wsId && x.user_id === userId);
  return a ? a.level : 'none';
}
function boardLevelFor(userId, role, b) {
  if (isAdminRole(role)) return 'edit';
  const o = st.boardAccess.find((x) => x.board_id === b.id && x.user_id === userId);
  return o ? o.level : wsLevelFor(userId, role, b.workspace_id);
}
const boardLevel = (b) => boardLevelFor(meId(), st.role, b);
const wsLevel = (wsId) => wsLevelFor(meId(), st.role, wsId);
const canEdit = (b) => !!b && boardLevel(b) === 'edit';
const visibleBoards = () => st.boards.filter((b) => boardLevel(b) !== 'none');

/* ===================================================================
   Accès aux données locales
   =================================================================== */
const curBoard = () => st.boards.find((b) => b.id === st.boardId) || null;
const boardById = (id) => st.boards.find((b) => b.id === id) || null;
const wsById = (id) => st.workspaces.find((w) => w.id === id);
const itemById = (id) => st.items.find((i) => i.id === id) || null;
const boardOf = (it) => (it ? boardById(it.board_id) : null);
const colById = (b, id) => (b ? b.column_defs.find((c) => c.id === id) : null);
const byPos = (a, z) => (a.position - z.position) || ((a.num || 0) - (z.num || 0));
const topItems = (b) => st.items.filter((i) => i.board_id === b.id && !i.parent_id).sort(byPos);
const kids = (it) => st.items.filter((i) => i.parent_id === it.id).sort(byPos);
const nounOf = (b) => ({ ...NOUN_GEN, ...((b && b.noun) || {}) });
const code = (b, it) => `${b.prefix}-${String(it.num || 0).padStart(4, '0')}`;
const colsOf = (b, type) => b.column_defs.filter((c) => c.type === type);
const statusCol = (b) => b.column_defs.find((c) => c.type === 'status' && /statut|état/i.test(c.name)) || b.column_defs.find((c) => c.type === 'status');
const firstCol = (b, type) => b.column_defs.find((c) => c.type === type);
const isDone = (b, ent) => {
  const c = statusCol(b); if (!c) return false;
  const o = (c.options || []).find((x) => x.id === ent.data[c.id]);
  return !!o && o.color === 'green';
};
const isLate = (b, it) => { const d = firstCol(b, 'date'); const v = d && it.data[d.id]; return !!v && v < todayIso() && !isDone(b, it); };
const upsert = (arr, row) => { const i = arr.findIndex((x) => x.id === row.id); if (i >= 0) arr[i] = { ...arr[i], ...row }; else arr.push(row); };
const viewPref = (b) => LS.get('rivet.view.' + b.id, {});
const setViewPref = (b, patch) => LS.set('rivet.view.' + b.id, { ...viewPref(b), ...patch });
const collapsed = () => new Set(LS.get('rivet.collapsed', []));
function toggleCollapsed(id) { const s = collapsed(); s.has(id) ? s.delete(id) : s.add(id); LS.set('rivet.collapsed', [...s]); }

function filtered(b) {
  const q = st.search.trim().toLowerCase();
  const pCols = colsOf(b, 'people');
  return topItems(b).filter((it) => {
    if (q) {
      const txt = b.column_defs.filter((c) => ['text', 'address', 'phone'].includes(c.type)).map((c) => it.data[c.id] || '');
      if (![it.name, code(b, it), ...txt].join(' ').toLowerCase().includes(q)) return false;
    }
    if (st.person) {
      const hit = (e) => pCols.some((c) => e.data[c.id] === st.person);
      if (!hit(it) && !kids(it).some(hit)) return false;
    }
    return true;
  });
}

/* ===================================================================
   Erreurs et notifications
   =================================================================== */
function errMsg(e) {
  const m = String((e && (e.message || e.error_description || e.msg)) || e || '');
  const c = e && e.code;
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.';
  if (/Email not confirmed/i.test(m)) return "Ton adresse e-mail n'est pas encore confirmée. Clique sur le lien reçu par e-mail.";
  if (/already registered|already been registered/i.test(m)) return 'Un compte existe déjà avec cet e-mail. Connecte-toi.';
  if (/Password should be|weak password/i.test(m)) return 'Mot de passe trop faible : 8 caractères minimum.';
  if (/rate limit|over_email_send_rate_limit|too many|security purposes/i.test(m) || (e && e.status === 429)) return "Trop de demandes d'e-mail. Réessaie dans quelques minutes.";
  if (c === '23505' || /duplicate key/i.test(m)) return "Cet identifiant d'instance est déjà pris. Choisis-en un autre.";
  if (/already_member/.test(m)) return "Cette personne fait déjà partie de l'instance.";
  if (/invalid_email/.test(m)) return "Cette adresse e-mail n'est pas valide.";
  if (/wrong_account/.test(m)) return 'Cette invitation est destinée à une autre adresse e-mail.';
  if (/invalid_invitation/.test(m) || c === '22P02') return "Ce lien d'invitation est invalide ou a été révoqué.";
  if (/owner_locked/.test(m)) return 'Le propriétaire de l’instance ne peut pas être modifié ni retiré.';
  if (/forbidden|row-level security/i.test(m) || c === '42501') return "Tu n'as pas les droits pour cette action.";
  if (/check constraint|organizations_slug_check/i.test(m)) return "L'identifiant doit faire 3 à 40 caractères : minuscules, chiffres et tirets.";
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Serveur injoignable. Vérifie ta connexion internet.';
  return m || 'Une erreur est survenue.';
}
let toastT;
function toast(text, err = false) {
  st.toast = { text, err }; clearTimeout(toastT);
  toastT = setTimeout(() => { st.toast = null; renderToast(); }, err ? 4500 : 2600);
  renderToast();
}
function renderToast() {
  const h = $('#toast-host'); if (!h) return;
  h.innerHTML = st.toast ? `<div class="toast ${st.toast.err ? 'err' : ''}" role="status">${esc(st.toast.text)}</div>` : '';
}
async function fail(e) {
  console.error(e);
  toast(errMsg(e), true);
  if (st.screen === 'app' && st.org) { try { await reloadOrg(); } catch (x) { /* ignoré */ } }
}

/* ===================================================================
   Démarrage, authentification et choix de l'instance
   =================================================================== */
async function boot() {
  if (!api || !api.configured) { st.screen = 'setup'; render(); return; }
  const params = new URLSearchParams(location.search);
  const inv = params.get('invite');
  const orgParam = params.get('org');
  if (inv) LS.set('rivet.invite', inv);
  st.auth.inviteToken = inv || LS.get('rivet.invite', null);
  if (orgParam) st.auth.form.slug = slugify(orgParam);
  if (inv || orgParam) history.replaceState(null, '', location.pathname + location.hash);

  api.onAuth((event, session) => {
    if (event === 'PASSWORD_RECOVERY') { st.session = session; st.screen = 'auth'; setStep('reset'); }
    else if (event === 'SIGNED_OUT') { resetData(); st.session = null; st.user = null; st.screen = 'auth'; setStep('instance'); }
    else if (session && (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) { st.session = session; st.user = session.user; }
  });

  try { st.session = await api.session(); } catch (e) { st.session = null; }
  if (api.initialRecovery && st.session) { st.screen = 'auth'; setStep('reset'); return; }
  await afterAuth();
}

function setStep(step, extra = {}) {
  Object.assign(st.auth, { step, err: '', info: '', busy: false }, extra);
  render();
  const first = $('.auth-card input:not([type=hidden]):not([readonly])');
  if (first && !first.value) first.focus();
}

function resetData() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  Object.assign(st, { orgs: [], org: null, role: 'member', members: [], workspaces: [], boards: [], wsAccess: [], boardAccess: [], items: [], updates: {}, invitations: [], myInvites: [], page: null, boardId: null, drawer: null, pop: null, modal: null });
}

async function loadInviteInfo() {
  if (!st.auth.inviteToken) { st.auth.invite = null; return; }
  try { st.auth.invite = await api.invitationInfo(st.auth.inviteToken); } catch (e) { st.auth.invite = null; }
}
function clearInvite() { st.auth.inviteToken = null; st.auth.invite = null; LS.del('rivet.invite'); }

// Point central : décide où envoyer l'utilisateur une fois la session connue.
async function afterAuth(targetOrgId) {
  if (!st.session) {
    st.screen = 'auth';
    if (st.auth.inviteToken) { await loadInviteInfo(); setStep('invite'); }
    else setStep(st.auth.form.slug ? 'instance' : 'instance');
    if (st.auth.form.slug && !st.auth.inviteToken) await lookupInstance(st.auth.form.slug, true);
    return;
  }
  st.user = st.session.user;
  const meta = st.user.user_metadata || {};

  // 1. Invitation en attente (lien reçu par e-mail)
  if (st.auth.inviteToken) {
    await loadInviteInfo();
    const info = st.auth.invite;
    if (!info) { clearInvite(); toast("Ce lien d'invitation est invalide ou a été révoqué.", true); }
    else if (!sameEmail(info.email, st.user.email)) { st.screen = 'auth'; setStep('invite'); return; }
    else if (meta.password_set !== true) { st.screen = 'auth'; setStep('invite'); return; }
    else {
      try { targetOrgId = await api.acceptInvitation(st.auth.inviteToken); toast(`Bienvenue chez ${info.org_name}`); }
      catch (e) { toast(errMsg(e), true); }
      clearInvite();
    }
  }

  // 2. Compte qui vient d'être confirmé par e-mail : création de l'instance prévue à l'inscription
  try { st.orgs = await api.myOrgs(st.user.id); } catch (e) { st.orgs = []; toast(errMsg(e), true); }
  if (meta.pending_org && !st.orgs.length) {
    const p = meta.pending_org;
    try {
      targetOrgId = await api.createOrg(p.name, p.slug, p.trade);
      await seedOrg(targetOrgId, p.trade);
      await api.updateUser({ data: { pending_org: null } });
      st.orgs = await api.myOrgs(st.user.id);
    } catch (e) {
      st.screen = 'auth';
      st.auth.form = { ...st.auth.form, orgName: p.name, slug: p.slug, trade: p.trade };
      setStep('neworg', { err: errMsg(e) });
      return;
    }
  }

  if (!st.orgs.length) {
    try { st.myInvites = await api.myInvites(); } catch (e) { st.myInvites = []; }
    st.screen = 'auth'; setStep('noaccess'); return;
  }
  const wanted = targetOrgId || st.auth.wantOrgId || LS.get('rivet.lastOrg', null);
  let m = st.orgs.find((o) => o.org.id === wanted);
  if (!m && st.auth.wantOrgId) {
    try { st.myInvites = await api.myInvites(); } catch (e) { st.myInvites = []; }
    st.screen = 'auth';
    setStep('noaccess', { err: `Ce compte n'a pas accès à l'instance « ${st.auth.org ? st.auth.org.name : ''} ».` });
    return;
  }
  if (!m) m = st.orgs[0];
  st.auth.wantOrgId = null;
  await enterOrg(m.org.id);
}

async function lookupInstance(slug, silent = false) {
  const s = slugify(slug);
  st.auth.form.slug = s;
  if (!validSlug(s)) { if (!silent) setStep('instance', { err: "L'identifiant d'instance contient 3 à 40 caractères : lettres, chiffres et tirets." }); return; }
  st.auth.busy = true; render();
  try {
    const org = await api.orgLookup(s);
    if (!org) { setStep('instance', { err: `Aucune instance « ${s} ». Vérifie l'orthographe auprès de ton entreprise.` }); return; }
    st.auth.org = org; st.auth.wantOrgId = org.id;
    if (st.session && st.orgs.find((o) => o.org.id === org.id)) { await enterOrg(org.id); return; }
    setStep('login');
  } catch (e) { setStep('instance', { err: errMsg(e) }); }
}

async function enterOrg(orgId) {
  const m = st.orgs.find((o) => o.org.id === orgId);
  if (!m) return;
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  st.screen = 'app'; st.loadingOrg = true; st.org = m.org; st.role = m.role;
  st.drawer = null; st.pop = null; st.modal = null; st.search = ''; st.person = '';
  render();
  LS.set('rivet.lastOrg', orgId);
  const recent = LS.get('rivet.recent', []).filter((r) => r.slug !== m.org.slug);
  LS.set('rivet.recent', [{ slug: m.org.slug, name: m.org.name }, ...recent].slice(0, 4));
  try {
    await reloadOrg(false);
    try { st.myInvites = await api.myInvites(); } catch (e) { st.myInvites = []; }
    unsubscribe = api.subscribe(orgId, onRemote);
  } catch (e) { toast(errMsg(e), true); }
  st.loadingOrg = false;
  const mine = todayItems(todayIso(), 'me').length;
  if (!st.page || (st.page === 'board' && !boardById(st.boardId))) {
    st.page = mine || !visibleBoards().length ? 'today' : 'board';
    st.boardId = visibleBoards()[0] ? visibleBoards()[0].id : null;
  }
  render();
}

async function reloadOrg(doRender = true) {
  if (!st.org) return;
  const d = await api.loadOrg(st.org.id);
  Object.assign(st, d);
  const meRow = memberById(meId());
  if (meRow) st.role = meRow.role;
  if (isAdmin()) { try { st.invitations = await api.listInvitations(st.org.id); } catch (e) { st.invitations = []; } }
  if (st.boardId && !boardById(st.boardId)) st.boardId = visibleBoards()[0] ? visibleBoards()[0].id : null;
  if (doRender) render();
}

// Changements reçus en temps réel depuis les autres membres
function onRemote(table, type, row) {
  if (!row) return;
  if (table === 'items') {
    if (type === 'DELETE') st.items = st.items.filter((i) => i.id !== row.id && i.parent_id !== row.id);
    else upsert(st.items, row);
  } else if (table === 'boards') {
    if (type === 'DELETE') st.boards = st.boards.filter((b) => b.id !== row.id);
    else if (boardById(row.id)) upsert(st.boards, row);
  } else if (table === 'item_updates') {
    if (st.updates[row.item_id]) { upsert(st.updates[row.item_id], row); st.updates[row.item_id].sort((a, z) => z.created_at.localeCompare(a.created_at)); }
  }
  if (isEditing()) st.pendingRemote = true; else renderSoon();
}
function isEditing() {
  const a = document.activeElement;
  return !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type !== 'checkbox')) && !!a.closest('#root, #layer, #pop');
}

/* ---------- Création d'une instance avec un premier tableau ---------- */
async function seedOrg(orgId, trade) {
  const ws = await api.insertWorkspace({ org_id: orgId, name: 'Agence principale', color: 'blue', position: 0 });
  const tpl = savTemplate(trade);
  const b = await api.insertBoard({ workspace_id: ws.id, name: 'Dépannages', prefix: 'INT', noun: tpl.noun, column_defs: tpl.column_defs, group_defs: tpl.group_defs, position: 0 });
  const T = TRADES[trade] || TRADES.multiservice;
  const me = meId(); const t = todayIso();
  const ex = [
    { g: 'g-urg', name: T.prestations[0] + ' (exemple)', data: { client: 'Mme Lefèvre (exemple)', adresse: '18 rue Mercière, 69002 Lyon', tel: '04 72 00 00 01', presta: 'p0', tech: me, statut: 'plan', urgence: 'urg', date: t, heure: '09:00', duree: 1.5 } },
    { g: 'g-plan', name: T.prestations[1] + ' (exemple)', data: { client: 'M. Dupont (exemple)', adresse: '5 place Bellecour, 69002 Lyon', tel: '06 00 00 00 02', presta: 'p1', tech: me, statut: 'plan', urgence: 'norm', date: t, heure: '14:00', duree: 2, montant: 180 } },
    { g: 'g-plan', name: T.prestations[2] + ' (exemple)', data: { client: 'Syndic Les Terrasses (exemple)', adresse: '40 cours Lafayette, 69003 Lyon', tel: '04 78 00 00 03', presta: 'p2', tech: me, statut: 'todo', urgence: 'norm', date: addDays(t, 1), heure: '10:30', duree: 1 } },
  ];
  for (let i = 0; i < ex.length; i++) {
    const e = ex[i];
    const it = await api.insertItem({ board_id: b.id, group_id: e.g, name: e.name, data: e.data, position: i + 1 });
    if (i === 0) {
      await api.insertItem({ board_id: b.id, parent_id: it.id, name: 'Diagnostic sur place', data: { statut: 'todo', tech: me }, position: 1 });
      await api.insertItem({ board_id: b.id, parent_id: it.id, name: 'Photo avant / après', data: { statut: 'todo', tech: me }, position: 2 });
    }
  }
}

/* ===================================================================
   Rendu : écran de configuration et écrans de connexion
   =================================================================== */
function renderSetup() {
  return `<div class="auth"><main class="auth-main" style="grid-column:1/-1"><div class="auth-card wide">
    <div class="brand-row">${logo()}</div>
    <h2>Configuration requise</h2>
    <p class="muted">Rivet n'est pas encore relié à une base Supabase.</p>
    <ol class="setup-steps">
      <li>Crée un projet gratuit sur <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
      <li>Dans <b>SQL Editor</b>, exécute le fichier <code>schema.sql</code>.</li>
      <li>Ouvre <code>config.js</code> et colle l'URL du projet et la clé <b>anon</b> (Project Settings → API).</li>
      <li>Recharge cette page.</li>
    </ol>
    <p class="muted small">Le guide complet est dans <code>README.md</code>.</p>
  </div></main></div>`;
}

const logo = () => `<span class="logo"><span class="logo-mark">${svg('<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>', 18)}</span><span class="logo-txt">Rivet</span></span>`;
const af = (k) => esc(st.auth.form[k] || '');
const alertBox = () => (st.auth.err ? `<div class="alert err" role="alert">${esc(st.auth.err)}</div>` : '') + (st.auth.info ? `<div class="alert ok" role="status">${esc(st.auth.info)}</div>` : '');
const submitBtn = (label) => `<button class="btn primary block lg" ${st.auth.busy ? 'disabled' : ''}>${st.auth.busy ? '<span class="spin"></span>' : ''}${esc(label)}</button>`;
const tradeOptions = (sel) => Object.entries(TRADES).map(([k, t]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(t.label)}</option>`).join('');

function orgFields(prefix = '') {
  return `<label class="field"><span>Nom de l'entreprise</span><input id="${prefix}orgName" name="orgName" data-af="orgName" required maxlength="80" autocomplete="organization" placeholder="Plomberie Durand" value="${af('orgName')}"></label>
    <label class="field"><span>Identifiant de l'instance</span>
      <div class="slug-input"><span class="slug-pre">rivet /</span><input id="${prefix}slug" name="slug" data-af="slug" required maxlength="40" placeholder="plomberie-durand" value="${af('slug')}" autocapitalize="off" spellcheck="false"></div>
      <small>Tes équipes le saisiront pour se connecter. Il ne pourra plus être modifié.</small></label>
    <label class="field"><span>Métier principal</span><select id="${prefix}trade" name="trade" data-af="trade">${tradeOptions(st.auth.form.trade || 'plomberie')}</select>
      <small>Sert à préparer ton premier tableau de dépannages.</small></label>`;
}

function renderAuth() {
  const a = st.auth; const f = a.form;
  let body = '';
  switch (a.step) {
    case 'instance': {
      const recent = LS.get('rivet.recent', []);
      body = `<h2>Connexion</h2><p class="muted">Indique l'instance de travail de ton entreprise.</p>${alertBox()}
        <form data-form="instance" novalidate>
          <label class="field"><span>Instance de travail</span>
            <div class="slug-input"><span class="slug-pre">rivet /</span><input id="a-slug" name="slug" data-af="slug" required placeholder="plomberie-durand" value="${af('slug')}" autocapitalize="off" spellcheck="false" autocomplete="organization"></div></label>
          ${recent.length ? `<div class="recent"><span class="muted small">Récemment :</span>${recent.map((r) => `<button type="button" class="chip-btn" data-a="pickrecent" data-slug="${esc(r.slug)}">${esc(r.name)}</button>`).join('')}</div>` : ''}
          ${submitBtn('Continuer')}
        </form>
        <div class="auth-sep"><span>ou</span></div>
        <button class="btn block" data-a="authstep" data-step="signup">${ICON.building} Créer mon entreprise</button>
        <p class="muted small center">Tu as reçu une invitation ? Ouvre le lien de l'e-mail pour créer ton compte.</p>`;
      break;
    }
    case 'login':
      body = `<button class="back" data-a="authstep" data-step="instance">${ICON.left} Changer d'instance</button>
        <div class="org-chip"><span class="org-av">${esc(initials(a.org.name))}</span><span><b>${esc(a.org.name)}</b><small>rivet / ${esc(a.org.slug)}</small></span></div>
        <h2>Connexion</h2>${alertBox()}
        <form data-form="login" novalidate>
          <label class="field"><span>E-mail</span><input id="a-email" name="email" type="email" data-af="email" required autocomplete="email" value="${af('email')}"></label>
          <label class="field"><span class="row-between">Mot de passe <button type="button" class="link small" data-a="authstep" data-step="forgot">Mot de passe oublié ?</button></span><input id="a-pw" name="password" type="password" required autocomplete="current-password"></label>
          ${submitBtn('Se connecter')}
        </form>`;
      break;
    case 'forgot':
      body = `<button class="back" data-a="authstep" data-step="login">${ICON.left} Retour</button>
        <h2>Mot de passe oublié</h2><p class="muted">Indique ton e-mail : tu recevras un lien pour choisir un nouveau mot de passe.</p>${alertBox()}
        <form data-form="forgot" novalidate><label class="field"><span>E-mail</span><input id="a-email" name="email" type="email" data-af="email" required autocomplete="email" value="${af('email')}"></label>${submitBtn('Envoyer le lien')}</form>`;
      break;
    case 'signup':
      body = `<button class="back" data-a="authstep" data-step="instance">${ICON.left} J'ai déjà un compte</button>
        <h2>Crée ton entreprise</h2><p class="muted">Ton compte et ton instance de travail en une seule étape. Tu pourras ensuite inviter tes techniciens.</p>${alertBox()}
        <form data-form="signup" novalidate>
          <fieldset><legend>Ton entreprise</legend>${orgFields()}</fieldset>
          <fieldset><legend>Ton compte</legend>
            <label class="field"><span>Nom complet</span><input id="a-name" name="fullName" data-af="fullName" required maxlength="80" autocomplete="name" placeholder="Camille Durand" value="${af('fullName')}"></label>
            <label class="field"><span>E-mail</span><input id="a-email" name="email" type="email" data-af="email" required autocomplete="email" value="${af('email')}"></label>
            <label class="field"><span>Mot de passe</span><input id="a-pw" name="password" type="password" required minlength="8" autocomplete="new-password"><small>8 caractères minimum.</small></label>
          </fieldset>
          ${submitBtn('Créer mon espace')}
        </form>`;
      break;
    case 'neworg':
      body = `${st.orgs.length ? `<button class="back" data-a="backtoapp">${ICON.left} Retour</button>` : ''}
        <h2>Nouvelle instance</h2><p class="muted">Crée l'instance de travail d'une entreprise. Tu en seras le propriétaire.</p>${alertBox()}
        <form data-form="neworg" novalidate>${orgFields('n-')}${submitBtn("Créer l'instance")}</form>
        <button class="btn block ghost" data-a="logout">${ICON.logout} Se déconnecter</button>`;
      break;
    case 'check':
      body = `<div class="big-icon">${svg('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>', 30)}</div>
        <h2 class="center">Vérifie ta boîte mail</h2>
        <p class="muted center">Un lien de confirmation a été envoyé à <b>${esc(f.email || '')}</b>. Clique dessus pour activer ton compte${a.inviteToken ? ' et rejoindre ton équipe' : ' et ouvrir ton instance'}.</p>
        <p class="muted small center">Rien reçu ? Regarde dans les courriers indésirables.</p>
        <button class="btn block" data-a="authstep" data-step="instance">Retour à la connexion</button>`;
      break;
    case 'invite': body = renderInviteStep(); break;
    case 'reset':
      body = `<h2>Nouveau mot de passe</h2><p class="muted">Choisis le mot de passe de ton compte.</p>${alertBox()}
        <form data-form="reset" novalidate><label class="field"><span>Nouveau mot de passe</span><input id="a-pw" name="password" type="password" required minlength="8" autocomplete="new-password"><small>8 caractères minimum.</small></label>${submitBtn('Enregistrer')}</form>`;
      break;
    case 'noaccess':
      body = `<h2>${st.orgs.length ? 'Accès refusé' : 'Aucune instance disponible'}</h2>${alertBox()}
        <p class="muted">Connecté en tant que <b>${esc(st.user ? st.user.email : '')}</b>.</p>
        ${st.myInvites.length ? `<div class="inv-list"><p class="field-label">Invitations en attente</p>${st.myInvites.map((i) => `<div class="inv-row"><span class="org-av sm">${esc(initials(i.org_name))}</span><span class="grow"><b>${esc(i.org_name)}</b><small>${ROLE_LABEL[i.role] || ''}</small></span><button class="btn primary sm" data-a="acceptinv" data-token="${esc(i.token)}">Rejoindre</button></div>`).join('')}</div>`
          : `<p class="muted">Pour rejoindre une entreprise existante, demande à son administrateur de t'inviter avec cette adresse.</p>`}
        ${st.orgs.length ? `<button class="btn block" data-a="backtoapp">Ouvrir une de mes instances</button>` : ''}
        <button class="btn block" data-a="authstep" data-step="neworg">${ICON.building} Créer une nouvelle instance</button>
        <button class="btn block ghost" data-a="logout">${ICON.logout} Se déconnecter</button>`;
      break;
    default: body = '';
  }
  return `<div class="auth">
    <aside class="auth-side">
      <div class="brand-row light">${logo()}</div>
      <div class="auth-pitch">
        <h1>Vos interventions, du bureau jusque chez le client.</h1>
        <ul class="pitch-list">
          <li>${ICON.today}<span>Planifiez les dépannages et assignez vos techniciens en quelques clics.</span></li>
          <li>${ICON.pin}<span>Chaque technicien retrouve sa journée, l'adresse, l'itinéraire et le téléphone du client.</span></li>
          <li>${ICON.check}<span>Suivi en temps réel : en route, sur place, terminé.</span></li>
          <li>${ICON.users}<span>Un seul compte pour travailler avec plusieurs entreprises.</span></li>
        </ul>
      </div>
      <div class="trade-chips">${Object.values(TRADES).slice(0, 6).map((t) => `<span>${esc(t.label)}</span>`).join('')}</div>
    </aside>
    <main class="auth-main"><div class="auth-card">${body}</div><p class="auth-foot">Rivet · gestion d'interventions pour artisans et techniciens</p></main>
  </div>`;
}

function renderInviteStep() {
  const inv = st.auth.invite;
  if (!inv) {
    return `<h2>Invitation introuvable</h2><p class="muted">Ce lien est invalide ou l'invitation a été révoquée. Demande à ton administrateur de t'en envoyer une nouvelle.</p>
      <button class="btn block" data-a="dropinvite">Aller à la connexion</button>`;
  }
  const head = `<div class="org-chip"><span class="org-av">${esc(initials(inv.org_name))}</span><span><b>${esc(inv.org_name)}</b><small>t'invite comme ${esc((ROLE_LABEL[inv.role] || '').toLowerCase())}</small></span></div>`;
  if (inv.accepted && !st.session) {
    return `${head}<h2>Invitation déjà acceptée</h2><p class="muted">Connecte-toi avec <b>${esc(inv.email)}</b> pour accéder à ${esc(inv.org_name)}.</p>
      <button class="btn primary block lg" data-a="invitelogin">Se connecter</button>`;
  }
  if (st.session) {
    if (!sameEmail(st.user.email, inv.email)) {
      return `${head}<h2>Mauvais compte</h2>${alertBox()}<p class="muted">Tu es connecté avec <b>${esc(st.user.email)}</b>, mais l'invitation est destinée à <b>${esc(inv.email)}</b>.</p>
        <button class="btn primary block" data-a="logout">Se déconnecter et utiliser ${esc(inv.email)}</button>
        <button class="btn block ghost" data-a="dropinvite">Ignorer l'invitation</button>`;
    }
    return `${head}<h2>Finalise ton compte</h2><p class="muted">Dernière étape avant de rejoindre ${esc(inv.org_name)}.</p>${alertBox()}
      <form data-form="finalize" novalidate>
        <label class="field"><span>E-mail</span><input value="${esc(inv.email)}" readonly class="readonly"></label>
        <label class="field"><span>Nom complet</span><input id="a-name" name="fullName" data-af="fullName" required maxlength="80" autocomplete="name" value="${af('fullName')}"></label>
        <label class="field"><span>Choisis un mot de passe</span><input id="a-pw" name="password" type="password" required minlength="8" autocomplete="new-password"><small>Il te servira pour toutes tes instances.</small></label>
        ${submitBtn(`Rejoindre ${inv.org_name}`)}
      </form>`;
  }
  const tab = st.auth.form.inviteTab || 'create';
  return `${head}<h2>Rejoins ton équipe</h2>${alertBox()}
    <div class="seg" role="tablist"><button class="${tab === 'create' ? 'on' : ''}" data-a="invtab" data-tab="create">Créer mon compte</button><button class="${tab === 'login' ? 'on' : ''}" data-a="invtab" data-tab="login">J'ai déjà un compte</button></div>
    ${tab === 'create' ? `<form data-form="invitesignup" novalidate>
      <label class="field"><span>E-mail</span><input value="${esc(inv.email)}" readonly class="readonly"></label>
      <label class="field"><span>Nom complet</span><input id="a-name" name="fullName" data-af="fullName" required maxlength="80" autocomplete="name" value="${af('fullName')}"></label>
      <label class="field"><span>Mot de passe</span><input id="a-pw" name="password" type="password" required minlength="8" autocomplete="new-password"><small>8 caractères minimum.</small></label>
      ${submitBtn('Créer mon compte')}
    </form>` : `<form data-form="invitelogin" novalidate>
      <label class="field"><span>E-mail</span><input value="${esc(inv.email)}" readonly class="readonly"></label>
      <label class="field"><span>Mot de passe</span><input id="a-pw" name="password" type="password" required autocomplete="current-password"></label>
      ${submitBtn(`Rejoindre ${inv.org_name}`)}
    </form>`}`;
}

/* ===================================================================
   Rendu : application
   =================================================================== */
const avatar = (m, cls = '') => (m ? `<span class="av c-${esc(m.color || 'blue')} ${cls}" title="${esc(memberName(m))}">${esc(initials(memberName(m)))}</span>` : `<span class="av c-grey ${cls}">?</span>`);
function armBtn(key, label, action, attrs = '', cls = '') {
  const armed = st.armed === key;
  return `<button type="button" class="btn danger sm ${armed ? 'armed' : ''} ${cls}" data-a="${armed ? action : 'arm'}" data-key="${esc(key)}" ${attrs}>${armed ? 'Confirmer' : esc(label)}</button>`;
}
function chip(opt, attrs = '', disabled = false, extra = '') {
  return `<button type="button" class="chip ${opt ? 'c-' + opt.color : 'c-empty'} ${extra}" ${attrs} ${disabled ? 'disabled' : ''}>${opt ? esc(opt.label) : (disabled ? '' : '—')}</button>`;
}

function cell(b, ent, col, ctx, edit) {
  const v = ent.data[col.id];
  const da = `data-item="${ent.id}" data-col="${col.id}"`;
  const fid = `f-${ctx}-${ent.id}-${col.id}`;
  const lbl = `aria-label="${esc(col.name)}"`;
  switch (col.type) {
    case 'text': return `<input id="${fid}" class="in" ${da} data-ch="val" value="${esc(v)}" ${edit ? '' : 'readonly'} ${lbl}>`;
    case 'number': return `<input id="${fid}" type="number" step="any" inputmode="decimal" class="in num-in" ${da} data-ch="val" value="${v ?? ''}" ${edit ? '' : 'readonly'} ${lbl}>`;
    case 'date': return `<input id="${fid}" type="date" class="in" ${da} data-ch="val" value="${esc(v || '')}" ${edit ? '' : 'disabled'} ${lbl}>`;
    case 'time': return `<input id="${fid}" type="time" class="in" ${da} data-ch="val" value="${esc(v || '')}" ${edit ? '' : 'disabled'} ${lbl}>`;
    case 'check': return `<label class="chk"><input id="${fid}" type="checkbox" ${da} data-ch="val" ${v ? 'checked' : ''} ${edit ? '' : 'disabled'} ${lbl}></label>`;
    case 'address': return `<div class="in-action"><input id="${fid}" class="in" ${da} data-ch="val" value="${esc(v)}" ${edit ? '' : 'readonly'} ${lbl} autocomplete="street-address">${v ? `<a class="cell-link" href="${esc(mapsUrl(v))}" target="_blank" rel="noopener" title="Itinéraire" aria-label="Itinéraire vers ${esc(v)}">${ICON.pin}</a>` : ''}</div>`;
    case 'phone': return `<div class="in-action"><input id="${fid}" type="tel" class="in" ${da} data-ch="val" value="${esc(v)}" ${edit ? '' : 'readonly'} ${lbl}>${v ? `<a class="cell-link" href="${esc(telUrl(v))}" title="Appeler" aria-label="Appeler le ${esc(v)}">${ICON.phone}</a>` : ''}</div>`;
    case 'status': return chip((col.options || []).find((o) => o.id === v), `data-a="pop-status" ${da} data-ctx="${ctx}" ${lbl}`, !edit);
    case 'people': {
      const m = memberById(v);
      return `<button type="button" class="person" data-a="pop-people" ${da} data-ctx="${ctx}" ${edit ? '' : 'disabled'} ${lbl}>${m ? avatar(m, 'sm') + `<span class="nm">${esc(memberName(m))}</span>` : `<span class="muted">${edit ? 'Assigner' : '—'}</span>`}</button>`;
    }
    default: return '';
  }
}

function summary(c, items) {
  if (!items.length) return '';
  if (c.type === 'status') {
    const segs = (c.options || []).map((o) => {
      const n = items.filter((i) => i.data[c.id] === o.id).length;
      return n ? `<span class="c-${o.color}" style="flex:${n}" title="${esc(o.label)} : ${n}"></span>` : '';
    }).join('');
    return `<div class="sumbar">${segs}</div>`;
  }
  if (c.type === 'number') {
    const vals = items.map((i) => i.data[c.id]).filter((x) => x !== null && x !== undefined && x !== '');
    return vals.length ? `<span class="sum">${fmtNum(vals.reduce((s, x) => s + Number(x), 0))}</span>` : '';
  }
  if (c.type === 'check') return `<span class="sum center">${items.filter((i) => i.data[c.id]).length} / ${items.length}</span>`;
  return '';
}

function renderApp() {
  if (st.loadingOrg) return `<div class="boot"><div class="spinner"></div><p>Ouverture de ${esc(st.org ? st.org.name : '')}…</p></div>`;
  return `<div class="shell ${st.side ? 'side-open' : ''}">
    ${renderTopbar()}
    ${st.side ? '<div class="side-scrim" data-a="closeside"></div>' : ''}
    ${renderSidebar()}
    <main id="main" class="main">${renderPage()}</main>
  </div>`;
}

function renderTopbar() {
  const me = memberById(meId());
  return `<header class="topbar">
    <button class="icon-btn burger" data-a="toggleside" aria-label="Ouvrir le menu">${ICON.menu}</button>
    ${logo()}
    <span class="top-sep" aria-hidden="true"></span>
    <button class="org-btn" data-a="pop-org" aria-label="Changer d'instance"><span class="org-av sm">${esc(initials(st.org.name))}</span><span class="org-name">${esc(st.org.name)}</span>${ICON.chev}</button>
    <span class="grow"></span>
    ${st.myInvites.length ? `<button class="inv-badge" data-a="pop-org">${ICON.mail}<span>${st.myInvites.length}</span></button>` : ''}
    <button class="user-btn" data-a="pop-user" aria-label="Mon compte">${avatar(me, 'sm')}<span class="user-name">${esc(firstName(memberName(me)))}</span>${ICON.chev}</button>
  </header>`;
}

function renderSidebar() {
  const mine = todayItems(todayIso(), 'me').length;
  let wsHtml = '';
  for (const ws of st.workspaces) {
    const bs = st.boards.filter((b) => b.workspace_id === ws.id && boardLevel(b) !== 'none');
    const wl = wsLevel(ws.id);
    if (!bs.length && wl === 'none') continue;
    wsHtml += `<div class="ws">
      <div class="ws-row"><span class="ws-dot c-${esc(ws.color)}"></span><span class="ws-name">${esc(ws.name)}</span>${isAdmin() ? `<button class="icon-btn xs" data-a="pop-ws" data-ws="${ws.id}" aria-label="Options de l'espace">${ICON.dots}</button>` : ''}</div>
      ${bs.map((b) => `<button class="nav-item sub ${st.page === 'board' && b.id === st.boardId ? 'on' : ''}" data-a="openboard" data-board="${b.id}">${ICON.board}<span class="lbl">${esc(b.name)}</span>${boardLevel(b) === 'view' ? '<span class="tag">Lecture</span>' : ''}</button>`).join('')}
      ${wl === 'edit' ? `<button class="nav-add" data-a="newboard" data-ws="${ws.id}">${ICON.plus} Nouveau tableau</button>` : ''}
    </div>`;
  }
  return `<aside class="sidebar" aria-label="Navigation">
    <nav class="side-nav">
      <button class="nav-item ${st.page === 'today' ? 'on' : ''}" data-a="go" data-page="today">${ICON.today}<span class="lbl">Ma journée</span>${mine ? `<span class="count">${mine}</span>` : ''}</button>
      <div class="side-title"><span>Espaces de travail</span>${isAdmin() ? `<button class="icon-btn xs" data-a="newws" aria-label="Nouvel espace" title="Nouvel espace">${ICON.plus}</button>` : ''}</div>
      ${wsHtml || `<p class="side-empty">Aucun tableau partagé avec toi pour l'instant.</p>`}
    </nav>
    ${isAdmin() ? `<div class="side-bottom"><button class="nav-item ${st.page === 'settings' ? 'on' : ''}" data-a="go" data-page="settings">${ICON.settings}<span class="lbl">Paramètres</span></button></div>` : ''}
  </aside>`;
}

function renderPage() {
  if (st.page === 'settings' && isAdmin()) return renderSettings();
  if (st.page === 'board') { const b = curBoard(); if (b) return renderBoard(b); }
  return renderToday();
}

/* ---------- Ma journée : la vue du technicien en déplacement ---------- */
function rolesOf(b) {
  const st1 = statusCol(b);
  return {
    date: firstCol(b, 'date'), time: firstCol(b, 'time'), people: colsOf(b, 'people'), status: st1,
    address: firstCol(b, 'address'), phone: firstCol(b, 'phone'), client: firstCol(b, 'text'),
    tags: b.column_defs.filter((c) => c.type === 'status' && c !== st1),
  };
}
function todayItems(day, scope) {
  const rows = [];
  for (const b of visibleBoards()) {
    const r = rolesOf(b); if (!r.date) continue;
    for (const it of topItems(b)) {
      if (it.data[r.date.id] !== day) continue;
      const who = r.people.map((c) => it.data[c.id]).filter(Boolean);
      if (scope === 'me' && !who.includes(meId())) continue;
      rows.push({ b, it, r, who });
    }
  }
  return rows.sort((x, y) => String(x.r.time ? x.it.data[x.r.time.id] || '99' : '99').localeCompare(String(y.r.time ? y.it.data[y.r.time.id] || '99' : '99')) || (x.it.num - y.it.num));
}
function renderToday() {
  const day = st.day || todayIso();
  const scope = st.dayScope;
  const rows = todayItems(day, scope);
  const done = rows.filter((x) => isDone(x.b, x.it)).length;
  const hours = rows.reduce((s, x) => { const c = x.b.column_defs.find((k) => k.type === 'number' && /dur/i.test(k.name)); return s + (c ? Number(x.it.data[c.id] || 0) : 0); }, 0);
  const editable = visibleBoards().filter(canEdit);
  const card = ({ b, it, r }) => {
    const edit = canEdit(b);
    const time = r.time && it.data[r.time.id];
    const addr = r.address && it.data[r.address.id];
    const tel = r.phone && it.data[r.phone.id];
    const client = r.client && it.data[r.client.id];
    const stOpt = r.status && (r.status.options || []).find((o) => o.id === it.data[r.status.id]);
    const tags = r.tags.map((c) => (c.options || []).find((o) => o.id === it.data[c.id])).filter(Boolean);
    const tech = scope === 'team' ? r.people.map((c) => memberById(it.data[c.id])).filter(Boolean)[0] : null;
    return `<article class="job ${isDone(b, it) ? 'is-done' : ''}">
      <div class="job-time">${time ? esc(time) : '<span class="muted">—</span>'}</div>
      <div class="job-body">
        <div class="job-top"><span class="code">${code(b, it)}</span>${tags.map((o) => `<span class="pill c-${o.color}">${esc(o.label)}</span>`).join('')}${stOpt ? `<span class="pill c-${stOpt.color} strong">${esc(stOpt.label)}</span>` : ''}</div>
        <h3 class="job-title">${esc(it.name)}</h3>
        ${client ? `<p class="job-client">${esc(client)}</p>` : ''}
        ${addr ? `<p class="job-addr">${ICON.pin}<span>${esc(addr)}</span></p>` : ''}
        ${tech ? `<p class="job-tech">${avatar(tech, 'sm')}<span>${esc(memberName(tech))}</span></p>` : ''}
        <div class="job-actions">
          ${addr ? `<a class="btn sm" href="${esc(mapsUrl(addr))}" target="_blank" rel="noopener">${ICON.pin} Itinéraire</a>` : ''}
          ${tel ? `<a class="btn sm" href="${esc(telUrl(tel))}">${ICON.phone} Appeler</a>` : ''}
          <button class="btn sm ghost" data-a="opendrawer" data-item="${it.id}">Ouvrir la fiche</button>
        </div>
        ${r.status && edit ? `<div class="steps" role="group" aria-label="Avancement">${(r.status.options || []).filter((o) => !['cancel'].includes(o.id)).map((o) => `<button class="step ${it.data[r.status.id] === o.id ? 'on c-' + o.color : ''}" data-a="quickstatus" data-item="${it.id}" data-col="${r.status.id}" data-opt="${o.id}">${esc(o.label)}</button>`).join('')}</div>` : ''}
      </div>
    </article>`;
  };
  let list;
  if (!rows.length) {
    list = `<div class="empty"><div class="big-icon">${svg('<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>', 28)}</div>
      <b>${scope === 'me' ? 'Aucune intervention prévue pour toi ce jour-là.' : "Aucune intervention prévue pour l'équipe ce jour-là."}</b>
      <p class="muted">${editable.length ? 'Les interventions qui portent ton nom et cette date apparaissent ici.' : 'Ton responsable planifie tes interventions : elles apparaîtront ici.'}</p>
      ${editable.length ? `<button class="btn primary" data-a="planhere">${ICON.plus} Planifier une intervention</button>` : ''}</div>`;
  } else if (scope === 'team') {
    const by = new Map();
    for (const x of rows) { const k = x.who[0] || ''; if (!by.has(k)) by.set(k, []); by.get(k).push(x); }
    list = [...by.entries()].map(([k, xs]) => { const m = memberById(k); return `<section class="team-block"><h3 class="team-head">${m ? avatar(m, 'sm') : ''}<span>${esc(m ? memberName(m) : 'Non assignées')}</span><span class="muted">${xs.length}</span></h3><div class="jobs">${xs.map(card).join('')}</div></section>`; }).join('');
  } else list = `<div class="jobs">${rows.map(card).join('')}</div>`;

  return `<div class="page">
    <div class="page-head">
      <div><p class="eyebrow">${esc(st.org.name)}</p><h1>${scope === 'me' ? 'Ma journée' : "Journée de l'équipe"}</h1></div>
      <div class="seg" role="tablist"><button class="${scope === 'me' ? 'on' : ''}" data-a="dayscope" data-scope="me">Mes interventions</button><button class="${scope === 'team' ? 'on' : ''}" data-a="dayscope" data-scope="team">Toute l'équipe</button></div>
    </div>
    <div class="day-nav">
      <button class="icon-btn bordered" data-a="dayshift" data-n="-1" aria-label="Jour précédent">${ICON.left}</button>
      <span class="day-label">${esc(capFirst(fmtDay(day)))}</span>
      <button class="icon-btn bordered" data-a="dayshift" data-n="1" aria-label="Jour suivant">${ICON.right}</button>
      ${day !== todayIso() ? `<button class="btn sm ghost" data-a="dayshift" data-n="0">Aujourd'hui</button>` : ''}
      <span class="grow"></span>
      <span class="day-stats"><b>${rows.length}</b> intervention${rows.length > 1 ? 's' : ''} · <b>${done}</b> terminée${done > 1 ? 's' : ''}${hours ? ` · <b>${fmtNum(hours)} h</b> prévues` : ''}</span>
    </div>
    ${list}
  </div>`;
}

/* ---------- Tableau ---------- */
function renderBoard(b) {
  const edit = canEdit(b);
  const ws = wsById(b.workspace_id);
  const pref = viewPref(b);
  const view = pref.view || 'table';
  const items = topItems(b);
  const open = items.filter((i) => !isDone(b, i)).length;
  const late = items.filter((i) => isLate(b, i)).length;
  let viewTools = '';
  if (view === 'kanban') {
    const sc = colsOf(b, 'status');
    if (sc.length > 1) viewTools = `<label class="tool-label">Colonnes par <select id="kcol" class="sel" data-ch="kcol">${sc.map((c) => `<option value="${c.id}" ${c.id === (pref.kanbanCol || statusCol(b).id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`;
  }
  if (view === 'calendar') {
    const dc = colsOf(b, 'date');
    if (dc.length > 1) viewTools = `<label class="tool-label">Date <select id="ccol" class="sel" data-ch="ccol">${dc.map((c) => `<option value="${c.id}" ${c.id === (pref.calCol || dc[0].id) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>`;
  }
  const body = view === 'kanban' ? renderKanban(b, edit) : view === 'calendar' ? renderCalendar(b, edit) : renderTable(b, edit);
  return `<div class="page wide">
    <div class="page-head">
      <div class="grow-min"><p class="eyebrow">${esc(ws ? ws.name : '')}</p>
        <div class="title-row"><input id="board-title" class="title-in" data-ch="boardname" value="${esc(b.name)}" ${edit ? '' : 'readonly'} aria-label="Nom du tableau">${edit ? '' : '<span class="tag">Lecture seule</span>'}${edit ? `<button class="icon-btn" data-a="pop-board" aria-label="Options du tableau">${ICON.dots}</button>` : ''}</div>
      </div>
      <div class="kpis"><span><b>${items.length}</b> au total</span><span><b>${open}</b> en cours</span><span class="${late ? 'late' : ''}"><b>${late}</b> en retard</span></div>
    </div>
    <div class="board-bar">
      <div class="tabs" role="tablist">${[['table', 'Tableau'], ['kanban', 'Kanban'], ['calendar', 'Calendrier']].map(([k, l]) => `<button class="tab ${view === k ? 'on' : ''}" role="tab" aria-selected="${view === k}" data-a="view" data-view="${k}">${l}</button>`).join('')}</div>
      <div class="toolbar">
        <input id="search" class="search" type="search" data-in="search" placeholder="Rechercher un client, une adresse…" value="${esc(st.search)}" aria-label="Rechercher">
        <select id="pfilter" class="sel" data-ch="pfilter" aria-label="Filtrer par personne"><option value="">Toute l'équipe</option><option value="${meId()}" ${st.person === meId() ? 'selected' : ''}>Mes interventions</option>${st.members.filter((m) => m.user_id !== meId()).map((m) => `<option value="${m.user_id}" ${st.person === m.user_id ? 'selected' : ''}>${esc(memberName(m))}</option>`).join('')}</select>
        ${viewTools}
        ${edit ? `<button class="btn primary" data-a="newitem">${ICON.plus} ${esc(nounOf(b).neu)}</button>` : ''}
      </div>
    </div>
    ${body}
  </div>`;
}

function renderTable(b, edit) {
  const cols = b.column_defs;
  const noun = nounOf(b);
  const W = 340 + cols.reduce((s, c) => s + (COL_W[c.type] || 150), 0) + (edit ? 52 : 0);
  const colgroup = `<colgroup><col style="width:340px">${cols.map((c) => `<col style="width:${COL_W[c.type] || 150}px">`).join('')}${edit ? '<col style="width:52px">' : ''}</colgroup>`;
  const head = `<thead><tr><th class="c-name">${esc(noun.cap)}</th>${cols.map((c) => `<th><button class="th-btn" data-a="pop-col" data-col="${c.id}" ${edit ? '' : 'disabled'} title="${esc(c.name)}">${esc(c.name)}</button></th>`).join('')}${edit ? `<th><button class="th-add" data-a="pop-addcol" aria-label="Ajouter une colonne" title="Ajouter une colonne">${ICON.plus}</button></th>` : ''}</tr></thead>`;
  const list = filtered(b);
  const coll = collapsed();
  let html = '';
  if (!b.group_defs.length) html += `<div class="empty"><b>Ce tableau n'a pas encore de groupe.</b>${edit ? '<p class="muted">Ajoute un groupe pour commencer.</p>' : ''}</div>`;
  for (const g of b.group_defs) {
    const items = list.filter((i) => i.group_id === g.id);
    const isColl = coll.has(b.id + ':' + g.id);
    html += `<section class="group c-${esc(g.color)}">
      <div class="g-head">
        <button class="caret ${isColl ? '' : 'open'}" data-a="togglegroup" data-group="${g.id}" aria-label="${isColl ? 'Déplier' : 'Replier'}" aria-expanded="${!isColl}">${ICON.caret}</button>
        <input id="gname-${g.id}" class="g-name" data-ch="groupname" data-group="${g.id}" value="${esc(g.name)}" ${edit ? '' : 'readonly'} aria-label="Nom du groupe" size="${Math.max(6, g.name.length + 1)}">
        <span class="g-count">${items.length}</span>
        ${edit ? `<button class="icon-btn xs" data-a="pop-group" data-group="${g.id}" aria-label="Options du groupe">${ICON.dots}</button>` : ''}
      </div>`;
    if (!isColl) {
      let rows = '';
      for (const it of items) {
        rows += row(b, it, null, edit);
        if (st.expanded.has(it.id)) {
          for (const s of kids(it)) rows += row(b, it, s, edit);
          if (edit) rows += `<tr class="sub add-row"><td class="c-name"><div class="sub-wrap"><input id="addsub-${it.id}" class="in add-in" data-ch="addsub" data-enter="1" data-item="${it.id}" placeholder="+ Ajouter une sous-tâche" aria-label="Ajouter une sous-tâche"></div></td><td colspan="${cols.length + 1}"></td></tr>`;
        }
      }
      if (edit) rows += `<tr class="add-row"><td class="c-name"><input id="add-${g.id}" class="in add-in" data-ch="additem" data-enter="1" data-group="${g.id}" placeholder="+ Ajouter ${esc(noun.add)}" aria-label="Ajouter ${esc(noun.add)}"></td><td colspan="${cols.length + 1}"></td></tr>`;
      else if (!items.length) rows += `<tr><td class="c-name"><span class="muted pad">Rien dans ce groupe</span></td><td colspan="${cols.length}"></td></tr>`;
      html += `<div class="tbl-wrap" data-scroll="${g.id}"><table class="tbl" style="width:${W}px">${colgroup}${head}<tbody>${rows}</tbody><tfoot><tr><td class="c-name"></td>${cols.map((c) => `<td>${summary(c, items)}</td>`).join('')}${edit ? '<td></td>' : ''}</tr></tfoot></table></div>`;
    }
    html += '</section>';
  }
  if (edit) html += `<button class="btn ghost" data-a="addgroup">${ICON.plus} Ajouter un groupe</button>`;
  return html;
}

function row(b, it, sub, edit) {
  const ent = sub || it;
  let name;
  if (sub) {
    name = `<td class="c-name"><div class="sub-wrap"><input id="n-${sub.id}" class="in" data-ch="name" data-item="${sub.id}" value="${esc(sub.name)}" ${edit ? '' : 'readonly'} aria-label="Sous-tâche">${edit ? `<button class="icon-btn xs" data-a="delsub" data-item="${sub.id}" aria-label="Supprimer la sous-tâche">${ICON.close}</button>` : ''}</div></td>`;
  } else {
    const opened = st.expanded.has(it.id);
    const ks = kids(it);
    const done = ks.filter((s) => isDone(b, s)).length;
    name = `<td class="c-name"><div class="name-cell">
      ${ks.length || edit ? `<button class="caret ${opened ? 'open' : ''}" data-a="togglesubs" data-item="${it.id}" aria-label="Sous-tâches" aria-expanded="${opened}">${ICON.caret}</button>` : '<span class="caret-space"></span>'}
      <span class="code">${code(b, it)}</span>
      <input id="n-${it.id}" class="in name-in" data-ch="name" data-item="${it.id}" value="${esc(it.name)}" ${edit ? '' : 'readonly'} aria-label="Intitulé">
      ${ks.length ? `<span class="subcount" title="Sous-tâches terminées">${done}/${ks.length}</span>` : ''}
      <button class="open-btn" data-a="opendrawer" data-item="${it.id}">Ouvrir</button>
    </div></td>`;
  }
  return `<tr class="${sub ? 'sub' : ''}">${name}${b.column_defs.map((c) => `<td class="t-${c.type}">${cell(b, ent, c, 't', edit)}</td>`).join('')}${edit ? '<td></td>' : ''}</tr>`;
}

function renderKanban(b, edit) {
  const sc = colsOf(b, 'status');
  if (!sc.length) return `<div class="empty"><b>Le kanban s'organise par statut.</b><p class="muted">Ajoute une colonne Statut depuis la vue Tableau.</p></div>`;
  const pref = viewPref(b);
  const col = sc.find((c) => c.id === pref.kanbanCol) || statusCol(b);
  const items = filtered(b);
  const lanes = [...(col.options || []), { id: '', label: 'Sans statut', color: null }];
  const r = rolesOf(b);
  return `<div class="kanban" data-scroll="kanban">${lanes.map((l) => {
    const its = items.filter((i) => (i.data[col.id] || '') === l.id);
    if (!l.id && !its.length) return '';
    return `<div class="lane" data-drop="lane" data-col="${col.id}" data-opt="${l.id}">
      <div class="lane-head"><span class="dot c-${l.color || 'grey'}"></span><span class="lane-name">${esc(l.label)}</span><span class="lane-count">${its.length}</span></div>
      <div class="lane-body">${its.map((it) => {
        const m = r.people.map((c) => memberById(it.data[c.id])).filter(Boolean)[0];
        const d = r.date && it.data[r.date.id];
        const t = r.time && it.data[r.time.id];
        const tag = r.tags.filter((c) => c.id !== col.id).map((c) => (c.options || []).find((o) => o.id === it.data[c.id])).filter(Boolean)[0];
        const ks = kids(it);
        return `<article class="card" tabindex="0" draggable="${edit}" data-drag="${it.id}" data-a="opendrawer" data-item="${it.id}">
          <div class="card-top"><span class="code">${code(b, it)}</span>${tag ? `<span class="pill c-${tag.color}">${esc(tag.label)}</span>` : ''}</div>
          <div class="card-title">${esc(it.name)}</div>
          ${r.client && it.data[r.client.id] ? `<div class="card-sub">${esc(it.data[r.client.id])}</div>` : ''}
          ${r.address && it.data[r.address.id] ? `<div class="card-sub with-icon">${ICON.pin}<span>${esc(it.data[r.address.id])}</span></div>` : ''}
          <div class="card-foot">${m ? avatar(m, 'sm') : ''}${ks.length ? `<span class="subcount">${ks.filter((s) => isDone(b, s)).length}/${ks.length}</span>` : ''}${d ? `<span class="card-date ${isLate(b, it) ? 'late' : ''}">${fmtShort(d)}${t ? ' · ' + esc(t) : ''}</span>` : ''}</div>
        </article>`;
      }).join('')}
      ${edit ? `<button class="lane-add" data-a="laneadd" data-col="${col.id}" data-opt="${l.id}">${ICON.plus} ${esc(nounOf(b).add)}</button>` : ''}
      </div></div>`;
  }).join('')}</div>`;
}

function renderCalendar(b, edit) {
  const dc = colsOf(b, 'date');
  if (!dc.length) return `<div class="empty"><b>Le calendrier s'appuie sur une date.</b><p class="muted">Ajoute une colonne Date depuis la vue Tableau.</p></div>`;
  const pref = viewPref(b);
  const col = dc.find((c) => c.id === pref.calCol) || dc[0];
  const sc = statusCol(b); const tc = firstCol(b, 'time');
  const base = st.calMonth || (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); })();
  const y = base.getFullYear(), mo = base.getMonth();
  const first = new Date(y, mo, 1);
  const start = new Date(y, mo, 1 - ((first.getDay() + 6) % 7));
  const byDay = {}; const undated = [];
  for (const i of filtered(b)) { const v = i.data[col.id]; if (v) (byDay[v] = byDay[v] || []).push(i); else undated.push(i); }
  const evt = (i) => {
    const o = sc && (sc.options || []).find((x) => x.id === i.data[sc.id]);
    const t = tc && i.data[tc.id];
    return `<button class="evt c-${o ? o.color : 'grey'}" draggable="${edit}" data-drag="${i.id}" data-a="opendrawer" data-item="${i.id}" title="${esc(i.name)}${o ? ' · ' + esc(o.label) : ''}">${t ? `<span class="evt-t">${esc(t)}</span>` : ''}${esc(i.name)}</button>`;
  };
  const tIso = todayIso();
  let cells = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => `<div class="wd">${d}</div>`).join('');
  for (let k = 0; k < 42; k++) {
    const d = new Date(start); d.setDate(start.getDate() + k);
    const key = isoOf(d);
    const list = (byDay[key] || []).sort((p, q) => String(tc ? p.data[tc.id] || '' : '').localeCompare(String(tc ? q.data[tc.id] || '' : '')));
    cells += `<div class="day ${d.getMonth() !== mo ? 'out' : ''} ${key === tIso ? 'today' : ''}" data-drop="day" data-date="${key}" data-col="${col.id}">
      <div class="day-head"><span class="dnum">${d.getDate()}</span>${edit ? `<button class="day-add" data-a="dayadd" data-date="${key}" data-col="${col.id}" aria-label="Ajouter le ${fmtShort(key)}">${ICON.plus}</button>` : ''}</div>
      ${list.map(evt).join('')}</div>`;
  }
  return `<div class="cal-nav"><button class="icon-btn bordered" data-a="calshift" data-n="-1" aria-label="Mois précédent">${ICON.left}</button><h3 class="cal-title">${esc(capFirst(first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })))}</h3><button class="icon-btn bordered" data-a="calshift" data-n="1" aria-label="Mois suivant">${ICON.right}</button><button class="btn sm ghost" data-a="calshift" data-n="0">Aujourd'hui</button></div>
  <div class="cal-layout">
    <div class="cal-scroll" data-scroll="cal"><div class="cal">${cells}</div></div>
    <aside class="undated" data-drop="undated" data-col="${col.id}"><h4>Sans date <span class="muted">${undated.length}</span></h4>${undated.length ? undated.map(evt).join('') : `<p class="muted small">Tout est planifié.${edit ? ' Glisse un élément ici pour retirer sa date.' : ''}</p>`}</aside>
  </div>`;
}

/* ---------- Fiche (tiroir latéral) ---------- */
function renderDrawer() {
  if (!st.drawer) return '';
  const it = itemById(st.drawer.itemId);
  const b = boardOf(it);
  if (!it || !b || boardLevel(b) === 'none') { st.drawer = null; return ''; }
  const edit = canEdit(b);
  const sc = statusCol(b); const pc = firstCol(b, 'people');
  const r = rolesOf(b);
  const ks = kids(it);
  const done = ks.filter((s) => isDone(b, s)).length;
  const logs = st.updates[it.id];
  const addr = r.address && it.data[r.address.id];
  const tel = r.phone && it.data[r.phone.id];
  return `<div class="scrim" data-a="closedrawer"></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-label="Fiche ${code(b, it)}">
    <div class="drawer-head">
      <span class="code lg">${code(b, it)}</span>
      <select id="dgroup" class="sel sm" data-ch="itemgroup" data-item="${it.id}" ${edit ? '' : 'disabled'} aria-label="Groupe">${b.group_defs.map((g) => `<option value="${g.id}" ${g.id === it.group_id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</select>
      <span class="grow"></span>
      <button class="icon-btn" data-a="closedrawer" aria-label="Fermer">${ICON.close}</button>
    </div>
    <div class="drawer-body">
      <textarea id="dname" class="d-title" rows="2" data-ch="name" data-item="${it.id}" ${edit ? '' : 'readonly'} aria-label="Intitulé">${esc(it.name)}</textarea>
      ${addr || tel ? `<div class="d-actions">${addr ? `<a class="btn" href="${esc(mapsUrl(addr))}" target="_blank" rel="noopener">${ICON.pin} Itinéraire</a>` : ''}${tel ? `<a class="btn" href="${esc(telUrl(tel))}">${ICON.phone} Appeler</a>` : ''}</div>` : ''}
      <dl class="fields">${b.column_defs.map((c) => `<div class="field-row"><dt>${esc(c.name)}</dt><dd class="t-${c.type}">${cell(b, it, c, 'd', edit)}</dd></div>`).join('')}</dl>
      <section class="d-sec">
        <h4>Sous-tâches <span class="muted">${done}/${ks.length}</span></h4>
        <ul class="subs">${ks.map((s) => `<li>
          ${sc ? `<div class="t-status">${cell(b, s, sc, 'd', edit)}</div>` : '<span></span>'}
          <input id="dsn-${s.id}" class="in" data-ch="name" data-item="${s.id}" value="${esc(s.name)}" ${edit ? '' : 'readonly'} aria-label="Sous-tâche">
          ${pc ? `<div class="t-people">${cell(b, s, pc, 'd', edit)}</div>` : '<span></span>'}
          ${edit ? `<button class="icon-btn xs" data-a="delsub" data-item="${s.id}" aria-label="Supprimer">${ICON.close}</button>` : '<span></span>'}
        </li>`).join('')}</ul>
        ${edit ? `<input id="dadd-sub" class="in add-in boxed" data-ch="addsub" data-enter="1" data-item="${it.id}" placeholder="+ Ajouter une sous-tâche" aria-label="Ajouter une sous-tâche">` : (!ks.length ? '<p class="muted small">Aucune sous-tâche.</p>' : '')}
      </section>
      <section class="d-sec">
        <h4>Journal d'intervention <span class="muted">${logs ? logs.length : ''}</span></h4>
        ${edit ? `<form class="log-form" data-form="log" data-item="${it.id}"><textarea id="dlog" name="text" rows="3" placeholder="Compte rendu, pièces changées, photos à prévoir…" aria-label="Nouvelle note"></textarea><button class="btn primary sm">Publier</button></form>` : ''}
        ${!logs ? '<p class="muted small"><span class="spin dark"></span> Chargement…</p>' : logs.length ? `<ol class="log">${logs.map((l) => { const m = memberById(l.author_id); return `<li>${avatar(m, 'sm')}<div><div class="log-h"><b>${esc(memberName(m))}</b><span class="muted">${fmtStamp(l.created_at)}</span></div><p>${esc(l.body)}</p></div></li>`; }).join('')}</ol>` : '<p class="muted small">Aucune note pour l’instant.</p>'}
      </section>
      <div class="d-foot"><span class="muted small">Créée le ${fmtDate(it.created_at)}${memberById(it.created_by) ? ' par ' + esc(memberName(memberById(it.created_by))) : ''}</span>${edit ? armBtn('item:' + it.id, 'Supprimer la fiche', 'delitem', `data-item="${it.id}"`) : ''}</div>
    </div>
  </aside>`;
}

/* ---------- Paramètres (administration) ---------- */
function renderSettings() {
  const tabs = [['team', 'Équipe'], ['access', 'Accès'], ['org', 'Instance']];
  let body = '';
  if (st.settingsTab === 'team') {
    body = `<section class="panel">
        <div class="panel-head"><h3>Inviter un membre</h3><p class="muted">La personne reçoit un e-mail pour créer son compte et rejoindre ${esc(st.org.name)}. Si elle a déjà un compte Rivet, l'invitation s'ajoute à ses autres instances.</p></div>
        <form class="invite-form" data-form="invite" novalidate>
          <input id="inv-email" name="email" type="email" required placeholder="prenom.nom@entreprise.fr" aria-label="E-mail">
          <select id="inv-role" name="role" class="sel" aria-label="Rôle"><option value="member">Membre</option><option value="admin">Administrateur</option></select>
          <button class="btn primary">${ICON.mail} Envoyer l'invitation</button>
        </form>
      </section>
      <section class="panel flush">
        <div class="panel-head pad"><h3>Membres <span class="muted">${st.members.length}</span></h3></div>
        <div class="tbl-scroll"><table class="list">
          <thead><tr><th>Membre</th><th>Rôle</th><th>Accès</th><th></th></tr></thead>
          <tbody>${st.members.map((m) => {
            const locked = m.role === 'owner';
            const self = m.user_id === meId();
            const n = st.boards.filter((b) => boardLevelFor(m.user_id, m.role, b) !== 'none').length;
            return `<tr>
              <td><div class="who">${avatar(m)}<div><b>${esc(memberName(m))}${self ? ' <span class="muted">(toi)</span>' : ''}</b><small>${esc(m.email)}</small></div></div></td>
              <td>${locked ? '<span class="tag">Propriétaire</span>' : `<select id="role-${m.user_id}" class="sel sm" data-ch="role" data-user="${m.user_id}" ${self ? 'disabled' : ''} aria-label="Rôle"><option value="member" ${m.role === 'member' ? 'selected' : ''}>Membre</option><option value="admin" ${m.role === 'admin' ? 'selected' : ''}>Administrateur</option></select>`}</td>
              <td>${isAdminRole(m.role) ? '<span class="muted small">Tous les tableaux</span>' : `<button class="link" data-a="manageaccess" data-user="${m.user_id}">${n} / ${st.boards.length} tableaux</button>`}</td>
              <td class="right">${locked || self ? '' : armBtn('mem:' + m.user_id, 'Retirer', 'removemember', `data-user="${m.user_id}"`)}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>
      </section>
      <section class="panel flush">
        <div class="panel-head pad"><h3>Invitations <span class="muted">${st.invitations.filter((i) => !i.accepted_at).length} en attente</span></h3></div>
        ${st.invitations.length ? `<div class="tbl-scroll"><table class="list"><thead><tr><th>E-mail</th><th>Rôle</th><th>Envoyée</th><th>État</th><th></th></tr></thead><tbody>
          ${st.invitations.map((i) => `<tr><td><b>${esc(i.email)}</b></td><td>${ROLE_LABEL[i.role]}</td><td class="muted">${fmtDate(i.created_at)}</td><td>${i.accepted_at ? '<span class="pill c-green">Acceptée</span>' : '<span class="pill c-orange">En attente</span>'}</td>
            <td class="right nowrap">${i.accepted_at ? '' : `<button class="btn sm ghost" data-a="copyinv" data-token="${esc(i.token)}" title="Copier le lien d'invitation">${ICON.link} Copier le lien</button><button class="btn sm ghost" data-a="resendinv" data-email="${esc(i.email)}" data-token="${esc(i.token)}">Renvoyer</button>${armBtn('inv:' + i.id, 'Révoquer', 'revokeinv', `data-id="${i.id}"`)}`}</td></tr>`).join('')}
        </tbody></table></div>` : '<p class="muted pad">Aucune invitation envoyée.</p>'}
      </section>`;
  } else if (st.settingsTab === 'access') {
    const sel = memberById(st.accessUser) || st.members.find((m) => !isAdminRole(m.role)) || st.members[0];
    st.accessUser = sel ? sel.user_id : null;
    let detail = '';
    if (!sel) detail = '<div class="empty"><b>Aucun membre.</b></div>';
    else if (isAdminRole(sel.role)) detail = `<div class="empty"><b>${esc(memberName(sel))} est ${esc(ROLE_LABEL[sel.role].toLowerCase())}.</b><p class="muted">Les administrateurs voient et modifient tous les espaces et tableaux. Passe son rôle à Membre pour régler ses accès un par un.</p></div>`;
    else {
      detail = st.workspaces.map((ws) => {
        const wl = wsLevelFor(sel.user_id, sel.role, ws.id);
        const bs = st.boards.filter((b) => b.workspace_id === ws.id);
        return `<div class="acc-ws">
          <div class="acc-row head"><span class="acc-name"><span class="ws-dot c-${esc(ws.color)}"></span>${esc(ws.name)}<span class="muted small">espace</span></span>
            <select id="aw-${ws.id}" class="sel sm" data-ch="wsacc" data-ws="${ws.id}" aria-label="Accès à l'espace">${Object.entries(LEVELS).map(([k, l]) => `<option value="${k}" ${k === wl ? 'selected' : ''}>${l}</option>`).join('')}</select>
            <span class="lvl ${wl}">${wl === 'none' ? '—' : LEVELS[wl]}</span></div>
          ${bs.map((b) => {
            const o = st.boardAccess.find((x) => x.board_id === b.id && x.user_id === sel.user_id);
            const eff = boardLevelFor(sel.user_id, sel.role, b);
            return `<div class="acc-row"><span class="acc-name indent">${ICON.board}${esc(b.name)}</span>
              <select id="ab-${b.id}" class="sel sm" data-ch="boardacc" data-board="${b.id}" aria-label="Accès au tableau">
                <option value="inherit" ${!o ? 'selected' : ''}>Comme l'espace</option>
                ${Object.entries(LEVELS).map(([k, l]) => `<option value="${k}" ${o && o.level === k ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
              <span class="lvl ${eff}">${eff === 'none' ? 'Masqué' : LEVELS[eff]}</span></div>`;
          }).join('')}
          ${!bs.length ? '<div class="acc-row"><span class="muted small indent">Aucun tableau dans cet espace</span></div>' : ''}
        </div>`;
      }).join('') || '<div class="empty"><b>Aucun espace de travail.</b></div>';
    }
    body = `<div class="acc-layout">
      <div class="acc-users">${st.members.map((m) => `<button class="acc-user ${sel && m.user_id === sel.user_id ? 'on' : ''}" data-a="accuser" data-user="${m.user_id}">${avatar(m)}<span><b>${esc(memberName(m))}</b><small>${isAdminRole(m.role) ? ROLE_LABEL[m.role] : st.boards.filter((b) => boardLevelFor(m.user_id, m.role, b) !== 'none').length + ' tableau(x) visible(s)'}</small></span></button>`).join('')}</div>
      <div class="grow-min">${detail}<p class="muted small">Un tableau suit le niveau de son espace, sauf si tu lui donnes un niveau propre. « Aucun accès » le masque complètement.</p></div>
    </div>`;
  } else {
    body = `<section class="panel">
      <div class="panel-head"><h3>Instance de travail</h3></div>
      <form class="stack" data-form="orgsettings" novalidate>
        <label class="field"><span>Nom de l'entreprise</span><input id="o-name" name="name" required maxlength="80" value="${esc(st.org.name)}"></label>
        <label class="field"><span>Métier principal</span><select id="o-trade" name="trade" class="sel">${tradeOptions(st.org.trade)}</select></label>
        <div class="field"><span>Identifiant de connexion</span><div class="copy-row"><code>rivet / ${esc(st.org.slug)}</code><button type="button" class="btn sm ghost" data-a="copylogin">${ICON.link} Copier le lien de connexion</button></div><small>Partage ce lien à tes équipes : l'instance sera pré-remplie à la connexion.</small></div>
        <div><button class="btn primary">Enregistrer</button></div>
      </form>
    </section>`;
  }
  return `<div class="page">
    <div class="page-head"><div><p class="eyebrow">${esc(st.org.name)}</p><h1>Paramètres</h1></div></div>
    <div class="tabs under" role="tablist">${tabs.map(([k, l]) => `<button class="tab ${st.settingsTab === k ? 'on' : ''}" role="tab" aria-selected="${st.settingsTab === k}" data-a="settab" data-tab="${k}">${l}</button>`).join('')}</div>
    <div class="settings-body">${body}</div>
  </div>`;
}

/* ---------- Modales ---------- */
function renderModal() {
  const m = st.modal; if (!m) return '';
  let body = '';
  if (m.type === 'newws') {
    body = `<h3>Nouvel espace de travail</h3><p class="muted">Par exemple une agence, un secteur ou une équipe.</p>
      <form data-form="newws" class="stack" novalidate><label class="field"><span>Nom</span><input id="m-name" name="name" required maxlength="80" placeholder="Agence Lyon Est"></label>
      <div class="m-actions"><button type="button" class="btn ghost" data-a="closemodal">Annuler</button><button class="btn primary">Créer</button></div></form>`;
  } else if (m.type === 'newboard') {
    body = `<h3>Nouveau tableau</h3><p class="muted">Dans ${esc((wsById(m.ws) || {}).name || '')}</p>
      <form data-form="newboard" class="stack" novalidate>
        <label class="field"><span>Nom</span><input id="m-name" name="name" required maxlength="80" placeholder="Contrats d'entretien"></label>
        <label class="field"><span>Préfixe des numéros</span><input id="m-prefix" name="prefix" maxlength="4" placeholder="INT" class="upper"></label>
        <div class="tpl">
          <label><input type="radio" name="tpl" value="sav" checked><b>Interventions</b><span>Client, adresse, téléphone, prestation, technicien, statut, date et heure</span></label>
          <label><input type="radio" name="tpl" value="blank"><b>Vierge</b><span>Statut, responsable et date</span></label>
        </div>
        <div class="m-actions"><button type="button" class="btn ghost" data-a="closemodal">Annuler</button><button class="btn primary">Créer le tableau</button></div>
      </form>`;
  } else if (m.type === 'labels') {
    const b = curBoard(); const col = colById(b, m.col);
    if (!col) { st.modal = null; return ''; }
    body = `<h3>Étiquettes · ${esc(col.name)}</h3>
      <div class="opts">${(col.options || []).map((o) => `<div class="opt-row"><span class="dot c-${o.color}"></span>
        <input id="opt-${o.id}" data-ch="optlabel" data-opt="${o.id}" value="${esc(o.label)}" aria-label="Libellé">
        <select id="optc-${o.id}" class="sel sm" data-ch="optcolor" data-opt="${o.id}" aria-label="Couleur">${COLORS.map((c) => `<option value="${c}" ${c === o.color ? 'selected' : ''}>${COLOR_NAMES[c]}</option>`).join('')}</select>
        <button class="icon-btn xs" data-a="delopt" data-opt="${o.id}" aria-label="Supprimer">${ICON.close}</button></div>`).join('')}</div>
      <div class="m-actions between"><button class="btn ghost sm" data-a="addopt">${ICON.plus} Ajouter une étiquette</button><button class="btn primary" data-a="closemodal">Terminé</button></div>`;
  } else if (m.type === 'neworg') {
    body = `<h3>Nouvelle instance</h3><p class="muted">Crée l'espace d'une autre entreprise. Tu en seras le propriétaire et pourras basculer de l'une à l'autre sans te reconnecter.</p>
      <form data-form="neworgmodal" class="stack" novalidate>${orgFields('m-')}<div class="m-actions"><button type="button" class="btn ghost" data-a="closemodal">Annuler</button><button class="btn primary" ${m.busy ? 'disabled' : ''}>${m.busy ? '<span class="spin"></span>' : ''}Créer l'instance</button></div></form>`;
  } else if (m.type === 'profile') {
    const me = memberById(meId());
    body = `<h3>Mon profil</h3>
      <form data-form="profile" class="stack" novalidate>
        <label class="field"><span>Nom complet</span><input id="p-name" name="fullName" required maxlength="80" value="${esc(me ? me.full_name : '')}"></label>
        <label class="field"><span>E-mail</span><input value="${esc(st.user.email)}" readonly class="readonly"></label>
        <label class="field"><span>Nouveau mot de passe</span><input id="p-pw" name="password" type="password" minlength="8" autocomplete="new-password" placeholder="Laisser vide pour ne pas changer"></label>
        <div class="m-actions"><button type="button" class="btn ghost" data-a="closemodal">Annuler</button><button class="btn primary">Enregistrer</button></div>
      </form>`;
  } else if (m.type === 'copy') {
    body = `<h3>Copier le lien</h3><p class="muted">Sélectionne le lien puis copie-le.</p><input id="copy-in" class="copy-in" readonly value="${esc(m.text)}"><div class="m-actions"><button class="btn primary" data-a="closemodal">Fermer</button></div>`;
  }
  return `<div class="scrim modal-scrim" data-a="closemodal"></div><div class="modal" role="dialog" aria-modal="true">${body}</div>`;
}

/* ---------- Popovers ---------- */
function renderPop() {
  const el = $('#pop');
  if (!st.pop || st.screen !== 'app') { el.hidden = true; el.innerHTML = ''; return; }
  const p = st.pop; let h = '';
  const close = () => { st.pop = null; el.hidden = true; el.innerHTML = ''; };
  if (p.type === 'status' || p.type === 'people') {
    const ent = itemById(p.item); const b = boardOf(ent); const col = colById(b, p.col);
    if (!ent || !col) return close();
    if (p.type === 'status') {
      h = `<div class="pop-title">${esc(col.name)}</div><div class="pop-list">${(col.options || []).map((o) => `<button class="chip c-${o.color} ${ent.data[col.id] === o.id ? 'sel' : ''}" data-a="setopt" data-opt="${o.id}">${esc(o.label)}</button>`).join('')}</div><div class="pop-sep"></div><button class="pop-link" data-a="setopt" data-opt="">Effacer</button>${b.id === st.boardId ? `<button class="pop-link" data-a="labels" data-col="${col.id}">Modifier les étiquettes</button>` : ''}`;
    } else {
      h = `<div class="pop-title">${esc(col.name)}</div>${st.members.map((m) => `<button class="pop-person ${ent.data[col.id] === m.user_id ? 'sel' : ''}" data-a="setperson" data-user="${m.user_id}">${avatar(m, 'sm')}<span>${esc(memberName(m))}</span>${ent.data[col.id] === m.user_id ? ICON.check : ''}</button>`).join('')}<div class="pop-sep"></div><button class="pop-link" data-a="setperson" data-user="">Retirer l'assignation</button>`;
    }
  } else if (p.type === 'col') {
    const b = curBoard(); const col = colById(b, p.col); if (!col) return close();
    const idx = b.column_defs.indexOf(col);
    h = `<label class="pop-label">Nom de la colonne<input id="pop-colname" class="pop-in" data-ch="colname" data-col="${col.id}" value="${esc(col.name)}" maxlength="40"></label>
      ${col.type === 'status' ? `<button class="pop-link" data-a="labels" data-col="${col.id}">Modifier les étiquettes</button>` : ''}
      <div class="pop-row"><button class="pop-link" data-a="colmove" data-dir="-1" ${idx === 0 ? 'disabled' : ''}>${ICON.left} Gauche</button><button class="pop-link" data-a="colmove" data-dir="1" ${idx === b.column_defs.length - 1 ? 'disabled' : ''}>Droite ${ICON.right}</button></div>
      <div class="pop-sep"></div>${armBtn('col:' + col.id, 'Supprimer la colonne', 'delcol', `data-col="${col.id}"`, 'block')}`;
  } else if (p.type === 'addcol') {
    h = `<div class="pop-title">Ajouter une colonne</div><div class="pop-grid">${COL_TYPES.map((t) => `<button class="pop-item" data-a="addcol" data-type="${t.type}"><b>${t.label}</b><span>${t.hint}</span></button>`).join('')}</div>`;
  } else if (p.type === 'group') {
    const b = curBoard(); const g = b && b.group_defs.find((x) => x.id === p.group); if (!g) return close();
    const n = topItems(b).filter((i) => i.group_id === g.id).length;
    h = `<div class="pop-title">Couleur</div><div class="swatches">${COLORS.map((c) => `<button class="sw c-${c} ${g.color === c ? 'sel' : ''}" data-a="gcolor" data-color="${c}" aria-label="${COLOR_NAMES[c]}" title="${COLOR_NAMES[c]}"></button>`).join('')}</div>
      <div class="pop-sep"></div>${armBtn('group:' + g.id, n ? `Supprimer le groupe (${n} éléments)` : 'Supprimer le groupe', 'delgroup', `data-group="${g.id}"`, 'block')}`;
  } else if (p.type === 'board') {
    const b = curBoard(); if (!b) return close();
    h = `<label class="pop-label">Préfixe des numéros<input id="pop-prefix" class="pop-in upper" data-ch="prefix" value="${esc(b.prefix)}" maxlength="4"></label>
      ${wsLevel(b.workspace_id) === 'edit' ? `<div class="pop-sep"></div>${armBtn('board:' + b.id, 'Supprimer le tableau', 'delboard', '', 'block')}` : ''}`;
  } else if (p.type === 'ws') {
    const ws = wsById(p.ws); if (!ws) return close();
    const n = st.boards.filter((x) => x.workspace_id === ws.id).length;
    h = `<label class="pop-label">Nom de l'espace<input id="pop-wsname" class="pop-in" data-ch="wsname" data-ws="${ws.id}" value="${esc(ws.name)}" maxlength="80"></label>
      <div class="pop-title">Couleur</div><div class="swatches">${COLORS.map((c) => `<button class="sw c-${c} ${ws.color === c ? 'sel' : ''}" data-a="wscolor" data-color="${c}" aria-label="${COLOR_NAMES[c]}"></button>`).join('')}</div>
      <div class="pop-sep"></div>${armBtn('ws:' + ws.id, n ? `Supprimer l'espace (${n} tableaux)` : "Supprimer l'espace", 'delws', `data-ws="${ws.id}"`, 'block')}`;
  } else if (p.type === 'org') {
    h = `<div class="pop-title">Mes instances</div>${st.orgs.map((o) => `<button class="pop-person ${o.org.id === st.org.id ? 'sel' : ''}" data-a="switchorg" data-org="${o.org.id}"><span class="org-av sm">${esc(initials(o.org.name))}</span><span class="grow"><b>${esc(o.org.name)}</b><small>${ROLE_LABEL[o.role]}</small></span>${o.org.id === st.org.id ? ICON.check : ''}</button>`).join('')}
      ${st.myInvites.length ? `<div class="pop-sep"></div><div class="pop-title">Invitations reçues</div>${st.myInvites.map((i) => `<div class="pop-inv"><span class="org-av sm">${esc(initials(i.org_name))}</span><span class="grow"><b>${esc(i.org_name)}</b><small>${ROLE_LABEL[i.role]}</small></span><button class="btn primary sm" data-a="acceptinv" data-token="${esc(i.token)}">Rejoindre</button></div>`).join('')}` : ''}
      <div class="pop-sep"></div><button class="pop-link" data-a="neworg">${ICON.plus} Créer une nouvelle instance</button>`;
  } else if (p.type === 'user') {
    const me = memberById(meId());
    h = `<div class="pop-user">${avatar(me)}<span><b>${esc(memberName(me))}</b><small>${esc(st.user.email)}</small></span></div><div class="pop-sep"></div>
      <button class="pop-link" data-a="profile">${ICON.user} Mon profil</button>
      <button class="pop-link" data-a="logout">${ICON.logout} Se déconnecter</button>`;
  }
  el.innerHTML = h; el.hidden = false;
  const r = p.rect; const w = el.offsetWidth; const hgt = el.offsetHeight;
  let left = p.alignRight ? r.right - w : r.left;
  left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
  let top = r.bottom + 6; if (top + hgt > window.innerHeight - 12) top = Math.max(12, r.top - hgt - 6);
  el.style.left = left + 'px'; el.style.top = top + 'px';
}
function openPop(type, el, extra = {}) {
  const key = type + ':' + [extra.item, extra.col, extra.group, extra.ws, extra.ctx].filter(Boolean).join(':');
  if (st.pop && st.pop.key === key) { st.pop = null; renderPop(); return; }
  const r = el.getBoundingClientRect();
  st.pop = { type, key, rect: { left: r.left, right: r.right, top: r.top, bottom: r.bottom }, ...extra };
  st.armed = null;
  renderPop();
}

/* ===================================================================
   Moteur de rendu (préserve le défilement et la saisie en cours)
   =================================================================== */
let pointerDown = false, pending = false;
function render() {
  pending = false;
  const mainEl = $('#main');
  const scr = mainEl ? mainEl.scrollTop : 0;
  const sl = {}; document.querySelectorAll('[data-scroll]').forEach((e) => { sl[e.dataset.scroll] = e.scrollLeft; });
  const db = $('.drawer-body'); const dst = db ? db.scrollTop : 0;
  const act = document.activeElement; const aid = act && act.id;
  let sel = null; try { if (act && typeof act.selectionStart === 'number') sel = [act.selectionStart, act.selectionEnd]; } catch (e) { sel = null; }

  let html;
  if (st.screen === 'loading') html = '<div class="boot"><div class="spinner"></div></div>';
  else if (st.screen === 'setup') html = renderSetup();
  else if (st.screen === 'auth') html = renderAuth();
  else html = renderApp();
  $('#root').innerHTML = html;
  $('#layer').innerHTML = st.screen === 'app' && !st.loadingOrg ? renderDrawer() + renderModal() : '';

  const m2 = $('#main'); if (m2) m2.scrollTop = scr;
  document.querySelectorAll('[data-scroll]').forEach((e) => { if (sl[e.dataset.scroll]) e.scrollLeft = sl[e.dataset.scroll]; });
  const db2 = $('.drawer-body'); if (db2) db2.scrollTop = dst;
  renderPop();
  renderToast();

  const want = st.focus || aid; const forced = !!st.focus; st.focus = null;
  if (want) {
    const n = document.getElementById(want);
    if (n) {
      try { n.focus({ preventScroll: true }); } catch (e) { /* ignoré */ }
      try { if (st.selectAll) n.select(); else if (sel && !forced) n.setSelectionRange(sel[0], sel[1]); } catch (e) { /* champ sans sélection */ }
    }
  }
  st.selectAll = false;
}
function renderSoon() { if (pointerDown) pending = true; else render(); }

/* ===================================================================
   Opérations sur les données (optimistes, puis enregistrées)
   =================================================================== */
async function setVal(ent, colId, v) {
  ent.data = { ...ent.data };
  if (v === null || v === undefined || v === '') delete ent.data[colId]; else ent.data[colId] = v;
  renderSoon();
  try { await api.setItemValue(ent.id, colId, v === '' ? null : v); } catch (e) { fail(e); }
}
async function saveBoard(b, patch) { try { await api.updateBoard(b.id, patch); } catch (e) { fail(e); } }
async function addItem(b, groupId, name, data = {}, open = false) {
  const sibs = topItems(b).filter((i) => i.group_id === groupId);
  const pos = sibs.length ? Math.max(...sibs.map((i) => i.position)) + 1 : 1;
  try {
    const row = await api.insertItem({ board_id: b.id, group_id: groupId, name, data, position: pos });
    upsert(st.items, row);
    if (open) { st.drawer = { itemId: row.id }; st.focus = 'dname'; st.selectAll = true; loadUpdates(row.id); }
    renderSoon();
    return row;
  } catch (e) { fail(e); return null; }
}
async function addSub(parent, name) {
  const pos = kids(parent).length + 1;
  try {
    const row = await api.insertItem({ board_id: parent.board_id, parent_id: parent.id, name, data: {}, position: pos });
    upsert(st.items, row); st.expanded.add(parent.id); renderSoon();
  } catch (e) { fail(e); }
}
async function loadUpdates(itemId) {
  try { st.updates[itemId] = await api.listUpdates(itemId); } catch (e) { st.updates[itemId] = []; }
  if (st.drawer && st.drawer.itemId === itemId) renderSoon();
}
function ensureGroup(b) {
  if (!b.group_defs.length) { b.group_defs = [{ id: sid(), name: 'Groupe principal', color: 'blue' }]; saveBoard(b, { group_defs: b.group_defs }); }
  return b.group_defs[0];
}
async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg || 'Lien copié'); }
  catch (e) { st.modal = { type: 'copy', text }; st.focus = 'copy-in'; st.selectAll = true; render(); }
}
async function switchOrg(id) { st.page = null; st.boardId = null; st.expanded.clear(); st.pop = null; await enterOrg(id); }
async function createOrgFlow(name, slug, trade) {
  const id = await api.createOrg(name, slug, trade);
  await seedOrg(id, trade);
  st.orgs = await api.myOrgs(st.user.id);
  st.page = null;
  await enterOrg(id);
  toast(`Instance « ${name} » créée`);
}

/* ===================================================================
   Actions déclenchées par un clic (data-a)
   =================================================================== */
const A = {
  /* --- connexion --- */
  authstep(el) { setStep(el.dataset.step); },
  pickrecent(el) { lookupInstance(el.dataset.slug); },
  invtab(el) { st.auth.form.inviteTab = el.dataset.tab; st.auth.err = ''; render(); },
  invitelogin() { st.auth.form.inviteTab = 'login'; st.auth.err = ''; render(); },
  dropinvite() { clearInvite(); setStep('instance'); },
  backtoapp() { if (st.orgs.length) enterOrg((st.org && st.org.id) || st.orgs[0].org.id); },
  async logout() { st.pop = null; await api.signOut(); resetData(); st.session = null; st.user = null; st.screen = 'auth'; setStep('instance'); },
  async acceptinv(el) {
    try {
      const orgId = await api.acceptInvitation(el.dataset.token);
      st.orgs = await api.myOrgs(st.user.id); st.pop = null;
      await switchOrg(orgId); toast('Invitation acceptée');
    } catch (e) { toast(errMsg(e), true); }
  },

  /* --- navigation --- */
  toggleside() { st.side = !st.side; render(); },
  closeside() { st.side = false; render(); },
  go(el) { st.page = el.dataset.page; st.side = false; st.drawer = null; render(); const m = $('#main'); if (m) m.scrollTop = 0; },
  openboard(el) { st.boardId = el.dataset.board; st.page = 'board'; st.side = false; st.drawer = null; st.search = ''; st.person = ''; render(); const m = $('#main'); if (m) m.scrollTop = 0; },
  settab(el) { st.settingsTab = el.dataset.tab; render(); },
  accuser(el) { st.accessUser = el.dataset.user; render(); },
  manageaccess(el) { st.settingsTab = 'access'; st.accessUser = el.dataset.user; render(); },
  dayscope(el) { st.dayScope = el.dataset.scope; render(); },
  dayshift(el) { const n = Number(el.dataset.n); st.day = n === 0 ? null : addDays(st.day || todayIso(), n); render(); },
  calshift(el) { const n = Number(el.dataset.n); const d = st.calMonth || new Date(new Date().getFullYear(), new Date().getMonth(), 1); st.calMonth = n === 0 ? null : new Date(d.getFullYear(), d.getMonth() + n, 1); render(); },
  view(el) { setViewPref(curBoard(), { view: el.dataset.view }); render(); },
  togglegroup(el) { toggleCollapsed(st.boardId + ':' + el.dataset.group); render(); },
  togglesubs(el) {
    const id = el.dataset.item; st.expanded.has(id) ? st.expanded.delete(id) : st.expanded.add(id);
    if (st.expanded.has(id) && canEdit(curBoard())) st.focus = 'addsub-' + id;
    render();
  },
  opendrawer(el) { const id = el.dataset.item; st.drawer = { itemId: id }; st.pop = null; render(); loadUpdates(id); },
  closedrawer() { st.drawer = null; render(); },
  closemodal() { st.modal = null; render(); },
  newws() { st.modal = { type: 'newws' }; st.focus = 'm-name'; st.side = false; render(); },
  newboard(el) { st.modal = { type: 'newboard', ws: el.dataset.ws }; st.focus = 'm-name'; st.side = false; render(); },
  neworg() { st.pop = null; st.auth.form = { trade: 'plomberie' }; st.auth.slugTouched = false; st.modal = { type: 'neworg' }; st.focus = 'm-orgName'; render(); },
  profile() { st.pop = null; st.modal = { type: 'profile' }; render(); },
  switchorg(el) { if (el.dataset.org !== st.org.id) switchOrg(el.dataset.org); else { st.pop = null; renderPop(); } },
  copylogin() { copyText(api.loginLink(st.org.slug), 'Lien de connexion copié'); },
  copyinv(el) { copyText(api.inviteLink(el.dataset.token), "Lien d'invitation copié"); },
  async resendinv(el) {
    try { await api.sendInviteEmail(el.dataset.email, el.dataset.token); toast(`Invitation renvoyée à ${el.dataset.email}`); }
    catch (e) { toast(errMsg(e) + " Tu peux copier le lien et l'envoyer toi-même.", true); }
  },

  /* --- popovers --- */
  'pop-status'(el) { openPop('status', el, { item: el.dataset.item, col: el.dataset.col, ctx: el.dataset.ctx }); },
  'pop-people'(el) { openPop('people', el, { item: el.dataset.item, col: el.dataset.col, ctx: el.dataset.ctx }); },
  'pop-col'(el) { openPop('col', el, { col: el.dataset.col }); const n = $('#pop-colname'); if (n) { n.focus(); n.select(); } },
  'pop-addcol'(el) { openPop('addcol', el, { alignRight: true }); },
  'pop-group'(el) { openPop('group', el, { group: el.dataset.group }); },
  'pop-board'(el) { openPop('board', el, { alignRight: true }); },
  'pop-ws'(el) { openPop('ws', el, { ws: el.dataset.ws }); },
  'pop-org'(el) { openPop('org', el); },
  'pop-user'(el) { openPop('user', el, { alignRight: true }); },

  /* --- valeurs --- */
  setopt(el) { const p = st.pop; const ent = itemById(p.item); st.pop = null; renderPop(); if (ent) setVal(ent, p.col, el.dataset.opt || null); },
  setperson(el) { const p = st.pop; const ent = itemById(p.item); st.pop = null; renderPop(); if (ent) setVal(ent, p.col, el.dataset.user || null); },
  quickstatus(el) { const ent = itemById(el.dataset.item); if (ent) setVal(ent, el.dataset.col, el.dataset.opt); },

  /* --- structure du tableau --- */
  labels(el) { st.modal = { type: 'labels', col: el.dataset.col }; st.pop = null; render(); },
  addopt() { const b = curBoard(); const col = colById(b, st.modal.col); const o = { id: sid(), label: 'Nouvelle étiquette', color: COLORS[(col.options || []).length % COLORS.length] }; col.options = [...(col.options || []), o]; st.focus = 'opt-' + o.id; st.selectAll = true; render(); saveBoard(b, { column_defs: b.column_defs }); },
  delopt(el) { const b = curBoard(); const col = colById(b, st.modal.col); col.options = col.options.filter((o) => o.id !== el.dataset.opt); render(); saveBoard(b, { column_defs: b.column_defs }); },
  addcol(el) {
    const b = curBoard(); const t = el.dataset.type; const meta = COL_TYPES.find((x) => x.type === t);
    const col = { id: sid(), name: meta.label, type: t === 'priority' ? 'status' : t };
    if (t === 'status') col.options = FIELD_STATUS();
    if (t === 'priority') col.options = URGENCY();
    b.column_defs = [...b.column_defs, col]; st.pop = null; render();
    saveBoard(b, { column_defs: b.column_defs });
    toast(`Colonne « ${col.name} » ajoutée. Clique sur son titre pour la renommer.`);
  },
  colmove(el) {
    const b = curBoard(); const i = b.column_defs.findIndex((c) => c.id === st.pop.col); const j = i + Number(el.dataset.dir);
    if (j < 0 || j >= b.column_defs.length) return;
    const cols = [...b.column_defs]; [cols[i], cols[j]] = [cols[j], cols[i]]; b.column_defs = cols; st.pop = null; render();
    saveBoard(b, { column_defs: b.column_defs });
  },
  delcol(el) { const b = curBoard(); b.column_defs = b.column_defs.filter((c) => c.id !== el.dataset.col); st.pop = null; st.armed = null; render(); saveBoard(b, { column_defs: b.column_defs }); toast('Colonne supprimée'); },
  gcolor(el) { const b = curBoard(); const g = b.group_defs.find((x) => x.id === st.pop.group); g.color = el.dataset.color; b.group_defs = [...b.group_defs]; render(); saveBoard(b, { group_defs: b.group_defs }); },
  addgroup() { const b = curBoard(); const g = { id: sid(), name: 'Nouveau groupe', color: COLORS[b.group_defs.length % COLORS.length] }; b.group_defs = [...b.group_defs, g]; st.focus = 'gname-' + g.id; st.selectAll = true; render(); saveBoard(b, { group_defs: b.group_defs }); },
  async delgroup(el) {
    const b = curBoard(); const gid = el.dataset.group;
    b.group_defs = b.group_defs.filter((g) => g.id !== gid);
    const gone = new Set(topItems(b).filter((i) => i.group_id === gid).map((i) => i.id));
    st.items = st.items.filter((i) => !gone.has(i.id) && !gone.has(i.parent_id));
    st.pop = null; st.armed = null; render();
    try { await api.deleteGroupItems(b.id, gid); await api.updateBoard(b.id, { group_defs: b.group_defs }); toast('Groupe supprimé'); } catch (e) { fail(e); }
  },
  async delboard() {
    const b = curBoard(); st.pop = null; st.armed = null;
    try { await api.deleteBoard(b.id); st.boards = st.boards.filter((x) => x.id !== b.id); st.items = st.items.filter((i) => i.board_id !== b.id); st.boardId = null; st.page = 'today'; render(); toast('Tableau supprimé'); } catch (e) { fail(e); }
  },
  wscolor(el) { const ws = wsById(st.pop.ws); ws.color = el.dataset.color; render(); api.updateWorkspace(ws.id, { color: ws.color }).catch(fail); },
  async delws(el) {
    const id = el.dataset.ws; st.pop = null; st.armed = null;
    try { await api.deleteWorkspace(id); await reloadOrg(); if (!boardById(st.boardId)) st.page = 'today'; render(); toast('Espace supprimé'); } catch (e) { fail(e); }
  },

  /* --- éléments --- */
  newitem() { const b = curBoard(); const g = ensureGroup(b); addItem(b, g.id, nounOf(b).neu, {}, true); },
  laneadd(el) { const b = curBoard(); const g = ensureGroup(b); addItem(b, g.id, nounOf(b).neu, el.dataset.opt ? { [el.dataset.col]: el.dataset.opt } : {}, true); },
  dayadd(el) { const b = curBoard(); const g = ensureGroup(b); addItem(b, g.id, nounOf(b).neu, { [el.dataset.col]: el.dataset.date }, true); },
  planhere() {
    const b = visibleBoards().find((x) => canEdit(x) && rolesOf(x).date); if (!b) return;
    const r = rolesOf(b); const g = ensureGroup(b); const data = { [r.date.id]: st.day || todayIso() };
    if (r.people[0]) data[r.people[0].id] = meId();
    st.boardId = b.id; addItem(b, (b.group_defs.find((x) => /plan/i.test(x.name)) || g).id, nounOf(b).neu, data, true);
  },
  async delsub(el) { const id = el.dataset.item; st.items = st.items.filter((i) => i.id !== id); render(); try { await api.deleteItem(id); } catch (e) { fail(e); } },
  async delitem(el) {
    const id = el.dataset.item; st.drawer = null; st.armed = null;
    st.items = st.items.filter((i) => i.id !== id && i.parent_id !== id); render();
    try { await api.deleteItem(id); toast('Fiche supprimée'); } catch (e) { fail(e); }
  },

  /* --- équipe --- */
  async removemember(el) {
    st.armed = null;
    try { await api.removeMember(st.org.id, el.dataset.user); await reloadOrg(); toast('Membre retiré'); } catch (e) { fail(e); }
  },
  async revokeinv(el) {
    st.armed = null;
    try { await api.revokeInvitation(el.dataset.id); st.invitations = st.invitations.filter((i) => i.id !== el.dataset.id); render(); toast('Invitation révoquée'); } catch (e) { fail(e); }
  },
  arm(el) { st.armed = el.dataset.key; clearTimeout(A._armT); A._armT = setTimeout(() => { st.armed = null; render(); }, 4000); render(); },
};

/* ===================================================================
   Changements de champs (data-ch) et saisies (data-in, data-af)
   =================================================================== */
const C = {
  val(el) {
    const ent = itemById(el.dataset.item); const b = boardOf(ent); if (!ent || !canEdit(b)) return;
    const col = colById(b, el.dataset.col); if (!col) return;
    let v;
    if (col.type === 'number') v = el.value === '' ? null : Number(el.value);
    else if (col.type === 'check') v = el.checked;
    else v = el.value.trim() === '' ? null : el.value.trim();
    setVal(ent, col.id, v);
  },
  name(el) {
    const ent = itemById(el.dataset.item); const b = boardOf(ent); if (!ent || !canEdit(b)) return;
    const name = el.value.trim() || (ent.parent_id ? 'Sous-tâche' : nounOf(b).neu);
    if (name === ent.name) return;
    ent.name = name; renderSoon();
    api.updateItem(ent.id, { name }).catch(fail);
  },
  additem(el) { const name = el.value.trim(); if (!name) return; el.value = ''; addItem(curBoard(), el.dataset.group, name); },
  addsub(el) { const name = el.value.trim(); if (!name) return; el.value = ''; const p = itemById(el.dataset.item); if (p) addSub(p, name); },
  boardname(el) { const b = curBoard(); const v = el.value.trim() || 'Sans titre'; if (v === b.name) return; b.name = v; renderSoon(); saveBoard(b, { name: v }); },
  groupname(el) { const b = curBoard(); const g = b.group_defs.find((x) => x.id === el.dataset.group); g.name = el.value.trim() || 'Groupe'; b.group_defs = [...b.group_defs]; renderSoon(); saveBoard(b, { group_defs: b.group_defs }); },
  colname(el) { const b = curBoard(); const c = colById(b, el.dataset.col); c.name = el.value.trim() || 'Colonne'; b.column_defs = [...b.column_defs]; renderSoon(); saveBoard(b, { column_defs: b.column_defs }); },
  prefix(el) { const b = curBoard(); const v = el.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); if (!v) return; b.prefix = v; renderSoon(); saveBoard(b, { prefix: v }); },
  wsname(el) { const ws = wsById(el.dataset.ws); ws.name = el.value.trim() || 'Espace'; renderSoon(); api.updateWorkspace(ws.id, { name: ws.name }).catch(fail); },
  itemgroup(el) { const it = itemById(el.dataset.item); it.group_id = el.value; render(); api.updateItem(it.id, { group_id: el.value }).catch(fail); },
  pfilter(el) { st.person = el.value; render(); },
  kcol(el) { setViewPref(curBoard(), { kanbanCol: el.value }); render(); },
  ccol(el) { setViewPref(curBoard(), { calCol: el.value }); render(); },
  optlabel(el) { const b = curBoard(); const o = colById(b, st.modal.col).options.find((x) => x.id === el.dataset.opt); o.label = el.value.trim() || 'Sans nom'; renderSoon(); saveBoard(b, { column_defs: b.column_defs }); },
  optcolor(el) { const b = curBoard(); const o = colById(b, st.modal.col).options.find((x) => x.id === el.dataset.opt); o.color = el.value; render(); saveBoard(b, { column_defs: b.column_defs }); },
  async role(el) { try { await api.setRole(st.org.id, el.dataset.user, el.value); await reloadOrg(); toast('Rôle mis à jour'); } catch (e) { fail(e); } },
  async wsacc(el) { try { await api.setWsAccess(el.dataset.ws, st.accessUser, el.value); await reloadOrg(); toast('Accès mis à jour'); } catch (e) { fail(e); } },
  async boardacc(el) { try { await api.setBoardAccess(el.dataset.board, st.accessUser, el.value); await reloadOrg(); toast('Accès mis à jour'); } catch (e) { fail(e); } },
};
// Saisie des formulaires de connexion : mémorisée sans redessiner l'écran.
function onAuthInput(el) {
  const k = el.dataset.af; st.auth.form[k] = el.value;
  if (k === 'slug') st.auth.slugTouched = true;
  if (k === 'orgName' && !st.auth.slugTouched) {
    const s = slugify(el.value); st.auth.form.slug = s;
    const slugEl = el.closest('form').querySelector('[data-af="slug"]'); if (slugEl) slugEl.value = s;
  }
}

/* ===================================================================
   Formulaires (data-form)
   =================================================================== */
const fv = (form, n) => { const el = form.elements.namedItem(n); return el ? String(el.value || '') : ''; };
async function authTask(fn) {
  st.auth.busy = true; st.auth.err = ''; st.auth.info = ''; render();
  try { await fn(); } catch (e) { st.auth.err = errMsg(e); }
  st.auth.busy = false; if (st.screen === 'auth') render();
}
function readOrgForm(form) {
  const name = fv(form, 'orgName').trim(); const slug = slugify(fv(form, 'slug') || name); const trade = fv(form, 'trade') || 'multiservice';
  if (!name) throw new Error("Indique le nom de l'entreprise.");
  if (!validSlug(slug)) throw new Error("L'identifiant doit faire 3 à 40 caractères : minuscules, chiffres et tirets.");
  return { name, slug, trade };
}
const F = {
  instance(form) { lookupInstance(fv(form, 'slug')); },
  login(form) {
    authTask(async () => {
      const email = fv(form, 'email').trim(); const pw = fv(form, 'password');
      if (!email || !pw) throw new Error('Renseigne ton e-mail et ton mot de passe.');
      const res = await api.signIn(email, pw);
      st.session = res.session; st.user = res.user || (res.session && res.session.user);
      if (st.user && (st.user.user_metadata || {}).password_set !== true) { try { await api.updateUser({ data: { password_set: true } }); } catch (e) { /* ignoré */ } }
      await afterAuth();
    });
  },
  forgot(form) {
    authTask(async () => {
      const email = fv(form, 'email').trim(); if (!email) throw new Error('Indique ton e-mail.');
      await api.sendReset(email);
      st.auth.info = 'Si un compte existe pour cette adresse, un e-mail vient de partir.';
    });
  },
  signup(form) {
    authTask(async () => {
      const org = readOrgForm(form);
      const fullName = fv(form, 'fullName').trim(); const email = fv(form, 'email').trim(); const password = fv(form, 'password');
      if (!fullName) throw new Error('Indique ton nom.');
      if (!email) throw new Error('Indique ton e-mail.');
      if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
      if (!(await api.slugAvailable(org.slug))) throw new Error(`L'identifiant « ${org.slug} » est déjà pris. Choisis-en un autre.`);
      const res = await api.signUp({ email, password, fullName, pendingOrg: org });
      if (res.user && Array.isArray(res.user.identities) && res.user.identities.length === 0) throw new Error('Un compte existe déjà avec cet e-mail. Connecte-toi, puis crée ta nouvelle instance depuis le menu.');
      if (res.session) { st.session = res.session; await afterAuth(); }
      else { st.auth.form.email = email; setStep('check'); }
    });
  },
  neworg(form) {
    authTask(async () => {
      const org = readOrgForm(form);
      if (!(await api.slugAvailable(org.slug))) throw new Error(`L'identifiant « ${org.slug} » est déjà pris.`);
      try { await api.updateUser({ data: { pending_org: null } }); } catch (e) { /* ignoré */ }
      await createOrgFlow(org.name, org.slug, org.trade);
    });
  },
  async neworgmodal(form) {
    let org; try { org = readOrgForm(form); } catch (e) { toast(e.message, true); return; }
    st.modal.busy = true; render();
    try {
      if (!(await api.slugAvailable(org.slug))) throw new Error(`L'identifiant « ${org.slug} » est déjà pris.`);
      st.modal = null; await createOrgFlow(org.name, org.slug, org.trade);
    } catch (e) { if (st.modal) st.modal.busy = false; toast(errMsg(e), true); render(); }
  },
  invitesignup(form) {
    authTask(async () => {
      const inv = st.auth.invite; const fullName = fv(form, 'fullName').trim(); const password = fv(form, 'password');
      if (!fullName) throw new Error('Indique ton nom.');
      if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
      const res = await api.signUp({ email: inv.email, password, fullName, inviteToken: st.auth.inviteToken });
      if (res.user && Array.isArray(res.user.identities) && res.user.identities.length === 0) { st.auth.form.inviteTab = 'login'; throw new Error('Un compte existe déjà avec cette adresse : connecte-toi.'); }
      if (res.session) { st.session = res.session; await afterAuth(); }
      else { st.auth.form.email = inv.email; setStep('check'); }
    });
  },
  invitelogin(form) {
    authTask(async () => {
      const res = await api.signIn(st.auth.invite.email, fv(form, 'password'));
      st.session = res.session; st.user = res.session.user;
      if ((st.user.user_metadata || {}).password_set !== true) { const u = await api.updateUser({ data: { password_set: true } }); st.user = u; st.session.user = u; }
      await afterAuth();
    });
  },
  finalize(form) {
    authTask(async () => {
      const fullName = fv(form, 'fullName').trim(); const password = fv(form, 'password');
      if (!fullName) throw new Error('Indique ton nom.');
      if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
      const u = await api.updateUser({ password, data: { full_name: fullName, password_set: true } });
      st.user = u; st.session.user = u;
      try { await api.updateProfile(u.id, fullName); } catch (e) { /* ignoré */ }
      await afterAuth();
    });
  },
  reset(form) {
    authTask(async () => {
      const password = fv(form, 'password'); if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
      await api.updateUser({ password, data: { password_set: true } });
      toast('Mot de passe enregistré');
      await afterAuth();
    });
  },
  async newws(form) {
    const name = fv(form, 'name').trim(); if (!name) return;
    try { const ws = await api.insertWorkspace({ org_id: st.org.id, name, color: COLORS[st.workspaces.length % COLORS.length], position: st.workspaces.length }); st.workspaces.push(ws); st.modal = null; render(); toast(`Espace « ${name} » créé`); } catch (e) { fail(e); }
  },
  async newboard(form) {
    const name = fv(form, 'name').trim(); if (!name) return;
    const tpl = fv(form, 'tpl') === 'blank' ? blankTemplate() : savTemplate(st.org.trade);
    const prefix = (fv(form, 'prefix').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)) || (name.normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'TAB');
    try {
      const b = await api.insertBoard({ workspace_id: st.modal.ws, name, prefix, noun: tpl.noun, column_defs: tpl.column_defs, group_defs: tpl.group_defs, position: st.boards.length });
      st.boards.push(b); st.boardId = b.id; st.page = 'board'; st.modal = null; render(); toast(`Tableau « ${name} » créé`);
    } catch (e) { fail(e); }
  },
  async log(form) {
    const body = fv(form, 'text').trim(); if (!body) return;
    const itemId = form.dataset.item;
    try { const row = await api.addUpdate(itemId, body); st.updates[itemId] = [row, ...(st.updates[itemId] || []).filter((x) => x.id !== row.id)]; render(); toast('Note publiée'); } catch (e) { fail(e); }
  },
  async invite(form) {
    const email = fv(form, 'email').trim().toLowerCase(); const role = fv(form, 'role') || 'member';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast("Cette adresse e-mail n'est pas valide.", true); return; }
    let token;
    try { token = await api.invite(st.org.id, email, role); } catch (e) { toast(errMsg(e), true); return; }
    try { st.invitations = await api.listInvitations(st.org.id); } catch (e) { /* ignoré */ }
    render();
    try { await api.sendInviteEmail(email, token); toast(`Invitation envoyée à ${email}`); }
    catch (e) { toast(`Invitation créée, mais l'e-mail n'est pas parti (${errMsg(e)}). Copie le lien pour l'envoyer toi-même.`, true); }
  },
  async orgsettings(form) {
    const name = fv(form, 'name').trim(); const trade = fv(form, 'trade');
    if (!name) { toast("Indique le nom de l'entreprise.", true); return; }
    try {
      await api.updateOrg(st.org.id, { name, trade }); st.org.name = name; st.org.trade = trade;
      const m = st.orgs.find((o) => o.org.id === st.org.id); if (m) Object.assign(m.org, { name, trade });
      render(); toast('Instance mise à jour');
    } catch (e) { fail(e); }
  },
  async profile(form) {
    const fullName = fv(form, 'fullName').trim(); const pw = fv(form, 'password');
    if (!fullName) { toast('Indique ton nom.', true); return; }
    if (pw && pw.length < 8) { toast('Le mot de passe doit contenir au moins 8 caractères.', true); return; }
    try {
      await api.updateProfile(meId(), fullName);
      await api.updateUser(pw ? { password: pw, data: { full_name: fullName, password_set: true } } : { data: { full_name: fullName } });
      const me = memberById(meId()); if (me) me.full_name = fullName;
      st.modal = null; render(); toast('Profil enregistré');
    } catch (e) { fail(e); }
  },
};

/* ===================================================================
   Écouteurs
   =================================================================== */
document.addEventListener('pointerdown', () => { pointerDown = true; }, true);
const release = () => setTimeout(() => { pointerDown = false; if (pending) render(); }, 0);
document.addEventListener('pointerup', release, true);
document.addEventListener('pointercancel', release, true);

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-a]');
  const inPop = e.target.closest('#pop');
  if (st.pop && !inPop && !(t && t.dataset.a.startsWith('pop-'))) { st.pop = null; renderPop(); if (!t) return; }
  if (!t || t.disabled) return;
  const fn = A[t.dataset.a];
  if (fn) { e.preventDefault(); fn(t, e); }
});
document.addEventListener('change', (e) => {
  const t = e.target.closest('[data-ch]');
  if (t && C[t.dataset.ch]) C[t.dataset.ch](t);
});
document.addEventListener('input', (e) => {
  const t = e.target;
  if (!t.dataset) return;
  if (t.dataset.in === 'search') { st.search = t.value; render(); }
  else if (t.dataset.af) onAuthInput(t);
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault(); if (F[f.dataset.form]) F[f.dataset.form](f);
});
document.addEventListener('focusout', () => setTimeout(() => { if (st.pendingRemote && !isEditing()) { st.pendingRemote = false; renderSoon(); } }, 60));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (st.pop) { st.pop = null; renderPop(); return; }
    if (st.modal) { st.modal = null; render(); return; }
    if (st.drawer) { st.drawer = null; render(); return; }
    if (st.side) { st.side = false; render(); return; }
  }
  const t = e.target;
  if (!t.matches) return;
  if (e.key === 'Enter' && t.matches('[data-enter]')) { e.preventDefault(); st.focus = t.id; C[t.dataset.ch](t); return; }
  if (e.key === 'Enter' && t.matches('input[data-ch]:not([type=checkbox]), textarea.d-title')) { e.preventDefault(); t.blur(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && t.matches('.card')) { e.preventDefault(); A.opendrawer(t); }
});

// Glisser-déposer : kanban (changement de statut) et calendrier (changement de date)
document.addEventListener('dragstart', (e) => {
  const t = e.target.closest && e.target.closest('[data-drag]'); if (!t) return;
  st.drag = t.dataset.drag; e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', st.drag); } catch (x) { /* ignoré */ }
  t.classList.add('dragging');
});
document.addEventListener('dragend', (e) => {
  st.drag = null; document.querySelectorAll('.drop-on').forEach((x) => x.classList.remove('drop-on'));
  if (e.target.classList) e.target.classList.remove('dragging');
});
document.addEventListener('dragover', (e) => {
  const z = e.target.closest && e.target.closest('[data-drop]'); if (!z || !st.drag) return;
  e.preventDefault(); z.classList.add('drop-on');
});
document.addEventListener('dragleave', (e) => {
  const z = e.target.closest && e.target.closest('[data-drop]'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('drop-on');
});
document.addEventListener('drop', (e) => {
  const z = e.target.closest && e.target.closest('[data-drop]'); if (!z || !st.drag) return;
  e.preventDefault();
  const it = itemById(st.drag); st.drag = null;
  if (!it || !canEdit(boardOf(it))) return;
  if (z.dataset.drop === 'lane') setVal(it, z.dataset.col, z.dataset.opt || null);
  else if (z.dataset.drop === 'day') setVal(it, z.dataset.col, z.dataset.date);
  else if (z.dataset.drop === 'undated') setVal(it, z.dataset.col, null);
});
let lastW = window.innerWidth;
window.addEventListener('resize', () => { if (window.innerWidth !== lastW) { lastW = window.innerWidth; if (st.pop) { st.pop = null; renderPop(); } } });

boot();
})();
