import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AxesHelper } from "three";
import KalmanAHRS from "./Kalman_filter";

function initThreeScene({
  mountRef,
  sceneRef,
  rendererRef,
  groupRef,
  rocketRef,
  animationFrameRef,
  kalmanRef,
  lastFrameTimeRef,
  gyroRef,
  accelRef,
  smoothOrientationRef
}) {
  const mount = mountRef.current;
  const scene = new THREE.Scene();
  sceneRef.current = scene;

  // Setup camera
  const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
  const dist = 8;
  const angle= Math.PI/4;
  camera.position.set(dist*Math.cos(angle), -dist*Math.cos(angle), dist*Math.sin(angle));
  camera.lookAt(0,0,0);

  // Reorient camera to Z-up
  const rotationMatrix= new THREE.Matrix4();
  rotationMatrix.makeRotationX(Math.PI/2);
  camera.up.applyMatrix4(rotationMatrix);

  // Renderer
  const renderer= new THREE.WebGLRenderer({antialias:true, alpha:true});
  rendererRef.current= renderer;
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.setClearColor(0x000000,0);
  renderer.physicallyCorrectLights= true;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.5;
  mount.appendChild(renderer.domElement);

  // OrbitControls
  const controls= new OrbitControls(camera, renderer.domElement);
  controls.enableDamping= true;
  controls.dampingFactor= 0.05;
  controls.minDistance=5;
  controls.maxDistance=15;
  controls.target.set(0,0,0);
  controls.update();

  // Light on camera
  const cameraLight= new THREE.SpotLight(0xffffff, 200);
  cameraLight.position.set(0,0,1);
  cameraLight.angle= Math.PI/2;
  cameraLight.penumbra=1;
  cameraLight.decay=0;
  camera.add(cameraLight);
  scene.add(camera);

  // For cleanup
  const materials= new Set();
  const geometries= new Set();

  // Create rocket group
  const group= new THREE.Group();
  groupRef.current= group;
  scene.add(group);

  // Axes helper
  const axesHelper= new AxesHelper(6);
  group.add(axesHelper);

  // Load rocket GLTF
  const loader= new GLTFLoader();
  loader.load(
    "/rocket_model.gltf",
    gltf =>{
      const rocket= gltf.scene;
      rocket.scale.set(0.5,0.5,0.5);
      rocket.rotation.x= Math.PI/2;
      rocket.rotation.order= "XYZ";
      rocket.position.set(0,0,0);

      rocket.traverse(node=>{
        if(node.isMesh){
          if(node.geometry) geometries.add(node.geometry);
          const mat= new THREE.MeshStandardMaterial({
            color:0xffffff, metalness:1.0, roughness:0.1
          });
          materials.add(mat);
          node.material= mat;
        }
      });
      group.add(rocket);
      rocketRef.current= rocket;
    },
    undefined,
    err=> console.error(err)
  );

  // Some thresholds akin to Python code
  const NOMINAL_GRAVITY=9.81;
  const ACCEL_THRESHOLD=2.5; // +/- from 9.81
  const GYRO_REST_THRESHOLD= THREE.MathUtils.degToRad(1.0); // <1 deg/s => "rest"
  const SMOOTH_FACTOR=0.2; // orientation smoothing

  // Animation Loop
  function animate(){
    animationFrameRef.current = requestAnimationFrame(animate);

    const currentTime= performance.now();
    const deltaMs= currentTime- lastFrameTimeRef.current;
    lastFrameTimeRef.current= currentTime;
    const dt= deltaMs/1000;

    // Retrieve sensor data
    const {x: gxDeg, y: gyDeg, z: gzDeg} = gyroRef.current; 
    let {x: ax, y: ay, z: az} = accelRef.current;

    // Convert gyro to rad/s
    const gxRad= THREE.MathUtils.degToRad(gxDeg);
    const gyRad= THREE.MathUtils.degToRad(gyDeg);
    const gzRad= THREE.MathUtils.degToRad(gzDeg);

    if(dt> 0) {
      kalmanRef.current.sampleFreq= 1/dt;
    }

    // Zero out accel if net accel far from 1g (like Python)
    const accelMag= Math.sqrt(ax*ax + ay*ay + az*az);
    const diffFromG= Math.abs(accelMag- NOMINAL_GRAVITY);
    if(diffFromG> ACCEL_THRESHOLD){
      ax=0; ay=0; az=0;
    }

    // Kalman update
    kalmanRef.current.update(gxRad, gyRad, gzRad, ax, ay, az);

    // Check if rocket is at rest: near 1g and small gyro
    const gyroMag= Math.sqrt(gxRad*gxRad + gyRad*gyRad + gzRad*gzRad);
    const atRest= (diffFromG < 0.8) && (gyroMag< GYRO_REST_THRESHOLD);

    // Get raw Kalman angles in deg
    let {roll, pitch, yaw} = kalmanRef.current.getEulerAnglesDeg();

    // If at rest, gently push pitch/roll ~0
    if(atRest){
      roll=  roll* 0.9;
      pitch= pitch*0.9;
    }

    // Smoothing final orientation
    let {roll: oldR, pitch: oldP, yaw: oldY} = smoothOrientationRef.current;

    const newRoll  = oldR + SMOOTH_FACTOR*(roll- oldR);
    const newPitch = oldP + SMOOTH_FACTOR*(pitch- oldP);
    const newYaw   = oldY + SMOOTH_FACTOR*(yaw- oldY);

    smoothOrientationRef.current.roll  = newRoll;
    smoothOrientationRef.current.pitch = newPitch;
    smoothOrientationRef.current.yaw   = newYaw;

    // Apply to 3D rocket
    group.rotation.x= THREE.MathUtils.degToRad(newPitch);
    group.rotation.y= THREE.MathUtils.degToRad(newYaw);
    group.rotation.z= THREE.MathUtils.degToRad(newRoll);

    renderer.render(scene, camera);
  }
  animate();

  function handleResize(){
    camera.aspect= mount.clientWidth/mount.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(mount.clientWidth, mount.clientHeight);
  }
  window.addEventListener("resize", handleResize);

  return ()=>{
    window.removeEventListener("resize", handleResize);
    cancelAnimationFrame(animationFrameRef.current);
    materials.forEach(m=>m.dispose());
    geometries.forEach(g=>g.dispose());
    scene.traverse(obj=>{
      if(obj.geometry) obj.geometry.dispose();
      if(obj.material){
        if(Array.isArray(obj.material)) obj.material.forEach(mt=>mt.dispose());
        else obj.material.dispose();
      }
    });
    renderer.dispose();
    if(renderer.domElement&& mount.contains(renderer.domElement)){
      mount.removeChild(renderer.domElement);
    }
  };
}

