import { useState } from 'react'
import './App.css'
// Importamos o novo ecrã que acabámos de criar!
import SistemaPrincipal from './SistemaPrincipal' 

function App() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  
  // NOVA VARIÁVEL: Guarda quem fez login. Se for null, mostra o login.
  const [perfilLogado, setPerfilLogado] = useState(null) 

  const tentarLogin = (e) => {
    e.preventDefault()
    
    const user = usuario.trim().toLowerCase()
    const pass = senha.trim()

    // Em vez de "alert", agora nós dizemos ao React que alguém logou!
    if (user === "admin" && pass === "admin") {
      setPerfilLogado("admin")
    } else if (user === "cadastro" && pass === "1234") {
      setPerfilLogado("cadastro")
    } else if (user === "cidadao" && pass === "1234") {
      setPerfilLogado("cidadao")
    } else {
      setErro("Usuário ou senha incorretos.")
    }
  }

  // A MÁGICA: Se alguém estiver logado, a tela de login desaparece e o Sistema entra em cena!
  if (perfilLogado) {
    // Passamos o perfil e uma função para ele poder deslogar e voltar a esta tela
    return <SistemaPrincipal perfil={perfilLogado} onLogout={() => setPerfilLogado(null)} />
  }

  // Se não houver ninguém logado, mostra o cartão de login normal
  return (
    <div className="tela-fundo">
      <div className="cartao-login">
        
        <div className="cabecalho-login">
          <div className="detalhe-amarelo"></div>
          <h2>SISTEMA INTEGRADO</h2>
        </div>
        <p className="subtitulo">Acesso Restrito</p>

        <form onSubmit={tentarLogin} className="formulario">
          <div className="grupo-input">
            <label>Usuário</label>
            <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
          </div>
          <div className="grupo-input">
            <label>Senha</label>
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>

          {erro && <p className="mensagem-erro">{erro}</p>}

          <button type="submit" className="btn-entrar">
            ACESSAR SISTEMA
          </button>
        </form>

      </div>
    </div>
  )
}

export default App