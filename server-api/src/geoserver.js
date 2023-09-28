const axios = require('axios');
const querystring = require('querystring');

require('dotenv').config();

// Sua chave de API da Wigle.net
const wigleApiKey = process.env.WIGLE_API_KEY
// Função para criar o link do Google Maps com base nos dados de localização
function criarLinkGoogleMaps(locationData) {
  const {country, region, road, city, postalcode } = locationData;
  const latitude = locationData['trilat'];
  const longitude = locationData['trilong']
  const queryParams = querystring.stringify({
    q: `${latitude},${longitude}`,
    hl: country,
  });

  return `https://www.google.com/maps?${queryParams}`;
}

// Função para consultar o Wigle.net com base no BSSID e SSID da rede WiFi
async function consultarWigle(bssid, ssid) {
  // Configurar a solicitação HTTP para o Wigle.net
  let bssid_fix = bssid.trim()
  let ssid_fix = ssid.trim()
  const config = {
    method: 'get',
    url: `https://api.wigle.net/api/v2/network/search?netid=${bssid_fix}&ssid=${ssid_fix}`,
    headers: {
      Authorization: `Basic ${wigleApiKey}`,
    },
  };

  // Realizar a solicitação HTTP para o Wigle.net
  try {
    const response = await axios(config);
    const wigleData = response.data;
    console.log[wigleData.results[0]]


    if (wigleData.searchAfter > 0) {
      // Obtenha os detalhes da primeira rede encontrada
      const wigleDetails = wigleData.results[0];
      const googleMapsLink = criarLinkGoogleMaps(wigleDetails);
      return { wigleData: wigleDetails, googleMapsLink };
    } else {
      // Rede Wi-Fi não encontrada
      return { error: 'Rede WiFi não encontrada no Wigle.net.' };
    }
  } catch (error) {
    throw error;
  }
}


module.exports = { consultarWigle, criarLinkGoogleMaps };
