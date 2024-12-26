import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function RocketModel({ 
  Accel_ZArray,
  Accel_xArray,
  Accel_yArray,
  gxArray,
  gyArray,
  gzArray 
}) {
  const [fps, setFps] = useState(0);
  const [calculatedOrientation, setCalculatedOrientation] = useState({
    pitch: 0,
    roll: 0,
    yaw: 0
  });
  const mountRef = useRef(null);
  const targetRotation = useRef(new THREE.Euler(0, 0, 0, 'XYZ'));
  const lerpFactor = 0.1;

  // Calculate orientation from sensor data
  useEffect(() => {
    if (
      Accel_ZArray.length &&
      Accel_xArray.length &&
      Accel_yArray.length &&
      gxArray.length &&
      gyArray.length &&
      gzArray.length
    ) {
      const ax = Accel_xArray.at(-1);
      const ay = Accel_yArray.at(-1);
      const az = Accel_ZArray.at(-1);
      const gx = gxArray.at(-1);
      const gy = gyArray.at(-1);
      const gz = gzArray.at(-1);

      const pitch = Math.atan2(ax, Math.sqrt(ay * ay + az * az));
      const roll = Math.atan2(ay, Math.sqrt(ax * ax + az * az));
      const yaw = gz; // Simplified yaw calculation

      setCalculatedOrientation({ pitch, roll, yaw });
      targetRotation.current.set(pitch, roll, yaw);
    }
  }, [Accel_ZArray, Accel_xArray, Accel_yArray, gxArray, gyArray, gzArray]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Initialize Scene
    const scene = new THREE.Scene();

    // Setup Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 10);

    // Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    Object.assign(renderer, {
      physicallyCorrectLights: true,
      toneMapping: THREE.ACESFilmicToneMapping,
      toneMappingExposure: 1.5,
      outputEncoding: THREE.sRGBEncoding,
      shadowMap: { enabled: true, type: THREE.PCFSoftShadowMap },
    });
    mount.appendChild(renderer.domElement);

    // Setup Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    Object.assign(controls, {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 5,
      maxDistance: 15,
    });

    // Add Lighting
    const light = new THREE.SpotLight(0xffffff, 200, 0, Math.PI / 2, 1, 0);
    light.position.set(0, 0, 1);
    camera.add(light);
    scene.add(camera);

    // Load Rocket Model
    const group = new THREE.Group();
    scene.add(group);
    const loader = new GLTFLoader();
    loader.load(
      '/rocket_model.gltf',
      (gltf) => {
        const rocket = gltf.scene;
        rocket.scale.set(0.5, 0.5, 0.5);
        rocket.position.set(0, -2.7, 0);
        rocket.traverse(node => {
          if (node.isMesh) {
            node.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 1.0,
              roughness: 0.1,
            });
          }
        });
        group.add(rocket);
      },
      undefined,
      console.error
    );

    // FPS Tracking
    let frameCount = 0;
    let lastTime = performance.now();

    // Animation Loop
    const animate = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }

      // Smooth Rotation using calculated orientation
      ['x', 'y', 'z'].forEach(axis => {
        group.rotation[axis] += (targetRotation.current[axis] - group.rotation[axis]) * lerpFactor;
      });

      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Handle Window Resize
    const handleResize = () => {
      const { clientWidth, clientHeight } = mount;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse(object => {
        if (object.isMesh) {
          object.geometry.dispose();
          Array.isArray(object.material)
            ? object.material.forEach(mat => mat.dispose())
            : object.material.dispose();
        }
      });
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0, 0, 0, 0.5)',
          color: '#00ff00',
          padding: '5px 10px',
          borderRadius: '3px',
          fontFamily: 'monospace',
          zIndex: 1000,
          textShadow: '0 0 2px #00ff00',
        }}
      >
        {fps} FPS
      </div>
      <div ref={mountRef} style={{ width: "100%", height: "400px" }} />
    </div>
  );
}

export default RocketModel;
