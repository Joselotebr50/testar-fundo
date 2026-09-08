// js/onboarding.js
import { db } from './firebase.js';
import { listarTemas, aplicarTema } from './themeManager.js';

let selectedTriggers = [];
let recordedAudioBase64 = null;
let mediaRecorder = null;
let audioChunks = [];
let fotosBase64 = ['', '', '', ''];

// ===== FUNÇÃO PARA CRIAR SELETOR DE TEMAS (REUTILIZÁVEL) =====
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
    const img = new Image();
    img.src = t.imagem;
    img.onload = () => {
      btn.style.backgroundImage = `url(${t.imagem})`;
      btn.style.backgroundColor = 'transparent';
      btn.style.backgroundSize = 'cover';
      btn.style.backgroundPosition = 'center';
    };
    btn.onclick = () => {
      aplicarTema(t.id, 'top');
      container.querySelectorAll('button').forEach(b => {
        b.style.borderColor = 'transparent';
        b.style.boxShadow = 'none';
      });
      btn.style.borderColor = 'var(--cor-secundaria)';
      btn.style.boxShadow = '0 0 16px var(--cor-secundaria)';
    };
    container.appendChild(btn);
  });
}

// ===== EXPORT: INICIAR ONBOARDING (CADASTRO) =====
export function iniciarOnboarding(edicao) {
  // Limpa campos se não for edição
  if (!edicao) {
    document.getElementById('onboard-cost').value = '12.00';
    document.getElementById('frase1').value = '';
    document.getElementById('frase2').value = '';
    document.getElementById('frase3').value = '';
    document.getElementById('frase4').value = '';
    recordedAudioBase64 = null;
    fotosBase64 = ['', '', '', ''];
    selectedTriggers = [];
    document.querySelectorAll('#trigger-group .chip').forEach(el => el.classList.remove('selected'));
  }
  criarSeletorTemas();
}

// ===== EXPORT: CARREGAR PARA EDIÇÃO (ENGENAGEM) =====
export function carregarOnboardingParaEdicao(profile) {
  if (!profile) return;
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
  criarSeletorTemas();
  if (profile.tema) {
    aplicarTema(profile.tema, profile.ajusteImagem || 'top');
  }
}

// ===== EXPORT: FINALIZAR ONBOARDING =====
export async function finalizarOnboarding(user, edicao) {
  if (!user) return false;
  // ... (coloque aqui o código completo que você já tem, ou mantenha o que está)
  // Por simplicidade, vamos apenas salvar o tema e as frases para teste
  const temaSalvo = localStorage.getItem('tema_app') || listarTemas()[0].id;
  const ajusteSalvo = 'top';
  const frases = [
    document.getElementById('frase1').value.trim(),
    document.getElementById('frase2').value.trim(),
    document.getElementById('frase3').value.trim(),
    document.getElementById('frase4').value.trim()
  ].filter(f => f !== '');

  await db.collection('users').doc(user.uid).set({
    tema: temaSalvo,
    ajusteImagem: ajusteSalvo,
    frases: frases,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  return true;
}

// ===== ÁUDIO E FOTOS (EVENTOS) - MANTIDOS, MAS NÃO ESSENCIAIS AGORA =====
// ... (se quiser, mantenha os eventos de áudio e fotos que você já tem)
