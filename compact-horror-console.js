// COMPACT HORROR THEME - Easy Console Copy
console.log('🩸 COMPACT CRYSTAL LAKE HORROR THEME');

document.documentElement.classList.add('horror-theme');
document.body.classList.add('horror-theme');
localStorage.setItem('weather-app-theme', 'horror');

const s = document.createElement('style');
s.id = 'compact-horror';
s.innerHTML = `
.horror-theme #root { background: linear-gradient(135deg, #0d0d0d 0%, #1a0000 50%, #000000 100%) !important; }
.horror-theme *:not(.mobile-navigation):not(.nav-button) { background: transparent !important; color: #ff6b6b !important; text-shadow: 0 0 10px rgba(139, 0, 0, 0.7) !important; }
.horror-theme .mobile-navigation { background: rgba(15, 15, 15, 0.75) !important; backdrop-filter: blur(25px) !important; border-top: 1px solid rgba(139, 0, 0, 0.3) !important; box-shadow: 0 -8px 32px rgba(139, 0, 0, 0.15) !important; }
.horror-theme .nav-button { background: transparent !important; border: none !important; border-radius: 16px !important; color: rgba(255, 107, 107, 0.6) !important; box-shadow: none !important; transition: all 0.4s ease !important; }
.horror-theme .nav-button.active { background: rgba(139, 0, 0, 0.2) !important; backdrop-filter: blur(15px) !important; color: #ff6b6b !important; transform: scale(1.05) translateY(-2px) !important; box-shadow: 0 8px 25px rgba(139, 0, 0, 0.4), 0 0 20px rgba(139, 0, 0, 0.3) !important; border: 1px solid rgba(139, 0, 0, 0.3) !important; text-shadow: 0 0 15px rgba(139, 0, 0, 0.9) !important; }
.horror-theme .nav-button:hover:not(.active) { background: rgba(139, 0, 0, 0.1) !important; backdrop-filter: blur(10px) !important; color: rgba(255, 107, 107, 0.8) !important; transform: translateY(-1px) !important; }
`;
document.querySelectorAll('style[id*="horror"]').forEach(el => el.remove());
document.head.appendChild(s);
console.log('🎭 HORROR THEME ACTIVATED! 🏕️💀');
