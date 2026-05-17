import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMAnimation } from "./VRMAnimation";
import { VRMAnimationLoaderPlugin } from "./VRMAnimationLoaderPlugin";

/**
 * Singleton GLTFLoader for .vrma files. Registers the VRMC_vrm_animation
 * plugin once at module load so every loadVRMAnimation() call reuses it.
 */
const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

/**
 * Fetch a .vrma file and return the first VRMAnimation in it.
 *
 * Returns null if the file loads but contains no animation extension,
 * or if loading fails. Caller should check for null.
 */
export async function loadVRMAnimation(
  url: string,
): Promise<VRMAnimation | null> {
  const gltf = await loader.loadAsync(url);

  const vrmAnimations: VRMAnimation[] | undefined = gltf.userData
    .vrmAnimations as VRMAnimation[] | undefined;
  const vrmAnimation = vrmAnimations?.[0];

  return vrmAnimation ?? null;
}
