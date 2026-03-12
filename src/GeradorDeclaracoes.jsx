import React, { useState } from 'react';
import { jsPDF } from "jspdf";
import './GeradorDeclaracoes.css';

function GeradorDeclaracoes() {
  const [nome, setNome] = useState('');
  const [nacionalidade, setNacionalidade] = useState('brasileiro(a)');
  const [estadoCivil, setEstadoCivil] = useState('Solteiro(a)');
  const [profissao, setProfissao] = useState('');
  const [rg, setRg] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');

  const aplicarMascaraCPF = (valor) => {
    let v = valor.replace(/\D/g, "").slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3");
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, "$1.$2");
    setCpf(v);
  };

  const gerarPDF = (e) => {
    e.preventDefault();

    if (!nome || !cpf || !endereco || !profissao) {
      alert("Preencha todos os campos obrigatórios (*).");
      return;
    }

    // Cria o documento PDF (A4 por padrão)
    const doc = new jsPDF();

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("DECLARAÇÃO DE HIPOSSUFICIÊNCIA FINANCEIRA", 105, 30, null, null, "center");

    // Corpo do Texto
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const trechoDocumentos = rg ? `portador(a) do RG nº ${rg} e CPF nº ${cpf},` : `portador(a) do CPF nº ${cpf},`;
    
    const textoDeclaracao = `Eu, ${nome.toUpperCase()}, ${nacionalidade}, ${estadoCivil.toLowerCase()}, ${profissao.toLowerCase()}, ${trechoDocumentos} residente e domiciliado(a) na ${endereco}, declaro, sob as penas da lei (art. 299 do Código Penal), que não possuo recursos financeiros suficientes para arcar com os custos de emissão da 2ª via da certidão de nascimento, sem prejuízo do meu sustento próprio e de minha família.\n\nPor ser verdade, firmo a presente.`;

    // Quebra o texto para caber nas margens do PDF (largura de 170mm)
    const linhas = doc.splitTextToSize(textoDeclaracao, 170);
    doc.text(linhas, 20, 50);

    // Data e Assinatura
    const dataAtual = new Date();
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dataExtenso = `Santa Quitéria - CE, ${dataAtual.getDate()} de ${meses[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}.`;

    doc.text(dataExtenso, 105, 120, null, null, "center");
    doc.text("___________________________________________________________", 105, 140, null, null, "center");
    doc.text(nome.toUpperCase(), 105, 148, null, null, "center");
    doc.text("Requerente", 105, 155, null, null, "center");

    // Limpa o nome para salvar o arquivo sem espaços
    const nomeArquivo = `${nome.trim().replace(/\s+/g, '+')}+${cpf}.pdf`;
    
    // Dispara o download automático no navegador!
    doc.save(nomeArquivo);
  };

  return (
    <div className="container-declaracao">
      <div className="cabecalho-declaracao">
        <h3>GERADOR DE DECLARAÇÕES E DOCUMENTOS</h3>
        <p>Preencha os dados do cidadão para gerar um documento em PDF pronto para impressão e assinatura.</p>
      </div>

      <form className="formulario-declaracao" onSubmit={gerarPDF}>
        <div className="grupo-input">
          <label>Modelo de Declaração</label>
          <select disabled>
            <option>Isenção - 2ª Via de Certidão</option>
          </select>
        </div>

        <div className="linha-inputs">
          <div className="grupo-input" style={{ flex: 2 }}>
            <label>Nome Completo *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="grupo-input" style={{ flex: 1 }}>
            <label>Nacionalidade</label>
            <input type="text" value={nacionalidade} onChange={e => setNacionalidade(e.target.value)} />
          </div>
        </div>

        <div className="linha-inputs">
          <div className="grupo-input">
            <label>Estado Civil</label>
            <select value={estadoCivil} onChange={e => setEstadoCivil(e.target.value)}>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
            </select>
          </div>
          <div className="grupo-input">
            <label>Profissão *</label>
            <input type="text" value={profissao} onChange={e => setProfissao(e.target.value)} required />
          </div>
        </div>

        <div className="linha-inputs">
          <div className="grupo-input">
            <label>RG nº</label>
            <input type="text" value={rg} onChange={e => setRg(e.target.value)} />
          </div>
          <div className="grupo-input">
            <label>CPF nº *</label>
            <input type="text" value={cpf} onChange={e => aplicarMascaraCPF(e.target.value)} required />
          </div>
        </div>

        <div className="grupo-input">
          <label>Endereço Completo (Rua, Bairro, Número) *</label>
          <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} required />
        </div>

        <button type="submit" className="btn-gerar-pdf">
          GERAR E BAIXAR PDF
        </button>
      </form>
    </div>
  );
}

export default GeradorDeclaracoes;