[CmdletBinding()]
param(
    [ValidateSet('Prepare', 'Create', 'Status')]
    [string]$Step = 'Prepare',
    [ValidatePattern('^P-[A-Z0-9]{24}$')]
    [string]$ExistingPlanId = 'P-9XU38461YG7706134NESJQWA',
    [string]$ClientId = '',
    [System.Security.SecureString]$Secret,
    [string]$OutputDirectory = '',
    [ValidatePattern('^P-[A-Z0-9]{24}$')]
    [string]$CreatedPlanId = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Field($Object, [string]$Name) {
    if ($null -eq $Object) { return $null }
    $property = $Object.PSObject.Properties[$Name]
    if ($null -ne $property) { return $property.Value }
    return $null
}

function Get-TextHash([string]$Text) {
    $hasher = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
        return ([System.BitConverter]::ToString($hasher.ComputeHash($bytes))).Replace('-', '')
    } finally { $hasher.Dispose() }
}

function Get-StateTime($Value) {
    # PowerShell 7 may decode JSON timestamps into DateTime; 5.1 keeps strings.
    if ($Value -is [datetimeoffset]) { return $Value.ToUniversalTime() }
    if ($Value -is [datetime]) { return ([datetimeoffset]$Value).ToUniversalTime() }
    $parsedTime = [datetimeoffset]::MinValue
    if ($Value -is [string] -and [datetimeoffset]::TryParseExact(
        $Value, 'o', [System.Globalization.CultureInfo]::InvariantCulture,
        [System.Globalization.DateTimeStyles]::None, [ref]$parsedTime)) {
        return $parsedTime.ToUniversalTime()
    }
    return $null
}

function Save-JsonFile([string]$Path, $Value) {
    $text = $Value | ConvertTo-Json -Depth 12
    $temporaryPath = $Path + '.writing'
    [System.IO.File]::WriteAllText($temporaryPath, $text, [System.Text.UTF8Encoding]::new($false))
    if ([System.IO.File]::Exists($Path)) {
        [System.IO.File]::Replace($temporaryPath, $Path, ($Path + '.previous'))
    } else {
        [System.IO.File]::Move($temporaryPath, $Path)
    }
}

function Invoke-PayPal([string]$Method, [string]$Path, [hashtable]$Headers, [string]$Body = '') {
    if ($Path -notmatch '^/v1/(oauth2/token|billing/plans(?:/P-[A-Z0-9]{24})?|catalogs/products/PROD-[A-Z0-9]{17})$') {
        throw 'Unerwarteter PayPal-Endpunkt. Kein Aufruf ausgefuehrt.'
    }
    $parameters = @{
        Uri = $script:apiBase + $Path
        Method = $Method
        Headers = $Headers
        TimeoutSec = 30
        MaximumRedirection = 0
        ErrorAction = 'Stop'
    }
    if ($Path -eq '/v1/oauth2/token') {
        $parameters.ContentType = 'application/x-www-form-urlencoded'
    } else { $parameters.ContentType = 'application/json' }
    if ($Body) { $parameters.Body = [System.Text.Encoding]::UTF8.GetBytes($Body) }
    try {
        return Invoke-RestMethod @parameters
    } catch {
        $status = ''
        $errorResponse = Get-Field $_.Exception 'Response'
        if ($null -ne $errorResponse) {
            try { $status = ' (HTTP ' + [int](Get-Field $errorResponse 'StatusCode') + ')' } catch { $status = '' }
        }
        throw "PayPal-Aufruf fehlgeschlagen$status. Zugangsdaten und Live-App pruefen. Keine API-Antwort oder Zugangsdaten werden ausgegeben."
    }
}

