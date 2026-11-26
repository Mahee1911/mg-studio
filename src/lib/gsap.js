import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText, useGSAP);

export const TOUCH = "(pointer: coarse)";
export const scroller = () =>
  (window.matchMedia(TOUCH).matches && document.querySelector(".page")) || window;

export { gsap, CustomEase, ScrollTrigger, SplitText, useGSAP };
