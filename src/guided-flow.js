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
  let activeTamper = { flipCiphertext: false, forceZeroViewTag: false };

  resultContainer.classList.remove('visible');
  banner.innerHTML = '';
  keysGrid.style.display = 'none';

  try {
    if (!appState.recipientKeys) {
      throw new Error('No recipient keys. Run step 1 first.');
    }

    const sourceCiphertext = byId('scan-ct-input').value.trim();
    const sourceViewTag = byId('scan-vt-input').value.trim();
    activeTamper = getTamperOptions();
    const ciphertext = activeTamper.flipCiphertext ? flipLastByte(sourceCiphertext) : sourceCiphertext;
    const viewTag = activeTamper.forceZeroViewTag ? 0 : Number(sourceViewTag);

    if (!sourceCiphertext || sourceViewTag === '') {
      throw new Error('Fill in ephemeralCiphertext and viewTag.');
    }

    const result = appState.sdk.scanAnnouncement(
      { ephemeralCiphertext: ciphertext, viewTag },
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
      banner.innerHTML = renderNoMatchResult(result, activeTamper);
    }
  } catch (error) {
    resultContainer.classList.add('visible');
    banner.innerHTML = renderScanError(error, activeTamper);
  } finally {
    setElementBusy('btn-scan', 'sp-scan', false);
  }
}

export async function runBatchScan() {
  setElementBusy('btn-batch-scan', 'sp-batch', true);

  const resultContainer = byId('batch-result');
  resultContainer.innerHTML = '';

  try {
    if (!appState.recipientKeys) {
      throw new Error('No recipient keys. Run step 1 first.');
    }

    const count = Number(byId('batch-count').value);
    const includeMatch = byId('batch-include-match').checked;
    if (includeMatch && !appState.paymentResult) {
      throw new Error('Run step 3 first, or turn off "Include 1 genuine match".');
    }

    const genuineIndex = Math.floor(count / 2);
    const announcements = [];

    for (let index = 0; index < count; index += 1) {
      if (includeMatch && appState.paymentResult && index === genuineIndex) {
        announcements.push({
          ephemeralCiphertext: appState.paymentResult.ephemeralCiphertext,
          viewTag: appState.paymentResult.viewTag,
        });
        continue;
      }

      announcements.push(createDecoyAnnouncement());
    }

    const startedAt = performance.now();
    const results = appState.sdk.scanAnnouncements(
      announcements,
      appState.recipientKeys.viewing,
      appState.recipientKeys.spending.publicKey,
    );
    const elapsed = performance.now() - startedAt;
    const matches = results.filter((result) => result.isMatch).length;

    resultContainer.innerHTML = renderBatchResults(results, matches, elapsed);
  } catch (error) {
    resultContainer.innerHTML = `<div class="result-banner error">✕ ${escapeHtml(error.message)}</div>`;
  } finally {
    setElementBusy('btn-batch-scan', 'sp-batch', false);
  }
}

function createDecoyAnnouncement() {
  const decoyKeys = appState.sdk.generateSpecterKeys();
  const decoyMeta = appState.sdk.metaAddressFromPublicKeys(
    decoyKeys.spending.publicKey,
    decoyKeys.viewing.publicKey,
    { description: 'Batch scan decoy' },
  );
  const decoyPayment = appState.sdk.createStealthPayment(decoyMeta.hex);

  return {
    ephemeralCiphertext: decoyPayment.ephemeralCiphertext,
    viewTag: decoyPayment.viewTag,
  };
}

function getTamperOptions() {
  return {
    flipCiphertext: byId('tamper-flip-ct')?.checked ?? false,
    forceZeroViewTag: byId('tamper-zero-tag')?.checked ?? false,
  };
}

