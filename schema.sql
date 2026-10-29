-- =====================================================================
-- Rivet · schéma Supabase
-- À exécuter une fois : Supabase → SQL Editor → New query → coller → Run.
-- Le script peut être relancé sans risque (idempotent).
--
-- Modèle :
--   organizations  = une « instance de travail » (une entreprise)
--   memberships    = un utilisateur peut appartenir à plusieurs instances
--   invitations    = rejoindre une instance passe par une invitation
--   workspaces → boards → items (items.parent_id = sous-éléments)
--   workspace_access / board_access = droits individuels (lecture / édition)
-- Toutes les règles d'accès sont appliquées ici par RLS.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null default '',
  full_name   text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  name        text not null check (char_length(name) between 1 and 80),
  trade       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.memberships (
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'admin', 'member')),
  color       text not null default 'blue',
  created_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);

create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  email       text not null,
  role        text not null default 'member' check (role in ('admin', 'member')),
  token       uuid not null unique default gen_random_uuid(),
  invited_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (org_id, email)
);

create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  color       text not null default 'blue',
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists workspaces_org_idx on public.workspaces(org_id);

create table if not exists public.boards (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 80),
  prefix       text not null default 'INT' check (prefix ~ '^[A-Z0-9]{1,4}$'),
  noun         jsonb not null default '{}'::jsonb,
  column_defs  jsonb not null default '[]'::jsonb,
  group_defs   jsonb not null default '[]'::jsonb,
  seq          integer not null default 0,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists boards_org_idx on public.boards(org_id);
create index if not exists boards_ws_idx on public.boards(workspace_id);

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  board_id    uuid not null references public.boards(id) on delete cascade,
  parent_id   uuid references public.items(id) on delete cascade,
  group_id    text,
  num         integer,
  name        text not null default '' check (char_length(name) <= 300),
  data        jsonb not null default '{}'::jsonb,
  position    double precision not null default 0,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists items_org_idx on public.items(org_id);
create index if not exists items_board_idx on public.items(board_id);
create index if not exists items_parent_idx on public.items(parent_id);

