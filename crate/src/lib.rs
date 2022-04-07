use cfg_if::cfg_if;
use serde::Serialize;
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;
use web_sys::console::warn_1;

cfg_if! {
    if #[cfg(feature = "console_error_panic_hook")] {
        use console_error_panic_hook::set_once as set_panic_hook;
    } else {
        #[inline]
        fn set_panic_hook() {}
    }
}

cfg_if! {
    if #[cfg(feature = "wee_alloc")] {
        #[global_allocator]
        static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
    }
}

#[derive(Serialize, Hash, PartialEq, Eq, Clone)]
pub struct Criterion {
    value: String,
    done: bool,
}

#[derive(Serialize)]
pub struct Advancement {
    name: String,
    criteria: HashSet<Criterion>,
    done: bool,
}

pub static DATA_VERSION: u16 = 2975;

pub static ADVANCEMENT_NAMESPACE_PREFIX: [&str; 5] = [
    "minecraft:adventure",
    "minecraft:end",
    "minecraft:husbandry",
    "minecraft:nether",
    "minecraft:story",
];

fn parse_advancement_json(json: &str) -> anyhow::Result<HashMap<String, Advancement>> {
    let root: Map<String, Value> = serde_json::from_str(json)?;

    if let Some(value) = root.get("DataVersion") {
        if let Some(data_version) = value.as_u64() {
            if data_version != DATA_VERSION as u64 {
                warn_1(&format!("Advancement file is DataVersion {data_version}, but this tool was tested with {DATA_VERSION}. Results may not be accurate.").into());
            }
        }
    }

    let advancements: HashMap<String, Advancement> = root
        .iter()
        .filter_map(|(key, value)| {
            // Example: minecraft:adventure/kill_all_mobs, should return minecraft:adventure.
            let namespace_prefix = key.split('/').next().unwrap_or_default();

            // This is the filter condition for the filter_map(). We only care about a subset.
            if ADVANCEMENT_NAMESPACE_PREFIX.contains(&namespace_prefix) {
                // The name of the advancement.
                let name = key.clone();

                // Determine if the advancement is done.
                let done = match value.get("done") {
                    None => false,
                    Some(done_json_value) => done_json_value.as_bool().unwrap_or(false),
                };

                // Get the criteria for the advancement, if it exists.
                let mut criteria: HashSet<Criterion> = HashSet::new();
                let criteria_json = value.get("criteria");
                if let Some(criteria_json) = criteria_json {
                    let criteria_object = criteria_json.as_object();
                    if let Some(criteria_object) = criteria_object {
                        criteria = criteria_object
                            .keys()
                            .map(|key| Criterion {
                                value: key.clone(),
                                // If the criterion exists in the file, it is considered done.
                                done: true,
                            })
                            .collect();
                    }
                }
                // Return an entry for the filter_map().
                Some((
                    name.clone(),
                    Advancement {
                        name,
                        criteria,
                        done,
                    },
                ))
            } else {
                // Didn't meet the criteria of the filter_map().
                None
            }
        })
        .collect();

    Ok(advancements)
}

#[wasm_bindgen]
pub fn get_advancements(advancement_json: &str) -> Result<Vec<JsValue>, JsValue> {
    set_panic_hook();

    // Parse completed advancements to a master file.
    let master_json = include_str!("../../advancements_master.json");

    let master_advancements =
        parse_advancement_json(master_json).map_err(|e| js_sys::Error::new(&e.to_string()))?;

    // Warn about any incomplete advancements in the master file.
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

    // Parse provided advancements for comparison to the master file.
    let current_advancements =
        parse_advancement_json(advancement_json).map_err(|e| js_sys::Error::new(&e.to_string()))?;

    let advancements: Vec<Advancement> = master_advancements
        .iter()
        .map(|(name, master_advancement)| {
            // For each advancement in the master file, do something.

            if let Some(current_advancement) = current_advancements.get(name) {
                // The advancement is in the current file.
                Advancement {
                    name: name.clone(),
                    done: current_advancement.done,
                    criteria: master_advancement
                        .criteria
                        .iter()
                        .map(|master_criterion| {
                            // For each criteria indicated in the master file, see if exists in the current file.
                            if let Some(criterion) =
                                current_advancement.criteria.get(master_criterion)
                            {
                                criterion.clone()
                            } else {
                                // The master has it marked as done, so negate it.
                                Criterion {
                                    value: master_criterion.value.clone(),
                                    done: false,
                                }
                            }
                        })
                        .collect(),
                }
            } else {
                // The advancement is not in the current file, so clone from the master file.
                Advancement {
                    name: name.clone(),
                    done: false,
                    // The master has it marked as done, so negate it.
                    criteria: master_advancement
                        .criteria
                        .iter()
                        .map(|a| Criterion {
                            value: a.value.clone(),
                            done: false,
                        })
                        .collect(),
                }
            }
        })
        .collect();

    Ok(advancements
        .iter()
        .map(|advancement| JsValue::from_serde(advancement).unwrap())
        .collect())
}

#[wasm_bindgen]
pub fn get_advancement_namespace_prefixes() -> Vec<JsValue> {
    ADVANCEMENT_NAMESPACE_PREFIX
        .iter()
        .map(|a| a.to_string().into())
        .collect()
}
