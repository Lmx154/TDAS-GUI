


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
