// lib.rs
mod serial_operations;

use serial_operations::SerialConnection;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SerialConnection(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            serial_operations::list_serial_ports,
            serial_operations::open_serial,
            serial_operations::close_serial,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}