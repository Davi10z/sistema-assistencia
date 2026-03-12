import React, { useState } from 'react';
import './SistemaPrincipal.css';
import FormularioRegistro from './FormularioRegistro';
import ConsultaCidadao from './ConsultaCidadao';
import GeradorDeclaracoes from './GeradorDeclaracoes';
import CasaCidadao from './CasaCidadao';

// O componente recebe o "perfil" (admin, cadastro) e a função de logout do App.jsx
function SistemaPrincipal({ perfil, onLogout }) {
  // Variável que controla qual aba está aberta no momento
  const [abaAtiva, setAbaAtiva] = useState('registro');

  return (
    <div className="layout-principal">
      
      {/* CABEÇALHO */}
      <header className="cabecalho">
        <div className="logo">
          <div className="detalhe-amarelo"></div>
          <h1>SISTEMA INTEGRADO <i>MUNICIPAL</i></h1>
          <div className="detalhe-amarelo"></div>
        </div>
        <div className="info-usuario">
          <span>SANTA QUITÉRIA - CE | Acesso: <strong>{perfil.toUpperCase()}</strong></span>
          <button onClick={onLogout} className="btn-sair">Sair</button>
        </div>
      </header>

      {/* MENU DE NAVEGAÇÃO */}
      <div className="caixa-menus">
        <button 
          className={`menu-btn ${abaAtiva === 'registro' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('registro')}
        >
          Registrar Atendimento
        </button>
        
        <button 
          className={`menu-btn ${abaAtiva === 'consulta' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('consulta')}
        >
          Consultar
        </button>

        <button className={`menu-btn ${abaAtiva === 'declaracoes' ? 'ativo' : ''}`} onClick={() => setAbaAtiva('declaracoes')}> Declarações </button>
        
        <button 
          className={`menu-btn ${abaAtiva === 'casa_cidadao' ? 'ativo' : ''}`}
          onClick={() => setAbaAtiva('casa_cidadao')}
        >
          Casa do Cidadão
        </button>
      </div>

      {/* ÁREA ONDE O CONTEÚDO MUDA DEPENDENDO DO CLIQUE */}
      <main className="conteudo-aba">
        {abaAtiva === 'registro' && (
          <div>
            <FormularioRegistro />
          </div>
        )}

        {abaAtiva === 'consulta' && (
          <div>
            <ConsultaCidadao />
          </div>
        )}

        {abaAtiva === 'declaracoes' && (
            <div>
                <GeradorDeclaracoes />
            </div>
        )}

        {abaAtiva === 'casa_cidadao' && (
          <div>
            <CasaCidadao />
          </div>
        )}
      </main>

    </div>
  );
}

export default SistemaPrincipal;