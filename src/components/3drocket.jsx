import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function RocketModel({ gyro_x, gyro_y, gyro_z }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Current actual rotation in the scene
  const currentRotationRef = useRef(new THREE.Euler(0, 0, 0, 'XYZ'));

  // Target rotation we want to lerp toward
  const targetRotationRef = useRef(new THREE.Euler(0, 0, 0, 'XYZ'));

  const rocketRef = useRef(null);
  const groupRef = useRef(null);

  // Lerp factor
  const lerpFactor = 0.1;

  // ------------------------------
  // 1) Create Scene ONCE
  // ------------------------------
  useEffect(() => {
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

    // Store materials and geometries for proper cleanup
    const materials = new Set();
    const geometries = new Set();

    // Create a group and add to scene
    const group = new THREE.Group();
    groupRef.current = group;
    scene.add(group);

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
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // Lerp the group's rotation to the target
      if (!document.hidden && groupRef.current) {
        groupRef.current.rotation.x +=
          (targetRotationRef.current.x - groupRef.current.rotation.x) * lerpFactor;
        groupRef.current.rotation.y +=
          (targetRotationRef.current.y - groupRef.current.rotation.y) * lerpFactor;
        groupRef.current.rotation.z +=
          (targetRotationRef.current.z - groupRef.current.rotation.z) * lerpFactor;
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
      cancelAnimationFrame(animationFrameRef.current);
      
      // Cleanup materials
      materials.forEach(material => {
        material.dispose();
      });

      // Cleanup geometries
      geometries.forEach(geometry => {
        geometry.dispose();
      });

      // Cleanup scene
      scene.traverse(object => {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
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