import { useEffect, useRef } from 'react';

/**
 * Tunable display parameters applied client-side on top of the JPEG
 * preview to allow real-time levels and RGB-balance adjustments
 * without round-tripping to the server.
 *
 * The server already produced an MTF-stretched, JPEG-encoded preview;
 * this canvas operates on that 8-bit baseline as a starting point.
 * Values are meant to be small corrections (±20% typical), not a full
 * second stretch.
 */
export interface LiveLevels {
  /** Black point in [0, 1]. Pixels at or below become 0. */
  black: number;
  /** White point in [0, 1]. Pixels at or above become 1. */
  white: number;
  /** Midtones / gamma exponent (1 = linear). 0.4-2.5 typical. */
  gamma: number;
  /** Per-channel multiplicative gain (RGB). */
  redGain: number;
  greenGain: number;
  blueGain: number;
}

export const DEFAULT_LEVELS: LiveLevels = {
  black: 0,
  white: 1,
  gamma: 1,
  redGain: 1,
  greenGain: 1,
  blueGain: 1,
};

interface LiveCanvasProps {
  /** Source JPEG URL. Re-fetched each time the prop changes. */
  imageUrl: string | null;
  /** Display adjustments. */
  levels: LiveLevels;
  /** Optional className forwarded to the underlying ``<canvas>``. */
  className?: string;
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texcoord;
out vec2 v_texcoord;
void main() {
  v_texcoord = a_texcoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_texcoord;
out vec4 outColor;

uniform sampler2D u_texture;
uniform float u_black;
uniform float u_white;
uniform float u_invGamma;
uniform vec3  u_gain;

void main() {
  vec3 c = texture(u_texture, v_texcoord).rgb;
  // Normalise around the new black/white points.
  float range = max(u_white - u_black, 1.0e-4);
  c = clamp((c - u_black) / range, 0.0, 1.0);
  // Midtones / gamma.
  c = pow(c, vec3(u_invGamma));
  // Per-channel RGB gain (simple white balance).
  c = clamp(c * u_gain, 0.0, 1.0);
  outColor = vec4(c, 1.0);
}
`;

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create WebGL shader');
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? 'unknown';
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create WebGL program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program) ?? 'unknown';
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info}`);
  }
  return program;
}

interface GLState {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  uniforms: {
    black: WebGLUniformLocation;
    white: WebGLUniformLocation;
    invGamma: WebGLUniformLocation;
    gain: WebGLUniformLocation;
  };
  imageWidth: number;
  imageHeight: number;
}

/**
 * WebGL2 canvas rendering the live-stack preview with adjustable
 * black/white points, gamma and RGB balance.
 *
 * The component is intentionally low-overhead: it stores GL state in a
 * ref and only redraws on prop change (image URL or levels).
 */
export function LiveCanvas({ imageUrl, levels, className }: LiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GLState | null>(null);

  // Initialise GL pipeline once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
    if (!gl) {
      console.error('WebGL2 is not available in this browser.');
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = linkProgram(gl, vs, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Full-screen quad (two triangles).
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    // Flip Y so the JPEG renders right-side-up.
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
      gl.STATIC_DRAW,
    );
    const aTex = gl.getAttribLocation(program, 'a_texcoord');
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to allocate WebGL texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uBlack = gl.getUniformLocation(program, 'u_black');
    const uWhite = gl.getUniformLocation(program, 'u_white');
    const uInvGamma = gl.getUniformLocation(program, 'u_invGamma');
    const uGain = gl.getUniformLocation(program, 'u_gain');
    if (!uBlack || !uWhite || !uInvGamma || !uGain) {
      throw new Error('Missing WebGL uniform locations');
    }

    stateRef.current = {
      gl,
      program,
      texture,
      uniforms: { black: uBlack, white: uWhite, invGamma: uInvGamma, gain: uGain },
      imageWidth: 0,
      imageHeight: 0,
    };

    return () => {
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
      stateRef.current = null;
    };
  }, []);

  // Reload texture when the image URL changes.
  useEffect(() => {
    const state = stateRef.current;
    if (!state || !imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const { gl, texture } = state;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img);
      state.imageWidth = img.naturalWidth;
      state.imageHeight = img.naturalHeight;
      drawScene(state, levels);
    };
    img.onerror = () => console.warn('Failed to load live preview', imageUrl);
    img.src = imageUrl;
  }, [imageUrl, levels]);

  // Redraw whenever the user moves a slider.
  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    drawScene(state, levels);
  }, [levels]);

  return (
    <canvas
      ref={canvasRef}
      width={1024}
      height={768}
      className={className ?? 'w-full h-full block bg-black'}
    />
  );
}

function drawScene(state: GLState, levels: LiveLevels): void {
  const { gl, program, uniforms, imageWidth, imageHeight } = state;
  if (imageWidth === 0 || imageHeight === 0) return;

  // Resize the drawing buffer to match the image (preserves crispness).
  if (gl.canvas.width !== imageWidth || gl.canvas.height !== imageHeight) {
    gl.canvas.width = imageWidth;
    gl.canvas.height = imageHeight;
  }
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);
  gl.uniform1f(uniforms.black, levels.black);
  gl.uniform1f(uniforms.white, levels.white);
  gl.uniform1f(uniforms.invGamma, 1 / Math.max(levels.gamma, 1e-3));
  gl.uniform3f(uniforms.gain, levels.redGain, levels.greenGain, levels.blueGain);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
