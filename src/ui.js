export function byId(id) {
  return document.getElementById(id);
}

export function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((button) => button.classList.remove('active'));

  byId(`panel-${tab}`)?.classList.add('active');
  byId(`tab-${tab}`)?.classList.add('active');
}

export function toggleStep(stepNumber) {
  const step = byId(`step-${stepNumber}`);
  if (!step) return;

  if (step.classList.contains('active')) {
    step.classList.remove('active');
    return;
  }

  openStep(stepNumber);
}

export function openStep(stepNumber) {
  document.querySelectorAll('.step').forEach((step) => step.classList.remove('active'));
  byId(`step-${stepNumber}`)?.classList.add('active');
}

export function setOutputValue(id, text, className = '') {
  const element = byId(id);
  if (!element) return;

  element.textContent = text;
  element.className = `output-value${className ? ` ${className}` : ''}`;
}

export function truncateHex(hex, maxLength = 60) {
  if (!hex) return '';

  const value = String(hex);
  if (value.length <= maxLength) return value;

  return `${value.slice(0, maxLength)}…`;
}

export function showOutputError(targetId, message) {
  const element = byId(targetId);
  if (!element) return;

  element.textContent = `✕ ${message}`;
  element.className = 'output-value error-text';
}

export function setElementBusy(buttonId, spinnerId, busy) {
  const button = byId(buttonId);
  const spinner = byId(spinnerId);

  if (button) button.disabled = busy;
  if (spinner) spinner.style.display = busy ? 'inline-block' : 'none';
}

export function copyField(id) {
  const element = byId(id);
  if (!element) return;

  const value = element.dataset.full || element.textContent;
  if (value && value !== '—') {
    navigator.clipboard.writeText(value).catch(() => {});
  }
}

export function setInitError(prefix, error) {
  byId('init-status').textContent = `${prefix}: ${error.message}`;
  const badge = byId('init-badge');
  badge.textContent = 'ERROR';
  badge.classList.add('error');
}

export function markSdkReady() {
  byId('init-status').textContent = 'WASM module ready — all crypto runs locally';
  byId('init-badge').textContent = 'READY';
  byId('init-bar').classList.add('ready');
  document.querySelector('.init-icon').textContent = '◉';
  byId('fn-init').classList.add('done');
}

export function wireUiControls(handlers) {
  byId('tab-guided')?.addEventListener('click', () => switchTab('guided'));
  byId('tab-editor')?.addEventListener('click', () => switchTab('editor'));

  document.querySelectorAll('[data-step]').forEach((element) => {
    element.addEventListener('click', () => toggleStep(element.dataset.step));
  });

  document.querySelectorAll('[data-copy-field]').forEach((element) => {
    element.addEventListener('click', () => copyField(element.dataset.copyField));
  });

  byId('btn-keygen')?.addEventListener('click', handlers.generateKeys);
  byId('btn-meta')?.addEventListener('click', handlers.buildMetaAddress);
  byId('btn-payment')?.addEventListener('click', handlers.createPayment);
  byId('btn-scan')?.addEventListener('click', handlers.scanAnnouncement);
  byId('btn-batch-scan')?.addEventListener('click', handlers.runBatchScan);
  byId('batch-count')?.addEventListener('input', (event) => {
    byId('batch-count-value').textContent = event.target.value;
  });
  byId('snippet-select')?.addEventListener('change', (event) => handlers.loadSnippet(event.target.value));
  byId('copy-editor')?.addEventListener('click', handlers.copyEditorCode);
  byId('run-code')?.addEventListener('click', handlers.runCode);
  byId('clear-console')?.addEventListener('click', handlers.clearConsole);
}
