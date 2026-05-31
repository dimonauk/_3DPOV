/**
 * app/guides/360-pipeline/styles.ts
 *
 * The 360-pipeline guide page (merged in from the holo-flow-studio repo)
 * imports `GUIDE_STYLES` from a local `./styles` sibling, but the canonical
 * definition lives in the main guide system at app/guide/styles.ts. Re-export
 * it so this page compiles and shares the exact same scoped CSS.
 */
export { GUIDE_STYLES } from "../../guide/styles";
