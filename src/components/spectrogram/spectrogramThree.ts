/**
 * Spectrogram Three.js Helpers
 * Functions for creating and managing Three.js scene, camera, renderer, and mesh
 */

import * as THREE from 'three'
import { CAMERA_CONFIG, RENDERER_CONFIG } from './spectrogramConfig'
import { FRAGMENT_SHADER, VERTEX_SHADER } from './spectrogramShaders'
import { getColorSchemeValue } from './spectrogramHelpers'
import { createGeometry } from './spectrogramGeometry'
import type { ColorScheme } from './spectrogramConfig'
import type { GeometryData } from './spectrogramGeometry'

export interface ThreeSceneState {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  mesh: THREE.Mesh
  geometryData: GeometryData
}

export interface ThreeSceneParams {
  container: HTMLDivElement
  zoom: number
  maxHeight: number
  colorScheme: ColorScheme
  geometryParams: {
    timeSamples: number
    frequencySamples: number
    xsize: number
    ysize: number
  }
}

/**
 * Create Three.js scene
 */
export function createScene(): THREE.Scene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)
  return scene
}

/**
 * Create camera with blog post settings
 */
export function createCamera(
  container: HTMLDivElement,
  zoom: number,
): THREE.PerspectiveCamera {
  const width = container.clientWidth || RENDERER_CONFIG.DEFAULT_WIDTH
  const height = RENDERER_CONFIG.DEFAULT_HEIGHT

  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.FOV,
    width / height,
    CAMERA_CONFIG.NEAR,
    CAMERA_CONFIG.FAR,
  )
  camera.position.z = zoom

  return camera
}

/**
 * Create WebGL renderer
 */
export function createRenderer(container: HTMLDivElement): THREE.WebGLRenderer {
  const width = container.clientWidth || RENDERER_CONFIG.DEFAULT_WIDTH
  const height = RENDERER_CONFIG.DEFAULT_HEIGHT

  const renderer = new THREE.WebGLRenderer({
    antialias: RENDERER_CONFIG.ANTIALIAS,
  })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(width, height)
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'

  return renderer
}

/**
 * Create shader material
 */
export function createShaderMaterial(
  maxHeight: number,
  colorScheme: ColorScheme,
): THREE.ShaderMaterial {
  const colorSchemeValue = getColorSchemeValue(colorScheme)

  return new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      maxHeight: { value: maxHeight },
      colorScheme: { value: colorSchemeValue },
    },
    side: THREE.DoubleSide,
    wireframe: false,
  })
}

/**
 * Create complete Three.js scene setup
 */
export function createThreeScene(params: ThreeSceneParams): ThreeSceneState {
  const { container, zoom, maxHeight, colorScheme, geometryParams } = params

  // Create scene, camera, renderer
  const scene = createScene()
  const camera = createCamera(container, zoom)
  const renderer = createRenderer(container)

  // Attach renderer to container
  container.appendChild(renderer.domElement)

  // Create geometry
  const geometryData = createGeometry(geometryParams)

  // Create material and mesh
  const material = createShaderMaterial(maxHeight, colorScheme)
  const mesh = new THREE.Mesh(geometryData.geometry, material)
  scene.add(mesh)

  // Initial render
  renderer.render(scene, camera)

  return {
    scene,
    camera,
    renderer,
    mesh,
    geometryData,
  }
}

/**
 * Cleanup Three.js resources
 */
export function cleanupThreeScene(
  renderer: THREE.WebGLRenderer | null,
  mesh: THREE.Mesh | null,
  scene: THREE.Scene | null,
  container: HTMLDivElement | null,
): void {
  if (renderer) {
    renderer.dispose()
    if (container) {
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }

  if (mesh) {
    mesh.geometry.dispose()
    if (mesh.material instanceof THREE.ShaderMaterial) {
      mesh.material.dispose()
    }
    if (scene) {
      scene.remove(mesh)
    }
  }
}

/**
 * Update camera aspect ratio on resize
 */
export function updateCameraOnResize(
  camera: THREE.PerspectiveCamera,
  container: HTMLDivElement,
): void {
  const width = container.clientWidth || RENDERER_CONFIG.DEFAULT_WIDTH
  const height = RENDERER_CONFIG.DEFAULT_HEIGHT
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

/**
 * Update renderer size on resize
 */
export function updateRendererOnResize(
  renderer: THREE.WebGLRenderer,
  container: HTMLDivElement,
): void {
  const width = container.clientWidth || RENDERER_CONFIG.DEFAULT_WIDTH
  const height = RENDERER_CONFIG.DEFAULT_HEIGHT
  renderer.setSize(width, height)
}
