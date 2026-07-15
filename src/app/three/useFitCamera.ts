import { useThree, useFrame } from "@react-three/fiber";
import type * as THREE from "three";

export function useFitCamera(virtualWidth: number, virtualHeight: number) {
  useFrame(({ camera, size }) => {
    const perspective = camera as THREE.PerspectiveCamera;
    const vFov = (perspective.fov * Math.PI) / 180;
    const aspect = size.width / size.height;
    const requiredAspect = virtualWidth / virtualHeight;

    let distance = virtualHeight / 2 / Math.tan(vFov / 2);

    if (aspect < requiredAspect) {
      const neededHeightForWidth = virtualWidth / aspect;
      distance = neededHeightForWidth / 2 / Math.tan(vFov / 2);
    }

    if (Math.abs(perspective.position.z - distance) > 0.001) {
      perspective.position.z = distance;
      perspective.updateProjectionMatrix();
    }
  });

  const { size } = useThree();
  return size;
}
