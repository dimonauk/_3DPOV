/**
 * components/holoflow — Holo-Flow Studio kawaii-cyberpunk component
 * vocabulary. Use these together to compose any vertical's deep-dive
 * page (Splatter, Heritage, Aura, BY-GEN, Jewel, Poi, Academy, Neo).
 *
 * Pattern:
 *   <ChromeLabel>Vertical — Deep Dive</ChromeLabel>
 *   <SectionHeader eyebrow=… title=… body=… />
 *   <DemoLayout>
 *     <DemoCanvas hud={…} status="LIVE">{children}</DemoCanvas>
 *     <Ladder><LadderRung n={1} … /></Ladder>
 *   </DemoLayout>
 *   <Specs><Spec k="Runtime" v="…" /></Specs>
 *   <Terminal lines={[…]} />
 *
 * Theme tokens + axes live in app/globals.css (@theme) and
 * lib/theme/registry.ts. Mount <ThemeBehaviors /> at page root for
 * mouse ripples / konami listener.
 */

export { ChromeLabel } from "./ChromeLabel";
export { Ladder, LadderRung, type LadderLevel } from "./Ladder";
export { DemoCanvas, type HudLine } from "./DemoCanvas";
export { Specs, Spec } from "./Specs";
export { Marquee } from "./Marquee";
export { PillarCard, PillarGrid, type PillarAccent } from "./PillarCard";
export { Terminal, type TerminalLine } from "./Terminal";
export { HoloflowNav, type NavLink } from "./HoloflowNav";
export { KeyboardHint } from "./KeyboardHint";
export { SectionHeader } from "./SectionHeader";
export { HeroSideStats, type Stat } from "./HeroSideStats";
export { ScrollIndicator } from "./ScrollIndicator";
export { CoordStrip } from "./CoordStrip";
export { DemoLayout } from "./DemoLayout";
export { DemoControls, type DemoControlOption } from "./DemoControls";
export {
  Card, MetricCard, Chip, StubBox, SpecTable, LiveDot, DevDot, type SpecRow,
} from "./Card";
export { TabBar, TabPanel, useTabs } from "./Tabs";
export { PriceGrid, PriceCard } from "./Pricing";
export { BtnPrimary, BtnGhost } from "./Buttons";
export {
  EasterEggProvider, useEasterEgg, type EasterEgg,
} from "./EasterEgg";
export { StubBoxEgg } from "./StubBoxEgg";
export { OceanBars, type OceanVector } from "./OceanBars";
export { ThemeBehaviors } from "./Behaviors";
export { HoloflowFooter, type FooterColumn } from "./HoloflowFooter";
export { TwoCol, ThreeCol } from "./Layout";
export { Background, SolidBackground, DynamicParticleBackground } from "./Background";
export { Accordion } from "./Accordion";
export { Timeline, type TimelineItem } from "./Timeline";
export { ProcessSteps, type ProcessStep } from "./ProcessSteps";
export { Slider } from "./Slider";
export { ContactForm, type ContactField } from "./ContactForm";
export { ChatPanel, type ChatTurn } from "./ChatPanel";
export { ServicesTable, type ServiceRow } from "./ServicesTable";
export { Glow } from "./Glow";
export { CircuitTraces } from "./CircuitTraces";
export { StatusPanel, type StatusRow, type StatusTone } from "./StatusPanel";
