import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function RocketModel({ gyro_x, gyro_y, gyro_z }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0); // Set background to transparent
    renderer.physicallyCorrectLights = true; // Enable physical lighting
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better tone mapping
    renderer.toneMappingExposure = 1.5; // Increase exposure
    mount.appendChild(renderer.domElement);

    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smooth camera movement
    controls.dampingFactor = 0.05;
    controls.minDistance = 5; // Minimum zoom distance
    controls.maxDistance = 15; // Maximum zoom distance

    // Add light that follows camera
    const cameraLight = new THREE.SpotLight(0xffffff, 200);
    cameraLight.position.set(0, 0, 1); // Slightly in front of camera
    cameraLight.angle = Math.PI / 2;
    cameraLight.penumbra = 1;
    cameraLight.decay = 0; // No decay for consistent lighting
    camera.add(cameraLight); // Attach light to camera
    scene.add(camera); // Add camera to scene to include its children

    // Load 3D model with enhanced materials
    const loader = new GLTFLoader();
    let rocket;
    loader.load('/rocket_model.gltf', (gltf) => {
      rocket = gltf.scene;
      rocket.scale.set(0.5, 0.5, 0.5);
      rocket.traverse((node) => {
        if (node.isMesh) {
          const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 1.0, // Slightly reduced metalness
            roughness: 0.1, // Slightly increased roughness
          });
          node.material = material;
        }
      });
      scene.add(rocket);
    }, undefined, (error) => {
      console.error(error);
    });

    camera.position.z = 10; // Adjusted camera position

    const animate = () => {
      requestAnimationFrame(animate);
      if (rocket) {
        rocket.rotation.x = gyro_x;
        rocket.rotation.y = gyro_y;
        rocket.rotation.z = gyro_z;
      }
      controls.update(); // Update controls in animation loop
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      controls.dispose(); // Clean up controls
      window.removeEventListener('resize', handleResize);
      mount.removeChild(renderer.domElement);
    };
  }, [gyro_x, gyro_y, gyro_z]);

  return <div ref={mountRef} style={{ width: "100%", height: "400px" }} />;
}

export default RocketModel;
