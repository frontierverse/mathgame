"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";

import { MINERALS, type BlobVariant } from "./mineralData";

export type { BlobVariant } from "./mineralData";

type StudentBlobProps = {
  /** Which mineral to render (rock → crystal → ruby → diamond, cheap → precious). */
  variant: BlobVariant;
  /** Accent color for the student's ribbon, as a hex string. */
  color: string;
  /** Per-student seed so idle motion is slightly out of sync. */
  seed?: number;
  /** Use a cached still frame for dense grids, or a live animated canvas. */
  renderMode?: "animated" | "thumbnail";
  /** Add lightweight CSS motion to a cached thumbnail. */
  thumbnailMotion?: boolean;
  /** Sizing/layout classes for the canvas wrapper. */
  className?: string;
};

const EYE_COLOR = 0x3a3340;
const BLUSH_COLOR = 0xff9db0;

// Position-based displacement so duplicated (per-face) vertices sharing a
// coordinate get the SAME offset — otherwise the faceted rock tears apart.
function lumpy(x: number, y: number, z: number, seed: number) {
  return (
    Math.sin(x * 3.1 + seed) * 0.45 +
    Math.sin(y * 2.7 + seed * 1.7) * 0.4 +
    Math.sin(z * 3.5 + seed * 0.9) * 0.4 +
    Math.sin((x + y + z) * 4.3 + seed * 2.1) * 0.2
  );
}

// A small cute face (eyes + rosy cheeks) shared by every mineral.
function addFace(
  parent: THREE.Group,
  opts: { eyeY: number; eyeSpread: number; eyeZ: number; eyeR: number; cheekY: number; cheekSpread: number; cheekZ: number },
) {
  const eyeMat = new THREE.MeshStandardMaterial({ color: EYE_COLOR, roughness: 0.3 });
  const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blushMat = new THREE.MeshBasicMaterial({ color: BLUSH_COLOR, transparent: true, opacity: 0.6 });
  const eyeGeo = new THREE.SphereGeometry(opts.eyeR, 18, 18);
  const highlightGeo = new THREE.SphereGeometry(opts.eyeR * 0.34, 10, 10);
  const blushGeo = new THREE.SphereGeometry(opts.eyeR * 0.85, 14, 14);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(side * opts.eyeSpread, opts.eyeY, opts.eyeZ);
    const highlight = new THREE.Mesh(highlightGeo, highlightMat);
    highlight.position.set(side * opts.eyeSpread + opts.eyeR * 0.28, opts.eyeY + opts.eyeR * 0.34, opts.eyeZ + opts.eyeR * 0.8);
    const blush = new THREE.Mesh(blushGeo, blushMat);
    blush.position.set(side * opts.cheekSpread, opts.cheekY, opts.cheekZ);
    blush.scale.set(1, 0.7, 0.4);
    parent.add(eye, highlight, blush);
  }
  // tiny smile
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(opts.eyeR * 0.9, opts.eyeR * 0.24, 8, 20, Math.PI),
    new THREE.MeshStandardMaterial({ color: EYE_COLOR, roughness: 0.4 }),
  );
  smile.position.set(0, opts.eyeY - opts.eyeR * 2.1, opts.eyeZ);
  smile.rotation.z = Math.PI;
  parent.add(smile);
}

// A little bow ribbon in the student's accent color, for personality.
function addBow(parent: THREE.Group, color: string, position: THREE.Vector3) {
  const bow = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.45 });
  const petalGeo = new THREE.SphereGeometry(0.15, 14, 14);
  for (const side of [-1, 1]) {
    const petal = new THREE.Mesh(petalGeo, mat);
    petal.position.set(side * 0.13, 0, 0);
    petal.scale.set(1, 0.72, 0.5);
    petal.rotation.z = side * 0.55;
    bow.add(petal);
  }
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), mat);
  bow.add(knot);
  bow.position.copy(position);
  parent.add(bow);
}

// One hexagonal crystal shaft with a pointed tip.
function makeCrystal(mat: THREE.Material, radius: number, height: number) {
  const crystal = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 6), mat);
  crystal.add(shaft);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(radius, radius * 1.6, 6), mat);
  tip.position.y = height / 2 + radius * 0.8;
  crystal.add(tip);
  return crystal;
}

function addDiamondSparkle(
  parent: THREE.Group,
  position: THREE.Vector3,
  scale: number,
  color: number,
) {
  const sparkle = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const vertical = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), material);
  vertical.scale.set(0.045 * scale, 0.3 * scale, 0.035 * scale);
  const horizontal = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), material);
  horizontal.scale.set(0.2 * scale, 0.04 * scale, 0.035 * scale);
  sparkle.add(vertical, horizontal);
  sparkle.position.copy(position);
  parent.add(sparkle);
}

