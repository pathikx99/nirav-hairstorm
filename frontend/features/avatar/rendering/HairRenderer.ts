/**
 * HairRenderer.ts
 * GPU-Accelerated WebGL 2.0 Hair Rendering Engine with Canvas 2D Fallback.
 * 
 * Supports:
 * - Real-time shader recolouring (< 16ms per frame / 60 FPS).
 * - Independent regional pigmentation (Roots, Mid-lengths, Ends).
 * - Anisotropic specular sheen.
 * - Environmental metamerism.
 * - Independent dermal skin tone transformation.
 * - Eyebrow melanin coupling.
 * - Canities (grey hair) simulation.
 * - Interactive split before/after view.
 */

import { HAIR_FRAGMENT_SHADER, HAIR_VERTEX_SHADER } from "./HairShader";
import { LoadedAvatarTextures } from "../services/avatarAssetService";
import { ResolvedAvatarShading } from "../services/avatarColourAdapter";
import { AvatarLightingEnvironment, AvatarView, HairstyleId } from "../types/avatar.types";
import { getHairstyleMetadata } from "../data/avatarRegistry";
import { getLightingShaderUniforms } from "../data/lightingProfiles";
import { calculateContinuousSkinColor, calculateSkinDermalShift } from "../data/skinTonePalette";
import { SkinTone } from "../../../constants/skinTones";

export interface RenderParameters {
  textures: LoadedAvatarTextures;
  shading: ResolvedAvatarShading;
  skinTone: SkinTone;
  skinCustom: { melaninDepth: number; warmth: number };
  lighting: AvatarLightingEnvironment;
  hairstyle: HairstyleId;
  viewAngle: AvatarView;
  splitX: number;
  splitActive: boolean;
  showOriginal: boolean;
}

