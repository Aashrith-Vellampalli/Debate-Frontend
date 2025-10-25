"use client";
import React, { useRef, useEffect, useState } from "react";

export default function LiquidEther({
  colors = ["#5227FF", "#FF9FFC", "#B19EEF"],
  mouseForce = 20,
  cursorSize = 100,
  isViscous = false,
  viscous = 30,
  iterationsViscous = 32,
  iterationsPoisson = 32,
  resolution = 0.5,
  isBounce = false,
  autoDemo = true,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
  takeoverDuration = 0.25,
  autoResumeDelay = 3000,
  autoRampDuration = 0.6,
  testMode = false,
}) {
  const ref = useRef(null);
  const rafRef = useRef();
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prm = window.matchMedia("(prefers-reduced-motion: reduce)");
    function update() {
      setShouldRender(!prm.matches);
    }
    update();
    prm.addEventListener?.("change", update);

    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = 0;
    let h = 0;
    let scale = Math.max(0.25, Math.min(1, resolution));

    const blobs = [];
    const blobCount = Math.max(5, colors.length + 2);
    for (let i = 0; i < blobCount; i++) {
      blobs.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        r: 0.15 + Math.random() * 0.25,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2,
      });
    }

    let pointer = { x: null, y: null, active: false };
    let lastPointerTime = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width * scale));
      h = Math.max(1, Math.floor(rect.height * scale));
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    }

    const onMove = (e) => {
      pointer.x = (e.touches ? e.touches[0].clientX : e.clientX) - canvas.getBoundingClientRect().left;
      pointer.y = (e.touches ? e.touches[0].clientY : e.clientY) - canvas.getBoundingClientRect().top;
      pointer.active = true;
      lastPointerTime = Date.now();
    };

    const onLeave = () => {
      pointer.active = false;
      pointer.x = null;
      pointer.y = null;
    };

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchend", onLeave);

    resize();

  let t = 0;

    function draw() {
      t += autoSpeed * 0.01;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        b.phase += 0.01 + 0.02 * Math.sin(t + i);
        b.x += b.vx + 0.0006 * Math.sin(t + i * 0.7);
        b.y += b.vy + 0.0006 * Math.cos(t + i * 0.9);

        if (autoDemo && !pointer.active) {
          const ax = 0.5 + 0.35 * Math.sin(t * (0.2 + i * 0.05) + i);
          const ay = 0.5 + 0.35 * Math.cos(t * (0.14 + i * 0.03) + i * 1.3);
          b.x += (ax - b.x) * 0.003 * autoIntensity;
          b.y += (ay - b.y) * 0.003 * autoIntensity;
        }

        if (pointer.active && pointer.x != null) {
          const px = pointer.x / (canvas.getBoundingClientRect().width) ;
          const py = pointer.y / (canvas.getBoundingClientRect().height) ;
          const dx = px - b.x;
          const dy = py - b.y;
          const d2 = dx * dx + dy * dy;
          const f = Math.min(1, mouseForce / Math.max(0.0001, d2 * 200));
          b.x += dx * 0.06 * f;
          b.y += dy * 0.06 * f;
        }

        if (isBounce) {
          if (b.x < 0) { b.x = 0; b.vx *= -1; }
          if (b.x > 1) { b.x = 1; b.vx *= -1; }
          if (b.y < 0) { b.y = 0; b.vy *= -1; }
          if (b.y > 1) { b.y = 1; b.vy *= -1; }
        } else {
          if (b.x < -0.2) b.x = 1.2;
          if (b.x > 1.2) b.x = -0.2;
          if (b.y < -0.2) b.y = 1.2;
          if (b.y > 1.2) b.y = -0.2;
        }

        const cx = b.x * w;
        const cy = b.y * h;
        const radius = Math.max(20, b.r * Math.min(w, h) * (cursorSize / 100));
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, hexToRgba(b.color, 0.4));
        grad.addColorStop(0.4, hexToRgba(b.color, 0.25));
        grad.addColorStop(0.7, hexToRgba(b.color, 0.1));
        grad.addColorStop(1, hexToRgba(b.color, 0.0));
        ctx.globalCompositeOperation = "normal";
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      if (testMode) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = Math.max(1, Math.min(3, w / 800));
        const step = Math.max(40, Math.floor(Math.min(w, h) / 12));
        for (let x = 0; x < w; x += step) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `${Math.max(12, Math.floor(Math.min(w, h) / 24))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('LIQUID ETHER — TEST MODE', w / 2, h / 2);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

  rafRef.current = requestAnimationFrame(draw);

    function cleanup() {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchend", onLeave);
    }

    return () => {
      cleanup();
      prm.removeEventListener?.("change", update);
    };
  }, [colors, mouseForce, cursorSize, isViscous, viscous, resolution, isBounce, autoDemo, autoSpeed, autoIntensity]);

  if (!shouldRender) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
        opacity: 1,
        transition: "opacity 0.3s ease-in-out",
      }}
    />
  );
}

function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
