import request from 'supertest';
import fs from 'node:fs';

const login = JSON.parse(fs.readFileSync('./test/fixtures/login.json'));
const api = request('http://localhost:3000');

export async function obterTokens() {
  const resAna = await api.post('/api/login').send(login.ana);
  const resCarla = await api.post('/api/login').send(login.carla);

  return {
    tokenAna: resAna.body.token,
    tokenCarla: resCarla.body.token,
  };
}