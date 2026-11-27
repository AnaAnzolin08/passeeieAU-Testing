import { fakerPT_BR as faker } from '@faker-js/faker'

const CEP_PADRAO = '01310-100'
const NOMES_DE_PET = ['Pipoca', 'Paçoca', 'Farofa', 'Pudim', 'Coxinha', 'Tapioca', 'Fubá', 'Salsicha', 'Churros', 'Bolota']

export function createUser({ cep = CEP_PADRAO, tutorName, dogName } = {}) {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()

  return {
    tutorName: tutorName || `${firstName} ${lastName}`,
    login: faker.internet
      .email({ firstName, lastName, provider: 'example.com' })
      .replace('@example.com', `.${faker.string.numeric(8)}@example.com`)
      .toLowerCase(),
    password: `Teste${faker.string.alphanumeric(8)}!`,
    dogName: dogName || faker.helpers.arrayElement(NOMES_DE_PET),
    cep,
  }
}