function Assert-ZeroExtras($Plan) {
    $preferences = Get-Field $Plan 'payment_preferences'
    $setupFee = Get-Field $preferences 'setup_fee'
    $taxes = Get-Field $Plan 'taxes'
    $setupAmount = Get-Field $setupFee 'value'
    $taxRate = Get-Field $taxes 'percentage'
    if (($null -ne $setupFee -and [string]$setupAmount -notmatch '^0(?:\.0{1,3})?$') -or
        ($null -ne $taxes -and [string]$taxRate -notmatch '^0(?:\.0{1,3})?$') -or
        (Get-Field $Plan 'quantity_supported') -eq $true) {
        throw 'Der Plan enthaelt zusaetzliche Gebuehren, Steuern oder variable Mengen. Kein Testplan angelegt.'
    }
}

function Assert-Cycle($Cycle, [string]$Tenure, [int]$Sequence, [string]$Unit, [int]$Count, [int]$Cycles, [string]$Amount) {
    $frequency = Get-Field $Cycle 'frequency'
    $pricing = Get-Field $Cycle 'pricing_scheme'
    $price = Get-Field $pricing 'fixed_price'
    $amountPattern = if ($Amount -eq '0') { '^0(?:\.0{1,3})?$' } else { '^5(?:\.0{1,3})?$' }
    if ((Get-Field $Cycle 'tenure_type') -cne $Tenure -or
        (Get-Field $Cycle 'sequence') -ne $Sequence -or
        (Get-Field $frequency 'interval_unit') -cne $Unit -or
        (Get-Field $frequency 'interval_count') -ne $Count -or
        (Get-Field $Cycle 'total_cycles') -ne $Cycles -or
        (Get-Field $price 'currency_code') -cne 'EUR' -or
        [string](Get-Field $price 'value') -notmatch $amountPattern -or
        $null -ne (Get-Field $pricing 'tiers') -or
        $null -ne (Get-Field $pricing 'pricing_model')) {
        throw 'Die PayPal-Planbedingungen stimmen nicht mit 3 Tagen kostenlos und danach 5 EUR pro Monat ueberein.'
    }
}

function Get-VerifiedExistingPlan([hashtable]$Headers) {
    $plan = Invoke-PayPal 'GET' ('/v1/billing/plans/' + $ExistingPlanId) $Headers
    $productId = [string](Get-Field $plan 'product_id')
    if ((Get-Field $plan 'id') -cne $ExistingPlanId -or
        (Get-Field $plan 'status') -cne 'ACTIVE' -or
        $productId -notmatch '^PROD-[A-Z0-9]{17}$') {
        throw 'Der bestehende aktive Live-Plan konnte nicht eindeutig bestaetigt werden.'
    }
    $cycles = @(Get-Field $plan 'billing_cycles')
    if ($cycles.Count -ne 1) { throw 'Der bisherige Plan muss genau einen regulaeren Monatszyklus enthalten.' }
    Assert-Cycle $cycles[0] 'REGULAR' 1 'MONTH' 1 0 '5'
    Assert-ZeroExtras $plan
    $product = Invoke-PayPal 'GET' ('/v1/catalogs/products/' + $productId) $Headers
    if ((Get-Field $product 'id') -cne $productId) { throw 'Das Produkt des bisherigen Plans konnte nicht bestaetigt werden.' }
    return $productId
}

function New-TrialPlan([string]$ProductId) {
    return [ordered]@{
        product_id = $ProductId
        name = 'Jagdlatein: 3 Tage kostenlos, danach 5 EUR pro Monat'
        description = '3 Tage kostenlos. Danach 5 EUR monatlich bis zur Kuendigung. Zustimmung des Kunden in PayPal erforderlich.'
        status = 'ACTIVE'
        billing_cycles = @(
            [ordered]@{
                frequency = [ordered]@{ interval_unit = 'DAY'; interval_count = 3 }
                tenure_type = 'TRIAL'; sequence = 1; total_cycles = 1
                pricing_scheme = [ordered]@{ fixed_price = [ordered]@{ value = '0.00'; currency_code = 'EUR' } }
            },
            [ordered]@{
                frequency = [ordered]@{ interval_unit = 'MONTH'; interval_count = 1 }
                tenure_type = 'REGULAR'; sequence = 2; total_cycles = 0
                pricing_scheme = [ordered]@{ fixed_price = [ordered]@{ value = '5.00'; currency_code = 'EUR' } }
            }
        )
        payment_preferences = [ordered]@{
            auto_bill_outstanding = $true
            payment_failure_threshold = 1
        }
        quantity_supported = $false
    }
}

