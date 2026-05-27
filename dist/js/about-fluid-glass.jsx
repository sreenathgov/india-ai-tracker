/* eslint-disable react/no-unknown-property */
// FluidGlass concept adapted from React Bits (MIT) — https://github.com/DavidHDev/react-bits
//
// Stripped-down lens variant for the Kanan Labs About page hero.
// - Renders only the lens (no nav items, no scroll typography, no demo images).
// - Refracts whatever sits behind the canvas via backdrop chromaticAberration.
// - Cursor-followed via easing.damp3 from maath.
// - Transparent clear so the page hero text remains the actual background.

import * as THREE from 'three';
import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import { easing } from 'maath';

const LENS_GLB_PATH = '/added-assets/3d/lens.glb';
// Self-hosted CC0 studio HDRI (Poly Haven, downscaled to 512px).  Same-origin
// so the existing CSP (default-src 'self') covers the fetch; without this the
// transmission material has nothing to reflect and renders as a dark disc.
const ENV_HDR_PATH = '/added-assets/3d/env/studio.hdr';

function Lens() {
  const ref = useRef();
  const { nodes } = useGLTF(LENS_GLB_PATH);
  const geoWidthRef = useRef(1);

  useEffect(() => {
    const geo = nodes?.Cylinder?.geometry;
    if (!geo) return;
    geo.computeBoundingBox();
    geoWidthRef.current = geo.boundingBox.max.x - geo.boundingBox.min.x || 1;
  }, [nodes]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const { viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);

    // Smoothly track the cursor in world space
    const destX = (pointer.x * v.width) / 2;
    const destY = (pointer.y * v.height) / 2;
    easing.damp3(ref.current.position, [destX, destY, 15], 0.18, delta);
  });

  if (!nodes?.Cylinder?.geometry) return null;

  return (
    <mesh
      ref={ref}
      scale={0.28}
      rotation-x={Math.PI / 2}
      geometry={nodes.Cylinder.geometry}
    >
      <MeshTransmissionMaterial
        ior={1.25}
        thickness={3}
        anisotropy={0.05}
        anisotropicBlur={0.1}
        chromaticAberration={0.18}
        transmission={0.92}
        roughness={0.05}
        metalness={0.05}
        backside={true}
      />
    </mesh>
  );
}

export default function AboutFluidGlass() {
  // Disable the lens on small viewports (cursor-follow is meaningless on touch)
  // and avoid the 250KB+ GPU cost on mobile.
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    if (window.matchMedia?.('(max-width: 767px)').matches) return false;
    if (window.matchMedia?.('(pointer: coarse)').matches) return false;
    return true;
  });

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px), (pointer: coarse), (prefers-reduced-motion: reduce)');
    const onChange = () => setEnabled(!mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  if (!enabled) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 20], fov: 15 }}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(0x000000), 0);
      }}
      dpr={[1, 2]}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        background: 'transparent',
      }}
    >
      <ambientLight intensity={0.6} />
      {/* HDRI environment gives the transmission material specular highlights
          and edge reflections to bounce — without it the lens reads as a flat
          dark disc on the navy hero. background={false} keeps the canvas clear. */}
      <Environment files={ENV_HDR_PATH} background={false} />
      <Lens />
    </Canvas>
  );
}

useGLTF.preload(LENS_GLB_PATH);
