from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import sqlite3
import fitz  # PyMuPDF
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def conectar():
    conn = sqlite3.connect("bd_casa_cidadao.db")
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# 🚨 A PEÇA QUE FALTAVA: CRIAR AS TABELAS 🚨
# ==========================================
def inicializar_banco():
    conn = conectar()
    conn.execute('''CREATE TABLE IF NOT EXISTS emissoes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, cpf TEXT, data_requerimento TEXT, data_nascimento TEXT, endereco TEXT, bairro TEXT, zona TEXT, origem TEXT, operador TEXT, data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS listaIdentidades (id INTEGER PRIMARY KEY AUTOINCREMENT, nome_cidadao TEXT, cpf_cidadao TEXT, status TEXT DEFAULT 'Aguardando Retirada', data_chegada TIMESTAMP DEFAULT CURRENT_TIMESTAMP, recebedor TEXT, data_entrega TIMESTAMP)''')
    conn.commit()
    conn.close()

# Executa a função toda a vez que o servidor ligar
inicializar_banco()
# ==========================================

# ==========================================
# ROTAS DE LEITURA E CADASTRO MANUAL
# ==========================================
@app.get("/api/emissoes")
def listar_emissoes():
    conn = conectar()
    dados = conn.execute("SELECT * FROM emissoes ORDER BY id DESC LIMIT 20").fetchall()
    conn.close()
    return [dict(linha) for linha in dados]

@app.get("/api/entregas")
def listar_entregas():
    conn = conectar()
    dados = conn.execute("SELECT * FROM listaIdentidades ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(linha) for linha in dados]

class EmissaoManual(BaseModel):
    nome: str
    cpf: str
    data_req: str
    zona: str
    operador: str

@app.post("/api/emissoes/manual")
def salvar_manual(dados: EmissaoManual):
    conn = conectar()
    conn.execute("INSERT INTO emissoes (nome, cpf, data_requerimento, zona, origem, operador) VALUES (?, ?, ?, ?, 'Manual', ?)", 
                 (dados.nome, dados.cpf, dados.data_req, dados.zona, dados.operador))
    conn.commit()
    conn.close()
    return {"mensagem": "Atendimento salvo com sucesso!", "sucesso": True}

class Recebedor(BaseModel):
    nome: str

@app.put("/api/entregas/{id_registro}")
def entregar_rg(id_registro: int, dados: Recebedor):
    conn = conectar()
    conn.execute("UPDATE listaIdentidades SET status = 'Entregue', recebedor = ?, data_entrega = CURRENT_TIMESTAMP WHERE id = ?", (dados.nome, id_registro))
    conn.commit()
    conn.close()
    return {"mensagem": f"RG entregue para {dados.nome}!", "sucesso": True}

# ==========================================
# NOVAS ROTAS DE UPLOAD DE ARQUIVOS (WEB)
# ==========================================

# 1. Recebe UM PDF com a Lista do Governo
@app.post("/api/importar")
async def importar_lista_governo(arquivo: UploadFile = File(...)):
    dados_extraidos = []
    cpfs_processados = set()

    try:
        # Lê o ficheiro que veio da internet diretamente para a memória
        pdf_bytes = await arquivo.read()
        
        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            for pagina in doc:
                palavras = pagina.get_text("words")
                linhas_dict = {}
                for p in palavras:
                    y1 = p[3] 
                    alocado = False
                    for y_linha in list(linhas_dict.keys()):
                        if abs(y_linha - y1) < 5: 
                            linhas_dict[y_linha].append(p)
                            alocado = True
                            break
                    if not alocado: linhas_dict[y1] = [p]
                
                for y_linha in sorted(linhas_dict.keys()):
                    palavras_linha = sorted(linhas_dict[y_linha], key=lambda item: item[0])
                    texto_linha = " ".join([item[4] for item in palavras_linha])
                    texto_tratado = re.sub(r'(?<=\d)\s+(?=\d)', '', texto_linha)
                    
                    match = re.search(r'(\d{11})\s*[-]?\s*(.+)', texto_tratado)
                    if match:
                        ident_num = match.group(1)
                        nome_pessoa = match.group(2).strip().upper()
                        if "IDENTIFICADOR" not in nome_pessoa and "NOME" not in nome_pessoa:
                            if ident_num not in cpfs_processados:
                                dados_extraidos.append((ident_num, nome_pessoa))
                                cpfs_processados.add(ident_num)

        if dados_extraidos:
            conn = conectar()
            conn.execute("DELETE FROM listaIdentidades")
            for cpf, nome in dados_extraidos:
                conn.execute("INSERT INTO listaIdentidades (nome_cidadao, cpf_cidadao, status) VALUES (?, ?, 'Aguardando Retirada')", (nome, cpf))
            conn.commit()
            conn.close()
            return {"mensagem": f"VITÓRIA! Foram importados {len(dados_extraidos)} registos do PDF!", "sucesso": True}
        else:
            return {"mensagem": "Nenhum dado válido encontrado no ficheiro.", "sucesso": False}
    except Exception as e:
        return {"mensagem": f"Erro ao ler PDF: {str(e)}", "sucesso": False}

# 2. Recebe MÚLTIPLOS PDFs para Sincronizar
@app.post("/api/sincronizar/{operador}")
async def sincronizar_pdfs(operador: str, arquivos: List[UploadFile] = File(...)):
    conn = conectar()
    cursor = conn.cursor()
    registos_salvos = 0
    zonas_rurais = ["RIACHO DAS PEDRAS", "LISIEUX", "RAIMUNDO MARTINS", "MACARAÚ", "TRAPIÁ", "LOGRADOURO", "SACO DO BELÉM", "MALHADA GRANDE", "VALPARAÍSO", "SANGRADOURO"]

    for arquivo in arquivos:
        try:
            pdf_bytes = await arquivo.read()
            with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
                texto_raw = ""
                for pagina in doc: texto_raw += pagina.get_text("text") + "\n"
                
                match_nome = re.search(r'06\.\s*NOME COMPLETO\n(.*?)\n', texto_raw, re.IGNORECASE)
                nome = match_nome.group(1).strip() if match_nome else "NÃO INFORMADO"
                if nome == "NÃO INFORMADO": continue
                
                cpfs = re.findall(r'(?<!\d)\d{11}(?!\d)', re.sub(r'(?<=\d)[ \t]+(?=\d)', '', texto_raw))
                cpf = cpfs[0] if cpfs else ""
                
                zona = "URBANA"
                for zr in zonas_rurais:
                    if zr in texto_raw.upper():
                        zona = "RURAL"
                        break

                cursor.execute('''INSERT INTO emissoes (nome, cpf, zona, origem, operador) VALUES (?, ?, ?, ?, ?)''', (nome, cpf, zona, "Sincronizado (Upload)", operador.upper()))
                registos_salvos += 1
        except Exception:
            continue

    conn.commit()
    conn.close()
    return {"mensagem": f"Sucesso! {registos_salvos} RGs extraídos e enviados para a nuvem!", "sucesso": True}