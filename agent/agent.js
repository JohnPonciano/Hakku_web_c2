const axios = require('axios');
const os = require('os');
const getExternalIp = require('external-ip')();

// Função para coletar informações da máquina
async function coletarInformacoesDaMaquina() {
  const dadosMaquina = {
    nome: os.hostname(),
    plataforma: os.platform(),
    sistemaOS: os.type(),
    arquitetura: os.arch(),
    memoriaTotal: os.totalmem(),
    memoriaLivre: os.freemem(),
  };

  // Obtém o IP externo da máquina (requer uma conexão com a internet)
  getExternalIp((err, ip) => {
    if (err) {
      console.error('Erro ao obter o IP externo:', err);
    } else {
      dadosMaquina.ipExterno = ip;
      enviarDadosParaServidorCentral(dadosMaquina);
    }
  });

  // Obtém o IP interno da máquina
  const interfaces = os.networkInterfaces();
  for (const interfaceName of Object.keys(interfaces)) {
    const interface = interfaces[interfaceName];
    for (const addressInfo of interface) {
      if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
        dadosMaquina.ipInterno = addressInfo.address;
        break;
      }
    }
    if (dadosMaquina.ipInterno) {
      break;
    }
  }

  return dadosMaquina;
}

// URL do servidor central
const servidorCentralURL = 'http://localhost:3000/receber-dados';

// Função para enviar os dados ao servidor central
function enviarDadosParaServidorCentral(dadosDaMaquina) {
  axios
    .post(servidorCentralURL, dadosDaMaquina)
    .then((response) => {
      console.log('Dados enviados com sucesso para o servidor central.');
    })
    .catch((error) => {
      console.error('Erro ao enviar dados para o servidor central:', error);
    });
}

// Configurar um temporizador para enviar dados a cada intervalo (por exemplo, a cada 5 segundos)
const intervaloDeEnvio = 5000; // 5 segundos

setInterval(coletarInformacoesDaMaquina, intervaloDeEnvio);
