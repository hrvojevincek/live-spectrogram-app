/**
 * Spectrogram Shaders
 * GLSL vertex and fragment shaders for the spectrogram visualization
 */

export const VERTEX_SHADER = `
  attribute float displacement;
  uniform float maxHeight;
  varying vec3 vPosition;
  varying float vDisplacement;

  void main() {
    vDisplacement = displacement;
    vPosition = position;
    vec3 newPosition = position;
    newPosition.z += displacement * maxHeight / 255.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

export const FRAGMENT_SHADER = `
  varying vec3 vPosition;
  varying float vDisplacement;
  uniform int colorScheme;

  vec3 getColor(float intensity) {
    float r, g, b;
    
    if (colorScheme == 0) {
      // Green (low) to Red (high) gradient
      g = 1.0 - intensity;
      r = intensity;
      b = 0.0;
    } else if (colorScheme == 1) {
      // Purple (low) to Yellow (high) gradient
      if (intensity < 0.5) {
        r = intensity * 2.0 * 0.5;
        g = intensity * 2.0 * 0.2;
        b = intensity * 2.0 * 1.0;
      } else {
        r = 0.5 + (intensity - 0.5) * 2.0 * 0.5;
        g = 0.2 + (intensity - 0.5) * 2.0 * 0.8;
        b = 1.0 - (intensity - 0.5) * 2.0 * 0.5;
      }
    } else if (colorScheme == 2) {
      // Blue (low) to Cyan (high) gradient
      r = 0.0;
      g = intensity;
      b = 1.0;
    } else if (colorScheme == 3) {
      // Purple solid color (blog post style: #433F81 = RGB(67/255, 63/255, 129/255))
      // Use intensity to modulate brightness while keeping purple hue
      float purpleR = 0.2627; // 67/255
      float purpleG = 0.2471; // 63/255
      float purpleB = 0.5059; // 129/255
      r = purpleR * (0.3 + intensity * 0.7); // Dark to bright purple
      g = purpleG * (0.3 + intensity * 0.7);
      b = purpleB * (0.3 + intensity * 0.7);
    } else if (colorScheme == 4) {
      // Red (low) to Yellow (high) - Fire gradient
      r = 1.0;
      g = intensity;
      b = 0.0;
    } else if (colorScheme == 5) {
      // Blue (low) to Magenta (high) gradient
      r = intensity;
      g = 0.0;
      b = 1.0;
    } else if (colorScheme == 6) {
      // Rainbow (HSV) - Red -> Yellow -> Green -> Cyan -> Blue -> Magenta -> Red
      float hue = intensity * 5.0; // 0 to 5 (6 colors)
      if (hue < 1.0) {
        // Red to Yellow
        r = 1.0;
        g = hue;
        b = 0.0;
      } else if (hue < 2.0) {
        // Yellow to Green
        r = 2.0 - hue;
        g = 1.0;
        b = 0.0;
      } else if (hue < 3.0) {
        // Green to Cyan
        r = 0.0;
        g = 1.0;
        b = hue - 2.0;
      } else if (hue < 4.0) {
        // Cyan to Blue
        r = 0.0;
        g = 4.0 - hue;
        b = 1.0;
      } else if (hue < 5.0) {
        // Blue to Magenta
        r = hue - 4.0;
        g = 0.0;
        b = 1.0;
      } else {
        // Magenta to Red
        r = 1.0;
        g = 0.0;
        b = 6.0 - hue;
      }
    } else if (colorScheme == 7) {
      // Grayscale
      r = intensity;
      g = intensity;
      b = intensity;
    } else if (colorScheme == 8) {
      // Orange (low) to Red (high) gradient
      r = 1.0;
      g = 0.5 * (1.0 - intensity);
      b = 0.0;
    } else if (colorScheme == 9) {
      // Cyan (low) to Blue (high) gradient
      r = 0.0;
      g = 1.0 - intensity;
      b = 1.0;
    } else if (colorScheme == 10) {
      // Yellow (low) to Green (high) gradient
      r = 1.0 - intensity;
      g = 1.0;
      b = 0.0;
    } else {
      // Default to purple (blog post style)
      float purpleR = 0.2627;
      float purpleG = 0.2471;
      float purpleB = 0.5059;
      r = purpleR * (0.3 + intensity * 0.7);
      g = purpleG * (0.3 + intensity * 0.7);
      b = purpleB * (0.3 + intensity * 0.7);
    }
    
    return vec3(r, g, b);
  }

  void main() {
    float intensity = vDisplacement / 255.0;
    vec3 color = getColor(intensity);
    // Add emissive glow for brighter areas
    float glow = intensity > 0.5 ? (intensity - 0.5) * 0.5 : 0.0;
    // Ensure minimum visibility even when intensity is very low
    vec3 finalColor = color + glow;
    if (intensity < 0.01) {
      if (colorScheme == 0) {
        finalColor = vec3(0.0, 0.1, 0.0); // Dark green
      } else if (colorScheme == 1) {
        finalColor = vec3(0.05, 0.0, 0.1); // Dark purple
      } else if (colorScheme == 2) {
        finalColor = vec3(0.0, 0.0, 0.1); // Dark blue
      } else if (colorScheme == 3) {
        finalColor = vec3(0.08, 0.07, 0.15); // Dark purple (blog style)
      } else if (colorScheme == 4) {
        finalColor = vec3(0.1, 0.0, 0.0); // Dark red
      } else if (colorScheme == 5) {
        finalColor = vec3(0.0, 0.0, 0.1); // Dark blue
      } else if (colorScheme == 6) {
        finalColor = vec3(0.05, 0.0, 0.0); // Dark red (rainbow start)
      } else if (colorScheme == 7) {
        finalColor = vec3(0.05, 0.05, 0.05); // Dark gray
      } else if (colorScheme == 8) {
        finalColor = vec3(0.1, 0.05, 0.0); // Dark orange
      } else if (colorScheme == 9) {
        finalColor = vec3(0.0, 0.1, 0.1); // Dark cyan
      } else if (colorScheme == 10) {
        finalColor = vec3(0.1, 0.1, 0.0); // Dark yellow
      } else {
        finalColor = vec3(0.08, 0.07, 0.15); // Default dark purple
      }
    }
    gl_FragColor = vec4(finalColor, 1.0);
  }
`
