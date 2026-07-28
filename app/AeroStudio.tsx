"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Aperture, ArrowDown, ArrowLeft, ChevronDown, Cloud, Copy, Download,
  FolderOpen, ImagePlus, Layers3, Maximize2, Minus, MousePointer2,
  Plus, Redo2, RotateCcw, Settings2, Sparkles, Trash2,
  WandSparkles, X,
} from "lucide-react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import { assetManifest } from "./assetManifest";

type ToolTab = "frames" | "decorations" | "effects" | "background";
type Sticker = { id: string; label: string; file: string; width: number; height: number };

const stickers: Sticker[] = assetManifest.decor.map(item => ({ ...item }));

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
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [screen, setScreen] = useState<"home" | "editor">("home");
  const [activeTab, setActiveTab] = useState<ToolTab>("decorations");
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [opacity, setOpacity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [radius, setRadius] = useState(36);
  const [shadowAmount, setShadowAmount] = useState(0);
  const [edgeFade, setEdgeFade] = useState(0);
  const [zoom, setZoom] = useState(67);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showCopyrightNotice, setShowCopyrightNotice] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(1080);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [hasImage, setHasImage] = useState(false);
  const [layerCount, setLayerCount] = useState(0);
  const canvasElement = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen !== "editor" || !canvasElement.current || fabricRef.current) return;
    let active = true;
    import("fabric").then(({ Canvas }) => {
      if (!active || !canvasElement.current) return;
      const canvas = new Canvas(canvasElement.current, {
        width: canvasWidth, height: canvasHeight, preserveObjectStacking: true, backgroundColor: "rgba(255,255,255,0)",
      });
      canvas.on("selection:created", (e) => syncSelection(e.selected?.[0] ?? null));
      canvas.on("selection:updated", (e) => syncSelection(e.selected?.[0] ?? null));
      canvas.on("selection:cleared", () => setSelected(null));
      canvas.on("object:rotating", (e) => setRotation(Math.round(e.target?.angle ?? 0)));
      const syncLayerCount = () => setLayerCount(canvas.getObjects().length);
      canvas.on("object:added", syncLayerCount);
      canvas.on("object:removed", syncLayerCount);
      fabricRef.current = canvas;
    });
    return () => { active = false; fabricRef.current?.dispose(); fabricRef.current = null; };
  }, [screen, canvasWidth, canvasHeight]);

  const syncSelection = (obj: FabricObject | null) => {
    setSelected(obj);
    if (obj) {
      setOpacity(Math.round((obj.opacity ?? 1) * 100));
      setRotation(Math.round(obj.angle ?? 0));
    }
  };

  const addSticker = useCallback(async (sticker: Sticker, x?: number, y?: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    x ??= canvas.getWidth() / 2; y ??= canvas.getHeight() / 2;
    const { FabricImage } = await import("fabric");
    const asset = await FabricImage.fromURL(sticker.file, { crossOrigin: "anonymous" });
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

  const addImageFrame = async (file: string) => {
    const canvas = fabricRef.current; if (!canvas) return;
    const { FabricImage } = await import("fabric");
    const frame = await FabricImage.fromURL(file, { crossOrigin: "anonymous" });
    const maxSize = Math.min(canvas.getWidth(), canvas.getHeight()) * .94;
    const scale = Math.min(maxSize / (frame.width || 1), maxSize / (frame.height || 1));
    frame.set({left:canvas.getWidth()/2,top:canvas.getHeight()/2,originX:"center",originY:"center",scaleX:scale,scaleY:scale});
    canvas.add(frame); canvas.setActiveObject(frame); canvas.bringObjectToFront(frame); canvas.requestRenderAll(); syncSelection(frame);
  };

  const applyLibraryBackground = async (file: string) => {
    const canvas = fabricRef.current; if (!canvas) return;
    const { FabricImage } = await import("fabric");
    const background = await FabricImage.fromURL(file, { crossOrigin: "anonymous" });
    const scale = Math.max(canvas.getWidth() / (background.width || 1), canvas.getHeight() / (background.height || 1));
    background.set({left:canvas.getWidth()/2,top:canvas.getHeight()/2,originX:"center",originY:"center",scaleX:scale,scaleY:scale,selectable:false,evented:false});
    canvas.backgroundImage = background; canvas.requestRenderAll();
  };

  const addFrame = useCallback(async (kind: "glass" | "gradient" | "rounded" | "water" | "chrome" | "corners" = "glass") => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const { Circle, Group, Path, Rect, Shadow, Gradient } = await import("fabric");
    if (kind === "corners") {
      const corners = [[-294,-294,0],[294,-294,90],[294,294,180],[-294,294,270]].map(([left,top,angle]) =>
        new Path("M 0 92 L 0 24 Q 0 0 24 0 L 92 0",{left,top,angle,fill:"",stroke:"rgba(231,252,255,.96)",strokeWidth:16,strokeLineCap:"round",shadow:new Shadow({color:"#159deaaa",blur:18})}));
      const frame = new Group(corners,{left:canvas.getWidth()/2,top:canvas.getHeight()/2,originX:"center",originY:"center"});
      canvas.add(frame); canvas.setActiveObject(frame); canvas.requestRenderAll(); syncSelection(frame); return;
    }
    const stroke = kind === "gradient"
      ? new Gradient({ type: "linear", gradientUnits: "pixels", coords: { x1: 0, y1: 0, x2: 640, y2: 640 }, colorStops: [
        { offset: 0, color: "#ffffff" }, { offset: .35, color: "#57ccff" }, { offset: .7, color: "#b373ff" }, { offset: 1, color: "#ffffff" },
      ]}) : kind === "water" ? "rgba(73,208,247,.78)" : kind === "chrome" ? "#f6fdff" : kind === "glass" ? "rgba(220,248,255,.88)" : "#56bdf2";
    const frame = new Rect({
      left: canvas.getWidth()/2, top: canvas.getHeight()/2, originX: "center", originY: "center", width: Math.min(canvas.getWidth(),canvas.getHeight())*.86, height: Math.min(canvas.getWidth(),canvas.getHeight())*.86,
      fill: "rgba(255,255,255,.03)", stroke, strokeWidth: 12, rx: kind === "rounded" ? radius : 24,
      ry: kind === "rounded" ? radius : 24, shadow: new Shadow({ color: kind === "chrome" ? "rgba(255,255,255,.9)" : "rgba(0,78,150,.36)", blur: kind === "chrome" ? 9 : 22, offsetY: 8 }),
    });
    if (kind === "water") {
      frame.set({left:0,top:0});
      const drops = [[-270,-270,10],[270,-260,15],[-280,270,14],[276,272,9]].map(([left,top,r])=>new Circle({left,top,radius:r,originX:"center",originY:"center",fill:"rgba(195,248,255,.72)",stroke:"#fff",strokeWidth:2}));
      const group = new Group([frame,...drops],{left:canvas.getWidth()/2,top:canvas.getHeight()/2,originX:"center",originY:"center"});
      canvas.add(group); canvas.setActiveObject(group); canvas.requestRenderAll(); syncSelection(group);
    } else {
      canvas.add(frame); canvas.setActiveObject(frame); canvas.requestRenderAll(); syncSelection(frame);
    }
  }, [radius]);

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
      canvas.set({backgroundColor:new Gradient({type:"linear",gradientUnits:"pixels",coords:{x1:0,y1:0,x2:0,y2:canvas.getHeight()},colorStops:palettes[kind].map(([color,offset])=>({color,offset}))})});
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
    const scale = Math.min(canvas.getWidth()*.86 / (img.width || 1), canvas.getHeight()*.86 / (img.height || 1));
    img.set({ left: canvas.getWidth()/2, top: canvas.getHeight()/2, originX: "center", originY: "center", scaleX: scale, scaleY: scale });
    canvas.add(img); canvas.sendObjectToBack(img); canvas.setActiveObject(img); canvas.requestRenderAll();
    setHasImage(true); syncSelection(img); URL.revokeObjectURL(url);
  };

  const updateSelected = (changes: Record<string, unknown>) => {
    if (!selected) return;
    selected.set(changes); selected.setCoords(); fabricRef.current?.requestRenderAll();
  };
  const applyShadow = async (value: number) => {
    setShadowAmount(value);
    if (!selected) return;
    const { Shadow } = await import("fabric");
    selected.set({shadow:value === 0 ? null : new Shadow({color:"rgba(0,55,90,.48)",blur:value,offsetX:Math.round(value*.28),offsetY:Math.round(value*.35)})});
    fabricRef.current?.requestRenderAll();
  };
  const applyEdgeFade = (value: number) => {
    setEdgeFade(value);
    if (!selected || selected.type !== "image") return;
    const image = selected as unknown as {
      getElement: () => CanvasImageSource & { width?: number; height?: number };
      setElement: (element: HTMLCanvasElement | CanvasImageSource) => void;
      __edgeSource?: CanvasImageSource & { width?: number; height?: number };
    };
    if (!image.__edgeSource) image.__edgeSource = image.getElement();
    if (value === 0) {
      image.setElement(image.__edgeSource); fabricRef.current?.requestRenderAll(); return;
    }
    const source = image.__edgeSource;
    const width = Number(source.width || 1), height = Number(source.height || 1);
    const offscreen = document.createElement("canvas"); offscreen.width = width; offscreen.height = height;
    const context = offscreen.getContext("2d", {willReadFrequently:true}); if (!context) return;
    context.drawImage(source,0,0,width,height);
    const pixels = context.getImageData(0,0,width,height);
    const fadeDistance = Math.max(1,Math.min(width,height)*(value/100)*.28);
    for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
      const distance = Math.min(x,y,width-1-x,height-1-y);
      const t = Math.max(0,Math.min(1,distance/fadeDistance));
      const smooth = t*t*(3-2*t);
      pixels.data[(y*width+x)*4+3] *= smooth;
    }
    context.putImageData(pixels,0,0); image.setElement(offscreen); fabricRef.current?.requestRenderAll();
  };
  const removeSelected = () => {
    if (selected) { fabricRef.current?.remove(selected); fabricRef.current?.requestRenderAll(); setSelected(null); }
  };
  const moveSelectedBackward = () => {
    const canvas = fabricRef.current;
    if (!canvas || !selected) return;
    canvas.sendObjectBackwards(selected);
    canvas.setActiveObject(selected);
    canvas.requestRenderAll();
  };
  const duplicateSelected = async () => {
    const canvas = fabricRef.current;
    if (!canvas || !selected) return;
    const duplicate = await selected.clone();
    duplicate.set({
      left: (selected.left ?? 0) + 24,
      top: (selected.top ?? 0) + 24,
    });
    duplicate.setCoords();
    canvas.add(duplicate);
    canvas.setActiveObject(duplicate);
    syncSelection(duplicate);
    canvas.requestRenderAll();
  };
  const exportPNG = () => {
    const canvas = fabricRef.current; if (!canvas) return;
    canvas.discardActiveObject(); canvas.requestRenderAll();
    const link = document.createElement("a");
    link.download = "aero-decoration.png";
    link.href = canvas.toDataURL({ format: "png", multiplier: 1 });
    link.click();
  };
  const clearCanvas = () => { fabricRef.current?.clear(); fabricRef.current?.set({ backgroundColor: "rgba(255,255,255,0)" }); setHasImage(false); setSelected(null); };
  const tr = (english: string, chinese: string) => lang === "zh" ? chinese : english;

  if (screen === "home") return <main className="desktop home-screen">
    <div className="moving-cloud cloud-one" /><div className="moving-cloud cloud-two" />
    <div className="desktop-icons">
      <button className="desktop-shortcut"><span className="win7-picture-icon"><i/><i/></span>{tr("Pictures", "图片")}</button>
      <button className="desktop-shortcut"><span className="win7-bin-icon"><i/><i/><i/></span>{tr("Recycle Bin", "回收站")}</button>
    </div>
    <section className="home-window aero-window">
      <header className="titlebar home-titlebar"><div className="app-gem"><Aperture size={20}/></div><span>Aero Decoration Studio</span><div className="language-switch"><button className={lang==="zh"?"active":""} onClick={()=>setLang("zh")}>中文</button><button className={lang==="en"?"active":""} onClick={()=>setLang("en")}>EN</button></div><WindowControls /></header>
      <div className="home-content">
        <div className="brand-orb"><div><Sparkles size={38}/><b>AERO</b></div></div>
        <p className="eyebrow">{tr("WELCOME TO YOUR CREATIVE SPACE", "欢迎来到你的创意空间")}</p>
        <h1>Aero Decoration<br/><span>Studio</span></h1>
        <p className="subtitle">{tr("Bring your photos to life with crystal frames,", "用水晶边框与梦幻装饰唤醒你的照片，")}<br/>{tr("dreamy details and a touch of 2009 magic.", "重现 2009 年的数字魔法。")}</p>
        <div className="home-actions">
          <GlassButton primary onClick={() => setShowNewDialog(true)}><WandSparkles size={18}/> {tr("Create Decoration", "开始创作")}</GlassButton>
        </div>
        <button className="gallery-link" onClick={() => setScreen("editor")}><FolderOpen size={17}/> {tr("Open My Gallery", "打开我的图库")} <span>›</span></button>
      </div>
      <footer className="window-status"><span className="online-dot"/> {tr("Ready to create", "准备就绪")} <span>Aero Studio v1.0</span></footer>
    </section>
    {showNewDialog && <div className="dialog-backdrop">
      <section className="new-canvas-dialog aero-window">
        <header className="titlebar"><div className="app-gem"><Aperture size={17}/></div><span>{tr("New decoration","新建装饰")}</span><button className="dialog-close" onClick={()=>setShowNewDialog(false)}><X size={13}/></button></header>
        <div className="new-dialog-body">
          <h2>{tr("Choose canvas size","选择画布大小")}</h2>
          <p>{tr("Start with a preset or enter a custom size.","选择常用尺寸，或输入自定义宽高。")}</p>
          <div className="size-presets">
            {[[1080,1080,"Square"],[1920,1080,"Landscape"],[1080,1920,"Portrait"],[1200,628,"Social"]].map(([w,h,label])=>
              <button key={`${w}-${h}`} className={canvasWidth===w&&canvasHeight===h?"active":""} onClick={()=>{setCanvasWidth(Number(w));setCanvasHeight(Number(h))}}><i style={{aspectRatio:`${w}/${h}`}}/><b>{tr(String(label),label==="Square"?"方形":label==="Landscape"?"横向":label==="Portrait"?"纵向":"社交媒体")}</b><small>{w} × {h}</small></button>)}
          </div>
          <div className="custom-size"><label>{tr("Width","宽度")}<input type="number" min="128" max="4096" value={canvasWidth} onChange={e=>setCanvasWidth(Math.max(128,Math.min(4096,+e.target.value||128)))}/></label><span>×</span><label>{tr("Height","高度")}<input type="number" min="128" max="4096" value={canvasHeight} onChange={e=>setCanvasHeight(Math.max(128,Math.min(4096,+e.target.value||128)))}/></label><em>px</em></div>
          <div className="dialog-actions"><GlassButton onClick={()=>setShowNewDialog(false)}>{tr("Cancel","取消")}</GlassButton><GlassButton primary onClick={()=>{setShowNewDialog(false);setShowCopyrightNotice(true)}}>{tr("Create canvas","创建画布")}</GlassButton></div>
        </div>
      </section>
    </div>}
    {showCopyrightNotice && <div className="dialog-backdrop copyright-backdrop">
      <section className="copyright-dialog aero-window" role="dialog" aria-modal="true" aria-labelledby="copyright-title">
        <header className="titlebar"><div className="app-gem"><Layers3 size={17}/></div><span id="copyright-title">{tr("Copyright Notice","素材版权声明")}</span></header>
        <div className="copyright-body">
          {lang === "zh" ? <>
            <h2>素材版权声明</h2>
            <p>本网站部分装饰素材来源于互联网公开平台（包括但不限于 Pinterest），部分图片可能经过二次创作、编辑或生成处理，仅用于个人学习、设计交流及非商业展示用途。</p>
            <p>所有原始素材的版权归原作者及相关版权所有者所有，本网站不声明拥有任何第三方素材的版权。</p>
            <p>本网站生成及展示的图片仅限个人使用，<strong>禁止用于任何商业活动，包括但不限于商品销售、广告宣传、商业推广、品牌使用、付费服务或其他盈利用途。</strong></p>
          </> : <>
            <h2>Copyright Notice</h2>
            <p>Some decorative materials used on this website are collected from publicly available platforms (including but not limited to Pinterest). Some images may have been edited, transformed, or generated for personal creative purposes.</p>
            <p>All original materials remain the property of their respective creators and copyright holders. This website does not claim ownership of any third-party materials.</p>
            <p>The images generated and displayed on this website are for <strong>personal use, learning, creative exploration, and non-commercial purposes only.</strong></p>
            <p><strong>Commercial use of generated images is strictly prohibited, including but not limited to product sales, advertising, marketing campaigns, brand promotion, paid services, or any other profit-making activities.</strong></p>
          </>}
          <div className="copyright-actions">
            <GlassButton primary onClick={()=>{setShowCopyrightNotice(false);setScreen("editor")}}>{tr("I Have Read","已经阅读")}</GlassButton>
          </div>
        </div>
      </section>
    </div>}
    <div className="taskbar"><button className="start-orb" aria-label={tr("Start","开始")}><i/><i/><i/><i/></button><div className="task-divider"/><button className="task-app"><Aperture size={22}/></button><div className="tray">⌃　🔊　📶　 <b>10:24<br/><small>7/26/2026</small></b></div></div>
  </main>;

  return <main className="desktop editor-screen">
    <input ref={fileInput} type="file" accept=".png,.jpg,.jpeg,.webp" hidden onChange={(e) => handleUpload(e.target.files?.[0])}/>
    <section className="editor-window aero-window">
      <header className="titlebar">
        <button className="back-btn" onClick={() => setScreen("home")}><ArrowLeft size={17}/></button>
        <div className="app-gem"><Aperture size={18}/></div><span>Aero Decoration Studio</span><div className="editor-language"><button onClick={()=>setLang(lang==="en"?"zh":"en")}>{lang==="en"?"中文":"EN"}</button></div><WindowControls />
      </header>
      <div className="menubar"><button>{tr("File","文件")} <ChevronDown size={11}/></button><button>{tr("Edit","编辑")} <ChevronDown size={11}/></button><button>{tr("View","查看")} <ChevronDown size={11}/></button><span/><button><Settings2 size={14}/> {tr("Preferences","首选项")}</button></div>
      <div className="editor-topbar">
        <div className="doc-title"><Aperture size={22}/><div><b>{tr("Untitled Decoration","未命名装饰")}</b><small>{canvasWidth} × {canvasHeight} px · {tr("Transparent PNG","透明 PNG")}</small></div></div>
        <div className="history"><button title="Undo"><RotateCcw size={16}/></button><button title="Redo"><Redo2 size={16}/></button></div>
        <GlassButton onClick={() => fileInput.current?.click()}><ImagePlus size={16}/> {tr("Upload","上传")}</GlassButton>
        <GlassButton primary onClick={exportPNG}><Download size={16}/> {tr("Export PNG","导出 PNG")}</GlassButton>
      </div>
      <div className="workspace">
        <aside className="asset-panel">
          <div className="panel-tabs">
            <button className={activeTab==="frames"?"active":""} onClick={()=>setActiveTab("frames")}><Layers3/>{tr("Frames","边框")}</button>
            <button className={activeTab==="decorations"?"active":""} onClick={()=>setActiveTab("decorations")}><Sparkles/>{tr("Decor","装饰")}</button>
            <button className={activeTab==="effects"?"active":""} onClick={()=>setActiveTab("effects")}><WandSparkles/>{tr("Effects","效果")}</button>
            <button className={activeTab==="background"?"active":""} onClick={()=>setActiveTab("background")}><Cloud/>{tr("Background","背景")}</button>
          </div>
          <div className="asset-body">
            <div className="panel-heading"><div><b>{activeTab === "frames" ? tr("Aero Frames","Aero 边框") : activeTab === "decorations" ? tr("Decorations","装饰素材") : activeTab === "effects" ? tr("Photo Effects","图片效果") : tr("Background","背景")}</b><small>{tr("Click or drag onto the canvas","点击或拖拽到画布")}</small></div><button><ChevronDown/></button></div>
            {activeTab === "frames" ? <div className="frame-list">
              <button onClick={()=>addFrame("glass")}><span className="frame-sample glass"/><b>{tr("Crystal glass","水晶玻璃")}</b><small>{tr("Soft blue refraction","柔和蓝色折射")}</small></button>
              <button onClick={()=>addFrame("rounded")}><span className="frame-sample rounded"/><b>{tr("Rounded clean","清洁圆角")}</b><small>{tr("Adjustable corners","可调节圆角")}</small></button>
              <button onClick={()=>addFrame("gradient")}><span className="frame-sample rainbow"/><b>{tr("Rainbow light","彩虹光线")}</b><small>{tr("Aero gradient edge","Aero 渐变边缘")}</small></button>
              <button onClick={()=>addFrame("water")}><span className="frame-sample water"/><b>{tr("Aqua drops","水滴边框")}</b><small>{tr("Glossy liquid corners","透明液体角饰")}</small></button>
              <button onClick={()=>addFrame("chrome")}><span className="frame-sample chrome"/><b>{tr("Vista chrome","Vista 金属")}</b><small>{tr("Bright media-player rim","播放器式高光边缘")}</small></button>
              <button onClick={()=>addFrame("corners")}><span className="frame-sample corners"/><b>{tr("Crystal corners","水晶角饰")}</b><small>{tr("Open clean composition","开放式清洁构图")}</small></button>
              {assetManifest.frame.map(frame=><button className="image-asset-card" key={frame.id} onClick={()=>addImageFrame(frame.file)}><img src={frame.file} alt=""/><b>{frame.label}</b><small>{tr("Image frame","图片边框")}</small></button>)}
            </div> : activeTab === "effects" ? <div className="quick-effects">
              <button onClick={()=>applyImageEffect("dream")}><i className="effect-preview dream"/>{tr("Dreamy bloom","梦幻泛光")}</button>
              <button onClick={()=>applyImageEffect("clean")}><i className="effect-preview crisp"/>{tr("Clean vivid","清洁鲜艳")}</button>
              <button onClick={()=>applyImageEffect("aqua")}><i className="effect-preview aqua"/>{tr("Aqua shift","水蓝色调")}</button>
              <button onClick={()=>applyImageEffect("soft")}><i className="effect-preview soft"/>{tr("Pearl soft focus","珍珠柔焦")}</button>
              <p>{tr("Select an uploaded image to apply a nondestructive Aero color treatment.","选择已上传的图片，然后应用非破坏性的 Aero 色彩效果。")}</p>
            </div> : activeTab === "background" ? <div className="backgrounds">
              <button onClick={()=>setCanvasBackground("transparent")}><i className="checker"/>{tr("Transparent","透明")}</button>
              <button onClick={()=>setCanvasBackground("sky")}><i className="sky"/>{tr("Sky horizon","天空地平线")}</button>
              <button onClick={()=>setCanvasBackground("meadow")}><i className="green"/>{tr("Clean meadow","清洁草地")}</button>
              <button onClick={()=>setCanvasBackground("pearl")}><i className="pearl"/>{tr("Pearl interior","珍珠空间")}</button>
              <button onClick={()=>setCanvasBackground("aqua")}><i className="aqua-bg"/>{tr("Underwater blue","水下蓝色")}</button>
              {assetManifest.background.map(background=><button className="background-asset-card" key={background.id} onClick={()=>applyLibraryBackground(background.file)}><img src={background.file} alt=""/>{background.label}</button>)}
            </div> : <div className="sticker-grid">
              {stickers.map((s)=><button key={s.id} draggable onDragStart={(e)=>e.dataTransfer.setData("sticker",s.id)} onClick={()=>addSticker(s)}><img className="decor-image" src={s.file} alt=""/><small>{s.label}</small></button>)}
            </div>}
          </div>
        </aside>
        <section className="canvas-area" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();const s=stickers.find(x=>x.id===e.dataTransfer.getData("sticker"));if(!s)return;const r=e.currentTarget.querySelector(".canvas-shell")?.getBoundingClientRect();if(r)addSticker(s,(e.clientX-r.left)*canvasWidth/r.width,(e.clientY-r.top)*canvasHeight/r.height);}}>
          <div className="ruler horizontal">{[0,.2,.4,.6,.8,1].map(n=><span key={n}>{Math.round(canvasWidth*n)}</span>)}</div>
          <div className="canvas-shell" style={{width:`min(62vw, ${zoom/100*Math.min(canvasWidth,900)}px)`,aspectRatio:`${canvasWidth}/${canvasHeight}`,maxHeight:"64vh"}}>
            {!hasImage && <div className="empty-canvas"><div><ImagePlus size={34}/></div><b>{tr("Drop your image here","将图片拖放到这里")}</b><span>PNG、JPG {tr("or","或")} WEBP</span><button onClick={()=>fileInput.current?.click()}>{tr("Browse files","浏览文件")}</button></div>}
            <canvas ref={canvasElement}/>
          </div>
          <div className="canvas-bottom"><button onClick={()=>setZoom(Math.max(40,zoom-10))}>−</button><input type="range" min="40" max="100" value={zoom} onChange={e=>setZoom(+e.target.value)}/><button onClick={()=>setZoom(Math.min(100,zoom+10))}>+</button><span>{zoom}%</span></div>
        </section>
        <aside className="property-panel">
          <div className="property-title"><b>{tr("Properties","属性")}</b><MousePointer2 size={16}/></div>
          <div className="selected-card"><span>{selected ? "✦" : "◌"}</span><div><b>{selected ? tr("Selected object","已选对象") : tr("Nothing selected","未选择对象")}</b><small>{selected ? tr("Canvas layer","画布图层") : tr("Choose an object","请选择一个对象")}</small></div></div>
          <div className="property-group"><label>{tr("Opacity","透明度")} <b>{opacity}%</b></label><input type="range" min="0" max="100" value={opacity} onChange={e=>{setOpacity(+e.target.value);updateSelected({opacity:+e.target.value/100})}}/></div>
          <div className="property-group"><label>{tr("Rotation","旋转")} <b>{rotation}°</b></label><input type="range" min="-180" max="180" value={rotation} onChange={e=>{setRotation(+e.target.value);updateSelected({angle:+e.target.value})}}/></div>
          <div className="property-group"><label>{tr("Border radius","圆角半径")} <b>{radius}px</b></label><input type="range" min="0" max="120" value={radius} onChange={e=>{setRadius(+e.target.value);updateSelected({rx:+e.target.value,ry:+e.target.value})}}/></div>
          <div className="property-group"><label>{tr("Overlay shadow","叠加阴影")} <b>{shadowAmount}px</b></label><input type="range" min="0" max="50" value={shadowAmount} onChange={e=>applyShadow(+e.target.value)}/></div>
          <div className="property-group"><label>{tr("Edge fade","边缘淡化")} <b>{edgeFade}%</b></label><input type="range" min="0" max="100" value={edgeFade} onChange={e=>applyEdgeFade(+e.target.value)}/><small className="property-hint">{tr("Available for image layers","适用于图片图层")}</small></div>
          <div className="layer-actions">
            <button disabled={!selected} onClick={()=>selected&&fabricRef.current?.bringObjectForward(selected)}><Plus/>{tr("Bring forward","上移一层")}</button>
            <button disabled={!selected} onClick={moveSelectedBackward}><ArrowDown/>{tr("Move backward","下移一层")}</button>
            <button disabled={!selected} onClick={duplicateSelected}><Copy/>{tr("Duplicate","复制")}</button>
            <button disabled={!selected} onClick={removeSelected}><Trash2/>{tr("Delete","删除")}</button>
          </div>
          <div className="layers"><div><b>{tr("Layers","图层")}</b><span>{layerCount}</span></div><button onClick={clearCanvas}><Trash2/> {tr("Clear canvas","清空画布")}</button></div>
        </aside>
      </div>
      <footer className="editor-status"><span className="online-dot"/> {tr("All changes saved locally","所有更改均保存在本地")} <span>{tr("Canvas","画布")}: {canvasWidth} × {canvasHeight}　|　RGBA　|　<samp>{layerCount} {tr("layers","个图层")}</samp></span></footer>
    </section>
  </main>;
}
