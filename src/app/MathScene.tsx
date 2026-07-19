"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";

import { getDefaultExpression, parseVisualExpression } from "./scenes/expression";
import { createSceneHelpers, type AnimatedOrb } from "./scenes/helpers";
import { buildLessonScene, hasDedicatedLessonScene } from "./scenes/lessonRegistry";
import type { CircleAreaStage, LessonSceneContext, PowersStage, TriangleAreaStage } from "./scenes/types";
import { isDocumentUsingLightTheme, subscribeToTheme } from "./themeClient";

type MathSceneProps = {
  expression: string;
  lessonId: string;
  triangleStage?: TriangleAreaStage;
  circleStage?: CircleAreaStage;
  powersStage?: PowersStage;
};

const LIGHT_SCENE_PALETTE = {
  fog: 0xf8f1e7,
  hemisphereSky: 0xffffff,
  hemisphereGround: 0xdccfe6,
  hemisphereIntensity: 2.6,
  key: 0xfffbf3,
  keyIntensity: 3.2,
  rim: 0xb6a4e3,
  rimIntensity: 24,
  fill: 0x9edce3,
  fillIntensity: 22,
  gridPrimary: 0xd0c0dc,
  gridSecondary: 0xe7dccf,
  gridOpacity: 0.52,
  centerRing: 0xa69ac8,
  centerRingOpacity: 0.22,
} as const;

const DARK_SCENE_PALETTE = {
  fog: 0x101010,
  hemisphereSky: 0xf5f5f5,
  hemisphereGround: 0x1a1a1a,
  hemisphereIntensity: 2.25,
  key: 0xffffff,
  keyIntensity: 2.7,
  rim: 0xbdbdbd,
  rimIntensity: 16,
  fill: 0x737373,
  fillIntensity: 12,
  gridPrimary: 0x3f3f46,
  gridSecondary: 0x262626,
  gridOpacity: 0.36,
  centerRing: 0x737373,
  centerRingOpacity: 0.2,
} as const;

export default function MathScene({
  expression,
  lessonId,
  triangleStage = 0,
  circleStage = 0,
  powersStage = 0,
}: MathSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isLightTheme = useSyncExternalStore(
    subscribeToTheme,
    isDocumentUsingLightTheme,
    () => false,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNumberEvolution = lessonId === "quantity";
    const hasDedicatedScene = hasDedicatedLessonScene(lessonId);
    const palette = isLightTheme ? LIGHT_SCENE_PALETTE : DARK_SCENE_PALETTE;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(palette.fog, 0.038);

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

    scene.add(
      new THREE.HemisphereLight(
        palette.hemisphereSky,
        palette.hemisphereGround,
        palette.hemisphereIntensity,
      ),
    );
    const keyLight = new THREE.DirectionalLight(palette.key, palette.keyIntensity);
    keyLight.position.set(4, 8, 7);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(palette.rim, palette.rimIntensity, 24);
    rimLight.position.set(-7, 2, -2);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(palette.fill, palette.fillIntensity, 22);
    fillLight.position.set(7, 0, 3);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(
      24,
      24,
      palette.gridPrimary,
      palette.gridSecondary,
    );
    grid.position.y = -2.5;
    grid.material.opacity = palette.gridOpacity;
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
      isLightTheme,
      parsed,
      triangleStage,
      circleStage,
      powersStage,
      maxVisible,
      helpers,
    };
    const lessonScene = buildLessonScene(lessonId, sceneContext);

    if (contentGroup.children.length > 0) {
      const contentBounds = new THREE.Box3().setFromObject(contentGroup);
      const contentCenter = contentBounds.getCenter(new THREE.Vector3());
      const contentTargetY =
        lessonId === "circle-circumference" && circleStage === 1
          ? 1
          : lessonId === "circle-circumference" && circleStage === 2
            ? 1.1
            : 0.4;
      contentGroup.position.set(-contentCenter.x, contentTargetY - contentCenter.y, -contentCenter.z);
      contentGroup.userData.centerY = contentCenter.y;
    }

    if (!hasDedicatedScene) {
      const centerRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.8, 0.018, 8, 120),
        new THREE.MeshBasicMaterial({
          color: palette.centerRing,
          transparent: true,
          opacity: palette.centerRingOpacity,
        }),
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
      if (
        lessonId === "circle-circumference" &&
        (circleStage === 1 || circleStage === 2)
      ) {
        const halfVerticalFovTangent = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
        const verticalSpan = circleStage === 1 ? 7.2 : 8.8;
        const horizontalSpan = circleStage === 1 ? 10.1 : 5.7;
        const verticalFitDistance = verticalSpan / (2 * halfVerticalFovTangent);
        const horizontalFitDistance = horizontalSpan / (2 * halfVerticalFovTangent * camera.aspect);
        cameraDistance = Math.max(verticalFitDistance, horizontalFitDistance);
        camera.position.copy(cameraTarget).addScaledVector(cameraDirection, cameraDistance);
        if (circleStage === 2 && typeof contentGroup.userData.centerY === "number") {
          const responsiveTargetY = camera.aspect < 0.8 ? 1.1 : 0.9;
          contentGroup.position.y = responsiveTargetY - contentGroup.userData.centerY;
        }
      }
      camera.lookAt(cameraTarget);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    let animationFrame = 0;
    let animationStartedAt = performance.now();
    const replayLessonAnimation = () => {
      animationStartedAt = performance.now();
    };
    window.addEventListener("math-scene:replay", replayLessonAnimation);
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
      window.removeEventListener("math-scene:replay", replayLessonAnimation);
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
  }, [expression, isLightTheme, lessonId, triangleStage, circleStage, powersStage]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[420px] w-full touch-none lg:min-h-0"
    />
  );
}
