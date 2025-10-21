# Sistema de Provas com IA 🎓

**Desenvolvido por: Gustavo da Silva Santos - GS SOLUÇÕES PRO**

Este é um sistema completo que desenvolvi para automatizar a criação, aplicação e correção de provas educacionais. O projeto integra inteligência artificial (Claude AI) para gerar questões automaticamente e auxiliar na correção, tornando o processo mais eficiente para educadores.

## 🚀 O que o Sistema Faz

Criei este sistema pensando nas dificuldades que professores enfrentam ao criar e corrigir provas. Ele oferece:

### ✅ Geração Inteligente de Provas

- **Criação Manual**: Interface intuitiva para criar questões personalizadas
- **Geração com IA**: A Claude AI cria questões baseadas em temas e materiais de apoio
- Suporte completo a questões objetivas e dissertativas
- Sistema flexível de pontuação

### ✅ Aplicação de Provas

- Interface limpa e responsiva para os alunos
- Validação de dados e salvamento automático
- Suporte a diferentes tipos de questão
- Experiência otimizada para dispositivos móveis

### ✅ Correção Automatizada

- **IA para Dissertativas**: Claude AI analisa e corrige questões abertas
- **Automática para Objetivas**: Correção instantânea de múltipla escolha
- **Correção Manual**: Opção para revisão humana completa
- Sistema de feedback detalhado e personalizado

### ✅ Gestão de Resultados

- Dashboard completo com todas as correções
- Sistema de notas com classificação por letras (A-F)
- Relatórios detalhados de desempenho
- Histórico completo de avaliações

## 🛠️ Tecnologias Utilizadas

Escolhi uma stack moderna e robusta para garantir performance e escalabilidade:

- **Frontend**: React 18 + Tailwind CSS + React Router
- **Backend**: Node.js + Express + Mongoose
- **Banco de Dados**: MongoDB
- **IA**: Claude AI (Anthropic SDK)
- **Upload**: Multer + PDF-Parse
- **Gerenciamento**: pnpm
- **Desenvolvimento**: Nodemon + Concurrently

## 📋 Requisitos do Sistema

Para rodar o projeto, você precisará ter instalado:

