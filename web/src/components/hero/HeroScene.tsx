"use client";
import { Float, RoundedBox, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

export const CARD_TEXTURES = ["/templates/card-elegan_1.webp", "/templates/card-formal_1.webp", "/templates/card-simple_2.webp", "/templates/card-elegan_3.webp"];

// Ukuran amplop "sleeve" potret; kartu sedikit lebih kecil agar muat di dalamnya.
const W = 1.9, H = 2.7, CW = 1.62, CH = 2.32;
const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function pocketShape() {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, -H / 2); s.lineTo(W / 2, -H / 2); s.lineTo(W / 2, H / 2 - 0.42); s.lineTo(0, 0.12); s.lineTo(-W / 2, H / 2 - 0.42); s.closePath();
  return s;
}
function flapShape() {
  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0); s.lineTo(W / 2, 0); s.lineTo(0, -1.05); s.closePath();
  return s;
}

function Envelope({ progress, style }: { progress: RefObject<number>; style: RefObject<number> }) {
  const group = useRef<THREE.Group>(null!);
  const flap = useRef<THREE.Group>(null!);
  const card = useRef<THREE.Mesh>(null!);
  const textures = useTexture(CARD_TEXTURES);
  textures.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; });
  const cardMat = useRef<THREE.MeshStandardMaterial>(null!);
  const shown = useRef(-1);
  const pocket = useMemo(() => new THREE.ShapeGeometry(pocketShape()), []);
  const flapGeo = useMemo(() => new THREE.ShapeGeometry(flapShape()), []);
  const { pointer, viewport } = useThree();
  const scale = Math.min(0.8, viewport.width / 5);
  // Desktop: geser ke kanan agar judul tetap terbaca (teks hanya sedikit menimpa objek).
  const offsetX = viewport.width > 5 ? viewport.width * 0.13 : 0;

  useFrame((_, dt) => {
    const p = progress.current ?? 0;
    // Ganti tekstur kartu saat gaya berganti (dengan denyut kecil).
    if (shown.current !== style.current) {
      shown.current = style.current ?? 0;
      cardMat.current.map = textures[shown.current % textures.length];
      cardMat.current.needsUpdate = true;
      card.current.scale.setScalar(0.96);
    }
    card.current.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - Math.exp(-6 * dt));
    flap.current.rotation.x = THREE.MathUtils.damp(flap.current.rotation.x, -Math.PI * 0.96 * smooth(0, 0.32, p), 8, dt);
    const rise = smooth(0.22, 0.8, p);
    card.current.position.y = THREE.MathUtils.damp(card.current.position.y, -0.16 + rise * 2.05, 8, dt);
    card.current.position.z = 0.012 + rise * 0.06;
    card.current.rotation.z = THREE.MathUtils.damp(card.current.rotation.z, rise * -0.06, 6, dt);
    // Miring mengikuti kursor + sedikit berputar saat dibuka.
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, -0.32 + pointer.x * 0.28 + p * 0.5, 4, dt);
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, 0.08 - pointer.y * 0.18, 4, dt);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, -0.15 - p * 0.9, 6, dt);
  });

  const paper = "#e8dccb", paperBack = "#d9c9b3", liner = "#a8482a";
  return (
    <group ref={group} scale={scale} position-x={offsetX}>
      {/* Panel belakang */}
      <RoundedBox args={[W, H, 0.02]} radius={0.01} position={[0, 0, -0.03]}>
        <meshStandardMaterial color={paperBack} roughness={0.85} />
      </RoundedBox>
      {/* Kartu undangan (tekstur gaya aktif) */}
      <mesh ref={card} position={[0, -0.16, 0.012]}>
        <planeGeometry args={[CW, CH]} />
        <meshStandardMaterial ref={cardMat} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* Kantong depan dengan potongan V */}
      <mesh geometry={pocket} position={[0, 0, 0.09]}>
        <meshStandardMaterial color={paper} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Tutup amplop berengsel di tepi atas; sisi dalam berwarna terracotta */}
      <group ref={flap} position={[0, H / 2, 0.1]}>
        <mesh geometry={flapGeo}>
          <meshStandardMaterial color={paper} roughness={0.8} side={THREE.FrontSide} />
        </mesh>
        <mesh geometry={flapGeo} position={[0, 0, -0.002]}>
          <meshStandardMaterial color={liner} roughness={0.7} side={THREE.BackSide} />
        </mesh>
        {/* Segel lilin */}
        <mesh position={[0, -0.92, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.17, 0.18, 0.04, 40]} />
          <meshStandardMaterial color={liner} roughness={0.35} metalness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export default function HeroScene({ progress, style, animate }: { progress: RefObject<number>; style: RefObject<number>; animate: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6.2], fov: 35 }}
      frameloop={animate ? "always" : "demand"}
      aria-hidden
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-4, -2, 2]} intensity={0.5} color="#f1c9b4" />
      <Float speed={animate ? 1.4 : 0} rotationIntensity={0.25} floatIntensity={0.5}>
        <Envelope progress={progress} style={style} />
      </Float>
    </Canvas>
  );
}
