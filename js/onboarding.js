// js/onboarding.js
import { db, storage } from './firebase.js';
import { listarTemas, aplicarTema, obterUrlImagem } from './themeManager.js';

// Variáveis locais
let selectedTriggers = [];
let recordedAudioBase64 = null;
let mediaRecorder = null;
let audioChunks = [];
let fotosBase64 = ['', '', '', '']; // até 4 fotos
let modoEdicao = false;
let userDataAtual = null;

// ===== INICIAR ONBOARDING =====
export function iniciarOnboarding(edicao) {
  modoEdicao = edicao;
  // Resetar seleção de gatilhos
  selectedTriggers = [];
  document.querySelectorAll('#trigger-group .chip').forEach(el => el.classList.remove('selected'));
  // Limpar campos
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
  // Carregar temas no seletor
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
  // Ajuste de imagem
  document.getElementById('onboarding-ajuste').addEventListener('change', function() {
    const temaSalvo = localStorage.getItem('tema_app') || temas[0].id;
    aplicarTema(temaSalvo, this.value);
  });
  // Evento Enter para navegação natural
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
  // Preencher campos
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
  // Fotos (se tiver URLs, mas como é edição, recarregamos do storage)
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
  // Tema
  if (profile.tema) {
    aplicarTema(profile.tema, profile.ajusteImagem || 'cover');
    const container = document.getElementById('seletor-temas-mini');
    container.querySelectorAll('button').forEach(b => {
      if (b.textContent === profile.tema) b.style.borderColor = 'var(--cor-secundaria)';
    });
  }
}

// ===== FINALIZAR ONBOARDING =====
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

  // Coletar frases
  const frases = [
    document.getElementById('frase1').value.trim(),
    document.getElementById('frase2').value.trim(),
    document.getElementById('frase3').value.trim(),
    document.getElementById('frase4').value.trim()
  ].filter(f => f !== '');

  // Áudio
  const audioData = recordedAudioBase64 || null;

  // Tema e ajuste
  const temaSalvo = localStorage.getItem('tema_app') || listarTemas()[0].id;
  const ajusteSalvo = localStorage.getItem('ajuste_imagem') || 'cover';

  // Montar perfil
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

  // Salvar fotos no Firebase Storage (se houver)
  const fotosUrls = await uploadFotos(user.uid);
  if (fotosUrls.length) profile.fotos = fotosUrls;

  // Salvar no Firestore
  await db.collection('users').doc(user.uid).set(profile, { merge: true });

  // QuitPlan
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
    // Inicializar contadores
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

// ===== UPLOAD DE FOTOS =====
async function uploadFotos(uid) {
  const urls = [];
  for (let i = 0; i < fotosBase64.length; i++) {
    const base64 = fotosBase64[i];
    if (!base64) continue;
    try {
      const response = await fetch(base64);
      const blob = await response.blob();
      const ref = storage.ref().child(`users/${uid}/fotos/foto_${i}.jpg`);
      await ref.put(blob);
      const url = await ref.getDownloadURL();
      urls.push(url);
    } catch (e) {
      console.warn('Erro ao enviar foto', i, e);
    }
  }
  return urls;
}

// ===== EVENTOS DE ÁUDIO =====
document.getElementById('btn-start-recording').addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        recordedAudioBase64 = reader.result;
        document.getElementById('btn-play-recorded').disabled = false;
        document.getElementById('btn-play-recorded').dataset.audio = recordedAudioBase64;
        document.getElementById('btn-start-recording').classList.remove('pisca');
      };
      reader.readAsDataURL(audioBlob);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
    document.getElementById('btn-start-recording').disabled = true;
    document.getElementById('btn-stop-recording').disabled = false;
    document.getElementById('btn-start-recording').classList.add('pisca');
  } catch (e) {
    alert('Permissão de microfone necessária.');
  }
});
document.getElementById('btn-stop-recording').addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    document.getElementById('btn-start-recording').disabled = false;
    document.getElementById('btn-stop-recording').disabled = true;
    document.getElementById('btn-start-recording').classList.remove('pisca');
  }
});
document.getElementById('btn-play-recorded').addEventListener('click', function() {
  const audioData = this.dataset.audio;
  if (audioData) {
    const audio = new Audio(audioData);
    audio.play();
    this.classList.add('pisca');
    audio.onended = () => this.classList.remove('pisca');
  }
});
document.getElementById('btn-upload-audio').addEventListener('click', () => document.getElementById('onboard-audio').click());
document.getElementById('onboard-audio').addEventListener('change', function() {
  const file = this.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      recordedAudioBase64 = reader.result;
      document.getElementById('btn-play-recorded').disabled = false;
      document.getElementById('btn-play-recorded').dataset.audio = recordedAudioBase64;
    };
    reader.readAsDataURL(file);
  }
});
document.getElementById('btn-discard-audio').addEventListener('click', () => {
  recordedAudioBase64 = null;
  document.getElementById('btn-play-recorded').disabled = true;
  document.getElementById('btn-play-recorded').dataset.audio = '';
  document.getElementById('onboard-audio').value = '';
  document.getElementById('btn-start-recording').disabled = false;
  document.getElementById('btn-stop-recording').disabled = true;
  document.getElementById('btn-start-recording').classList.remove('pisca');
});

// ===== EVENTOS DE FOTOS =====
document.querySelectorAll('.foto-thumb').forEach(thumb => {
  thumb.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove')) return;
    const index = parseInt(this.dataset.index);
    document.getElementById('foto-input').click();
    document.getElementById('foto-input').onchange = function() {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          fotosBase64[index] = ev.target.result;
          thumb.style.backgroundImage = `url(${ev.target.result})`;
          thumb.innerHTML = `<span class="remove" data-index="${index}">✕</span>`;
        };
        reader.readAsDataURL(file);
      }
      this.value = '';
    };
  });
});
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('remove')) {
    const index = parseInt(e.target.dataset.index);
    fotosBase64[index] = '';
    const thumb = document.querySelector(`.foto-thumb[data-index="${index}"]`);
    thumb.style.backgroundImage = '';
    thumb.innerHTML = '+';
  }
});

// ===== EVENTOS DE GATILHOS =====
document.querySelectorAll('#trigger-group .chip').forEach(chip => {
  chip.addEventListener('click', function() {
    const val = this.dataset.value;
    if (selectedTriggers.includes(val)) {
      selectedTriggers = selectedTriggers.filter(t => t !== val);
      this.classList.remove('selected');
    } else {
      if (selectedTriggers.length < 4) {
        selectedTriggers.push(val);
        this.classList.add('selected');
      }
    }
  });
});

// ===== UTILITÁRIO =====
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