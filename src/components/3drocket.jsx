import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

/**
 * initThreeScene - sets up scene, camera, renderer, rocket group, etc.
 * Returns a cleanup function.
 */
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
  camera.position.z = 10;

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
  loader.load(
    "/rocket_model.gltf",
    (gltf) => {
      const rocket = gltf.scene;
      rocket.scale.set(0.5, 0.5, 0.5);
      rocket.rotation.order = "XYZ";
      rocket.position.set(0, -2.7, 0);

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

    // 3) Convert gyro from deg/s -> deg for this dt
    //    We'll do everything in degrees for pitch/roll/yaw, then convert to radians for Three.js

    // Current angles (from last frame)
    let pitch = orientationRef.current.pitch;
    let roll  = orientationRef.current.roll;
    let yaw   = orientationRef.current.yaw;

    // Integrate gyro
    const pitchGyro = pitch + gx * dt; 
    const rollGyro  = roll  + gy * dt; 
    const yawGyro   = yaw   + gz * dt; // No magnetometer => can't correct yaw drift easily

    // 4) Estimate pitch, roll from accel to correct drift
    //    Convert to degrees
    //    pitch_acc = atan2(-accX, sqrt(accY^2 + accZ^2))
    //    roll_acc  = atan2(accY, accZ)
    //    (Be mindful of coordinate orientation; might need to invert signs.)
    let pitchAcc = 0;
    let rollAcc = 0;
    if (!(ax === 0 && ay === 0 && az === 0)) {
      // Calculate in radians:
      const pitchRad = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
      const rollRad  = Math.atan2(ay, az);

      // Convert to degrees
      pitchAcc = THREE.MathUtils.radToDeg(pitchRad);
      rollAcc  = THREE.MathUtils.radToDeg(rollRad);
    }

    // 5) Complementary filter
    const alpha = 0.98; // 98% gyro, 2% accel
    const pitchNew = alpha * pitchGyro + (1 - alpha) * pitchAcc;
    const rollNew  = alpha * rollGyro  + (1 - alpha) * rollAcc;
    const yawNew   = yawGyro; // no correction for yaw (no magnetometer)

    // Store back
    orientationRef.current.pitch = pitchNew;
    orientationRef.current.roll  = rollNew;
    orientationRef.current.yaw   = yawNew;

    // 6) Optional: keep angles in [0..360) to avoid large numbers
    orientationRef.current.pitch %= 360;
    orientationRef.current.roll  %= 360;
    orientationRef.current.yaw   %= 360;

    // 7) Apply rotation in Three.js (convert degrees -> radians)
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
 * RocketModel - With Basic Complementary Filter
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

  // Latest sensor readings in refs
  const gyroRef  = useRef({ x: 0, y: 0, z: 0 });
  const accelRef = useRef({ x: 0, y: 0, z: 0 });

  // Store orientation in degrees
  const orientationRef = useRef({ pitch: 0, roll: 0, yaw: 0 });

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
