import crypto from 'crypto';
import type { ProductRecord, UserPublic, UserRecord, WalkRecord } from '../types.ts';

function cloneDoc<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

function generateObjectIdHex(): string {
  return crypto.randomBytes(12).toString('hex');
}

function isPlainPrimitive(val: unknown): val is string | number | boolean {
  return typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
}

function matchesFilter<T extends { _id: string }>(doc: T, filter: Partial<Record<keyof T, unknown>>): boolean {
  for (const [key, expected] of Object.entries(filter)) {
    if (key.startsWith('$') || key === '__proto__' || key === 'constructor') {
      continue;
    }
    if (!isPlainPrimitive(expected)) {
      return false;
    }
    const actual = (doc as Record<string, unknown>)[key];
    if (actual !== expected) {
      return false;
    }
  }
  return true;
}

export class InMemoryCollection<T extends { _id: string }> {
  private readonly name: string;
  private readonly docs: T[] = [];

  constructor(name: string) {
    this.name = name;
  }

  getCollectionName(): string {
    return this.name;
  }

  countDocuments(): number {
    return this.docs.length;
  }

  find(filter: Partial<Record<keyof T, unknown>> = {}): T[] {
    return this.docs.filter((doc) => matchesFilter(doc, filter)).map(cloneDoc);
  }

  findOne(filter: Partial<Record<keyof T, unknown>>): T | null {
    const found = this.docs.find((doc) => matchesFilter(doc, filter));
    return found ? cloneDoc(found) : null;
  }

  insertOne(doc: Omit<T, '_id'> & { _id?: string }): T {
    const inserted = cloneDoc({
      ...doc,
      _id: doc._id || generateObjectIdHex(),
    }) as T;
    this.docs.push(inserted);
    return cloneDoc(inserted);
  }

