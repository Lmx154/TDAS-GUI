# TDAS-GUI

TDAS-GUI is a graphical user interface for telemetry data acquisition and analysis.

## Features

- **Serial Port Communication**: Open and close serial port connections.
- **File Operations**: Create and list text files in the data directory.
- **Telemetry Data Display**: Real-time display of telemetry data including acceleration, gyroscope, temperature, pressure, altitude, humidity, GPS data, and signal strength.
- **Data Recording**: Record serial data to a text file.
- **Data Parsing**: Parse incoming serial data and compute averaged telemetry data.
- **Real-time Updates**: Listen for telemetry updates and display them in the UI.

## Data Buffering System

The application implements a data buffering system to smooth out high-frequency telemetry data:

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

## Installation

// ...existing content...

## Usage

// ...existing content...

## Contributing

// ...existing content...

