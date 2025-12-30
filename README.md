# ⚽ PeladaApp - Frontend

Interface web moderna para gerenciar peladas (partidas de futebol casual) com amigos. Construído com React, TypeScript, Vite e Material-UI.

---

## 📖 Visão Geral

Aplicação frontend que permite:
- **Autenticação**: Registro e login de usuários com JWT
- **Usuários**: Visualizar lista de usuários com paginação
- **Organizações**: Criar e gerenciar organizações de pelada
- **Administradores**: Sistema de gerenciamento de admins por organização
- **Peladas**: Criar, configurar e gerenciar peladas (dias de jogo)
- **Times**: Montagem de times com drag-and-drop
- **Partidas**: Acompanhamento de partidas com placar ao vivo
- **Votação**: Sistema de votação pós-jogo (1-5 estrelas)
- **Estatísticas**: Visualização de estatísticas de jogadores e times
- **Perfil**: Gerenciamento de perfil do usuário

---

## 🚀 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Material-UI (MUI)** - Componentes UI
- **React Router** - Roteamento
- **Vitest** - Testes unitários

---

## 🛠️ Instalação e Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar testes
npm test

# Preview da build de produção
npm run preview
```

---

## 🐳 Docker

```bash
# Build da imagem
docker build -t web-peladaapp:latest . --build-arg TARGETARCH=$(uname -m)

# Executar container
docker run -p 80:80 web-peladaapp:latest
```

---

## 🗂️ Estrutura do Projeto

```text
/
├── src/
│   ├── App.tsx                    # Componente raiz e rotas
│   ├── main.tsx                   # Entry point
│   ├── app/
│   │   ├── providers/             # Context providers (Auth)
│   │   └── routing/               # Rotas protegidas
│   ├── features/
│   │   ├── auth/                  # Login e registro
│   │   ├── home/                  # Página inicial
│   │   ├── organizations/         # Gestão de organizações
│   │   ├── peladas/               # Gestão de peladas e partidas
│   │   └── user/                  # Perfil do usuário
│   ├── shared/
│   │   └── api/                   # Cliente HTTP e endpoints
│   ├── lib/                       # Tema e utilitários
│   └── test/                      # Configuração de testes
├── public/                       # Assets estáticos
├── Dockerfile                    # Build de produção
└── vite.config.ts               # Configuração Vite
```

---

## ⚡ Funcionalidades Principais

### Autenticação e Autorização
- Sistema de login/registro com JWT
- Proteção de rotas baseada em autenticação
- Verificação de permissões (admin/jogador)

### Gerenciamento de Usuários
- Visualizar lista de usuários (paginada)

### Gerenciamento de Organizações
- Criar e listar organizações (paginado)
- Adicionar e remover jogadores
- Gerenciar múltiplos administradores por organização

### Peladas (Dias de Jogo)
- Criar peladas com configurações personalizadas
- Definir número de times e jogadores por time
- Iniciar peladas (gera cronograma automático)
- Encerrar peladas

### Times
- Criar times dentro de uma pelada
- Drag-and-drop para montar times
- Visualizar scores normalizados dos jogadores
- Preencher times aleatoriamente

### Partidas
- Visualizar cronograma de partidas
- Atualizar placares em tempo real
- Registrar eventos (gols, assistências, gols contra)
- Gerenciar escalações por partida
- Finalizar partidas

### Sistema de Votação
- Votar em todos os jogadores (1-5 estrelas)
- Votos obrigatórios após pelada encerrada
- Alterar votos durante período de votação
- Cálculo automático de scores normalizados

### Estatísticas
- Tabela de classificação de times
- Estatísticas individuais de jogadores
- Gols, assistências e gols contra

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` (opcional) para configurações:

```env
VITE_API_URL=http://localhost:8080
```

Por padrão, a aplicação conecta em `http://localhost:8080/api`.

---

## 🔗 API Integration

O frontend consome a API REST do backend (api-peladaapp). Principais endpoints:

- `POST /auth/register` - Registro
- `POST /auth/login` - Login
- `GET /api/users` - Listar usuários (paginado)
- `GET /api/organizations` - Listar organizações (paginado)
- `POST /api/peladas` - Criar pelada
- `POST /api/peladas/:id/teams/randomize` - Randomizar times
- `GET /api/peladas/:id/voting-info` - Info de votação
- `POST /api/votes/batch` - Votar em lote
- `POST /api/scores/normalized` - Obter scores normalizados

Todos os endpoints da API (exceto auth) requerem header:
```
Authorization: Token <jwt>
```

---

## ✅ Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm test -- --watch

# Coverage
npm test -- --coverage
```

Testes incluem:
- Testes unitários de componentes
- Testes de providers (AuthProvider)
- Testes de rotas protegidas
- Testes de cliente API

---

## 🎨 UI/UX

- Design responsivo com Material-UI
- Tema personalizado com cores da paleta de futebol
- Feedback visual para ações do usuário
- Drag-and-drop intuitivo para montagem de times
- Navegação clara e organizada

---

## 🔒 Segurança

- Tokens JWT armazenados em localStorage
- Rotas protegidas com verificação de autenticação
- Validação de permissões no frontend e backend
- Logout seguro com limpeza de sessão

---

## ⚖️ Licença

MIT License

---

## 🤝 Contribuindo

Este é um projeto privado. Para contribuir:
1. Crie uma branch para sua feature
2. Faça commit das mudanças
3. Abra um Pull Request

---

## ❓ Suporte

Para questões ou problemas, entre em contato com a equipe de desenvolvimento.