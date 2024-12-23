//here we will parse the data and send to the front end.

use std::io::Read;
use std::thread;
use std::time::Duration;
use serialport::SerialPort;
use std::fs::OpenOptions;
use std::io::Write;
use crate::serial_operations::SerialConnection;
use tauri::State;
use chrono::NaiveDateTime;
use serde::Serialize;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Debug, Serialize)]
pub struct TelemetryData {
    timestamp: String,
    accel_x: f32,
    accel_y: f32,
    accel_z: f32,
    gyro_x: f32,
    gyro_y: f32,
    gyro_z: f32,
    temp: f32,
    press_alt: f32,
    heading: f32,
    ground_speed: f32,
    gps_fix: u8,
    gps_num_sats: u8,
    gps_3d_fix: u8,
    latitude: f32,
    longitude: f32,
    altitude: f32,
    distance: f32,
    packet_number: u8,
    rssi: i32,
    snr: f32,
}

#[derive(Debug)]
pub struct TelemetryBuffer {
    buffer: VecDeque<TelemetryData>,
    last_emit: Instant,
    emit_interval: Duration,
    buffer_size: usize,
}

impl TelemetryBuffer {
    pub fn new(buffer_size: usize, emit_rate_hz: f32) -> Self {
        Self {
            buffer: VecDeque::with_capacity(buffer_size),
            last_emit: Instant::now(),
            emit_interval: Duration::from_secs_f32(1.0 / emit_rate_hz),
            buffer_size,
        }
    }

    pub fn add_data(&mut self, data: TelemetryData) -> Option<TelemetryData> {
        self.buffer.push_back(data);
        
        // Keep buffer at fixed size
        if self.buffer.len() > self.buffer_size {
            self.buffer.pop_front();
        }

        // Check if it's time to emit averaged data
        if self.last_emit.elapsed() >= self.emit_interval {
            self.last_emit = Instant::now();
            self.compute_average()
        } else {
            None
        }
    }

    fn compute_average(&self) -> Option<TelemetryData> {
        if self.buffer.is_empty() {
            return None;
        }

        let count = self.buffer.len() as f32;
        let mut avg = TelemetryData {
            timestamp: self.buffer.back()?.timestamp.clone(), // Use most recent timestamp
            accel_x: 0.0,
            accel_y: 0.0,
            accel_z: 0.0,
            gyro_x: 0.0,
            gyro_y: 0.0,
            gyro_z: 0.0,
            temp: 0.0,
            press_alt: 0.0,
            heading: 0.0,
            ground_speed: 0.0,
            gps_fix: 0,
            gps_num_sats: 0,
            gps_3d_fix: 0,
            latitude: 0.0,
            longitude: 0.0,
            altitude: 0.0,
            distance: 0.0,
            packet_number: self.buffer.back()?.packet_number, // Use most recent packet number
            rssi: 0,
            snr: 0.0,
        };

        // Sum all values
        for data in &self.buffer {
            avg.accel_x += data.accel_x;
            avg.accel_y += data.accel_y;
            avg.accel_z += data.accel_z;
            avg.gyro_x += data.gyro_x;
            avg.gyro_y += data.gyro_y;
            avg.gyro_z += data.gyro_z;
            avg.temp += data.temp;
            avg.press_alt += data.press_alt;
            avg.heading += data.heading;
            avg.ground_speed += data.ground_speed;
            avg.latitude += data.latitude;
            avg.longitude += data.longitude;
            avg.altitude += data.altitude;
            avg.distance += data.distance;
            avg.rssi += data.rssi;
            avg.snr += data.snr;
        }

        // Calculate averages
        avg.accel_x /= count;
        avg.accel_y /= count;
        avg.accel_z /= count;
        avg.gyro_x /= count;
        avg.gyro_y /= count;
        avg.gyro_z /= count;
        avg.temp /= count;
        avg.press_alt /= count;
        avg.heading /= count;
        avg.ground_speed /= count;
        avg.latitude /= count;
        avg.longitude /= count;
        avg.altitude /= count;
        avg.distance /= count;
        avg.rssi = (avg.rssi as f32 / count) as i32;
        avg.snr /= count;

        // Use mode for discrete values
        avg.gps_fix = self.mode_u8(|d| d.gps_fix);
        avg.gps_num_sats = self.mode_u8(|d| d.gps_num_sats);
        avg.gps_3d_fix = self.mode_u8(|d| d.gps_3d_fix);

        Some(avg)
    }

