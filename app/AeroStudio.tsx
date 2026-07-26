"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Aperture, ArrowLeft, ChevronDown, Cloud, Download, Droplets, Flower2,
  FolderOpen, ImagePlus, Layers3, Leaf, Maximize2, Minus, MousePointer2,
  Plus, Redo2, RotateCcw, Save, Settings2, Sparkles, Trash2, Upload,
  WandSparkles, X,
} from "lucide-react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";

type ToolTab = "frames" | "decorations" | "effects" | "background";
type Sticker = { id: string; label: string; family: "water" | "nature" | "crystal" | "aero"; file: string };

const stickers: Sticker[] = [
  { id: "dolphin-splash", label: "Dolphin splash", family: "water", file: "dolphin-splash.png" },
  { id: "rainbow-horizon", label: "Rainbow horizon", family: "aero", file: "rainbow-horizon.png" },
  { id: "pearl-bubbles", label: "Pearl bubbles", family: "water", file: "pearl-bubbles.png" },
  { id: "ocean-wave", label: "Ocean wave", family: "water", file: "ocean-wave.png" },
  { id: "aquarium-orb", label: "Aquarium orb", family: "crystal", file: "aquarium-orb.png" },
  { id: "aero-player", label: "Aero player", family: "aero", file: "aero-player.png" },
  { id: "glass-mp3", label: "Glass MP3", family: "aero", file: "glass-mp3.png" },
  { id: "music-bubbles", label: "Music bubbles", family: "crystal", file: "music-bubbles.png" },
  { id: "crystal-disc", label: "Crystal disc", family: "aero", file: "crystal-disc.png" },
  { id: "glass-gamepad", label: "Glass gamepad", family: "aero", file: "glass-gamepad.png" },
  { id: "city-fishbowl", label: "City fishbowl", family: "crystal", file: "city-fishbowl.png" },
  { id: "jumping-dolphin", label: "Jumping dolphin", family: "water", file: "jumping-dolphin.png" },
  { id: "sky-porthole", label: "Sky porthole", family: "crystal", file: "sky-porthole.png" },
  { id: "aqua-platform", label: "Aqua platform", family: "crystal", file: "aqua-platform.png" },
  { id: "bubble-cloud", label: "Bubble cloud", family: "water", file: "bubble-cloud.png" },
  { id: "garden-pod", label: "Garden pod", family: "nature", file: "garden-pod.png" },
  { id: "fresh-sprout", label: "Fresh sprout", family: "nature", file: "fresh-sprout.png" },
  { id: "green-globe", label: "Green globe", family: "nature", file: "green-globe.png" },
  { id: "leaf-water-ribbon", label: "Leaf water", family: "nature", file: "leaf-water-ribbon.png" },
  { id: "water-crescent", label: "Water crescent", family: "water", file: "water-crescent.png" },
  { id: "blue-bubble-pack", label: "Blue bubbles", family: "water", file: "blue-bubble-pack.png" },
  { id: "clean-city-meadow", label: "Clean city", family: "nature", file: "clean-city-meadow.png" },
  { id: "sunflower-bouquet", label: "Sunflowers", family: "nature", file: "sunflower-bouquet.png" },
  { id: "daisy-meadow", label: "Daisy meadow", family: "nature", file: "daisy-meadow.png" },
  { id: "aero-laptop", label: "Aero laptop", family: "aero", file: "aero-laptop.png" },
];

function GlassButton({ children, primary, className = "", onClick }: {
  children: React.ReactNode; primary?: boolean; className?: string; onClick?: () => void;
}) {
  return <button onClick={onClick} className={`glass-button ${primary ? "primary" : ""} ${className}`}>{children}</button>;
}

function WindowControls() {
  return <div className="window-controls" aria-hidden="true">
    <button><Minus size={11} /></button><button><Maximize2 size={10} /></button><button className="close"><X size={11} /></button>
  </div>;
}