function buildCharacter(variant: BlobVariant, color: string, seed: number) {
  const character = new THREE.Group();

  if (variant === "rock") {
    // Cheapest tier: a dull, lumpy gray stone.
    const geo = new THREE.IcosahedronGeometry(0.95, 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i);
      v.multiplyScalar(1 + lumpy(v.x, v.y, v.z, seed) * 0.18);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const rock = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x9c948b, roughness: 0.92, metalness: 0, flatShading: true }),
    );
    rock.scale.set(1.08, 0.86, 1.0);
    character.add(rock);
    addFace(character, { eyeY: 0.02, eyeSpread: 0.24, eyeZ: 0.95, eyeR: 0.11, cheekY: -0.18, cheekSpread: 0.46, cheekZ: 0.84 });
    addBow(character, color, new THREE.Vector3(0.46, 0.6, 0.66));
    return character;
  }

  if (variant === "crystal") {
    // Amethyst cluster — a step up in value.
    const mat = new THREE.MeshStandardMaterial({
      color: 0xb39ddb,
      roughness: 0.22,
      metalness: 0.05,
      emissive: 0x4a2f6b,
      emissiveIntensity: 0.18,
      flatShading: true,
    });
    const center = makeCrystal(mat, 0.3, 1.0);
    center.position.y = -0.2;
    character.add(center);
    const left = makeCrystal(mat, 0.2, 0.62);
    left.position.set(-0.42, -0.4, 0.05);
    left.rotation.z = 0.4;
    character.add(left);
    const right = makeCrystal(mat, 0.17, 0.5);
    right.position.set(0.44, -0.45, 0.08);
    right.rotation.z = -0.45;
    character.add(right);
    addFace(character, { eyeY: 0.12, eyeSpread: 0.14, eyeZ: 0.32, eyeR: 0.085, cheekY: -0.02, cheekSpread: 0.24, cheekZ: 0.28 });
    addBow(character, color, new THREE.Vector3(0.34, 0.78, 0.28));
    return character;
  }

  if (variant === "ruby") {
    // Faceted red gemstone.
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.MeshStandardMaterial({
        color: 0xe14b63,
        roughness: 0.12,
        metalness: 0.2,
        emissive: 0x5c0f1e,
        emissiveIntensity: 0.16,
        flatShading: true,
      }),
    );
    gem.scale.set(0.92, 1.18, 0.92);
    character.add(gem);
    addFace(character, { eyeY: 0.06, eyeSpread: 0.18, eyeZ: 0.5, eyeR: 0.1, cheekY: -0.12, cheekSpread: 0.32, cheekZ: 0.42 });
    addBow(character, color, new THREE.Vector3(0.34, 0.62, 0.32));
    return character;
  }

  // diamond — the most precious tier
  const diamondMat = new THREE.MeshPhysicalMaterial({
    color: 0xcaf5ff,
    roughness: 0.03,
    metalness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
    emissive: 0x65cfff,
    emissiveIntensity: 0.38,
    flatShading: true,
  });
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.8, 0.36, 8),
    diamondMat,
  );
  crown.position.y = 0.3;
  character.add(crown);
  const pavilion = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.92, 8), diamondMat);
  pavilion.position.y = -0.34;
  pavilion.rotation.x = Math.PI;
  character.add(pavilion);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(0.39, 0.48, 0.075, 8),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0,
      metalness: 0.08,
      clearcoat: 1,
      emissive: 0xbff7ff,
      emissiveIntensity: 0.75,
      flatShading: true,
    }),
  );
  table.position.y = 0.515;
  character.add(table);

  const innerLight = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.43, 0),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  innerLight.position.set(0, 0.03, 0.79);
  innerLight.scale.set(0.72, 0.9, 0.12);
  character.add(innerLight);

  const cyanRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.025, 8, 48),
    new THREE.MeshBasicMaterial({
      color: 0x72e9ff,
      transparent: true,
      opacity: 0.76,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  cyanRing.position.z = -0.12;
  character.add(cyanRing);

  const prismRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.018, 8, 48),
    new THREE.MeshBasicMaterial({
      color: 0xffa9df,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  prismRing.position.z = -0.16;
  prismRing.rotation.z = 0.34;
  prismRing.scale.y = 0.88;
  character.add(prismRing);

  addDiamondSparkle(character, new THREE.Vector3(0.78, 0.66, 0.8), 1, 0xffffff);
  addDiamondSparkle(character, new THREE.Vector3(-0.75, 0.12, 0.82), 0.72, 0x8feeff);
  addDiamondSparkle(character, new THREE.Vector3(0.28, 0.98, 0.68), 0.56, 0xffc1e8);

  const innerGlow = new THREE.PointLight(0x99ecff, 3.4, 4.5);
  innerGlow.position.set(0, 0.12, 1.25);
  character.add(innerGlow);

  addFace(character, {
    eyeY: 0.3,
    eyeSpread: 0.18,
    eyeZ: 0.82,
    eyeR: 0.09,
    cheekY: 0.13,
    cheekSpread: 0.32,
    cheekZ: 0.78,
  });
  addBow(character, color, new THREE.Vector3(0.45, 0.72, 0.72));
  return character;
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

const thumbnailCache = new Map<string, string>();
let thumbnailRenderer: THREE.WebGLRenderer | null = null;

function renderThumbnail(variant: BlobVariant, color: string) {
  const cacheKey = `${variant}:${color}`;
  const cached = thumbnailCache.get(cacheKey);
  if (cached) return cached;

  try {
    if (!thumbnailRenderer || thumbnailRenderer.getContext().isContextLost()) {
      thumbnailRenderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      thumbnailRenderer.setPixelRatio(1);
      thumbnailRenderer.setSize(128, 128, false);
      thumbnailRenderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.1, 4.6);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xdccfe6, 2.4));
    const keyLight = new THREE.DirectionalLight(0xfffbf3, 2.8);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);
    const sparkleLight = new THREE.PointLight(0xdff1ff, 7, 12);
    sparkleLight.position.set(-3, 2, 3);
    scene.add(sparkleLight);

    const character = buildCharacter(variant, color, 0);
    character.rotation.y = -0.12;
    scene.add(character);

    thumbnailRenderer.render(scene, camera);
    const dataUrl = thumbnailRenderer.domElement.toDataURL("image/png");
    thumbnailCache.set(cacheKey, dataUrl);
    disposeScene(scene);
    thumbnailRenderer.renderLists.dispose();
    return dataUrl;
  } catch {
    return null;
  }
}

