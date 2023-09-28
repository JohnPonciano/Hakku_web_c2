# Fun��o para coletar informa��es da m�quina
function Coletar-Informacoes-Da-Maquina {
    try {
        $dadosMaquina = @{
            nome = [System.Environment]::MachineName
            plataforma = [System.Environment]::OSVersion.Platform
            sistemaOS = [System.Environment]::OSVersion.VersionString
            arquitetura = (Get-WmiObject -Class Win32_OperatingSystem).OSArchitecture
            memoriaTotal = (Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory
            memoriaLivre = (Get-WmiObject -Class Win32_OperatingSystem).FreePhysicalMemory
        }

        # Obt�m o IP externo da m�quina (requer uma conex�o com a internet)
        $ipExterno = (Invoke-RestMethod -Uri "https://api.ipify.org?format=text")
        $dadosMaquina.ipExterno = $ipExterno

        # Obt�m o IP interno da m�quina
        $ipInterno = (Get-NetIPAddress | Where-Object { $_.AddressFamily -eq "IPv4" -and $_.PrefixOrigin -eq "Dhcp" }).IPAddress
        $dadosMaquina.ipInterno = $ipInterno

        # Obt�m informa��es sobre a rede Wi-Fi ativa usando netsh
        $infoRedeWiFi = netsh wlan show interfaces
        $ssidRedeWiFi = $infoRedeWiFi | Select-String "SSID" | ForEach-Object { $_ -replace "SSID\s+:\s+","" }
        $bssidRedeWiFi = $infoRedeWiFi | Select-String "BSSID" | ForEach-Object { $_ -replace "BSSID\s+:\s+","" }

        # Se houver uma rede Wi-Fi ativa, adicione as informa��es ao resultado
        if ($ssidRedeWiFi.Count -gt 0) {
            $dadosMaquina.ssidRedeWiFi = $ssidRedeWiFi[0]  # Apenas o primeiro SSID
            $dadosMaquina.bssidRedeWiFi = $bssidRedeWiFi  # Apenas o primeiro BSSID
        }

        Write-Output $dadosMaquina
    } catch {
        Write-Host "Erro ao coletar informa��es da m�quina: $_"
    }
}

# URL do servidor central
$servidorCentralURL = 'http://localhost:3001/receber-dados'

# Fun��o para enviar os dados ao servidor central
function Enviar-Dados-Para-ServidorCentral($dadosDaMaquina) {
    try {
        $jsonBody = $dadosDaMaquina | ConvertTo-Json
        $response = Invoke-RestMethod -Uri $servidorCentralURL -Method Post -Body $jsonBody -ContentType "application/json"
        Write-Output "Dados enviados com sucesso para o servidor central: $($response.data)"
    } catch {
        Write-Host "Erro ao enviar dados para o servidor central: $_"
    }
}

# Configurar um temporizador para enviar dados a cada intervalo (por exemplo, a cada 5 segundos)
$intervaloDeEnvio = 5000 # 5 segundos

while ($true) {
    $dados = Coletar-Informacoes-Da-Maquina
    if ($dados) {
        Enviar-Dados-Para-ServidorCentral $dados
    }
    Start-Sleep -Milliseconds $intervaloDeEnvio
}
