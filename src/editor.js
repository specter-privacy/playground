import { SNIPPETS } from './snippets.js';
import { appState } from './state.js';
import { byId } from './ui.js';

export function loadSnippet(key) {
  const editor = byId('code-editor');
  if (editor && SNIPPETS[key] !== undefined) {
    editor.value = SNIPPETS[key];
  }
}

export function copyEditorCode() {
  const editor = byId('code-editor');
  if (!editor) return;

  navigator.clipboard.writeText(editor.value).catch(() => {});
}

export function clearConsole() {
  byId('console-body').innerHTML = '<span class="console-empty">Output will appear here after running your code…</span>';
  setConsoleDot('idle');
  byId('exec-time').textContent = '';
}

export async function runCode() {
  const code = byId('code-editor').value.trim();
  if (!code) return;

  byId('run-spinner').style.display = 'inline-block';
  setConsoleDot('running');

  const body = byId('console-body');
  body.querySelector('.console-empty')?.remove();
  if (body.children.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'console-separator';
    body.appendChild(separator);
  }

  appendConsole('Running…', 'system');

  const fakeConsole = {
    log: (...args) => appendConsole(args.map(stringify).join(' '), 'log'),
    info: (...args) => appendConsole(args.map(stringify).join(' '), 'info'),
    warn: (...args) => appendConsole(args.map(stringify).join(' '), 'warn'),
    error: (...args) => appendConsole(args.map(stringify).join(' '), 'err'),
  };

  const startTime = performance.now();
  let success = true;

  try {
    const argNames = Object.keys(appState.sdkGlobals);
    const argValues = Object.values(appState.sdkGlobals);
    const runner = new Function(
      'console',
      argNames.join(','),
      `"use strict"; return (async () => { ${code} })();`,
    );
    const result = await runner.apply(null, [fakeConsole].concat(argValues));
    if (result !== undefined) appendConsole(stringify(result), 'result');
  } catch (error) {
    appendConsole(error?.message || String(error), 'err');
    success = false;
  }

  const elapsed = (performance.now() - startTime).toFixed(1);
  appendConsole(`Done in ${elapsed}ms`, 'system');
  byId('exec-time').textContent = `${elapsed}ms`;
  byId('run-spinner').style.display = 'none';
  setConsoleDot(success ? 'success' : 'error');
  body.scrollTop = body.scrollHeight;
}

export function wireEditorKeyboard() {
  byId('code-editor')?.addEventListener('keydown', function onEditorKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      runCode();
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const selectionStart = this.selectionStart;
      this.value = `${this.value.slice(0, selectionStart)}  ${this.value.slice(this.selectionEnd)}`;
      this.selectionStart = this.selectionEnd = selectionStart + 2;
    }
  });
}

function appendConsole(message, type = 'log') {
  const body = byId('console-body');
  body.querySelector('.console-empty')?.remove();

  const prefixMap = { log: '>', info: 'i', warn: '!', err: 'x', result: '<', system: '·' };
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.innerHTML = `<span class="prefix">${prefixMap[type] || '>'}</span><span class="msg">${escapeHtml(message)}</span>`;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function setConsoleDot(state) {
  const dot = byId('console-dot');
  dot.className = `console-dot${state !== 'idle' ? ` ${state}` : ''}`;
}

function stringify(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
}
