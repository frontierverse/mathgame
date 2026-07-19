"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

import { MINERALS, type BlobVariant } from "./mineralData";

type MineralObjectProps = {
  variant: BlobVariant;
  className?: string;
};

const thumbnailCache = new Map<BlobVariant, string>();
let thumbnailRenderer: THREE.WebGLRenderer | null = null;

function makeCrystal(material: THREE.Material, radius: number, height: number) {
  const crystal = new THREE.Group();
  crystal.add(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 6), material));

  const tip = new THREE.Mesh(new THREE.ConeGeometry(radius, radius * 1.6, 6), material);
  tip.position.y = height / 2 + radius * 0.8;
  crystal.add(tip);
  return crystal;
}

function buildMineral(variant: BlobVariant) {
  const mineral = new THREE.Group();

  if (variant === "rock") {
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.95, 2),
      new THREE.MeshStandardMaterial({
        color: 0x9c948b,
        roughness: 0.9,
        flatShading: true,
      }),
    );
    rock.scale.set(1.08, 0.82, 1);
    rock.rotation.set(0.2, -0.4, -0.12);
    mineral.add(rock);
    return mineral;
  }

  if (variant === "crystal") {
    const material = new THREE.MeshStandardMaterial({
      color: 0xb39ddb,
      roughness: 0.18,
      metalness: 0.08,
      emissive: 0x4a2f6b,
      emissiveIntensity: 0.16,
      flatShading: true,
    });
    const center = makeCrystal(material, 0.3, 1);
    center.position.y = -0.2;
    mineral.add(center);

    const left = makeCrystal(material, 0.2, 0.62);
    left.position.set(-0.42, -0.4, 0.05);
    left.rotation.z = 0.4;
    mineral.add(left);

    const right = makeCrystal(material, 0.17, 0.5);
    right.position.set(0.44, -0.45, 0.08);
    right.rotation.z = -0.45;
    mineral.add(right);
    mineral.rotation.y = -0.32;
    return mineral;
  }

  if (variant === "ruby") {
    const ruby = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.9, 0),
      new THREE.MeshStandardMaterial({
        color: 0xe14b63,
        roughness: 0.1,
        metalness: 0.22,
        emissive: 0x5c0f1e,
        emissiveIntensity: 0.15,
        flatShading: true,
      }),
    );
    ruby.scale.set(0.92, 1.18, 0.92);
    ruby.rotation.set(0.08, -0.32, 0.12);
    mineral.add(ruby);
    return mineral;
  }

  const diamondMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xcaf5ff,
    roughness: 0.03,
    metalness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
    emissive: 0x65cfff,
    emissiveIntensity: 0.32,
    flatShading: true,
  });
  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.8, 0.36, 8),
    diamondMaterial,
  );
  crown.position.y = 0.3;
  mineral.add(crown);

  const pavilion = new THREE.Mesh(
    new THREE.ConeGeometry(0.8, 0.92, 8),
    diamondMaterial,
  );
  pavilion.position.y = -0.34;
  pavilion.rotation.x = Math.PI;
  mineral.add(pavilion);
  mineral.rotation.y = -0.32;

  const glow = new THREE.PointLight(0x99ecff, 2.8, 4.5);
  glow.position.set(0, 0.12, 1.25);
  mineral.add(glow);
  return mineral;
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

function renderThumbnail(variant: BlobVariant) {
  const cached = thumbnailCache.get(variant);
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
    const rimLight = new THREE.PointLight(0xdff1ff, 5, 12);
    rimLight.position.set(-3, 2, 3);
    scene.add(rimLight);
    scene.add(buildMineral(variant));

    thumbnailRenderer.render(scene, camera);
    const dataUrl = thumbnailRenderer.domElement.toDataURL("image/png");
    thumbnailCache.set(variant, dataUrl);
    disposeScene(scene);
    thumbnailRenderer.renderLists.dispose();
    return dataUrl;
  } catch {
    return null;
  }
}

export default function MineralObject({
  variant,
  className = "h-8 w-8",
}: MineralObjectProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(
    () => thumbnailCache.get(variant) ?? null,
  );

  useEffect(() => {
    let active = true;
    const frame = requestAnimationFrame(() => {
      const dataUrl = renderThumbnail(variant);
      if (active) setThumbnail(dataUrl);
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [variant]);

  return (
    <span
      role="img"
      aria-label={MINERALS[variant].label}
      className={`inline-flex shrink-0 ${className}`}
      style={
        thumbnail
          ? {
              backgroundImage: `url(${thumbnail})`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }
          : { backgroundColor: MINERALS[variant].color, borderRadius: "9999px" }
      }
    />
  );
}
