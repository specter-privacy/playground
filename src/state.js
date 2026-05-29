export const appState = {
  sdk: null,
  sdkGlobals: {},
  recipientKeys: null,
  metaHex: null,
  paymentResult: null,
};

export function setSdkModule(sdk) {
  appState.sdk = sdk;
  appState.sdkGlobals = {
    initSpecterSdk: sdk.initSpecterSdk,
    generateSpecterKeys: sdk.generateSpecterKeys,
    generateKeysLocal: sdk.generateKeysLocal,
    metaAddressFromPublicKeys: sdk.metaAddressFromPublicKeys,
    parseMetaAddress: sdk.parseMetaAddress,
    encapsulate: sdk.encapsulate,
    decapsulate: sdk.decapsulate,
    computeViewTag: sdk.computeViewTag,
    verifyViewTag: sdk.verifyViewTag,
    deriveStealthAddress: sdk.deriveStealthAddress,
    deriveStealthSuiAddress: sdk.deriveStealthSuiAddress,
    deriveStealthKeys: sdk.deriveStealthKeys,
    createStealthPayment: sdk.createStealthPayment,
    scanAnnouncement: sdk.scanAnnouncement,
    scanAnnouncements: sdk.scanAnnouncements,
    createSpecterApiClient: sdk.createSpecterApiClient,
    specterKeysViewingPk: sdk.specterKeysViewingPk,
    KYBER_PUBLIC_KEY_SIZE: sdk.KYBER_PUBLIC_KEY_SIZE,
    KYBER_SECRET_KEY_SIZE: sdk.KYBER_SECRET_KEY_SIZE,
    KYBER_CIPHERTEXT_SIZE: sdk.KYBER_CIPHERTEXT_SIZE,
    KYBER_SHARED_SECRET_SIZE: sdk.KYBER_SHARED_SECRET_SIZE,
    META_ADDRESS_SIZE: sdk.META_ADDRESS_SIZE,
    VIEW_TAG_SIZE: sdk.VIEW_TAG_SIZE,
    ETH_ADDRESS_SIZE: sdk.ETH_ADDRESS_SIZE,
    SUI_ADDRESS_SIZE: sdk.SUI_ADDRESS_SIZE,
    STEALTH_ETH_PRIVATE_KEY_SIZE: sdk.STEALTH_ETH_PRIVATE_KEY_SIZE,
    STEALTH_SECP256K1_PUBLIC_SIZE: sdk.STEALTH_SECP256K1_PUBLIC_SIZE,
    PROTOCOL_VERSION: sdk.PROTOCOL_VERSION,
  };

  Object.assign(window, appState.sdkGlobals);
}
