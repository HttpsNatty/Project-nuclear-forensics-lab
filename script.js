const radiation = document.getElementById('radiationType');
const material = document.getElementById('materialType');
const thickness = document.getElementById('thickness');
const thicknessLabel = document.getElementById('thicknessLabel');
const shield = document.getElementById('shield');
const shieldLabel = document.getElementById('shieldLabel');
const particle = document.getElementById('particle');
const doseBar = document.getElementById('doseBar');
const dosePercent = document.getElementById('dosePercent');
const resultTitle = document.getElementById('resultTitle');
const resultText = document.getElementById('resultText');

function updateRangeFill(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value);
  const percent = ((value - min) * 100) / (max - min);
  input.style.setProperty('--value', `${percent}%`);
}

const tabButtons = document.querySelectorAll('[data-tab]');
const tabPanels = document.querySelectorAll('[data-panel]');

function activateTab(tabName) {
  tabButtons.forEach(button => {
    const isActive = button.dataset.tab === tabName;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  tabPanels.forEach(panel => {
    panel.classList.toggle('is-active', panel.dataset.panel === tabName);
  });
}

tabButtons.forEach(button => {
  button.addEventListener('click', () => activateTab(button.dataset.tab));
});

activateTab('blindagem');

const names = {
  alpha: 'Alfa (α)', beta: 'Beta (β)', gamma: 'Gama (γ)',
  paper: 'Papel', aluminum: 'Alumínio', lead: 'Chumbo', concrete: 'Concreto'
};

const attenuation = {
  alpha: { paper: 0.02, aluminum: 0.01, lead: 0.005, concrete: 0.005 },
  beta: { paper: 0.75, aluminum: 0.06, lead: 0.03, concrete: 0.04 },
  gamma: { paper: 0.95, aluminum: 0.82, lead: 0.18, concrete: 0.28 }
};

const descriptions = {
  alpha: 'Alfa tem alto poder de ionização, mas baixa penetração. É bloqueada facilmente, porém perigosa se entrar no corpo.',
  beta: 'Beta possui penetração intermediária. Pode atravessar papel, mas é reduzida por alumínio e outros materiais.',
  gamma: 'Gama é muito penetrante. Precisa de materiais densos ou grandes espessuras para reduzir bastante a dose.'
};

function updateShield() {
  const t = Number(thickness.value);
  thicknessLabel.textContent = `${t} cm`;
  shield.className = `shield ${material.value}`;
  shield.style.width = `${55 + t * 10}px`;
  shieldLabel.textContent = names[material.value];
}

function calculateDose() {
  const base = attenuation[radiation.value][material.value];
  const t = Number(thickness.value);
  return Math.max(0, Math.round(base ** (t / 3) * 100));
}

function emit() {
  updateShield();
  const dose = calculateDose();
  particle.className = `particle ${radiation.value}`;
  particle.textContent = radiation.value === 'alpha' ? 'α' : radiation.value === 'beta' ? 'β' : 'γ';
  void particle.offsetWidth;
  particle.classList.add(dose > 12 ? 'move-pass' : 'move-stop');
  doseBar.style.width = `${dose}%`;
  dosePercent.textContent = `${dose}%`;
  resultTitle.textContent = dose > 12 ? 'Parte da radiação atravessou a blindagem' : 'A radiação foi praticamente bloqueada';
  resultText.textContent = descriptions[radiation.value];
}

document.getElementById('emitBtn').addEventListener('click', emit);
[radiation, material, thickness].forEach(el => el.addEventListener('input', () => {
  updateShield();
  if (el.type === 'range') updateRangeFill(el);
}));
updateShield();
updateRangeFill(thickness);

const distance = document.getElementById('distance');
const geigerDisplay = document.getElementById('geigerDisplay');
const pulse = document.getElementById('pulse');
const geigerNote = document.getElementById('geigerNote');
const geigerSoundBtn = document.getElementById('geigerSoundBtn');
let geigerAudioContext;
let geigerSoundOn = false;
let geigerTickTimer;

function playGeigerTick() {
  if (!geigerSoundOn) return;

  geigerAudioContext = geigerAudioContext || new (window.AudioContext || window.webkitAudioContext)();

  const now = geigerAudioContext.currentTime;
  const oscillator = geigerAudioContext.createOscillator();
  const gain = geigerAudioContext.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(850, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

  oscillator.connect(gain);
  gain.connect(geigerAudioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.05);
}

function updateGeigerSoundLoop() {
  clearInterval(geigerTickTimer);
  if (!geigerSoundOn) return;

  const d = Number(distance.value);
  const interval = Math.max(120, d * d * 18);
  geigerTickTimer = setInterval(playGeigerTick, interval);
  playGeigerTick();
}

function updateGeiger() {
  const d = Number(distance.value);
  const intensity = Math.round(100 / (d * d) * 10);
  const ticks = d < 3 ? 'TIC TIC TIC TIC!' : d < 6 ? 'tic tic tic' : 'tic... tic...';
  geigerDisplay.textContent = ticks;
  pulse.style.animationDuration = `${Math.max(.25, d / 5)}s`;
  updateGeigerSoundLoop();
  geigerNote.textContent = `Distância: ${d} m • Contagem aproximada: ${intensity} cps`;
}
distance.addEventListener('input', () => {
  updateGeiger();
  updateRangeFill(distance);
});
geigerSoundBtn.addEventListener('click', async () => {
  geigerSoundOn = !geigerSoundOn;
  geigerSoundBtn.classList.toggle('is-on', geigerSoundOn);
  geigerSoundBtn.setAttribute('aria-pressed', String(geigerSoundOn));
  geigerSoundBtn.textContent = geigerSoundOn ? 'Som ligado' : 'Som desligado';

  if (geigerSoundOn) {
    geigerAudioContext = geigerAudioContext || new (window.AudioContext || window.webkitAudioContext)();
    await geigerAudioContext.resume();
  }

  updateGeigerSoundLoop();
});
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (!geigerSoundOn) return;

    if (button.dataset.tab === 'geiger') {
      updateGeigerSoundLoop();
    } else {
      clearInterval(geigerTickTimer);
    }
  });
});
updateGeiger();
updateRangeFill(distance);

