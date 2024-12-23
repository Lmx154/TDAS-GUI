# TDAS-GUI 🚀

TDAS-GUI is a graphical user interface for telemetry data acquisition and analysis.

## Front end
- ⚡ **Vite**
- ⚛️ **React JS**
- 🎨 **Tailwind CSS**

## Back end 
- 🦀 **Rust**
- 🖥️ **Tauri**

## Features

- **Serial Port Communication**: Open and close serial port connections (Rust). See [`serial_operations.rs`](src-tauri/src/serial_operations.rs).
- **File Operations**: Create and list text files in the data directory (Rust). See [`file_operations.rs`](src-tauri/src/file_operations.rs).
- **Telemetry Data Display**: Real-time display of telemetry data including acceleration, gyroscope, temperature, pressure, altitude, humidity, GPS data, and signal strength (Rust). See [`data_operations.rs`](src-tauri/src/data_operations.rs).
- **Data Recording**: Record serial data to a text file. Data recording happens at full speed without buffering, thanks to Rust's performance and concurrency capabilities. See [`data_operations.rs`](src-tauri/src/data_operations.rs).
- **Data Parsing**: Parse incoming serial data and compute averaged telemetry data. Rust's speed and efficiency ensure quick and accurate data parsing. See [`data_operations.rs`](src-tauri/src/data_operations.rs).
- **Real-time Updates**: Listen for telemetry updates and display them in the UI (ReactJS).
- **High-Frequency Data Handling**: Record data and get real-time telemetry data at 100Hz with no issues, leveraging Rust's performance.

## Telemetry Data Buffering System

### Telemetry Data Table

| Value in Data String | Mapped Variable   | Description                                   |
|----------------------|-------------------|-----------------------------------------------|
| `0.08`               | `accel_x`         | IMU X-axis acceleration (m/s²)                |
| `-0.40`              | `accel_y`         | IMU Y-axis acceleration (m/s²)                |
| `-9.74`              | `accel_z`         | IMU Z-axis acceleration (m/s²)                |
| `14.00`              | `gyro_x`          | IMU X-axis angular velocity (°/s)             |
| `16.00`              | `gyro_y`          | IMU Y-axis angular velocity (°/s)             |
| `-96.00`             | `gyro_z`          | IMU Z-axis angular velocity (°/s)             |
| `31.25`              | `imu_temp`        | IMU internal temperature (°C)                 |
| `33.56`              | `bme_temp`        | BME280 temperature reading (°C)               |
| `1009.91`            | `bme_pressure`    | BME280 atmospheric pressure (hPa)             |
| `-31.06`             | `bme_altitude`    | BME280 altitude (m)                           |
| `35.39`              | `bme_humidity`    | BME280 humidity (%)                           |
| `1`                  | `gps_fix`         | GPS fix status (1 = fixed, 0 = not fixed)     |
| `2`                  | `gps_fix_quality` | GPS fix quality (e.g., 1 = GPS fix, 2 = DGPS) |
| `26.273800`          | `gps_lat`         | GPS latitude (decimal degrees)                |
| `-98.431976`         | `gps_lon`         | GPS longitude (decimal degrees)               |
| `0.16`               | `gps_speed`       | GPS ground speed (m/s)                        |
| `68.00`              | `gps_altitude`    | GPS altitude (m)                              |
| `8`                  | `gps_satellites`  | Number of GPS satellites in use               |

## Telemetry Data Format

Data is input in the following format:

```
[timestamp] accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, imu_temp, bme_temp, bme_pressure, bme_altitude, bme_humidity, gps_fix, gps_fix_quality, gps_lat, gps_lon, gps_speed, gps_altitude, gps_satellites
```

### Example Input

**Standby Mode:**
```
$Message length: 115
Message: [2024/12/19 (Thursday) 13:06:42] 0.0,0.0,0.0,0.0,0.0,0.0,30.57,35.0,1013.25,0.0,20.0,1,2,32.9394,-106.922,0.0,0.0,8
RSSI: -97
Snr: 7.39
```

**Launch Mode:**
```
$Message length: 130
Message: [2024/12/19 (Thursday) 13:00:02] 15.1,-0.02,-0.4,82.33,-65.0,72.93,31.17,7.52,616.2,4003.17,0,1,2,32.9394,-106.922,82.16,4227.45,8
RSSI: -97
Snr: 7.87
```

The application implements a data buffering system to smooth out high-frequency telemetry data for smoother real-time data visualization:

### Configuration
- Default buffer size: 10 samples
- Default output rate: 10Hz
- Input data rate: ~100Hz

### How it works
1. Raw telemetry data comes in at ~100Hz
2. Data is stored in a circular buffer (VecDeque)
3. When buffer is full:
   - Oldest sample is removed
   - New sample is added
   - Average is computed if enough time has passed
4. Averaged data is emitted at specified rate (default 10Hz)

### Adjusting the Buffer
To modify the buffer settings, locate this line in `src-tauri/src/data_operations.rs`:

```rust
let buffer = Arc::new(Mutex::new(TelemetryBuffer::new(10, 10.0)));
```

## Workflow

1. First run: `npm install`
2. Second run: `npm run tauri dev`

When making changes to the frontend, you can get away with not cleaning cargo and just running: `npm run tauri dev`

If you make any changes to the backend, no matter how small, clean cargo by navigating to `src-tauri` (assuming you're in project root): `cd src-tauri`
then run: `cargo clean`
after that you can go back to root: `cd ..`
now you can test your changes using: `npm run tauri dev`

## Build 

Always clean cargo before build. To do this first you must change directory to `src-tauri` (assuming you're in project root): `cd src-tauri`
next, run: `cargo clean`
then you should go back to root: `cd ..`
after cargo has been cleaned you can now build: `npm run tauri build`

## Testing 

Run tests before making a PR or committing your changes.
