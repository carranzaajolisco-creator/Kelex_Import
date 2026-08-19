import { useEffect, useRef } from 'react';

const UNIFORMS = {
  colors: [
    [0.02, 0.02, 0.03],
    [0.05, 0.07, 0.19],
    [0.12, 0.23, 0.91],
    [0.36, 0.49, 1.0],
  ],
};

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color0;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

vec2 warp(vec2 p, float t) {
  p.x += sin(p.y * 1.6 + t * 0.55) * 0.35;
  p.y += cos(p.x * 1.4 - t * 0.45) * 0.35;
  return p;
}

float plasma(vec2 p, float t) {
  vec2 w = warp(p, t);
  float v = 0.0;
  v += sin(w.x * 2.1 + t * 0.6);
  v += sin(w.y * 2.4 - t * 0.5);
  v += sin((w.x + w.y) * 1.7 + t * 0.4);
  v += sin(length(w) * 2.6 - t * 0.7);
  return v * 0.25 + 0.5;
}

vec3 ramp(float v) {
  vec3 c = u_color0;
  c = mix(c, u_color1, smoothstep(0.0, 0.4, v));
  c = mix(c, u_color2, smoothstep(0.35, 0.7, v));
  c = mix(c, u_color3, smoothstep(0.68, 1.0, v));
  return c;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  uv *= 1.4;

  float v = plasma(uv, u_time);
  vec3 color = ramp(v);

  float vignette = smoothstep(1.3, 0.1, length(uv));
  color *= mix(0.55, 1.0, vignette);

  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  color += (grain - 0.5) * 0.015;

  gl_FragColor = vec4(color, 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function ShaderBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const timeLocation = gl.getUniformLocation(program, 'u_time');
    const colorLocations = [0, 1, 2, 3].map((i) =>
      gl.getUniformLocation(program, `u_color${i}`)
    );

    colorLocations.forEach((loc, i) => {
      const c = UNIFORMS.colors[i];
      gl.uniform3f(loc, c[0], c[1], c[2]);
    });

    let animationFrame = 0;
    const start = performance.now();

    function resize() {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function render() {
      resize();
      const t = (performance.now() - start) / 1000;
      gl.uniform2f(resolutionLocation, canvas!.width, canvas!.height);
      gl.uniform1f(timeLocation, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationFrame = requestAnimationFrame(render);
    }

    render();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  return <canvas ref={canvasRef} className={`h-full w-full ${className}`} />;
}
