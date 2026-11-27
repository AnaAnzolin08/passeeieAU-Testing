# PasseieAu

 Documentacao do projeto

PasseieAu e uma aplicacao full-stack para planejar e acompanhar passeios com cachorros com seguranca. O sistema considera autenticacao, cadastro do tutor e do animal, clima local e historico dos passeios.

## Tecnologias

- Node.js
- Express
- TypeScript
- React
- Vite
- Tailwind CSS
- Cypress
- Mocha e Supertest
- k6

## Funcionalidades

- Cadastro e login de usuarios.
- Validacao de dados do tutor e do animal.
- Consulta das condicoes climaticas por CEP.
- Bloqueio de passeios em caso de chuva ou calor excessivo.
- Inicio, pausa, continuidade e finalizacao de passeios.
- Registro de horario de inicio e termino.
- Historico detalhado dos passeios.
- Calculo e exibicao de calorias gastas.
- Grafico com o resumo dos passeios.

## Requisitos

- Node.js 20 ou superior
- npm
- k6, para os testes de desempenho

## Instalacao
npm install
```

## Executando o projeto

npm run dev
```

A aplicacao sera disponivel em `http://localhost:3000`.

## Documentacao da API (Swagger)

Com o servidor em execucao (`npm run dev`), acesse a interface interativa do Swagger em:

`http://localhost:3000/docs` (tambem disponivel em `http://localhost:3000/api/docs`)

A especificacao OpenAPI pode ser consultada em formato YAML por `http://localhost:3000/api/swagger.yaml` ou em JSON por `http://localhost:3000/api/openapi.json`. O arquivo-fonte da especificacao esta em [swagger.yaml](swagger.yaml).

Para o ambiente de producao:


npm run build
npm start
```

## Scripts disponiveis

| Comando | Descricao |
|---|---|
| `npm run dev` | Inicia o servidor em modo de desenvolvimento |
| `npm run build` | Gera a versao de producao |
| `npm start` | Inicia o servidor em modo de producao |
| `npm run lint` | Executa a verificacao de tipos |
| `npm test` | Executa os testes unitarios e de API |
| `npm run cypress:open` | Abre a interface do Cypress |
| `npm run cypress:run` | Executa os testes E2E no terminal |

## Testes

### Testes unitarios e de API

```powershell
npm test
```

### Testes E2E

Com a aplicacao em execucao:

```powershell
npm run cypress:run
```

Para abrir o Cypress em modo visual:


npm run cypress:open
```

### Testes de desempenho com K6

Com a aplicacao em execucao:

$env:K6_WEB_DASHBOARD="true"
$env:K6_WEB_DASHBOARD_EXPORT="html-report.html"
k6 
run ./cypres/performece/passeio_test.js
>>>>>>> 00b2a1b (Primeiro commit)

O teste valida o endpoint `/api/health` e gera o relatorio `html-report.html`.

## Regras de negocio

### RN01 - Login e autenticacao
O sistema permite o acesso somente com e-mail e senha validos. Credenciais incorretas devem apresentar uma mensagem de erro e impedir o acesso.

### RN02 - Cadastro de usuario
O cadastro somente deve ser realizado quando todos os campos obrigatorios estiverem preenchidos corretamente. O CEP informado deve ser valido e seguir o formato esperado.

### RN03 - Validacao do clima - chuva
Antes de permitir o passeio, o sistema consulta as condicoes climaticas. Caso seja identificada previsao de chuva, o passeio deve ser bloqueado preventivamente e uma mensagem deve ser apresentada ao usuario.

### RN04 - Validacao da temperatura
O sistema bloqueia passeios quando a temperatura estiver acima de 27 °C no periodo das 9h as 16h.
### RN05 - Inicio do passeio
O sistema permite iniciar um passeio somente apos as validacoes de autenticacao, cadastro e clima serem aprovadas. O horario de inicio deve ser registrado.

### RN06 - Finalizacao do passeio - Historico
O sistema permite finalizar um passeio iniciado, registrando o horario de termino e atualizando o status para finalizado.

### RN07 - Historico de passeios
O sistema disponibiliza o bloqueio da alta temperatura,então o tutor não consegue inicar o passeio com seu pet , ele mostra alerta. 

## Estrutura principal

```text
src/
  components/
  pages/
test/
cypress/
  e2e/
  performece/
  support/
server.ts
documentacao.Md
```

## Documentacao adicional
- Regras de negocio e casos de teste: [documentacao.Md](documentacao.Md)
- Relatorio de desempenho: [html-report.html](html-report.html)

