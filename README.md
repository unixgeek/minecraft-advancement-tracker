# Advancement Tracker
Simple tool to track progress on advancements in Minecraft: Java Edition. The best feature is being able to see what 
criterion have not been met for advancements that have multiple, like exploring all biomes - you cannot see what biomes 
have not been explored, in game.

## Updating Advancement Master File
Follow these steps to update the master file after an update.
1. Create a new creative world.
2. Grant all advancements.

       advancement @s grant everything
3. Copy the .json file located in the `advancements` directory of the new world to `advancements_master.json`.
4. Update `DATA_VERSION` in `lib.rs` with the value of `DataVersion` in `advancements_master.json`.

