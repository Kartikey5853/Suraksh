// horizon-hero-section.tsx — Suraksh landing hero
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    title: "Electronic Agreement Generation & E-Signature",
    items: [
      "Generate digital agreements dynamically using templates.",
      "Allow users to review, sign, and submit documents electronically.",
      "Track document status: pending, signed, or completed.",
    ],
  },
  {
    title: "Digital Identity Verification",
    items: [
      "Implement secure identity verification workflows.",
      "Government ID upload.",
      "OTP-based identity confirmation.",
    ],
  },
  {
    title: "Secure Cloud Document Storage",
    items: [
      "Store documents securely in the cloud.",
      "Provide role-based access for users and administrators.",
      "Allow users to view, download, or share documents securely.",
    ],
  },
  {
    title: "Data Security & Encryption",
    items: [
      "End-to-end encryption for document storage and transfer.",
      "Secure authentication using JWT.",
      "Protect sensitive data with proper security standards.",
    ],
  },
  {
    title: "Automated Document Management",
    items: [
      "Automated document organization and retrieval.",
      "Smart search functionality for documents.",
      "Notification system for document updates, approvals, or expirations.",
    ],
  },
  {
    title: "Admin Dashboard",
    items: [
      "Manage document templates and verification workflows.",
      "Monitor verification status and document activity.",
      "Access analytics related to document processing.",
    ],
  },
];

const UNIQUE_FEATURES = [
  {
    num: "01",
    title: "Document Timeline Tracking",
    desc: "Track the complete lifecycle of every document — from creation to signing. Every action, every update, every person who touched it is recorded with a precise timestamp.",
  },
  {
    num: "02",
    title: "AI Document Scoring",
    desc: "Each document receives an AI-generated quality score before submission. Identify issues, improve completeness, and ensure your agreements hold up before they're ever sent.",
  },
  {
    num: "03",
    title: "Venture Capital Templates",
    desc: "Pre-built, ready-to-use agreement templates for the VC ecosystem — Term Sheets, SAFEs, SHA, SSA, and more. Close deals faster with battle-tested structures.",
  },
  {
    num: "04",
    title: "Dynamic VC Filtering",
    desc: "Intelligent filtering based on VC-specific requirements — stage, sector, jurisdiction, deal type. Surface the right documents for every deal context, automatically.",
  },
];

interface ThreeRefs {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  composer: EffectComposer | null;
  stars: THREE.Points[];
  nebula: THREE.Mesh | null;
  mountains: THREE.Mesh[];
  animationId: number | null;
  targetCameraX: number;
  targetCameraY: number;
  targetCameraZ: number;
  locations: number[];
}

