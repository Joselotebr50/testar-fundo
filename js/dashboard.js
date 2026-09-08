// js/dashboard.js
import { db } from './firebase.js';

export async function renderDashboard(user, profile) {
  if (!user) return;
  document.getElementById('user-email').textContent = user.email;
  const counterDoc = await db.collection('counters').doc(user.uid).get();
  let counter = counterDoc.exists ? counterDoc.data() : { daysWithout:0, moneySaved:0, cigarettesAvoided:0 };
  if (profile && profile.quitDate) {
    const quit = new Date(profile.quitDate);
    const now = new Date();
    const diff = Math.floor((now - quit) / (1000*60*60*24));
    counter.daysWithout = diff > 0 ? diff : 0;
  }
  document.getElementById('dash-days').textContent = counter.daysWithout || 0;
  
  // Economia real: (custo da carteira / 20) * cigarros evitados
  const costPerPack = profile?.costPerPack || 12.00;
  const cigsAvoided = counter.cigarettesAvoided || 0;
  const economy = (costPerPack / 20) * cigsAvoided;
  document.getElementById('dash-money').textContent = `R$ ${economy.toFixed(2)}`;
  document.getElementById('dash-cigarettes-avoided').textContent = cigsAvoided;

  const isToday = profile?.quitMode === 'today';
  document.getElementById('intensive-support').style.display = isToday ? 'block' : 'none';
}