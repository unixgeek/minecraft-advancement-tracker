# Advancement Tracker [![Netlify Status](https://api.netlify.com/api/v1/badges/7dc58d28-0d75-44c2-ad74-109ff9b7fdc6/deploy-status)](https://app.netlify.com/sites/affectionate-newton-5bce0e/deploys)
Simple tool to track progress on advancements in Minecraft: Java Edition. The best feature is being able to see what 
criterion have not been met for advancements that have multiple, like exploring all biomes - you cannot see what biomes 
have not been explored, in game.

## Requirements
* [Rust](https://www.rust-lang.org)
* [wasm-pack](https://crates.io/crates/wasm-pack)
* [Node.js](https://nodejs.org/en/)
## Release

    npm install
    npm run build
Artifacts will be located in `dist`.

## Development
Modify `crate/Cargo.toml` to enable `console_error_panic_hook`.

    npm install
    npm start

### Netlify Build
[Netlify build](https://github.com/netlify/build-image) can be tested with one of the official Docker builds, currently focal.
Artifacts will be located in `/opt/buildhome/repo/dist`

    docker pull netlify/build:focal
    cd ../
    git clone https://github.com/netlify/build-image.git
    cd build-image
    ./test-tools/start-image.sh ../minecraft-advancement-tracker

## Updating Advancement Master File
Follow these steps to update the master advancement file after a new Minecraft release.
1. Create a new creative world.
2. Grant all advancements.

       advancement grant @s everything
3. Create `advancements_master.json`

       cd crate
       # File name is based on player UUID, so use whatever file is there.
       cargo run --bin filter-advancements ~/.minecraft/saves/Tracker/advancements/{YOUR_UUID}.json ../advancements_master.json 
4. Update `DATA_VERSION` in `crate/src/lib.rs` with the value provided in the output of the previous step.

