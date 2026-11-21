"use client";
import { Float, RoundedBox, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

export const CARD_TEXTURES = ["/templates/card-elegan_1.webp", "/templates/card-formal_1.webp", "/templates/card-simple_2.webp", "/templates/card-elegan_3.webp"];

export type HeroProgress = { open: number; out: number };

// Ukuran amplop "sleeve" potret; kartu sedikit lebih kecil agar muat di dalamnya.
const W = 1.9, H = 2.7, CW = 1.62, CH = 2.32;
const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = THREE.MathUtils.damp;

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

function Envelope({ progress, style }: { progress: RefObject<HeroProgress>; style: RefObject<number> }) {
  const group = useRef<THREE.Group>(null!);
  const env = useRef<THREE.Group>(null!);
  const flap = useRef<THREE.Group>(null!);
  const card = useRef<THREE.Mesh>(null!);
  const textures = useTexture(CARD_TEXTURES);
  textures.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; });
  const cardMat = useRef<THREE.MeshStandardMaterial>(null!);
  const shown = useRef(-1);
  const pulse = useRef(1);
  const pocket = useMemo(() => new THREE.ShapeGeometry(pocketShape()), []);
  const flapGeo = useMemo(() => new THREE.ShapeGeometry(flapShape()), []);
  const { pointer, viewport } = useThree();
  // Desktop (>= 1024px): kanvas hanya di separuh kanan, amplop di tengahnya.
  // Tablet/ponsel: amplop kecil di celah antara judul dan paragraf (maks. ~25% tinggi layar).
  const wide = typeof window !== "undefined" && window.innerWidth >= 1024;
  const scale = wide ? Math.min(0.74, viewport.width / 3.2, viewport.height / 5.2) : Math.min(viewport.width / 5, (viewport.height * 0.25) / H);
  const baseY = wide ? -0.1 : viewport.height * 0.01;

  useFrame((_, dt) => {
    const { open: p, out: o } = progress.current ?? { open: 0, out: 0 };
    // Ganti tekstur kartu saat gaya berganti (dengan denyut kecil).
    if (shown.current !== style.current) {
      shown.current = style.current ?? 0;
      cardMat.current.map = textures[shown.current % textures.length];
      cardMat.current.needsUpdate = true;
      pulse.current = 0.96;
    }
    pulse.current = damp(pulse.current, 1, 6, dt);

    // 1) Tutup terbuka ke atas, lalu mundur ke belakang kartu agar kartu yang keluar tidak tertutup.
    flap.current.rotation.x = damp(flap.current.rotation.x, -Math.PI * smooth(0, 0.3, p), 8, dt);
    flap.current.position.z = damp(flap.current.position.z, 0.1 - 0.16 * smooth(0.18, 0.3, p), 10, dt);
    // 2) Kartu keluar penuh dari amplop.
    const rise = smooth(0.25, 0.85, p);
    // 3) Section berikutnya: amplop jatuh, kartu turun ke tengah layar dan sedikit membesar
    //    (ponsel/tablet: kartu naik keluar layar agar teks tetap bersih).
    const fall = smooth(0, 0.55, o);
    env.current.position.y = damp(env.current.position.y, -fall * 9, 8, dt);
    const cardY = -0.16 + rise * 2.76 - (wide ? fall * 1.2 : -fall * 6);
    card.current.position.y = damp(card.current.position.y, cardY, 8, dt);
    card.current.position.z = 0.03 + rise * 0.05;
    card.current.rotation.y = damp(card.current.rotation.y, wide ? fall * -0.22 : 0, 6, dt);
    card.current.scale.setScalar(pulse.current * (1 + fall * 0.12));

    // Hampir tegak; hanya condong halus mengikuti kursor.
    group.current.rotation.y = damp(group.current.rotation.y, -0.08 + pointer.x * 0.14, 4, dt);
    group.current.rotation.x = damp(group.current.rotation.x, 0.03 - pointer.y * 0.08, 4, dt);
    group.current.position.y = damp(group.current.position.y, baseY - rise * 1.2 * scale, 6, dt);
  });

  const paper = "#e8dccb", paperBack = "#d9c9b3", liner = "#a8482a";
  return (
    <group ref={group} scale={scale}>
      {/* Kartu undangan (tekstur gaya aktif) */}
      <mesh ref={card} position={[0, -0.16, 0.03]}>
        <planeGeometry args={[CW, CH]} />
        <meshStandardMaterial ref={cardMat} roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <group ref={env}>
        {/* Panel belakang */}
        <RoundedBox args={[W, H, 0.02]} radius={0.01} position={[0, 0, -0.03]}>
          <meshStandardMaterial color={paperBack} roughness={0.85} />
        </RoundedBox>
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
    </group>
  );
}

export default function HeroScene({ progress, style, eventSource, onFail }: { progress: RefObject<HeroProgress>; style: RefObject<number>; eventSource: RefObject<HTMLElement | null>; onFail: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6.2], fov: 35 }}
      // Kanvas tidak menerima klik (pointer-events: none); posisi kursor dibaca dari pembungkus.
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      aria-hidden
      onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", onFail, { once: true })}
      fallback={null}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <directionalLight position={[-4, -2, 2]} intensity={0.5} color="#f1c9b4" />
      <Float speed={1.4} rotationIntensity={0.06} floatIntensity={0.3}>
        <Envelope progress={progress} style={style} />
      </Float>
    </Canvas>
  );
}
