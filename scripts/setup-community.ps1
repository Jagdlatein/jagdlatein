[CmdletBinding()]
param([ValidateSet('Sql','CheckSql','BlocksSql','PremoderationSql')][string]$Step = 'Sql', [switch]$NoClipboard)
$ErrorActionPreference = 'Stop'
$communityProjectRoot = Split-Path -Parent $PSScriptRoot
if ($Step -eq 'Sql') {
    $communitySql = Get-Content -LiteralPath (Join-Path $communityProjectRoot 'supabase\migrations\20261004190000_learning_community.sql') -Raw -Encoding UTF8
} elseif ($Step -eq 'BlocksSql') {
    $communitySql = Get-Content -LiteralPath (Join-Path $communityProjectRoot 'supabase\migrations\20261008140000_community_blocks.sql') -Raw -Encoding UTF8
} elseif ($Step -eq 'PremoderationSql') {
    $communitySql = Get-Content -LiteralPath (Join-Path $communityProjectRoot 'supabase\migrations\20261008160000_community_premoderation.sql') -Raw -Encoding UTF8
} else {
    $communitySql = @'
SELECT jsonb_build_object(
  'profiles_present', to_regclass('public.community_profiles') IS NOT NULL,
  'posts_present', to_regclass('public.community_posts') IS NOT NULL,
  'reports_present', to_regclass('public.community_reports') IS NOT NULL,
  'rate_limits_present', to_regclass('public.community_events') IS NOT NULL,
  'read_function_present', to_regprocedure('public.community_read(text,text,jsonb)') IS NOT NULL,
  'write_function_present', to_regprocedure('public.community_write(text,text,jsonb)') IS NOT NULL,
  'row_security_enabled', (SELECT count(*) = 4 AND bool_and(relrowsecurity) FROM pg_class WHERE oid IN
    (to_regclass('public.community_profiles'),to_regclass('public.community_posts'),to_regclass('public.community_reports'),to_regclass('public.community_events'))),
  'browser_table_access', (SELECT coalesce(bool_or(has_table_privilege(role_name,table_oid,'SELECT,INSERT,UPDATE,DELETE')),false)
    FROM (SELECT role_name,to_regclass('public.'||table_name) AS table_oid FROM unnest(ARRAY['anon','authenticated']) role_name
      CROSS JOIN unnest(ARRAY['community_profiles','community_posts','community_reports','community_events']) table_name) checks WHERE table_oid IS NOT NULL),
  'browser_function_access', (SELECT coalesce(bool_or(has_function_privilege(role_name,function_oid,'EXECUTE')),false)
    FROM (SELECT role_name,to_regprocedure(function_name) AS function_oid FROM unnest(ARRAY['anon','authenticated']) role_name
      CROSS JOIN unnest(ARRAY['public.community_read(text,text,jsonb)','public.community_write(text,text,jsonb)']) function_name) checks WHERE function_oid IS NOT NULL)
) AS community_setup;
'@
}
$communityOutput = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\community'
[void][IO.Directory]::CreateDirectory($communityOutput)
$communityFilename = if ($Step -eq 'PremoderationSql') { 'community-premoderation.sql' } elseif ($Step -eq 'BlocksSql') { 'community-blocks.sql' } elseif ($Step -eq 'CheckSql') { 'community-check.sql' } else { 'community-setup.sql' }
$communityOutputPath = Join-Path $communityOutput $communityFilename
[IO.File]::WriteAllText($communityOutputPath,$communitySql,[Text.UTF8Encoding]::new($false))
if (!$NoClipboard) { Set-Clipboard -Value $communitySql }
Write-Host ('SQL vorbereitet: ' + $communityOutputPath)
Write-Host 'Noch nicht ausgefuehrt. Vor Run das gewaehlte Supabase-Projekt pruefen.'
if ($Step -eq 'PremoderationSql') {
    Write-Host 'Neue Themen und Antworten bleiben bis zur menschlichen Freigabe privat. Bestehende Beitraege bleiben erhalten.'
    Write-Host 'Benoetigt das bereits gepruefte Konto-/Blockschema. Zuerst nur im getrennten Testprojekt anwenden.'
} elseif ($Step -eq 'BlocksSql') {
    Write-Host 'Blockierung ergaenzen; benoetigt das bereits gepruefte Konto-/Loeschschema. Zuerst nur im getrennten Testprojekt anwenden.'
} elseif ($Step -eq 'Sql') {
    Write-Host 'Es werden neue Community-Tabellen eingerichtet. Bestehende Konten und Zahlungen bleiben erhalten.'
}
