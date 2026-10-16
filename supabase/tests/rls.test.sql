-- Tests des politiques RLS et des contraintes du schéma : « npm run test:db » (Supabase local, Docker requis)
begin;
create extension if not exists pgtap with schema extensions;

select plan(34);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.local'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.local'),
  ('33333333-3333-3333-3333-333333333333', 'doc@test.local');

-- Agit en tant qu'utilisateur connecté (rôle « authenticated » et jeton JWT simulé)
create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end;
$$;

-- ===== Profil =====
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ insert into public.profiles (user_id, data) values ('11111111-1111-1111-1111-111111111111',
     '{"name":"Alice","glucoseUnit":"g/L","targetGlucose":1,"isf":0.4}') $$,
  'le patient crée son profil'
);
select throws_ok(
  $$ insert into public.profiles (user_id, data) values ('22222222-2222-2222-2222-222222222222',
     '{"name":"Bob","glucoseUnit":"g/L","targetGlucose":1,"isf":0.4}') $$,
  '42501', null, 'impossible de créer le profil d''un autre compte'
);
select throws_ok(
  $$ update public.profiles set data = data || '{"glucoseUnit":"mmol/L"}' $$,
  '23514', null, 'unité glycémique inconnue refusée'
);
select throws_ok(
  $$ update public.profiles set data = data || '{"isf":0}' $$,
  '23514', null, 'ISF nul refusé'
);
select throws_ok(
  $$ update public.profiles set data = data || '{"targetGlucose":"1"}' $$,
  '23514', null, 'cible glycémique non numérique refusée'
);
select throws_ok(
  $$ update public.profiles set data = data || '{"name":""}' $$,
  '23514', null, 'nom vide refusé'
);
select throws_ok(
  $$ update public.profiles set data = data - 'name' $$,
  '23514', null, 'profil sans nom refusé'
);
select throws_ok(
  $$ update public.profiles set data = data - 'glucoseUnit' $$,
  '23514', null, 'profil sans unité glycémique refusé'
);

-- ===== Repas =====
select lives_ok(
  $$ insert into public.meals (user_id, id, data) values ('11111111-1111-1111-1111-111111111111', 'meal-1',
     '{"meal_name":"Couscous","total_carbs":80,"created_at":"2026-10-16T12:00:00Z"}') $$,
  'le patient enregistre un repas'
);
select lives_ok(
  $$ insert into public.meals (user_id, id, data) values ('11111111-1111-1111-1111-111111111111', 'meal-1',
     '{"meal_name":"Couscous","total_carbs":85,"created_at":"2026-10-16T12:00:00Z"}')
     on conflict (user_id, id) do update set data = excluded.data $$,
  'renvoyer le même repas (upsert) ne crée pas de doublon'
);
select is(
  (select count(*) from public.meals), 1::bigint, 'un seul repas après l''upsert'
);
select throws_ok(
  $$ insert into public.meals (user_id, id, data) values ('11111111-1111-1111-1111-111111111111', 'meal-2',
     '{"meal_name":"Trop","total_carbs":1500,"created_at":"2026-10-16T12:00:00Z"}') $$,
  '23514', null, 'glucides hors bornes refusés'
);
select throws_ok(
  $$ insert into public.meals (user_id, id, data) values ('11111111-1111-1111-1111-111111111111', 'meal-3',
     '{"meal_name":"Texte","total_carbs":"80","created_at":"2026-10-16T12:00:00Z"}') $$,
  '23514', null, 'glucides non numériques refusés'
);
select throws_ok(
  $$ insert into public.meals (user_id, id, data) values ('11111111-1111-1111-1111-111111111111', 'meal-4',
     '{"meal_name":"Sans date","total_carbs":10}') $$,
  '23514', null, 'repas sans date refusé'
);
select throws_ok(
  $$ insert into public.meals (user_id, id, data) values ('11111111-1111-1111-1111-111111111111', 'meal-5',
     '{"total_carbs":10,"timestamp":"2026-10-16T12:00:00Z"}') $$,
  '23514', null, 'repas sans nom refusé'
);
select throws_ok(
  $$ insert into public.meals (user_id, id, data) values ('11111111-1111-1111-1111-111111111111', 'a/b',
     '{"meal_name":"Id","total_carbs":10,"timestamp":"2026-10-16T12:00:00Z"}') $$,
  '23514', null, 'identifiant de repas invalide refusé'
);
select throws_ok(
  $$ insert into public.meals (user_id, id, data) values ('22222222-2222-2222-2222-222222222222', 'meal-x',
     '{"meal_name":"Intrus","total_carbs":10,"timestamp":"2026-10-16T12:00:00Z"}') $$,
  '42501', null, 'impossible d''écrire un repas dans le dossier d''un autre compte'
);

