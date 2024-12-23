# DAS-GUI 🚀

![DAS-GUI Banner](https://via.placeholder.com/800x200?text=DAS-GUI+Banner)

**DAS-GUI** (Telemetry Data Acquisition System GUI) is a robust and user-friendly graphical interface designed for telemetry data acquisition and analysis. Whether you're monitoring drone flights, vehicle telemetry, or other high-frequency data streams, DAS-GUI provides the essential tools to visualize, record, and interpret your data seamlessly.

## Table of Contents

- [Why DAS-GUI?](#why-das-gui)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Usage](#usage)
  - [Serial Port Communication](#serial-port-communication)
  - [Data Recording and Parsing](#data-recording-and-parsing)
  - [Real-time Data Visualization](#real-time-data-visualization)
- [Telemetry Data](#telemetry-data)
  - [Data Format](#data-format)
  - [Data Buffering System](#data-buffering-system)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Why DAS-GUI?

In the realm of telemetry data acquisition, **efficiency**, **clarity**, and **reliability** are paramount. DAS-GUI stands out by combining the performance of Rust with the flexibility of React, offering a seamless experience for developers and analysts alike. Whether you're dealing with high-frequency data streams or require robust data parsing and visualization, DAS-GUI is engineered to meet your needs with precision and ease.

## Features

- **Serial Port Communication**: Effortlessly connect to and manage serial port connections.
- **File Operations**: Create, list, and manage text files within the data directory.
- **Real-time Telemetry Display**: Monitor acceleration, gyroscope, temperature, pressure, altitude, humidity, GPS data, and signal strength in real-time.
- **Data Recording**: Capture and store serial data at full speed without buffering delays.
- **Data Parsing**: Efficiently parse incoming data and compute averaged telemetry metrics.
- **High-Frequency Data Handling**: Manage and visualize data at up to 100Hz seamlessly.
- **Real-time Updates**: Dynamic UI updates ensure you always have the latest data at your fingertips.
- **Customizable Data Buffering**: Smooth out data for clearer visualization with adjustable buffering settings.

## Technology Stack

### Frontend

- ⚡ **Vite**: Fast and modern frontend build tool.
- ⚛️ **React JS**: Flexible and efficient JavaScript library for building user interfaces.
- 🎨 **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- 🛠️ **React Router DOM**: Declarative routing for React applications.

### Backend

- 🦀 **Rust**: High-performance systems programming language ensuring speed and reliability.
- 🖥️ **Tauri**: Build smaller, faster, and more secure desktop applications with Rust and web technologies.
- 📦 **Serialport**: Cross-platform serial port library for Rust.
- 🕰️ **Chrono**: Date and time library for Rust.
- ⚡ **Tokio**: Asynchronous runtime for Rust.

### Build Tools

- 🛠️ **Tauri CLI**: Command-line interface for Tauri.
- 🛠️ **Vite Plugins**: Including `@vitejs/plugin-react` for React integration.
- 🛠️ **PostCSS & Autoprefixer**: For CSS processing.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16 or later)
- **npm** (v7 or later)
- **Rust** (v1.60 or later)
- **Cargo** (comes with Rust)
- **Git**

### Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/das-gui.git
   cd das-gui
   ```

2. **Install Frontend Dependencies**

   ```bash
   npm install
   ```

3. **Build the Backend**

   Navigate to the backend directory and build the Rust components.

   ```bash
   cd src-tauri
   cargo build
   cd ..
   ```

### Running the Application

Start the development server:

```bash
npm run tauri dev
```

> **Note**: When making changes to the frontend, simply rerun the above command. For backend changes, you may need to clean and rebuild Cargo as described in the Development Workflow section.

## Usage

### Serial Port Communication

Connect to your telemetry device via serial port:

1. **List Available Ports**

   Use the application interface to view available serial ports.

2. **Open a Connection**

   Select the desired port and baud rate, then establish a connection.

3. **Close the Connection**

   Easily disconnect when you're done.

### Data Recording and Parsing

1. **Start Recording**

   Begin capturing serial data to a text file with a single click.

2. **Automatic Parsing**

   DAS-GUI parses incoming data in real-time, computing averaged telemetry metrics for clarity.

3. **Manage Files**

   Create and list text files within the data directory to organize your recordings.

### Real-time Data Visualization

Monitor your telemetry data live with dynamic charts and tables:

- **Acceleration & Gyroscope**: Visualize motion data across all three axes.
- **Environmental Metrics**: Track temperature, pressure, altitude, and humidity.
- **GPS Data**: View location coordinates, speed, altitude, and satellite information.
- **Signal Strength**: Monitor RSSI and SNR for connection quality insights.

## Telemetry Data

### Data Format

Data is received in the following structured format:

```
[timestamp] accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z, imu_temp, bme_temp, bme_pressure, bme_altitude, bme_humidity, gps_fix, gps_fix_quality, gps_lat, gps_lon, gps_speed, gps_altitude, gps_satellites
```

#### Example Inputs

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

### Data Buffering System

To ensure smooth and accurate real-time visualization, DAS-GUI implements a robust data buffering system.

#### Configuration

- **Default Buffer Size**: 10 samples
- **Default Output Rate**: 10Hz
- **Input Data Rate**: ~100Hz

#### How It Works

1. **Data Ingestion**: Raw telemetry data arrives at approximately 100Hz.
2. **Circular Buffer Storage**: Data is stored in a `VecDeque` to maintain a fixed buffer size.
3. **Averaging Mechanism**: Once the buffer is full and the emit interval is reached, data is averaged.
4. **Emission**: Averaged data is emitted at the specified rate (default 10Hz) for smooth visualization.

#### Adjusting the Buffer

To modify buffer settings, locate the following line in `src-tauri/src/data_operations.rs`:

```rust
let buffer = Arc::new(Mutex::new(TelemetryBuffer::new(10, 10.0)));
```

- **First Parameter**: Buffer size (number of samples)
- **Second Parameter**: Emit rate in Hz

## Development Workflow

### Initial Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run tauri dev
   ```

### Making Frontend Changes

- Modify React components or Tailwind CSS styles.
- Run the development server without cleaning Cargo:

  ```bash
  npm run tauri dev
  ```

### Making Backend Changes

1. **Clean Cargo Build**

   Navigate to the backend directory and clean the Cargo build:

   ```bash
   cd src-tauri
   cargo clean
   cd ..
   ```

2. **Rebuild and Run**

   Restart the development server:

   ```bash
   npm run tauri dev
   ```

## Building for Production

1. **Clean Cargo**

   ```bash
   cd src-tauri
   cargo clean
   cd ..
   ```

2. **Build the Application**

   ```bash
   npm run tauri build
   ```

   The built application will be available in the `src-tauri/target/release` directory.

## Testing

- **Run Tests**: Ensure all tests pass before creating a pull request or committing changes.
- **Add New Tests**: Enhance test coverage for new features or bug fixes.

## Contributing

Contributions are welcome! Whether you're reporting a bug, suggesting a feature, or submitting a pull request, your input is valuable.

1. **Fork the Repository**

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/YourFeature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add your message"
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/YourFeature
   ```

5. **Open a Pull Request**

Please ensure your code adheres to the project's coding standards and includes relevant tests.