document.querySelectorAll('[data-body]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.body;
    const ray = document.getElementById('bodyRay');
    const text = document.getElementById('bodyText');
    ray.className = `body-ray ${type}-ray`;
    text.textContent = {
      alpha: 'Alfa quase não atravessa a pele, mas pode ser perigosa se ingerida ou inalada.',
      beta: 'Beta pode penetrar superficialmente nos tecidos e causar dano local.',
      gamma: 'Gama atravessa o corpo com facilidade e pode atingir órgãos internos.'
    }[type];
  });
});

const forensicRoom = document.getElementById('forensicRoom');
const forensicDetector = document.getElementById('forensicDetector');
const forensicSource = document.getElementById('forensicSource');
const forensicCpm = document.getElementById('forensicCpm');
const forensicCps = document.getElementById('forensicCps');
const forensicDose = document.getElementById('forensicDose');
const forensicStatus = document.getElementById('forensicStatus');
const forensicTicks = document.getElementById('forensicTicks');
const forensicHint = document.getElementById('forensicHint');
const locateSourceBtn = document.getElementById('locateSourceBtn');
const shieldStage = document.getElementById('shieldStage');
const shieldButtons = document.querySelectorAll('[data-shield]');
const shieldTableBody = document.querySelector('.forensic-table tbody');
const testShieldBtn = document.getElementById('testShieldBtn');
const shieldOutcome = document.getElementById('shieldOutcome');
const conclusionStage = document.getElementById('conclusionStage');
const conclusionButtons = document.querySelectorAll('[data-conclusion]');
const conclusionFeedback = document.getElementById('conclusionFeedback');
const emitReportBtn = document.getElementById('emitReportBtn');
const reportStage = document.getElementById('reportStage');
const reportOutput = document.getElementById('reportOutput');

const forensicState = {
  detectorX: 18,
  detectorY: 72,
  sourceX: 72,
  sourceY: 30,
  selectedShield: 'none',
  testedShields: new Set(),
  sourceLocated: false,
  conclusionLocked: true,
};

const shieldOrder = ['none', 'paper', 'aluminum', 'lead'];

