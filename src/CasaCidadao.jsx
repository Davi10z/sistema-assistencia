import React, { useState, useEffect } from 'react';
import './CasaCidadao.css';

const API_URL = "http://127.0.0.1:8000/api";

function CasaCidadao() {
  const [subAba, setSubAba] = useState('emissoes');
  const [operador, setOperador] = useState('');
  
  const [emissoes, setEmissoes] = useState([]);
  const [entregas, setEntregas] = useState([]);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataReq, setDataReq] = useState('');
  const [zona, setZona] = useState('URBANA');

  // ==========================================
  // ESTADOS DE FILTROS E PAGINAÇÃO
  // ==========================================
  const [filtroEntregas, setFiltroEntregas] = useState('Aguardando Retirada');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const ITENS_POR_PAGINA = 20;

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [rgSelecionado, setRgSelecionado] = useState(null);
  const [nomeRecebedor, setNomeRecebedor] = useState('');

  useEffect(() => {
    carregarTabelas();
  }, []);

  // Sempre que mudar de aba ou de filtro, volta para a Página 1
  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroEntregas, subAba]);

  const carregarTabelas = async () => {
    try {
      const respEmissoes = await fetch(`${API_URL}/emissoes`);
      if (respEmissoes.ok) setEmissoes(await respEmissoes.json());

      const respEntregas = await fetch(`${API_URL}/entregas`);
      if (respEntregas.ok) setEntregas(await respEntregas.json());
    } catch (erro) {
      console.error("Erro ao conectar com o Python:", erro);
    }
  };

  const aplicarMascaraCPF = (valor) => {
    let v = valor.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, "$1.$2");
    setCpf(v);
  };

  const salvarManual = async () => {
    if (!operador) return alert("Por favor, preencha o Nome do Atendente lá em cima!");
    if (!nome || cpf.length < 14) return alert("Nome e CPF completos são obrigatórios!");
    const dados = { nome, cpf, data_req: dataReq, zona, operador };
    try {
      const resp = await fetch(`${API_URL}/emissoes/manual`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });
      const json = await resp.json();
      alert(json.mensagem);
      if (json.sucesso) { setNome(''); setCpf(''); setDataReq(''); setZona('URBANA'); carregarTabelas(); }
    } catch (erro) { alert("Erro ao salvar. O servidor Python está ligado?"); }
  };

  const sincronizarPasta = async () => {
    if (!operador) return alert("Por favor, preencha o Nome do Atendente lá em cima!");
    alert("Uma janela do Windows vai abrir no servidor para você selecionar a pasta. Aguarde...");
    try {
      const resp = await fetch(`${API_URL}/sincronizar/${operador}`);
      const json = await resp.json();
      alert(json.mensagem);
      carregarTabelas();
    } catch (e) { alert("Erro de comunicação com o servidor."); }
  };

  const importarLista = async () => {
    alert("Uma janela do Windows vai abrir no servidor para você selecionar o PDF. Aguarde...");
    try {
      const resp = await fetch(`${API_URL}/importar`);
      const json = await resp.json();
      alert(json.mensagem);
      carregarTabelas();
    } catch (e) { alert("Erro de comunicação com o servidor."); }
  };

  const abrirModalEntrega = (id, nomeCidadao) => {
    setRgSelecionado({ id, nomeCidadao });
    setNomeRecebedor(nomeCidadao);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setRgSelecionado(null);
    setNomeRecebedor('');
  };

  const confirmarEntregaRG = async () => {
    if (!nomeRecebedor.trim()) { alert("Por favor, digite o nome de quem está a receber o documento."); return; }
    try {
      const resp = await fetch(`${API_URL}/entregas/${rgSelecionado.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nomeRecebedor }) });
      const json = await resp.json();
      alert(json.mensagem);
      fecharModal();
      carregarTabelas();
    } catch (e) { alert("Erro ao confirmar entrega."); }
  };

  // ==========================================
  // LÓGICA DE FILTRAGEM E PAGINAÇÃO
  // ==========================================
  const entregasFiltradas = entregas.filter(item => {
    if (filtroEntregas === 'Todos') return true;
    return item.status === filtroEntregas;
  });

  const totalPaginas = Math.ceil(entregasFiltradas.length / ITENS_POR_PAGINA) || 1;
  const indexInicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const indexFim = indexInicio + ITENS_POR_PAGINA;
  
  // Aqui nós pegamos apenas os 20 itens da página atual!
  const entregasPaginadas = entregasFiltradas.slice(indexInicio, indexFim);

  return (
    <div className="container-cc">
      <div className="abas-cc">
        <button className={`aba-btn ${subAba === 'emissoes' ? 'ativa' : ''}`} onClick={() => setSubAba('emissoes')}> Emissão de RGs </button>
        <button className={`aba-btn ${subAba === 'entregas' ? 'ativa' : ''}`} onClick={() => setSubAba('entregas')}> Entrega de RGs </button>
      </div>

      <div className="conteudo-cc">
        
        {subAba === 'emissoes' && (
          <div>
            {/* O conteúdo de emissões continua exatamente igual... */}
            <div className="cabecalho-acao">
              <input type="text" className="input-operador" placeholder="Nome do Atendente / Operador *" value={operador} onChange={e => setOperador(e.target.value)} />
              <button className="btn-sincronizar" onClick={sincronizarPasta}> Sincronizar PDFs da Pasta </button>
            </div>

            <h3 style={{ marginBottom: '15px', color: '#555' }}>Cadastro Manual</h3>
            <div className="formulario-manual">
              <div className="grupo-input"><label>Nome Completo</label><input type="text" value={nome} onChange={e => setNome(e.target.value)} /></div>
              <div className="grupo-input"><label>CPF</label><input type="text" value={cpf} onChange={e => aplicarMascaraCPF(e.target.value)} placeholder="000.000.000-00"/></div>
              <div className="grupo-input"><label>Data Requerimento</label><input type="date" value={dataReq} onChange={e => setDataReq(e.target.value)} /></div>
              <div className="grupo-input"><label>Zona</label><select value={zona} onChange={e => setZona(e.target.value)}><option>URBANA</option><option>RURAL</option></select></div>
              <button className="btn-salvar-cc" onClick={salvarManual}> Salvar Emissão Manual </button>
            </div>

            <h3 style={{ color: '#555' }}>Últimos Atendimentos Registados (Top 20)</h3>
            <table className="tabela-dados">
              <thead><tr><th>Nome</th><th>CPF</th><th>Zona</th><th>Operador</th><th>Origem</th></tr></thead>
              <tbody>
                {emissoes.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.cpf}</td>
                    <td style={{ color: item.zona === 'RURAL' ? '#009640' : '#2D68C4', fontWeight: 'bold' }}>{item.zona}</td>
                    <td>{item.operador}</td>
                    <td>{item.origem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {subAba === 'entregas' && (
          <div>
            <div className="cabecalho-acao">
              <p style={{ color: 'grey', margin: 0 }}>Importe a lista do Governo (PDF) para atualizar o stock.</p>
              <button className="btn-sincronizar" style={{ backgroundColor: '#6f42c1' }} onClick={importarLista}> Importar Lista do Governo </button>
            </div>

            {/* BOTÕES DE FILTRO */}
            <div className="filtros-status">
              <button 
                className={`btn-filtro ${filtroEntregas === 'Aguardando Retirada' ? 'ativo' : ''}`} 
                onClick={() => setFiltroEntregas('Aguardando Retirada')}
              >
                ⏳ Aguardando Retirada
              </button>
              <button 
                className={`btn-filtro ${filtroEntregas === 'Entregue' ? 'ativo' : ''}`} 
                onClick={() => setFiltroEntregas('Entregue')}
              >
                ✅ RGs Recebidos
              </button>
              <button 
                className={`btn-filtro ${filtroEntregas === 'Todos' ? 'ativo' : ''}`} 
                onClick={() => setFiltroEntregas('Todos')}
              >
                📋 Todos
              </button>
            </div>

            <table className="tabela-dados">
              <thead><tr><th>Nome do Cidadão</th><th>CPF</th><th>Status</th><th>Ação / Detalhes</th></tr></thead>
              <tbody>
                {entregasPaginadas.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '30px', color: 'grey'}}>Nenhum registo encontrado nesta categoria.</td></tr>}
                
                {entregasPaginadas.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome_cidadao}</td>
                    <td>{item.cpf_cidadao}</td>
                    <td style={{ color: item.status === 'Entregue' ? '#009640' : '#FF5722', fontWeight: 'bold' }}>
                      {item.status}
                    </td>
                    <td>
                      {item.status === 'Aguardando Retirada' ? (
                        <button className="btn-entregar" onClick={() => abrirModalEntrega(item.id, item.nome_cidadao)}> 
                          Entregar 
                        </button>
                      ) : (
                        <span style={{fontSize: '13px', color: 'grey'}}>
                          Retirado por: <strong>{item.recebedor}</strong>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* CONTROLES DE PAGINAÇÃO */}
            {entregasFiltradas.length > 0 && (
              <div className="paginacao">
                <button 
                  className="btn-paginacao" 
                  disabled={paginaAtual === 1} 
                  onClick={() => setPaginaAtual(prev => prev - 1)}
                >
                  ◀ Anterior
                </button>
                <span className="info-paginacao">
                  Página {paginaAtual} de {totalPaginas} <span style={{fontWeight: 'normal', marginLeft: '10px'}}>(Total: {entregasFiltradas.length} RGs)</span>
                </span>
                <button 
                  className="btn-paginacao" 
                  disabled={paginaAtual === totalPaginas} 
                  onClick={() => setPaginaAtual(prev => prev + 1)}
                >
                  Próxima ▶
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Entrega de RG</h3>
            <p>A dar baixa no documento de: <br/><strong style={{fontSize: '18px', color: '#333'}}>{rgSelecionado?.nomeCidadao}</strong></p>
            
            <div className="grupo-input">
              <label>Quem está a retirar o documento no balcão?</label>
              <input type="text" value={nomeRecebedor} onChange={(e) => setNomeRecebedor(e.target.value)} autoFocus />
            </div>

            <div className="modal-acoes">
              <button className="btn-cancelar" onClick={fecharModal}>Cancelar</button>
              <button className="btn-confirmar" onClick={confirmarEntregaRG}>Confirmar Entrega</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CasaCidadao;