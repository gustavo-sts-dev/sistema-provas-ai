# Sistema de Provas - Configuração de Ambientes

## 🚀 Ambientes Disponíveis

O sistema detecta automaticamente o ambiente baseado na variável `NODE_ENV`:

### 📝 Desenvolvimento (Development)
- **Porta**: 5000
- **MongoDB**: `sistema-provas-dev`
- **Logging**: Ativado
- **Hot Reload**: Ativado
- **CORS**: Permissivo para localhost

### 🏭 Produção (Production)
- **Porta**: 3000
- **MongoDB**: `sistema-provas-prod`
- **Logging**: Desativado
- **Hot Reload**: Desativado
- **CORS**: Configurado para produção

## 🛠️ Comandos Disponíveis

### Desenvolvimento
```bash
# Executar em modo desenvolvimento
pnpm run dev

# Apenas o servidor em desenvolvimento
pnpm run server

# Apenas o cliente em desenvolvimento
pnpm run client
```

### Produção
```bash
# Executar em modo produção
pnpm run prod

# Apenas o servidor em produção
pnpm run server-prod

# Build do cliente para produção
pnpm run client-prod
```

## 🔧 Configuração Manual

### Definir Ambiente
```bash
# Desenvolvimento
export NODE_ENV=development

# Produção
export NODE_ENV=production
```

### URLs por Ambiente

#### Desenvolvimento
- **API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **MongoDB**: mongodb://127.0.0.1:27017/sistema-provas-dev

#### Produção
- **API**: http://localhost:3000
- **Frontend**: http://localhost:3000 (build estático)
- **MongoDB**: mongodb://127.0.0.1:27017/sistema-provas-prod

## 📊 Verificar Ambiente

Acesse `http://localhost:PORTA/` para ver informações do ambiente atual:

```json
{
  "message": "API do Sistema de Provas funcionando!",
  "environment": "development",
  "port": 5000,
  "mongodb": "mongodb://127.0.0.1:27017/sistema-provas-dev",
  "urls": {
    "api": "http://localhost:5000",
    "frontend": "http://localhost:3000",
    "mongodb": "mongodb://127.0.0.1:27017/sistema-provas-dev"
  },
  "features": {
    "logging": true,
    "hotReload": true
  }
}
```

## 🗄️ Bancos de Dados Separados

- **Desenvolvimento**: `sistema-provas-dev`
- **Produção**: `sistema-provas-prod`

Isso garante que os dados de desenvolvimento não afetem a produção.

## 🔐 Configuração de Senha

Para cada ambiente, configure a senha no banco correspondente:

### Desenvolvimento
```javascript
// Conectar ao banco de desenvolvimento
mongosh mongodb://127.0.0.1:27017/sistema-provas-dev

// Inserir senha
db.passwords.insertOne({
  password: "senha_dev",
  createdAt: new Date()
})
```

### Produção
```javascript
// Conectar ao banco de produção
mongosh mongodb://127.0.0.1:27017/sistema-provas-prod

// Inserir senha
db.passwords.insertOne({
  password: "senha_prod",
  createdAt: new Date()
})
```

## ⚡ Início Rápido

1. **Desenvolvimento**:
   ```bash
   pnpm run dev
   ```

2. **Produção**:
   ```bash
   pnpm run prod
   ```

3. **Verificar**: Acesse http://localhost:PORTA/ para confirmar o ambiente