const shieldData = {
  none: {
    cps: 3200,
    interpretation: 'Sem blindagem: 3200 cps. Serve como referência da fonte desconhecida.',
    note: 'Sem blindagem registra a referência inicial da cena.'
  },
  paper: {
    cps: 3000,
    interpretation: 'Papel: 3000 cps. Papel quase não reduziu: não parece alfa.',
    note: 'Papel quase não reduziu: não parece alfa.'
  },
  aluminum: {
    cps: 180,
    interpretation: 'Alumínio: 180 cps. Alumínio reduziu muito: provável beta.',
    note: 'Alumínio reduziu muito: provável beta.'
  },
  lead: {
    cps: 20,
    interpretation: 'Chumbo: 20 cps. Chumbo reduziu quase tudo: radiação altamente atenuada.',
    note: 'Chumbo reduziu quase tudo: radiação altamente atenuada.'
  }
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function moveForensicDetector(deltaX, deltaY) {
  forensicState.detectorX = clamp(forensicState.detectorX + deltaX, 8, 92);
  forensicState.detectorY = clamp(forensicState.detectorY + deltaY, 12, 88);
  updateForensicReadout();
}

function getForensicMeasurement() {
  const virtualWidth = 1000;
  const virtualHeight = 360;
  const dx = ((forensicState.detectorX - forensicState.sourceX) / 100) * virtualWidth;
  const dy = ((forensicState.detectorY - forensicState.sourceY) / 100) * virtualHeight;
  const distance = Math.hypot(dx, dy);

  // A taxa cresce quando o detector se aproxima da fonte; a distância entra ao quadrado para simular a queda rápida.
  const cps = 4 + 450000 / (distance * distance + 900);
  const cpm = Math.round(cps * 60);
  const dose = cps * 0.05;

  return { distance, cps, cpm, dose };
}

function getForensicTickLine(cps) {
  if (cps < 12) {
    return 'tic... tic...';
  }

  if (cps < 45) {
    return 'tic tic... tic tic...';
  }

  return 'TIC TIC TIC TIC';
}

function updateShieldTable(selection) {
  shieldButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.shield === selection);
  });

  shieldTableBody.querySelectorAll('[data-shield-row]').forEach(row => {
    row.classList.toggle('is-selected', row.dataset.shieldRow === selection);
  });
}

function renderShieldRows() {
  const tableLabels = {
    none: 'Sem blindagem',
    paper: 'Papel',
    aluminum: 'Alum\u00ednio',
    lead: 'Chumbo'
  };
  const tableInterpretations = {
    none: 'Refer\u00eancia inicial da cena.',
    paper: 'Papel quase n\u00e3o reduziu: n\u00e3o parece alfa.',
    aluminum: 'Alum\u00ednio reduziu muito: prov\u00e1vel beta.',
    lead: 'Chumbo reduziu quase tudo: radia\u00e7\u00e3o altamente atenuada.'
  };

  shieldTableBody.innerHTML = '';

  shieldOrder.forEach(type => {
    if (!forensicState.testedShields.has(type)) return;

    const row = document.createElement('tr');
    row.dataset.shieldRow = type;
    row.classList.toggle('is-selected', type === forensicState.selectedShield);

    [tableLabels[type], `${shieldData[type].cps} cps`, tableInterpretations[type]].forEach(value => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.appendChild(cell);
    });

    shieldTableBody.appendChild(row);
  });
}

function setShieldSelection(selection) {
  forensicState.selectedShield = selection;
  updateShieldTable(selection);
  shieldOutcome.textContent = `Preparado para testar ${selection === 'none' ? 'sem blindagem' : selection === 'paper' ? 'papel' : selection === 'aluminum' ? 'alumínio' : 'chumbo'}.`;
}

