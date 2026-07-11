"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export type BlobVariant = "rock" | "crystal" | "ruby" | "diamond";

type StudentBlobProps = {
  /** Which mineral to render (rock → crystal → ruby → diamond, cheap → precious). */
  variant: BlobVariant;
  /** Accent color for the student's ribbon, as a hex string. */
  color: string;
  /** Per-student seed so idle motion is slightly out of sync. */
  seed?: number;
  /** Use a cached still frame for dense grids, or a live animated canvas. */
  renderMode?: "animated" | "thumbnail";
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
  const diamondMat = new THREE.MeshStandardMaterial({
    color: 0xdaf0ff,
    roughness: 0.04,
    metalness: 0.3,
    emissive: 0x9fd4ff,
    emissiveIntensity: 0.2,
    flatShading: true,
  });
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.78, 0.34, 8), diamondMat);
  crown.position.y = 0.3;
  character.add(crown);
  const pavilion = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.86, 8), diamondMat);
  pavilion.position.y = -0.3;
  pavilion.rotation.x = Math.PI; // point downward
  character.add(pavilion);
  // sparkles
  const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const s of [
    { x: 0.7, y: 0.6, z: 0.5, r: 0.06 },
    { x: -0.65, y: 0.2, z: 0.6, r: 0.045 },
    { x: 0.2, y: 0.85, z: 0.4, r: 0.04 },
  ]) {
    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(s.r, 8, 8), sparkleMat);
    sparkle.position.set(s.x, s.y, s.z);
    character.add(sparkle);
  }
  addFace(character, { eyeY: 0.32, eyeSpread: 0.16, eyeZ: 0.46, eyeR: 0.09, cheekY: 0.16, cheekSpread: 0.3, cheekZ: 0.4 });
  addBow(character, color, new THREE.Vector3(0.4, 0.7, 0.3));
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
  className = "h-9 w-9 shrink-0",
}: StudentBlobProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

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
      className={className}
      style={
        thumbnail
          ? {
              backgroundImage: `url(${thumbnail})`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }
          : undefined
      }
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
  return props.renderMode === "thumbnail" ? (
    <StudentBlobThumbnail {...props} />
  ) : (
    <AnimatedStudentBlob {...props} />
  );
}
