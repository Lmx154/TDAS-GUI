import * as THREE from "three";

export default class KalmanAHRS {
  constructor(sampleFreq = 100) {
    this.sampleFreq = sampleFreq;

    // State: [roll, pitch, yaw] in radians
    this.roll = 0;
    this.pitch = 0;
    this.yaw = 0;

    // Covariance matrix
    this.P = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];

    // LOWER Q => trust the current orientation more, respond less to gyro noise
    this.Q = [
      [0.0001, 0, 0],
      [0, 0.0001, 0],
      [0, 0, 0.0001],
    ];

    // R: measurement noise for roll/pitch from accel
    this.R = [
      [THREE.MathUtils.degToRad(2)**2, 0],
      [0, THREE.MathUtils.degToRad(2)**2],
    ];
  }

  update(gx, gy, gz, ax, ay, az) {
    const dt = 1 / this.sampleFreq;

    // Predict
    let rollPred  = this.roll  + gx * dt;
    let pitchPred = this.pitch + gy * dt;
    let yawPred   = this.yaw   + gz * dt;

    // Cov predict
    let Ppred = matrixAdd(this.P, this.Q);

    // Accel measurement
    const norm = Math.sqrt(ax*ax + ay*ay + az*az);
    if (norm < 1e-6) {
      // skip correction
      this.roll = rollPred;
      this.pitch = pitchPred;
      this.yaw = yawPred;
      this.P = Ppred;
      return;
    }
    ax /= norm; ay /= norm; az /= norm;

    // roll from accel
    const rollAcc  = Math.atan2(ay, az);
    const pitchAcc = Math.asin(-ax);

    const Z = [rollAcc, pitchAcc];
    const Hx= [rollPred, pitchPred];

    const y0 = Z[0] - Hx[0];
    const y1 = Z[1] - Hx[1];

    const S = [
      [Ppred[0][0] + this.R[0][0], Ppred[0][1] + this.R[0][1]],
      [Ppred[1][0] + this.R[1][0], Ppred[1][1] + this.R[1][1]],
    ];
    const Sinv= invert2x2(S);

    const K = [
      [
        Ppred[0][0]*Sinv[0][0] + Ppred[0][1]*Sinv[1][0],
        Ppred[0][0]*Sinv[0][1] + Ppred[0][1]*Sinv[1][1]
      ],
      [
        Ppred[1][0]*Sinv[0][0] + Ppred[1][1]*Sinv[1][0],
        Ppred[1][0]*Sinv[0][1] + Ppred[1][1]*Sinv[1][1]
      ],
      [
        Ppred[2][0]*Sinv[0][0] + Ppred[2][1]*Sinv[1][0],
        Ppred[2][0]*Sinv[0][1] + Ppred[2][1]*Sinv[1][1]
      ]
    ];

    rollPred  += K[0][0]*y0 + K[0][1]*y1;
    pitchPred += K[1][0]*y0 + K[1][1]*y1;
    yawPred   += K[2][0]*y0 + K[2][1]*y1;

    // Pnew
    const KH = [
      [K[0][0], K[0][1], 0],
      [K[1][0], K[1][1], 0],
      [K[2][0], K[2][1], 0],
    ];
    const I = [[1,0,0],[0,1,0],[0,0,1]];
    const temp = matrixSub(I, multiply3x3_3x3(KH, [[1,0,0],[0,1,0],[0,0,0]]));
    const Pnew = multiply3x3_3x3(temp, Ppred);

    this.roll  = rollPred;
    this.pitch = pitchPred;
    this.yaw   = yawPred;
    this.P     = Pnew;
  }

  getEulerAnglesDeg(){
    return {
      roll :  THREE.MathUtils.radToDeg(this.roll),
      pitch: THREE.MathUtils.radToDeg(this.pitch),
      yaw  : THREE.MathUtils.radToDeg(this.yaw),
    };
  }
}

/* 2x2 invert etc. remains the same as before */

function invert2x2(M){
  const det = M[0][0]*M[1][1] - M[0][1]*M[1][0];
  if(Math.abs(det)<1e-12)return[[0,0],[0,0]];
  const inv=1/det;
  return [
    [M[1][1]*inv, -M[0][1]*inv],
    [-M[1][0]*inv, M[0][0]*inv]
  ];
}
function matrixAdd(A,B){
  const R=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++){
    for(let j=0;j<3;j++){
      R[i][j]= A[i][j]+ B[i][j];
    }
  }
  return R;
}
function matrixSub(A,B){
  const R=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++){
    for(let j=0;j<3;j++){
      R[i][j]= A[i][j]- B[i][j];
    }
  }
  return R;
}
function multiply3x3_3x3(A,B){
  const R=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++){
    for(let j=0;j<3;j++){
      let sum=0;
      for(let k=0;k<3;k++){
        sum+=A[i][k]*B[k][j];
      }
      R[i][j]=sum;
    }
  }
  return R;
}
