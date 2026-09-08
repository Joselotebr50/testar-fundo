// js/app.js
console.log('🔥 app.js carregou!');

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

console.log('✅ Todos os módulos importados');

// ... todo o resto do código ...
