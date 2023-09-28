const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const { consultarWigle, criarLinkGoogleMaps } = require('./geoserver'); // Importe a função consultarWigle do módulo geoserver.js

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

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

  try {
    // Realiza a consulta no Wigle.net
    const wigleResponse = await consultarWigle(bssidRedeWiFi, ssidRedeWiFi);

    if (wigleResponse) {
      const wigleDetails = wigleResponse.wigleData;

      // Armazena o resultado no cache
      cache.set(cacheKey, wigleDetails);

      return wigleDetails;
    } else {
      console.error('Rede WiFi não encontrada no Wigle.net.');
    }
  } catch (error) {
    console.error('Erro na consulta do Wigle.net:', error.message);
  }

  return null; // Retorna nulo para indicar que a consulta será retentada
}

// Endpoint para receber os dados das máquinas e consultar o Wigle.net
app.post('/receber-dados', async (req, res) => {
  const newData = req.body;

  console.log('Novos dados recebidos:', newData);

  // Realize a consulta ao Wigle.net apenas se você solicitar manualmente
  if (newData.consultarGeolocalizacao) {
    const bssidRedeWiFi = newData.bssidRedeWiFi.trim();
    const ssidRedeWiFi = newData.ssidRedeWiFi.trim();

    try {
      // Realize a consulta ao Wigle.net
      const wigleDetails = await consultarWigleComRetentativas(bssidRedeWiFi, ssidRedeWiFi);

      if (wigleDetails) {
        // Atualize os dados com base na consulta do Wigle.net
        newData.country = wigleDetails.country;
        newData.region = wigleDetails.region;
        newData.road = wigleDetails.road;
        newData.city = wigleDetails.city;
        newData.housenumber = wigleDetails.housenumber;
        newData.postalcode = wigleDetails.postalcode;
        newData.googleMapsLink = criarLinkGoogleMaps(wigleDetails);

        console.log('Wigle data foi consultado:', wigleDetails);
      }
    } catch (error) {
      console.error('Erro na consulta do Wigle.net:', error.message);
    }
  }

  // Ler o arquivo JSON existente (se existir)
  let data = [];
  try {
    const rawData = fs.readFileSync('./dados.json');
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
  } else {
    // Adicionar novo registro com um ID único
    const newMachine = {
      id: uuidv4(), // Gere um ID único
      ...newData,
      memoriaTotal: bytesParaGB(newData.memoriaTotal), // Converter para GB
      memoriaLivre: bytesParaGB(newData.memoriaLivre), // Converter para GB
      online: true,
      lastUpdate: new Date(),
    };
    // Adicione os IPs interno e externo ao novo registro
    newMachine.ipInterno = newData.ipInterno;
    newMachine.ipExterno = newData.ipExterno;

    data.push(newMachine);
  }
  // Salvar os dados atualizados no arquivo JSON
  fs.writeFileSync('./dados.json', JSON.stringify(data));
  // Retornar uma resposta de sucesso
  res.json({ message: 'Dados recebidos com sucesso!' });
});

// Endpoint para listar todos os dados
app.get('/dados', (req, res) => {
  try {
    const rawData = fs.readFileSync('./dados.json');
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
    const rawData = fs.readFileSync('./dados.json');
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

// Endpoint para consultar geolocalização manualmente
app.get('/search-geo/:id', async (req, res) => {
  const id = req.params.id;

  // Ler o arquivo JSON existente (se existir)
  let data = [];
  try {
    const rawData = fs.readFileSync('./dados.json');
    data = JSON.parse(rawData);
  } catch (error) {
    // Se o arquivo não existe, apenas continue com um array vazio
  }

  // Encontre a máquina com base no ID
  const machine = data.find((item) => item.id === id);

  if (!machine) {
    return res.status(404).json({ message: 'Máquina não encontrada.' });
  }

  const { bssidRedeWiFi, ssidRedeWiFi } = machine;

  try {
    // Realize a consulta ao Wigle.net manualmente
    const wigleDetails = await consultarWigle(bssidRedeWiFi, ssidRedeWiFi);

    if (wigleDetails.wigleData) {
      // Adicione o campo googleMapsLink à resposta
      wigleDetails.wigleData.googleMapsLink = criarLinkGoogleMaps(wigleDetails.wigleData);

      return res.status(200).json({ message: 'Consulta ao Wigle.net concluída com sucesso.', data: wigleDetails.wigleData });
    } else {
      return res.status(404).json({ message: wigleDetails.error });
    }
  } catch (error) {
    console.error('Erro na consulta manual ao Wigle.net:', error.message);
    return res.status(500).json({ message: 'Erro na consulta manual ao Wigle.net.' });
  }
});

  app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
  });
