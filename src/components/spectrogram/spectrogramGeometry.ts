/**
 * Spectrogram Geometry Helpers
 * Functions for creating and managing Three.js geometry
 */

import * as THREE from 'three'
import { calculateLogarithmicY } from './spectrogramHelpers'

export interface GeometryParams {
  timeSamples: number
  frequencySamples: number
  xsize: number
  ysize: number
}

export interface GeometryData {
  geometry: THREE.BufferGeometry
  vertices: number[]
  heights: Uint8Array
  nVertices: number
}

/**
 * Generate vertices for the spectrogram mesh
 * Uses logarithmic scaling for frequency axis (Y) as in blog post
 */
export function generateVertices(params: GeometryParams): {
  vertices: number[]
  heights: Uint8Array
  nVertices: number
} {
  const { timeSamples, frequencySamples, xsize, ysize } = params

  const xsegments = timeSamples
  const ysegments = frequencySamples
  const xhalfSize = xsize / 2
  const xsegmentSize = xsize / xsegments

  const nVertices = (frequencySamples + 1) * (timeSamples + 1)
  const vertices: number[] = []
  const heights = new Uint8Array(nVertices)

  for (let i = 0; i <= xsegments; i++) {
    const x = i * xsegmentSize - xhalfSize
    for (let j = 0; j <= ysegments; j++) {
      // Logarithmic spacing for frequency axis
      const y = calculateLogarithmicY(j, ysegments, ysize)
      vertices.push(x, y, 0)
      heights[i * (ysegments + 1) + j] = 0
    }
  }

  return { vertices, heights, nVertices }
}

/**
 * Generate triangle indices for the mesh
 * Creates two triangles per quad segment
 */
export function generateIndices(
  timeSamples: number,
  frequencySamples: number,
): number[] {
  const xsegments = timeSamples
  const ysegments = frequencySamples
  const indices: number[] = []

  for (let i = 0; i < xsegments; i++) {
    for (let j = 0; j < ysegments; j++) {
      const a = i * (ysegments + 1) + (j + 1)
      const b = i * (ysegments + 1) + j
      const c = (i + 1) * (ysegments + 1) + j
      const d = (i + 1) * (ysegments + 1) + (j + 1)
      // Two triangles per quad: a-b-d and b-c-d
      indices.push(a, b, d)
      indices.push(b, c, d)
    }
  }

  return indices
}

/**
 * Create complete geometry with vertices and indices
 */
export function createGeometry(params: GeometryParams): GeometryData {
  const { vertices, heights, nVertices } = generateVertices(params)
  const indices = generateIndices(params.timeSamples, params.frequencySamples)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(vertices, 3),
  )
  geometry.setIndex(indices)

  // Initialize displacement attribute with zeros
  geometry.setAttribute(
    'displacement',
    new THREE.Uint8BufferAttribute(heights, 1),
  )

  return { geometry, vertices, heights, nVertices }
}