    fn mode_u8<F>(&self, getter: F) -> u8 
    where
        F: Fn(&TelemetryData) -> u8 
    {
        let mut counts = [0u32; 256];
        for data in &self.buffer {
            counts[getter(data) as usize] += 1;
        }
        counts
            .iter()
            .enumerate()
            .max_by_key(|&(_, count)| count)
            .map(|(value, _)| value as u8)
            .unwrap_or(0)
    }
}

pub fn debug_read_serial(mut port: Box<dyn SerialPort + Send>) {
    thread::spawn(move || {
        let mut serial_buf: Vec<u8> = vec![0; 1024];
        let mut accumulated_data = String::new();

        loop {
            match port.read(serial_buf.as_mut_slice()) {
                Ok(t) => {
                    if t > 0 {
                        // Convert bytes to string and append to accumulated data
                        accumulated_data.push_str(&String::from_utf8_lossy(&serial_buf[..t]));

                        // Process complete messages
                        while let Some(pos) = accumulated_data.find("\r\n") {
                            let line = accumulated_data[..pos].trim_start_matches('$');
                            if !line.is_empty() {
                                // Simple formatting for each line
                                println!("{}", line);
                            }
                            accumulated_data = accumulated_data[pos + 2..].to_string();
                        }
                    }
                }
                Err(e) => {
                    if e.kind() == std::io::ErrorKind::TimedOut {
                        thread::sleep(Duration::from_millis(100));
                        continue;
                    }
                    println!("Critical error reading from port: {}", e);
                    break;
                }
            }
        }
    });
}

pub fn data_parser(mut port: Box<dyn SerialPort + Send>) {
    let buffer = Arc::new(Mutex::new(TelemetryBuffer::new(10, 10.0))); // 10 samples buffer, 10Hz output -- This is where we set buffer

    thread::spawn(move || {
        let mut serial_buf: Vec<u8> = vec![0; 1024];
        let mut accumulated_data = String::new();
        let mut current_message = String::new();
        let mut current_rssi: Option<i32> = None;
        let mut current_snr: Option<f32> = None;

        loop {
            match port.read(serial_buf.as_mut_slice()) {
                Ok(t) => {
                    if t > 0 {
                        accumulated_data.push_str(&String::from_utf8_lossy(&serial_buf[..t]));

                        while let Some(pos) = accumulated_data.find("\r\n") {
                            let line = accumulated_data[..pos].trim();
                            
                            if line.starts_with("Message: ") {
                                current_message = line["Message: ".len()..].to_string();
                            } else if line.starts_with("RSSI: ") {
                                if let Ok(rssi) = line["RSSI: ".len()..].trim().parse() {
                                    current_rssi = Some(rssi);
                                }
                            } else if line.starts_with("Snr: ") {
                                if let Ok(snr) = line["Snr: ".len()..].trim().parse() {
                                    current_snr = Some(snr);
                                }

                                if let (Some(rssi), Some(snr)) = (current_rssi, current_snr) {
                                    if let Some(telemetry) = parse_telemetry(&current_message, rssi, snr) {
                                        // Add to buffer and get averaged data if available
                                        if let Ok(mut buffer) = buffer.lock() {
                                            if let Some(averaged_data) = buffer.add_data(telemetry) {
                                                println!("Averaged telemetry: {:?}", averaged_data);
                                                // Here you would send the averaged_data to the frontend
                                            }
                                        }
                                    }
                                    current_message.clear();
                                    current_rssi = None;
                                    current_snr = None;
                                }
                            }
                            accumulated_data = accumulated_data[pos + 2..].to_string();
                        }
                    }
                }
                Err(e) => {
                    if e.kind() == std::io::ErrorKind::TimedOut {
                        thread::sleep(Duration::from_millis(100));
                        continue;
                    }
                    println!("Critical error reading from port: {}", e);
                    break;
                }
            }
        }
    });
}

