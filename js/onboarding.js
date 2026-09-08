// js/onboarding.js
import { db, storage } from './firebase.js';
import { listarTemas, aplicarTema } from './themeManager.js';

let selectedTriggers = [];
let recordedAudioBase64 = null;
let mediaRecorder = null;
let audioChunks = [];
let fotosBase64 = ['', '', '', ''];
let modoEdicao = false;
let userDataAtual = null;

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
  const container = document.getElementById('seletor-temas-mini');
  container.innerHTML = '';
  const temas = listarTemas();
  temas.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline';
    btn.textContent = t.nome;
    btn.style.backgroundImage = `url(${t.imagem})`;
    btn.style.backgroundSize = 'cover';
    btn.style.color = 'white';
    btn.style.textShadow = '0 2px 6px black';
    btn.style.border = '2px solid transparent';
    btn.style.padding = '6px 12px';
    btn.style.fontSize = '12px';
    btn.onclick = () => {
      aplicarTema(t.id, document.getElementById('onboarding-ajuste').value);
      container.querySelectorAll('button').forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = 'var(--cor-secundaria)';
    };
    container.appendChild(btn);
  });
  document.getElementById('onboarding-ajuste').addEventListener('change', function() {
    const temaSalvo = localStorage.getItem('tema_app') || temas[0].id;
    aplicarTema(temaSalvo, this.value);
  });
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

export function carregarOnboardingParaEdicao(profile) {
  userDataAtual = profile;
  modoEdicao = true;
  document.getElementById('onboard-cigarettes').value = profile.cigarettesPerDay || 10;
  document.getElementById('onboard-time').value = profile.timeToFirst || 15;
  document.getElementById('onboard-years').value = profile.yearsSmoking || 5;
  document.getElementById('onboard-cost').value = profile.costPerPack || 12.00;
  document.getElementById('onboard-quit-date').value = profile.quitMode || '7';
  if (profile.triggers) {
    document.querySelectorAll('#trigger-group .chip').forEach(el => {
      if (profile.triggers.includes(el.dataset.value)) {
        el.classList.add('selected');
        selectedTriggers.push(el.dataset.value);
      }
    });
  }
  const frases = profile.frases || ['', '', '', ''];
  document.getElementById('frase1').value = frases[0] || '';
  document.getElementById('frase2').value = frases[1] || '';
  document.getElementById('frase3').value = frases[2] || '';
  document.getElementById('frase4').value = frases[3] || '';
  if (profile.audioMotivacional) {
    recordedAudioBase64 = profile.audioMotivacional;
    document.getElementById('btn-play-recorded').disabled = false;
    document.getElementById('btn-play-recorded').dataset.audio = recordedAudioBase64;
  }
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
  if (profile.tema) {
    aplicarTema(profile.tema, profile.ajusteImagem || 'cover');
    const container = document.getElementById('seletor-temas-mini');
    container.querySelectorAll('button').forEach(b => {
      if (b.textContent === profile.tema) b.style.borderColor = 'var(--cor-secundaria)';
    });
  }
}

export async function finalizarOnboarding(user, edicao) {
  if (!user) { alert('Faça login primeiro.'); return false; }
  const cigs = parseInt(document.getElementById('onboard-cigarettes').value);
  const time = parseInt(document.getElementById('onboard-time').value);
  const years = parseInt(document.getElementById('onboard-years').value);
  const cost = parseFloat(document.getElementById('onboard-cost').value) || 12.00;
  const quitOption = document.getElementById('onboard-quit-date').value;
  let quitDate = new Date();
  if (quitOption === 'today') { /* hoje */ }
  else if (quitOption === 'reduce') { quitDate = null; }
  else { const days = parseInt(quitOption); quitDate.setDate(quitDate.getDate() + days); }

  if (selectedTriggers.length === 0) {
    document.getElementById('onboarding-message').textContent = 'Escolha pelo menos um gatilho.';
    return false;
  }

  const frases = [
    document.getElementById('frase1').value.trim(),
    document.getElementById('frase2').value.trim(),
    document.getElementById('frase3').value.trim(),
    document.getElementById('frase4').value.trim()
  ].filter(f => f !== '');

  const audioData = recordedAudioBase64 || null;
  const temaSalvo = localStorage.getItem('tema_app') || listarTemas()[0].id;
  const ajusteSalvo = localStorage.getItem('ajuste_imagem') || 'cover';

  const profile = {
    userId: user.uid,
    cigarettesPerDay: cigs,
    timeToFirst: time,
    yearsSmoking: years,
    triggers: selectedTriggers,
    quitDate: quitDate ? quitDate.toISOString() : null,
    quitMode: quitOption,
    costPerPack: cost,
    audioMotivacional: audioData,
    frases: frases,
    tema: temaSalvo,
    ajusteImagem: ajusteSalvo,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!edicao) {
    profile.createdAt = firebase.firestore.FieldValue.serverTimestamp();
  }

  // Salvar fotos (se houver) - aqui você pode substituir pelo método Base64 ou Storage
  // Por enquanto, vamos salvar as fotos em Base64 diretamente (comprimido)
  const fotosComprimidas = await comprimirFotos(fotosBase64);
  if (fotosComprimidas.length) profile.fotos = fotosComprimidas;

  await db.collection('users').doc(user.uid).set(profile, { merge: true });

  const plan = {
    userId: user.uid,
    quitDate: quitDate ? quitDate.toISOString() : null,
    topTriggers: selectedTriggers,
    status: 'active',
    quitMode: quitOption,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!edicao) {
    plan.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    // Inicializar contadores APENAS se for novo cadastro
    await db.collection('counters').doc(user.uid).set({
      userId: user.uid,
      daysWithout: 0,
      moneySaved: 0,
      cigarettesAvoided: 0,
      lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  await db.collection('quitPlans').doc(user.uid).set(plan, { merge: true });

  document.getElementById('onboarding-message').textContent = '';
  return true;
}

// ===== FUNÇÕES DE COMPRESSÃO DE FOTOS (Base64) =====
async function comprimirFotos(fotosArray) {
  const validas = fotosArray.filter(f => f && f.startsWith('data:image'));
  if (validas.length === 0) return [];
  const comprimidas = await Promise.all(
    validas.map(async (base64) => {
      return await comprimirImagem(base64, 600, 0.6);
    })
  );
  return comprimidas;
}

function comprimirImagem(base64, maxW, qualidade) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxW) { h = (h * maxW) / w; w = maxW; }
      if (h > maxW) { w = (w * maxW) / h; h = maxW; }
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', qualidade));
    };
    img.src = base64;
  });
}

// ===== EVENTOS DE ÁUDIO, FOTOS E GATILHOS (mantidos) =====
// ... (mantenha o restante do código de eventos como estava)
// Para não sobrecarregar, mantenha os eventos que já existem no seu onboarding.js
// Aqui só estou mostrando as partes alteradas