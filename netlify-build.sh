#!/bin/sh -e
rustup toolchain install stable
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
npm run build
