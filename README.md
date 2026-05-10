# SPECTER SDK Playground

Interactive SDK playground for SPECTER, explore post-quantum stealth addresses, ML-KEM-768 key operations, and stealth payment flows entirely in your browser.  

## Aim

The SPECTER SDK Playground is an interactive browser demo for exploring post-quantum stealth address flows with [<u>`@specterpq/sdk`</u>](https://www.npmjs.com/package/@specterpq/sdk).

It runs the SDK directly in the browser through WebAssembly, so key generation, meta-address creation, stealth payment creation, and announcement scanning happen locally. Secret keys do not leave the browser.

## Run Locally

This playground is a static ES module site. It does not require npm install, a bundler, or a build step.

From the repository root:

```sh
cd specter-pq/playground
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
```

Avoid opening `index.html` directly with `file://`. Browser ES modules, CDN imports, and the SDK's WASM loading path work more reliably when served over HTTP.

## What You Can Use It For

- Generate SPECTER recipient spending and viewing keys.
- Build a publishable meta-address from recipient public keys.
- Create stealth payments from a recipient meta-address.
- Scan announcements with recipient viewing keys.
- Compare derived ETH and Sui stealth addresses.
- Run editable SDK examples in the in-browser code editor.
- Experiment with lower-level SDK operations like KEM encapsulation, decapsulation, view-tag computation, and stealth key derivation.
