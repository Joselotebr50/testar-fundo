// js/strategies.js
import { db } from './firebase.js';
import { navigateTo } from './app.js';
import { iniciarRespiracao } from './subapps/respiracao.js';
import { iniciarAgua } from './subapps/agua.js';

const strategies = [
  { id:'agua', label:'Beber água', emoji:'💧' },
  { id:'caminhar', label:'Caminhar', emoji:'🚶' },
  { id:'apoio', label:'Ligar para apoio', emoji:'📞' },
  { id:'chiclete', label:'Mascar chiclete', emoji:'🍬' },
  { id:'banho', label:'Tomar banho', emoji:'🚿' },
  { id:'audio', label:'Ouvir áudio relaxante', emoji:'🎧' },
  { id:'sair', label:'Sair do gatilho', emoji:'🚪' },
  { id:'respirar', label:'Respiração guiada', emoji:'🧘' },
  { id:'adiar', label:'Adiar por 5 min', emoji:'⏳' },
  { id:'alongar', label:'Pausa ativa', emoji:'🤸' },
  { id:'motivo', label:'Lembrar motivo', emoji:'💪' },
];
window._strategies = strategies;

let rodizioIndex = 0;
let userProfileAtual = null;
let currentUserAtual = null;

export function mostrarEstrategias(user, profile) {
  currentUserAtual = user;
  userProfileAtual = profile;
  const container = document.getElementById('strategies-list');
  container.innerHTML = strategies.map(s =>
    `<div class="card" data-strategy-id="${s.id}" style="display:flex; align-items:center; gap:12px;">
      <span style="font-size:24px;">${s.emoji}</span>
      <span style="font-size:16px; font-weight:500;">${s.label}</span>
    </div>`
  ).join('');
  container.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', function() {
      const id = this.dataset.strategyId;
      if (id === 'agua') { iniciarAgua(user, profile); return; }
      if (id === 'respirar') {
        navigateTo('screen-respiracao');
        iniciarRespiracao(user, profile, false); // false = via estratégia
        return;
      }
      // Estratégias simples -> overlay
      window._selectedStrategyId = id;
      const strategy = strategies.find(s => s.id === id);
      document.getElementById('confirm-strategy-name').textContent = strategy.label;
      document.getElementById('confirmation-overlay').classList.add('active');
    });
  });
  // Rodízio de fotos e frases
  atualizarRodizio(user, profile);
}

function atualizarRodizio(user, profile) {
  const fotoEl = document.getElementById('strategies-foto');
  const fraseEl = document.getElementById('strategies-frase');
  
  if (!profile) {
    fotoEl.style.backgroundImage = '';
    fraseEl.textContent = '"Sua motivação aqui"';
    return;
  }
  
  // Frases
  const frases = profile.frases || [];
  if (frases.length) {
    const idx = rodizioIndex % frases.length;
    fraseEl.textContent = `"${frases[idx]}"`;
  } else {
    fraseEl.textContent = '"Você é mais forte que a fissura"';
  }
  
  // Fotos
  const fotos = profile.fotos || [];
  if (fotos.length) {
    const idx = rodizioIndex % fotos.length;
    fotoEl.style.backgroundImage = `url(${fotos[idx]})`;
  } else {
    fotoEl.style.backgroundImage = '';
  }
  rodizioIndex++;
  // Troca a cada 8 segundos
  if (window._rodizioInterval) clearInterval(window._rodizioInterval);
  window._rodizioInterval = setInterval(() => {
    if (document.getElementById('screen-strategies').classList.contains('active')) {
      atualizarRodizio(currentUserAtual, userProfileAtual);
    } else {
      clearInterval(window._rodizioInterval);
    }
  }, 8000);
}

export function voltarEstrategias() {
  if (window._rodizioInterval) clearInterval(window._rodizioInterval);
}