import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

function initThreeScene({
  mountRef,
  sceneRef,
  rendererRef,
  groupRef,
  rocketRef,
  animationFrameRef,
  gyroRef,        // We'll read from this ref each frame
  orientationRef, // We'll store rocket orientation in degrees here
  lastFrameTimeRef
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

  // Store materials and geometries for cleanup
  const materials = new Set();
  const geometries = new Set();

  // Create a group and add it to the scene
  const group = new THREE.Group();
  groupRef.current = group;
  scene.add(group);

  // Load rocket model
  const loader = new GLTFLoader();
  loader.load(
    "/rocket_model.gltf",
    (gltf) => {
      const rocket = gltf.scene;
      rocket.scale.set(0.5, 0.5, 0.5);
      rocket.rotation.order = "XYZ";
      rocket.position.set(0, -2.7, 0);

      // Collect geometries/materials for cleanup
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

    // Time-based integration
    const currentTime = performance.now();
    const deltaMs = currentTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = currentTime;
    const deltaSec = deltaMs / 1000;

    // 1) Read latest gyro rates (deg/s)
    const { x: gx, y: gy, z: gz } = gyroRef.current;
    // 2) Integrate to get orientation in degrees
    orientationRef.current.x += gx * deltaSec;
    orientationRef.current.y += gy * deltaSec;
    orientationRef.current.z += gz * deltaSec;

    // Optional: keep angles in [0..360)
    orientationRef.current.x %= 360;
    orientationRef.current.y %= 360;
    orientationRef.current.z %= 360;

    // Convert to radians for Three.js (note "MathUtils" not "Math")
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.degToRad(orientationRef.current.x);
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(orientationRef.current.y);
      groupRef.current.rotation.z = THREE.MathUtils.degToRad(orientationRef.current.z);
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

  // Return a cleanup function
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

function RocketModel({ gyro_x, gyro_y, gyro_z }) {
  // Refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);

  const groupRef = useRef(null);
  const rocketRef = useRef(null);

  // Store the latest gyro readings
  const gyroRef = useRef({ x: 0, y: 0, z: 0 });

  // Orientation in degrees
  const orientationRef = useRef({ x: 0, y: 0, z: 0 });

  // Keep track of last frame time to compute delta t
  const lastFrameTimeRef = useRef(performance.now());

  // 1) Scene Initialization
  useEffect(() => {
    const cleanup = initThreeScene({
      mountRef,
      sceneRef,
      rendererRef,
      groupRef,
      rocketRef,
      animationFrameRef,
      gyroRef,
      orientationRef,
      lastFrameTimeRef,
    });
    return cleanup;
  }, []);

  // 2) Listen for changes in gyro props and update gyroRef
  useEffect(() => {
    gyroRef.current.x = gyro_x;
    gyroRef.current.y = gyro_y;
    gyroRef.current.z = gyro_z;
  }, [gyro_x, gyro_y, gyro_z]);

  return <div ref={mountRef} style={{ width: "100%", height: "400px" }} />;
}

export default RocketModel;
