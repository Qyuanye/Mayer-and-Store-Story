import { Weather } from "./types.ts";

interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  wobble: number;
}

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let animFrameId: number = 0;
let currentWeather: Weather | null = null;
let particles: Particle[] = [];
let flashAlpha: number = 0;
let flashTarget: number = 0;
let flashDecay: number = 0;
let lastFlashTime: number = 0;

function getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (!canvas) {
    const overlay = document.getElementById("weatherOverlay");
    if (!overlay) return null;
    overlay.innerHTML = "";
    canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    overlay.appendChild(canvas);
  }
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx = canvas.getContext("2d");
  }
  if (!ctx) ctx = canvas.getContext("2d");
  return ctx ? { canvas, ctx } : null;
}

export function startWeather(weather: Weather): void {
  stopWeather();
  currentWeather = weather;
  const result = getCanvas();
  if (!result) return;
  const { canvas: c } = result;

  switch (weather) {
    case Weather.rainy:
      initRainParticles(80, c.width, c.height);
      break;
    case Weather.thunder:
      initRainParticles(60, c.width, c.height);
      lastFlashTime = 0;
      flashAlpha = 0;
      break;
    case Weather.hail:
      initHailParticles(50, c.width, c.height);
      break;
  }
  renderLoop();
}

export function stopWeather(): void {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = 0;
  }
  particles = [];
  flashAlpha = 0;
  currentWeather = null;
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function onResize(): void {
  if (!currentWeather) return;
  const result = getCanvas();
  if (!result) return;
  switch (currentWeather) {
    case Weather.rainy:
    case Weather.thunder:
      initRainParticles(currentWeather === Weather.thunder ? 60 : 80, result.canvas.width, result.canvas.height);
      break;
    case Weather.hail:
      initHailParticles(50, result.canvas.width, result.canvas.height);
      break;
  }
}

window.addEventListener("resize", onResize);

function initRainParticles(count: number, w: number, h: number): void {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 350 + Math.random() * 450,
      size: 1 + Math.random() * 1.5,
      opacity: 0.25 + Math.random() * 0.35,
      wobble: 0,
    });
  }
}

function initHailParticles(count: number, w: number, h: number): void {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h * 0.5,
      speed: 450 + Math.random() * 650,
      size: 2 + Math.random() * 3,
      opacity: 0.5 + Math.random() * 0.4,
      wobble: Math.random() * Math.PI * 2,
    });
  }
}

function renderLoop(): void {
  if (!canvas || !ctx || !currentWeather) return;
  const w = canvas.width;
  const h = canvas.height;
  const dt = 1 / 60;

  ctx.clearRect(0, 0, w, h);

  switch (currentWeather) {
    case Weather.rainy:
      drawRain(ctx, w, h, dt);
      break;
    case Weather.thunder:
      drawRain(ctx, w, h, dt);
      drawLightning(ctx, w, h);
      break;
    case Weather.hail:
      drawHail(ctx, w, h, dt);
      break;
    case Weather.foggy:
      drawFog(ctx, w, h);
      break;
    case Weather.sunny:
      drawSunny(ctx, w, h);
      break;
  }

  animFrameId = requestAnimationFrame(renderLoop);
}

function drawRain(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number): void {
  for (const p of particles) {
    p.y += p.speed * dt;
    if (p.y > h + 10) {
      p.y = -10;
      p.x = Math.random() * w;
    }
    ctx.fillStyle = `rgba(130, 175, 230, ${p.opacity})`;
    ctx.fillRect(p.x, p.y, p.size, p.size * 5);
  }
}

function drawHail(ctx: CanvasRenderingContext2D, w: number, h: number, dt: number): void {
  for (const p of particles) {
    p.y += p.speed * dt;
    p.wobble += dt * 3;
    p.x += Math.sin(p.wobble) * 60 * dt;
    if (p.y > h + 10) {
      p.y = -10;
      p.x = Math.random() * w;
    }
    if (p.x > w) p.x = 0;
    if (p.x < 0) p.x = w;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    grad.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
    grad.addColorStop(1, `rgba(200, 220, 240, ${p.opacity * 0.3})`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFog(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = "rgba(200, 210, 220, 0.35)";
  ctx.fillRect(0, 0, w, h);

  const t = performance.now() / 1000;
  for (let i = 0; i < 4; i++) {
    const y = h * 0.08 + i * h * 0.18;
    const x = ((t * 12 + i * 50 + Math.sin(t + i) * 30) % (w + 300)) - 150;
    const grad = ctx.createLinearGradient(x, 0, x + w * 0.5, 0);
    grad.addColorStop(0, "rgba(220, 225, 235, 0)");
    grad.addColorStop(0.3, "rgba(220, 225, 235, 0.25)");
    grad.addColorStop(0.7, "rgba(220, 225, 235, 0.25)");
    grad.addColorStop(1, "rgba(220, 225, 235, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w * 0.5 + 150, h * 0.07);
  }
}

function drawLightning(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const now = performance.now();
  if (lastFlashTime === 0) lastFlashTime = now;

  if (now - lastFlashTime > 4000 + Math.random() * 6000) {
    flashAlpha = 0.2 + Math.random() * 0.1;
    flashTarget = flashAlpha;
    flashDecay = 0.04 + Math.random() * 0.04;
    lastFlashTime = now;
  }

  if (flashAlpha > 0.001) {
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, w, h);
    flashAlpha -= flashDecay * (1 / 60) * 60;
    if (flashAlpha < 0) flashAlpha = 0;
  }
}

function drawSunny(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255, 230, 140, 0.08)");
  grad.addColorStop(0.5, "rgba(255, 210, 100, 0.04)");
  grad.addColorStop(1, "rgba(255, 240, 180, 0.0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const t = performance.now() / 1000;
  for (let i = 0; i < 5; i++) {
    const x = w * 0.2 + i * w * 0.15 + Math.sin(t * 0.3 + i) * 15;
    const y = -20 + Math.sin(t * 0.5 + i * 0.7) * 10;
    const size = 4 + i * 2;
    const grad2 = ctx.createRadialGradient(x, y, 0, x, y, size);
    grad2.addColorStop(0, "rgba(255, 245, 200, 0.18)");
    grad2.addColorStop(1, "rgba(255, 245, 200, 0)");
    ctx.fillStyle = grad2;
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
  }
}