function Assert-PlanBody($Actual, $Expected) {
    # Compare JSON values, not formatting: Prepare/Create may use different PS versions.
    if ($Expected -is [System.Collections.IDictionary]) {
        if ($Actual -isnot [pscustomobject]) { throw 'Die gespeicherten Planbedingungen wurden veraendert. Kein Plan angelegt.' }
        $actualNames = @($Actual.PSObject.Properties.Name)
        if ($actualNames.Count -ne $Expected.Count) { throw 'Die gespeicherten Planbedingungen wurden veraendert. Kein Plan angelegt.' }
        foreach ($name in $Expected.Keys) {
            if ($actualNames -cnotcontains $name) { throw 'Die gespeicherten Planbedingungen wurden veraendert. Kein Plan angelegt.' }
            Assert-PlanBody (Get-Field $Actual $name) $Expected[$name]
        }
    } elseif ($Expected -is [array]) {
        if ($Actual -isnot [array] -or $Actual.Count -ne $Expected.Count) { throw 'Die gespeicherten Planbedingungen wurden veraendert. Kein Plan angelegt.' }
        for ($index = 0; $index -lt $Expected.Count; $index++) { Assert-PlanBody $Actual[$index] $Expected[$index] }
    } elseif ($Expected -is [string]) {
        if ($Actual -isnot [string] -or $Actual -cne $Expected) { throw 'Die gespeicherten Planbedingungen wurden veraendert. Kein Plan angelegt.' }
    } elseif ($Expected -is [bool]) {
        if ($Actual -isnot [bool] -or $Actual -ne $Expected) { throw 'Die gespeicherten Planbedingungen wurden veraendert. Kein Plan angelegt.' }
    } elseif (($Actual -isnot [int] -and $Actual -isnot [long]) -or $Actual -ne $Expected) {
        throw 'Die gespeicherten Planbedingungen wurden veraendert. Kein Plan angelegt.'
    }
}

function Assert-State($State, [string]$BodyText) {
    $requestId = [guid]::Empty
    $preparedAt = Get-StateTime (Get-Field $State 'prepared_at')
    $productId = [string](Get-Field $State 'product_id')
    if ((Get-Field $State 'version') -ne 1 -or
        (Get-Field $State 'api_base') -cne $script:apiBase -or
        (Get-Field $State 'existing_plan_id') -cne $ExistingPlanId -or
        $productId -notmatch '^PROD-[A-Z0-9]{17}$' -or
        !(Get-Field $State 'client_id_hash') -or
        (Get-Field $State 'client_id_hash') -cne (Get-TextHash $ClientId) -or
        ![guid]::TryParse([string](Get-Field $State 'request_id'), [ref]$requestId) -or
        $requestId -eq [guid]::Empty -or
        $null -eq $preparedAt -or
        (Get-Field $State 'body_hash') -cne (Get-TextHash $BodyText)) {
        throw 'Die gespeicherte Vorbereitung passt nicht zu dieser Live-App oder wurde veraendert. Kein Plan angelegt.'
    }
    $parsedBody = $BodyText | ConvertFrom-Json
    Assert-PlanBody $parsedBody (New-TrialPlan $productId)
    $knownId = [string](Get-Field $State 'created_plan_id')
    if ($knownId -and $knownId -notmatch '^P-[A-Z0-9]{24}$') { throw 'Ungueltige gespeicherte Plan-ID.' }
}