-- ===== Accès d'un tiers et d'un médecin délégué =====
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select is((select count(*) from public.meals), 0::bigint, 'un tiers ne voit pas les repas du patient');
select is((select count(*) from public.profiles), 0::bigint, 'un tiers ne voit pas le profil du patient');
select throws_ok(
  $$ insert into public.delegates (patient_id, delegate_id) values
     ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222') $$,
  '42501', null, 'un tiers ne peut pas s''ajouter comme délégué'
);

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select lives_ok(
  $$ insert into public.delegates (patient_id, delegate_id) values
     ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333') $$,
  'le patient délègue l''accès à son médecin'
);

select pg_temp.act_as('33333333-3333-3333-3333-333333333333');
select is((select count(*) from public.meals), 1::bigint, 'le médecin délégué lit les repas');
select is((select count(*) from public.profiles), 1::bigint, 'le médecin délégué lit le profil');
update public.meals set data = data || '{"total_carbs":5}';
select throws_ok(
  $$ insert into public.meals (user_id, id, data) values ('11111111-1111-1111-1111-111111111111', 'meal-doc',
     '{"meal_name":"Ajout","total_carbs":10,"timestamp":"2026-10-16T12:00:00Z"}') $$,
  '42501', null, 'le médecin délégué ne peut pas ajouter de repas'
);

select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select is(
  (select (data ->> 'total_carbs')::numeric from public.meals where id = 'meal-1'), 85::numeric,
  'le médecin délégué ne peut pas modifier un repas'
);

-- ===== Codes de transfert =====
select lives_ok(
  $$ insert into public.sync_codes (code, creator_id, user_profile, meals, expires_at) values
     ('GLUCO-7K2X-9B4F-QM3T-H8WZ', '11111111-1111-1111-1111-111111111111', '{"name":"A"}', '[]', now() + interval '7 days') $$,
  'le créateur enregistre un code'
);
select throws_ok(
  $$ insert into public.sync_codes (code, creator_id, expires_at) values
     ('GLUCO-AAAA-BBBB-CCCC-DDDD', '11111111-1111-1111-1111-111111111111', now() + interval '30 days') $$,
  '42501', null, 'validité de plus de 8 jours refusée'
);
select throws_ok(
  $$ insert into public.sync_codes (code, creator_id, user_profile, expires_at) values
     ('GLUCO-AAAA-BBBB-CCCC-DDDD', '11111111-1111-1111-1111-111111111111', '{"cgmConfig":{"apiKey":"x"}}', now() + interval '7 days') $$,
  '23514', null, 'un profil contenant des secrets CGM est refusé'
);

select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select throws_ok(
  $$ insert into public.sync_codes (code, creator_id, expires_at) values
     ('GLUCO-7K2X-9B4F-QM3T-H8WZ', '22222222-2222-2222-2222-222222222222', now() + interval '7 days')
     on conflict (code) do update set creator_id = excluded.creator_id, expires_at = excluded.expires_at $$,
  '42501', null, 'un autre compte ne peut pas écraser le code'
);
select is((select count(*) from public.sync_codes), 0::bigint, 'un autre compte ne peut pas lister les codes');
select is(
  (select count(*) from public.get_sync_code('GLUCO-7K2X-9B4F-QM3T-H8WZ')), 1::bigint,
  'toute personne connectée qui connaît le code lit le dossier'
);

reset role;
update public.sync_codes set expires_at = now() - interval '1 second';
select pg_temp.act_as('22222222-2222-2222-2222-222222222222');
select is(
  (select count(*) from public.get_sync_code('GLUCO-7K2X-9B4F-QM3T-H8WZ')), 0::bigint,
  'un code expiré n''est plus lisible'
);

reset role;
set local role anon;
select throws_ok(
  $$ select * from public.get_sync_code('GLUCO-7K2X-9B4F-QM3T-H8WZ') $$,
  '42501', null, 'un visiteur non connecté ne peut pas lire un code'
);

-- ===== Droit à l'effacement =====
reset role;
select pg_temp.act_as('11111111-1111-1111-1111-111111111111');
select public.delete_own_account();
reset role;
select is(
  (select count(*) from public.meals where user_id = '11111111-1111-1111-1111-111111111111')
    + (select count(*) from public.profiles where user_id = '11111111-1111-1111-1111-111111111111')
    + (select count(*) from public.delegates where patient_id = '11111111-1111-1111-1111-111111111111')
    + (select count(*) from public.sync_codes where creator_id = '11111111-1111-1111-1111-111111111111')
    + (select count(*) from auth.users where id = '11111111-1111-1111-1111-111111111111'),
  0::bigint,
  'supprimer son compte efface profil, repas, délégations et codes'
);

select * from finish();
rollback;
