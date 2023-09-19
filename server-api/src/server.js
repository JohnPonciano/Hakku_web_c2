const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { consultarWigle } = require('./geoserver'); // Importe a função consultarWigle do módulo geoserver.js
const cron = require('node-cron');


const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

const intervaloDeSolicitacao = 60 * 60 * 1000; // 1 hora em milissegundos
const rateLimitMap = new Map();
const cache = new Map();

function bytesParaGB(bytes) {
  return (bytes / (1024 ** 3)).toFixed(2); // 1 GB = 1024^3 bytes
}

// Função para consultar o Wigle.net com retentativas e caching
async function consultarWigleComRetentativas(bssidRedeWiFi, ssidRedeWiFi) {
  const cacheKey = `${bssidRedeWiFi}-${ssidRedeWiFi}`;
  // Verifica se os resultados já estão em cache
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Verifica se uma solicitação para este BSSID e SSID já está em andamento
  if (!rateLimitMap.has(cacheKey)) {
    // Marca que a solicitação está em andamento para este BSSID e SSID
    rateLimitMap.set(cacheKey, true);

    try {
      // Realiza a consulta no Wigle.net
      const wigleResponse = await consultarWigle(bssidRedeWiFi, ssidRedeWiFi);

      if (wigleResponse) {
        const wigleDetails = wigleResponse.wigleData;

        // Armazena o resultado no cache
        cache.set(cacheKey, wigleDetails);

        // Remove o limite após a consulta para este BSSID e SSID
        setTimeout(() => {
          rateLimitMap.delete(cacheKey);
        }, intervaloDeSolicitacao);

        return wigleDetails;
      } else {
        console.error('Rede WiFi não encontrada no Wigle.net.');
      }
    } catch (error) {
      console.error('Erro na consulta do Wigle.net:', error.message);
    }
  } else {
    console.error('Solicitação já em andamento para este BSSID e SSID.');
  }

  // Se a consulta falhar ou já estiver em andamento, agende uma retentativa após 20 minutos
  setTimeout(() => {
    consultarWigleComRetentativas(bssidRedeWiFi, ssidRedeWiFi);
  }, 20 * 60 * 1000); // 20 minutos em milissegundos

  return null; // Retorna nulo para indicar que a consulta será retentada
}

// Endpoint para receber os dados das máquinas e consultar o Wigle.net
app.post('/receber-dados', async (req, res) => {
  const newData = req.body;

  console.log('Novos dados recebidos:', newData);

  // Verifica se a última solicitação foi feita há mais de 1 hora
  const agora = new Date();
  let fazerNovaSolicitacao = true;

  if (newData.lastGeolocationRequest) {
    const horaUltimaSolicitacao = new Date(newData.lastGeolocationRequest);

    if (agora - horaUltimaSolicitacao < intervaloDeSolicitacao) {
      fazerNovaSolicitacao = false;
    }
  }

  // Consulta no Wigle.net somente se for necessário e respeita o controle de taxa
  if (fazerNovaSolicitacao) {
    const bssidRedeWiFi = newData.bssidRedeWiFi.trim();
    const ssidRedeWiFi = newData.ssidRedeWiFi.trim();
    const wigleDetails = await consultarWigleComRetentativas(bssidRedeWiFi, ssidRedeWiFi);

    if (wigleDetails) {
      // Atualize os dados com base na consulta do Wigle.net
      newData.lastGeolocationRequest = new Date().toISOString();
      newData.country = wigleDetails.country;
      newData.region = wigleDetails.region;
      newData.road = wigleDetails.road;
      newData.city = wigleDetails.city;
      newData.housenumber = wigleDetails.housenumber;
      newData.postalcode = wigleDetails.postalcode;
      newData.googleMapsLink = wigleDetails.googleMapsLink;

      console.log('Wigle data foi consultado:', wigleDetails);
    }
  }

  // Ler o arquivo JSON existente (se existir)
  let data = [];
  try {
    const rawData = fs.readFileSync('dados.json');
    data = JSON.parse(rawData);
  } catch (error) {
    // Se o arquivo não existe, apenas continue com um array vazio
  }

  // Verificar se já existe um registro com o mesmo nome (Maquina A, Maquina B)
  const existingDataIndex = data.findIndex((item) => item.nome === newData.nome);

  if (existingDataIndex !== -1) {
    // Atualizar os dados existentes
    const existingData = data[existingDataIndex];
    existingData.plataforma = newData.plataforma;
    existingData.sistemaOS = newData.sistemaOS;
    existingData.arquitetura = newData.arquitetura;
    existingData.memoriaTotal = bytesParaGB(newData.memoriaTotal); // Converter para GB
    existingData.memoriaLivre = bytesParaGB(newData.memoriaLivre); // Converter para GB
    // Adicione os IPs interno e externo ao registro existente
    existingData.ipInterno = newData.ipInterno;
    existingData.ipExterno = newData.ipExterno;
    existingData.lastUpdate = new Date(); // Atualize a data da última atualização

    // Adicione os detalhes da consulta no Wigle.net aos dados existentes
    existingData.country = newData.country;
    existingData.region = newData.region;
    existingData.road = newData.road;
    existingData.city = newData.city;
    existingData.housenumber = newData.housenumber;
    existingData.postalcode = newData.postalcode;
    existingData.lastGeolocationRequest = newData.lastGeolocationRequest;
    // Adicione o link do Google Maps aos dados existentes
    existingData.googleMapsLink = newData.googleMapsLink;
  } else {
    // Adicionar novo registro com um ID único
    const newMachine = {
      id: uuidv4(), // Gere um ID único
      ...newData,
      memoriaTotal: bytesParaGB(newData.memoriaTotal), // Converter para GB
      memoriaLivre: bytesParaGB(newData.memoriaLivre), // Converter para GB
      online: true,
      lastUpdate: new Date(),
      // Adicione os detalhes da consulta no Wigle.net aos novos dados
      country: newData.country,
      region: newData.region,
      road: newData.road,
      city: newData.city,
      housenumber: newData.housenumber,
      postalcode: newData.postalcode,
      lastGeolocationRequest: newData.lastGeolocationRequest,
      // Adicione o link do Google Maps aos novos dados
      googleMapsLink: newData.googleMapsLink,
    };
    // Adicione os IPs interno e externo ao novo registro
    newMachine.ipInterno = newData.ipInterno;
    newMachine.ipExterno = newData.ipExterno;

    data.push(newMachine);
  }
  // Salvar os dados atualizados no arquivo JSON
  fs.writeFileSync('dados.json', JSON.stringify(data));
  // Retornar os dados, incluindo o link do Google Maps
  res.json({ linkgooglemaps: newData.googleMapsLink, message: 'Dados recebidos com sucesso!' });
});

// Endpoint para listar todos os dados
app.get('/dados', (req, res) => {
  try {
    const rawData = fs.readFileSync('dados.json');
    const data = JSON.parse(rawData);
    res.json(data);
  } catch (error) {
    res.status(500).send('Erro ao buscar dados.');
  }
});

// Endpoint para listar dados com base em um ID
app.get('/dados/:id', (req, res) => {
  const id = req.params.id;
  try {
    const rawData = fs.readFileSync('dados.json');
    const data = JSON.parse(rawData);
    const matchingData = data.find((item) => item.id === id);
    if (matchingData) {
      res.json(matchingData);
    } else {
      res.status(404).send('Dados não encontrados.');
    }
  } catch (error) {
    res.status(500).send('Erro ao buscar dados.');
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
