/**
 * Spectrogram Animation Helpers
 * Functions for managing the animation loop and data updates
 */

import type * as THREE from 'three'

export interface AnimationState {
  analyser: AnalyserNode
  mesh: THREE.Mesh
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  dataArray: Uint8Array
  heights: Uint8Array
  frequencySamples: number
  nVertices: number
}

/**
 * Update spectrogram data by shifting existing data and adding new frequency data
 * Implements the scrolling effect from right to left (as in blog post)
 */
export function updateSpectrogramData(
  analyser: AnalyserNode,
  dataArray: Uint8Array,
  heights: Uint8Array,
  frequencySamples: number,
  nVertices: number,
): void {
  // Get current frequency data
  const tempData = new Uint8Array(frequencySamples)
  analyser.getByteFrequencyData(tempData)
  dataArray.set(tempData)

  // Scroll data from right to left
  // Each column has (frequencySamples + 1) vertices
  const start_val = frequencySamples + 1
  const end_val = nVertices - start_val

  // Shift existing data left by one column
  heights.copyWithin(0, start_val, nVertices + 1)

  // Add new data on the right (last column)
  const insertStart = end_val - start_val

  for (let j = 0; j <= frequencySamples; j++) {
    if (j < frequencySamples) {
      heights[insertStart + j] = dataArray[j] || 0
    } else {
      // Last vertex in column uses same value as previous
      heights[insertStart + j] = heights[insertStart + j - 1] || 0
    }
  }
}

/**
 * Update mesh displacement attribute with new height data
 */
export function updateMeshDisplacement(
  mesh: THREE.Mesh,
  heights: Uint8Array,
): void {
  const displacementAttr = mesh.geometry.getAttribute(
    'displacement',
  ) as THREE.BufferAttribute

  const array = displacementAttr.array as Uint8Array
  array.set(heights)
  displacementAttr.needsUpdate = true
}

/**
 * Create animation loop function
 */
export function createAnimationLoop(state: AnimationState): () => void {
  return function animate() {
    const {
      analyser,
      mesh,
      scene,
      camera,
      renderer,
      dataArray,
      heights,
      frequencySamples,
      nVertices,
    } = state

    // Update spectrogram data
    updateSpectrogramData(
      analyser,
      dataArray,
      heights,
      frequencySamples,
      nVertices,
    )

    // Update mesh displacement
    updateMeshDisplacement(mesh, heights)

    // Render
    renderer.render(scene, camera)

    // Continue animation loop
    requestAnimationFrame(animate)
  }
}
