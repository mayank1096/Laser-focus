/// <reference lib="dom" />
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { colourUniforms, glslFor } from './presets';
import type { ShaderViewProps } from './ShaderView';

const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

/** Browser preview: the same preset as a WebGL fragment shader. */
export function ShaderView({
  preset,
  width,
  height,
  colours,
  style,
}: ShaderViewProps) {
  const host = useRef<React.ComponentRef<typeof View>>(null);
  const key = colours?.join();

  useEffect(() => {
    const el = host.current as unknown as HTMLElement | null;
    if (!el || !width || !height) {
      return;
    }
    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.style.display = 'block';
    el.appendChild(canvas);
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true });
    if (!gl) {
      return () => canvas.remove();
    }
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, glslFor(preset)));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(
      gl.getUniformLocation(prog, 'res'),
      canvas.width,
      canvas.height,
    );
    colourUniforms(key ? key.split(',') : []).forEach((c, i) =>
      gl.uniform3f(gl.getUniformLocation(prog, `c${i}`), c[0], c[1], c[2]),
    );
    const uTime = gl.getUniformLocation(prog, 'time');
    const start = Date.now();
    let frame = 0;
    const draw = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uTime, (Date.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      canvas.remove();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [preset, width, height, key]);

  return (
    <View ref={host} pointerEvents="none" style={[{ width, height }, style]} />
  );
}
