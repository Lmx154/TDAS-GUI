import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AxesHelper } from 'three';


function initThreeScene({
  mountRef,
  sceneRef,
  rendererRef,
  groupRef,
  rocketRef,
  animationFrameRef,
  orientationRef,
  lastFrameTimeRef,
  gyroRef,
  accelRef,
  accelAngleRef,       // <-- We'll store smoothed accel angles here
}) {
  const mount = mountRef.current;
  const scene = new THREE.Scene();
  sceneRef.current = scene;

  // Camera
  const camera = new THREE.PerspectiveCamera(
    75,
    mount.clientWidth / mount.clientHeight,
    0.1,
    1000
  );
  
  // Set camera position and orientation for Z-up
  const distance = 8;
  const angle = Math.PI / 4; // 45 degrees
  camera.position.set(
    distance * Math.cos(angle),
    -distance * Math.cos(angle),
    distance * Math.sin(angle)
  );
  camera.lookAt(0, 0, 0);
  
  // Create a matrix to reorient the camera
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationX(Math.PI / 2);
  camera.up.applyMatrix4(rotationMatrix);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  rendererRef.current = renderer;
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.physicallyCorrectLights = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  mount.appendChild(renderer.domElement);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 5;
  controls.maxDistance = 15;
  
  // Apply same orientation to controls
  controls.target.set(0, 0, 0);
  controls.update();

  // Light on camera
  const cameraLight = new THREE.SpotLight(0xffffff, 200);
  cameraLight.position.set(0, 0, 1);
  cameraLight.angle = Math.PI / 2;
  cameraLight.penumbra = 1;
  cameraLight.decay = 0;
  camera.add(cameraLight);
  scene.add(camera);

  // Cleanup sets
  const materials = new Set();
  const geometries = new Set();

  // Group for rocket
  const group = new THREE.Group();
  groupRef.current = group;
  scene.add(group);

  // Load rocket
  const loader = new GLTFLoader();
  const axesHelper = new THREE.AxesHelper(6); // length 2
  group.add(axesHelper);
  loader.load(
    "/rocket_model.gltf",
    (gltf) => {
      const rocket = gltf.scene;
      rocket.scale.set(0.5, 0.5, 0.5);
      // Rotate -90 degrees around X axis to point up Z instead of Y
      rocket.rotation.x = Math.PI / 2;
      rocket.rotation.order = "XYZ";
      rocket.position.set(0, 0, 0);

      rocket.traverse((node) => {
        if (node.isMesh) {
          if (node.geometry) geometries.add(node.geometry);
          const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0,
            roughness: 0.1,
          });
          materials.add(material);
          node.material = material;
        }
      });

      group.add(rocket);
      rocketRef.current = rocket;
    },
    undefined,
    (error) => {
      console.error(error);
    }
  );

  // Animation loop
  function animate() {
    animationFrameRef.current = requestAnimationFrame(animate);

    // 1) Compute dt
    const currentTime = performance.now();
    const deltaMs = currentTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = currentTime;
    const dt = deltaMs / 1000;

    // 2) Read gyro (deg/s) + accel (m/s^2)
    const { x: gx, y: gy, z: gz } = gyroRef.current;
    const { x: ax, y: ay, z: az } = accelRef.current;

    // Current angles (from last frame)
    let pitch = orientationRef.current.pitch;
    let roll  = orientationRef.current.roll;
    let yaw   = orientationRef.current.yaw;

    // 3) Integrate gyro for pitch/roll/yaw
    const pitchGyro = pitch + gx * dt; 
    const rollGyro  = roll  + gy * dt; 
    const yawGyro   = yaw   + gz * dt; // no magnetometer => can't correct yaw drift

    // 4) Detect if rocket is near rest:
    //    - gyro near zero, e.g. < 0.2 deg/s
    //    - accel near 9.81 ± 0.3
    const gyroMagnitude = Math.sqrt(gx*gx + gy*gy + gz*gz);
    const isGyroSmall = gyroMagnitude < 0.2;
    const accelMagnitude = Math.sqrt(ax*ax + ay*ay + az*az);
    const nominalGravity = 9.81;
    const gravityTolerance = 0.3;
    const isAccelNearGravity = Math.abs(accelMagnitude - nominalGravity) < gravityTolerance;

    const atRest = isGyroSmall && isAccelNearGravity;

    // 5) Convert accelerometer to angles (raw)
    let pitchAccRaw = 0;
    let rollAccRaw  = 0;
    if (!(ax === 0 && ay === 0 && az === 0)) {
      const pitchRad = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
      const rollRad  = Math.atan2(ay, az);
      pitchAccRaw = THREE.MathUtils.radToDeg(pitchRad);
      rollAccRaw  = THREE.MathUtils.radToDeg(rollRad);
    }

    // 6) Smooth the accel angles before using them in the complementary filter
    //    This helps kill random flicking.
    const accelFilterFactor = 0.95; // bigger => heavier smoothing
    // read previous smoothed angles
    let pitchAccSmoothed = accelAngleRef.current.pitch;
    let rollAccSmoothed  = accelAngleRef.current.roll;
    // update them
    pitchAccSmoothed = pitchAccSmoothed * accelFilterFactor 
                     + pitchAccRaw * (1 - accelFilterFactor);
    rollAccSmoothed  = rollAccSmoothed  * accelFilterFactor 
                     + rollAccRaw  * (1 - accelFilterFactor);

    // store back
    accelAngleRef.current.pitch = pitchAccSmoothed;
    accelAngleRef.current.roll  = rollAccSmoothed;

    // 7) Decide how much we trust the accelerometer
    //    - if rocket is at rest, might set orientation fully upright or use huge alpha
    //    - if rocket is accelerating, might ignore accel
    let alpha = 0.98;
    // If rocket is accelerating strongly or we see large thrust,
    // a separate approach might set alpha = 0.995. (You already have that logic.)
    // But let's do a "rest" override:
    if (atRest) {
      // E.g. raise alpha even more. 
      // Or skip gyro integration if you trust it’s actually at rest upright.
      alpha = 0.995;
    }

    // Combine angles with complementary filter
    let pitchNew = pitchGyro;
    let rollNew  = rollGyro;
    let yawNew   = yawGyro;  // still no magnetometer correction

    // If you want a “dynamic detection” to skip accel, you could do that here.
    // We'll do a simpler approach: always do partial fusion:
    pitchNew = alpha * pitchGyro + (1 - alpha) * pitchAccSmoothed;
    rollNew  = alpha * rollGyro  + (1 - alpha) * rollAccSmoothed;

    orientationRef.current.pitch = pitchNew % 360;
    orientationRef.current.roll  = rollNew  % 360;
    orientationRef.current.yaw   = yawNew   % 360;

    // 8) Apply rotation in Three.js (convert degrees -> radians)
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.degToRad(orientationRef.current.pitch);
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(orientationRef.current.yaw);
      groupRef.current.rotation.z = THREE.MathUtils.degToRad(orientationRef.current.roll);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // Handle resize
  const handleResize = () => {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  };
  window.addEventListener("resize", handleResize);

  // Return cleanup
  return () => {
    window.removeEventListener("resize", handleResize);
    cancelAnimationFrame(animationFrameRef.current);

    materials.forEach((m) => m.dispose());
    geometries.forEach((g) => g.dispose());

    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });

    controls.dispose();
    renderer.dispose();
    if (renderer.domElement && mount.contains(renderer.domElement)) {
      mount.removeChild(renderer.domElement);
    }
  };
}

