use tauri::State;
use std::sync::Mutex;

use super::*;

#[tokio::test]
async fn test_list_serial_ports() {
    let result = list_serial_ports();
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_open_serial() {
    let serial_connection = State::new(SerialConnection(Mutex::new(None)));
    let result = open_serial("COM1".to_string(), 9600, serial_connection).await;
    assert!(result.is_err()); // Assuming COM1 is not available for testing
}

#[tokio::test]
async fn test_close_serial() {
    let serial_connection = State::new(SerialConnection(Mutex::new(None)));
    let result = close_serial(serial_connection).await;
    assert!(result.is_err()); // No active connection to close
}