$ErrorActionPreference = "Stop"
Write-Output "=== CHECK 1: GET /api/health with Origin 8081 ==="
try {
  $resp1 = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8000/api/health" -Headers @{ Origin="http://localhost:8081" }
  Write-Output ("StatusCode: {0}" -f [int]$resp1.StatusCode)
  $acao = $resp1.Headers["Access-Control-Allow-Origin"]
  Write-Output ("Access-Control-Allow-Origin: {0}" -f ($(if($acao){$acao}else{"<missing>"})))
} catch {
  Write-Output "REQUEST_FAILED"
  Write-Output $_.Exception.Message
}

Write-Output "=== CHECK 2: OPTIONS /api/devices/status preflight from 8081 ==="
try {
  $resp2 = Invoke-WebRequest -UseBasicParsing -Method Options -Uri "http://localhost:8000/api/devices/status" -Headers @{ Origin="http://localhost:8081"; "Access-Control-Request-Method"="GET" }
  Write-Output ("StatusCode: {0}" -f [int]$resp2.StatusCode)
  $corsHeaders = "Access-Control-Allow-Origin","Access-Control-Allow-Methods","Access-Control-Allow-Headers","Access-Control-Allow-Credentials","Vary"
  foreach($h in $corsHeaders){
    $v = $resp2.Headers[$h]
    Write-Output ("{0}: {1}" -f $h, ($(if($v){$v}else{"<missing>"})))
  }
} catch {
  if ($_.Exception.Response) {
    $r = $_.Exception.Response
    Write-Output ("StatusCode: {0}" -f [int]$r.StatusCode)
    $corsHeaders = "Access-Control-Allow-Origin","Access-Control-Allow-Methods","Access-Control-Allow-Headers","Access-Control-Allow-Credentials","Vary"
    foreach($h in $corsHeaders){
      $v = $r.Headers[$h]
      Write-Output ("{0}: {1}" -f $h, ($(if($v){$v}else{"<missing>"})))
    }
  } else {
    Write-Output "REQUEST_FAILED"
    Write-Output $_.Exception.Message
  }
}

Write-Output "=== CHECK 3: Processes listening on 8000 and 8081 ==="
$ports = 8000,8081
foreach($p in $ports){
  $listeners = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  if(-not $listeners){
    Write-Output ("Port {0}: no listener" -f $p)
    continue
  }
  foreach($l in $listeners | Select-Object -Unique OwningProcess,LocalAddress,LocalPort){
    $proc = Get-CimInstance Win32_Process -Filter ("ProcessId={0}" -f $l.OwningProcess)
    $cmd = if($proc.CommandLine){$proc.CommandLine -replace "\s+"," "}else{"<unavailable>"}
    Write-Output ("Port {0}: PID={1} Address={2} CommandLine={3}" -f $p,$l.OwningProcess,$l.LocalAddress,$cmd)
  }
}

Write-Output "=== CHECK 4: /api/devices/status returns JSON ==="
try {
  $resp4 = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8000/api/devices/status" -Headers @{ Origin="http://localhost:8081" }
  Write-Output ("StatusCode: {0}" -f [int]$resp4.StatusCode)
  $ct = $resp4.Headers["Content-Type"]
  Write-Output ("Content-Type: {0}" -f ($(if($ct){$ct}else{"<missing>"})))
  $raw = $resp4.Content
  try {
    $null = $raw | ConvertFrom-Json
    Write-Output "JSON_PARSE: OK"
    Write-Output ("BodyPreview: {0}" -f ($raw.Substring(0,[Math]::Min(300,$raw.Length))))
  } catch {
    Write-Output "JSON_PARSE: FAILED"
    Write-Output ("BodyPreview: {0}" -f ($raw.Substring(0,[Math]::Min(300,$raw.Length))))
  }
} catch {
  Write-Output "REQUEST_FAILED"
  Write-Output $_.Exception.Message
}
