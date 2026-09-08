// js/onboarding.js
import { db } from './firebase.js';
import { listarTemas, aplicarTema } from './themeManager.js';

// ===== VARIÁVEIS GLOBAIS =====
let selectedTriggers = [];
let recordedAudioBase64 = null;
let mediaRecorder = null;
let audioChunks = [];
let fotosBase64 = ['', '', '', ''];
let modoEdicao = false;
let userDataAtual = null;

// ===== FUNÇÃO PARA ATUALIZAR MINIATURAS DE FOTOS =====
function atualizarMiniaturasFotos() {
  document.querySelectorAll('.foto-thumb').forEach((thumb, i) => {
    if (fotosBase64[i]) {
      thumb.style.backgroundImage = `url(${fotosBase64[i]})`;
      thumb.innerHTML = `<span class="remove" data-index="${i}">✕</span>`;
    } else {
      thumb.style.backgroundImage = '';
      thumb.innerHTML = '+';
    }
  });
}

// ===== FUNÇÃO PARA CRIAR O SELETOR DE TEMAS (REUTILIZÁVEL) =====
function criarSeletorTemas() {
  const container = document.getElementById('seletor-temas-mini');
  if (!container) return;
  
  container.innerHTML = '';
  const temas = listarTemas();
  const coresFallback = ['#3b82f6', '#0ea5e9', '#22c55e', '#f43f5e', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];
  
  temas.forEach((t, index) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline';
    btn.textContent = t.nome;
    btn.style.backgroundColor = coresFallback[index % coresFallback.length];
    btn.style.color = 'white';
    btn.style.border = '2px solid rgba(255,255,255,0.3)';
    btn.style.padding = '10px 16px';
    btn.style.fontSize = '14px';
    btn.style.minWidth = '70px';
    btn.style.minHeight = '70px';
    btn.style.borderRadius = '12px';
    btn.style.cursor = 'pointer';
    btn.style.textShadow = '0 2px 4px rgba(0,0,0,0.5)';
    btn.style.transition = '0.2s';
    
    // Tenta carregar a imagem
    const img = new Image();
    img.src = t.imagem;
    img.onload = () => {
      btn.style.backgroundImage = `url(${t.imagem})`;
      btn.style.backgroundColor = 'transparent';
      btn.style.backgroundSize = 'cover';
      btn.style.backgroundPosition = 'center';
    };
    img.onerror = () => {
      // Mantém a cor sólida
    };
    
    btn.onclick = () => {
      aplicarTema(t.id, document.getElementById('onboarding-ajuste').value);
      container.querySelectorAll('button').forEach(b => {
        b.style.borderColor = 'transparent';
        b.style.boxShadow = 'none';
      });
      btn.style.borderColor = 'var(--cor-secundaria)';
      btn.style.boxShadow = '0 0 16px var(--cor-secundaria)';
    };
    container.appendChild(btn);
  });

  // Se houver um tema salvo, destaca
  const temaSalvo = localStorage.getItem('tema_app');
  if (temaSalvo) {
    container.querySelectorAll('button').forEach(btn => {
      const tema = temas.find(t => t.id === temaSalvo);
      if (tema && btn.textContent === tema.nome) {
        btn.style.borderColor = 'var(--cor-secundaria)';
        btn.style.boxShadow = '0 0 16px var(--cor-secundaria)';
      }
    });
  }
}

// ===== INICIAR ONBOARDING =====
export function iniciarOnboarding(edicao) {
  modoEdicao = edicao;
  selectedTriggers = [];
  document.querySelectorAll('#trigger-group .chip').forEach(el => el.classList.remove('selected'));
  
  if (!edicao) {
    document.getElementById('onboard-cost').value = '12.00';
    document.getElementById('onboard-audio').value = '';
    document.getElementById('frase1').value = '';
    document.getElementById('frase2').value = '';
    document.getElementById('frase3').value = '';
    document.getElementById('frase4').value = '';
    recordedAudioBase64 = null;
    fotosBase64 = ['', '', '', ''];
    atualizarMiniaturasFotos();
    document.getElementById('btn-play-recorded').disabled = true;
    document.getElementById('btn-play-recorded').dataset.audio = '';
  }

  // Cria o seletor de temas (sempre)
  criarSeletorTemas();

  // Ajuste de imagem
  document.getElementById('onboarding-ajuste').addEventListener('change', function() {
    const temaSalvo = localStorage.getItem('tema_app') || listarTemas()[0].id;
    aplicarTema(temaSalvo, this.value);
  });

  // Enter para navegação natural
  document.querySelectorAll('#onboarding-perguntas input, #onboarding-perguntas select, #onboarding-frases input').forEach(el => {
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const form = el.closest('form') || document.getElementById('onboarding-perguntas');
        const inputs = form.querySelectorAll('input, select');
        const idx = Array.from(inputs).indexOf(el);
        if (idx < inputs.length - 1) inputs[idx+1].focus();
      }
    });
  });
}

// ===== CARREGAR PARA EDIÇÃO =====
export function carregarOnboardingParaEdicao(profile) {
  userDataAtual = profile;
  modoEdicao = true;
  
  // Preenche campos
  document.getElementById('onboard-cigarettes').value = profile.cigarettesPerDay || 10;
  document.getElementById('onboard-time').value = profile.timeToFirst || 15;
  document.getElementById('onboard-years').value = profile.yearsSmoking || 5;
  document.getElementById('onboard-cost').value = profile.costPerPack || 12.00;
  document.getElementById('onboard-quit-date').value = profile.quitMode || '7';
  
  // Gatilhos
  if (profile.triggers) {
    document.querySelectorAll('#trigger-group .chip').forEach(el => {
      if (profile.triggers.includes(el.dataset.value)) {
        el.classList.add('selected');
        selectedTriggers.push(el.dataset.value);
      }
    });
  }
  
  // Frases
  const frases = profile.frases || ['', '', '', ''];
  document.getElementById('frase1').value = frases[0] || '';
  document.getElementById('frase2').value = frases[1] || '';
  document.getElementById('frase3').value = frases[2] || '';
  document.getElementById('frase4').value = frases[3] || '';
  
  // Áudio
  if (profile.audioMotivacional) {
    recordedAudioBase64 = profile.audioMotivacional;
    document.getElementById('btn-play-recorded').disabled = false;
    document.getElementById('btn-play-recorded').dataset.audio = recordedAudioBase64;
  }
  
  // Fotos
  if (profile.fotos && profile.fotos.length) {
    profile.fotos.forEach((url, i) => {
      if (url && i < 4) {
        fotosBase64[i] = url;
        const thumb = document.querySelector(`.foto-thumb[data-index="${i}"]`);
        thumb.style.backgroundImage = `url(${url})`;
        thumb.innerHTML = `<span class="remove" data-index="${i}">✕</span>`;
      }
    });
  }
  
  // Recria o seletor de temas (para garantir que apareça)
  criarSeletorTemas();
  
  // Aplica o tema salvo
  if (profile.tema) {
    aplicarTema(profile.tema, profile.ajusteImagem || 'cover');
  }
}
