import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Lock,
  Upload,
} from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import type { UserPublic } from '../types.ts';
import { PetPhoto } from '../components/PetPhoto.tsx';
import { formatCepMask } from '../utils/format.ts';
import type { AppPage } from '../components/TopBar.tsx';

interface RegisterPageProps {
  onRegisterSuccess: (user: UserPublic) => void;
  onNavigate: (page: AppPage) => void;
}

const PRESET_DOG_PHOTOS = [
  {
    label: 'Corgi',
    url: '/src/assets/images/corgi_avatar_biscoito_1795046208844.jpg',
  },
  {
    label: 'Golden Retriever',
    url: '/src/assets/images/dog_avatar_golden_1795046753182.jpg',
  },
  {
    label: 'Buldogue Francês',
    url: '/src/assets/images/dog_avatar_frenchie_1795046753250.jpg',
  },
  {
    label: 'Beagle',
    url: '/src/assets/images/dog_avatar_beagle_1795046753785.jpg',
  },
];

function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo selecionado não é uma imagem válida.'));
      img.onload = () => {
        const maxDim = 480;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onNavigate }) => {
  const [tutorName, setTutorName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [dogName, setDogName] = useState('');
  const [cep, setCep] = useState('');
  const [dogPhoto, setDogPhoto] = useState<string>(PRESET_DOG_PHOTOS[0].url);
  const [photoFileName, setPhotoFileName] = useState<string>('Corgi (pode enviar qualquer cachorro)');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeImageFile(file);
      setDogPhoto(dataUrl);
      setPhotoFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar a foto do pet.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiClient.register({
        tutorName,
        login,
        password,
        dogName,
        cep,
        dogPhoto,
      });
      setTutorName('');
      setLogin('');
      setPassword('');
      setDogName('');
      setCep('');
      onRegisterSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar tutor e pet.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-semibold text-amber-700">
            Cadastro do Tutor e do Pet
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
            Criar conta do tutor e perfil do cachorro
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Preencha os dados do tutor e do pet: nome do tutor, seu e-mail (login), senha, nome do
            cachorro, CEP e adicione a foto de qualquer cachorro.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="reg-tutor-name" className="block text-sm font-medium text-slate-700">
                Nome do tutor
              </label>
              <input
                id="reg-tutor-name"
                type="text"
                required
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                placeholder="Ex.: Maria Clara"
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-login" className="block text-sm font-medium text-slate-700">
                  E-mail (login)
                </label>
                <input
                  id="reg-login"
                  type="email"
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  placeholder="Ex.: seuemail@exemplo.com"
                  className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700">
                  Senha
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-dog-name" className="block text-sm font-medium text-slate-700">
                  Nome do cachorro
                </label>
                <input
                  id="reg-dog-name"
                  type="text"
                  required
                  value={dogName}
                  onChange={(e) => setDogName(e.target.value)}
                  placeholder="Ex.: Bento"
                  className="mt-1.5 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15"
                />
              </div>

              <div>
                <label htmlFor="reg-cep" className="block text-sm font-medium text-slate-700">
                  CEP
                </label>
                <input
                  id="reg-cep"
                  type="text"
                  required
                  inputMode="numeric"
                  value={cep}
                  onChange={(e) => setCep(formatCepMask(e.target.value))}
                  placeholder="00000-000"
                  className="mt-1.5 w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/15"
                />
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700">
                Foto do seu pet
              </span>
              <div className="mt-1.5 p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/70">
                <div className="flex flex-wrap items-center gap-4">
                  <PetPhoto
                    src={dogPhoto}
                    alt={dogName || 'Prévia do pet'}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-[200px]">
                    <label
                      htmlFor="reg-dog-photo-input"
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 hover:border-amber-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Upload className="w-4 h-4 text-amber-700" aria-hidden="true" />
                      <span>Enviar foto do computador</span>
                    </label>
                    <input
                      id="reg-dog-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                    <p className="mt-1.5 text-xs text-slate-500 truncate">
                      Selecionado: {photoFileName}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80">
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ou escolha qualquer cachorro de exemplo abaixo:</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_DOG_PHOTOS.map((preset) => {
                      const selected = dogPhoto === preset.url;
                      return (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() => {
                            setDogPhoto(preset.url);
                            setPhotoFileName(preset.label);
                          }}
                          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            selected
                              ? 'border-amber-700 bg-amber-50 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded object-cover"
                          />
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-800 flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-700" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {submitting ? 'Salvando cadastro...' : 'Concluir cadastro do tutor e pet'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('step-1')}
                className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Já possuo login
              </button>
            </div>
          </form>
        </section>

        <aside className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
            <p className="text-xs text-slate-500">Prévia do cartão do tutor e do pet</p>
            <div className="mt-4 flex items-center gap-4">
              <PetPhoto
                src={dogPhoto}
                alt={dogName || 'Seu cachorro'}
                className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold text-slate-900 truncate">
                  {dogName.trim() || 'Nome do cachorro'}
                </h2>
                <p className="mt-1 text-sm text-slate-700 truncate">
                  Tutor: {tutorName.trim() || 'Nome do tutor'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 truncate">
                  E-mail: {login.trim() || 'seuemail@exemplo.com'}
                </p>
                <p className="mt-1 text-xs font-mono text-slate-500 tabular-nums">
                  CEP {cep || '00000-000'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800">
                    Clima disponível após o login
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ao finalizar o cadastro, você será direcionado para a tela de Login. Entre com
                    seu e-mail e senha para consultar o clima do CEP e liberar o passeio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
};
