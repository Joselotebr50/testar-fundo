// js/app.js (versão completa com atualização de dashboard e histórico)
console.log('🔥 App.js carregou');

import { auth, db } from './firebase.js';

// ===== FUNÇÃO PARA ATUALIZAR O DASHBOARD =====
async function atualizarDashboard(user) {
  if (!user) return;
  try {
    const counterDoc = await db.collection('counters').doc(user.uid).get();
    let counter = counterDoc.exists ? counterDoc.data() : { daysWithout: 0, moneySaved: 0, cigarettesAvoided: 0 };

    // Busca perfil para calcular dias e custo
    const userDoc = await db.collection('users').doc(user.uid).get();
    const profile = userDoc.exists ? userDoc.data() : null;

    // Calcula dias sem fumar
    if (profile && profile.quitDate) {
      const quit = new Date(profile.quitDate);
      const now = new Date();
      const diff = Math.floor((now - quit) / (1000 * 60 * 60 * 24));
      counter.daysWithout = diff > 0 ? diff : 0;
    }

    // Atualiza elementos do dashboard
    document.getElementById('dash-days').textContent = counter.daysWithout || 0;
    
    const costPerPack = profile?.costPerPack || 12.00;
    const cigsAvoided = counter.cigarettesAvoided || 0;
    const economy = (costPerPack / 20) * cigsAvoided;
    document.getElementById('dash-money').textContent = `R$ ${economy.toFixed(2)}`;
    document.getElementById('dash-cigarettes-avoided').textContent = cigsAvoided;
  } catch (e) {
    console.error('Erro ao atualizar dashboard:', e);
  }
}

// ===== FUNÇÃO PARA CARREGAR HISTÓRICO =====
async function carregarHistorico(user) {
  const container = document.getElementById('history-content');
  container.innerHTML = 'Carregando...';
  try {
    const logsSnap = await db.collection('cigaretteLogs').where('userId', '==', user.uid).get();
    const cravingsSnap = await db.collection('cravingLogs').where('userId', '==', user.uid).get();

    let logs = [];
    logsSnap.forEach(doc => {
      const d = doc.data();
      logs.push({ ...d, timestamp: d.timestamp?.toDate?.() || new Date() });
    });
    logs.sort((a, b) => b.timestamp - a.timestamp);
    logs = logs.slice(0, 10);

    let cravings = [];
    cravingsSnap.forEach(doc => {
      const d = doc.data();
      cravings.push({ ...d, timestamp: d.timestamp?.toDate?.() || new Date() });
    });
    cravings.sort((a, b) => b.timestamp - a.timestamp);
    cravings = cravings.slice(0, 10);

    let html = '<h3>Últimos cigarros</h3>';
    if (logs.length === 0) html += '<p>Nenhum cigarro registrado.</p>';
    logs.forEach(d => {
      html += `<div class="card"><strong>${d.context || 'Contexto'}</strong> - Vontade: ${d.craving}/10 - ${d.emotion || ''}</div>`;
    });

    html += '<h3>Últimas fissuras vencidas</h3>';
    if (cravings.length === 0) html += '<p>Nenhuma fissura registrada.</p>';
    cravings.forEach(d => {
      const strategyLabel = d.strategyUsed || 'não informado';
      html += `<div class="card"><strong>${d.trigger || 'Gatilho'}</strong> - Intensidade: ${d.intensity}/10 - Estratégia: ${strategyLabel}</div>`;
    });
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML = `<p>Erro: ${e.message}</p>`;
  }
}

// ===== LOGIN =====
document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    document.getElementById('login-message').textContent = '';
  } catch (e) {
    document.getElementById('login-message').textContent = e.message;
  }
});

document.getElementById('btn-register').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-password').value;
  if (pass.length < 6) {
    document.getElementById('login-message').textContent = 'Senha mín. 6 caracteres.';
    return;
  }
  try {
    await auth.createUserWithEmailAndPassword(email, pass);
    document.getElementById('login-message').textContent = '';
  } catch (e) {
    document.getElementById('login-message').textContent = e.message;
  }
});

// ===== AUTH STATE =====
auth.onAuthStateChanged(async (user) => {
  document.getElementById('screen-loading').classList.remove('active');
  if (user) {
    document.getElementById('user-email').textContent = user.email;
    // Mostra dashboard
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-login').style.display = 'none';
    document.getElementById('screen-dashboard').classList.add('active');
    document.getElementById('screen-dashboard').style.display = 'block';
    // Atualiza dados
    await atualizarDashboard(user);
  } else {
    document.getElementById('screen-login').classList.add('active');
    document.getElementById('screen-login').style.display = 'flex';
    document.getElementById('screen-dashboard').classList.remove('active');
    document.getElementById('screen-dashboard').style.display = 'none';
  }
});

