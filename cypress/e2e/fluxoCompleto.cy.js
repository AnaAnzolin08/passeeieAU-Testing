import { createUser } from '../support/clima/userFactory'
import {
  registerFromCover,
  loginUser,
  logoutUser,
} from '../support/clima/passeioActions'

const TIMEOUT = { timeout: 5000 }

const abrirLogin = () => {
  cy.visit('/')
  cy.contains('button', 'Entrar para passear').click()
}

const validarPainel = (user) => {
  cy.contains('h1', `Monitoramento do passeio com ${user.dogName}`, TIMEOUT).should('be.visible')
  cy.contains(`Tutor: ${user.tutorName} (${user.login})`, TIMEOUT).should('be.visible')
}

describe('PasseieAu - Fluxo E2E ', 
  { testIsolation: false }, () => {
  const usuarioLogin = createUser()
  const usuarioCadastrado = createUser()
  const usuarioClimaCalor = createUser({ cep: '77001-002' }) // Palmas, TO (clima quente)

  it('CT-01: Valiar o login com e-mail e senha válidos', () => {
    registerFromCover(usuarioLogin)
    loginUser(usuarioLogin)
    validarPainel(usuarioLogin)
  })

  it('CT-02: Validar os senha inválida para o mesmo usuário', () => {
    abrirLogin()
    const senhaInvalida = `${usuarioLogin.password}invalida`
    loginUser(usuarioLogin, senhaInvalida)

    cy.get('[role="alert"]', TIMEOUT)
      .should('be.visible')
      .and('contain.text', 'senha')
    cy.contains('h1', 'Entrar na conta do tutor').should('be.visible')
  })

  it('CT-03: cadastra um novo usuário', () => {
    registerFromCover(usuarioCadastrado)
    cy.get('#login-input', TIMEOUT).should('be.visible')
    cy.contains('button', 'Entrar e verificar clima', TIMEOUT).should('be.visible')
  })

  it('CT-04: o mesmo usuário cadastrado faz login com e-mail e senha válidos', () => {
    abrirLogin()
    loginUser(usuarioCadastrado)
    validarPainel(usuarioCadastrado)
  })

  it('CT-05: Validar que  o passeio inicia e pausa o finaliza ', () => {
    abrirLogin()
    loginUser(usuarioCadastrado)
    validarPainel(usuarioCadastrado)

    cy.contains('button', 'Iniciar Passeio').click()
    cy.contains('Cronômetro ativo em tempo real').should('be.visible')
    cy.wait(2000)

    cy.contains('button', 'Pausar').click()
    cy.contains('Passeio pausado').should('be.visible')
    cy.contains('button', 'Finalizar Passeio').click()
  })

  it('CT-06: continua, finaliza o passeio, exibe histórico e gráfico ', () => {
    abrirLogin()
    loginUser(usuarioCadastrado)
    validarPainel(usuarioCadastrado)

    cy.contains('button', 'Iniciar Passeio').click()
    cy.contains('Cronômetro ativo em tempo real').should('be.visible')
    cy.wait(2000)

    cy.contains('button', 'Pausar').click()
    cy.contains('Passeio pausado').should('be.visible')
    cy.contains('button', 'Continuar').click()
    cy.contains('Cronômetro ativo em tempo real').should('be.visible')
    cy.wait(5000)

    cy.contains('button', 'Finalizar Passeio').click()
    cy.contains('Passeio finalizado e registrado').should('be.visible')
    cy.contains(`Resumo da caminhada com ${usuarioCadastrado.dogName}`, TIMEOUT).should('be.visible')

    cy.contains('h2', 'Total de calorias gastas pelo tutor', TIMEOUT).should('be.visible')
    cy.contains('h2', 'Histórico detalhado de passeios', TIMEOUT).should('be.visible')
    cy.get('tbody tr').should('have.length', 2)
    cy.contains('tbody tr', usuarioCadastrado.dogName).find('td').eq(6).invoke('text')
    .should('match', /\b([5-9]|[1-5]\d)s\b|[1-9]\d* min/)

    cy.get('svg[aria-label="Gráfico de calorias gastas por passeio"]')
      .should('be.visible')
      .find('g.cursor-pointer')
      .should('have.length', 2)

    logoutUser()
  })


  it('CT-007: Validar o bloqueio do passeio por calor acima de 27 °C', () => {
    const usuario = createUser({ cep: '77001-002' })

    registerFromCover(usuario)

    cy.intercept('POST', '/api/auth/login', (req) => {
      req.continue((res) => {
        if (res.statusCode === 200) {
          res.body.weather = {
            ...res.body.weather,
            condition: 'Sol intenso',
            temperatureC: 31,
            hasRain: false,
            excessiveHeat: true,
            canWalk: false,
            heatWarning: 'Temperatura acima de 27°C entre 9h e 16h.',
            rainBlockMessage: null,
          }
        }
      })
    }).as('loginComCalor')

    abrirLogin()
    loginUser(usuario)

    cy.wait('@loginComCalor')

    validarPainel(usuario)

    cy.contains('77001-002')
      .should('be.visible')

    cy.get('[role="alert"]')
      .should('be.visible')
      .and('contain.text', 'Calor acima de 27°C')

    cy.contains('button', 'Iniciar Passeio (Bloqueado)')
      .should('be.disabled')

    logoutUser()
  })

})