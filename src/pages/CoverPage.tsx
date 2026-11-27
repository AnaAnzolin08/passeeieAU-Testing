import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { UserPublic } from '../types.ts';
import { PetPhoto } from '../components/PetPhoto.tsx';
import type { AppPage } from '../components/TopBar.tsx';

interface CoverPageProps {
  pets: UserPublic[];
  onNavigate: (page: AppPage) => void;
}

const EXTRA_PET_PHOTOS = [
  {
    id: 'extra-beagle',
    dogName: 'Thor',
    dogPhoto: '/src/assets/images/dog_avatar_beagle_1795046753785.jpg',
  },
  {
    id: 'extra-corgi-biscoito',
    dogName: 'Biscoito',
    dogPhoto: '/src/assets/images/corgi_avatar_biscoito_1795046208844.jpg',
  },
  {
    id: 'extra-golden',
    dogName: 'Mel',
    dogPhoto: '/src/assets/images/dog_avatar_golden_1795046753182.jpg',
  },
  {
    id: 'extra-frenchie',
    dogName: 'Lola',
    dogPhoto: '/src/assets/images/dog_avatar_frenchie_1795046753250.jpg',
  },
  {
    id: 'extra-corgi-pudim',
    dogName: 'Pudim',
    dogPhoto: '/src/assets/images/corgi_avatar_pudim_1795046209907.jpg',
  },
  {
    id: 'extra-corgi-pipoca',
    dogName: 'Pipoca',
    dogPhoto: '/src/assets/images/corgi_avatar_pipoca_1795046209722.jpg',
  },
];

export const CoverPage: React.FC<CoverPageProps> = ({ pets, onNavigate }) => {
  const galleryPets = [
    ...pets.map((p) => ({
      id: p._id,
      dogName: p.dogName,
      dogPhoto: p.dogPhoto,
    })),
    ...EXTRA_PET_PHOTOS,
  ].slice(0, 8);

  return (
    <main>
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-14 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-2">
            <div>
              <p className="text-sm font-bold text-amber-700 tracking-wide">
                PasseieAu · Verificação Climática por CEP
              </p>
              <h1
                className="mt-4 font-display font-bold tracking-tight text-slate-900 leading-[1.08]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.4rem)', textWrap: 'balance' }}
              >
                Passeios seguros com o seu cachorro em qualquer clima.
              </h1>
              <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-xl">
                Antes de colocar a coleira, a PasseieAu analisa a previsão do tempo para o seu CEP,
                alerta sobre riscos de calor excessivo, bloqueia saídas em dias de chuva e calcula o
                gasto calórico do tutor a cada caminhada.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('step-1')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                >
                  <span>Entrar para passear</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('step-2')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-900 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
                >
                  Cadastrar tutor e pet
                </button>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>Verificação climática por CEP</span>
              <span aria-hidden="true">·</span>
              <span>Alerta de calor excessivo</span>
              <span aria-hidden="true">·</span>
              <span>Cálculo calórico em tempo real</span>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src="/src/assets/images/hero_corgi_tutor_walk_1795046752994.jpg"
                alt="Tutor sorridente passeando na guia com seu cachorro Pembroke Welsh Corgi em passarela de parque"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent">
                <p className="text-sm font-medium text-white">
                  Cuidados térmicos para o pet, bloqueio em dias de chuva e calorias do tutor.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
                Alguns pets que fazem parte da plataforma
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Cachorros de todas as raças que já passeiam com a PasseieAu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('step-2')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cadastrar meu pet →
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-5">
            {galleryPets.map((pet) => (
              <div
                key={pet.id}
                className="group overflow-hidden rounded-xl bg-white border border-slate-200"
              >
                <div className="aspect-square overflow-hidden bg-slate-100">
                  <PetPhoto
                    src={pet.dogPhoto}
                    alt={pet.dogName}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                  />
                </div>
                <div className="px-4 py-3">
                  <h3 className="font-display text-sm font-bold text-slate-900 truncate">
                    {pet.dogName}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
};
