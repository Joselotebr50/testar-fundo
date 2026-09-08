console.log('🔥 App.js carregou');

import { auth, db } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM pronto');

  const btnCigarro = document.getElementById('btn-save-cigarette');
  const btnCraving = document.getElementById('btn-save-craving');

  console.log('btn-save-cigarette:', btnCigarro);
  console.log('btn-save-craving:', btnCraving);

  if (btnCigarro) {
    btnCigarro.addEventListener('click', () => {
      alert('Clicou no Fumei!');
    });
  } else {
    console.error('Botão Fumei não encontrado');
  }

  if (btnCraving) {
    btnCraving.addEventListener('click', () => {
      alert('Clicou no Venci fissura!');
    });
  } else {
    console.error('Botão Venci fissura não encontrado');
  }
});
