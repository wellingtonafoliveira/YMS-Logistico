const AREA_NAMES = [
  'Linha 5','Linha 6','Avarias','Expedição | EMB',
  'Gestão de Estoque','Almoxarifado','Abastecimento','PD'
];

const state = {
  data: '2026-04-21',
  turno: 'T1',
  quadro: { operador: 0, conferente: 0, exclusiva: 0 },
  ferias: { operador: 0, conferente: 0, exclusiva: 0 },
  ausencias: { operador: 0, conferente: 0, exclusiva: 0 },
  banco: { operador: 0, conferente: 0, exclusiva: 0 },
  observacoes: '',
  responsavel: '',
  recebidoPor: '',
  horario: '',
  areas: {},
  kpis: {
    programadoTons: 103.9,
    programadoCarros: 5,
    realizadoTons: 0,
    realizadoCarros: 0,
    viraTons: 0,
    viraCarros: 0,
    atrasadoTons: 0,
    atrasadoCarros: 0
  },
  status: 'idle',
  lastSaved: ''
};

AREA_NAMES.forEach(name => {
  state.areas[name] = { mo: 0, horas: 0 };
});

function formatNumberBR(value){
  return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
function turnoDescricao(turno){
  if(turno === 'T1') return '06h00 às 14h00';
  if(turno === 'T2') return '14h00 às 22h00';
  if(turno === 'T3') return '22h00 às 06h00';
  return '';
}
function nowBR(){
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2,'0');
  const mi = String(d.getMinutes()).padStart(2,'0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}
function safeNum(v){
  return Math.max(0, Number(v || 0));
}
function updateTotals(){
  const total = safeNum(state.quadro.operador) + safeNum(state.quadro.conferente) + safeNum(state.quadro.exclusiva);
  document.getElementById('quadroTotal').textContent = total;
}
function setStatus(kind){
  state.status = kind;
  const bar = document.getElementById('lancStatusBar');
  const text = document.getElementById('lancStatusText');
  const detail = document.getElementById('lancStatusDetail');
  bar.classList.remove('saved','pending');
  if(kind === 'saved'){
    bar.classList.add('saved');
    text.textContent = '✓ Lançamento salvo com sucesso';
    detail.textContent = `salvo em ${state.lastSaved}`;
  } else {
    bar.classList.add('pending');
    text.textContent = '• Alterações pendentes';
    detail.textContent = state.lastSaved ? `houve alterações após ${state.lastSaved}` : 'Preencha e salve o lançamento do turno';
  }
}
function renderAreaInputs(){
  const html = AREA_NAMES.map(name => `
    <div class="area-box">
      <h4>${name}</h4>
      <div class="input-group">
        <label>M/O</label>
        <input type="number" min="0" data-area="${name}" data-field="mo" value="${state.areas[name].mo}" />
      </div>
      <div class="input-group">
        <label>Horas</label>
        <input type="number" min="0" data-area="${name}" data-field="horas" value="${state.areas[name].horas}" />
      </div>
    </div>
  `).join('');
  document.getElementById('areasGrid').innerHTML = html;
  document.getElementById('indicatorAreasGrid').innerHTML = AREA_NAMES.map(name => `
    <div class="area-box">
      <h4>${name}</h4>
      <div class="input-group">
        <label>M/O</label>
        <div class="summary-value">${state.areas[name].mo}</div>
      </div>
      <div class="input-group">
        <label>Horas</label>
        <div class="summary-value">${state.areas[name].horas}</div>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('[data-area]').forEach(input => {
    input.addEventListener('input', () => {
      const area = input.dataset.area;
      const field = input.dataset.field;
      state.areas[area][field] = safeNum(input.value);
      setStatus('pending');
      renderIndicators();
    });
  });
}
function buildMiniBars(targetId, values){
  const max = Math.max(1, ...values);
  const classes = ['bar-cyan','bar-blue','bar-orange'];
  document.getElementById(targetId).innerHTML = values.map((v, i) => {
    const height = Math.max(12, Math.round((v / max) * 72));
    return `<div class="mini-bar ${classes[i]}" style="height:${height}px"></div>`;
  }).join('');
}
function renderIndicators(){
  const totalQuadro = safeNum(state.quadro.operador) + safeNum(state.quadro.conferente) + safeNum(state.quadro.exclusiva);

  document.getElementById('indData').textContent = state.data.split('-').reverse().join('/');
  document.getElementById('indTurno').textContent = state.turno;
  document.getElementById('indTurnoDesc').textContent = turnoDescricao(state.turno);

  document.getElementById('indProgramadoTons').textContent = formatNumberBR(state.kpis.programadoTons);
  document.getElementById('indProgramadoCarros').textContent = state.kpis.programadoCarros;
  document.getElementById('indRealizadoTons').textContent = formatNumberBR(state.kpis.realizadoTons);
  document.getElementById('indRealizadoCarros').textContent = state.kpis.realizadoCarros;
  document.getElementById('indViraTons').textContent = formatNumberBR(state.kpis.viraTons);
  document.getElementById('indViraCarros').textContent = state.kpis.viraCarros;
  document.getElementById('indAtrasadoTons').textContent = formatNumberBR(state.kpis.atrasadoTons);
  document.getElementById('indAtrasadoCarros').textContent = state.kpis.atrasadoCarros;

  document.getElementById('indQuadroOperador').textContent = state.quadro.operador;
  document.getElementById('indQuadroConferente').textContent = state.quadro.conferente;
  document.getElementById('indQuadroExclusiva').textContent = state.quadro.exclusiva;
  document.getElementById('indQuadroTotal').textContent = totalQuadro;
  document.getElementById('indQuadroTotalDonut').textContent = totalQuadro;

  document.getElementById('indFeriasOperador').textContent = state.ferias.operador;
  document.getElementById('indFeriasConferente').textContent = state.ferias.conferente;
  document.getElementById('indFeriasExclusiva').textContent = state.ferias.exclusiva;

  document.getElementById('indAusenciasOperador').textContent = state.ausencias.operador;
  document.getElementById('indAusenciasConferente').textContent = state.ausencias.conferente;
  document.getElementById('indAusenciasExclusiva').textContent = state.ausencias.exclusiva;

  document.getElementById('indBancoOperador').textContent = state.banco.operador;
  document.getElementById('indBancoConferente').textContent = state.banco.conferente;
  document.getElementById('indBancoExclusiva').textContent = state.banco.exclusiva;

  document.getElementById('indObsTexto').textContent = state.observacoes || 'Sem observações lançadas.';
  document.getElementById('indRespTurno').textContent = state.responsavel || '-';
  document.getElementById('indRecebidoPor').textContent = state.recebidoPor || '-';
  document.getElementById('indHoraPassagem').textContent = state.horario || '-';

  buildMiniBars('barsFerias', [state.ferias.operador, state.ferias.conferente, state.ferias.exclusiva]);
  buildMiniBars('barsAusencias', [state.ausencias.operador, state.ausencias.conferente, state.ausencias.exclusiva]);
  buildMiniBars('barsBanco', [state.banco.operador, state.banco.conferente, state.banco.exclusiva]);

  document.getElementById('emailAssunto').textContent = `Passagem de turno • Expedição • ${state.data.split('-').reverse().join('/')} (${state.turno})`;
  document.getElementById('emailPreviewTurno').textContent = state.turno;
  document.getElementById('emailPreviewQuadro').textContent = totalQuadro;
  document.getElementById('emailProgramado').textContent = formatNumberBR(state.kpis.programadoTons);
  document.getElementById('emailRealizado').textContent = formatNumberBR(state.kpis.realizadoTons);
  document.getElementById('emailVira').textContent = formatNumberBR(state.kpis.viraTons);
  document.getElementById('emailAtrasado').textContent = formatNumberBR(state.kpis.atrasadoTons);

  renderAreaInputs();
}
function syncLaunchFields(){
  document.getElementById('lancData').value = state.data;
  document.getElementById('lancTurno').value = state.turno;
  document.getElementById('lancTurnoDesc').textContent = turnoDescricao(state.turno);

  document.getElementById('lancProgramadoTons').textContent = formatNumberBR(state.kpis.programadoTons);
  document.getElementById('lancProgramadoCarros').textContent = state.kpis.programadoCarros;
  document.getElementById('lancRealizadoTons').textContent = formatNumberBR(state.kpis.realizadoTons);
  document.getElementById('lancRealizadoCarros').textContent = state.kpis.realizadoCarros;
  document.getElementById('lancViraTons').textContent = formatNumberBR(state.kpis.viraTons);
  document.getElementById('lancViraCarros').textContent = state.kpis.viraCarros;
  document.getElementById('lancAtrasadoTons').textContent = formatNumberBR(state.kpis.atrasadoTons);
  document.getElementById('lancAtrasadoCarros').textContent = state.kpis.atrasadoCarros;

  document.getElementById('quadroOperador').value = state.quadro.operador;
  document.getElementById('quadroConferente').value = state.quadro.conferente;
  document.getElementById('quadroExclusiva').value = state.quadro.exclusiva;

  document.getElementById('feriasOperador').value = state.ferias.operador;
  document.getElementById('feriasConferente').value = state.ferias.conferente;
  document.getElementById('feriasExclusiva').value = state.ferias.exclusiva;

  document.getElementById('ausenciasOperador').value = state.ausencias.operador;
  document.getElementById('ausenciasConferente').value = state.ausencias.conferente;
  document.getElementById('ausenciasExclusiva').value = state.ausencias.exclusiva;

  document.getElementById('bancoOperador').value = state.banco.operador;
  document.getElementById('bancoConferente').value = state.banco.conferente;
  document.getElementById('bancoExclusiva').value = state.banco.exclusiva;

  document.getElementById('obsTexto').value = state.observacoes;
  document.getElementById('respTurno').value = state.responsavel;
  document.getElementById('recebidoPor').value = state.recebidoPor;
  document.getElementById('horaPassagem').value = state.horario;

  updateTotals();
}
function saveState(){
  state.lastSaved = nowBR();
  localStorage.setItem('passagem-turno-final', JSON.stringify(state));
  setStatus('saved');
  renderIndicators();
}
function loadState(){
  const saved = localStorage.getItem('passagem-turno-final');
  if(!saved) return;
  try{
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
    state.areas = { ...state.areas, ...parsed.areas };
  }catch(e){}
}
function connectField(id, pathA, pathB = null){
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    if(pathB){
      state[pathA][pathB] = el.type === 'number' ? safeNum(el.value) : el.value;
    } else {
      state[pathA] = el.type === 'number' ? safeNum(el.value) : el.value;
    }
    if(id === 'lancTurno') document.getElementById('lancTurnoDesc').textContent = turnoDescricao(el.value);
    if(id.startsWith('quadro')) updateTotals();
    setStatus('pending');
    renderIndicators();
  });
  el.addEventListener('change', () => {
    if(pathB){
      state[pathA][pathB] = el.type === 'number' ? safeNum(el.value) : el.value;
    } else {
      state[pathA] = el.type === 'number' ? safeNum(el.value) : el.value;
    }
    if(id === 'lancTurno') document.getElementById('lancTurnoDesc').textContent = turnoDescricao(el.value);
    if(id.startsWith('quadro')) updateTotals();
    setStatus('pending');
    renderIndicators();
  });
}
function showView(viewId){
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(v => v.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  document.querySelector(`.nav-item[data-view="${viewId}"]`)?.classList.add('active');
}
function init(){
  loadState();
  renderAreaInputs();
  syncLaunchFields();
  renderIndicators();
  setStatus(state.lastSaved ? 'saved' : 'pending');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => showView(btn.dataset.view));
  });

  document.getElementById('btnIrIndicadores').addEventListener('click', () => showView('indicadoresView'));
  document.getElementById('btnVoltarLancamento').addEventListener('click', () => showView('lancamentoView'));
  document.getElementById('btnSalvarLancamento').addEventListener('click', saveState);
  document.getElementById('btnSalvarIndicadores').addEventListener('click', saveState);
  document.getElementById('btnAtualizarLancamento').addEventListener('click', () => { syncLaunchFields(); renderIndicators(); });
  document.getElementById('btnFecharEnviar').addEventListener('click', () => {
    saveState();
    alert('Fluxo pronto para envio: nesta versão final o indicador já está separado da página de lançamento.');
  });

  connectField('lancData', 'data');
  connectField('lancTurno', 'turno');
  connectField('quadroOperador', 'quadro', 'operador');
  connectField('quadroConferente', 'quadro', 'conferente');
  connectField('quadroExclusiva', 'quadro', 'exclusiva');

  connectField('feriasOperador', 'ferias', 'operador');
  connectField('feriasConferente', 'ferias', 'conferente');
  connectField('feriasExclusiva', 'ferias', 'exclusiva');

  connectField('ausenciasOperador', 'ausencias', 'operador');
  connectField('ausenciasConferente', 'ausencias', 'conferente');
  connectField('ausenciasExclusiva', 'ausencias', 'exclusiva');

  connectField('bancoOperador', 'banco', 'operador');
  connectField('bancoConferente', 'banco', 'conferente');
  connectField('bancoExclusiva', 'banco', 'exclusiva');

  connectField('obsTexto', 'observacoes');
  connectField('respTurno', 'responsavel');
  connectField('recebidoPor', 'recebidoPor');
  connectField('horaPassagem', 'horario');
}
document.addEventListener('DOMContentLoaded', init);