function Assert-CreatedPlan($Plan, [string]$PlanId, [string]$ProductId) {
    if ((Get-Field $Plan 'id') -cne $PlanId -or
        (Get-Field $Plan 'product_id') -cne $ProductId -or
        (Get-Field $Plan 'status') -cne 'ACTIVE') {
        throw 'Der neue aktive Live-Plan konnte nicht bestaetigt werden. Keine App-Einstellungen aendern.'
    }
    $cycles = @(Get-Field $Plan 'billing_cycles')
    if ($cycles.Count -ne 2) { throw 'Der neue Plan muss genau einen Testzyklus und einen Monatszyklus enthalten.' }
    $cycles = @($cycles | Sort-Object { Get-Field $_ 'sequence' })
    Assert-Cycle $cycles[0] 'TRIAL' 1 'DAY' 3 1 '0'
    Assert-Cycle $cycles[1] 'REGULAR' 2 'MONTH' 1 0 '5'
    Assert-ZeroExtras $Plan
    $preferences = Get-Field $Plan 'payment_preferences'
    if ((Get-Field $preferences 'auto_bill_outstanding') -ne $true -or
        (Get-Field $preferences 'payment_failure_threshold') -ne 1) {
        throw 'Die Zahlungseinstellungen des neuen Plans stimmen nicht mit der Vorbereitung ueberein.'
    }
}

function Show-Configuration([string]$PlanId) {
    $trialIds = @()
    foreach ($candidate in @(([string]$env:PAYPAL_TRIAL_PLAN_IDS) -split ',') + @([string]$env:NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID, $PlanId)) {
        $candidate = $candidate.Trim()
        if (!$candidate) { continue }
        if ($candidate -notmatch '^P-[A-Z0-9]{24}$') { throw 'PAYPAL_TRIAL_PLAN_IDS enthaelt eine ungueltige Plan-ID. Die bestehenden IDs manuell pruefen.' }
        if ($trialIds -cnotcontains $candidate) { $trialIds += $candidate }
    }
    $allowedIds = @($ExistingPlanId)
    foreach ($candidate in @(([string]$env:PAYPAL_PLAN_IDS) -split ',') + @([string]$env:NEXT_PUBLIC_PAYPAL_PLAN_ID) + $trialIds) {
        $candidate = $candidate.Trim()
        if (!$candidate) { continue }
        if ($candidate -notmatch '^P-[A-Z0-9]{24}$') { throw 'PAYPAL_PLAN_IDS enthaelt eine ungueltige Plan-ID. Die bestehenden IDs manuell pruefen.' }
        if ($allowedIds -cnotcontains $candidate) { $allowedIds += $candidate }
    }
    Write-Host "Bestaetigter neuer Live-Plan: $PlanId"
    Write-Host 'Nach SQL-Einrichtung und Code-Bereitstellung in Vercel Production setzen:'
    Write-Host "NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID=$PlanId"
    Write-Host ('PAYPAL_PLAN_IDS=' + ($allowedIds -join ','))
    Write-Host ('PAYPAL_TRIAL_PLAN_IDS=' + ($trialIds -join ','))
    Write-Host 'Weitere schon in Vercel erlaubte Plan-IDs ebenfalls beibehalten.'
    Write-Host 'PAYPAL_API_BASE, Live-Client-ID, Secret, Webhook und bisherige regulaere Plan-ID unveraendert lassen. Danach neu bereitstellen.'
}

$script:apiBase = if ($env:PAYPAL_API_BASE) { $env:PAYPAL_API_BASE.TrimEnd('/') } else { 'https://api-m.paypal.com' }
if ($script:apiBase -cne 'https://api-m.paypal.com') {
    throw 'Dieser Helfer ist fuer die oeffentliche Live-App. PAYPAL_API_BASE muss https://api-m.paypal.com sein; keine Sandbox-Konfiguration verwenden.'
}
if ($CreatedPlanId -and $Step -ne 'Status') { throw 'CreatedPlanId ist nur fuer die rein lesende Wiederherstellung mit -Step Status vorgesehen.' }
if (!$OutputDirectory) {
    $OutputDirectory = Join-Path ([System.Environment]::GetFolderPath('LocalApplicationData')) 'Jagdlatein\paypal-trial'
}
$OutputDirectory = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($OutputDirectory) | Out-Null
$bodyPath = Join-Path $OutputDirectory 'plan.json'
$statePath = Join-Path $OutputDirectory 'state.json'
$lockPath = Join-Path $OutputDirectory '.setup.lock'
$lock = $null
$previousTls = [System.Net.ServicePointManager]::SecurityProtocol
$token = $null
$rawSecret = $null
$basic = $null
$headers = $null
$ownsSecret = $false

