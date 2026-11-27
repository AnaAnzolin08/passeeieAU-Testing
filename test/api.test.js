import request from 'supertest';
import { expect } from 'chai';
import fs from 'node:fs';
import { createApiApp } from '../src/api/app.ts';
import { clearWeatherCache } from '../src/services/weatherServer.ts';

const ler = (nome) =>
  JSON.parse(fs.readFileSync(`./test/fixtures/${nome}.json`));

const login = ler('login');
const cadastro = ler('cadastro');
const passeio = ler('passeio');
const finalizacao = ler('finalizacao');

const api = request(createApiApp());
const fetchOriginal = globalThis.fetch;

describe('PasseieAu API', function () {
  this.timeout(30000);

  let tokenAna;
  let tokenCarla;
  let walkId;

  before(async () => {
    globalThis.fetch = async () => {
      throw new Error('Consulta climática externa desativada nos testes da API.');
    };
    clearWeatherCache();

    const { body: ana } = await api.post('/api/login').send(login.ana).expect(200);
    const { body: carla } = await api.post('/api/login').send(login.carla).expect(200);

    tokenAna = ana.token;
    tokenCarla = carla.token;
    expect(tokenAna).to.be.a('string').and.not.empty;
    expect(tokenCarla).to.be.a('string').and.not.empty;
  });

  after(() => {
    globalThis.fetch = fetchOriginal;
    clearWeatherCache();
  });

  it('POST /api/login - Login do tutor e diagnóstico climático por CEP -Sucesso (200)', async () => {
    const { body } = await api
      .post('/api/login')
      .send(login.ana)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).to.include.keys('token', 'user', 'weather');
    expect(body.token).to.be.a('string').and.not.empty;
    expect(body.user).to.include({
      login: login.ana.login,
      role: 'client',
    });
    expect(body.weather).to.include.keys(
      'cep',
      'cityLabel',
      'condition',
      'temperatureC',
      'hasRain',
      'excessiveHeat',
      'canWalk',
      'heatWarning',
      'rainBlockMessage',
    );
  });

  it('POST /api/login - Dado invaldo (401)', async () => {
    const { body } = await api
      .post('/api/login')
      .send(login.invalido401)
      .expect(401);

    expect(body).to.have.property('error', 'Login ou senha incorretos.');
  });

  it('POST /api/cadastro - Sucesso (201)', async () => {
    const novoCadastro = {
      ...cadastro.valido,
      login: `tutor.${Date.now()}@passeieau.com`,
    };
    const { body } = await api
      .post('/api/cadastro')
      .send(novoCadastro)
      .expect(201);

    expect(body).to.include.keys('token', 'user', 'weather');
    expect(body.token).to.be.a('string').and.not.empty;
    expect(body.user).to.include({
      login: novoCadastro.login,
      tutorName: cadastro.valido.tutorName,
      dogName: cadastro.valido.dogName,
      role: 'client',
    });
    expect(body.weather).to.include.keys(
      'cep',
      'cityLabel',
      'condition',
      'temperatureC',
      'hasRain',
      'excessiveHeat',
      'canWalk',
      'heatWarning',
      'rainBlockMessage',
    );
  });

  it('POST /api/cadastro - Campos ausentes (400)', async () => {
    const { body } = await api
      .post('/api/cadastro')
      .send(cadastro.camposAusentes400)
      .expect(400);

    expect(body).to.have.property('error', cadastro.erroCamposAusentes);
  });

  it('POST /api/cadastro - Login duplicado (409)', async () => {
    const { body } = await api
      .post('/api/cadastro')
      .send(cadastro.duplicado)
      .expect(409);

    expect(body).to.have.property('error', cadastro.erroDuplicado409);
  });

  it('POST /api/passeio - Iniciar passeio (201)', async () => {
    const { body } = await api
      .post('/api/passeio')
      .set('Authorization', `Bearer ${tokenAna}`)
      .expect(201);

    expect(body).to.include.keys(
      '_id',
      'userId',
      'userLogin',
      'tutorName',
      'dogName',
      'cep',
      'weatherSummary',
      'temperatureC',
      'hasRain',
      'excessiveHeat',
      'status',
      'startedAt',
      'finishedAt',
      'durationSeconds',
      'caloriesBurned',
    );
    expect(body.status).to.equal(passeio.respostasEsperadas.sucesso201.status);
    walkId = body._id;
    expect(walkId).to.be.a('string').and.not.empty;
  });

  it('POST /api/passeio - Bloqueio por chuva (403)', async () => {
    const { body } = await api
      .post('/api/passeio')
      .set('Authorization', `Bearer ${tokenCarla}`)
      .expect(403);

    expect(body).to.have.property(
      'error',
      passeio.respostasEsperadas.bloqueioChuva403.error,
    );
  });

  it('POST /api/finalizacao - Encerrar passeio (200)', async () => {
    const { body } = await api
      .post('/api/finalizacao')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({
        walkId,
        durationSeconds: finalizacao.valido.durationSeconds
      })
      .expect(200);

    expect(body).to.include.keys('walk', 'history', 'totals');
    expect(body.walk).to.include({
      _id: walkId,
      status: finalizacao.statusEsperado,
      durationSeconds: finalizacao.valido.durationSeconds,
      caloriesBurned: finalizacao.caloriasEsperadas,
    });
    expect(body.walk.finishedAt).to.be.a('string').and.not.empty;
    expect(body.history).to.be.an('array');
    expect(body.history.some((walk) => walk._id === walkId)).to.equal(true);
    expect(body.totals).to.include.keys(
      'totalWalks',
      'totalDurationSeconds',
      'totalCaloriesBurned',
    );
  });

  it('POST /api/finalizacao - Duração inválida (400)', async () => {
    const { body } = await api
      .post('/api/finalizacao')
      .set('Authorization', `Bearer ${tokenAna}`)
      .send({
        walkId,
        durationSeconds: finalizacao.invalido.durationSeconds
      })
      .expect(400);

    expect(body).to.have.property('error', finalizacao.erroDuracao400);
  });

  it('GET /api/finalizacao - Consulta histórico e totais (200)', async () => {
    const { body } = await api
      .get('/api/finalizacao')
      .set('Authorization', `Bearer ${tokenAna}`)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(body).to.include.keys('walks', 'totals');
    expect(body.walks).to.be.an('array');
    expect(body.walks.some((walk) => walk._id === walkId && walk.status === 'completed'))
      .to.equal(true);
    expect(body.totals).to.include.keys(
      'totalWalks',
      'totalDurationSeconds',
      'totalCaloriesBurned',
    );
    expect(body.totals.totalWalks).to.be.a('number');
    expect(body.totals.totalDurationSeconds).to.be.a('number');
    expect(body.totals.totalCaloriesBurned).to.be.a('number');
  });

  it('GET /api/finalizacao - Token ausente (401)', async () => {
    const { body } = await api
      .get('/api/finalizacao')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(body).to.have.property('error', finalizacao.erroSemToken401);
  });
});