/**
 * RocketModel - With a Smoother Complementary Filter
 * 
 * Props:
 *  - gyro_x, gyro_y, gyro_z    (deg/s)
 *  - accel_x, accel_y, accel_z (m/s^2)
 */
function RocketModel({
  gyro_x = 0, gyro_y = 0, gyro_z = 0,
  accel_x = 0, accel_y = 0, accel_z = 0,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);
  const groupRef = useRef(null);
  const rocketRef = useRef(null);

  // Latest sensor readings
  const gyroRef  = useRef({ x: 0, y: 0, z: 0 });
  const accelRef = useRef({ x: 0, y: 0, z: 0 });

  // Store orientation in degrees
  const orientationRef = useRef({ pitch: 0, roll: 0, yaw: 0 });

  // Store smoothed accel angles
  const accelAngleRef = useRef({ pitch: 0, roll: 0 });

  // Last frame time for dt
  const lastFrameTimeRef = useRef(performance.now());

  // 1) Init scene once
  useEffect(() => {
    const cleanup = initThreeScene({
      mountRef,
      sceneRef,
      rendererRef,
      groupRef,
      rocketRef,
      animationFrameRef,
      orientationRef,
      lastFrameTimeRef,
      gyroRef,
      accelRef,
      accelAngleRef,
    });
    return cleanup;
  }, []);

  // 2) On prop changes, update sensor refs
  useEffect(() => {
    gyroRef.current.x  = gyro_x;
    gyroRef.current.y  = gyro_y;
    gyroRef.current.z  = gyro_z;
    accelRef.current.x = accel_x;
    accelRef.current.y = accel_y;
    accelRef.current.z = accel_z;
  }, [gyro_x, gyro_y, gyro_z, accel_x, accel_y, accel_z]);

  return (
    <div ref={mountRef} style={{ width: "100%", height: "400px" }} />
  );
}

export default RocketModel;
