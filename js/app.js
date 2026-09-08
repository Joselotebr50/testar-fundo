// js/app.js (versão mínima para testar Fumei e Venci fissura)
console.log('🔥 App.js mínimo executou!');

// ===== FIREBASE (já está no firebase.js) =====
import { auth, db } from './firebase.js';

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

// ===== REGISTRO =====
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

// ===== QUANDO LOGAR, MOSTRA DASHBOARD =====
auth.onAuthStateChanged(async (user) => {
  document.getElementById('screen-loading').classList.remove('active');
  if (user) {
    document.getElementById('user-email').textContent = user.email;
    // Oculta login, mostra dashboard
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-login').style.display = 'none';
    document.getElementById('screen-dashboard').classList.add('active');
    document.getElementById('screen-dashboard').style.display = 'block';
  } else {
    // Mostra login
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
    alert('Cigarro registrado!');
    // Volta para dashboard
    document.getElementById('screen-register-cigarette').classList.remove('active');
    document.getElementById('screen-register-cigarette').style.display = 'none';
    document.getElementById('screen-dashboard').classList.add('active');
    document.getElementById('screen-dashboard').style.display = 'block';
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
    await counterRef.update({
      cigarettesAvoided: firebase.firestore.FieldValue.increment(1),
      moneySaved: firebase.firestore.FieldValue.increment(0.50) // fixo para teste
    });
    console.log('✅ Fissura salva e contador atualizado!');
    alert('Fissura vencida registrada!');
    // Volta para dashboard
    document.getElementById('screen-register-craving').classList.remove('active');
    document.getElementById('screen-register-craving').style.display = 'none';
    document.getElementById('screen-dashboard').classList.add('active');
    document.getElementById('screen-dashboard').style.display = 'block';
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

console.log('✅ App mínimo pronto!');
