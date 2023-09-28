#!/bin/bash

# Função para coletar informações da máquina
coletar_informacoes_da_maquina() {
  nome=$(hostname)
  plataforma=$(uname)
  sistemaOS=$(uname -r)
  arquitetura="Dado não disponível"  # Inicialmente, definimos como "Dado não disponível"
  memoriaTotal="Dado não disponível"  # Inicialmente, definimos como "Dado não disponível"
  memoriaLivre="Dado não disponível"  # Inicialmente, definimos como "Dado não disponível"
  
  # Obtém o IP externo da máquina (requer uma conexão com a internet)
  ipExterno=$(curl -s "https://api.ipify.org?format=text")
  
  # Obtém o IP interno da máquina
  ipInterno=$(ip -4 -o addr show | awk '{print $4}' | cut -d'/' -f1)
  
  # Obtém informações sobre a rede Wi-Fi ativa usando iwconfig (supondo que a interface Wi-Fi seja wlan0)
  infoRedeWiFi=$(iwconfig wlan0)
  ssidRedeWiFi=$(echo "$infoRedeWiFi" | grep "ESSID" | awk -F'"' '{print $2}')
  bssidRedeWiFi=$(echo "$infoRedeWiFi" | grep "Access Point" | awk '{print $4}')
  
  # Se houver uma rede Wi-Fi ativa, adicione as informações ao resultado
  if [ -n "$ssidRedeWiFi" ]; then
    ssidRedeWiFi=${ssidRedeWiFi// /_}  # Substitui espaços por underscores
  else
    ssidRedeWiFi="Dado não disponível"
  fi
  
  if [ -n "$bssidRedeWiFi" ]; then
    bssidRedeWiFi=${bssidRedeWiFi// /_}  # Substitui espaços por underscores
  else
    bssidRedeWiFi="Dado não disponível"
  fi
  
  # Constrói o JSON com os dados coletados
  dadosMaquina=$(cat <<EOF
{
  "nome": "$nome",
  "plataforma": "$plataforma",
  "sistemaOS": "$sistemaOS",
  "arquitetura": "$arquitetura",
  "memoriaTotal": "$memoriaTotal",
  "memoriaLivre": "$memoriaLivre",
  "ipExterno": "$ipExterno",
  "ipInterno": "$ipInterno",
  "ssidRedeWiFi": "$ssidRedeWiFi",
  "bssidRedeWiFi": "$bssidRedeWiFi"
}
EOF
)
  echo "$dadosMaquina"
}

# URL do servidor central
servidorCentralURL="http://localhost:3001/receber-dados"

# Função para enviar os dados ao servidor central
enviar_dados_para_servidor_central() {
  local dadosDaMaquina="$1"
  
  # Envia os dados via curl (certifique-se de ter o curl instalado)
  curl -X POST -H "Content-Type: application/json" -d "$dadosDaMaquina" "$servidorCentralURL"
}

# Configura um loop para enviar dados a cada intervalo (por exemplo, a cada 5 segundos)
intervaloDeEnvio=5  # 5 segundos

while true; do
  dados=$(coletar_informacoes_da_maquina)
  if [ -n "$dados" ]; then
    enviar_dados_para_servidor_central "$dados"
  fi
  sleep "$intervaloDeEnvio"
done
