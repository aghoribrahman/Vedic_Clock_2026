/**
 * Earth3D — A high-resolution 3D rotating Earth globe rendered with
 * React Three Fiber + Three.js.
 *
 * Replaces the previous video-based earth (Rotating_Earth.mp4) with a
 * real-time WebGL sphere textured with a NASA Blue Marble equirectangular
 * map. Features:
 *   - Smooth auto-rotation
 *   - Realistic directional + ambient lighting
 *   - Subtle atmosphere glow via a custom Fresnel-based shader
 *   - Transparent background so the clock dial frame overlays cleanly
 */

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree, extend } from '@react-three/fiber';
import { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js';

extend({ OrbitControlsImpl });
import * as THREE from 'three';
import { View, Platform } from 'react-native';

// ── Earth texture asset ────────────────────────────────────────────────
// Using require() for Metro bundler compatibility (Expo/RN).
// On web this resolves to a URL; on native it resolves to a local asset.
const EARTH_TEXTURE = require('../../assets/earth.jpg');
const EARTH_NORMAL = require('../../assets/images/earth_normal.jpg');
const EARTH_SPECULAR = require('../../assets/images/earth_specular.jpg');
const EARTH_CLOUDS = require('../../assets/images/earth_clouds.png');
const EARTH_NIGHT = require('../../assets/images/earth_night.jpg');

interface Earth3DProps {
  /** Diameter in logical pixels for the container */
  size: number;
}

// ── Inner Three.js scene components ────────────────────────────────────

/**
 * The Earth sphere mesh — auto-rotates and applies the day-map texture.
 */
function EarthSphere(): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);

  // Load the Earth textures
  const [dayMap, normalMap, specularMap, nightMap] = useLoader(THREE.TextureLoader, [
    resolveAssetUri(EARTH_TEXTURE),
    resolveAssetUri(EARTH_NORMAL),
    resolveAssetUri(EARTH_SPECULAR),
    resolveAssetUri(EARTH_NIGHT),
  ]);

  const { gl } = useThree();
  const maxAnisotropy = useMemo(() => gl.capabilities.getMaxAnisotropy(), [gl]);

  // Configure texture for best quality
  useMemo(() => {
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.anisotropy = maxAnisotropy;
    nightMap.anisotropy = maxAnisotropy;
    normalMap.anisotropy = maxAnisotropy;
    specularMap.anisotropy = maxAnisotropy;
  }, [dayMap, nightMap, normalMap, specularMap, maxAnisotropy]);

  // Slow continuous rotation
  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.04 * delta; // ~2.4° per second
    }
  });

  return (
    <mesh ref={meshRef} rotation={[0, 0, 23.44 * (Math.PI / 180)]}>
      <sphereGeometry args={[1, 256, 256]} />
      <meshPhongMaterial
        map={dayMap}
        normalMap={normalMap}
        specularMap={specularMap}
        specular={new THREE.Color(0x333333)}
        shininess={15}
        onBeforeCompile={(shader) => {
          shader.uniforms.tNight = { value: nightMap };

          shader.fragmentShader = `
            uniform sampler2D tNight;
            ${shader.fragmentShader}
          `;

          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <emissivemap_fragment>',
            `
            #include <emissivemap_fragment>
            
            vec4 nightColor = texture2D( tNight, vMapUv );
            
            // Assume sun light is at [5.0, 3.0, 5.0] in world space
            vec3 lightDirWorld = normalize(vec3(5.0, 3.0, 5.0));
            vec3 lightDirView = normalize((viewMatrix * vec4(lightDirWorld, 0.0)).xyz);
            
            // Dot product of normal and light dir
            float nDotL = dot(vNormal, lightDirView);
            
            // When nDotL is less than 0, it is night. Smoothstep gives a soft terminator.
            float nightFactor = smoothstep(0.1, -0.2, nDotL);
            
            // Add night lights to totalEmissiveRadiance
            totalEmissiveRadiance += nightColor.rgb * nightFactor * vec3(1.0, 0.9, 0.8) * 1.5;
            `
          ).replace(
            '#include <specularmap_fragment>',
            `
            #include <specularmap_fragment>
            #ifdef USE_SPECULARMAP
              // Darken the water where specular map is bright
              diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.4, specularStrength);
            #endif
            `
          );
        }}
      />
    </mesh>
  );
}

