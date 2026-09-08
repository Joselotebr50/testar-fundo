// themeManager.js - Módulo de temas com 10 opções de fundo e ajuste de imagem

// Lista de temas
const temas = [
  {
    id: 'estrelado',
    nome: 'Estrelado',
    imagem: 'assets/fundos/fundo1.jpg',
    cores: {
      fundo: '#0a1420',
      card: '#101f33',
      texto: '#f2f7fb',
      primaria: '#3b82f6',
      secundaria: '#4fd1f0',
      destaque: '#f59e0b'
    }
  },
  {
    id: 'mar',
    nome: 'Mar',
    imagem: 'assets/fundos/fundo2.jpg',
    cores: {
      fundo: '#0b1a2e',
      card: '#1a2f44',
      texto: '#e6f0fa',
      primaria: '#0ea5e9',
      secundaria: '#38bdf8',
      destaque: '#f97316'
    }
  },
  {
    id: 'floresta',
    nome: 'Floresta',
    imagem: 'assets/fundos/fundo3.jpg',
    cores: {
      fundo: '#0f1f12',
      card: '#1e3322',
      texto: '#e6f2e6',
      primaria: '#22c55e',
      secundaria: '#4ade80',
      destaque: '#eab308'
    }
  },
  {
    id: 'por_do_sol',
    nome: 'Pôr do Sol',
    imagem: 'assets/fundos/fundo4.jpg',
    cores: {
      fundo: '#2a0f1a',
      card: '#3d1f2a',
      texto: '#fde8e8',
      primaria: '#f43f5e',
      secundaria: '#fb7185',
      destaque: '#f59e0b'
    }
  },
  {
    id: 'neve',
    nome: 'Neve',
    imagem: 'assets/fundos/fundo5.jpg',
    cores: {
      fundo: '#1a2835',
      card: '#2d3f4f',
      texto: '#f0f8ff',
      primaria: '#60a5fa',
      secundaria: '#93c5fd',
      destaque: '#fcd34d'
    }
  },
  {
    id: 'lua',
    nome: 'Lua',
    imagem: 'assets/fundos/fundo6.jpg',
    cores: {
      fundo: '#111827',
      card: '#1f2937',
      texto: '#f3f4f6',
      primaria: '#8b5cf6',
      secundaria: '#a78bfa',
      destaque: '#fbbf24'
    }
  },
  {
    id: 'campo',
    nome: 'Campo',
    imagem: 'assets/fundos/fundo7.jpg',
    cores: {
      fundo: '#0f1e0f',
      card: '#1e331e',
      texto: '#e8f0e8',
      primaria: '#16a34a',
      secundaria: '#4ade80',
      destaque: '#facc15'
    }
  },
  {
    id: 'cidade',
    nome: 'Cidade Noturna',
    imagem: 'assets/fundos/fundo8.jpg',
    cores: {
      fundo: '#0c0f1a',
      card: '#192130',
      texto: '#e6edf5',
      primaria: '#3b82f6',
      secundaria: '#60a5fa',
      destaque: '#f59e0b'
    }
  },
  {
    id: 'aurora',
    nome: 'Aurora',
    imagem: 'assets/fundos/fundo9.jpg',
    cores: {
      fundo: '#0b1120',
      card: '#1a2740',
      texto: '#e0f0ff',
      primaria: '#06b6d4',
      secundaria: '#22d3ee',
      destaque: '#f472b6'
    }
  },
  {
    id: 'vintage',
    nome: 'Vintage',
    imagem: 'assets/fundos/fundo10.jpg',
    cores: {
      fundo: '#1c140e',
      card: '#2f241c',
      texto: '#f5ebe0',
      primaria: '#d97706',
      secundaria: '#f59e0b',
      destaque: '#b45309'
    }
  }
];

// Opções de ajuste de imagem
const opcoesAjuste = [
  { id: 'cover', label: 'Cobrir (preencher)', value: 'cover' },
  { id: 'contain', label: 'Conter (mostrar inteira)', value: 'contain' },
  { id: 'stretch', label: 'Esticar (distorcer)', value: '100% 100%' },
  { id: 'repeat', label: 'Repetir (mosaico)', value: 'auto' },
  { id: 'center', label: 'Centralizar (sem redimensionar)', value: 'auto' },
  { id: 'top', label: 'Topo (sem redimensionar)', value: 'auto' },
  { id: 'bottom', label: 'Inferior (sem redimensionar)', value: 'auto' },
];

// Aplica um tema e o ajuste de imagem
export function aplicarTema(id, ajusteId) {
  const tema = temas.find(t => t.id === id);
  if (!tema) return;

  // Se não passar ajuste, tenta buscar o salvo
  if (!ajusteId) {
    const salvo = localStorage.getItem('ajuste_imagem');
    ajusteId = salvo || 'cover';
  }

  const ajuste = opcoesAjuste.find(a => a.id === ajusteId) || opcoesAjuste[0];
  const root = document.documentElement;
  const c = tema.cores;

  // Aplica cores
  root.style.setProperty('--bg-fundo', c.fundo);
  root.style.setProperty('--bg-card', c.card);
  root.style.setProperty('--texto-principal', c.texto);
  root.style.setProperty('--cor-primaria', c.primaria);
  root.style.setProperty('--cor-secundaria', c.secundaria);
  root.style.setProperty('--cor-destaque', c.destaque);

  // Aplica a imagem com o ajuste escolhido
  const img = new Image();
  img.src = tema.imagem;
  img.onload = () => {
    const body = document.body;
    body.style.backgroundImage = `url(${tema.imagem})`;
    body.style.backgroundSize = ajuste.value === '100% 100%' ? '100% 100%' : 
                                ajuste.value === 'auto' && ajuste.id !== 'repeat' ? 'auto' :
                                ajuste.value;
    if (ajuste.id === 'repeat') {
      body.style.backgroundRepeat = 'repeat';
      body.style.backgroundSize = 'auto';
    } else {
      body.style.backgroundRepeat = 'no-repeat';
      if (ajuste.id === 'center') {
        body.style.backgroundPosition = 'center';
        body.style.backgroundSize = 'auto';
      } else if (ajuste.id === 'top') {
        body.style.backgroundPosition = 'top center';
        body.style.backgroundSize = 'auto';
      } else if (ajuste.id === 'bottom') {
        body.style.backgroundPosition = 'bottom center';
        body.style.backgroundSize = 'auto';
      } else {
        body.style.backgroundPosition = 'center';
      }
    }
    body.style.backgroundColor = c.fundo;
  };
  img.onerror = () => {
    document.body.style.backgroundImage = 'none';
    document.body.style.backgroundColor = c.fundo;
  };

  // Salva preferências
  localStorage.setItem('tema_app', id);
  localStorage.setItem('ajuste_imagem', ajusteId);
}

// Carrega tema e ajuste salvos
export function carregarTemaSalvo() {
  const temaSalvo = localStorage.getItem('tema_app');
  const ajusteSalvo = localStorage.getItem('ajuste_imagem') || 'cover';
  const existe = temas.some(t => t.id === temaSalvo);
  const id = existe ? temaSalvo : temas[0].id;
  aplicarTema(id, ajusteSalvo);
  return { temaId: id, ajusteId: ajusteSalvo };
}

// Retorna listas
export function listarTemas() { return temas; }
export function listarAjustes() { return opcoesAjuste; }
export function obterUrlImagem(id) {
  const tema = temas.find(t => t.id === id);
  return tema ? tema.imagem : '';
}