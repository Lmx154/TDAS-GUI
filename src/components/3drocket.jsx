import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AxesHelper } from "three";

import MadgwickAHRS from "./Madgwick_filter"; // <-- Make sure this path is correct

function initThreeScene({
  mountRef,
  sceneRef,
  rendererRef,
  groupRef,
  rocketRef,
  animationFrameRef,
  madgwickRef,
  lastFrameTimeRef,
  gyroRef,
  accelRef
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

  // Position camera for Z-up
  const distance = 8;
  const angle = Math.PI / 4; // 45 degrees
  camera.position.set(
    distance * Math.cos(angle),
    -distance * Math.cos(angle),
    distance * Math.sin(angle)
  );
  camera.lookAt(0, 0, 0);

  // Reorient camera so +Z is up in view
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
  controls.target.set(0, 0, 0);
  controls.update();

  // Light attached to camera
  const cameraLight = new THREE.SpotLight(0xffffff, 200);
  cameraLight.position.set(0, 0, 1);
  cameraLight.angle = Math.PI / 2;
  cameraLight.penumbra = 1;
  cameraLight.decay = 0;
  camera.add(cameraLight);
  scene.add(camera);

  // For disposing geometry, etc.
  const materials = new Set();
  const geometries = new Set();

  // Create a group for the rocket
  const group = new THREE.Group();
  groupRef.current = group;
  scene.add(group);

  // Add an AxesHelper to visualize X (red), Y (green), Z (blue)
  const axesHelper = new AxesHelper(6);
  group.add(axesHelper);

  // Load rocket glTF
  const loader = new GLTFLoader();
  loader.load(
    "/rocket_model.gltf",
    (gltf) => {
      const rocket = gltf.scene;
      rocket.scale.set(0.5, 0.5, 0.5);

      // Rotate rocket so nose points up +Z
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

  // Parameters for adaptive accel weighting
  const NOMINAL_GRAVITY = 9.81;
  const ACCEL_THRESHOLD = 2.5; // how far from 9.81 before we reduce accel correction
  const NORMAL_BETA = 0.1;
  const REDUCED_BETA = 0.01;   // smaller -> trust accel less

  // Animation loop
  function animate() {
    animationFrameRef.current = requestAnimationFrame(animate);

    // Time step
    const currentTime = performance.now();
    const deltaMs = currentTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = currentTime;
    const dt = deltaMs / 1000; // seconds

    // Get current sensor data
    // Gyro in deg/sec, accel in m/s^2
    const { x: gxDeg, y: gyDeg, z: gzDeg } = gyroRef.current;
    const { x: ax, y: ay, z: az } = accelRef.current;

    // Madgwick wants gyro in rad/s
    const gxRad = THREE.MathUtils.degToRad(gxDeg);
    const gyRad = THREE.MathUtils.degToRad(gyDeg);
    const gzRad = THREE.MathUtils.degToRad(gzDeg);

    // Update the Madgwick sample frequency
    const sampleFreq = dt > 0 ? 1 / dt : 100; // fallback if dt=0
    madgwickRef.current.sampleFreq = sampleFreq;

    // ---- Adaptive weighting logic ----
    // If net accel is far from 1g, we assume rocket is under heavy thrust or other linear acceleration
    const accelMagnitude = Math.sqrt(ax * ax + ay * ay + az * az);
    const diffFromG = Math.abs(accelMagnitude - NOMINAL_GRAVITY);

    if (diffFromG > ACCEL_THRESHOLD) {
      // Rocket is accelerating strongly -> reduce beta so we trust accel less
      madgwickRef.current.beta = REDUCED_BETA;
    } else {
      // Normal flight or at rest -> normal beta
      madgwickRef.current.beta = NORMAL_BETA;
    }

    // Update Madgwick filter (no magnetometer)
    madgwickRef.current.update(gxRad, gyRad, gzRad, ax, ay, az);

    // Get Euler angles from the filter in degrees
    const { roll, pitch, yaw } = madgwickRef.current.getEulerAnglesDeg();

    // Convert to radians for Three.js
    // Mapping: pitch->X, yaw->Y, roll->Z
    group.rotation.x = THREE.MathUtils.degToRad(pitch);
    group.rotation.y = THREE.MathUtils.degToRad(yaw);
    group.rotation.z = THREE.MathUtils.degToRad(roll);

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

  // Cleanup
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
 * RocketModel - Using MadgwickAHRS for orientation with adaptive accel weighting
 * 
 * Props:
 *  gyro_x, gyro_y, gyro_z: gyroscope in deg/s
 *  accel_x, accel_y, accel_z: accelerometer in m/s^2
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

  const gyroRef  = useRef({ x: 0, y: 0, z: 0 });
  const accelRef = useRef({ x: 0, y: 0, z: 0 });

  // We'll store the Madgwick instance here
  const madgwickRef = useRef(null);

  // Last frame time
  const lastFrameTimeRef = useRef(performance.now());

  useEffect(() => {
    // 1) Initialize the Madgwick filter once
    // sampleFreq=100 Hz, beta=0.1 -> will be updated if acceleration is large
    madgwickRef.current = new MadgwickAHRS(100, 0.1);

    // 2) Initialize Three.js scene
    const cleanup = initThreeScene({
      mountRef,
      sceneRef,
      rendererRef,
      groupRef,
      rocketRef,
      animationFrameRef,
      madgwickRef,
      lastFrameTimeRef,
      gyroRef,
      accelRef
    });
    return cleanup;
  }, []);

  // On each prop change, update the sensor refs
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
