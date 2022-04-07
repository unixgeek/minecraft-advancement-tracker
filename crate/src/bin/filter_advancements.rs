use minecraft_advancement_tracker::{ADVANCEMENT_NAMESPACE_PREFIX, DATA_VERSION};
use serde_json::{Map, Value};
use std::env;
use std::fs::File;
use std::io::{Read, Write};

// Simple binary for filtering the advancements to reduce .wasm size, hence the simple error handling.
fn main() {
    let args: Vec<String> = env::args().collect();
    let in_file = args.get(1).expect("Missing input file");
    let out_file = args.get(2).expect("Missing output file");

    // Apparently reading the contents directly to a string is faster than a buffered reader.
    // https://github.com/serde-rs/json/issues/160
    let mut contents = String::new();
    File::open(in_file)
        .expect("Opening file")
        .read_to_string(&mut contents)
        .expect("Reading to string");

    let root: Map<String, Value> = serde_json::from_str(&contents).expect("Parsing contents");
    let before_count = root.len();

    let filtered: Map<String, Value> = root
        .into_iter()
        .filter(|item| {
            let key = item.0.split('/').next().unwrap_or_default();
            ADVANCEMENT_NAMESPACE_PREFIX.contains(&key) || key == "DataVersion"
        })
        .collect();

    let count = before_count - filtered.len();
    println!("Filtered {count} entries.");

    if let Some(value) = filtered.get("DataVersion") {
        if let Some(data_version) = value.as_u64() {
            if data_version != DATA_VERSION as u64 {
                println!("You need to update DATA_VERSION in lib.rs to {data_version}");
            } else {
                println!("No change to DATA_VERSION in lib.rs needed.");
            }
        } else {
            println!("DATA_VERSION could not be parsed as an integer.");
        }
    } else {
        println!("DATA_VERSION is missing.");
    }

    let filtered_contents = serde_json::to_string(&filtered).expect("Formatting contents");
    File::create(out_file)
        .expect("Creating file")
        .write_all(filtered_contents.as_bytes())
        .expect("Writing file");
}
