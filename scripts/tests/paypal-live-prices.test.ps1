# Disposable fake PayPal replies only. No live credential or provider is used.
$ErrorActionPreference = 'Stop'
$helper = Join-Path (Split-Path -Parent $PSScriptRoot) 'setup-paypal-live-prices.ps1'
$tokens = $null; $parseErrors = $null
[void][Management.Automation.Language.Parser]::ParseFile($helper,[ref]$tokens,[ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('jagdlatein-new-prices-' + [guid]::NewGuid().ToString('N'))
$regularDirectory = Join-Path $testRoot 'regular'
$trialDirectory = Join-Path $testRoot 'trial'
$sourceId = 'P-9XU38461YG7706134NESJQWA'
$regularId = 'P-' + ('A' * 24); $trialId = 'P-' + ('B' * 24)
$productId = 'PROD-' + ('A' * 17)
$clientId = 'synthetic-paypal-live-client-id-local-only'
$secret = ConvertTo-SecureString 'synthetic-local-only-not-a-real-secret' -AsPlainText -Force
$global:paypalPriceTest = @{ source=$sourceId; regular=$regularId; trial=$trialId; product=$productId;
    plans=@{}; planPosts=0; requests=@{}; failAfterCreate=$false; observedMethods=@() }
$oldVariables = @{}
foreach ($name in @('PAYPAL_API_BASE','PAYPAL_PLAN_IDS','PAYPAL_TRIAL_PLAN_IDS','PAYPAL_PLAN_PRICES','NEXT_PUBLIC_PAYPAL_PLAN_ID','NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID')) {
    $oldVariables[$name] = [Environment]::GetEnvironmentVariable($name,'Process')
    [Environment]::SetEnvironmentVariable($name,$null,'Process')
}
$env:PAYPAL_API_BASE = 'https://api-m.paypal.com'
function Assert-True([bool]$Value,[string]$Message) { if (!$Value) { throw $Message } }
function Invoke-TestHelper([string]$Step,[string]$Kind,[string]$Directory) {
    & $helper -Step $Step -PlanKind $Kind -OutputDirectory $Directory -ClientId $clientId -Secret $secret 6>&1 | Out-String
}
function Read-State([string]$Directory) { Get-Content -LiteralPath (Join-Path $Directory 'state.json') -Raw | ConvertFrom-Json }
function global:Invoke-RestMethod {
    [CmdletBinding()]
    param([string]$Uri,[string]$Method,[hashtable]$Headers,[int]$TimeoutSec,[int]$MaximumRedirection,[string]$ContentType,$Body)
    $url = [uri]$Uri
    if ($url.Scheme -cne 'https' -or $url.Host -cne 'api-m.paypal.com' -or $MaximumRedirection -ne 0) { throw 'Unexpected fake endpoint' }
    $global:paypalPriceTest.observedMethods += $Method + ' ' + $url.AbsolutePath
    if ($Method -ceq 'POST' -and $url.AbsolutePath -ceq '/v1/oauth2/token') { return [pscustomobject]@{ access_token='synthetic-local-token' } }
    if ($Method -ceq 'GET' -and $url.AbsolutePath -ceq ('/v1/catalogs/products/' + $global:paypalPriceTest.product)) { return [pscustomobject]@{ id=$global:paypalPriceTest.product } }
    if ($Method -ceq 'GET' -and $url.AbsolutePath -ceq ('/v1/billing/plans/' + $global:paypalPriceTest.source)) {
        return [pscustomobject]@{ id=$global:paypalPriceTest.source; product_id=$global:paypalPriceTest.product; status='ACTIVE';
            billing_cycles=@([pscustomobject]@{tenure_type='REGULAR';sequence=1;total_cycles=0;
                frequency=[pscustomobject]@{interval_unit='MONTH';interval_count=1};
                pricing_scheme=[pscustomobject]@{fixed_price=[pscustomobject]@{value='5.00';currency_code='EUR'}}}) }
    }
    if ($Method -ceq 'POST' -and $url.AbsolutePath -ceq '/v1/billing/plans') {
        $requestId = [string]$Headers['PayPal-Request-Id']
        Assert-True ($requestId -match '^[0-9a-f-]{36}$') 'New creation needs its own request ID'
        $inputPlan = [Text.Encoding]::UTF8.GetString($Body) | ConvertFrom-Json
        $id = if (@($inputPlan.billing_cycles).Count -eq 2) { $global:paypalPriceTest.trial } else { $global:paypalPriceTest.regular }
        if (!$global:paypalPriceTest.requests.ContainsKey($requestId)) {
            $global:paypalPriceTest.planPosts++
            $inputPlan | Add-Member -NotePropertyName id -NotePropertyValue $id
            $global:paypalPriceTest.plans[$id] = $inputPlan
            $global:paypalPriceTest.requests[$requestId] = $id
        }
        if ($global:paypalPriceTest.failAfterCreate) { $global:paypalPriceTest.failAfterCreate=$false; throw 'Synthetic response lost after creation' }
        return $global:paypalPriceTest.plans[$id]
    }
    $id = $url.Segments[-1]
    if ($Method -ceq 'GET' -and $global:paypalPriceTest.plans.ContainsKey($id)) { return $global:paypalPriceTest.plans[$id] }
    throw 'Unexpected fake endpoint: no cancellation, repricing, deactivation or real provider request allowed'
}
try {
    [void](Invoke-TestHelper Prepare Regular $regularDirectory)
    [void](Invoke-TestHelper Prepare Trial $trialDirectory)
    Assert-True ($global:paypalPriceTest.planPosts -eq 0) 'Prepare must not create a provider plan'
    $regularBody = Get-Content -LiteralPath (Join-Path $regularDirectory 'plan.json') -Raw | ConvertFrom-Json
    $trialBody = Get-Content -LiteralPath (Join-Path $trialDirectory 'plan.json') -Raw | ConvertFrom-Json
    Assert-True (@($regularBody.billing_cycles).Count -eq 1 -and $regularBody.billing_cycles[0].pricing_scheme.fixed_price.value -ceq '10.00') 'Regular plan must contain exactly10 EUR per month'
    Assert-True (@($trialBody.billing_cycles).Count -eq 2 -and $trialBody.billing_cycles[0].frequency.interval_count -eq 3 -and
        $trialBody.billing_cycles[0].pricing_scheme.fixed_price.value -ceq '0.00' -and $trialBody.billing_cycles[1].pricing_scheme.fixed_price.value -ceq '10.00') 'Trial must be three free days, then10 EUR'
    Assert-True ((Read-State $regularDirectory).request_id -cne (Read-State $trialDirectory).request_id) 'Plans must use different idempotency keys'
    [void](Invoke-TestHelper Create Regular $regularDirectory)
    [void](Invoke-TestHelper Create Regular $regularDirectory)
    Assert-True ($global:paypalPriceTest.planPosts -eq 1) 'Repeated Create may not duplicate the regular plan'
    $global:paypalPriceTest.failAfterCreate=$true
    $failed=$false
    try { [void](Invoke-TestHelper Create Trial $trialDirectory) } catch { $failed=$true }
    Assert-True $failed 'Synthetic lost response must be reported as unclear'
    $trialRequest = (Read-State $trialDirectory).request_id
    $configuration = Invoke-TestHelper Create Trial $trialDirectory
    Assert-True ($global:paypalPriceTest.planPosts -eq 2 -and (Read-State $trialDirectory).request_id -ceq $trialRequest) 'Retry must recover the same created plan'
    Assert-True ($configuration.Contains('NEXT_PUBLIC_PAYPAL_PLAN_ID=' + $regularId) -and $configuration.Contains('NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID=' + $trialId)) 'Both new verified IDs must be shown'
    Assert-True ($configuration.Contains('PAYPAL_PLAN_PRICES=') -and $configuration.Contains('"P-9XU38461YG7706134NESJQWA":"5.00"') -and
        $configuration.Contains('"' + $trialId + '":"10.00"')) 'Explicit map must preserve legacy prices and bind new prices'
    [void](Invoke-TestHelper Status Trial $trialDirectory)
    Assert-True ($global:paypalPriceTest.planPosts -eq 2) 'Status must remain read-only'
    $trialBefore = Get-Content -LiteralPath (Join-Path $trialDirectory 'state.json') -Raw
    $trialBodyPath = Join-Path $trialDirectory 'plan.json'
    [IO.File]::WriteAllText($trialBodyPath,((Get-Content -LiteralPath $trialBodyPath -Raw).Replace('10.00','11.00')))
    $failed=$false
    try { [void](Invoke-TestHelper Create Trial $trialDirectory) } catch { $failed=$true }
    Assert-True ($failed -and $global:paypalPriceTest.planPosts -eq 2) 'Tampered stored terms must never create another plan'
    Assert-True ((Get-Content -LiteralPath (Join-Path $trialDirectory 'state.json') -Raw) -ceq $trialBefore) 'Rejected terms must retain the existing state'
    Assert-True (@($global:paypalPriceTest.observedMethods | Where-Object { $_ -match 'cancel|deactivate|update-pricing|PATCH|DELETE' }).Count -eq 0) 'Helper must not mutate existing customer contracts'
    Write-Output 'New live-price helper: syntax, both exact plans, preparation, idempotent creation/recovery, read-only status and tamper refusal passed with fake responses.'
} finally {
    Remove-Item -LiteralPath Function:\Invoke-RestMethod -ErrorAction SilentlyContinue
    foreach ($name in $oldVariables.Keys) { [Environment]::SetEnvironmentVariable($name,$oldVariables[$name],'Process') }
    $secret.Dispose()
    $global:paypalPriceTest=$null
    # Keep this disposable fixture directory for review; no user directory is removed.
}
