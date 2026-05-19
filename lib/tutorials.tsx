import { entry as buildingAPovLedRigEntry } from "components/tutorials/entries/building-a-pov-led-rig";
import { entry as calibratingTheImageprografPro1100Entry } from "components/tutorials/entries/calibrating-the-imageprograf-pro-1100";
import { entry as editioningASingleExposureEntry } from "components/tutorials/entries/editioning-a-single-exposure";
import { entry as from360ToSplatEntry } from "components/tutorials/entries/from-360-to-splat";
import { entry as fromJamcamToMeshEntry } from "components/tutorials/entries/from-jamcam-to-mesh";
import { entry as fromPhotographToObjectEntry } from "components/tutorials/entries/from-photograph-to-object";
import { entry as lightingAWaveguideObjectEntry } from "components/tutorials/entries/lighting-a-waveguide-object";
import { entry as programmingPovFramesEntry } from "components/tutorials/entries/programming-pov-frames";
import { entry as spinningFirePoiSafelyEntry } from "components/tutorials/entries/spinning-fire-poi-safely";
import { entry as yourFirstLongExposureEntry } from "components/tutorials/entries/your-first-long-exposure";
import { entry as emulatorTutorialRetroarchEntry } from "components/tutorials/entries/emulator-tutorial-retroarch";
import { entry as emulatorTutorialMesenEntry } from "components/tutorials/entries/emulator-tutorial-mesen";
import { entry as emulatorTutorialDolphinEntry } from "components/tutorials/entries/emulator-tutorial-dolphin";
import { entry as emulatorTutorialMameEntry } from "components/tutorials/entries/emulator-tutorial-mame";
import { entry as emulatorTutorialPcsx2Entry } from "components/tutorials/entries/emulator-tutorial-pcsx2";
import { entry as emulatorTutorialDosboxXEntry } from "components/tutorials/entries/emulator-tutorial-dosbox-x";
import { entry as instructableDemoEntry } from "components/tutorials/entries/instructable-demo";
import { entry as tutorialDragonScaleWallReliefEntry } from "components/tutorials/entries/tutorial-dragon-scale-wall-relief";
import { entry as blenderToSiteAssetPipelineEntry } from "components/tutorials/entries/blender-to-site-asset-pipeline";
import { entry as webxrLocomotionPatternsEntry } from "components/tutorials/entries/webxr-locomotion-patterns";
import { entry as wiringSpatialAudioInTheFrameworkEntry } from "components/tutorials/entries/wiring-spatial-audio-in-the-framework";
import { entry as wiringTheWebxrRetroarchRoomEntry } from "components/tutorials/entries/wiring-the-webxr-retroarch-room";
import { entry as blenderAddonSkybrushStudioEntry } from "components/tutorials/entries/blender-addon-skybrush-studio";
import { entry as blenderAddonVrmFormatEntry } from "components/tutorials/entries/blender-addon-vrm-format";
import { entry as blenderAddon3dPrintToolboxEntry } from "components/tutorials/entries/blender-addon-3d-print-toolbox";
import { entry as blenderAddonTissueEntry } from "components/tutorials/entries/blender-addon-tissue";
import { entry as blenderAddonFreestyleSvgExporterEntry } from "components/tutorials/entries/blender-addon-freestyle-svg-exporter";
import { entry as blenderAddonLightPainterEntry } from "components/tutorials/entries/blender-addon-light-painter";
import { entry as blenderAddonSpriteSheetMakerEntry } from "components/tutorials/entries/blender-addon-sprite-sheet-maker";
import { entry as blenderAddonMixamoRigEntry } from "components/tutorials/entries/blender-addon-mixamo-rig";
import { entry as blenderAddonModularTreeEntry } from "components/tutorials/entries/blender-addon-modular-tree";
import { entry as blenderMcpFacetedSphereEntry } from "components/tutorials/entries/blender-mcp-faceted-sphere";
import { entry as blenderMcpParametricTorusEntry } from "components/tutorials/entries/blender-mcp-parametric-torus";
import { entry as blenderMcpTetraFractalEntry } from "components/tutorials/entries/blender-mcp-tetra-fractal";
import { entry as blenderMcpCubeWalkerEntry } from "components/tutorials/entries/blender-mcp-cube-walker";
import { entry as unrealPixelStreamingBrowserDeliveryEntry } from "components/tutorials/entries/unreal-pixel-streaming-browser-delivery";
import { entry as blenderTutorialFacetedGemstoneGeonodesEntry } from "components/tutorials/entries/blender-tutorial-faceted-gemstone-geonodes";
import { entry as blenderTutorialGeometryNodesLowPolyTerrainEntry } from "components/tutorials/entries/blender-tutorial-geometry-nodes-low-poly-terrain";
import { entry as blenderTutorialLowPolyFacetedHardSurfaceEntry } from "components/tutorials/entries/blender-tutorial-low-poly-faceted-hard-surface";
import { Entry, sortByDateDescending } from "./writing";

const ENTRIES: Entry[] = [
  emulatorTutorialRetroarchEntry,
  emulatorTutorialMesenEntry,
  emulatorTutorialDolphinEntry,
  emulatorTutorialMameEntry,
  emulatorTutorialPcsx2Entry,
  emulatorTutorialDosboxXEntry,
  yourFirstLongExposureEntry,
  buildingAPovLedRigEntry,
  fromPhotographToObjectEntry,
  spinningFirePoiSafelyEntry,
  programmingPovFramesEntry,
  lightingAWaveguideObjectEntry,
  calibratingTheImageprografPro1100Entry,
  from360ToSplatEntry,
  fromJamcamToMeshEntry,
  editioningASingleExposureEntry,
  instructableDemoEntry,
  tutorialDragonScaleWallReliefEntry,
  blenderToSiteAssetPipelineEntry,
  webxrLocomotionPatternsEntry,
  wiringSpatialAudioInTheFrameworkEntry,
  wiringTheWebxrRetroarchRoomEntry,
  blenderAddonSkybrushStudioEntry,
  blenderAddonVrmFormatEntry,
  blenderAddon3dPrintToolboxEntry,
  blenderAddonTissueEntry,
  blenderAddonFreestyleSvgExporterEntry,
  blenderAddonLightPainterEntry,
  blenderAddonSpriteSheetMakerEntry,
  blenderAddonMixamoRigEntry,
  blenderAddonModularTreeEntry,
  blenderMcpFacetedSphereEntry,
  blenderMcpParametricTorusEntry,
  blenderMcpTetraFractalEntry,
  blenderMcpCubeWalkerEntry,
  unrealPixelStreamingBrowserDeliveryEntry,
  blenderTutorialFacetedGemstoneGeonodesEntry,
  blenderTutorialGeometryNodesLowPolyTerrainEntry,
  blenderTutorialLowPolyFacetedHardSurfaceEntry,
];

export const tutorials: Entry[] = sortByDateDescending(ENTRIES);

export function getTutorial(slug: string): Entry | undefined {
  return tutorials.find((e) => e.slug === slug);
}
