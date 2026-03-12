import React, { useState } from 'react';
import './ConsultaCidadao.css';

const URL_DO_APP_SCRIPT = "https://script.google.com/macros/s/AKfycbxiOojCK3fNlEpzhJifzvNt3e-HIp5ozrMq5P6fkga1PqgHht-StkvUk0rY3o_lv3ZZ9Q/exec";

function ConsultaCidadao() {
  const [cpfBusca, setCpfBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Máscara do CPF para o campo de busca
  const aplicarMascaraCPF = (valor) => {
    let v = valor.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, "$1.$2");
    setCpfBusca(v);
  };

  const realizarBusca = async (e) => {
    e.preventDefault();
    
    if (cpfBusca.length < 14) {
      setMensagem('Por favor, digite o CPF completo para buscar.');
      setResultados([]);
      return;
    }

    setLoading(true);
    setMensagem('A procurar na base de dados... Aguarde.');
    setResultados([]);

    try {
      // Faz o download de todos os dados da folha de cálculo
      const resposta = await fetch(URL_DO_APP_SCRIPT);
      
      if (resposta.ok) {
        const dados = await resposta.json();
        
        // Filtra os dados: procura em cada linha a coluna que tem o nome parecido com 'cpf'
        const dadosFiltrados = dados.filter(linha => {
          const chaveCpf = Object.keys(linha).find(key => key.toLowerCase().includes('cpf'));
          return chaveCpf && String(linha[chaveCpf]).trim() === cpfBusca;
        });

        if (dadosFiltrados.length > 0) {
          setResultados(dadosFiltrados.reverse()); // .reverse() mostra os mais recentes primeiro
          setMensagem(`${dadosFiltrados.length} atendimento(s) encontrado(s)!`);
        } else {
          setMensagem('Nenhum atendimento encontrado para este CPF.');
        }
      } else {
        setMensagem('Erro ao comunicar com a base de dados.');
      }
    } catch (erro) {
      setMensagem('Erro de ligação. Verifique a sua internet.');
    } finally {
      setLoading(false); // Desliga a mensagem de "A procurar..."
    }
  };

  // Função "Cão de Guarda" para não deixar o sistema falhar se o nome da coluna no Google Sheets mudar
  const getValorSeguro = (linha, possiveisNomes) => {
    const chaveEncontrada = Object.keys(linha).find(key => 
      possiveisNomes.includes(key.toLowerCase().trim())
    );
    return chaveEncontrada ? linha[chaveEncontrada] : 'Não Informado';
  };

  const extrairData = (linha) => {
    const dataBruta = getValorSeguro(linha, ['data', 'datahora', 'carimbo de data/hora', 'timestamp', 'data_hora']);
    if (!dataBruta || dataBruta === 'Não Informado') return 'Data Desconhecida';
    try {
      const dataObj = new Date(dataBruta);
      if (!isNaN(dataObj.getTime())) return dataObj.toLocaleDateString('pt-BR');
      return String(dataBruta).substring(0, 10);
    } catch {
      return String(dataBruta).substring(0, 10);
    }
  };

  return (
    <div className="container-consulta">
      <div className="cabecalho-consulta">
        <h3>CONSULTA RÁPIDA DE ATENDIMENTOS</h3>
        <p>Verifique se o cidadão já passou pelo CadÚnico e qual foi o último serviço realizado.</p>
      </div>

      <form onSubmit={realizarBusca} className="barra-busca">
        <input 
          type="text" 
          className="input-busca"
          placeholder="Digite o CPF (000.000.000-00)" 
          value={cpfBusca}
          onChange={e => aplicarMascaraCPF(e.target.value)}
        />
        <button type="submit" className="btn-buscar" disabled={loading}>
          {loading ? 'A consultar...' : 'Consultar'}
        </button>
      </form>

      {mensagem && (
        <div className="mensagem-status">
          {mensagem}
        </div>
      )}

      <div className="area-resultados">
        {resultados.map((linha, index) => {
          const nome = getValorSeguro(linha, ['nome', 'cidadão', 'nome completo']);
          const atendimento = getValorSeguro(linha, ['atendimento', 'tipo atendimento', 'serviço']);
          const psf = getValorSeguro(linha, ['psf']);
          const dataFormatada = extrairData(linha);

          return (
            <div key={index} className="cartao-resultado">
              <h4>📅 Data: {dataFormatada}</h4>
              <div className="info-grid">
                <span><strong>👤 Cidadão(ã):</strong> {String(nome).toUpperCase()}</span>
                <span><strong>📋 Serviço:</strong> {String(atendimento).toUpperCase()}</span>
                <span><strong>🏥 Local:</strong> PSF {String(psf).toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConsultaCidadao;