// js/app.js
import { auth, db } from './firebase.js';
import { login, register, logout, togglePasswordVisibility } from './auth.js';
import { 
  iniciarOnboarding, 
  carregarOnboardingParaEdicao, 
  finalizarOnboarding 
} from './onboarding.js';
import { renderDashboard, atualizarContador } from './dashboard.js';
import { mostrarEstrategias, voltarEstrategias } from './strategies.js';
import { iniciarRespiracao, finalizarRespiracao } from './subapps/respiracao.js';
import { iniciarAgua, sairAgua } from './subapps/agua.js';
import { carregarTemaSalvo, aplicarTema } from './themeManager.js';
import { carregarLessons } from './lessons.js';
import { carregarHistory } from './history.js';

export let currentUser = null;
export let userProfile = null;
export let userQuitPlan = null;
export let modoEdicao = false;

const PROTECTED_SCREENS = [
  'screen-onboarding', 'screen-dashboard', 'screen-strategies',
  'screen-register-cigarette', 'screen-register-craving', 'screen-relapse',
  'screen-lessons', 'screen-history', 'screen-agua', 'screen-respiracao'
];

export function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
    if (id === 'screen-login') target.style.display = 'flex';
    if (id === 'screen-respiracao') target.style.display = 'block';
  }
}

export function navigateTo(screenId) {
  if (PROTECTED_SCREENS.includes(screenId) && !currentUser) {
    showScreen('screen-login');
    return;
  }
  if (screenId === 'screen-login' && currentUser) {
    if (userProfile) {
      showScreen('screen-dashboard');
      renderDashboard(currentUser, userProfile);
      updatePlanBadge();
    } else {
      showScreen('screen-onboarding');
    }
    return;
  }
  showScreen(screenId);
}

export function updatePlanBadge() {
  const badge = document.getElementById('plan-badge');
  if (!userProfile) return;
  const mode = userProfile.quitMode;
  if (mode === 'today') badge.textContent = '🔥 Plano: Hoje (Intensivo)';
  else if (mode === 'reduce') badge.textContent = '📉 Plano: Redução gradual';
  else badge.textContent = `📅 Plano: ${mode} dias`;
}

auth.onAuthStateChanged(async (user) => {
  document.getElementById('screen-loading').classList.remove('active');
  if (user) {
    currentUser = user;
    document.getElementById('user-email').textContent = currentUser.email;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        userProfile = doc.data();
        const planSnap = await db.collection('quitPlans').doc(user.uid).get();
        userQuitPlan = planSnap.exists ? planSnap.data() : null;
        if (userProfile.tema) {
          aplicarTema(userProfile.tema, userProfile.ajusteImagem || 'top');
        } else {
          carregarTemaSalvo();
        }
        navigateTo('screen-dashboard');
        renderDashboard(currentUser, userProfile);
        updatePlanBadge();
      } else {
        userProfile = null;
        navigateTo('screen-onboarding');
        iniciarOnboarding(false);
      }
    } catch (e) {
      console.warn(e);
      if (!userProfile) {
        try {
          await db.collection('users').doc(user.uid).set({ userId: user.uid, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
          userProfile = { userId: user.uid };
          navigateTo('screen-onboarding');
          iniciarOnboarding(false);
        } catch (e2) {
          navigateTo('screen-login');
        }
      }
    }
  } else {
    currentUser = null;
    userProfile = null;
    userQuitPlan = null;
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-message').textContent = '';
    navigateTo('screen-login');
  }
});

// ===== EVENTOS =====
document.getElementById('btn-login').addEventListener('click', () => login());
document.getElementById('login-password').addEventListener('keypress', (e) => { if (e.key === 'Enter') login(); });
document.getElementById('login-email').addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('login-password').focus(); });
document.getElementById('toggle-login-password').addEventListener('click', function() {
  const input = document.getElementById('login-password');
  togglePasswordVisibility(input, this);
});
document.getElementById('btn-register').addEventListener('click', () => register());
document.getElementById('btn-logout').addEventListener('click', () => logout());

document.getElementById('btn-config').addEventListener('click', () => {
  if (!currentUser || !userProfile) return;
  modoEdicao = true;
  navigateTo('screen-onboarding');
  carregarOnboardingParaEdicao(userProfile);
});

document.getElementById('btn-sos-strategies').addEventListener('click', () => {
  mostrarEstrategias(currentUser, userProfile);
  navigateTo('screen-strategies');
});

document.getElementById('btn-sos-emergencia').addEventListener('click', () => {
  navigateTo('screen-respiracao');
  iniciarRespiracao(currentUser, userProfile, true);
});

document.getElementById('btn-strategies-back').addEventListener('click', () => {
  voltarEstrategias();
  navigateTo('screen-dashboard');
});

document.getElementById('btn-onboarding-sair').addEventListener('click', () => {
  if (confirm('Tem certeza? Seu cadastro não será salvo.')) {
    if (modoEdicao) {
      modoEdicao = false;
      navigateTo('screen-dashboard');
    } else {
      auth.signOut();
      navigateTo('screen-login');
    }
  }
});

// ===== CORREÇÃO: finalizar onboarding com remoção manual da tela =====
document.getElementById('btn-finish-onboarding').addEventListener('click', async () => {
  const success = await finalizarOnboarding(currentUser, modoEdicao);
  if (success) {
    modoEdicao = false;
    // Recarregar perfil
    const doc = await db.collection('users').doc(currentUser.uid).get();
    userProfile = doc.exists ? doc.data() : null;
    const planSnap = await db.collection('quitPlans').doc(currentUser.uid).get();
    userQuitPlan = planSnap.exists ? planSnap.data() : null;
    
    // FORÇA OCULTAR A TELA DE ONBOARDING MANUALMENTE
    const onboardingScreen = document.getElementById('screen-onboarding');
    onboardingScreen.classList.remove('active');
    onboardingScreen.style.display = 'none';
    
    // Mostra o dashboard
    navigateTo('screen-dashboard');
    renderDashboard(currentUser, userProfile);
    updatePlanBadge();
  }
});

// Outros eventos
document.getElementById('btn-register-cigarette').addEventListener('click', () => navigateTo('screen-register-cigarette'));
document.getElementById('btn-cancel-cigarette').addEventListener('click', () => navigateTo('screen-dashboard'));
document.getElementById('btn-register-craving').addEventListener('click', () => navigateTo('screen-register-craving'));
document.getElementById('btn-cancel-craving').addEventListener('click', () => navigateTo('screen-dashboard'));
document.getElementById('btn-relapse').addEventListener('click', () => navigateTo('screen-relapse'));
document.getElementById('btn-cancel-relapse').addEventListener('click', () => navigateTo('screen-dashboard'));
document.getElementById('btn-go-lessons').addEventListener('click', () => { carregarLessons(); navigateTo('screen-lessons'); });
document.getElementById('btn-lessons-back').addEventListener('click', () => navigateTo('screen-dashboard'));
document.getElementById('btn-go-history').addEventListener('click', () => { carregarHistory(currentUser); navigateTo('screen-history'); });
document.getElementById('btn-history-back').addEventListener('click', () => navigateTo('screen-dashboard'));

document.getElementById('btn-play-motivational').addEventListener('click', () => {
  if (userProfile && userProfile.audioMotivacional) {
    const audio = new Audio(userProfile.audioMotivacional);
    audio.play();
  } else {
    alert('Nenhum áudio motivacional cadastrado.');
  }
});

document.getElementById('btn-respiracao-sair').addEventListener('click', () => {
  finalizarRespiracao();
  navigateTo('screen-dashboard');
});

document.getElementById('btn-agua-sair').addEventListener('click', () => {
  sairAgua();
  navigateTo('screen-strategies');
});
