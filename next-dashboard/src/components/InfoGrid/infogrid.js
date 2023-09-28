import React, { useEffect, useState } from 'react';
import axios from 'axios';

function InfoGrid() {
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Faz uma solicitação GET para o servidor para buscar os dados
    axios.get('http://localhost:3001/dados/')
      .then(response => {
        setData(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
      });
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleMapsClick = async (item) => {
    try {
      const response = await axios.get(`http://localhost:3001/search-geo/${item.id}`);
      if (response.status === 200) {
        const googleMapsLink = response.data.data.googleMapsLink;
  
        // Abra o link do Google Maps em uma nova aba ou janela
        window.open(googleMapsLink, '_blank');
      } else {
        console.error('Erro ao buscar link do Google Maps.');
      }
    } catch (error) {
      console.error('Erro na solicitação ao servidor:', error.message);
    }
  };

  return (
    <div className="container mt-4 " data-bs-theme="dark">
      <h2>Informações dos Sistemas</h2>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Memória Total (GB)</th>
              <th>OS</th>
              <th>BSSID</th>
              <th>SSID</th>
              <th>IP-Externo</th>
              <th>IP-Interno</th>
              <th>Status</th>
              <th>Último Update</th>
              <th>Map</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nome}</td>
                <td>{item.memoriaTotal}</td>
                <td>{item.sistemaOS}<br />-{item.arquitetura}</td>
                <td>{item.bssidRedeWiFi ? item.bssidRedeWiFi.trim() : 'N/A'}</td>
                <td>{item.ssidRedeWiFi ? item.ssidRedeWiFi.trim() : 'N/A'}</td>
                <td>{item.ipExterno}</td>
                <td>{item.ipInterno}</td>
                <td className={`online-status ${item.online ? 'text-success' : 'text-danger'}`}>
                  {item.online ? 'Online' : 'Offline'}
                </td>
                <td>{item.lastUpdate}</td>
                <td>
                  <p>Função em Beta</p>
                  <button type="button" className="btn btn-success" onClick={() => handleMapsClick(item)}>Maps</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav>
        <ul className="pagination py-3">
          {Array.from({ length: Math.ceil(data.length / itemsPerPage) }).map((_, index) => (
            <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
              <button className="page-link" onClick={() => paginate(index + 1)}>{index + 1}</button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export default InfoGrid;
