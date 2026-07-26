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
type Sticker = { id: string; label: string; glyph: string; color: string };

const stickers: Sticker[] = [
  { id: "droplet", label: "Water drop", glyph: "💧", color: "#48c7ff" },
  { id: "shine", label: "Crystal shine", glyph: "✦", color: "#fff" },
  { id: "rainbow", label: "Rainbow light", glyph: "🌈", color: "#ff85dc" },
  { id: "bubble", label: "Bubble", glyph: "◯", color: "#b9f2ff" },
  { id: "sparkle", label: "Sparkle", glyph: "✨", color: "#ffe681" },
  { id: "cloud", label: "Cloud", glyph: "☁", color: "#fff" },
  { id: "grass", label: "Grass", glyph: "🌱", color: "#52bd52" },
  { id: "leaf", label: "Leaf", glyph: "🍃", color: "#61d56c" },
  { id: "flower", label: "Flower", glyph: "🌼", color: "#ffd84a" },
  { id: "folder", label: "Folder icon", glyph: "📁", color: "#ffd25b" },
  { id: "start", label: "Start orb", glyph: "⊕", color: "#44c96b" },
  { id: "button", label: "Window button", glyph: "▣", color: "#7edbff" },
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
    const { FabricText, Shadow } = await import("fabric");
    const item = new FabricText(sticker.glyph, {
      left: x, top: y, originX: "center", originY: "center", fontSize: 112,
      fill: sticker.color, fontFamily: '"Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
      shadow: new Shadow({ color: "rgba(0,90,160,.35)", blur: 14, offsetY: 5 }),
    });
    canvas.add(item); canvas.setActiveObject(item); canvas.requestRenderAll(); syncSelection(item);
  }, []);

  const addFrame = useCallback(async (kind: "glass" | "gradient" | "rounded" = "glass") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const { Rect, Shadow, Gradient } = await import("fabric");
    const stroke = kind === "gradient"
      ? new Gradient({ type: "linear", gradientUnits: "pixels", coords: { x1: 0, y1: 0, x2: 640, y2: 640 }, colorStops: [
        { offset: 0, color: "#ffffff" }, { offset: .35, color: "#57ccff" }, { offset: .7, color: "#b373ff" }, { offset: 1, color: "#ffffff" },
      ]}) : kind === "glass" ? "rgba(220,248,255,.88)" : "#56bdf2";
    const frame = new Rect({
      left: 360, top: 360, originX: "center", originY: "center", width: 620, height: 620,
      fill: "rgba(255,255,255,.03)", stroke, strokeWidth: borderWidth, rx: kind === "rounded" ? radius : 24,
      ry: kind === "rounded" ? radius : 24, shadow: new Shadow({ color: "rgba(0,78,150,.36)", blur: 22, offsetY: 8 }),
    });
    canvas.add(frame); canvas.setActiveObject(frame); canvas.requestRenderAll(); syncSelection(frame);
  }, [borderWidth, radius]);

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
            </div> : activeTab === "effects" ? <div className="quick-effects">
              <button onClick={()=>updateSelected({opacity:.82})}>Dreamy fade</button><button onClick={()=>updateSelected({shadow:"0 8px 24px rgba(0,90,180,.4)"})}>Aero glow</button>
              <p>Select an object, then apply a soft browser-canvas effect.</p>
            </div> : activeTab === "background" ? <div className="backgrounds">
              <button onClick={()=>fabricRef.current?.set({backgroundColor:"rgba(255,255,255,0)"})}><i className="checker"/>Transparent</button>
              <button onClick={()=>{fabricRef.current?.set({backgroundColor:"#dff8ff"});fabricRef.current?.requestRenderAll();}}><i className="sky"/>Sky blue</button>
              <button onClick={()=>{fabricRef.current?.set({backgroundColor:"#efffe8"});fabricRef.current?.requestRenderAll();}}><i className="green"/>Clean green</button>
            </div> : <div className="sticker-grid">
              {stickers.map((s)=><button key={s.id} draggable onDragStart={(e)=>e.dataTransfer.setData("sticker",s.id)} onClick={()=>addSticker(s)}><span>{s.glyph}</span><small>{s.label}</small></button>)}
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
