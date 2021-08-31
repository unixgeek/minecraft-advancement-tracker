use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;

use serde_json::{Map, Value};

use serde::{Deserialize, Serialize};
use web_sys::console::warn_1;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// todo Use advancement json files in minecraft jar?

// todo serde-wasm-bindgen
#[derive(Deserialize, Serialize)]
pub struct Advancement {
    name: String,
    criteria: HashSet<String>,
    done: bool,
}

static ADVANCEMENT_NAMESPACE_PREFIX: [&str; 5] = [
    "minecraft:adventure",
    "minecraft:end",
    "minecraft:husbandry",
    "minecraft:nether",
    "minecraft:story",
];

fn parse_advancement_json(json: &str) -> HashMap<String, Advancement> {
    let root: Map<String, Value> = serde_json::from_str(&json).expect("Parsing advancement JSON");

    let advancements: HashMap<String, Advancement> = root
        .iter()
        .filter_map(|(key, value)| {
            // Example: minecraft:adventure/kill_all_mobs, should return minecraft::adventure.
            let namespace_prefix = key
                .split("/")
                .collect::<Vec<&str>>()
                .first()
                .unwrap_or(&"")
                .to_string();

            // This is the filter condition.
            if ADVANCEMENT_NAMESPACE_PREFIX.contains(&namespace_prefix.as_str()) {
                let name = key.clone();

                let done = match value.get("done") {
                    None => false,
                    Some(done_json_value) => match done_json_value.as_bool() {
                        None => false,
                        Some(done) => done,
                    },
                };

                // todo Refactor?
                let mut criteria: HashSet<String> = HashSet::new();
                let criteria_json = value.get("criteria");
                if criteria_json.is_some() {
                    let criteria_object = criteria_json.unwrap().as_object();
                    if criteria_object.is_some() {
                        criteria = criteria_object
                            .unwrap()
                            .keys()
                            .map(|key| key.clone())
                            .collect();
                    }
                }
                Some((
                    name.clone(),
                    Advancement {
                        name,
                        criteria,
                        done,
                    },
                ))
            } else {
                None
            }
        })
        .collect();

    advancements
}

#[wasm_bindgen]
pub fn get_missing_advancements(advancement_json: &str) -> Vec<JsValue> {
    // 1. Parse completed advancements to master list.
    let master_json = include_str!("../advancements_master.json");
    let master_advancements = parse_advancement_json(&master_json);

    // Warn about incomplete advancements in the master file.
    master_advancements.values().for_each(|advancement| {
        if !advancement.done {
            warn_1(
                &format!(
                    "This advancement in the master file is not done: {}",
                    advancement.name
                )
                .into(),
            );
        }
    });

    // 2. Parse provided advancements for comparison to the master list.
    let current_advancements = parse_advancement_json(&advancement_json);

    let missing_advancements: Vec<Advancement> = master_advancements
        .iter()
        .filter_map(|(name, master_advancement)| {
            if let Some(current_advancement) = current_advancements.get(name) {
                if !current_advancement.done {
                    Some(Advancement {
                        name: name.clone(),
                        done: false,
                        criteria: master_advancement
                            .criteria
                            .difference(&current_advancement.criteria)
                            .map(|x| x.to_string())
                            .collect(),
                    })
                } else {
                    None
                }
            } else {
                Some(Advancement {
                    name: name.clone(),
                    done: false,
                    criteria: master_advancement.criteria.clone(),
                })
            }
        })
        .collect();

    missing_advancements
        .iter()
        .map(|advancement| JsValue::from_serde(advancement).unwrap())
        .collect()
}