- **Node.js** (versão 16 ou superior)
- **MongoDB** (local ou cloud)
- **pnpm** (gerenciador de pacotes)
- **Chave da API Claude** - [Obter aqui](https://console.anthropic.com/)

## 🚀 Como Executar o Projeto

### 1. Clone o Repositório

```bash
git clone https://github.com/GustavodaSilvaSantos/sistema-provas-ai.git
cd sistema-provas-ai
```

### 2. Instale as Dependências

```bash
# Dependências do projeto principal
pnpm install

# Dependências do backend
cd server && pnpm install

# Dependências do frontend
cd ../client && pnpm install

# Volte para a raiz
cd ..
```

### 3. Configure o Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
# Copie o arquivo de exemplo
cp server/.env.example server/.env
```

Edite o arquivo `server/.env` com suas configurações:

```env
# Sua chave da API Claude (obrigatório)
ANTHROPIC_API_KEY=sua-chave-da-claude-aqui

# Configuração do MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/sistema-provas

# Porta do servidor (opcional)
PORT=5000
```

### 4. Execute o Sistema

```bash
# Executa frontend e backend simultaneamente
pnpm run dev

# Ou execute separadamente:
pnpm run server  # Apenas backend
pnpm run client  # Apenas frontend

# Para produção:
pnpm run prod
```

O sistema estará disponível em:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

## 📖 Como Usar o Sistema

### 🎯 Criando Provas

**Método 1 - Criação Manual:**

1. Acesse "Criar Prova" no menu principal
2. Escolha "Criação Manual"
3. Defina título e descrição da prova
4. Adicione questões uma por uma (objetivas ou dissertativas)
5. Configure pontuação e gabaritos
6. Finalize a criação

**Método 2 - Geração com IA:**

1. Selecione "Geração com IA"
2. Informe o tema da prova
3. Adicione materiais de apoio (texto ou PDF)
4. Defina quantidade de questões (1-20)
5. Deixe a Claude AI gerar automaticamente

### 📝 Aplicando Provas

1. Compartilhe o link da prova com os alunos
2. Alunos acessam, informam o nome e respondem
3. Sistema salva automaticamente as respostas
4. Prova fica disponível para correção

### ✅ Corrigindo Provas

**Correção Automática:**

- IA analisa questões dissertativas
- Questões objetivas são corrigidas automaticamente
- Sistema gera feedback personalizado

**Correção Manual:**

- Revisor humano avalia todas as questões
- Controle total sobre notas e comentários
- Ideal para avaliações mais criteriosas

### 📊 Visualizando Resultados

- Dashboard com todas as correções
- Notas classificadas de A a F
- Relatórios detalhados de desempenho
- Histórico completo de avaliações

## 🏗️ Arquitetura do Sistema

### Estrutura do Banco de Dados

O MongoDB organiza os dados em três coleções principais:

- **exams**: Armazena as provas criadas (estrutura e questões)
- **studentanswers**: Guarda as respostas dos alunos
- **corrections**: Mantém as correções e notas finais

### Integração com IA

Implementei integração completa com a Claude AI:

- **Geração Inteligente**: Claude-3-Sonnet cria questões contextualizadas
- **Processamento de PDF**: Extração automática de texto para contexto
- **Correção Assistida**: IA auxilia na avaliação de questões dissertativas
- **Feedback Personalizado**: Comentários adaptativos baseados no desempenho

## 🔧 Funcionalidades Técnicas

### Upload e Processamento de PDF

- Suporte a arquivos até 10MB
- Extração automática de texto usando pdf-parse
- Limite inteligente de 100.000 caracteres total
- Múltiplos PDFs como contexto (até 5 resumos)
- Validação de tipo de arquivo (apenas PDF)
- Contador em tempo real de caracteres

### Sistema de Correção

- Algoritmo híbrido (automático + IA + manual)
- Classificação por letras (A, B, C, D, F)
- Feedback contextualizado
- Histórico completo de avaliações

### API Endpoints

O backend oferece uma API RESTful completa:

- **`/api/exams`** - Gerenciamento de provas
- **`/api/students`** - Respostas dos alunos
- **`/api/corrections`** - Sistema de correção
- **`/api/pdf`** - Upload e extração de PDF
- **`/api/auth`** - Autenticação (se implementada)

## 🚨 Solução de Problemas

### Problemas Comuns

**MongoDB não conecta:**

```bash
# Verifique se está rodando
mongod --version

# Inicie o serviço se necessário
mongod
```

**Erro de dependências:**

```bash
# Limpe o cache e reinstale
pnpm store prune
rm -rf node_modules
pnpm install
```

**Porta em uso:**

- Altere a porta no arquivo `server/index.js`
- Ou mate o processo no Windows: `netstat -ano | findstr :5000` e `taskkill /PID <PID> /F`

## 💡 Sobre o Desenvolvimento

Desenvolvi este sistema como uma solução completa para automatizar processos educacionais. O foco foi criar uma ferramenta que realmente facilite o trabalho de educadores, combinando a eficiência da automação com a flexibilidade necessária para diferentes contextos educacionais.

### Principais Desafios Resolvidos:

- Integração complexa com IA para geração contextualizada
- Sistema híbrido de correção (automática + manual)
- Interface responsiva e intuitiva
- Processamento eficiente de documentos PDF
- Arquitetura escalável e modular
- Validação robusta de dados e limites
- Sistema de fallback quando IA não está disponível
- Gerenciamento de estado complexo no frontend

## 📞 Contato

**Gustavo da Silva Santos**  
**GS SOLUÇÕES PRO**

Para dúvidas sobre implementação, customizações ou parcerias:

- 📱 **WhatsApp**: [+55 79 9 9635-2942](https://wa.me/5579996352942)
- 📧 **Email**: tech_gustavo@proton.me
- 💼 **LinkedIn**: [linkedin.com/in/gustavo-da-silva-santos-b93117366](https://www.linkedin.com/in/gustavo-da-silva-santos-b93117366)
- 📸 **Instagram**: [@gs.solucoes.pro](https://instagram.com/gs.solucoes.pro)

---

_Sistema desenvolvido com foco em inovação educacional e automação inteligente._

## 📄 Licença

Este projeto está sob **Licença de Uso Pessoal**.  
Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

Para uso comercial, entre em contato: tech_gustavo@proton.me
