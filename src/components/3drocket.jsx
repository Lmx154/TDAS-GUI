import React, { useRef, useEffect } from "react";
import * as THREE from "three";

function RocketModel({ gyro_x, gyro_y, gyro_z }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(0.1, 1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const stick = new THREE.Mesh(geometry, material);
    scene.add(stick);

    camera.position.z = 5;

    const animate = () => {
      requestAnimationFrame(animate);
      stick.rotation.x = gyro_x;
      stick.rotation.y = gyro_y;
      stick.rotation.z = gyro_z;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mount.removeChild(renderer.domElement);
    };
  }, [gyro_x, gyro_y, gyro_z]);

  return <div ref={mountRef} style={{ width: "100%", height: "400px" }} />;
}

export default RocketModel;
