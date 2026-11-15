/**
 * HairTexture.tsx
 * Procedural hair-strand strokes, directional strand flow, anisotropic highlights,
 * and realistic organic hair texture overlays for Chromatique.
 */

import React, { useMemo } from "react";
import { AvatarView, RenderedHairPalette } from "./AvatarTypes";

interface HairTextureProps {
  palette: RenderedHairPalette;
  view: AvatarView;
}

interface StrandPath {
  d: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
}

export const HairTexture: React.FC<HairTextureProps> = ({ palette, view }) => {
  const { roots, midLengths, ends } = palette;

  // Generate deterministic procedural strands with natural dimensional color variations
  const strands = useMemo<StrandPath[]>(() => {
    const list: StrandPath[] = [];

    if (view === "back") {
      // BACK VIEW STRANDS: Cascading waterfall from crown to hemline
      // Left side back flow
      for (let i = 0; i < 28; i++) {
        const offset = i * 4.2;
        const xStart = 190 - offset * 0.4;
        const xCtrl1 = 155 - offset * 0.7;
        const xCtrl2 = 130 - offset * 0.5;
        const xEnd = 140 - offset * 0.3;
        const yEnd = 430 + (i % 7) * 11;
        const colorIndex = i % 5;
        const strokeColor =
          i % 3 === 0
            ? midLengths.strands[colorIndex]
            : i % 3 === 1
            ? roots.strands[colorIndex]
            : ends.strands[colorIndex];

        list.push({
          d: `M${xStart} ${35 + i * 1.5} C${xCtrl1} 140, ${xCtrl2} 290, ${xEnd} ${yEnd}`,
          stroke: strokeColor,
          strokeWidth: 0.6 + (i % 4) * 0.3,
          opacity: 0.35 + (i % 5) * 0.08,
        });
      }

      // Right side back flow
      for (let i = 0; i < 28; i++) {
        const offset = i * 4.2;
        const xStart = 230 + offset * 0.4;
        const xCtrl1 = 265 + offset * 0.7;
        const xCtrl2 = 290 + offset * 0.5;
        const xEnd = 280 + offset * 0.3;
        const yEnd = 430 + (i % 7) * 11;
        const colorIndex = (i + 2) % 5;
        const strokeColor =
          i % 3 === 0
            ? midLengths.strands[colorIndex]
            : i % 3 === 1
            ? roots.strands[colorIndex]
            : ends.strands[colorIndex];

        list.push({
          d: `M${xStart} ${35 + i * 1.5} C${xCtrl1} 140, ${xCtrl2} 290, ${xEnd} ${yEnd}`,
          stroke: strokeColor,
          strokeWidth: 0.6 + (i % 4) * 0.3,
          opacity: 0.35 + (i % 5) * 0.08,
        });
      }

      // Center back spinal cascade
      for (let i = 0; i < 22; i++) {
        const xBase = 200 + (i - 11) * 3.2;
        const wave = (i % 2 === 0 ? 1 : -1) * 9;
        const colorIndex = (i + 1) % 5;

        list.push({
          d: `M${xBase} 50 C${xBase + wave} 180, ${xBase - wave} 340, ${xBase + wave * 0.5} ${490 + (i % 5) * 6}`,
          stroke: i > 14 ? ends.strands[colorIndex] : midLengths.strands[colorIndex],
          strokeWidth: 0.7 + (i % 3) * 0.35,
          opacity: 0.4 + (i % 4) * 0.08,
        });
      }

      // Crown whorl micro-strands
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        list.push({
          d: `M${210 + cos * 4} ${65 + sin * 4} Q${210 + cos * 22} ${65 + sin * 18} ${210 + cos * 40} ${65 + sin * 32}`,
          stroke: roots.strands[i % 5],
          strokeWidth: 0.8,
          opacity: 0.5,
        });
      }

      return list;
    }

    // FRONT VIEW STRANDS
    // 1. Crown & Hairline Parting Micro-Strands
    for (let i = 0; i < 18; i++) {
      const y = 30 + i * 4.8;
      // Left parting radiate
      list.push({
        d: `M209 ${y} C195 ${y - 4}, 180 ${y + 2}, 162 ${y + 14}`,
        stroke: roots.strands[i % 5],
        strokeWidth: 0.7 + (i % 3) * 0.25,
        opacity: 0.55 + (i % 4) * 0.08,
      });
      // Right parting radiate
      list.push({
        d: `M211 ${y} C225 ${y - 4}, 240 ${y + 2}, 258 ${y + 14}`,
        stroke: roots.strands[(i + 2) % 5],
        strokeWidth: 0.7 + (i % 3) * 0.25,
        opacity: 0.55 + (i % 4) * 0.08,
      });
    }

    // 2. Left Flowing Wave Bundle (Crown -> Mid -> Ends)
    for (let i = 0; i < 30; i++) {
      const offset = i * 2.8;
      const xStart = 185 - offset * 1.5;
      const xMid = 98 - offset * 0.8;
      const xWave = 120 - offset * 0.5;
      const xEnd = 95 - offset * 0.4;
      const yEnd = 430 + (i % 6) * 12;
      const colorIndex = (i + 1) % 5;
      const strokeColor =
        i % 3 === 0
          ? midLengths.strands[colorIndex]
          : i % 3 === 1
          ? roots.strands[colorIndex]
          : ends.strands[colorIndex];

      list.push({
        d: `M${xStart} ${45 + offset * 0.8} C${xMid} 165, ${xWave} 290, ${xEnd} ${yEnd}`,
        stroke: strokeColor,
        strokeWidth: 0.65 + (i % 4) * 0.28,
        opacity: 0.4 + (i % 5) * 0.08,
      });
    }

    // 3. Right Flowing Wave Bundle (Crown -> Mid -> Ends)
    for (let i = 0; i < 30; i++) {
      const offset = i * 2.8;
      const xStart = 235 + offset * 1.5;
      const xMid = 322 + offset * 0.8;
      const xWave = 300 + offset * 0.5;
      const xEnd = 325 + offset * 0.4;
      const yEnd = 430 + (i % 6) * 12;
      const colorIndex = (i + 3) % 5;
      const strokeColor =
        i % 3 === 0
          ? midLengths.strands[colorIndex]
          : i % 3 === 1
          ? roots.strands[colorIndex]
          : ends.strands[colorIndex];

      list.push({
        d: `M${xStart} ${45 + offset * 0.8} C${xMid} 165, ${xWave} 290, ${xEnd} ${yEnd}`,
        stroke: strokeColor,
        strokeWidth: 0.65 + (i % 4) * 0.28,
        opacity: 0.4 + (i % 5) * 0.08,
      });
    }

    // 4. Front Face-Framing Curtain Bang Strands
    for (let i = 0; i < 16; i++) {
      const y = 38 + i * 3.5;
      // Left framing strand
      list.push({
        d: `M206 ${y} C184 ${y + 25}, 152 125, 162 ${168 + i * 2.5}`,
        stroke: i > 8 ? midLengths.strands[i % 5] : roots.strands[i % 5],
        strokeWidth: 0.75 + (i % 3) * 0.25,
        opacity: 0.6,
      });
      // Right framing strand
      list.push({
        d: `M214 ${y} C236 ${y + 25}, 268 125, 258 ${168 + i * 2.5}`,
        stroke: i > 8 ? midLengths.strands[(i + 1) % 5] : roots.strands[(i + 1) % 5],
        strokeWidth: 0.75 + (i % 3) * 0.25,
        opacity: 0.6,
      });
    }

    // 5. Front Chest Ribbon Strands (Falling across shoulders)
    for (let i = 0; i < 14; i++) {
      const offset = (i - 7) * 2.2;
      // Left ribbon
      list.push({
        d: `M${154 + offset} 205 C${132 + offset} 280, ${150 + offset} 360, ${142 + offset * 0.6} 475`,
        stroke: i > 6 ? ends.strands[i % 5] : midLengths.strands[i % 5],
        strokeWidth: 0.8 + (i % 3) * 0.3,
        opacity: 0.55 + (i % 4) * 0.08,
      });
      // Right ribbon
      list.push({
        d: `M${266 + offset} 205 C${288 + offset} 280, ${270 + offset} 360, ${278 + offset * 0.6} 475`,
        stroke: i > 6 ? ends.strands[(i + 2) % 5] : midLengths.strands[(i + 2) % 5],
        strokeWidth: 0.8 + (i % 3) * 0.3,
        opacity: 0.55 + (i % 4) * 0.08,
      });
    }

    // 6. Perimeter Organic Flyaway Wisps
    // Left silhouette flyaways
    list.push({ d: "M88 120 C68 165, 58 230, 74 310", stroke: midLengths.highlight, strokeWidth: 0.6, opacity: 0.45 });
    list.push({ d: "M76 210 C54 265, 52 320, 78 385", stroke: midLengths.highlight, strokeWidth: 0.6, opacity: 0.4 });
    list.push({ d: "M74 370 C60 415, 62 460, 84 495", stroke: ends.highlight, strokeWidth: 0.6, opacity: 0.45 });

    // Right silhouette flyaways
    list.push({ d: "M332 120 C352 165, 362 230, 346 310", stroke: midLengths.highlight, strokeWidth: 0.6, opacity: 0.45 });
    list.push({ d: "M344 210 C366 265, 368 320, 342 385", stroke: midLengths.highlight, strokeWidth: 0.6, opacity: 0.4 });
    list.push({ d: "M346 370 C360 415, 358 460, 336 495", stroke: ends.highlight, strokeWidth: 0.6, opacity: 0.45 });

    return list;
  }, [roots, midLengths, ends, view]);

  return (
    <g id="proceduralHairTexture" pointerEvents="none">
      {/* 1. Hundreds of Individual Procedural Hair Strands */}
      {strands.map((s, idx) => (
        <path
          key={idx}
          d={s.d}
          stroke={s.stroke}
          strokeWidth={s.strokeWidth}
          opacity={s.opacity}
          fill="none"
          strokeLinecap="round"
        />
      ))}

      {/* 2. Anisotropic Specular Highlight Glint Ribbons */}
      {view === "front" ? (
        <>
          {/* Wave Crest Highlight Bands (Light bounce across hair curves) */}
          <path
            d="M85 180 Q106 205 125 180"
            stroke="url(#avatarSheenGrad)"
            strokeWidth="3.2"
            fill="none"
            opacity="0.75"
          />
          <path
            d="M295 180 Q314 205 335 180"
            stroke="url(#avatarSheenGrad)"
            strokeWidth="3.2"
            fill="none"
            opacity="0.75"
          />
          <path
            d="M80 300 Q105 328 128 300"
            stroke="url(#avatarSheenGrad)"
            strokeWidth="3.4"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M292 300 Q315 328 340 300"
            stroke="url(#avatarSheenGrad)"
            strokeWidth="3.4"
            fill="none"
            opacity="0.7"
          />
        </>
      ) : (
        <>
          {/* Back Wave Crest Highlight Arcs */}
          <path
            d="M125 240 Q210 215 295 240"
            stroke="url(#avatarSheenGrad)"
            strokeWidth="3.8"
            fill="none"
            opacity="0.7"
          />
          <path
            d="M115 330 Q210 305 305 330"
            stroke="url(#avatarSheenGrad)"
            strokeWidth="4.0"
            fill="none"
            opacity="0.65"
          />
        </>
      )}
    </g>
  );
};
