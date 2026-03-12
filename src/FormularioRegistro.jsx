import React, { useState } from 'react';
import './FormularioRegistro.css';

const URL_DO_APP_SCRIPT = "https://script.google.com/macros/s/AKfycbxiOojCK3fNlEpzhJifzvNt3e-HIp5ozrMq5P6fkga1PqgHht-StkvUk0rY3o_lv3ZZ9Q/exec";

function FormularioRegistro() {
  // Variáveis para guardar o que o utilizador digita
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [membros, setMembros] = useState('');
  const [atendimento, setAtendimento] = useState('');
  
  const [tipoEndereco, setTipoEndereco] = useState(''); // URBANO ou RURAL
  const [local, setLocal] = useState(''); // Bairro ou Distrito
  const [psf, setPsf] = useState(''); 
  
  const [temBeneficio, setTemBeneficio] = useState(''); // SIM ou NÃO
  const [qualBeneficio, setQualBeneficio] = useState('');

  // Variável para controlar os avisos (Sucesso, Erro, A Enviar...)
  const [status, setStatus] = useState({ tipo: '', mensagem: '' });

  // A famosa função para formatar o CPF automaticamente!
  const aplicarMascaraCPF = (valor) => {
    let v = valor.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, "$1.$2");
    setCpf(v);
  };

  // Função que envia os dados para o Google Sheets
  const enviarDados = async (e) => {
    e.preventDefault(); // Impede o ecrã de recarregar

    if (!nome || !cpf || !atendimento || !tipoEndereco || !temBeneficio) {
      setStatus({ tipo: 'erro', mensagem: 'Por favor, preencha todos os campos obrigatórios (*).' });
      return;
    }

    setStatus({ tipo: 'carregando', mensagem: 'A enviar dados para a base de dados...' });

    const dados = {
      nome: nome,
      cpf: cpf,
      endereco_tipo: tipoEndereco,
      local: local,
      psf: psf,
      familia: membros,
      atendimento: atendimento,
      tem_beneficio: temBeneficio,
      beneficio: temBeneficio === 'SIM' ? qualBeneficio : 'NÃO'
    };

    try {
      // Fazemos o POST para o Google Sheets. Usamos text/plain para contornar bloqueios do browser (CORS)
      const resposta = await fetch(URL_DO_APP_SCRIPT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(dados)
      });

      if (resposta.ok) {
        setStatus({ tipo: 'sucesso', mensagem: 'Atendimento registado com sucesso!' });
        // Limpar o formulário após salvar
        setNome(''); setCpf(''); setMembros(''); setAtendimento('');
        setTipoEndereco(''); setLocal(''); setPsf(''); setTemBeneficio(''); setQualBeneficio('');
        
        // Apaga a mensagem de sucesso após 3 segundos
        setTimeout(() => setStatus({ tipo: '', mensagem: '' }), 3000);
      } else {
        setStatus({ tipo: 'erro', mensagem: 'Ocorreu um erro no servidor do Google.' });
      }
    } catch (erro) {
      setStatus({ tipo: 'erro', mensagem: 'Erro de ligação. Verifique a sua internet.' });
    }
  };

  return (
    <div className="container-formulario">
      <form onSubmit={enviarDados}>
        
        <div className="grelha-dupla">
          {/* COLUNA 1: DADOS DO CIDADÃO */}
          <div className="coluna-form">
            <h3 className="titulo-sessao">DADOS DO CIDADÃO</h3>
            
            <div className="grupo-input">
              <label>Nome Completo *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} required />
            </div>

            <div className="linha-dupla">
              <div className="grupo-input" style={{ flex: 2 }}>
                <label>CPF *</label>
                <input type="text" value={cpf} onChange={e => aplicarMascaraCPF(e.target.value)} placeholder="000.000.000-00" required />
              </div>
              <div className="grupo-input" style={{ flex: 1 }}>
                <label>Membros</label>
                <input type="number" value={membros} onChange={e => setMembros(e.target.value)} />
              </div>
            </div>

            <div className="grupo-input">
              <label>Tipo de Atendimento *</label>
              <select value={atendimento} onChange={e => setAtendimento(e.target.value)} required>
                <option value="">Selecione uma opção...</option>
                <option value="NOVO CADASTRO">NOVO CADASTRO</option>
                <option value="MUDANÇA DE MUNICIPIO">MUDANÇA DE MUNICIPIO</option>
                <option value="ATUALIZAÇÃO">ATUALIZAÇÃO</option>
                <option value="INCLUSÃO">INCLUSÃO</option>
                <option value="EXCLUSÃO DE MEMBRO">EXCLUSÃO DE MEMBRO</option>
                <option value="CONSULTA">CONSULTA</option>
                <option value="FOLHA RESUMO">FOLHA RESUMO</option>
              </select>
            </div>
          </div>

          {/* COLUNA 2: LOCALIZAÇÃO E SOCIAL */}
          <div className="coluna-form">
            <h3 className="titulo-sessao">LOCALIZAÇÃO E SOCIAL</h3>

            <div className="grupo-input">
              <label>Endereço *</label>
              <div className="grupo-radio">
                <label><input type="radio" name="endereco" value="URBANO" checked={tipoEndereco === 'URBANO'} onChange={e => setTipoEndereco(e.target.value)} /> Urbano</label>
                <label><input type="radio" name="endereco" value="RURAL" checked={tipoEndereco === 'RURAL'} onChange={e => setTipoEndereco(e.target.value)} /> Rural</label>
              </div>
            </div>

            {/* CAMPOS DINÂMICOS - Mostra Bairro se Urbano, Distrito se Rural */}
            {tipoEndereco === 'URBANO' && (
              <div className="linha-dupla">
                <div className="grupo-input">
                  <label>Nome do Bairro *</label>
                  <input type="text" value={local} onChange={e => setLocal(e.target.value)} required />
                </div>
                <div className="grupo-input">
                  <label>PSF (Urbano) *</label>
                  <select value={psf} onChange={e => setPsf(e.target.value)} required>
                    <option value="">Selecione...</option>
                    <option value="PEREIROS">PEREIROS</option>
                    <option value="CENTRO/PIRACICABA">CENTRO/PIRACICABA</option>
                    <option value="BOA VIDA">BOA VIDA</option>
                    <option value="FLORES">FLORES</option>
                  </select>
                </div>
              </div>
            )}

            {tipoEndereco === 'RURAL' && (
              <div className="linha-dupla">
                <div className="grupo-input">
                  <label>Distrito/Fazenda *</label>
                  <input type="text" value={local} onChange={e => setLocal(e.target.value)} required />
                </div>
                <div className="grupo-input">
                  <label>PSF (Rural) *</label>
                  <select value={psf} onChange={e => setPsf(e.target.value)} required>
                    <option value="">Selecione...</option>
                    <option value="RIACHO DAS PEDRAS">RIACHO DAS PEDRAS</option>
                    <option value="LISIEUX">LISIEUX</option>
                    <option value="RAIMUNDO MARTINS">RAIMUNDO MARTINS</option>
                    <option value="MACARAÚ">MACARAÚ</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grupo-input" style={{ marginTop: '10px' }}>
              <label>Possui Benefício? *</label>
              <div className="grupo-radio">
                <label><input type="radio" name="beneficio" value="SIM" checked={temBeneficio === 'SIM'} onChange={e => setTemBeneficio(e.target.value)} /> Sim</label>
                <label><input type="radio" name="beneficio" value="NÃO" checked={temBeneficio === 'NÃO'} onChange={e => setTemBeneficio(e.target.value)} /> Não</label>
              </div>
            </div>

            {/* Aparece apenas se ele marcar SIM no benefício */}
            {temBeneficio === 'SIM' && (
              <div className="grupo-input">
                <label>Qual Benefício? *</label>
                <select value={qualBeneficio} onChange={e => setQualBeneficio(e.target.value)} required>
                  <option value="">Selecione...</option>
                  <option value="BPC/LOAS">BPC/LOAS</option>
                  <option value="BOLSA FAMILIA">BOLSA FAMILIA</option>
                  <option value="OUTRO">OUTRO</option>
                </select>
              </div>
            )}

          </div>
        </div>

        {/* MENSAGEM DE ERRO OU SUCESSO */}
        {status.mensagem && (
          <div className={`status-mensagem status-${status.tipo}`}>
            {status.mensagem}
          </div>
        )}

        <button type="submit" className="botao-salvar">
          REGISTRAR ATENDIMENTO
        </button>

      </form>
    </div>
  );
}

export default FormularioRegistro;