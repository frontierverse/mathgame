"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import { getDefaultExpression, parseVisualExpression } from "./scenes/expression";
import { createSceneHelpers, type AnimatedOrb } from "./scenes/helpers";
import { buildLessonScene, hasDedicatedLessonScene } from "./scenes/lessonRegistry";
import type { CircleAreaStage, LessonSceneContext, TriangleAreaStage } from "./scenes/types";

type MathSceneProps = {
  expression: string;
  lessonId: string;
  triangleStage?: TriangleAreaStage;
  circleStage?: CircleAreaStage;
};

export default function MathScene({
  expression,
  lessonId,
  triangleStage = 0,
  circleStage = 0,
}: MathSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNumberEvolution = lessonId === "quantity";
    const hasDedicatedScene = hasDedicatedLessonScene(lessonId);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xf8f1e7, 0.038);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const cameraTarget = new THREE.Vector3(0, 0.4, 0);
    camera.position.set(0, 4.2, 13);
    camera.lookAt(cameraTarget);
    const cameraDirection = camera.position.clone().sub(cameraTarget).normalize();
    let cameraDistance = camera.position.distanceTo(cameraTarget);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const world = new THREE.Group();
    world.rotation.x = isNumberEvolution ? -0.06 : -0.18;
    scene.add(world);
    const contentGroup = new THREE.Group();
    world.add(contentGroup);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xdccfe6, 2.6));
    const keyLight = new THREE.DirectionalLight(0xfffbf3, 3.2);
    keyLight.position.set(4, 8, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xb6a4e3, 24, 24);
    rimLight.position.set(-7, 2, -2);
    scene.add(rimLight);
    const cyanLight = new THREE.PointLight(0x9edce3, 22, 22);
    cyanLight.position.set(7, 0, 3);
    scene.add(cyanLight);

    const grid = new THREE.GridHelper(24, 24, 0xd0c0dc, 0xe7dccf);
    grid.position.y = -2.5;
    grid.material.opacity = 0.52;
    grid.material.transparent = true;
    scene.add(grid);

    const parsed = parseVisualExpression(expression) ?? getDefaultExpression(lessonId);
    const interactiveMeshes: THREE.Mesh[] = [];
    const animatedOrbs: AnimatedOrb[] = [];
    const maxVisible = 24;
    const helpers = createSceneHelpers({
      contentGroup,
      interactiveMeshes,
      animatedOrbs,
      maxVisible,
      showFocusRing: !hasDedicatedScene,
    });
    const sceneContext: LessonSceneContext = {
      contentGroup,
      interactiveMeshes,
      parsed,
      triangleStage,
      circleStage,
      maxVisible,
      helpers,
    };
    const lessonScene = buildLessonScene(lessonId, sceneContext);

    if (contentGroup.children.length > 0) {
      const contentBounds = new THREE.Box3().setFromObject(contentGroup);
      const contentCenter = contentBounds.getCenter(new THREE.Vector3());
      contentGroup.position.set(-contentCenter.x, 0.4 - contentCenter.y, -contentCenter.z);
    }

    if (!hasDedicatedScene) {
      const centerRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.8, 0.018, 8, 120),
        new THREE.MeshBasicMaterial({ color: 0xa69ac8, transparent: true, opacity: 0.22 }),
      );
      centerRing.rotation.x = Math.PI / 2;
      world.add(centerRing);
    }

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let dragging = false;
    let moved = false;
    let previousX = 0;
    let previousY = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      moved = false;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - previousX;
      const dy = event.clientY - previousY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      world.rotation.y += dx * 0.008;
      world.rotation.x = THREE.MathUtils.clamp(world.rotation.x + dy * 0.005, -0.65, 0.45);
      previousX = event.clientX;
      previousY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (moved) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersection = raycaster.intersectObjects(interactiveMeshes)[0];
      if (!intersection) return;
      let target: THREE.Object3D | null = intersection.object;
      while (target && target.userData.baseScale === undefined) target = target.parent;
      if (!(target instanceof THREE.Mesh)) return;
      target.userData.active = !target.userData.active;
      const material = target.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = target.userData.active ? 1.1 : 0.12;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.012, 8, 20);
      camera.position.copy(cameraTarget).addScaledVector(cameraDirection, cameraDistance);
      camera.lookAt(cameraTarget);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / Math.max(height, 1);
      camera.lookAt(cameraTarget);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let animationFrame = 0;
    const animationStartedAt = performance.now();
    const animate = (timestamp: number) => {
      const elapsed = Math.max(0, (timestamp - animationStartedAt) / 1000);
      animatedOrbs.forEach(({ mesh, baseY, baseTilt, phase }) => {
        mesh.position.y = baseY + Math.sin(elapsed * 1.45 + phase) * 0.08;
        mesh.rotation.z = baseTilt;
        const targetScale = mesh.userData.active ? mesh.userData.baseScale * 1.22 : mesh.userData.baseScale;
        mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      });
      lessonScene.animate?.(elapsed);
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          const texture = (material as THREE.MeshStandardMaterial).map;
          if (texture) texture.dispose();
          material.dispose();
        });
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
    };
  }, [expression, lessonId, triangleStage, circleStage]);

  return <div ref={containerRef} className="h-full min-h-[420px] w-full touch-none" />;
}
