-- Schéma GlucoMeal.ai : profils, repas, délégations médicales et codes de transfert inter-appareils.
-- Chaque ligne appartient à un compte Supabase Auth (anonyme ou e-mail) ; l'accès est contrôlé par RLS.
-- L'objet de l'application est conservé tel quel dans « data » ; les champs critiques sont validés par CHECK.

-- Fonctions internes, hors du schéma exposé par l'API
create schema if not exists private;
grant usage on schema private to authenticated;

-- Les contraintes CHECK passent quand elles valent NULL (champ absent) : chaque test renvoie donc
-- toujours vrai ou faux.

-- Vrai si la valeur JSON est une chaîne de longueur comprise entre min_len et max_len
create function private.is_string_between(value jsonb, min_len int, max_len int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(value) = 'string'
    then char_length(value #>> '{}') between min_len and max_len
    else false
  end;
$$;

-- Vrai si la valeur JSON est un nombre strictement positif (évaluation sûre : jamais de cast sur du texte)
create function private.is_positive_number(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case when jsonb_typeof(value) = 'number' then (value #>> '{}')::numeric > 0 else false end;
$$;

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- --- Profil patient ---
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  constraint profiles_name_valid check (private.is_string_between(data -> 'name', 1, 100)),
  constraint profiles_glucose_unit_valid check (coalesce(data ->> 'glucoseUnit' in ('g/L', 'mg/dL'), false)),
  constraint profiles_target_glucose_valid check (private.is_positive_number(data -> 'targetGlucose')),
  constraint profiles_isf_valid check (private.is_positive_number(data -> 'isf'))
);

-- --- Repas et calculs de bolus ---
create table public.meals (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null check (id ~ '^[A-Za-z0-9_-]{1,128}$'),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint meals_name_valid check (private.is_string_between(data -> 'meal_name', 1, 250)),
  constraint meals_total_carbs_valid check (
    case when jsonb_typeof(data -> 'total_carbs') = 'number'
      then (data ->> 'total_carbs')::numeric between 0 and 1000
      else false
    end
  ),
  constraint meals_date_present check (
    coalesce(jsonb_typeof(data -> 'created_at'), '') = 'string'
    or coalesce(jsonb_typeof(data -> 'timestamp'), '') = 'string'
  )
);

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger meals_touch_updated_at before update on public.meals
  for each row execute function private.touch_updated_at();

-- --- Délégations d'accès pour médecins et soignants (lecture seule, révocable par le patient) ---
create table public.delegates (
  patient_id uuid not null references auth.users (id) on delete cascade,
  delegate_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (patient_id, delegate_id),
  check (patient_id <> delegate_id)
);
create index delegates_delegate_id_idx on public.delegates (delegate_id);

-- security definer : évite la récursion RLS lors de la lecture de « delegates » depuis une autre politique
create function private.is_delegate(patient uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.delegates d
    where d.patient_id = patient and d.delegate_id = (select auth.uid())
  );
$$;
revoke execute on function private.is_delegate(uuid) from public;
grant execute on function private.is_delegate(uuid) to authenticated;

-- --- Codes de transfert inter-appareils (80 bits aléatoires, ex: GLUCO-7K2X-9B4F-QM3T-H8WZ) ---
create table public.sync_codes (
  code text primary key check (code ~ '^GLUCO(-[A-HJ-NP-Z2-9]{4}){4}$'),
  creator_id uuid not null references auth.users (id) on delete cascade,
  -- Le partage ne transporte jamais de secrets d'appareil (clé Nightscout, mots de passe CGM)
  user_profile jsonb not null default '{}' check (
    jsonb_typeof(user_profile) = 'object' and not user_profile ? 'cgmConfig'
  ),
  meals jsonb not null default '[]' check (jsonb_typeof(meals) = 'array'),
  learned_portions jsonb not null default '[]' check (jsonb_typeof(learned_portions) = 'array'),
  last_updated timestamptz not null default now(),
  expires_at timestamptz not null
);
create index sync_codes_creator_id_idx on public.sync_codes (creator_id);

-- --- Row Level Security ---
alter table public.profiles enable row level security;
alter table public.meals enable row level security;
alter table public.delegates enable row level security;
alter table public.sync_codes enable row level security;

create policy "profiles: lecture patient ou délégué" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_delegate(user_id));
create policy "profiles: création par le patient" on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "profiles: modification par le patient" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "profiles: suppression par le patient" on public.profiles
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "meals: lecture patient ou délégué" on public.meals
  for select to authenticated
  using (user_id = (select auth.uid()) or private.is_delegate(user_id));
create policy "meals: création par le patient" on public.meals
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "meals: modification par le patient" on public.meals
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "meals: suppression par le patient" on public.meals
  for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "delegates: lecture patient ou délégué" on public.delegates
  for select to authenticated
  using (patient_id = (select auth.uid()) or delegate_id = (select auth.uid()));
create policy "delegates: création par le patient" on public.delegates
  for insert to authenticated
  with check (patient_id = (select auth.uid()));
create policy "delegates: suppression par le patient" on public.delegates
  for delete to authenticated
  using (patient_id = (select auth.uid()));

-- Codes : seul le créateur les voit directement. La lecture par code passe par get_sync_code()
-- (une politique select ouverte permettrait de lister tous les codes valides).
create policy "sync_codes: lecture par le créateur" on public.sync_codes
  for select to authenticated
  using (creator_id = (select auth.uid()));
create policy "sync_codes: création par le créateur" on public.sync_codes
  for insert to authenticated
  with check (
    creator_id = (select auth.uid())
    and expires_at > now()
    and expires_at < now() + interval '8 days'
  );
create policy "sync_codes: modification par le créateur" on public.sync_codes
  for update to authenticated
  using (creator_id = (select auth.uid()))
  with check (
    creator_id = (select auth.uid())
    and expires_at > now()
    and expires_at < now() + interval '8 days'
  );
create policy "sync_codes: suppression par le créateur" on public.sync_codes
  for delete to authenticated
  using (creator_id = (select auth.uid()));

-- Lecture d'un dossier partagé par toute personne connectée qui connaît le code, tant qu'il n'a pas expiré
create function public.get_sync_code(p_code text)
returns table (
  code text,
  user_profile jsonb,
  meals jsonb,
  learned_portions jsonb,
  last_updated timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.code, s.user_profile, s.meals, s.learned_portions, s.last_updated, s.expires_at
  from public.sync_codes s
  where (select auth.uid()) is not null
    and s.code = p_code
    and s.expires_at > now();
$$;
revoke execute on function public.get_sync_code(text) from public, anon;
grant execute on function public.get_sync_code(text) to authenticated;

-- Droit à l'effacement : supprime le compte, et par cascade profil, repas, délégations et codes créés
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'Authentification requise' using errcode = '42501';
  end if;
  delete from auth.users where id = uid;
end;
$$;
revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- Temps réel sur les repas (insertions et mises à jour, filtrées par RLS)
alter publication supabase_realtime add table public.meals;

-- Purge quotidienne des codes de partage expirés (données de santé : aucune conservation inutile)
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'purge-expired-sync-codes',
  '17 3 * * *',
  $$delete from public.sync_codes where expires_at < now()$$
);