function flipLastByte(hex) {
  const value = String(hex || '').trim();
  const prefix = value.startsWith('0x') ? '0x' : '';
  const body = prefix ? value.slice(2) : value;

  if (body.length < 2) return value;

  const lastByte = parseInt(body.slice(-2), 16);
  const flippedByte = Number.isNaN(lastByte) ? '00' : (lastByte ^ 0xff).toString(16).padStart(2, '0');

  return `${prefix}${body.slice(0, -2)}${flippedByte}`;
}

function renderNoMatchResult(result, tamper) {
  const details = [];
  const playgroundReason = getTamperReason(tamper);

  if (playgroundReason) details.push(`<div>Tamper detected: <strong>${escapeHtml(playgroundReason)}</strong></div>`);
  if (result.reason) details.push(`<div>SDK rejection reason: <strong>${escapeHtml(result.reason)}</strong></div>`);
  if (result.expectedTag !== undefined) details.push(`<div>Expected tag: <strong>${formatTag(result.expectedTag)}</strong></div>`);
  if (result.derivedTag !== undefined) details.push(`<div>Derived tag: <strong>${formatTag(result.derivedTag)}</strong></div>`);

  const tamperDetected = tamper.flipCiphertext || tamper.forceZeroViewTag;
  const explanation = tamperDetected
    ? 'This is correct behavior. SPECTER successfully detected tampering and rejected the announcement.'
    : 'This announcement does not match the current recipient keys.';

  return `
    <div class="tamper-result error">
      <div class="tamper-result-title">✕ NO MATCH — ANNOUNCEMENT REJECTED</div>
      <div class="tamper-result-details">${details.join('') || '<div>No additional rejection details returned by the SDK.</div>'}</div>
      <p>${explanation}</p>
    </div>
  `;
}

function renderScanError(error, tamper) {
  const tamperDetected = tamper.flipCiphertext || tamper.forceZeroViewTag;
  const playgroundReason = getTamperReason(tamper);

  if (tamperDetected) {
    return `
      <div class="tamper-result error">
        <div class="tamper-result-title">✕ NO MATCH — TAMPER DETECTED</div>
        <div class="tamper-result-details">
          <div>Tamper detected: <strong>${escapeHtml(playgroundReason)}</strong></div>
          <div>SDK rejection reason: <strong>${escapeHtml(error.message)}</strong></div>
          <div>Expected tag: <strong>not returned</strong></div>
          <div>Derived tag: <strong>not returned</strong></div>
        </div>
        <p>This is correct behavior. SPECTER rejected the modified announcement before accepting it as a match.</p>
      </div>
    `;
  }

  return `
    <div class="tamper-result error">
      <div class="tamper-result-title">✕ SCAN FAILED</div>
      <div class="tamper-result-details"><div>${escapeHtml(error.message)}</div></div>
    </div>
  `;
}

function getTamperReason(tamper) {
  if (tamper.flipCiphertext && tamper.forceZeroViewTag) {
    return 'ciphertext_tampered + view_tag_forced_to_0x00';
  }

  if (tamper.flipCiphertext) {
    return 'ciphertext_tampered';
  }

  if (tamper.forceZeroViewTag) {
    return 'view_tag_forced_to_0x00';
  }

  return '';
}

function renderBatchResults(results, matches, elapsed) {
  const cells = results.map((result, index) => {
    const className = result.isMatch ? 'match' : 'reject';
    const title = result.isMatch ? 'MATCH' : (result.reason || 'NO MATCH');
    return `<span class="batch-cell ${className}" title="#${index + 1} ${escapeHtml(title)}"></span>`;
  }).join('');

  return `
    <div class="batch-summary">
      Scanned <strong>${results.length}</strong> announcements ·
      <strong class="accent-text">${matches}</strong> match${matches === 1 ? '' : 'es'} ·
      ${elapsed.toFixed(2)}ms
    </div>
    <div class="batch-grid">${cells}</div>
  `;
}

function formatTag(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return escapeHtml(value);

  return `0x${number.toString(16).padStart(2, '0')}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
