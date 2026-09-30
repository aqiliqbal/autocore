"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type Speedometer3DProps = {
  ignitionOn: boolean;
};

function GaugeScene({ ignitionOn }: Speedometer3DProps) {
  const needleRef = useRef<THREE.Group>(null);
  const [rpm, setRpm] = useState(0);

  const animationStart = useRef<number | null>(null);

  useEffect(() => {
    animationStart.current = performance.now();

    if (!ignitionOn) {
      setRpm(0);
    }
  }, [ignitionOn]);

  useFrame(() => {
    if (!needleRef.current) return;

    if (!ignitionOn) {
      needleRef.current.rotation.z = THREE.MathUtils.lerp(
        needleRef.current.rotation.z,
        -2.35,
        0.08,
      );

      return;
    }

    if (animationStart.current === null) {
      animationStart.current = performance.now();
    }

    const elapsed =
      (performance.now() - animationStart.current) / 1000;

    let currentRpm = 0;
    let targetAngle = -2.35;

    /*
      IGNITION ANIMATION

      0 - 0.8 sec
      RPM rises

      0.8 - 1.8 sec
      RPM reaches redline

      1.8 - 2.8 sec
      RPM falls

      2.8+ sec
      Engine idles
    */

    if (elapsed < 0.8) {
      const progress = elapsed / 0.8;

      currentRpm = THREE.MathUtils.lerp(
        0,
        7000,
        progress,
      );

      targetAngle = THREE.MathUtils.lerp(
        -2.35,
        1.35,
        progress,
      );
    } else if (elapsed < 1.8) {
      const progress = (elapsed - 0.8) / 1;

      currentRpm = THREE.MathUtils.lerp(
        7000,
        7800,
        progress,
      );

      targetAngle = THREE.MathUtils.lerp(
        1.35,
        1.8,
        progress,
      );
    } else if (elapsed < 2.8) {
      const progress = (elapsed - 1.8) / 1;

      currentRpm = THREE.MathUtils.lerp(
        7800,
        850,
        progress,
      );

      targetAngle = THREE.MathUtils.lerp(
        1.8,
        -1.95,
        progress,
      );
    } else {
      currentRpm = 850;
      targetAngle = -1.95;
    }

    needleRef.current.rotation.z = THREE.MathUtils.lerp(
      needleRef.current.rotation.z,
      targetAngle,
      0.12,
    );

    setRpm(Math.round(currentRpm));
  });

  return (
    <>
      {/* Main lighting */}

      <ambientLight intensity={1.1} />

      <pointLight
        position={[0, 0, 3]}
        intensity={8}
        color="#ff334d"
        distance={6}
      />

      <pointLight
        position={[0, 2, 2]}
        intensity={4}
        color="#ffffff"
        distance={5}
      />

      {/* Outer metallic ring */}

      <mesh position={[0, 0, -0.15]}>
        <torusGeometry args={[1.55, 0.13, 32, 96]} />

        <meshStandardMaterial
          color="#272c35"
          metalness={0.95}
          roughness={0.18}
        />
      </mesh>

      {/* Red illuminated ring */}

      <mesh position={[0, 0, -0.04]}>
        <torusGeometry args={[1.42, 0.035, 16, 96]} />

        <meshStandardMaterial
          color="#e5253f"
          emissive="#e5253f"
          emissiveIntensity={ignitionOn ? 4 : 0.5}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Gauge face */}

      <mesh position={[0, 0, -0.12]}>
        <circleGeometry args={[1.37, 96]} />

        <meshStandardMaterial
          color="#07090d"
          metalness={0.15}
          roughness={0.75}
        />
      </mesh>

      {/* Inner metallic ring */}

      <mesh position={[0, 0, -0.01]}>
        <torusGeometry args={[1.19, 0.025, 12, 96]} />

        <meshStandardMaterial
          color="#555c66"
          metalness={0.9}
          roughness={0.22}
        />
      </mesh>

      {/* Tick marks */}

      {Array.from({ length: 41 }).map((_, index) => {
        const angle =
          THREE.MathUtils.degToRad(
            -135 + index * (270 / 40),
          );

        const radius = 1.15;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        const major = index % 5 === 0;

        return (
          <mesh
            key={index}
            position={[x, y, 0.03]}
            rotation={[
              0,
              0,
              angle + Math.PI / 2,
            ]}
          >
            <boxGeometry
              args={[
                major ? 0.035 : 0.018,
                major ? 0.16 : 0.08,
                0.025,
              ]}
            />

            <meshStandardMaterial
              color={
                index > 32
                  ? "#e5253f"
                  : "#d9dde3"
              }
              emissive={
                index > 32
                  ? "#e5253f"
                  : "#000000"
              }
              emissiveIntensity={
                index > 32 ? 2 : 0
              }
            />
          </mesh>
        );
      })}

      {/* Needle */}

      <group
        ref={needleRef}
        position={[0, 0, 0.16]}
      >
        <mesh position={[0, 0.72, 0]}>
          <boxGeometry
            args={[0.035, 1.35, 0.035]}
          />

          <meshStandardMaterial
            color="#ff334d"
            emissive="#ff334d"
            emissiveIntensity={
              ignitionOn ? 5 : 0.5
            }
          />
        </mesh>

        {/* Needle tip */}

        <mesh position={[0, 1.39, 0]}>
          <coneGeometry
            args={[0.055, 0.16, 8]}
          />

          <meshStandardMaterial
            color="#ff334d"
            emissive="#ff334d"
            emissiveIntensity={
              ignitionOn ? 5 : 0.5
            }
          />
        </mesh>

        {/* Center hub */}

        <mesh position={[0, 0, 0.04]}>
          <cylinderGeometry
            args={[0.13, 0.13, 0.08, 32]}
          />

          <meshStandardMaterial
            color="#171b22"
            metalness={0.95}
            roughness={0.18}
          />
        </mesh>

        <mesh position={[0, 0, 0.09]}>
          <cylinderGeometry
            args={[0.055, 0.055, 0.09, 32]}
          />

          <meshStandardMaterial
            color="#ff334d"
            emissive="#ff334d"
            emissiveIntensity={
              ignitionOn ? 4 : 0.5
            }
          />
        </mesh>
      </group>

      {/* Digital display */}

      <mesh position={[0, -0.34, 0.04]}>
        <planeGeometry args={[0.75, 0.38]} />

        <meshStandardMaterial
          color="#080a0e"
          metalness={0.2}
          roughness={0.6}
        />
      </mesh>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2 - 0.18}
        maxPolarAngle={Math.PI / 2 + 0.18}
        minAzimuthAngle={-0.18}
        maxAzimuthAngle={0.18}
      />
    </>
  );
}

export default function Speedometer3D({
  ignitionOn,
}: Speedometer3DProps) {
  return (
    <div className="h-[330px] w-full">
      <Canvas
        camera={{
          position: [0, 0, 4.5],
          fov: 35,
        }}
        dpr={[1, 2]}
      >
        <GaugeScene ignitionOn={ignitionOn} />
      </Canvas>
    </div>
  );
}