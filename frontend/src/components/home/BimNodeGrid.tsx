'use client';

import React, { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  isAnchor: boolean;
}

export function BimNodeGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 200,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      initNodes(rect.width, rect.height);
    };

    const SPACING = 48; // Spacing between architectural stud points
    let nodes: Node[] = [];

    const initNodes = (width: number, height: number) => {
      nodes = [];
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * SPACING;
          const y = j * SPACING;
          const isAnchor = (i % 3 === 0 && j % 3 === 0);

          nodes.push({
            x,
            y,
            baseX: x,
            baseY: y,
            vx: 0,
            vy: 0,
            size: isAnchor ? 2.5 : 1.5,
            isAnchor,
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const mouseRadius = mouseRef.current.radius;

      // 1. Subtle, elegant structural grid lines (low opacity)
      ctx.strokeStyle = 'rgba(228, 228, 231, 0.3)'; // Soft Zinc-200
      ctx.lineWidth = 0.6;

      for (let x = 0; x <= width; x += SPACING) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y <= height; y += SPACING) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw nodes and interactive amber connections
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (mouseX !== null && mouseY !== null) {
          const dx = mouseX - node.x;
          const dy = mouseY - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseRadius) {
            const intensity = 1 - dist / mouseRadius;

            // Draw glowing Amber vector to mouse
            ctx.strokeStyle = `rgba(217, 119, 6, ${intensity * 0.6})`;
            ctx.lineWidth = intensity * 1.5;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();

            // Connect nearby adjacent nodes
            for (let j = i + 1; j < nodes.length; j++) {
              const other = nodes[j];
              const ndx = node.x - other.x;
              const ndy = node.y - other.y;
              const ndist = Math.sqrt(ndx * ndx + ndy * ndy);

              if (ndist <= SPACING * 1.5) {
                ctx.strokeStyle = `rgba(245, 158, 11, ${intensity * 0.45})`;
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(other.x, other.y);
                ctx.stroke();
              }
            }

            // Repulsion drift
            const angle = Math.atan2(dy, dx);
            const force = intensity * 1.2;
            node.vx -= Math.cos(angle) * force;
            node.vy -= Math.sin(angle) * force;
          }
        }

        // Spring physics back to base grid
        node.vx += (node.baseX - node.x) * 0.08;
        node.vy += (node.baseY - node.y) * 0.08;
        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;

        const isHovered = mouseX !== null && mouseY !== null && Math.hypot(mouseX - node.x, mouseY - node.y) < mouseRadius;

        if (isHovered) {
          // Vibrant amber node point
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size + 1.2, 0, Math.PI * 2);
          ctx.fill();

          if (node.isAnchor) {
            ctx.strokeStyle = '#D97706';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x - 4, node.y);
            ctx.lineTo(node.x + 4, node.y);
            ctx.moveTo(node.x, node.y - 4);
            ctx.lineTo(node.x, node.y + 4);
            ctx.stroke();
          }
        } else {
          // Soft architectural point
          ctx.fillStyle = node.isAnchor ? 'rgba(161, 161, 170, 0.45)' : 'rgba(212, 212, 216, 0.35)';
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-70"
    />
  );
}