  updateOne(
    filter: Partial<Record<keyof T, unknown>>,
    update: { $set: Partial<T> },
  ): T | null {
    const index = this.docs.findIndex((doc) => matchesFilter(doc, filter));
    if (index === -1) return null;
    const safeSet: Partial<T> = {};
    for (const [key, value] of Object.entries(update.$set)) {
      if (key === '_id' || key.startsWith('$') || key === '__proto__' || key === 'constructor') {
        continue;
      }
      (safeSet as Record<string, unknown>)[key] = value;
    }
    this.docs[index] = cloneDoc({ ...this.docs[index], ...safeSet });
    return cloneDoc(this.docs[index]);
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function toPublicUser(user: UserRecord): UserPublic {
  const { passwordHash: _removed, ...rest } = user;
  return rest;
}

class InMemoryMongoServer {
  readonly engine = 'mongodb-memory-server-style';
  readonly users = new InMemoryCollection<UserRecord>('users');
  readonly products = new InMemoryCollection<ProductRecord>('products');
  readonly walks = new InMemoryCollection<WalkRecord>('walks');
  private initialized = false;

  bootstrap(): void {
    if (this.initialized) return;
    this.initialized = true;

    const seededUsers: UserRecord[] = [
      {
        _id: '6740a1b2c3d4e5f600000101',
        login: 'ana@passeieau.com',
        tutorName: 'Ana Paula',
        passwordHash: hashPassword('corgi123'),
        dogName: 'Biscoito',
        dogPhoto: '/src/assets/images/corgi_avatar_biscoito_1795046208844.jpg',
        cep: '01310-100',
        role: 'client',
        createdAt: '2026-11-10T09:00:00.000Z',
      },
      {
        _id: '6740a1b2c3d4e5f600000102',
        login: 'bruno@passeieau.com',
        tutorName: 'Bruno Mendes',
        passwordHash: hashPassword('passeio123'),
        dogName: 'Pipoca',
        dogPhoto: '/src/assets/images/dog_avatar_golden_1795046753182.jpg',
        cep: '40140-110',
        role: 'client',
        createdAt: '2026-11-11T14:30:00.000Z',
      },
      {
        _id: '6740a1b2c3d4e5f600000103',
        login: 'carla@passeieau.com',
        tutorName: 'Carla Souza',
        passwordHash: hashPassword('chuva123'),
        dogName: 'Pudim',
        dogPhoto: '/src/assets/images/dog_avatar_frenchie_1795046753250.jpg',
        cep: '80010-000',
        role: 'client',
        createdAt: '2026-11-12T08:15:00.000Z',
      },
    ];

    for (const user of seededUsers) {
      this.users.insertOne(user);
    }

    const seededProducts: ProductRecord[] = [
      {
        _id: '6740a1b2c3d4e5f600000201',
        name: 'Coleira Refrescante Corgi Fit',
        category: 'Conforto Térmico',
        price: 129.9,
        description:
          'Tecido respirável com faixa de resfriamento para caminhadas sob temperaturas elevadas.',
        inStock: true,
      },
      {
        _id: '6740a1b2c3d4e5f600000202',
        name: 'Peitoral Anatômico Anti-Puxão',
        category: 'Segurança',
        price: 169.0,
        description:
          'Ajuste ergonômico pensado para a coluna alongada e o tórax de cães de pequeno e médio porte.',
        inStock: true,
      },
      {
        _id: '6740a1b2c3d4e5f600000203',
        name: 'Garrafa Portátil Hidratação 500ml',
        category: 'Hidratação',
        price: 74.5,
        description:
          'Bebedouro acoplado com trava de silicone para pausas rápidas durante o passeio.',
        inStock: true,
      },
    ];

    for (const product of seededProducts) {
      this.products.insertOne(product);
    }

    const seededWalks: WalkRecord[] = [
      {
        _id: '6740a1b2c3d4e5f600000301',
        userId: '6740a1b2c3d4e5f600000101',
        userLogin: 'ana@passeieau.com',
        tutorName: 'Ana Paula',
        dogName: 'Biscoito',
        cep: '01310-100',
        weatherSummary: 'Ensolarado ameno',
        temperatureC: 22,
        hasRain: false,
        excessiveHeat: false,
        status: 'completed',
        startedAt: '2026-11-14T08:00:00.000Z',
        finishedAt: '2026-11-14T08:25:00.000Z',
        durationSeconds: 1500,
        caloriesBurned: 105.0,
      },
      {
        _id: '6740a1b2c3d4e5f600000302',
        userId: '6740a1b2c3d4e5f600000101',
        userLogin: 'ana@passeieau.com',
        tutorName: 'Ana Paula',
        dogName: 'Biscoito',
        cep: '01310-100',
        weatherSummary: 'Céu limpo',
        temperatureC: 24,
        hasRain: false,
        excessiveHeat: false,
        status: 'completed',
        startedAt: '2026-11-15T17:10:00.000Z',
        finishedAt: '2026-11-15T17:42:00.000Z',
        durationSeconds: 1920,
        caloriesBurned: 134.4,
      },
      {
        _id: '6740a1b2c3d4e5f600000303',
        userId: '6740a1b2c3d4e5f600000101',
        userLogin: 'ana@passeieau.com',
        tutorName: 'Ana Paula',
        dogName: 'Biscoito',
        cep: '01310-100',
        weatherSummary: 'Brisa leve',
        temperatureC: 21,
        hasRain: false,
        excessiveHeat: false,
        status: 'completed',
        startedAt: '2026-11-17T07:30:00.000Z',
        finishedAt: '2026-11-17T08:08:00.000Z',
        durationSeconds: 2280,
        caloriesBurned: 159.6,
      },
      {
        _id: '6740a1b2c3d4e5f600000304',
        userId: '6740a1b2c3d4e5f600000102',
        userLogin: 'bruno@passeieau.com',
        tutorName: 'Bruno Mendes',
        dogName: 'Pipoca',
        cep: '40140-110',
        weatherSummary: 'Sol intenso · Calor excessivo',
        temperatureC: 33,
        hasRain: false,
        excessiveHeat: true,
        status: 'completed',
        startedAt: '2026-11-16T06:40:00.000Z',
        finishedAt: '2026-11-16T07:00:00.000Z',
        durationSeconds: 1200,
        caloriesBurned: 84.0,
      },
    ];

    for (const walk of seededWalks) {
      this.walks.insertOne(walk);
    }
  }

  getInfo() {
    return {
      engine: this.engine,
      state: this.initialized ? 'running' : 'stopped',
      collections: {
        users: this.users.countDocuments(),
        products: this.products.countDocuments(),
        walks: this.walks.countDocuments(),
      },
    };
  }
}

const globalForMemoryDb = globalThis as typeof globalThis & {
  __passeieauMemoryDb?: InMemoryMongoServer;
};

export const memoryDb =
  globalForMemoryDb.__passeieauMemoryDb ??
  (globalForMemoryDb.__passeieauMemoryDb = new InMemoryMongoServer());

