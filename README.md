# MG Studio — Interactive Portfolio

MG Studio is a personal frontend learning project by **Mahee Gadhiya**. It explores how visual identity, motion, and 3D interaction can come together in a portfolio website.

## Project Overview

The site presents seven fictional concept studies across fragrance, fashion, editorial design, objects, botanical products, hospitality, and architecture. These are independent visual explorations, not commissioned client work.

I used this project to practice customizing a multi-page React experience, organizing project content, and adding interactive motion and a 3D MG emblem.

## Features

- **Interactive 3D emblem:** A GLB model rendered with Three.js, with pointer-based movement and a metallic highlight.
- **Animated transitions:** GSAP-powered page transitions and content reveals.
- **Smooth scrolling:** Lenis-based scrolling.
- **Work gallery:** A reusable slider displays project concepts and images.
- **Portfolio pages:** Home, work, about, inquiry, and not-found pages share one visual style.
- **Concept case studies:** Project descriptions and production notes identify fictional concepts and generated imagery.

## Tech Stack

- Next.js App Router
- React
- JavaScript and CSS
- Three.js and GLTFLoader
- GSAP
- Lenis

## Run Locally

Install Node.js, then run these commands from the project folder:

```bash
npm install
npm run dev
```

## Project Structure

src/
  app/          Pages and page-level styles
  components/   Reusable interface, animation, and 3D components
  data/         Project, about, and contact content
  lib/webgl/    Three.js rendering and transition code
  providers/    Scroll and page-transition providers
public/
  images/       Portfolio imagery
  models/       GLB model for the MG emblem
