/// <reference lib="dom" />
import React, { useEffect, useRef } from 'react';
import { View, type ViewStyle } from 'react-native';
import { AURORA_GLSL } from './shader';

const VERTEX = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

/** Browser preview: the same aurora as a WebGL fragment shader. */
export function AuroraSky({
  width,
  height,
  style,
}: {
  width: number;
  height: number;
  style?: ViewStyle;
}) {
  const host = useRef<React.ComponentRef<typeof View>>(null);

  useEffect(() => {
    const el = host.current as unknown as HTMLElement | null;
    if (!el) {
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
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, AURORA_GLSL));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'res');
    const uTime = gl.getUniformLocation(prog, 'time');
    gl.uniform2f(uRes, canvas.width, canvas.height);
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
    };
  }, [width, height]);

  return (
    <View ref={host} pointerEvents="none" style={[{ width, height }, style]} />
  );
}
