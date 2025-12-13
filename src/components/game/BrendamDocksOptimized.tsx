'use client';

import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface BrendamDocksProps {
    scale?: number;
    position?: [number, number, number];
    maxDistance?: number;
}

/**
 * Brendam Docks – Roblox-like Environment
 * ✅ No wall hack
 * ✅ BVHEcctrl compatible
 * ✅ Static + performant
 */
export function BrendamDocksOptimized({
    scale = 0.01,
    position = [0, 0, 0],
    maxDistance = 50000, // ✅ Disabled culling - map always visible
}: BrendamDocksProps) {
    const { scene } = useGLTF('/brendam_docks.glb');
    const groupRef = useRef<THREE.Group>(null);

    /**
     * 🔧 FIX MATERIAL & WALL-HACK
     * - DoubleSide untuk thin geometry
     * - Matikan fitur berat
     * - Tetap pakai texture asli
     */
    useEffect(() => {
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.frustumCulled = true;
                child.castShadow = false;
                child.receiveShadow = false;

                // Handle multi-material
                const materials = Array.isArray(child.material)
                    ? child.material
                    : [child.material];

                materials.forEach((material: any) => {
                    if (!material) return;

                    // ✅ WALL HACK FIX
                    material.side = THREE.DoubleSide;

                    // ✅ SAFE DEPTH
                    material.depthWrite = true;
                    material.depthTest = true;
                    material.transparent = false;

                    // ✅ Roblox-like flat look
                    if ('metalness' in material) material.metalness = 0;
                    if ('roughness' in material) material.roughness = 1;
                    if ('envMapIntensity' in material) material.envMapIntensity = 0;

                    material.needsUpdate = true;
                });

                // ⚠️ BVHEcctrl collision flags
                child.userData.isGround = true;
                child.userData.isCollider = true;
            }
        });
    }, [scene]);

    /**
     * 🌍 Distance Culling (Open World)
     */
    useFrame(({ camera }) => {
        if (!groupRef.current) return;

        const dist = camera.position.distanceTo(
            new THREE.Vector3(...position)
        );

        groupRef.current.visible = dist < maxDistance;
    });

    return (
        <group
            ref={groupRef}
            position={position}
            scale={scale}
            dispose={null}
        >
            <primitive object={scene} />
        </group>
    );
}

/**
 * 🚀 Non-blocking preload
 */
if (typeof window !== 'undefined') {
    setTimeout(() => {
        useGLTF.preload('/brendam_docks.glb');
    }, 2000);
}
