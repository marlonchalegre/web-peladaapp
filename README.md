# ?? PeladaApp - Frontend

Interface web moderna para gerenciar peladas (partidas de futebol casual) com amigos. Constru?do com React, TypeScript, Vite e Material-UI.

---

## ?? Vis?o Geral

Aplica??o frontend que permite:
- **Autentica??o**: Registro e login de usu?rios com JWT
- **Organiza??es**: Criar e gerenciar organiza??es de pelada
- **Administradores**: Sistema de gerenciamento de admins por organiza??o
- **Peladas**: Criar, configurar e gerenciar peladas (dias de jogo)
- **Times**: Montagem de times com drag-and-drop
- **Partidas**: Acompanhamento de partidas com placar ao vivo
- **Vota??o**: Sistema de vota??o p?s-jogo (1-5 estrelas)
- **Estat?sticas**: Visualiza??o de estat?sticas de jogadores e times
- **Perfil**: Gerenciamento de perfil do usu?rio

---

## ?? Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Tipagem est?tica
- **Vite** - Build tool e dev server
- **Material-UI (MUI)** - Componentes UI
- **React Router** - Roteamento
- **Vitest** - Testes unit?rios

---

## ??? Instala??o e Desenvolvimento

```bash
# Instalar depend?ncias
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produ??o
npm run build

# Executar testes
npm test

# Preview da build de produ??o
npm run preview
```

---

## ?? Docker

```bash
# Build da imagem
docker build -t web-peladaapp:latest .

# Executar container
docker run -p 80:80 web-peladaapp:latest
```

---

## ?? Estrutura do Projeto

```text
/
??? src/
?   ??? App.tsx                    # Componente raiz e rotas
?   ??? main.tsx                   # Entry point
?   ??? app/
?   ?   ??? providers/             # Context providers (Auth)
?   ?   ??? routing/               # Rotas protegidas
?   ??? features/
?   ?   ??? auth/                  # Login e registro
?   ?   ??? home/                  # P?gina inicial
?   ?   ??? organizations/         # Gest?o de organiza??es
?   ?   ??? peladas/              # Gest?o de peladas e partidas
?   ?   ??? user/                 # Perfil do usu?rio
?   ??? shared/
?   ?   ??? api/                  # Cliente HTTP e endpoints
?   ??? lib/                      # Tema e utilit?rios
?   ??? test/                     # Configura??o de testes
??? public/                       # Assets est?ticos
??? Dockerfile                    # Build de produ??o
??? vite.config.ts               # Configura??o Vite
```

---

## ?? Funcionalidades Principais

### Autentica??o e Autoriza??o
- Sistema de login/registro com JWT
- Prote??o de rotas baseada em autentica??o
- Verifica??o de permiss?es (admin/jogador)

### Gerenciamento de Organiza??es
- Criar e listar organiza??es
- Adicionar e remover jogadores
- Gerenciar m?ltiplos administradores por organiza??o

### Peladas (Dias de Jogo)
- Criar peladas com configura??es personalizadas
- Definir n?mero de times e jogadores por time
- Iniciar peladas (gera cronograma autom?tico)
- Encerrar peladas

### Times
- Criar times dentro de uma pelada
- Drag-and-drop para montar times
- Visualizar scores normalizados dos jogadores
- Preencher times aleatoriamente

### Partidas
- Visualizar cronograma de partidas
- Atualizar placares em tempo real
- Registrar eventos (gols, assist?ncias, gols contra)
- Gerenciar escala??es por partida
- Finalizar partidas

### Sistema de Vota??o
- Votar em todos os jogadores (1-5 estrelas)
- Votos obrigat?rios ap?s pelada encerrada
- Alterar votos durante per?odo de vota??o
- C?lculo autom?tico de scores normalizados

### Estat?sticas
- Tabela de classifica??o de times
- Estat?sticas individuais de jogadores
- Gols, assist?ncias e gols contra

---

## ?? Configura??o

### Vari?veis de Ambiente

Crie um arquivo `.env` (opcional) para configura??es:

```env
VITE_API_URL=http://localhost:8080
```

Por padr?o, a aplica??o conecta em `http://localhost:8080/api`.

---

## ?? API Integration

O frontend consome a API REST do backend (api-peladaapp). Principais endpoints:

- `POST /auth/register` - Registro
- `POST /auth/login` - Login
- `GET /api/organizations` - Listar organiza??es
- `POST /api/peladas` - Criar pelada
- `GET /api/peladas/:id/voting-info` - Info de vota??o
- `POST /api/votes/batch` - Votar em lote

Todos os endpoints da API (exceto auth) requerem header:
```
Authorization: Token <jwt>
```

---

## ? Melhorias Recentes

### Corre??es de Encoding (2025-01-29)
- Corrigido problema de exibi??o de caracteres especiais (?, ?, ?, etc.)
- Caracteres que apareciam como `?` agora s?o exibidos corretamente
- Arquivos corrigidos:
  - PeladaVotingPage.tsx
  - PeladaDetailPage.tsx
  - HomePage.tsx
  - ManageAdminsDialog.tsx
  - UserProfilePage.tsx

### Sistema de Vota??o
- Interface completa de vota??o por jogador
- Sistema de estrelas (1-5) com feedback visual
- Valida??es e mensagens informativas
- Integra??o com scores normalizados

### Gerenciamento de Admins
- Dialog para adicionar/remover administradores
- Prote??o contra remo??o do ?ltimo admin
- Lista de admins com informa??es completas

---

## ?? Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm test -- --watch

# Coverage
npm test -- --coverage
```

Testes incluem:
- Testes unit?rios de componentes
- Testes de providers (AuthProvider)
- Testes de rotas protegidas
- Testes de cliente API

---

## ?? UI/UX

- Design responsivo com Material-UI
- Tema personalizado com cores da paleta de futebol
- Feedback visual para a??es do usu?rio
- Drag-and-drop intuitivo para montagem de times
- Navega??o clara e organizada

---

## ?? Seguran?a

- Tokens JWT armazenados em localStorage
- Rotas protegidas com verifica??o de autentica??o
- Valida??o de permiss?es no frontend e backend
- Logout seguro com limpeza de sess?o

---

## ?? Licen?a

MIT License

---

## ?? Contribuindo

Este ? um projeto privado. Para contribuir:
1. Crie uma branch para sua feature
2. Fa?a commit das mudan?as
3. Abra um Pull Request

---

## ?? Suporte

Para quest?es ou problemas, entre em contato com a equipe de desenvolvimento.
