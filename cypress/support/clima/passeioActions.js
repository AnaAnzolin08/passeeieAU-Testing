const CLIMA_URL = '**/api/clima/**'

export function mockClima({ liberado }) {
  cy.intercept('GET', CLIMA_URL, {
    body: {
      cep: '01310100',
      cityLabel: 'São Paulo',
      temperatureC: 22,
      condition: liberado ? 'Céu limpo' : 'Chuva',
      hasRain: !liberado,
      canWalk: liberado,
      excessiveHeat: false,
      rainBlockMessage: liberado ? '' : 'Passeio bloqueado por chuva.',
      heatWarning: '',
    },
  }).as('clima')
}

function fillRegistrationForm(user) {
  cy.get('#reg-tutor-name').type(user.tutorName)
  cy.get('#reg-login').type(user.login)
  cy.get('#reg-password').type(user.password, { log: false })
  cy.get('#reg-dog-name').type(user.dogName)
  cy.get('#reg-cep').type(user.cep.replace(/\D/g, ''))
}

function submitRegistration(user) {
  fillRegistrationForm(user)
  cy.contains('button', 'Concluir cadastro do tutor e pet').click()
  cy.get('[role="status"]')
    .should('be.visible')
    .and('contain.text', `Cadastro de ${user.tutorName} e ${user.dogName} salvo!`)
}

export function registerFromCover(user) {
  cy.visit('/')
  cy.contains('button', 'Cadastrar tutor e pet').click()
  submitRegistration(user)
}

export function loginUser(user, password = user.password) {
  cy.get('#login-input').type(user.login)
  cy.get('#password-input').type(password, { log: false })
  cy.get('button[type="submit"]').click()
}

export function logoutUser() {
  cy.contains('button', 'Sair', { timeout: 5000 }).click()
  cy.contains('button', 'Entrar para passear', { timeout: 5000 }).click()
  cy.contains('h1', 'Entrar na conta do tutor', { timeout: 5000 }).should('be.visible')
}

export function completeWalk(user) {
  cy.contains('button', 'Iniciar Passeio').click()
  cy.contains('Cronômetro ativo em tempo real').should('be.visible')
  cy.contains('button', 'Finalizar Passeio').click()
  cy.contains('Passeio finalizado e registrado').should('be.visible')
  cy.contains(`Resumo da caminhada com ${user.dogName}`).should('be.visible')
}
