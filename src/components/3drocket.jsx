import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function RocketModel({ gyro_x, gyro_y, gyro_z }) {
  const mountRef = useRef(null);

  // Current actual rotation in the scene
  const currentRotationRef = useRef(new THREE.Euler(0, 0, 0, 'XYZ'));

  // Target rotation we want to lerp toward
  const targetRotationRef = useRef(new THREE.Euler(0, 0, 0, 'XYZ'));

  const rocketRef = useRef(null);
  const orientationStickRef = useRef(null);

  // Lerp factor
  const lerpFactor = 0.1;

  // ------------------------------
  // 1) Create Scene ONCE
  // ------------------------------
  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();

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

    // Orientation "stick"
    const stickGeometry = new THREE.BoxGeometry(0.1, 5, 0.1);
    const stickMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const orientationStick = new THREE.Mesh(stickGeometry, stickMaterial);
    orientationStick.rotation.order = 'XYZ';
    orientationStick.position.set(0, 0, 0);
    orientationStickRef.current = orientationStick;
    scene.add(orientationStick);

    // Load rocket
    const loader = new GLTFLoader();
    loader.load(
      '/rocket_model.gltf',
      (gltf) => {
        const rocket = gltf.scene;
        rocket.scale.set(0.5, 0.5, 0.5);
        rocket.rotation.order = 'XYZ';
        rocket.position.set(0, -2.7, 0);

        rocket.traverse((node) => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 1.0,
              roughness: 0.1,
            });
          }
        });

        scene.add(rocket);
        rocketRef.current = rocket;
      },
      undefined,
      (error) => {
        console.error(error);
      }
    );

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Lerp the rocket’s rotation to the target
      if (rocketRef.current) {
        currentRotationRef.current.x +=
          (targetRotationRef.current.x - currentRotationRef.current.x) * lerpFactor;
        currentRotationRef.current.y +=
          (targetRotationRef.current.y - currentRotationRef.current.y) * lerpFactor;
        currentRotationRef.current.z +=
          (targetRotationRef.current.z - currentRotationRef.current.z) * lerpFactor;

        rocketRef.current.rotation.x = currentRotationRef.current.x;
        rocketRef.current.rotation.y = currentRotationRef.current.y;
        rocketRef.current.rotation.z = currentRotationRef.current.z;

        orientationStickRef.current.rotation.x = currentRotationRef.current.x;
        orientationStickRef.current.rotation.y = currentRotationRef.current.y;
        orientationStickRef.current.rotation.z = currentRotationRef.current.z;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      if (renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // ------------------------------
  // 2) Update target rotation 
  // ------------------------------
  useEffect(() => {
    // If your data is absolute angles, *and* you know
    // that (0,0,0) means "invalid" or "don't update",
    // you can just ignore it:
    if (!(gyro_x === 0 && gyro_y === 0 && gyro_z === 0)) {
      targetRotationRef.current.x = gyro_x;
      targetRotationRef.current.y = gyro_y;
      targetRotationRef.current.z = gyro_z;
    }
  }, [gyro_x, gyro_y, gyro_z]);

  return <div ref={mountRef} style={{ width: "100%", height: "400px" }} />;
}

export default RocketModel;
