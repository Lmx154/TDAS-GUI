//here we will parse the data and send to the front end.

use std::io::Read;
use std::thread;
use std::time::Duration;
use serialport::SerialPort;
use std::fs::OpenOptions;
use std::io::Write;

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

pub fn write_serial_to_file(mut port: Box<dyn SerialPort + Send>, file_path: String) {
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
                                // Write the line to file with a newline
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