/**
 * Cloud layer — slightly larger sphere wrapping the Earth.
 */
function CloudSphere(): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudMap = useLoader(THREE.TextureLoader, resolveAssetUri(EARTH_CLOUDS));

  useFrame((_state, delta) => {
    if (meshRef.current) {
      // Clouds rotate slightly faster than the earth
      meshRef.current.rotation.y += 0.0475 * delta;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[0, 0, 23.44 * (Math.PI / 180)]} scale={[1.006, 1.006, 1.006]}>
      <sphereGeometry args={[1, 256, 256]} />
      <meshPhongMaterial
        map={cloudMap}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * Atmosphere glow — a slightly larger, semi-transparent sphere with a
 * custom Fresnel shader that brightens at the edges (limb darkening
 * inversion) to simulate atmospheric scattering.
 */
function AtmosphereGlow(): React.JSX.Element {
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          // Fresnel: bright at edges, transparent at center
          vec3 viewDir = normalize(-vPosition);
          float fresnel = 1.0 - dot(viewDir, vNormal);
          fresnel = pow(fresnel, 3.0);
          // Blue-white atmospheric glow
          vec3 atmosphereColor = mix(
            vec3(0.3, 0.6, 1.0),  // deep blue
            vec3(0.6, 0.8, 1.0),  // light blue-white
            fresnel
          );
          gl_FragColor = vec4(atmosphereColor, fresnel * 0.6);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  return (
    <mesh scale={[1.08, 1.08, 1.08]}>
      <sphereGeometry args={[1, 256, 256]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
}

function Controls(): React.JSX.Element | null {
  const { camera, gl } = useThree();
  
  if (Platform.OS !== 'web') {
    return null; // OrbitControls requires DOM APIs, so disable on native
  }

  return (
    // @ts-ignore - orbitControlsImpl is added via extend()
    <orbitControlsImpl
      args={[camera, gl.domElement]}
      enablePan={false}
      enableZoom={true}
      minDistance={1.2}
      maxDistance={4.0}
      zoomSpeed={0.8}
      rotateSpeed={0.25}
    />
  );
}

/**
 * Scene setup — camera, lights, and the earth + atmosphere meshes.
 */
function EarthScene(): React.JSX.Element {
  return (
    <>
      {/* Ambient fill so the dark side isn't pitch black - increased for overall brightness */}
      <ambientLight intensity={0.8} />
      {/* Main sunlight from upper-right - increased for brighter highlights */}
      <directionalLight position={[5, 3, 5]} intensity={2.0} />
      {/* Subtle rim light from behind */}
      <directionalLight position={[-3, -1, -5]} intensity={0.4} />

      <group scale={[0.8505, 0.8505, 0.8505]}>
        <EarthSphere />
        <CloudSphere />
        <AtmosphereGlow />
      </group>
      <Controls />
    </>
  );
}

// ── Main exported component ────────────────────────────────────────────

export function Earth3D({ size }: Earth3DProps): React.JSX.Element {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
      }}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
        }}
        // Pulled camera back from 2.4 to 2.8 to ensure the complete Earth fits
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{
          width: size,
          height: size,
          backgroundColor: 'transparent',
        }}
      >
        <React.Suspense fallback={null}>
          <EarthScene />
        </React.Suspense>
      </Canvas>
    </View>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Resolve a Metro-bundled asset (require()) into a URI string that
 * Three.js TextureLoader can consume.
 *
 * On **web**, `require('image.jpg')` already returns a string URL.
 * On **native**, it returns a numeric asset ID — we use expo-asset
 * to resolve it to a local file URI.
 */
function resolveAssetUri(asset: string | number): string {
  if (typeof asset === 'string') {
    // Web: already a URL
    return asset;
  }
  // Native: resolve via expo-asset
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Asset } = require('expo-asset');
  const resolved = Asset.fromModule(asset);
  return resolved.localUri || resolved.uri;
}
