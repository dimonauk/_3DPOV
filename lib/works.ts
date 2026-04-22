export type WorkBase = {
  editionSize: number;
  dimensions: string;
  glb?: string;
};

export type PlateWork = WorkBase & {
  type: "plate";
  priceGBP: number;
  paper: string;
};

export type WaveguideWork = WorkBase & {
  type: "waveguide";
  priceGBP: number;
  material: string;
  ledSpec: string;
  powerDraw: string;
};

export type SculptureWork = WorkBase & {
  type: "sculpture";
  priceGBP: number;
  material: string;
  base?: string;
};

export type ArrayPanelOption = {
  panels: number;
  priceGBP: number;
};

export type ArrayWork = WorkBase & {
  type: "array";
  panelDimensions: string;
  options: ArrayPanelOption[];
  material: string;
};

export type Work = PlateWork | WaveguideWork | SculptureWork | ArrayWork;

export const WORK_TYPE_LABEL: Record<Work["type"], string> = {
  plate: "Editioned plate",
  waveguide: "Waveguide sculpture",
  sculpture: "Desktop sculpture",
  array: "Wall array",
};

export function basePriceGBP(work: Work): number {
  if (work.type === "array") return work.options[0]?.priceGBP ?? 0;
  return work.priceGBP;
}