// ===== BOTÃO FUMEI =====
document.getElementById('btn-save-cigarette').addEventListener('click', async () => {
  console.log('🔴 Fumei clicado');
  if (!auth.currentUser) { alert('Usuário não logado'); return; }
  const context = document.getElementById('cig-context').value || 'não informado';
  const craving = parseInt(document.getElementById('cig-craving').value) || 0;
  const emotion = document.getElementById('cig-emotion').value || 'não informado';
  try {
    await db.collection('cigaretteLogs').add({
      userId: auth.currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      context,
      craving,
      emotion
    });
    console.log('✅ Cigarro salvo!');
    // Volta para dashboard e atualiza
    document.getElementById('screen-register-cigarette').classList.remove('active');
    document.getElementById('screen-register-cigarette').style.display = 'none';
    document.getElementById('screen-dashboard').classList.add('active');
    document.getElementById('screen-dashboard').style.display = 'block';
    await atualizarDashboard(auth.currentUser);
  } catch (e) {
    console.error(e);
    alert('Erro: ' + e.message);
  }
});

// ===== BOTÃO VENCI FISSURA =====
document.getElementById('btn-save-craving').addEventListener('click', async () => {
  console.log('🟢 Venci fissura clicado');
  if (!auth.currentUser) { alert('Usuário não logado'); return; }
  const trigger = document.getElementById('craving-trigger').value || 'não informado';
  const intensity = parseInt(document.getElementById('craving-intensity').value) || 6;
  const strategy = document.getElementById('craving-strategy').value;
  try {
    await db.collection('cravingLogs').add({
      userId: auth.currentUser.uid,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      trigger,
      intensity,
      strategyUsed: strategy,
      smoked: false
    });
    // Incrementa contador
    const counterRef = db.collection('counters').doc(auth.currentUser.uid);
    // Busca custo do perfil
    const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
    const profile = userDoc.exists ? userDoc.data() : null;
    const cost = profile?.costPerPack || 12.00;
    await counterRef.update({
      cigarettesAvoided: firebase.firestore.FieldValue.increment(1),
      moneySaved: firebase.firestore.FieldValue.increment(cost / 20)
    });
    console.log('✅ Fissura salva e contador atualizado!');
    // Volta para dashboard e atualiza
    document.getElementById('screen-register-craving').classList.remove('active');
    document.getElementById('screen-register-craving').style.display = 'none';
    document.getElementById('screen-dashboard').classList.add('active');
    document.getElementById('screen-dashboard').style.display = 'block';
    await atualizarDashboard(auth.currentUser);
  } catch (e) {
    console.error(e);
    alert('Erro: ' + e.message);
  }
});

// ===== BOTÕES PARA ABRIR AS TELAS =====
document.getElementById('btn-register-cigarette').addEventListener('click', () => {
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-dashboard').style.display = 'none';
  document.getElementById('screen-register-cigarette').classList.add('active');
  document.getElementById('screen-register-cigarette').style.display = 'block';
});

document.getElementById('btn-register-craving').addEventListener('click', () => {
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-dashboard').style.display = 'none';
  document.getElementById('screen-register-craving').classList.add('active');
  document.getElementById('screen-register-craving').style.display = 'block';
});

document.getElementById('btn-cancel-cigarette').addEventListener('click', () => {
  document.getElementById('screen-register-cigarette').classList.remove('active');
  document.getElementById('screen-register-cigarette').style.display = 'none';
  document.getElementById('screen-dashboard').classList.add('active');
  document.getElementById('screen-dashboard').style.display = 'block';
});

document.getElementById('btn-cancel-craving').addEventListener('click', () => {
  document.getElementById('screen-register-craving').classList.remove('active');
  document.getElementById('screen-register-craving').style.display = 'none';
  document.getElementById('screen-dashboard').classList.add('active');
  document.getElementById('screen-dashboard').style.display = 'block';
});

// ===== HISTÓRICO =====
document.getElementById('btn-go-history').addEventListener('click', async () => {
  if (!auth.currentUser) { alert('Faça login.'); return; }
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-dashboard').style.display = 'none';
  document.getElementById('screen-history').classList.add('active');
  document.getElementById('screen-history').style.display = 'block';
  await carregarHistorico(auth.currentUser);
});

document.getElementById('btn-history-back').addEventListener('click', () => {
  document.getElementById('screen-history').classList.remove('active');
  document.getElementById('screen-history').style.display = 'none';
  document.getElementById('screen-dashboard').classList.add('active');
  document.getElementById('screen-dashboard').style.display = 'block';
  // Atualiza dashboard ao voltar
  if (auth.currentUser) atualizarDashboard(auth.currentUser);
});

// ===== LOGOUT =====
document.getElementById('btn-logout').addEventListener('click', () => auth.signOut());

console.log('✅ App pronto!');
