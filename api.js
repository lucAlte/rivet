/* Rivet · couche d'accès aux données (Supabase).
   Toute la sécurité est appliquée côté base par les règles RLS de schema.sql :
   ce fichier ne fait qu'appeler l'API, il ne décide d'aucun droit. */
(function () {
  'use strict';
  const cfg = window.RIVET_CONFIG || {};
  const initialHash = location.hash || '';
  const looksSet =
    typeof cfg.SUPABASE_URL === 'string' && /^https:\/\/[^\s]+$/.test(cfg.SUPABASE_URL) && !/VOTRE-PROJET/.test(cfg.SUPABASE_URL) &&
    typeof cfg.SUPABASE_ANON_KEY === 'string' && cfg.SUPABASE_ANON_KEY.length > 30 && !/VOTRE-CLE/.test(cfg.SUPABASE_ANON_KEY);

  const sb = looksSet && window.supabase
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        // Flux « implicit » : un lien d'invitation envoyé depuis le navigateur d'un admin
        // doit pouvoir être ouvert dans le navigateur de l'invité.
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
      })
    : null;

  const siteUrl = () => location.origin + location.pathname.replace(/index\.html$/, '');
  const ok = (r) => { if (r.error) throw r.error; return r.data; };
  const one = (r) => { const d = ok(r); return Array.isArray(d) ? d[0] || null : d; };

  const api = {
    configured: !!sb,
    initialRecovery: /type=recovery/.test(initialHash),
    siteUrl,
    inviteLink: (token) => siteUrl() + '?invite=' + token,
    loginLink: (slug) => siteUrl() + '?org=' + encodeURIComponent(slug),

    /* ---------- Authentification ---------- */
    onAuth(cb) { return sb.auth.onAuthStateChange(cb); },
    async session() { return ok(await sb.auth.getSession()).session; },
    async signIn(email, password) { return ok(await sb.auth.signInWithPassword({ email, password })); },
    async signUp({ email, password, fullName, pendingOrg, inviteToken }) {
      return ok(await sb.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: siteUrl() + (inviteToken ? '?invite=' + inviteToken : ''),
          data: { full_name: fullName, password_set: true, pending_org: pendingOrg || null, invite_token: inviteToken || null },
        },
      }));
    },
    async signOut() { await sb.auth.signOut(); },
    async sendReset(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: siteUrl() })); },
    async updateUser(attrs) { return ok(await sb.auth.updateUser(attrs)).user; },

    /* ---------- Instances (entreprises) ---------- */
    async orgLookup(slug) { return one(await sb.rpc('org_lookup', { p_slug: slug })); },
    async slugAvailable(slug) { return ok(await sb.rpc('slug_available', { p_slug: slug })); },
    async createOrg(name, slug, trade) { return ok(await sb.rpc('create_org', { p_name: name, p_slug: slug, p_trade: trade })); },
    async myOrgs(userId) {
      const rows = ok(await sb.from('memberships').select('role, color, org:organizations(id, slug, name, trade)').eq('user_id', userId));
      return rows.filter((m) => m.org);
    },
    async updateOrg(id, patch) { ok(await sb.from('organizations').update(patch).eq('id', id)); },

    async loadOrg(orgId) {
      const [members, workspaces, boards, wsAccess, boardAccess, items] = await Promise.all([
        sb.rpc('org_members', { p_org: orgId }),
        sb.from('workspaces').select('*').eq('org_id', orgId).order('position').order('created_at'),
        sb.from('boards').select('*').eq('org_id', orgId).order('position').order('created_at'),
        sb.from('workspace_access').select('*').eq('org_id', orgId),
        sb.from('board_access').select('*').eq('org_id', orgId),
        sb.from('items').select('*').eq('org_id', orgId).order('position').limit(5000),
      ]);
      return {
        members: ok(members), workspaces: ok(workspaces), boards: ok(boards),
        wsAccess: ok(wsAccess), boardAccess: ok(boardAccess), items: ok(items),
      };
    },

    /* ---------- Espaces, tableaux, éléments ---------- */
    async insertWorkspace(row) { return one(await sb.from('workspaces').insert(row).select()); },
    async updateWorkspace(id, patch) { ok(await sb.from('workspaces').update(patch).eq('id', id)); },
    async deleteWorkspace(id) { ok(await sb.from('workspaces').delete().eq('id', id)); },
    async insertBoard(row) { return one(await sb.from('boards').insert(row).select()); },
    async updateBoard(id, patch) { ok(await sb.from('boards').update(patch).eq('id', id)); },
    async deleteBoard(id) { ok(await sb.from('boards').delete().eq('id', id)); },
    async insertItem(row) { return one(await sb.from('items').insert(row).select()); },
    async updateItem(id, patch) { ok(await sb.from('items').update(patch).eq('id', id)); },
    // Mise à jour atomique d'un seul champ : deux techniciens peuvent modifier la même fiche sans s'écraser.
    async setItemValue(id, key, value) { ok(await sb.rpc('set_item_value', { p_item: id, p_key: key, p_value: value === undefined ? null : value })); },
    async deleteItem(id) { ok(await sb.from('items').delete().eq('id', id)); },
    async deleteGroupItems(boardId, groupId) { ok(await sb.from('items').delete().eq('board_id', boardId).eq('group_id', groupId)); },
    async listUpdates(itemId) { return ok(await sb.from('item_updates').select('*').eq('item_id', itemId).order('created_at', { ascending: false })); },
    async addUpdate(itemId, body) { return one(await sb.from('item_updates').insert({ item_id: itemId, body }).select()); },

    /* ---------- Droits d'accès ---------- */
    async setWsAccess(wsId, userId, level) {
      if (level === 'none') ok(await sb.from('workspace_access').delete().eq('workspace_id', wsId).eq('user_id', userId));
      else ok(await sb.from('workspace_access').upsert({ workspace_id: wsId, user_id: userId, level }, { onConflict: 'workspace_id,user_id' }));
    },
    async setBoardAccess(boardId, userId, level) {
      if (level === 'inherit') ok(await sb.from('board_access').delete().eq('board_id', boardId).eq('user_id', userId));
      else ok(await sb.from('board_access').upsert({ board_id: boardId, user_id: userId, level }, { onConflict: 'board_id,user_id' }));
    },

    /* ---------- Équipe & invitations ---------- */
    async setRole(orgId, userId, role) { ok(await sb.rpc('set_member_role', { p_org: orgId, p_user: userId, p_role: role })); },
    async removeMember(orgId, userId) { ok(await sb.rpc('remove_member', { p_org: orgId, p_user: userId })); },
    async updateProfile(userId, fullName) { ok(await sb.from('profiles').update({ full_name: fullName }).eq('id', userId)); },
    async listInvitations(orgId) { return ok(await sb.from('invitations').select('*').eq('org_id', orgId).order('created_at', { ascending: false })); },
    async invite(orgId, email, role) { return ok(await sb.rpc('invite_member', { p_org: orgId, p_email: email, p_role: role })); },
    // Envoie le lien d'invitation par e-mail (modèle « Magic Link » ou « Confirm signup » de Supabase).
    async sendInviteEmail(email, token) {
      ok(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: siteUrl() + '?invite=' + token, shouldCreateUser: true } }));
    },
    async revokeInvitation(id) { ok(await sb.from('invitations').delete().eq('id', id)); },
    async invitationInfo(token) { return one(await sb.rpc('invitation_info', { p_token: token })); },
    async acceptInvitation(token) { return ok(await sb.rpc('accept_invitation', { p_token: token })); },
    async myInvites() { return ok(await sb.rpc('my_pending_invitations')) || []; },

    /* ---------- Temps réel ---------- */
    subscribe(orgId, onChange) {
      const f = 'org_id=eq.' + orgId;
      const ch = sb.channel('org-' + orgId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items', filter: f }, (p) => onChange('items', 'INSERT', p.new))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter: f }, (p) => onChange('items', 'UPDATE', p.new))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' }, (p) => onChange('items', 'DELETE', p.old))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boards', filter: f }, (p) => onChange('boards', 'UPDATE', p.new))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'boards' }, (p) => onChange('boards', 'DELETE', p.old))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'item_updates', filter: f }, (p) => onChange('item_updates', 'INSERT', p.new))
        .subscribe();
      return () => { try { sb.removeChannel(ch); } catch (e) { /* ignoré */ } };
    },
  };

  // Point d'injection pour les tests automatisés (non utilisé en production).
  window.RivetAPI = window.__RIVET_TEST_API || api;
})();