function RocketModel({
  gyro_x=0, gyro_y=0, gyro_z=0,
  accel_x=0, accel_y=0, accel_z=0,
}) {
  const mountRef= useRef(null);
  const sceneRef= useRef(null);
  const rendererRef= useRef(null);
  const animationFrameRef= useRef(null);

  const groupRef= useRef(null);
  const rocketRef= useRef(null);

  const gyroRef= useRef({x:0,y:0,z:0});
  const accelRef= useRef({x:0,y:0,z:0});

  const kalmanRef= useRef(null);
  const smoothOrientationRef= useRef({roll:0,pitch:0,yaw:0});
  const lastFrameTimeRef= useRef(performance.now());

  useEffect(()=>{
    // Construct the KalmanAHRS
    kalmanRef.current= new KalmanAHRS(100);

    const cleanup= initThreeScene({
      mountRef, sceneRef, rendererRef, groupRef,
      rocketRef, animationFrameRef, kalmanRef,
      lastFrameTimeRef, gyroRef, accelRef, smoothOrientationRef
    });
    return cleanup;
  },[]);

  // Update sensor data from props
  useEffect(()=>{
    gyroRef.current.x= gyro_x;
    gyroRef.current.y= gyro_y;
    gyroRef.current.z= gyro_z;

    accelRef.current.x= accel_x;
    accelRef.current.y= accel_y;
    accelRef.current.z= accel_z;
  },[gyro_x, gyro_y, gyro_z, accel_x, accel_y, accel_z]);

  return(
    <div ref={mountRef} style={{width:'100%', height:'400px'}}/>
  );
}

export default RocketModel;
