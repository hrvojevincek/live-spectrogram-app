## Live Spectrogram App

This project is a **real‑time audio spectrogram visualizer** built with React, Vite, TanStack Router, Three.js and Shadcn UI.

It lets you:

- **Stream a live online radio** and see its spectrum evolve over time
- **Use your microphone as the audio source** for live analysis
- **Tweak visualization parameters** (zoom, height, resolution, color schemes) to explore different looks and levels of detail

### Features

- **Two audio sources**
  - **Radio stream**: currently tuned to `24/7 Seawaves Radio` (`https://ec6.yesstreaming.net:1505/stream`)
  - **Microphone input**: request mic access from the browser and visualize your surroundings
- **3D Spectrogram**
  - Three.js‑based mesh that scrolls over time
  - Adjustable **zoom**, **height**, **time window**, and **frequency resolution**
- **Color schemes**
  - Multiple built‑in gradients (e.g. purple blog‑style, fire, rainbow, grayscale)
  - Quick switching between schemes from the controls sidebar

### How to Use

1. **Install dependencies**

```bash
npm install
```

2. **Run the dev server**

```bash
npm run dev
```

3. Open the printed local URL in your browser.

4. In the left sidebar:
   - Click **“Start Radio”** to start the live radio spectrogram, or
   - Click **“Turn on Mic”** to use your microphone (the browser will ask for permission).

5. Adjust the **spectrogram controls** to change zoom, height, resolution, and color scheme.

### Tech Stack

- **Framework & tooling**: React, Vite, TypeScript
- **Routing**: TanStack Router / React Start
- **Data & DX**: TanStack Query, TanStack Devtools
- **Rendering**: Three.js for the spectrogram visualization
- **Styling**: Tailwind CSS
- **UI components**: Shadcn (Radix‑based)

### Scripts

Common npm scripts:

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run test    # Run Vitest test suite
npm run lint    # Run ESLint
npm run format  # Run Prettier
```

### Shadcn Components

Shadcn components live under `src/components/ui`.  
You can add more components with:

```bash
pnpx shadcn@latest add <component-name>
```