create table if not exists public.item_updates (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  board_id    uuid not null references public.boards(id) on delete cascade,
  item_id     uuid not null references public.items(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);
create index if not exists item_updates_item_idx on public.item_updates(item_id);

create table if not exists public.workspace_access (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  org_id       uuid not null references public.organizations(id) on delete cascade,
  level        text not null check (level in ('view', 'edit')),
  primary key (workspace_id, user_id)
);

create table if not exists public.board_access (
  board_id     uuid not null references public.boards(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  org_id       uuid not null references public.organizations(id) on delete cascade,
  level        text not null check (level in ('none', 'view', 'edit')),
  primary key (board_id, user_id)
);

-- ---------------------------------------------------------------------
-- Fonctions de droits (security definer : lisent les tables sans RLS,
-- ce qui évite toute récursion dans les règles)
-- ---------------------------------------------------------------------
create or replace function public.is_org_member(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = p_org and user_id = auth.uid());
$$;

create or replace function public.is_org_admin(p_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = p_org and user_id = auth.uid() and role in ('owner', 'admin'));
$$;

create or replace function public.shares_org(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships a join memberships b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

-- Niveau d'accès calculé à partir des colonnes de la ligne (utilisable pendant un INSERT,
-- quand la ligne n'est pas encore visible pour une relecture).
create or replace function public.ws_level_of(p_ws uuid, p_org uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare v_lvl text;
begin
  if public.is_org_admin(p_org) then return 'edit'; end if;
  if not public.is_org_member(p_org) then return 'none'; end if;
  select level into v_lvl from workspace_access where workspace_id = p_ws and user_id = auth.uid();
  return coalesce(v_lvl, 'none');
end $$;

create or replace function public.board_level_of(p_board uuid, p_ws uuid, p_org uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare v_lvl text;
begin
  if public.is_org_admin(p_org) then return 'edit'; end if;
  if not public.is_org_member(p_org) then return 'none'; end if;
  select level into v_lvl from board_access where board_id = p_board and user_id = auth.uid();
  if v_lvl is not null then return v_lvl; end if;
  return public.ws_level_of(p_ws, p_org);
end $$;

create or replace function public.ws_level(p_ws uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from workspaces where id = p_ws;
  if v_org is null then return 'none'; end if;
  return public.ws_level_of(p_ws, v_org);
end $$;

create or replace function public.board_level(p_board uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare v_org uuid; v_ws uuid;
begin
  select org_id, workspace_id into v_org, v_ws from boards where id = p_board;
  if v_org is null then return 'none'; end if;
  return public.board_level_of(p_board, v_ws, v_org);
end $$;

-- ---------------------------------------------------------------------
-- Déclencheurs : les colonnes sensibles sont fixées par la base,
-- jamais par le navigateur
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end $$;
drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_user_email_change();

create or replace function public.tg_org_bu() returns trigger language plpgsql as $$
begin
  new.slug := old.slug;               -- l'identifiant de connexion ne change jamais
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end $$;
drop trigger if exists org_bu on public.organizations;
create trigger org_bu before update on public.organizations for each row execute function public.tg_org_bu();

create or replace function public.tg_profiles_bu() returns trigger language plpgsql as $$
begin
  new.email := old.email;             -- l'e-mail suit auth.users uniquement
  new.created_at := old.created_at;
  return new;
end $$;
drop trigger if exists profiles_bu on public.profiles;
create trigger profiles_bu before update on public.profiles for each row
  when (pg_trigger_depth() = 0) execute function public.tg_profiles_bu();

create or replace function public.tg_boards_bi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select org_id into new.org_id from workspaces where id = new.workspace_id;
  if new.org_id is null then raise exception 'workspace_not_found'; end if;
  new.seq := 0;
  new.created_at := now();
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists boards_bi on public.boards;
create trigger boards_bi before insert on public.boards for each row execute function public.tg_boards_bi();

create or replace function public.tg_boards_bu() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  if new.workspace_id <> old.workspace_id then
    select org_id into v_org from workspaces where id = new.workspace_id;
    if v_org is distinct from old.org_id then raise exception 'cross_org'; end if;
  end if;
  new.org_id := old.org_id;
  new.created_at := old.created_at;
  -- Le compteur de numéros n'évolue que via le déclencheur des éléments.
  if pg_trigger_depth() <= 1 then new.seq := old.seq; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists boards_bu on public.boards;
create trigger boards_bu before update on public.boards for each row execute function public.tg_boards_bu();

create or replace function public.tg_items_bi() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_org uuid;
begin
  select org_id into v_org from boards where id = new.board_id;
  if v_org is null then raise exception 'board_not_found'; end if;
  new.org_id := v_org;
  new.created_by := auth.uid();
  new.created_at := now();
  new.updated_at := now();
  if new.parent_id is null then
    update boards set seq = seq + 1 where id = new.board_id returning seq into new.num;
  else
    if not exists (select 1 from items where id = new.parent_id and board_id = new.board_id and parent_id is null) then
      raise exception 'parent_mismatch';
    end if;
    new.num := null;
    new.group_id := null;
  end if;
  return new;
end $$;
drop trigger if exists items_bi on public.items;
create trigger items_bi before insert on public.items for each row execute function public.tg_items_bi();

create or replace function public.tg_items_bu() returns trigger language plpgsql as $$
begin
  new.org_id := old.org_id;
  new.board_id := old.board_id;
  new.parent_id := old.parent_id;
  new.num := old.num;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists items_bu on public.items;
create trigger items_bu before update on public.items for each row execute function public.tg_items_bu();

create or replace function public.tg_updates_bi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select org_id, board_id into new.org_id, new.board_id from items where id = new.item_id;
  if new.org_id is null then raise exception 'item_not_found'; end if;
  new.author_id := auth.uid();
  new.created_at := now();
  return new;
end $$;
drop trigger if exists item_updates_bi on public.item_updates;
create trigger item_updates_bi before insert on public.item_updates for each row execute function public.tg_updates_bi();

create or replace function public.tg_ws_access_bi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select org_id into new.org_id from workspaces where id = new.workspace_id;
  if not exists (select 1 from memberships where org_id = new.org_id and user_id = new.user_id) then
    raise exception 'not_member';
  end if;
  return new;
end $$;
drop trigger if exists ws_access_bi on public.workspace_access;
create trigger ws_access_bi before insert on public.workspace_access for each row execute function public.tg_ws_access_bi();

create or replace function public.tg_board_access_bi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select org_id into new.org_id from boards where id = new.board_id;
  if not exists (select 1 from memberships where org_id = new.org_id and user_id = new.user_id) then
    raise exception 'not_member';
  end if;
  return new;
end $$;
drop trigger if exists board_access_bi on public.board_access;
create trigger board_access_bi before insert on public.board_access for each row execute function public.tg_board_access_bi();

-- ---------------------------------------------------------------------
-- Fonctions appelées par l'application (RPC)
-- ---------------------------------------------------------------------

-- Écran de connexion : vérifier qu'une instance existe (accessible sans compte).
create or replace function public.org_lookup(p_slug text)
returns table (id uuid, name text, slug text)
language sql stable security definer set search_path = public as $$
  select o.id, o.name, o.slug from organizations o where o.slug = lower(trim(p_slug));
$$;

create or replace function public.slug_available(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from organizations where slug = lower(trim(p_slug)));
$$;

-- Création d'une instance : le créateur en devient propriétaire.
create or replace function public.create_org(p_name text, p_slug text, p_trade text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into profiles (id, email) values (auth.uid(), coalesce(auth.jwt() ->> 'email', '')) on conflict (id) do nothing;
  insert into organizations (name, slug, trade, created_by)
  values (trim(p_name), lower(trim(p_slug)), p_trade, auth.uid())
  returning id into v_id;
  insert into memberships (org_id, user_id, role, color) values (v_id, auth.uid(), 'owner', 'violet');
  return v_id;
end $$;

create or replace function public.org_members(p_org uuid)
returns table (user_id uuid, email text, full_name text, role text, color text, joined_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, p.email, p.full_name, m.role, m.color, m.created_at
  from memberships m join profiles p on p.id = m.user_id
  where m.org_id = p_org and public.is_org_member(p_org)
  order by m.created_at;
$$;

create or replace function public.set_member_role(p_org uuid, p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  if p_role not in ('admin', 'member') then raise exception 'invalid_role'; end if;
  if exists (select 1 from memberships where org_id = p_org and user_id = p_user and role = 'owner') then
    raise exception 'owner_locked';
  end if;
  update memberships set role = p_role where org_id = p_org and user_id = p_user;
end $$;

create or replace function public.remove_member(p_org uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  if exists (select 1 from memberships where org_id = p_org and user_id = p_user and role = 'owner') then
    raise exception 'owner_locked';
  end if;
  delete from workspace_access where org_id = p_org and user_id = p_user;
  delete from board_access where org_id = p_org and user_id = p_user;
  delete from memberships where org_id = p_org and user_id = p_user;
end $$;

-- Invitation : renvoie le jeton à placer dans le lien envoyé par e-mail.
create or replace function public.invite_member(p_org uuid, p_email text, p_role text default 'member') returns uuid
language plpgsql security definer set search_path = public as $$
declare v_token uuid; v_email text := lower(trim(p_email));
begin
  if not public.is_org_admin(p_org) then raise exception 'forbidden'; end if;
  if p_role not in ('admin', 'member') then raise exception 'invalid_role'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'invalid_email'; end if;
  if exists (
    select 1 from memberships m join profiles p on p.id = m.user_id
    where m.org_id = p_org and lower(p.email) = v_email
  ) then raise exception 'already_member'; end if;
  insert into invitations (org_id, email, role, invited_by)
  values (p_org, v_email, p_role, auth.uid())
  on conflict (org_id, email) do update
    set role = excluded.role, token = gen_random_uuid(), invited_by = auth.uid(), created_at = now(), accepted_at = null
  returning token into v_token;
  return v_token;
end $$;

-- Page d'arrivée d'une invitation (accessible sans compte, à partir du jeton).
create or replace function public.invitation_info(p_token uuid)
returns table (org_id uuid, org_name text, org_slug text, email text, role text, accepted boolean)
language sql stable security definer set search_path = public as $$
  select i.org_id, o.name, o.slug, i.email, i.role, i.accepted_at is not null
  from invitations i join organizations o on o.id = i.org_id
  where i.token = p_token;
$$;

create or replace function public.accept_invitation(p_token uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_inv invitations%rowtype; v_n int; v_color text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into v_inv from invitations where token = p_token;
  if not found then raise exception 'invalid_invitation'; end if;
  if lower(v_inv.email) <> lower(coalesce(auth.jwt() ->> 'email', '')) then raise exception 'wrong_account'; end if;
  insert into profiles (id, email) values (auth.uid(), coalesce(auth.jwt() ->> 'email', '')) on conflict (id) do nothing;
  select count(*) into v_n from memberships where org_id = v_inv.org_id;
  v_color := (array['blue', 'green', 'orange', 'red', 'yellow', 'grey', 'violet'])[1 + (v_n % 7)];
  insert into memberships (org_id, user_id, role, color)
  values (v_inv.org_id, auth.uid(), v_inv.role, v_color)
  on conflict (org_id, user_id) do nothing;
  update invitations set accepted_at = coalesce(accepted_at, now()) where id = v_inv.id;
  return v_inv.org_id;
end $$;

create or replace function public.my_pending_invitations()
returns table (token uuid, org_id uuid, org_name text, org_slug text, role text)
language sql stable security definer set search_path = public as $$
  select i.token, i.org_id, o.name, o.slug, i.role
  from invitations i join organizations o on o.id = i.org_id
  where lower(i.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and i.accepted_at is null
    and not exists (select 1 from memberships m where m.org_id = i.org_id and m.user_id = auth.uid())
  order by i.created_at desc;
$$;

-- Modifie un seul champ d'un élément (les droits RLS s'appliquent : security invoker).
create or replace function public.set_item_value(p_item uuid, p_key text, p_value jsonb) returns void
language sql security invoker set search_path = public as $$
  update items
     set data = case when p_value is null or p_value = 'null'::jsonb then data - p_key
                     else jsonb_set(data, array[p_key], p_value, true) end
   where id = p_item;
$$;

-- ---------------------------------------------------------------------
-- Règles RLS
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.organizations    enable row level security;
alter table public.memberships      enable row level security;
alter table public.invitations      enable row level security;
alter table public.workspaces       enable row level security;
alter table public.boards           enable row level security;
alter table public.items            enable row level security;
alter table public.item_updates     enable row level security;
alter table public.workspace_access enable row level security;
alter table public.board_access     enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (id = auth.uid() or public.shares_org(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations for select using (public.is_org_member(id));
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships for select using (public.is_org_member(org_id));

drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations for select
  using (public.is_org_admin(org_id) or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists invitations_delete on public.invitations;
create policy invitations_delete on public.invitations for delete using (public.is_org_admin(org_id));

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces for select using (
  public.ws_level_of(id, org_id) <> 'none'
  or exists (select 1 from boards b where b.workspace_id = workspaces.id)  -- RLS des tableaux appliquée
);
drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces for insert with check (public.is_org_admin(org_id));
drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces for delete using (public.is_org_admin(org_id));

drop policy if exists boards_select on public.boards;
create policy boards_select on public.boards for select using (public.board_level_of(id, workspace_id, org_id) <> 'none');
drop policy if exists boards_insert on public.boards;
create policy boards_insert on public.boards for insert with check (public.ws_level(workspace_id) = 'edit');
drop policy if exists boards_update on public.boards;
create policy boards_update on public.boards for update using (public.board_level_of(id, workspace_id, org_id) = 'edit') with check (public.board_level_of(id, workspace_id, org_id) = 'edit');
drop policy if exists boards_delete on public.boards;
create policy boards_delete on public.boards for delete using (public.ws_level(workspace_id) = 'edit');

drop policy if exists items_select on public.items;
create policy items_select on public.items for select using (public.board_level(board_id) <> 'none');
drop policy if exists items_insert on public.items;
create policy items_insert on public.items for insert with check (public.board_level(board_id) = 'edit');
drop policy if exists items_update on public.items;
create policy items_update on public.items for update using (public.board_level(board_id) = 'edit') with check (public.board_level(board_id) = 'edit');
drop policy if exists items_delete on public.items;
create policy items_delete on public.items for delete using (public.board_level(board_id) = 'edit');

drop policy if exists item_updates_select on public.item_updates;
create policy item_updates_select on public.item_updates for select using (public.board_level(board_id) <> 'none');
drop policy if exists item_updates_insert on public.item_updates;
create policy item_updates_insert on public.item_updates for insert with check (public.board_level(board_id) = 'edit' and author_id = auth.uid());
drop policy if exists item_updates_delete on public.item_updates;
create policy item_updates_delete on public.item_updates for delete using (author_id = auth.uid() or public.is_org_admin(org_id));

drop policy if exists ws_access_select on public.workspace_access;
create policy ws_access_select on public.workspace_access for select using (user_id = auth.uid() or public.is_org_admin(org_id));
drop policy if exists ws_access_insert on public.workspace_access;
create policy ws_access_insert on public.workspace_access for insert with check (public.is_org_admin(org_id));
drop policy if exists ws_access_update on public.workspace_access;
create policy ws_access_update on public.workspace_access for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
drop policy if exists ws_access_delete on public.workspace_access;
create policy ws_access_delete on public.workspace_access for delete using (public.is_org_admin(org_id));

drop policy if exists board_access_select on public.board_access;
create policy board_access_select on public.board_access for select using (user_id = auth.uid() or public.is_org_admin(org_id));
drop policy if exists board_access_insert on public.board_access;
create policy board_access_insert on public.board_access for insert with check (public.is_org_admin(org_id));
drop policy if exists board_access_update on public.board_access;
create policy board_access_update on public.board_access for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
drop policy if exists board_access_delete on public.board_access;
create policy board_access_delete on public.board_access for delete using (public.is_org_admin(org_id));

-- ---------------------------------------------------------------------
-- Privilèges : les visiteurs non connectés n'accèdent qu'aux 3 fonctions
-- nécessaires aux écrans de connexion et d'invitation
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
grant execute on function public.org_lookup(text), public.slug_available(text), public.invitation_info(uuid) to anon;

-- ---------------------------------------------------------------------
-- Temps réel : diffuse les changements d'éléments aux autres membres
-- ---------------------------------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.items;        exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.boards;       exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.item_updates; exception when duplicate_object then null; end;
end $$;