export default function AeroStudio() {
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [activeTab, setActiveTab] = useState<ToolTab>("decorations");
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [radius, setRadius] = useState(36);
  const [borderWidth, setBorderWidth] = useState(12);
  const [zoom, setZoom] = useState(67);
  const [imageName, setImageName] = useState("Untitled Decoration");
  const [hasImage, setHasImage] = useState(false);
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen !== "editor" || !canvasElement.current || fabricRef.current) return;
    let active = true;
    import("fabric").then(({ Canvas }) => {
      if (!active || !canvasElement.current) return;
      const canvas = new Canvas(canvasElement.current, {
        width: 720, height: 720, preserveObjectStacking: true, backgroundColor: "rgba(255,255,255,0)",
      });
      canvas.on("selection:created", (e) => syncSelection(e.selected?.[0] ?? null));
      canvas.on("selection:updated", (e) => syncSelection(e.selected?.[0] ?? null));
      canvas.on("selection:cleared", () => setSelected(null));
      canvas.on("object:rotating", (e) => setRotation(Math.round(e.target?.angle ?? 0)));
      fabricRef.current = canvas;
    });
    return () => { active = false; fabricRef.current?.dispose(); fabricRef.current = null; };
  }, [screen]);

  const syncSelection = (obj: FabricObject | null) => {
    setSelected(obj);
    if (obj) {
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
      setRotation(Math.round(obj.angle ?? 0));
    }
  };

  const addSticker = useCallback(async (sticker: Sticker, x = 360, y = 360) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const { FabricImage } = await import("fabric");
    const asset = await FabricImage.fromURL(`/decors/${sticker.file}`, { crossOrigin: "anonymous" });
    const maxSize = 270;
    const scale = Math.min(maxSize / (asset.width || 1), maxSize / (asset.height || 1), 1);
    asset.set({
      left: x, top: y, originX: "center", originY: "center",
      scaleX: scale, scaleY: scale,
    });
    canvas.add(asset); canvas.setActiveObject(asset); canvas.requestRenderAll(); syncSelection(asset);
    return;
    /*
    const { Circle, Ellipse, Group, Gradient, Line, Path, Polygon, Rect, Shadow } = await import("fabric");
    const shine = new Gradient({ type: "radial", gradientUnits: "percentage", coords: { x1: .28, y1: .2, r1: 0, x2: .5, y2: .5, r2: .55 }, colorStops: [
      { offset: 0, color: "rgba(255,255,255,.98)" }, { offset: .18, color: "rgba(165,245,255,.8)" },
      { offset: .62, color: "rgba(46,169,228,.3)" }, { offset: 1, color: "rgba(16,91,180,.12)" },
    ]});
    const shadow = new Shadow({ color: "rgba(0,82,145,.35)", blur: 15, offsetY: 7 });
    let parts: FabricObject[] = [];
    if (sticker.id === "bubble-cluster") {
      parts = [[0,15,52],[-57,-18,29],[51,-39,23],[70,25,15],[-76,45,12]].map(([left,top,r]) =>
        new Circle({ left, top, radius:r, originX:"center",originY:"center",fill:shine,stroke:"rgba(235,255,255,.9)",strokeWidth:3,shadow }));
    } else if (sticker.id === "water-splash") {
      parts = [
        new Path("M -95 32 C -54 -5 -33 30 1 -9 C 31 -43 54 9 98 -23 C 74 31 43 54 -1 50 C -48 54 -72 46 -95 32 Z",{fill:"rgba(63,196,244,.58)",stroke:"#d6fbff",strokeWidth:3,shadow}),
        ...[-65,-31,24,59].map((left,i)=>new Ellipse({left,top:-30-(i%2)*17,rx:8+i*2,ry:15+i*3,angle:i%2?-22:18,fill:shine,stroke:"#e8ffff",strokeWidth:2}))
      ];
    } else if (sticker.id === "glass-orb") {
      parts = [new Circle({radius:86,originX:"center",originY:"center",fill:shine,stroke:"rgba(255,255,255,.95)",strokeWidth:4,shadow}),
        new Ellipse({left:-22,top:-35,rx:30,ry:14,angle:-28,fill:"rgba(255,255,255,.58)",originX:"center",originY:"center"}),
        new Path("M -58 28 Q -20 4 8 25 T 61 16 Q 36 62 -4 66 Q -37 61 -58 28 Z",{fill:"rgba(63,190,107,.72)",stroke:"#b8ffd0",strokeWidth:2})];
    } else if (sticker.id === "lens-flare") {
      parts = [new Circle({radius:58,originX:"center",originY:"center",fill:new Gradient({type:"radial",gradientUnits:"percentage",coords:{x1:.5,y1:.5,r1:0,x2:.5,y2:.5,r2:.5},colorStops:[{offset:0,color:"#fff"},{offset:.14,color:"#dfffff"},{offset:.42,color:"rgba(91,218,255,.45)"},{offset:.7,color:"rgba(255,125,230,.18)"},{offset:1,color:"rgba(255,255,255,0)"}]})}),
        new Line([-105,0,105,0],{stroke:"rgba(255,255,255,.8)",strokeWidth:3}),new Line([0,-105,0,105],{stroke:"rgba(255,255,255,.8)",strokeWidth:3}),
        new Polygon([{x:0,y:-82},{x:11,y:-11},{x:82,y:0},{x:11,y:11},{x:0,y:82},{x:-11,y:11},{x:-82,y:0},{x:-11,y:-11}],{fill:"rgba(255,255,255,.76)"})];
    } else if (sticker.id === "aqua-fish") {
      parts = [new Ellipse({rx:70,ry:37,originX:"center",originY:"center",fill:new Gradient({type:"linear",gradientUnits:"pixels",coords:{x1:0,y1:-35,x2:0,y2:35},colorStops:[{offset:0,color:"#fff17a"},{offset:.42,color:"#53d9e9"},{offset:1,color:"#0b72c4"}]}),stroke:"#eaffff",strokeWidth:3,shadow}),
        new Polygon([{x:-61,y:0},{x:-105,y:-38},{x:-98,y:38}],{fill:"#21a6db",stroke:"#eaffff",strokeWidth:2}),new Circle({left:42,top:-9,radius:5,fill:"#08396b"}),new Circle({left:44,top:-11,radius:1.5,fill:"#fff"})];
    } else if (sticker.id === "blue-butterfly") {
      parts = [new Ellipse({left:-35,top:-18,rx:36,ry:48,angle:-28,fill:"rgba(68,186,255,.78)",stroke:"#dfffff",strokeWidth:3,shadow}),new Ellipse({left:35,top:-18,rx:36,ry:48,angle:28,fill:"rgba(92,120,255,.76)",stroke:"#dfffff",strokeWidth:3}),
        new Ellipse({left:-25,top:36,rx:23,ry:32,angle:24,fill:"rgba(72,111,235,.8)",stroke:"#dfffff",strokeWidth:2}),new Ellipse({left:25,top:36,rx:23,ry:32,angle:-24,fill:"rgba(72,111,235,.8)",stroke:"#dfffff",strokeWidth:2}),new Ellipse({rx:6,ry:43,fill:"#15558e",originX:"center",originY:"center"})];
    } else if (sticker.id === "clean-leaf") {
      parts = [new Path("M -78 62 Q -26 -25 73 -73",{fill:"",stroke:"#4cad41",strokeWidth:7}),
        ...[[-54,35,-28],[-22,5,-38],[14,-26,-36],[42,-50,-23],[-36,25,145],[-2,-6,142],[30,-35,145]].map(([left,top,angle],i)=>new Ellipse({left,top,rx:28-i%2*4,ry:12,angle,fill:i%2?"#84e267":"#4fc65b",stroke:"#d9ffd8",strokeWidth:2,shadow}))];
    } else if (sticker.id === "daisy-sprig") {
      parts = [new Line([0,60,0,-45],{stroke:"#50a942",strokeWidth:6}),...[0,45,90,135,180,225,270,315].map(angle=>new Ellipse({left:Math.cos(angle*Math.PI/180)*30,top:-60+Math.sin(angle*Math.PI/180)*30,rx:12,ry:26,angle:angle+90,fill:"#fff",stroke:"#ccecff",strokeWidth:2,originX:"center",originY:"center",shadow})),new Circle({left:0,top:-60,radius:17,fill:"#ffe04c",stroke:"#fff4aa",strokeWidth:3,originX:"center",originY:"center"})];
    } else if (sticker.id === "grass-corner") {
      parts = Array.from({length:13},(_,i)=>new Path(`M ${-95+i*15} 70 Q ${-105+i*15} ${15-(i%3)*18} ${-85+i*15} ${-40-(i%4)*12}`,{fill:"",stroke:i%2?"#74d648":"#3aaa3d",strokeWidth:7,shadow}));
    } else if (sticker.id === "aero-bow") {
      parts = [new Ellipse({left:-48,rx:46,ry:35,angle:-20,fill:"rgba(119,231,255,.72)",stroke:"#e8ffff",strokeWidth:4,shadow}),new Ellipse({left:48,rx:46,ry:35,angle:20,fill:"rgba(119,231,255,.72)",stroke:"#e8ffff",strokeWidth:4}),new Circle({radius:20,fill:shine,stroke:"#fff",strokeWidth:3,originX:"center",originY:"center"}),new Polygon([{x:-10,y:18},{x:-60,y:92},{x:-8,y:68}],{fill:"rgba(92,205,238,.7)",stroke:"#e8ffff",strokeWidth:3}),new Polygon([{x:10,y:18},{x:60,y:92},{x:8,y:68}],{fill:"rgba(92,205,238,.7)",stroke:"#e8ffff",strokeWidth:3})];
    } else if (sticker.id === "cloud-puff") {
      parts = [new Ellipse({rx:86,ry:38,top:18,fill:"rgba(255,255,255,.88)",stroke:"#d9f6ff",strokeWidth:3,shadow,originX:"center",originY:"center"}),new Circle({left:-44,top:-10,radius:42,fill:"rgba(255,255,255,.9)",stroke:"#d9f6ff",strokeWidth:3,originX:"center",originY:"center"}),new Circle({left:12,top:-28,radius:56,fill:"rgba(255,255,255,.9)",stroke:"#d9f6ff",strokeWidth:3,originX:"center",originY:"center"}),new Circle({left:59,top:1,radius:36,fill:"rgba(255,255,255,.9)",stroke:"#d9f6ff",strokeWidth:3,originX:"center",originY:"center"})];
    } else {
      parts = [new Circle({radius:78,originX:"center",originY:"center",fill:new Gradient({type:"radial",gradientUnits:"percentage",coords:{x1:.32,y1:.24,r1:0,x2:.5,y2:.5,r2:.52},colorStops:[{offset:0,color:"#fff"},{offset:.13,color:"#76ecff"},{offset:.48,color:"#138bd5"},{offset:.7,color:"#2ebd52"},{offset:1,color:"#07549d"}]}),stroke:"#efffff",strokeWidth:6,shadow}),new Rect({width:72,height:72,rx:12,ry:12,originX:"center",originY:"center",fill:"rgba(255,255,255,.24)",angle:45}),new Circle({radius:18,fill:"#fff",opacity:.75,originX:"center",originY:"center"})];
    }
    const item = new Group(parts, { left:x,top:y,originX:"center",originY:"center" });
    canvas.add(item); canvas.setActiveObject(item); canvas.requestRenderAll(); syncSelection(item);
    */
  }, []);

  const addFrame = useCallback(async (kind: "glass" | "gradient" | "rounded" | "water" | "chrome" | "corners" = "glass") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const { Circle, Group, Path, Rect, Shadow, Gradient } = await import("fabric");
    if (kind === "corners") {
      const corners = [[-294,-294,0],[294,-294,90],[294,294,180],[-294,294,270]].map(([left,top,angle]) =>
        new Path("M 0 92 L 0 24 Q 0 0 24 0 L 92 0",{left,top,angle,fill:"",stroke:"rgba(231,252,255,.96)",strokeWidth:16,strokeLineCap:"round",shadow:new Shadow({color:"#159deaaa",blur:18})}));
      const frame = new Group(corners,{left:360,top:360,originX:"center",originY:"center"});
      canvas.add(frame); canvas.setActiveObject(frame); canvas.requestRenderAll(); syncSelection(frame); return;
    }
    const stroke = kind === "gradient"
      ? new Gradient({ type: "linear", gradientUnits: "pixels", coords: { x1: 0, y1: 0, x2: 640, y2: 640 }, colorStops: [
        { offset: 0, color: "#ffffff" }, { offset: .35, color: "#57ccff" }, { offset: .7, color: "#b373ff" }, { offset: 1, color: "#ffffff" },
      ]}) : kind === "water" ? "rgba(73,208,247,.78)" : kind === "chrome" ? "#f6fdff" : kind === "glass" ? "rgba(220,248,255,.88)" : "#56bdf2";
    const frame = new Rect({
      left: 360, top: 360, originX: "center", originY: "center", width: 620, height: 620,
      fill: "rgba(255,255,255,.03)", stroke, strokeWidth: borderWidth, rx: kind === "rounded" ? radius : 24,
      ry: kind === "rounded" ? radius : 24, shadow: new Shadow({ color: kind === "chrome" ? "rgba(255,255,255,.9)" : "rgba(0,78,150,.36)", blur: kind === "chrome" ? 9 : 22, offsetY: 8 }),
    });
    if (kind === "water") {
      frame.set({left:0,top:0});
      const drops = [[-270,-270,10],[270,-260,15],[-280,270,14],[276,272,9]].map(([left,top,r])=>new Circle({left,top,radius:r,originX:"center",originY:"center",fill:"rgba(195,248,255,.72)",stroke:"#fff",strokeWidth:2}));
      const group = new Group([frame,...drops],{left:360,top:360,originX:"center",originY:"center"});
      canvas.add(group); canvas.setActiveObject(group); canvas.requestRenderAll(); syncSelection(group);
    } else {
      canvas.add(frame); canvas.setActiveObject(frame); canvas.requestRenderAll(); syncSelection(frame);
    }
  }, [borderWidth, radius]);

  const applyImageEffect = async (kind: "dream" | "clean" | "aqua" | "soft") => {
    if (!selected || selected.type !== "image") return;
    const { filters } = await import("fabric");
    const image = selected as FabricObject & { filters: unknown[]; applyFilters: () => void };
    if (kind === "dream") image.filters = [new filters.Brightness({brightness:.08}),new filters.Saturation({saturation:.28}),new filters.Blur({blur:.035})];
    if (kind === "clean") image.filters = [new filters.Brightness({brightness:.05}),new filters.Contrast({contrast:.12}),new filters.Saturation({saturation:.18})];
    if (kind === "aqua") image.filters = [new filters.HueRotation({rotation:.49}),new filters.Saturation({saturation:.2}),new filters.Brightness({brightness:.06})];
    if (kind === "soft") image.filters = [new filters.Blur({blur:.08}),new filters.Brightness({brightness:.12})];
    image.applyFilters(); fabricRef.current?.requestRenderAll();
  };

  const setCanvasBackground = async (kind: "transparent" | "sky" | "meadow" | "pearl" | "aqua") => {
    const canvas = fabricRef.current; if (!canvas) return;
    if (kind === "transparent") canvas.set({backgroundColor:"rgba(255,255,255,0)"});
    else {
      const { Gradient } = await import("fabric");
      const palettes = {
        sky:[["#6fd6ff",0],["#eefcff",.58],["#b4ed77",1]],
        meadow:[["#36bdf1",0],["#dffbff",.5],["#78d744",.72],["#289d3e",1]],
        pearl:[["#ffffff",0],["#dff8ff",.45],["#f5fbff",.72],["#bde9ed",1]],
        aqua:[["#078ee0",0],["#48d8f1",.5],["#d6ffff",1]],
      } as const;
      canvas.set({backgroundColor:new Gradient({type:"linear",gradientUnits:"pixels",coords:{x1:0,y1:0,x2:0,y2:720},colorStops:palettes[kind].map(([color,offset])=>({color,offset}))})});
    }
    canvas.requestRenderAll();
  };

  const handleUpload = async (file?: File) => {
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type)) return;
    const canvas = fabricRef.current;
    if (!canvas) { setScreen("editor"); setTimeout(() => handleUpload(file), 400); return; }
    const { FabricImage } = await import("fabric");
    const url = URL.createObjectURL(file);
    const img = await FabricImage.fromURL(url);
    const scale = Math.min(620 / (img.width || 1), 620 / (img.height || 1));
    img.set({ left: 360, top: 360, originX: "center", originY: "center", scaleX: scale, scaleY: scale });
    canvas.add(img); canvas.sendObjectToBack(img); canvas.setActiveObject(img); canvas.requestRenderAll();
    setHasImage(true); setImageName(file.name.replace(/\.[^.]+$/, "")); syncSelection(img); URL.revokeObjectURL(url);
  };

  const updateSelected = (changes: Record<string, unknown>) => {
    if (!selected) return;
    selected.set(changes); selected.setCoords(); fabricRef.current?.requestRenderAll();
  };
  const removeSelected = () => {
    if (selected) { fabricRef.current?.remove(selected); fabricRef.current?.requestRenderAll(); setSelected(null); }
  };
  const exportPNG = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.discardActiveObject(); canvas.requestRenderAll();
    const link = document.createElement("a");
    link.download = `${imageName || "aero-decoration"}.png`;
    link.href = canvas.toDataURL({ format: "png", multiplier: 1.5 });
    link.click();
  };
  const clearCanvas = () => { fabricRef.current?.clear(); fabricRef.current?.set({ backgroundColor: "rgba(255,255,255,0)" }); setHasImage(false); setSelected(null); };

  if (screen === "home") return <main className="desktop home-screen">
    <div className="moving-cloud cloud-one" /><div className="moving-cloud cloud-two" />
    <div className="desktop-icons">
      <div><span>🖼️</span>My Pictures</div><div><span>🗑️</span>Recycle Bin</div>
    </div>
    <section className="home-window aero-window">
      <header className="titlebar"><div className="app-gem"><Aperture size={20}/></div><span>Aero Decoration Studio</span><WindowControls /></header>
      <div className="home-content">
        <div className="brand-orb"><div><Sparkles size={38}/><b>AERO</b></div></div>
        <p className="eyebrow">WELCOME TO YOUR CREATIVE SPACE</p>
        <h1>Aero Decoration<br/><span>Studio</span></h1>
        <p className="subtitle">Bring your photos to life with crystal frames,<br/>dreamy details and a touch of 2009 magic.</p>
        <div className="home-actions">
          <GlassButton primary onClick={() => setScreen("editor")}><WandSparkles size={18}/> Create Decoration</GlassButton>
          <GlassButton onClick={() => { setScreen("editor"); setTimeout(() => fileInput.current?.click(), 500); }}><Upload size={18}/> Upload Image</GlassButton>
        </div>
        <button className="gallery-link" onClick={() => setScreen("editor")}><FolderOpen size={17}/> Open My Gallery <span>›</span></button>
      </div>
      <footer className="window-status"><span className="online-dot"/> Ready to create <span>Aero Studio v1.0</span></footer>
    </section>
    <div className="taskbar"><button className="start-orb">⊞</button><div className="task-divider"/><button className="task-app"><Aperture size={22}/></button><div className="tray">⌃　🔊　📶　 <b>10:24<br/><small>7/26/2026</small></b></div></div>
  </main>;

  return <main className="desktop editor-screen">
    <input ref={fileInput} type="file" accept=".png,.jpg,.jpeg,.webp" hidden onChange={(e) => handleUpload(e.target.files?.[0])}/>
    <section className="editor-window aero-window">
      <header className="titlebar">
        <button className="back-btn" onClick={() => setScreen("home")}><ArrowLeft size={17}/></button>
        <div className="app-gem"><Aperture size={18}/></div><span>Aero Decoration Studio</span><WindowControls />
      </header>
      <div className="menubar"><button>File <ChevronDown size={11}/></button><button>Edit <ChevronDown size={11}/></button><button>View <ChevronDown size={11}/></button><span/><button><Settings2 size={14}/> Preferences</button></div>
      <div className="editor-topbar">
        <div className="doc-title"><Aperture size={22}/><div><b>{imageName}</b><small>1080 × 1080 px · Transparent PNG</small></div></div>
        <div className="history"><button title="Undo"><RotateCcw size={16}/></button><button title="Redo"><Redo2 size={16}/></button></div>
        <GlassButton onClick={() => fileInput.current?.click()}><ImagePlus size={16}/> Upload</GlassButton>
        <GlassButton primary onClick={exportPNG}><Download size={16}/> Export PNG</GlassButton>
      </div>
      <div className="workspace">
        <aside className="asset-panel">
          <div className="panel-tabs">
            <button className={activeTab==="frames"?"active":""} onClick={()=>setActiveTab("frames")}><Layers3/>Frames</button>
            <button className={activeTab==="decorations"?"active":""} onClick={()=>setActiveTab("decorations")}><Sparkles/>Decor</button>
            <button className={activeTab==="effects"?"active":""} onClick={()=>setActiveTab("effects")}><WandSparkles/>Effects</button>
            <button className={activeTab==="background"?"active":""} onClick={()=>setActiveTab("background")}><Cloud/>Background</button>
          </div>
          <div className="asset-body">
            <div className="panel-heading"><div><b>{activeTab === "frames" ? "Aero Frames" : activeTab === "decorations" ? "Decorations" : activeTab === "effects" ? "Photo Effects" : "Background"}</b><small>Click or drag onto the canvas</small></div><button><ChevronDown/></button></div>
            {activeTab === "frames" ? <div className="frame-list">
              <button onClick={()=>addFrame("glass")}><span className="frame-sample glass"/><b>Crystal glass</b><small>Soft blue refraction</small></button>
              <button onClick={()=>addFrame("rounded")}><span className="frame-sample rounded"/><b>Rounded clean</b><small>Adjustable corners</small></button>
              <button onClick={()=>addFrame("gradient")}><span className="frame-sample rainbow"/><b>Rainbow light</b><small>Aero gradient edge</small></button>
              <button onClick={()=>addFrame("water")}><span className="frame-sample water"/><b>Aqua drops</b><small>Glossy liquid corners</small></button>
              <button onClick={()=>addFrame("chrome")}><span className="frame-sample chrome"/><b>Vista chrome</b><small>Bright media-player rim</small></button>
              <button onClick={()=>addFrame("corners")}><span className="frame-sample corners"/><b>Crystal corners</b><small>Open clean composition</small></button>
            </div> : activeTab === "effects" ? <div className="quick-effects">
              <button onClick={()=>applyImageEffect("dream")}><i className="effect-preview dream"/>Dreamy bloom</button>
              <button onClick={()=>applyImageEffect("clean")}><i className="effect-preview crisp"/>Clean vivid</button>
              <button onClick={()=>applyImageEffect("aqua")}><i className="effect-preview aqua"/>Aqua shift</button>
              <button onClick={()=>applyImageEffect("soft")}><i className="effect-preview soft"/>Pearl soft focus</button>
              <p>Select an uploaded image to apply a nondestructive Aero color treatment.</p>
            </div> : activeTab === "background" ? <div className="backgrounds">
              <button onClick={()=>setCanvasBackground("transparent")}><i className="checker"/>Transparent</button>
              <button onClick={()=>setCanvasBackground("sky")}><i className="sky"/>Sky horizon</button>
              <button onClick={()=>setCanvasBackground("meadow")}><i className="green"/>Clean meadow</button>
              <button onClick={()=>setCanvasBackground("pearl")}><i className="pearl"/>Pearl interior</button>
              <button onClick={()=>setCanvasBackground("aqua")}><i className="aqua-bg"/>Underwater blue</button>
            </div> : <div className="sticker-grid">
              {stickers.map((s)=><button key={s.id} draggable onDragStart={(e)=>e.dataTransfer.setData("sticker",s.id)} onClick={()=>addSticker(s)}><img className="decor-image" src={`/decors/${s.file}`} alt=""/><small>{s.label}</small></button>)}
            </div>}
          </div>
        </aside>
        <section className="canvas-area" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();const s=stickers.find(x=>x.id===e.dataTransfer.getData("sticker"));if(!s)return;const r=e.currentTarget.querySelector(".canvas-shell")?.getBoundingClientRect();if(r)addSticker(s,(e.clientX-r.left)*720/r.width,(e.clientY-r.top)*720/r.height);}}>
          <div className="ruler horizontal">{[0,200,400,600,800,1000].map(n=><span key={n}>{n}</span>)}</div>
          <div className="canvas-shell" style={{width:`min(64vh, ${zoom/100*720}px)`,height:`min(64vh, ${zoom/100*720}px)`}}>
            {!hasImage && <div className="empty-canvas"><div><ImagePlus size={34}/></div><b>Drop your image here</b><span>PNG, JPG or WEBP</span><button onClick={()=>fileInput.current?.click()}>Browse files</button></div>}
            <canvas ref={canvasElement}/>
          </div>
          <div className="canvas-bottom"><button onClick={()=>setZoom(Math.max(40,zoom-10))}>−</button><input type="range" min="40" max="100" value={zoom} onChange={e=>setZoom(+e.target.value)}/><button onClick={()=>setZoom(Math.min(100,zoom+10))}>+</button><span>{zoom}%</span></div>
        </section>
        <aside className="property-panel">
          <div className="property-title"><b>Properties</b><MousePointer2 size={16}/></div>
          <div className="selected-card"><span>{selected ? "✦" : "◌"}</span><div><b>{selected ? selected.type || "Decoration" : "Nothing selected"}</b><small>{selected ? "Canvas layer" : "Choose an object"}</small></div></div>
          <div className="property-group"><label>Opacity <b>{opacity}%</b></label><input type="range" min="0" max="100" value={opacity} onChange={e=>{setOpacity(+e.target.value);updateSelected({opacity:+e.target.value/100})}}/></div>
          <div className="property-group"><label>Rotation <b>{rotation}°</b></label><input type="range" min="-180" max="180" value={rotation} onChange={e=>{setRotation(+e.target.value);updateSelected({angle:+e.target.value})}}/></div>
          <div className="property-group"><label>Border radius <b>{radius}px</b></label><input type="range" min="0" max="120" value={radius} onChange={e=>{setRadius(+e.target.value);updateSelected({rx:+e.target.value,ry:+e.target.value})}}/></div>
          <div className="property-group"><label>Border width <b>{borderWidth}px</b></label><input type="range" min="2" max="40" value={borderWidth} onChange={e=>{setBorderWidth(+e.target.value);updateSelected({strokeWidth:+e.target.value})}}/></div>
          <div className="layer-actions"><button onClick={()=>selected&&fabricRef.current?.bringObjectForward(selected)}><Plus/>Bring forward</button><button onClick={removeSelected}><Trash2/>Delete</button></div>
          <div className="layers"><div><b>Layers</b><span>{fabricRef.current?.getObjects().length ?? 0}</span></div><button onClick={clearCanvas}><Trash2/> Clear canvas</button></div>
        </aside>
      </div>
      <footer className="editor-status"><span className="online-dot"/> All changes saved locally <span>Canvas: 1080 × 1080　|　RGBA　|　<samp>{fabricRef.current?.getObjects().length ?? 0} layers</samp></span></footer>
    </section>
  </main>;
}
