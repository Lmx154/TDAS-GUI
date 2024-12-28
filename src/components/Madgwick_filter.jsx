import * as THREE from "three";

// Madgwick filter in JavaScript
// This version handles gyro + accel. (Add magnetometer if needed.)
export default class MadgwickAHRS {
  /**
   * @param {number} sampleFreq - sampling frequency in Hz
   * @param {number} beta - gain parameter
   */
  constructor(sampleFreq = 100, beta = 0.1) {
    this.sampleFreq = sampleFreq; // sampling frequency in Hz
    this.beta = beta;             // Madgwick's "beta" gain
    // Quaternion representing orientation
    this.q0 = 1;
    this.q1 = 0;
    this.q2 = 0;
    this.q3 = 0;
  }

  /**
   * update(gx, gy, gz, ax, ay, az)
   *  gx, gy, gz: gyroscope, in rad/s
   *  ax, ay, az: accelerometer, in m/s^2
   */
  update(gx, gy, gz, ax, ay, az) {
    // 1) Normalize the accelerometer
    const norm = Math.sqrt(ax * ax + ay * ay + az * az);
    if (norm === 0) return; // avoid NaN
    ax /= norm;
    ay /= norm;
    az /= norm;

    // Local copies of quaternion
    let q0 = this.q0,
        q1 = this.q1,
        q2 = this.q2,
        q3 = this.q3;

    // Auxiliary variables to avoid repeated arithmetic
    const _2q0 = 2.0 * q0;
    const _2q1 = 2.0 * q1;
    const _2q2 = 2.0 * q2;
    const _2q3 = 2.0 * q3;
    const _4q0 = 4.0 * q0;
    const _4q1 = 4.0 * q1;
    const _4q2 = 4.0 * q2;
    const _8q1 = 8.0 * q1;
    const _8q2 = 8.0 * q2;
    const q0q0 = q0 * q0;
    const q1q1 = q1 * q1;
    const q2q2 = q2 * q2;
    const q3q3 = q3 * q3;

    // 2) Gradient descent algorithm corrective step
    const s0 = _4q0 * q2q2 + _2q2 * ax + _4q0 * q1q1 - _2q1 * ay;
    const s1 =
      _4q1 * q3q3 -
      _2q3 * ax +
      4.0 * q0q0 * q1 -
      _2q0 * ay -
      _4q1 +
      _8q1 * q1q1 +
      _8q1 * q2q2 +
      4.0 * q1 * az;
    const s2 =
      4.0 * q0q0 * q2 +
      _2q0 * ax +
      4.0 * q2q2 * q2 -
      _2q2 * ay -
      _4q2 +
      _8q2 * q1q1 +
      _8q2 * q2q2 +
      4.0 * q2 * az;
    const s3 =
      4.0 * q1q1 * q3 -
      _2q1 * ax +
      4.0 * q2q2 * q3 -
      _2q2 * ay;

    const normS = Math.sqrt(s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3);
    if (normS === 0) return;
    const invS = 1.0 / normS;
    const s0n = s0 * invS;
    const s1n = s1 * invS;
    const s2n = s2 * invS;
    const s3n = s3 * invS;

    // 3) Compute rate of change of quaternion
    //    qDot = 1/2 * Omega(q) - beta * gradient
    const qDot0 = 0.5 * (-q1 * gx - q2 * gy - q3 * gz) - this.beta * s0n;
    const qDot1 = 0.5 * (q0 * gx + q2 * gz - q3 * gy) - this.beta * s1n;
    const qDot2 = 0.5 * (q0 * gy - q1 * gz + q3 * gx) - this.beta * s2n;
    const qDot3 = 0.5 * (q0 * gz + q1 * gy - q2 * gx) - this.beta * s3n;

    // 4) Integrate qDot over time = 1/sampleFreq
    q0 += qDot0 / this.sampleFreq;
    q1 += qDot1 / this.sampleFreq;
    q2 += qDot2 / this.sampleFreq;
    q3 += qDot3 / this.sampleFreq;

    // 5) Normalize quaternion
    const nq = Math.sqrt(q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
    this.q0 = q0 / nq;
    this.q1 = q1 / nq;
    this.q2 = q2 / nq;
    this.q3 = q3 / nq;
  }

  // Return Euler angles (roll, pitch, yaw) in degrees
  getEulerAnglesDeg() {
    const { q0, q1, q2, q3 } = this;

    // roll (x-axis rotation)
    const sinr_cosp = 2 * (q0 * q1 + q2 * q3);
    const cosr_cosp = 1 - 2 * (q1 * q1 + q2 * q2);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    // pitch (y-axis rotation)
    const sinp = 2 * (q0 * q2 - q3 * q1);
    let pitch;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.sign(sinp) * (Math.PI / 2);
    } else {
      pitch = Math.asin(sinp);
    }

    // yaw (z-axis rotation)
    const siny_cosp = 2 * (q0 * q3 + q1 * q2);
    const cosy_cosp = 1 - 2 * (q2 * q2 + q3 * q3);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return {
      roll: THREE.MathUtils.radToDeg(roll),
      pitch: THREE.MathUtils.radToDeg(pitch),
      yaw: THREE.MathUtils.radToDeg(yaw),
    };
  }
}
