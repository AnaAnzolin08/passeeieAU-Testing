export type UserRole = 'client';

export interface UserRecord {
  _id: string;
  login: string;
  tutorName: string;
  passwordHash: string;
  dogName: string;
  dogPhoto: string;
  cep: string;
  role: UserRole;
  createdAt: string;
}

export interface UserPublic {
  _id: string;
  login: string;
  tutorName: string;
  dogName: string;
  dogPhoto: string;
  cep: string;
  role: UserRole;
  createdAt: string;
}

export interface ProductRecord {
  _id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  inStock: boolean;
}

export interface WeatherReport {
  cep: string;
  cityLabel: string;
  condition: string;
  temperatureC: number;
  hasRain: boolean;
  excessiveHeat: boolean;
  canWalk: boolean;
  heatWarning: string | null;
  rainBlockMessage: string | null;
}

export type WalkStatus = 'in_progress' | 'completed';

export interface WalkRecord {
  _id: string;
  userId: string;
  userLogin: string;
  tutorName: string;
  dogName: string;
  cep: string;
  weatherSummary: string;
  temperatureC: number;
  hasRain: boolean;
  excessiveHeat: boolean;
  status: WalkStatus;
  startedAt: string;
  finishedAt: string | null;
  durationSeconds: number;
  caloriesBurned: number;
}

export interface WalkHistoryTotals {
  totalWalks: number;
  totalDurationSeconds: number;
  totalCaloriesBurned: number;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
  weather: WeatherReport;
}

export interface ErrorResponse {
  error: string;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  tutorName: string;
  login: string;
  password: string;
  dogName: string;
  cep: string;
  dogPhoto?: string;
}

export interface FinishWalkRequest {
  walkId: string;
  durationSeconds: number;
}

export interface FinishWalkResponse {
  walk: WalkRecord;
  history: WalkRecord[];
  totals: WalkHistoryTotals;
}

export interface WalkHistoryResponse {
  walks: WalkRecord[];
  totals: WalkHistoryTotals;
}