function updateForensicReadout() {
  forensicDetector.style.left = `${forensicState.detectorX}%`;
  forensicDetector.style.top = `${forensicState.detectorY}%`;
  forensicSource.style.left = `${forensicState.sourceX}%`;
  forensicSource.style.top = `${forensicState.sourceY}%`;

  const { distance, cps, cpm, dose } = getForensicMeasurement();
  forensicState.sourceLocated = cps >= 45;

  forensicCpm.textContent = `${cpm}`;
  forensicCps.textContent = `${cps.toFixed(1)}`;
  forensicDose.textContent = `${dose.toFixed(1)} µSv/h`;
  forensicTicks.textContent = getForensicTickLine(cps);

  forensicStatus.classList.remove('warn', 'alert');
  if (cps < 12) {
    forensicStatus.textContent = 'Normal';
  } else if (cps < 45) {
    forensicStatus.textContent = 'Radiação detectada';
    forensicStatus.classList.add('warn');
  } else {
    forensicStatus.textContent = 'Alerta';
    forensicStatus.classList.add('alert');
  }

  forensicSource.style.opacity = String(Math.min(1, 0.18 + cps / 140));
  forensicSource.style.transform = 'translate(-50%, -50%)';
  forensicHint.textContent = forensicState.sourceLocated
    ? 'Fonte localizada. Clique para iniciar a análise.'
    : `Distância estimada: ${distance.toFixed(0)} unidades. Aproximar reduz a contagem.`;

  forensicState.sourceLocated = cps >= 45;
  locateSourceBtn.disabled = !forensicState.sourceLocated;
  locateSourceBtn.textContent = 'Fonte localizada — iniciar análise';
}

document.querySelectorAll('.move-btn').forEach(button => {
  button.addEventListener('click', () => {
    const step = 6;
    if (button.dataset.move === 'left') moveForensicDetector(-step, 0);
    if (button.dataset.move === 'right') moveForensicDetector(step, 0);
    if (button.dataset.move === 'up') moveForensicDetector(0, -step);
    if (button.dataset.move === 'down') moveForensicDetector(0, step);
  });
});

locateSourceBtn.addEventListener('click', () => {
  shieldStage.hidden = false;
  conclusionStage.hidden = false;
  shieldStage.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

shieldButtons.forEach(button => {
  button.addEventListener('click', () => {
    setShieldSelection(button.dataset.shield);
  });
});

testShieldBtn.addEventListener('click', () => {
  const data = shieldData[forensicState.selectedShield];
  forensicState.testedShields.add(forensicState.selectedShield);
  renderShieldRows();
  updateShieldTable(forensicState.selectedShield);
  shieldOutcome.textContent = `${data.cps} cps - ${data.note}`;
});

conclusionButtons.forEach(button => {
  button.addEventListener('click', () => {
    const guess = button.dataset.conclusion;
    conclusionButtons.forEach(other => {
      other.classList.toggle('is-active', other.dataset.conclusion === guess);
    });

    if (guess === 'beta') {
      conclusionFeedback.textContent = 'Conclusão compatível com radiação beta: a emissão atravessou o papel, mas foi fortemente reduzida pelo alumínio.';
      emitReportBtn.disabled = false;
      reportStage.hidden = false;
    } else if (guess === 'alpha') {
      conclusionFeedback.textContent = 'Não é alfa: o papel quase não reduziu a contagem e o alumínio teve efeito marcante.';
      emitReportBtn.disabled = true;
      reportStage.hidden = true;
    } else {
      conclusionFeedback.textContent = 'Não é gama: a queda forte com alumínio aponta para uma emissão menos penetrante.';
      emitReportBtn.disabled = true;
      reportStage.hidden = true;
    }
  });
});

emitReportBtn.addEventListener('click', () => {
  reportOutput.innerHTML = `
    <div class="report-card">
      <h4>LAUDO PERICIAL SIMULADO</h4>
      <p><strong>Caso:</strong> Caixa suspeita em área restrita</p>
      <p><strong>Instrumento:</strong> Contador Geiger simulado</p>
      <p><strong>Medições:</strong></p>
      <ul>
        <li>Sem blindagem: 3200 cps</li>
        <li>Papel: 3000 cps</li>
        <li>Alumínio: 180 cps</li>
        <li>Chumbo: 20 cps</li>
      </ul>
      <p><strong>Conclusão:</strong> A fonte analisada apresenta comportamento compatível com emissão beta. A radiação atravessou papel, mas foi fortemente atenuada por alumínio e praticamente eliminada por chumbo.</p>
      <p><strong>Relação com a ciência forense:</strong> Esse tipo de procedimento simula a triagem inicial feita em investigações com materiais radioativos, acidentes radiológicos, contaminação ambiental ou transporte ilícito de fontes radioativas.</p>
    </div>
  `;
});

setShieldSelection('none');
shieldTableBody.innerHTML = '';
document.querySelector('.forensic-table').before(shieldOutcome);
shieldOutcome.textContent = 'Escolha uma blindagem para registrar a medi\u00e7\u00e3o.';
updateForensicReadout();