export class HairRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private texturesMap: Map<string, WebGLTexture> = new Map();
  private isWebGLSupported = false;
  private isDestroyed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.initWebGL2();
  }

  public get isWebGL(): boolean {
    return this.isWebGLSupported && this.gl !== null && this.program !== null;
  }

  private initWebGL2(): void {
    try {
      const gl = this.canvas.getContext("webgl2", {
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      });

      if (!gl) {
        console.warn("WebGL 2.0 not available on this client — using Canvas 2D fallback.");
        this.isWebGLSupported = false;
        return;
      }

      this.gl = gl;
      this.program = this.createProgram(gl, HAIR_VERTEX_SHADER, HAIR_FRAGMENT_SHADER);
      if (!this.program) {
        this.isWebGLSupported = false;
        return;
      }

      // Setup screen-filling quad geometry
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);

      const positionBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      // Quad positions: clip-space coordinates
      const positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      const aPosLoc = gl.getAttribLocation(this.program, "a_position");
      gl.enableVertexAttribArray(aPosLoc);
      gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

      const texcoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      // Texcoords: UV [0..1], with Y flipped for canvas rendering
      const texcoords = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

      const aTexLoc = gl.getAttribLocation(this.program, "a_texcoord");
      gl.enableVertexAttribArray(aTexLoc);
      gl.vertexAttribPointer(aTexLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindVertexArray(null);
      this.isWebGLSupported = true;
    } catch (err) {
      console.warn("Failed to initialize WebGL 2.0:", err);
      this.isWebGLSupported = false;
    }
  }

  private createProgram(
    gl: WebGL2RenderingContext,
    vsSource: string,
    fsSource: string
  ): WebGLProgram | null {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    if (!vs) return null;
    gl.shaderSource(vs, vsSource);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error("Vertex shader compile error:", gl.getShaderInfoLog(vs));
      gl.deleteShader(vs);
      return null;
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fs) return null;
    gl.shaderSource(fs, fsSource);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error("Fragment shader compile error:", gl.getShaderInfoLog(fs));
      gl.deleteShader(fs);
      return null;
    }

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  private uploadTexture(name: string, image: HTMLImageElement, unitIndex: number): void {
    if (!this.gl) return;
    const gl = this.gl;

    let texture = this.texturesMap.get(name);
    if (!texture) {
      const created = gl.createTexture();
      if (!created) return;
      texture = created;
      this.texturesMap.set(name, texture);
    }

    gl.activeTexture(gl.TEXTURE0 + unitIndex);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set wrapping and filtering parameters for photographic realism
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  private bindUniformSampler(uniformName: string, unitIndex: number): void {
    if (!this.gl || !this.program) return;
    const loc = this.gl.getUniformLocation(this.program, uniformName);
    if (loc !== null) {
      this.gl.uniform1i(loc, unitIndex);
    }
  }

  public render(params: RenderParameters): void {
    if (this.isDestroyed) return;

    if (!this.isWebGL) {
      this.renderCanvas2DFallback(params);
      return;
    }

    const gl = this.gl!;
    const program = this.program!;

    // Set canvas viewport size to match buffer
    const w = params.textures.baseModel.naturalWidth || 896;
    const h = params.textures.baseModel.naturalHeight || 1200;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    gl.viewport(0, 0, w, h);
    gl.useProgram(program);
    gl.bindVertexArray(this.vao);

    // 1. Upload & Bind Textures
    this.uploadTexture("base", params.textures.baseModel, 0);
    this.bindUniformSampler("u_base_texture", 0);

    this.uploadTexture("cleanBg", params.textures.cleanBg, 1);
    this.bindUniformSampler("u_clean_bg_texture", 1);

    this.uploadTexture("alpha", params.textures.hairAlpha, 2);
    this.bindUniformSampler("u_alpha_texture", 2);

    this.uploadTexture("zones", params.textures.hairZones, 3);
    this.bindUniformSampler("u_zones_texture", 3);

    this.uploadTexture("flow", params.textures.hairFlow, 4);
    this.bindUniformSampler("u_flow_texture", 4);

    this.uploadTexture("grey", params.textures.hairGrey, 5);
    this.bindUniformSampler("u_grey_texture", 5);

    const isFront = params.viewAngle === "front";
    if (isFront && params.textures.skinMask && params.textures.featuresProtect && params.textures.eyebrows) {
      this.uploadTexture("skin", params.textures.skinMask, 6);
      this.bindUniformSampler("u_skin_texture", 6);

      this.uploadTexture("protect", params.textures.featuresProtect, 7);
      this.bindUniformSampler("u_protect_texture", 7);

      this.uploadTexture("eyebrows", params.textures.eyebrows, 8);
      this.bindUniformSampler("u_eyebrows_texture", 8);

      if (params.textures.scalp) {
        this.uploadTexture("scalp", params.textures.scalp, 9);
        this.bindUniformSampler("u_scalp_texture", 9);
      }
      gl.uniform1f(gl.getUniformLocation(program, "u_skin_active"), 1.0);
    } else {
      gl.uniform1f(gl.getUniformLocation(program, "u_skin_active"), 0.0);
    }

    // 2. Regional Hair Pigments
    const { roots, midLengths, ends, eyebrows } = params.shading;

    gl.uniform3fv(gl.getUniformLocation(program, "u_roots_base"), roots.baseRgb);
    gl.uniform3fv(gl.getUniformLocation(program, "u_roots_shadow"), roots.shadowRgb);
    gl.uniform3fv(gl.getUniformLocation(program, "u_roots_highlight"), roots.highlightRgb);

    gl.uniform3fv(gl.getUniformLocation(program, "u_mid_base"), midLengths.baseRgb);
    gl.uniform3fv(gl.getUniformLocation(program, "u_mid_shadow"), midLengths.shadowRgb);
    gl.uniform3fv(gl.getUniformLocation(program, "u_mid_highlight"), midLengths.highlightRgb);

    gl.uniform3fv(gl.getUniformLocation(program, "u_ends_base"), ends.baseRgb);
    gl.uniform3fv(gl.getUniformLocation(program, "u_ends_shadow"), ends.shadowRgb);
    gl.uniform3fv(gl.getUniformLocation(program, "u_ends_highlight"), ends.highlightRgb);

    gl.uniform3fv(gl.getUniformLocation(program, "u_eyebrow_color"), eyebrows.colorRgb);

    // 3. Facial Skin Dermal Scale & Offset
    const targetSkinRgb = calculateContinuousSkinColor(params.skinTone, params.skinCustom);
    const skinShift = calculateSkinDermalShift(targetSkinRgb);
    gl.uniform3fv(gl.getUniformLocation(program, "u_skin_scale"), skinShift.scale);
    gl.uniform3fv(gl.getUniformLocation(program, "u_skin_offset"), skinShift.offset);

    // 4. Optical Lighting & Specular Parameters
    const archMeta = getHairstyleMetadata(params.hairstyle);
    const lightingUniforms = getLightingShaderUniforms(params.lighting);

    gl.uniform3fv(gl.getUniformLocation(program, "u_light_multiplier"), lightingUniforms.colorMultiplier);
    gl.uniform3fv(gl.getUniformLocation(program, "u_light_ambient"), lightingUniforms.ambientLight);
    gl.uniform2fv(gl.getUniformLocation(program, "u_light_direction"), lightingUniforms.lightDirection);
    gl.uniform1f(
      gl.getUniformLocation(program, "u_specular_intensity"),
      lightingUniforms.specularMultiplier
    );
    gl.uniform1f(
      gl.getUniformLocation(program, "u_specular_exponent"),
      archMeta.specularExponent
    );

    // 5. Canities / Grey Percentages
    gl.uniform3f(
      gl.getUniformLocation(program, "u_grey_percentages"),
      roots.greyPercentage,
      midLengths.greyPercentage,
      ends.greyPercentage
    );

    // 6. Before / After Split Parameters
    gl.uniform1f(gl.getUniformLocation(program, "u_split_x"), params.splitX);
    gl.uniform1f(gl.getUniformLocation(program, "u_split_active"), params.splitActive ? 1.0 : 0.0);
    gl.uniform1f(gl.getUniformLocation(program, "u_show_original"), params.showOriginal ? 1.0 : 0.0);

    // 7. Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /**
   * High-fidelity Canvas 2D fallback when WebGL 2 is unavailable or restricted.
   */
  private renderCanvas2DFallback(params: RenderParameters): void {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    const w = params.textures.baseModel.naturalWidth || 896;
    const h = params.textures.baseModel.naturalHeight || 1200;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    if (params.showOriginal) {
      ctx.drawImage(params.textures.baseModel, 0, 0, w, h);
      return;
    }

    // 1. Draw base photo
    ctx.drawImage(params.textures.baseModel, 0, 0, w, h);

    // 2. Offscreen hair composition
    const offCanvas = document.createElement("canvas");
    offCanvas.width = w;
    offCanvas.height = h;
    const offCtx = offCanvas.getContext("2d");
    if (!offCtx) return;

    // Create vertical gradient reflecting roots, mid, ends
    const grad = offCtx.createLinearGradient(0, h * 0.15, 0, h * 0.90);
    const rootsHex = params.shading.roots.colorimetry.baseHex;
    const midHex = params.shading.midLengths.colorimetry.baseHex;
    const endsHex = params.shading.ends.colorimetry.baseHex;

    grad.addColorStop(0.0, rootsHex);
    grad.addColorStop(0.45, midHex);
    grad.addColorStop(1.0, endsHex);

    offCtx.fillStyle = grad;
    offCtx.fillRect(0, 0, w, h);

    // Multiply blend with base photo to preserve highlights and shadows
    offCtx.globalCompositeOperation = "multiply";
    offCtx.drawImage(params.textures.baseModel, 0, 0, w, h);

    // Mask with hair alpha
    offCtx.globalCompositeOperation = "destination-in";
    offCtx.drawImage(params.textures.hairAlpha, 0, 0, w, h);

    // Composite recoloured hair over base image
    ctx.drawImage(offCanvas, 0, 0, w, h);

    // Draw split line if active
    if (params.splitActive) {
      const splitPx = params.splitX * w;
      // Redraw original on left half
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitPx, h);
      ctx.clip();
      ctx.drawImage(params.textures.baseModel, 0, 0, w, h);
      ctx.restore();

      // Divider line
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(splitPx, 0);
      ctx.lineTo(splitPx, h);
      ctx.stroke();
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.gl) {
      for (const tex of this.texturesMap.values()) {
        this.gl.deleteTexture(tex);
      }
      this.texturesMap.clear();

      if (this.program) {
        this.gl.deleteProgram(this.program);
        this.program = null;
      }
      if (this.vao) {
        this.gl.deleteVertexArray(this.vao);
        this.vao = null;
      }
      this.gl = null;
    }
  }
}
