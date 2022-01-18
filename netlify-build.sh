#!/bin/sh -e
rustup toolchain install stable
rustup target add wasm32-unknown-unknown
cargo install wasm-pack 
npm run build
