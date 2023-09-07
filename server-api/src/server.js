const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // Importe a função uuidv4 da biblioteca uuid
const cors = require('cors')

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use(cors())

// Função para converter bytes para gigabytes (GB)
function bytesParaGB(bytes) {
  return (bytes / (1024 ** 3)).toFixed(2); // 1 GB = 1024^3 bytes
}

// Endpoint para receber os dados das máquinas
app.post('/receber-dados', (req, res) => {
  const newData = req.body;
  console.log('Novos dados recebidos:', newData);

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
  } else {
    // Adicionar novo registro com um ID único
    const newMachine = {
      id: uuidv4(), // Gere um ID único
      ...newData,
      memoriaTotal: bytesParaGB(newData.memoriaTotal), // Converter para GB
      memoriaLivre: bytesParaGB(newData.memoriaLivre), // Converter para GB
    };
    // Adicione os IPs interno e externo ao novo registro
    newMachine.ipInterno = newData.ipInterno;
    newMachine.ipExterno = newData.ipExterno;
    data.push(newMachine);
  }

  // Salvar os dados atualizados no arquivo JSON
  fs.writeFileSync('dados.json', JSON.stringify(data));

  res.send('Dados recebidos com sucesso!');
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
    const matchingData = data.find((item) => item.id === id); // Procura por ID, não mais por nome
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