export const HorizonHeroSection: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const smoothCameraPos = useRef({ x: 0, y: 30, z: 100 });

  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const totalSections = 3;

  const threeRefs = useRef<ThreeRefs>({
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    stars: [],
    nebula: null,
    mountains: [],
    animationId: null,
    targetCameraX: 0,
    targetCameraY: 30,
    targetCameraZ: 100,
    locations: [],
  });

  useEffect(() => {
    const initThree = () => {
      const { current: refs } = threeRefs;

      refs.scene = new THREE.Scene();
      refs.scene.fog = new THREE.FogExp2(0x000000, 0.00025);

      refs.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
      refs.camera.position.z = 100;
      refs.camera.position.y = 20;

      refs.renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true, alpha: true });
      refs.renderer.setSize(window.innerWidth, window.innerHeight);
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      refs.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      refs.renderer.toneMappingExposure = 0.5;

      refs.composer = new EffectComposer(refs.renderer);
      refs.composer.addPass(new RenderPass(refs.scene, refs.camera));
      refs.composer.addPass(
        new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.8, 0.4, 0.85)
      );

      createStarField();
      createNebula();
      createMountains();
      createAtmosphere();
      getLocation();
      animate();
      setIsReady(true);
    };

    const createStarField = () => {
      const { current: refs } = threeRefs;
      const starCount = 5000;
      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let j = 0; j < starCount; j++) {
          const radius = 200 + Math.random() * 800;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          positions[j * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[j * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[j * 3 + 2] = radius * Math.cos(phi);

          const color = new THREE.Color();
          const c = Math.random();
          if (c < 0.7) color.setHSL(0, 0, 0.8 + Math.random() * 0.2);
          else if (c < 0.9) color.setHSL(0.08, 0.5, 0.8);
          else color.setHSL(0.6, 0.5, 0.8);

          colors[j * 3] = color.r;
          colors[j * 3 + 1] = color.g;
          colors[j * 3 + 2] = color.b;
          sizes[j] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
          uniforms: { time: { value: 0 }, depth: { value: i } },
          vertexShader: `
            attribute float size; attribute vec3 color; varying vec3 vColor;
            uniform float time; uniform float depth;
            void main() {
              vColor = color; vec3 pos = position;
              float angle = time * 0.05 * (1.0 - depth * 0.3);
              mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
              pos.xy = rot * pos.xy;
              vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }`,
          fragmentShader: `
            varying vec3 vColor;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float opacity = 1.0 - smoothstep(0.0, 0.5, dist);
              gl_FragColor = vec4(vColor, opacity);
            }`,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });

        const stars = new THREE.Points(geometry, material);
        refs.scene!.add(stars);
        refs.stars.push(stars);
      }
    };

    const createNebula = () => {
      const { current: refs } = threeRefs;
      const geometry = new THREE.PlaneGeometry(8000, 4000, 100, 100);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          color1: { value: new THREE.Color(0x00aa44) },
          color2: { value: new THREE.Color(0x0066ff) },
          opacity: { value: 0.3 },
        },
        vertexShader: `
          varying vec2 vUv; varying float vElevation; uniform float time;
          void main() {
            vUv = uv; vec3 pos = position;
            float elevation = sin(pos.x * 0.01 + time) * cos(pos.y * 0.01 + time) * 20.0;
            pos.z += elevation; vElevation = elevation;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 color1; uniform vec3 color2; uniform float opacity; uniform float time;
          varying vec2 vUv; varying float vElevation;
          void main() {
            float mixFactor = sin(vUv.x * 10.0 + time) * cos(vUv.y * 10.0 + time);
            vec3 color = mix(color1, color2, mixFactor * 0.5 + 0.5);
            float alpha = opacity * (1.0 - length(vUv - 0.5) * 2.0);
            alpha *= 1.0 + vElevation * 0.01;
            gl_FragColor = vec4(color, alpha);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const nebula = new THREE.Mesh(geometry, material);
      nebula.position.z = -1050;
      refs.scene!.add(nebula);
      refs.nebula = nebula;
    };

    const createMountains = () => {
      const { current: refs } = threeRefs;
      const layers = [
        { distance: -50, height: 60, color: 0x0a1a0a, opacity: 1 },
        { distance: -100, height: 80, color: 0x0f2d0f, opacity: 0.8 },
        { distance: -150, height: 100, color: 0x0f3040, opacity: 0.6 },
        { distance: -200, height: 120, color: 0x0a3050, opacity: 0.4 },
      ];
      layers.forEach((layer, index) => {
        const points: THREE.Vector2[] = [];
        const segments = 50;
        for (let i = 0; i <= segments; i++) {
          const x = (i / segments - 0.5) * 1000;
          const y =
            Math.sin(i * 0.1) * layer.height +
            Math.sin(i * 0.05) * layer.height * 0.5 +
            Math.random() * layer.height * 0.2 - 100;
          points.push(new THREE.Vector2(x, y));
        }
        points.push(new THREE.Vector2(5000, -300));
        points.push(new THREE.Vector2(-5000, -300));
        const shape = new THREE.Shape(points);
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({
          color: layer.color,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.DoubleSide,
        });
        const mountain = new THREE.Mesh(geometry, material);
        mountain.position.z = layer.distance;
        mountain.position.y = layer.distance;
        mountain.userData = { baseZ: layer.distance, index };
        refs.scene!.add(mountain);
        refs.mountains.push(mountain);
      });
    };

    const createAtmosphere = () => {
      const { current: refs } = threeRefs;
      const geometry = new THREE.SphereGeometry(600, 32, 32);
      const material = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
          varying vec3 vNormal; varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal); vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `
          varying vec3 vNormal; varying vec3 vPosition; uniform float time;
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 atmosphere = vec3(0.1, 0.8, 0.4) * intensity;
            float pulse = sin(time * 2.0) * 0.1 + 0.9;
            atmosphere *= pulse;
            gl_FragColor = vec4(atmosphere, intensity * 0.25);
          }`,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
      });
      refs.scene!.add(new THREE.Mesh(geometry, material));
    };

    const animate = () => {
      const { current: refs } = threeRefs;
      refs.animationId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      refs.stars.forEach((sf) => {
        const mat = sf.material as THREE.ShaderMaterial;
        if (mat.uniforms) mat.uniforms.time.value = time;
      });

      if (refs.nebula) {
        const mat = refs.nebula.material as THREE.ShaderMaterial;
        if (mat.uniforms) mat.uniforms.time.value = time * 0.5;
      }

      if (refs.camera) {
        const s = 0.05;
        smoothCameraPos.current.x += (refs.targetCameraX - smoothCameraPos.current.x) * s;
        smoothCameraPos.current.y += (refs.targetCameraY - smoothCameraPos.current.y) * s;
        smoothCameraPos.current.z += (refs.targetCameraZ - smoothCameraPos.current.z) * s;
        refs.camera.position.x = smoothCameraPos.current.x + Math.sin(time * 0.1) * 2;
        refs.camera.position.y = smoothCameraPos.current.y + Math.cos(time * 0.15) * 1;
        refs.camera.position.z = smoothCameraPos.current.z;
        refs.camera.lookAt(0, 10, -600);
      }

      refs.mountains.forEach((m, i) => {
        const pf = 1 + i * 0.5;
        m.position.x = Math.sin(time * 0.1) * 2 * pf;
        m.position.y = 50 + Math.cos(time * 0.15) * pf;
      });

      if (refs.composer) refs.composer.render();
    };

    initThree();

    const handleResize = () => {
      const { current: refs } = threeRefs;
      if (refs.camera && refs.renderer && refs.composer) {
        refs.camera.aspect = window.innerWidth / window.innerHeight;
        refs.camera.updateProjectionMatrix();
        refs.renderer.setSize(window.innerWidth, window.innerHeight);
        refs.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      const { current: refs } = threeRefs;
      if (refs.animationId) cancelAnimationFrame(refs.animationId);
      window.removeEventListener('resize', handleResize);
      refs.stars.forEach((s) => { s.geometry.dispose(); (s.material as THREE.Material).dispose(); });
      refs.mountains.forEach((m) => { m.geometry.dispose(); (m.material as THREE.Material).dispose(); });
      if (refs.nebula) { refs.nebula.geometry.dispose(); (refs.nebula.material as THREE.Material).dispose(); }
      if (refs.renderer) refs.renderer.dispose();
    };
  }, []);

  const getLocation = () => {
    const { current: refs } = threeRefs;
    refs.locations = refs.mountains.map((m) => m.position.z);
  };

  useEffect(() => {
    if (!isReady) return;
    const elementsToShow = [titleRef.current, subtitleRef.current, scrollProgressRef.current].filter(el => el !== null);
    if (elementsToShow.length > 0) {
      gsap.set(elementsToShow, {
        visibility: 'visible',
      });
    }
    const tl = gsap.timeline();
    if (titleRef.current) {
      tl.from(titleRef.current.querySelectorAll('.title-char'), {
        y: 200, opacity: 0, duration: 1.5, stagger: 0.05, ease: 'power4.out',
      });
    }
    if (subtitleRef.current) {
      tl.from(subtitleRef.current.querySelectorAll('.subtitle-line'), {
        y: 50, opacity: 0, duration: 1, stagger: 0.2, ease: 'power3.out',
      }, '-=0.8');
    }
    if (scrollProgressRef.current) {
      tl.from(scrollProgressRef.current, { opacity: 0, y: 50, duration: 1, ease: 'power2.out' }, '-=0.5');
    }
    return () => { tl.kill(); };
  }, [isReady]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
      const newSection = Math.min(Math.floor(progress * totalSections), totalSections - 1);
      setCurrentSection(newSection);

      const { current: refs } = threeRefs;
      const totalProgress = progress * totalSections;
      const sectionProgress = totalProgress % 1;

      const cameraPositions = [
        { x: 0, y: 30, z: 300 },
        { x: 0, y: 40, z: -50 },
        { x: 0, y: 50, z: -700 },
      ];

      const currentPos = cameraPositions[newSection] ?? cameraPositions[0];
      const nextPos = cameraPositions[newSection + 1] ?? currentPos;

      refs.targetCameraX = currentPos.x + (nextPos.x - currentPos.x) * sectionProgress;
      refs.targetCameraY = currentPos.y + (nextPos.y - currentPos.y) * sectionProgress;
      refs.targetCameraZ = currentPos.z + (nextPos.z - currentPos.z) * sectionProgress;

      refs.mountains.forEach((mountain, i) => {
        const speed = 1 + i * 0.9;
        const targetZ = mountain.userData.baseZ + scrollY * speed * 0.5;
        if (refs.nebula) refs.nebula.position.z = targetZ + progress * speed * 0.01 - 100;
        mountain.position.z = progress > 0.7 ? 600000 : (refs.locations[i] ?? mountain.userData.baseZ);
      });
      if (refs.nebula && refs.mountains.length > 3) refs.nebula.position.z = refs.mountains[3].position.z;
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const splitTitle = (text: string) =>
    text.split('').map((char, i) => (
      <span key={i} className="title-char inline-block">
        {char === ' ' ? '\u00A0' : char}
      </span>
    ));

  const sectionTitles: Record<number, string> = { 0: 'SURAKSH', 1: 'PLATFORM FEATURES', 2: 'UNIQUE FEATURES' };
  const sectionSubtitles: Record<number, [string, string]> = {
    0: ['India\'s trusted platform for digital documents', 'and legally-binding e-agreements.'],
    1: ['Everything you need to secure,', 'verify, and manage agreements.'],
    2: ['Built for speed, trust,', 'and the venture capital ecosystem.'],
  };

  return (
    <>
      {/* Global styles for hero */}
      <style>{`
        .hero-container { position: relative; min-height: ${totalSections + 1}00vh; background: #000; }
        .hero-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
        .hero-content { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; text-align: center; width: 100%; max-width: 900px; padding: 0 24px; pointer-events: none; }
        .hero-title { font-size: clamp(4rem, 12vw, 10rem); font-weight: 400; letter-spacing: 0.15em; color: #d4af37; text-shadow: 0 0 80px rgba(212,175,55,0.4); line-height: 1; overflow: hidden; font-family: 'Samarkan', serif; cursor: pointer; pointer-events: all; transition: text-shadow 0.3s; }
        .hero-title:hover { text-shadow: 0 0 120px rgba(212,175,55,0.7); }
        .hero-subtitle { margin-top: 1.5rem; }
        .subtitle-line { font-size: clamp(0.9rem, 2vw, 1.15rem); color: rgba(255,255,255,0.65); letter-spacing: 0.1em; line-height: 1.8; display: block; }
        .hero-cta { margin-top: 2.5rem; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; pointer-events: all; }
        .hero-cta-btn { padding: 12px 32px; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; letter-spacing: 0.04em; transition: opacity 0.2s, transform 0.2s; }
        .hero-cta-btn:hover { opacity: 0.88; transform: translateY(-2px); }
        .scroll-progress { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .scroll-text { font-size: 0.65rem; letter-spacing: 0.25em; color: rgba(255,255,255,0.4); }
        .progress-track { width: 120px; height: 2px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: #d4af37; border-radius: 2px; transition: width 0.1s; }
        .section-counter { font-size: 0.65rem; color: rgba(255,255,255,0.3); letter-spacing: 0.2em; }
        .scroll-sections { position: relative; z-index: 5; }
        .content-section { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; max-width: 1100px; width: 100%; margin-top: 48px; }
        .feature-card { background: #fff; border: 1px solid rgba(212,175,55,0.25); border-radius: 16px; padding: 28px; }
        .feature-card h3 { font-size: 0.95rem; font-weight: 700; color: #92700a; margin-bottom: 12px; letter-spacing: 0.05em; }
        .feature-card li { font-size: 0.82rem; color: #222; padding: 4px 0 4px 20px; position: relative; line-height: 1.5; }
        .feature-card li::before { content: '✓'; position: absolute; left: 0; color: #059669; font-weight: bold; }
        .unique-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; max-width: 1100px; width: 100%; margin-top: 48px; }
        .unique-card { background: #fff; border: 1px solid rgba(14,165,233,0.3); border-radius: 16px; padding: 32px 28px; transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s; }
        .unique-card:hover { border-color: rgba(14,165,233,0.7); transform: translateY(-4px); box-shadow: 0 8px 32px rgba(14,165,233,0.15); }
        .unique-num { font-size: 2.5rem; font-weight: 900; color: rgba(14,165,233,0.7); font-family: 'Montserrat', sans-serif; }
        .unique-title { font-size: 1rem; font-weight: 700; color: #111; margin: 8px 0 12px; letter-spacing: 0.03em; }
        .unique-desc { font-size: 0.82rem; color: #444; line-height: 1.7; }
        .section-heading { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; color: #fff; letter-spacing: 0.1em; text-align: center; font-family: 'Montserrat', sans-serif; }
        .section-heading span { color: #d4af37; }
        .section-sub { font-size: 1rem; color: rgba(255,255,255,0.5); margin-top: 12px; text-align: center; letter-spacing: 0.05em; }
      `}</style>

      <div ref={containerRef} className="hero-container">
        <canvas ref={canvasRef} className="hero-canvas" />

        {/* Centered hero title + CTA — fades out when scrolling past first section */}
        <div 
          className="hero-content" 
          id="hero-overlay"
          style={{ 
            opacity: currentSection === 0 ? 1 : 0,
            transition: 'opacity 0.6s ease-out',
            pointerEvents: currentSection === 0 ? 'auto' : 'none'
          }}
        >
          <h1
            ref={titleRef}
            className="hero-title"
            onClick={() => navigate('/')}
          >
            {splitTitle(sectionTitles[currentSection] ?? 'SURAKSH')}
          </h1>
          <div className="hero-subtitle" ref={subtitleRef}>
            {(sectionSubtitles[currentSection] ?? sectionSubtitles[0]).map((line, i) => (
              <span key={i} className="subtitle-line">{line}</span>
            ))}
          </div>
          <div className="hero-cta">
            <button className="hero-cta-btn" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }} onClick={() => navigate('/user/login')}>User Login →</button>
            <button className="hero-cta-btn" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff' }} onClick={() => navigate('/admin/login')}>Admin Portal →</button>
          </div>
        </div>

        {/* Scroll progress */}
        <div ref={scrollProgressRef} className="scroll-progress" style={{ visibility: 'hidden' }}>
          <div className="scroll-text">SCROLL</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${scrollProgress * 100}%` }} />
          </div>
          <div className="section-counter">
            {String(currentSection + 1).padStart(2, '0')} / {String(totalSections).padStart(2, '0')}
          </div>
        </div>

        {/* Scroll sections */}
        <div className="scroll-sections">
          {/* Section 0 spacer — SURAKSH hero */}
          <div style={{ minHeight: '100vh' }} />

          {/* Section 1 spacer — one extra step before features */}
          <div style={{ minHeight: '100vh' }} />

          {/* Section 2 — Platform Features */}
          <section className="content-section">
            <h2 className="section-heading">PLATFORM <span>FEATURES</span></h2>
            <p className="section-sub">Everything built into Suraksh</p>
            <div className="features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card">
                  <h3>{f.title}</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {f.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3 — Unique Features */}
          <section className="content-section">
            <h2 className="section-heading">WHY <span>SURAKSH</span></h2>
            <p className="section-sub">Unique features built for the modern deal</p>
            <div className="unique-grid">
              {UNIQUE_FEATURES.map((f) => (
                <div key={f.num} className="unique-card">
                  <div className="unique-num">{f.num}</div>
                  <div className="unique-title">{f.title}</div>
                  <div className="unique-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </section>


        </div>
      </div>
    </>
  );
};

export default HorizonHeroSection;