try {
    $lock = [System.IO.File]::Open($lockPath, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    if (!$ClientId) {
        $ClientId = if ($env:PAYPAL_CLIENT_ID) { $env:PAYPAL_CLIENT_ID } else { $env:NEXT_PUBLIC_PAYPAL_CLIENT_ID }
    }
    if (!$ClientId) { $ClientId = Read-Host 'Client-ID der LIVE-App in PayPal' }
    if ($ClientId -notmatch '^[A-Za-z0-9_-]{20,256}$') { throw 'Ungueltige Live-Client-ID.' }
    if (!$Secret) {
        $ownsSecret = $true
        $configuredSecret = if ($env:PAYPAL_SECRET) { $env:PAYPAL_SECRET } else { $env:PAYPAL_CLIENT_SECRET }
        if ($configuredSecret) { $Secret = ConvertTo-SecureString $configuredSecret -AsPlainText -Force }
        else { $Secret = Read-Host 'Secret derselben LIVE-App in PayPal (Eingabe verborgen)' -AsSecureString }
        $configuredSecret = $null
    }
    if ($Secret.Length -eq 0) { throw 'Das Live-Secret fehlt.' }
    $secretPointer = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
    try { $rawSecret = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer) }
    finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    $basic = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($ClientId + ':' + $rawSecret))
    $authorization = Invoke-PayPal 'POST' '/v1/oauth2/token' @{ Authorization = 'Basic ' + $basic } 'grant_type=client_credentials'
    $rawSecret = $null
    $basic = $null
    $token = [string](Get-Field $authorization 'access_token')
    $authorization = $null
    if (!$token) { throw 'PayPal hat keinen Zugangstoken geliefert.' }
    $headers = @{ Authorization = 'Bearer ' + $token; Accept = 'application/json' }

    $state = $null
    $bodyText = $null
    if ([System.IO.File]::Exists($statePath) -or [System.IO.File]::Exists($bodyPath)) {
        if (![System.IO.File]::Exists($statePath) -or ![System.IO.File]::Exists($bodyPath)) {
            throw 'Die Vorbereitung ist unvollstaendig. Vor einem neuen Versuch den vorhandenen PayPal-Plan pruefen.'
        }
        $state = [System.IO.File]::ReadAllText($statePath) | ConvertFrom-Json
        $bodyText = [System.IO.File]::ReadAllText($bodyPath)
        Assert-State $state $bodyText
    } elseif ($Step -ne 'Prepare') {
        throw 'Zuerst -Step Prepare ausfuehren und die gespeicherten Bedingungen pruefen.'
    }

    if ($Step -eq 'Prepare') {
        $productId = Get-VerifiedExistingPlan $headers
        if ($null -ne $state -and (Get-Field $state 'product_id') -cne $productId) {
            throw 'Das Produkt des bisherigen Plans hat sich geaendert. Keine neue Vorbereitung geschrieben.'
        }
        if ($null -eq $state) {
            $bodyText = New-TrialPlan $productId | ConvertTo-Json -Depth 12
            $state = [pscustomobject][ordered]@{
                version = 1
                api_base = $script:apiBase
                existing_plan_id = $ExistingPlanId
                product_id = $productId
                client_id_hash = Get-TextHash $ClientId
                prepared_at = [datetimeoffset]::UtcNow.ToString('o')
                request_id = [guid]::NewGuid().ToString()
                body_hash = Get-TextHash $bodyText
                create_attempted_at = $null
                created_plan_id = $null
            }
            [System.IO.File]::WriteAllText($bodyPath, $bodyText, [System.Text.UTF8Encoding]::new($false))
            Save-JsonFile $statePath $state
        }
        Write-Host 'Vorbereitet: 3 Tage kostenlos, danach 5 EUR monatlich. Noch kein neuer PayPal-Plan angelegt.'
        Write-Host "Bedingungen pruefen: $bodyPath"
        Write-Host 'Mit -Step Create werden genau diese Bedingungen als neuer Live-Plan angelegt. Bestehende Abos werden nicht geaendert.'
        return
    }

    $knownPlanId = [string](Get-Field $state 'created_plan_id')
    if ($CreatedPlanId) {
        if ($knownPlanId -and $knownPlanId -cne $CreatedPlanId) { throw 'Die angegebene Plan-ID widerspricht dem bereits gespeicherten Ergebnis.' }
        $knownPlanId = $CreatedPlanId
    }
    if (!$knownPlanId -and $Step -eq 'Status') {
        throw 'Noch keine neue Plan-ID bekannt. Bei unklarem Ergebnis den Plan in PayPal pruefen und Status mit -CreatedPlanId ausfuehren.'
    }
    if (!$knownPlanId) {
        $productId = Get-VerifiedExistingPlan $headers
        if ($productId -cne (Get-Field $state 'product_id')) { throw 'Das Produkt hat sich geaendert. Kein Plan angelegt.' }
        $attemptedAt = Get-Field $state 'create_attempted_at'
        if ($null -ne $attemptedAt) {
            $attemptTime = Get-StateTime $attemptedAt
            if ($null -eq $attemptTime -or
                [datetimeoffset]::UtcNow -ge $attemptTime.AddHours(71) -or
                $attemptTime -gt [datetimeoffset]::UtcNow.AddMinutes(5)) {
                throw 'Der erste Anlageversuch liegt zu lange zurueck oder ist nicht eindeutig. Kein neuer POST: vorhandenen Plan in PayPal pruefen und -Step Status -CreatedPlanId verwenden.'
            }
        } else {
            $state.create_attempted_at = [datetimeoffset]::UtcNow.ToString('o')
            Save-JsonFile $statePath $state
        }
        $createHeaders = @{
            Authorization = 'Bearer ' + $token
            Accept = 'application/json'
            Prefer = 'return=representation'
            'PayPal-Request-Id' = [string]$state.request_id
        }
        $created = Invoke-PayPal 'POST' '/v1/billing/plans' $createHeaders $bodyText
        $knownPlanId = [string](Get-Field $created 'id')
        if ($knownPlanId -notmatch '^P-[A-Z0-9]{24}$') {
            throw 'PayPal hat keine gueltige neue Plan-ID geliefert. Ergebnis im PayPal-Konto pruefen; die gespeicherte Request-ID beibehalten.'
        }
        $state.created_plan_id = $knownPlanId
        Save-JsonFile $statePath $state
    }

    $verifiedPlan = Invoke-PayPal 'GET' ('/v1/billing/plans/' + $knownPlanId) $headers
    Assert-CreatedPlan $verifiedPlan $knownPlanId ([string]$state.product_id)
    if ((Get-Field $state 'created_plan_id') -cne $knownPlanId) {
        $state.created_plan_id = $knownPlanId
        Save-JsonFile $statePath $state
    }
    Show-Configuration $knownPlanId
} finally {
    $rawSecret = $null
    $basic = $null
    $token = $null
    $headers = $null
    $createHeaders = $null
    if ($ownsSecret -and $null -ne $Secret) { $Secret.Dispose() }
    [System.Net.ServicePointManager]::SecurityProtocol = $previousTls
    if ($null -ne $lock) { $lock.Dispose() }
}