function StudentBlobThumbnail({
  variant,
  color,
  seed = 0,
  thumbnailMotion = false,
  className = "h-9 w-9 shrink-0",
}: StudentBlobProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const diamondGlow = variant === "diamond" && thumbnailMotion;

  useEffect(() => {
    let active = true;
    const frame = requestAnimationFrame(() => {
      const dataUrl = renderThumbnail(variant, color);
      if (active) setThumbnail(dataUrl);
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [variant, color]);

  return (
    <div
      className={`${className}${thumbnailMotion ? " mineral-thumbnail-motion" : ""}${
        diamondGlow ? " diamond-thumbnail" : ""
      }`}
      style={{
        ...(thumbnail
          ? {
              backgroundImage: `url(${thumbnail})`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }
          : {}),
        ...(thumbnailMotion
          ? { animationDelay: `-${(Math.abs(seed) % 11) * 0.13}s` }
          : {}),
      }}
      aria-hidden="true"
    />
  );
}

function AnimatedStudentBlob({
  variant,
  color,
  seed = 0,
  className = "h-9 w-9 shrink-0",
}: StudentBlobProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.1, 4.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xdccfe6, 2.4));
    const keyLight = new THREE.DirectionalLight(0xfffbf3, 2.8);
    keyLight.position.set(2, 3, 4);
    scene.add(keyLight);
    const sparkleLight = new THREE.PointLight(0xdff1ff, 7, 12);
    sparkleLight.position.set(-3, 2, 3);
    scene.add(sparkleLight);

    const character = buildCharacter(variant, color, seed);
    scene.add(character);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      const size = Math.max(1, Math.min(width, height));
      renderer.setSize(size, size);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let animationFrame = 0;
    const startedAt = performance.now();
    // easeOutBack for a springy "pop" when the mineral (re)appears / evolves.
    const easeOutBack = (t: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
    };
    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startedAt) / 1000;
      const intro = Math.min(1, elapsed / 0.5);
      character.scale.setScalar(0.4 + 0.6 * easeOutBack(intro));
      character.rotation.y = Math.sin(elapsed * 0.8 + seed) * 0.35;
      character.position.y = Math.sin(elapsed * 1.8 + seed) * 0.05;
      character.rotation.z = Math.sin(elapsed * 1.2 + seed) * 0.04;
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      disposeScene(scene);
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [variant, color, seed]);

  return <div ref={containerRef} className={className} aria-hidden="true" />;
}

export default function StudentBlob(props: StudentBlobProps) {
  const tooltipAnchorRef = useRef<HTMLSpanElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ left: number; top: number } | null>(null);

  const showTooltip = () => {
    const anchor = tooltipAnchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setTooltipPosition({
      left: rect.left + rect.width / 2,
      top: rect.top - 8,
    });
  };

  return (
    <>
      <span
        ref={tooltipAnchorRef}
        className="relative inline-flex shrink-0"
        role="img"
        aria-label={`${MINERALS[props.variant].label} 광물 캐릭터`}
        onPointerEnter={showTooltip}
        onPointerLeave={() => setTooltipPosition(null)}
      >
        {props.renderMode === "thumbnail" ? (
          <StudentBlobThumbnail {...props} />
        ) : (
          <AnimatedStudentBlob {...props} />
        )}
      </span>
      {tooltipPosition
        ? createPortal(
            <span
              role="tooltip"
              className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border border-[#e3d6f2] bg-[#fffaff] px-2.5 py-1 text-[11px] font-black text-[#6d5a91] shadow-[0_6px_18px_rgba(87,64,120,0.2)]"
              style={{ left: tooltipPosition.left, top: tooltipPosition.top }}
            >
              {MINERALS[props.variant].label}
              <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-[#e3d6f2] bg-[#fffaff]" />
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
