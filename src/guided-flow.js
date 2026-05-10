import { appState } from './state.js';
import {
  byId,
  openStep,
  setElementBusy,
  setOutputValue,
  showOutputError,
  truncateHex,
} from './ui.js';

export async function generateKeys() {
  setElementBusy('btn-keygen', 'sp-keygen', true);

  try {
    appState.recipientKeys = appState.sdk.generateSpecterKeys();

    setOutputValue('spending-pk', truncateHex(appState.recipientKeys.spending.publicKey), 'accent');
    setOutputValue('viewing-pk', truncateHex(appState.recipientKeys.viewing.publicKey), 'accent');
    byId('spending-pk').dataset.full = appState.recipientKeys.spending.publicKey;
    byId('viewing-pk').dataset.full = appState.recipientKeys.viewing.publicKey;

    byId('fn-keygen').classList.add('done');
    byId('step-1').classList.add('done');
    byId('btn-meta').disabled = false;
    setTimeout(() => openStep(2), 300);
  } catch (error) {
    showOutputError('spending-pk', error.message);
  } finally {
    setElementBusy('btn-keygen', 'sp-keygen', false);
  }
}

export async function buildMetaAddress() {
  if (!appState.recipientKeys) return;

  setElementBusy('btn-meta', 'sp-meta', true);

  try {
    const meta = appState.sdk.metaAddressFromPublicKeys(
      appState.recipientKeys.spending.publicKey,
      appState.recipientKeys.viewing.publicKey,
      { description: 'Playground recipient' },
    );

    appState.metaHex = meta.hex;
    setOutputValue('meta-hex', truncateHex(meta.hex, 80));
    byId('meta-hex').dataset.full = meta.hex;
    setOutputValue('meta-size', `${meta.bytes.length} bytes`, 'accent');
    byId('meta-input').value = meta.hex;

    byId('fn-meta').classList.add('done');
    byId('step-2').classList.add('done');
    setTimeout(() => openStep(3), 300);
  } catch (error) {
    showOutputError('meta-hex', error.message);
  } finally {
    setElementBusy('btn-meta', 'sp-meta', false);
  }
}

export async function createPayment() {
  setElementBusy('btn-payment', 'sp-payment', true);

  try {
    const inputHex = byId('meta-input').value.trim() || appState.metaHex;
    if (!inputHex) {
      throw new Error('No meta-address. Run steps 1 & 2 first, or paste a hex.');
    }

    appState.paymentResult = appState.sdk.createStealthPayment(inputHex);

    setOutputValue('eph-ct', truncateHex(appState.paymentResult.ephemeralCiphertext, 80));
    byId('eph-ct').dataset.full = appState.paymentResult.ephemeralCiphertext;
    setOutputValue('view-tag', String(appState.paymentResult.viewTag), 'amber');
    setOutputValue('eth-addr', appState.paymentResult.ethAddress, 'blue');
    setOutputValue('sui-addr', appState.paymentResult.suiAddress, 'blue');
    byId('scan-ct-input').value = appState.paymentResult.ephemeralCiphertext;
    byId('scan-vt-input').value = appState.paymentResult.viewTag;

    byId('fn-payment').classList.add('done');
    byId('step-3').classList.add('done');
    setTimeout(() => openStep(4), 300);
  } catch (error) {
    showOutputError('eph-ct', error.message);
  } finally {
    setElementBusy('btn-payment', 'sp-payment', false);
  }
}

export async function scanAnnouncement() {
  setElementBusy('btn-scan', 'sp-scan', true);

  const resultContainer = byId('scan-result');
  const banner = byId('scan-match-banner');
  const keysGrid = byId('scan-keys-grid');

  resultContainer.classList.remove('visible');
  banner.innerHTML = '';
  keysGrid.style.display = 'none';

  try {
    if (!appState.recipientKeys) {
      throw new Error('No recipient keys. Run step 1 first.');
    }

    const ciphertext = byId('scan-ct-input').value.trim();
    const viewTag = byId('scan-vt-input').value.trim();

    if (!ciphertext || viewTag === '') {
      throw new Error('Fill in ephemeralCiphertext and viewTag.');
    }

    const result = appState.sdk.scanAnnouncement(
      { ephemeralCiphertext: ciphertext, viewTag: Number(viewTag) },
      appState.recipientKeys.viewing,
      appState.recipientKeys.spending.publicKey,
    );

    resultContainer.classList.add('visible');
    if (result.isMatch) {
      banner.innerHTML = '<div class="result-banner success"><span>✓</span><div><strong>Match found.</strong> Stealth keys derived.</div></div>';
      setOutputValue('scan-eth', result.stealthKeys.ethAddress, 'blue');
      setOutputValue('scan-sui', result.stealthKeys.suiAddress, 'blue');
      byId('scan-eth').dataset.full = result.stealthKeys.ethAddress;
      byId('scan-sui').dataset.full = result.stealthKeys.suiAddress;
      keysGrid.style.display = 'grid';
      byId('fn-scan').classList.add('done');
      byId('step-4').classList.add('done');
    } else {
      banner.innerHTML = `<div class="result-banner info"><span>◌</span><div>No match — reason: <strong>${escapeHtml(result.reason)}</strong></div></div>`;
    }
  } catch (error) {
    resultContainer.classList.add('visible');
    banner.innerHTML = `<div class="result-banner error">✕ ${escapeHtml(error.message)}</div>`;
  } finally {
    setElementBusy('btn-scan', 'sp-scan', false);
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
