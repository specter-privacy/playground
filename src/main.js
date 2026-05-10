import { copyEditorCode, clearConsole, loadSnippet, runCode, wireEditorKeyboard } from './editor.js';
import { buildMetaAddress, createPayment, generateKeys, runBatchScan, scanAnnouncement } from './guided-flow.js';
import { loadSpecterSdk } from './sdk-loader.js';
import { setSdkModule } from './state.js';
import { byId, markSdkReady, setInitError, switchTab, toggleStep, copyField, wireUiControls } from './ui.js';

const handlers = {
  generateKeys,
  buildMetaAddress,
  createPayment,
  scanAnnouncement,
  runBatchScan,
  loadSnippet,
  copyEditorCode,
  runCode,
  clearConsole,
};

installTemporaryGlobals();
wireUiControls(handlers);
wireEditorKeyboard();
bootstrap();

async function bootstrap() {
  let sdk;

  try {
    sdk = await loadSpecterSdk();
  } catch (error) {
    setInitError('Failed to load SDK', error);
    return;
  }

  setSdkModule(sdk);
  installRealGlobals();

  try {
    await sdk.initSpecterSdk();
    markSdkReady();

    byId('btn-keygen').disabled = false;
    byId('btn-payment').disabled = false;
    byId('btn-scan').disabled = false;
    byId('btn-batch-scan').disabled = false;
    loadSnippet('full-flow');
  } catch (error) {
    setInitError('WASM init failed', error);
  }
}

function installTemporaryGlobals() {
  window.switchTab = switchTab;
  window.toggleStep = toggleStep;
  window.copyField = copyField;
  window.loadSnippet = () => {};
  window.copyEditorCode = () => {};
  window.runCode = () => {};
  window.clearConsole = () => {};
}

function installRealGlobals() {
  Object.assign(window, {
    switchTab,
    toggleStep,
    copyField,
    loadSnippet,
    copyEditorCode,
    runCode,
    clearConsole,
    doGenerateKeys: generateKeys,
    doBuildMeta: buildMetaAddress,
    doCreatePayment: createPayment,
    doScanAnnouncement: scanAnnouncement,
    runBatchScan,
  });
}
