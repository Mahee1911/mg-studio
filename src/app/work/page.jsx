import Slider from "@/components/Slider/Slider";
import { projects } from "@/data/projects";

export default function WorkPage() {
  return <Slider slides={projects} label="Selected Work 2022 — 2026" />;
}