fn parse_telemetry(message: &str, rssi: i32, snr: f32) -> Option<TelemetryData> {
    // Extract timestamp and data parts
    let parts: Vec<&str> = message.split("] ").collect();
    if parts.len() != 2 {
        return None;
    }

    let timestamp = parts[0].trim_start_matches('[').to_string();
    let data_str = parts[1];

    // Split the data into individual values
    let values: Vec<&str> = data_str.split(',').collect();
    if values.len() != 18 {
        return None;
    }

    // Parse all values, using ? operator to handle potential parsing errors
    Some(TelemetryData {
        timestamp,
        accel_x: values[0].trim().parse().ok()?,
        accel_y: values[1].trim().parse().ok()?,
        accel_z: values[2].trim().parse().ok()?,
        gyro_x: values[3].trim().parse().ok()?,
        gyro_y: values[4].trim().parse().ok()?,
        gyro_z: values[5].trim().parse().ok()?,
        temp: values[6].trim().parse().ok()?,
        press_alt: values[7].trim().parse().ok()?,
        heading: values[8].trim().parse().ok()?,
        ground_speed: values[9].trim().parse().ok()?,
        gps_fix: values[10].trim().parse().ok()?,
        gps_num_sats: values[11].trim().parse().ok()?,
        gps_3d_fix: values[12].trim().parse().ok()?,
        latitude: values[13].trim().parse().ok()?,
        longitude: values[14].trim().parse().ok()?,
        altitude: values[15].trim().parse().ok()?,
        distance: values[16].trim().parse().ok()?,
        packet_number: values[17].trim().parse().ok()?,
        rssi,
        snr,
    })
}

pub(crate) fn write_serial_to_file(mut port: Box<dyn SerialPort + Send>, file_path: String) {
    thread::spawn(move || {
        let mut serial_buf: Vec<u8> = vec![0; 1024];
        let mut accumulated_data = String::new();

        let file = OpenOptions::new()
            .write(true)
            .append(true)
            .create(true)
            .open(&file_path);

        let mut file = match file {
            Ok(f) => f,
            Err(e) => {
                println!("Failed to open file: {}", e);
                return;
            }
        };

        loop {
            match port.read(serial_buf.as_mut_slice()) {
                Ok(t) => {
                    if t > 0 {
                        accumulated_data.push_str(&String::from_utf8_lossy(&serial_buf[..t]));

                        while let Some(pos) = accumulated_data.find("\r\n") {
                            let line = accumulated_data[..pos].trim_start_matches('$');
                            if !line.is_empty() {
                                if let Err(e) = writeln!(file, "{}", line) {
                                    println!("Failed to write to file: {}", e);
                                    return;
                                }
                            }
                            accumulated_data = accumulated_data[pos + 2..].to_string();
                        }
                    }
                }
                Err(e) => {
                    if e.kind() == std::io::ErrorKind::TimedOut {
                        thread::sleep(Duration::from_millis(100));
                        continue;
                    }
                    println!("Critical error reading from port: {}", e);
                    break;
                }
            }
        }
    });
}

// Add new Tauri command that uses SerialConnection state
// DO NOT TOUCH THIS UNLESS YOU ABSOLUTELY UNDERSTAND WHAT YOU ARE DOING
#[tauri::command]
pub fn start_recording(file_path: String, serial_connection: State<'_, SerialConnection>) -> Result<String, String> {
    let connection = serial_connection.0.lock().unwrap();
    match connection.as_ref() {
        Some(port) => {
            let port_clone = port.try_clone().map_err(|e| e.to_string())?;
            write_serial_to_file(port_clone, file_path.clone());
            Ok(format!("Started recording to {}", file_path))
        }
        None => Err("No active serial connection".to_string()),
    }
}