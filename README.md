# PasseieAu — Passeio Seguro com seu Cachorro

## 1. O que é esta aplicação

O **PasseieAu** é uma aplicação full-stack (API REST + Site Web) desenvolvida para organizar e monitorar passeios seguros com seu cachorro.

A plataforma concentra exatamente **4 funcionalidades principais**:
1. **Login**: Autenticação do tutor com consulta automática das condições climáticas do seu CEP, exibindo alertas de calor excessivo ou bloqueio em dias de chuva.
2. **Cadastro**: Criação de conta do tutor e perfil do cachorro (e-mail, senha, nome do tutor, nome do cachorro, CEP e foto do pet).
3. **Passeio**: Cronômetro em tempo real com ações de iniciar, pausar, continuar e estimativa instantânea de calorias gastas pelo tutor (`4,2 kcal/min`).
4. **Finalização**: Encerramento do passeio, persistência no banco em memória, gráfico comparativo de gasto calórico e histórico completo do tutor.

A arquitetura utiliza:
- **Backend**: Node.js + Express + TypeScript (`server.ts`)
- **Banco de Dados em Memória**: Coleções em memória no estilo `mongodb-memory-server` (`src/db/memoryDb.ts`), inicializadas automaticamente a cada execução sem exigir servidor MongoDB externo.
- **Documentação Swagger**: Especificação OpenAPI 3.0.3 em YAML (`swagger.yaml`) renderizada interativamente via Swagger UI nos endpoints `/docs` e `/api/docs`.
- **Frontend**: React + Vite + Tailwind CSS.

---

## 2. Como instalar

Certifique-se de ter o **Node.js 20+** (ou 22+) e o **npm** instalados no computador.

```bash
# 1. Acesse a pasta do projeto
cd passeieau

# 2. Instale as dependências
npm install
```

---

## 3. Como executar

### Modo de desenvolvimento (API REST + Frontend Vite integrados na porta 3000)

```bash
npm run dev
```

### Modo de produção (build do frontend + servidor Express)

```bash
npm run build
npm start
```

### Verificação de tipagem TypeScript

```bash
npm run lint
```

---

## 4. Quais dados de teste estão incluídos

Ao iniciar o servidor, o banco de dados em memória cria automaticamente **3 usuários (tutores e pets)**, **3 produtos** e **4 passeios concluídos** iniciais:

### Usuários pré-cadastrados (3)

| Tutor | E-mail (Login) | Senha | Cachorro | CEP | Cenário Climático Típico |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Ana  | `ana@passeieau.com` | `corgi123` | Biscoito | `01310-100` (São Paulo, SP) | Clima ameno — passeio liberado |
| Bruno Mendes | `bruno@passeieau.com` | `passeio123` | Pipoca | `40140-110` (Salvador, BA) | Calor intenso — exibe alerta de calor excessivo |
| Carla Souza | `carla@passeieau.com` | `chuva123` | Pudim | `80010-000` (Curitiba, PR) | Previsão de chuva (fallback) — bloqueia início do passeio |

---

## 5. Quais são as regras de negócio

1. **Bloqueio preventivo por tempo chuvoso**: Ao tentar iniciar um passeio (`POST /api/passeio`), o backend consulta o clima do CEP do tutor. Se houver chuva prevista (`hasRain === true`), o sistema exibe os cuidados de proteção contra hipotermia, pisos escorregadios, trovoadas e umidade e bloqueia o início com status `403 Forbidden`.
2. **Faixas de cuidado térmico (26 °C a 28 °C e 29 °C acima)**:
   - **26 °C a 28 °C**: Exibe o aviso **Atenção redobrada** orientando rotas na sombra, ritmo leve, água fresca e evitar passeios entre 9h e 16h, mantendo o passeio liberado.
   - **29 °C ou acima**: Classifica como **Calor excessivo** e bloqueia preventivamente o início do passeio (`403 Forbidden`) para evitar hipertermia severa e queimaduras nas patas.
3. **Acesso protegido por autenticação**: Apenas tutores autenticados com token `Authorization: Bearer <token>` podem iniciar passeios, finalizar passeios ou consultar o próprio histórico.
4. **Cálculo de gasto calórico**: Na finalização (`POST /api/finalizacao`), a API calcula o gasto calórico estimado do tutor à taxa de `4,2 kcal/min` a partir da duração em segundos informada.
5. **Isolamento de histórico por tutor**: Cada tutor visualiza exclusivamente os passeios vinculados ao seu `_id`.
6. **Validação de cadastro e senha**: E-mails duplicados são rejeitados (`409 Conflict`), senhas exigem no mínimo 4 caracteres e são armazenadas com hash `scrypt` + salt aleatório.

---

## 6. Quais são as URLs importantes para acessar a aplicação

Com a aplicação em execução na porta `3000`:

- **Site Web (Frontend)**: `http://localhost:3000/`
- **Documentação Swagger UI (renderizando o YAML)**: `http://localhost:3000/docs` ou `http://localhost:3000/api/docs`
- **Arquivo OpenAPI YAML bruto**: `http://localhost:3000/api/swagger.yaml`
- **Healthcheck da API e Banco em Memória**: `http://localhost:3000/api/health`
- **Login (POST)**: `http://localhost:3000/api/login`
- **Cadastro (POST)**: `http://localhost:3000/api/cadastro`
- **Passeio — Iniciar (POST, Bearer)**: `http://localhost:3000/api/passeio`
- **Finalização — Encerrar passeio (POST, Bearer)**: `http://localhost:3000/api/finalizacao`
- **Finalização — Histórico e calorias (GET, Bearer)**: `http://localhost:3000/api/finalizacao`
- **Produtos (GET)**: `http://localhost:3000/api/produtos`
- **Usuários públicos (GET)**: `http://localhost:3000/api/usuarios`
- **Clima por CEP (GET)**: `http://localhost:3000/api/clima/01310-100`
