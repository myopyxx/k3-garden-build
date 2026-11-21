// Pencil contours in the menu rig's 200 × 240 coordinates. The same plates
// can be painted into SVG or Canvas without loading textures between levels.
const sketchInk = "#403946", pencilLight = "#c0b2ac";
const catLines = {
  runningBody: [
    ["M-28 2 Q-28 -10 -16 -15 Q-4 -20 9 -15 Q23 -13 29 -3 Q30 6 20 11 L21 14 Q7 18 -8 15 Q-25 14 -28 2Z","fur","ink",1.35],
    ["M-25 4 Q-15 13 -5 10 L-7 13 Q2 13 12 11 Q9 16 -3 16 Q-20 16 -25 4Z","shade"],
    ["M-22 -8 l5 -4 m-2 4 4 -3 M13 10 l4 -2","none","ink",.75]
  ],
  body: [
    ["M78 123 Q65 137 66 151 C52 162 46 182 46 200 Q43 219 56 225 Q69 231 89 225 Q113 230 145 225 Q160 215 154 194 Q149 171 136 152 L127 124 Z","fur","ink",1.8],
    ["M55 174 Q48 201 62 208 Q70 207 73 188 L79 205 L85 225 Q57 232 49 218 Q43 204 55 174Z","shade"],
    ["M74 136 Q96 143 130 132 Q128 142 119 148 L123 146 Q115 154 104 158 L106 155 L97 159 Q87 155 81 148 L83 152 Q78 148 74 136Z","shade"],
    ["M54 215 Q46 192 61 179 M79 167 Q83 188 83 215 M121 166 Q117 190 119 213 M145 174 Q158 194 152 211 M88 188 l1 8 m3 -6 l1 6 M126 156 l-4 7 m8 -9 l-4 6","none","ink",.95],
    ["M64 157 q3 -13 8 -18 M51 188 q1 -7 5 -12 M83 177 l2 9 M119 181 l-1 9","none","light",1.2]
  ],
  face: [
    ["M57 89 Q61 69 79 65 Q91 60 101 63 L107 61 L105 64 Q128 63 140 83 Q146 92 145 102 L148 108 L144 108 L146 114 Q141 129 126 136 Q115 145 100 144 Q85 145 72 135 Q57 131 53 115 L56 115 L51 109 L55 109 Q52 101 57 89Z","fur","ink",1.75],
    ["M58 84 Q67 68 83 67 Q78 70 74 77 Q70 80 64 93 L58 100Z","light"],
    ["M142 90 Q148 105 142 117 L145 115 Q139 133 122 137 Q109 146 94 142 Q83 141 77 135 Q101 141 119 129 Q129 122 132 112 L139 108Z","shade"],
    ["M60 113 l6 3 m-7 -1 l5 4 M137 112 l-6 4 m6 -2 l-4 4 M77 81 q4 -4 9 -4 M115 77 q6 0 10 4 M92 68 l4 -2 m0 2 3 -2","none","ink",1],
    ["M65 89 l7 -4 -2 3 -6 3Z M127 87 l7 4 -1 2 -6 -3Z","shade"],
    ["M69 117 l4 2 m-6 .2 3 2 m56 -1 4 -3 m-1 5 3 -3 M87 137 l3 1 m2 1 4 1","none","shade",.85],
    ["M56 104 q-1 -12 7 -22 M72 134 l8 5 M126 134 q10 -5 14 -13","none","ink",.62]
  ],
  earL: [
    ["M63 94 Q52 76 50 52 Q49 49 53 51 Q73 57 85 75Z","fur","ink",1.8],
    ["M61 82 Q57 69 55 57 Q69 62 77 73Z","#a89598"],
    ["M60 65 l3 10 m1 -9 l3 8 m2 -6 2 5","none","ink",.85]
  ],
  lapEarL: [
    ["M64 91 Q57 79 46 58 Q45 55 49 57 Q65 61 82 75Z","fur","ink",1.75],
    ["M61 79 Q55 69 51 62 Q65 66 75 74Z","#a89598"],
    ["M57 66 l6 9 m0 -6 4 6","none","ink",.85]
  ],
  earR: [
    ["M115 76 Q131 58 145 50 Q148 48 148 54 Q149 73 138 94Z","fur","ink",1.8],
    ["M125 74 Q134 62 143 57 Q144 70 137 81Z","#a89598"],
    ["M141 65 l-4 10 m0 -9 -3 8","none","ink",.85]
  ],
  pawL: [
    ["M81 210 Q90 207 96 215 Q102 222 96 227 Q86 231 77 227 Q72 224 76 217Z","fur","ink",1.35],
    ["M81 225 q-2 -4 1 -7 M88 227 q-2 -4 0 -7","none","shade",1.1]
  ],
  pawR: [
    ["M105 211 Q113 207 120 214 Q127 223 122 227 Q112 231 102 227 Q99 222 102 216Z","fur","ink",1.35],
    ["M107 227 q-2 -5 0 -8 M114 227 q-1 -5 1 -8","none","shade",1.1]
  ],
  tail: [
    ["M143 191 C166 193 180 179 176 160 C174 150 164 146 164 139 Q166 133 171 137 C183 145 190 158 188 174 Q187 201 156 208 Q139 210 138 202Z","fur","ink",1.6],
    ["M145 204 Q178 202 184 180 Q183 202 154 207Z","shade"],
    ["M170 143 q7 6 9 13 M179 185 l-4 6","none","light",1.15]
  ],
  muzzle: [
    ["M81 121 Q82 114 95 115 L100 118 Q115 111 120 121 Q120 127 108 129 Q103 129 100 125 Q91 133 82 126Z","#ad9fa2"],
    ["M94 117 Q98 115 106 117 Q105 121 101 123 L99 123 Q95 121 94 117Z","ink"],
    ["M100 122 v3 Q96 131 87 127 M100 125 Q104 130 114 127","none","ink",1.4],
    ["M87 121 h.4 m3 2 h.6 m20 -2 h.4 m3 2 h.6","none","ink",1.3]
  ],
  teeth: [["M90 128 Q93 129 96 128 Q95 131 92.8 133.5 Z M104.5 128 Q108 129 111 128 L108.5 133.5 Q106 132 104.5 128Z","#fff1dc","ink",.7]],
  whiskers: [["M85 124 Q66 118 48 119 M85 126 Q60 124 42 133 M85 128 Q68 131 51 140 M115 124 Q134 118 153 120 M115 126 Q140 125 159 133 M115 128 Q135 133 149 140","none","#dacbc2",.8]]
};
const catHeadWidth = lap => lap ? .94 : 1.12;
function sketchColor(p, c){
  return p === "ink" ? sketchInk : p === "light" ? pencilLight : (c[p] || p);
}
function sketchSVG(part,c){
  return catLines[part].map(([d,fill,stroke="none",w=1]) =>
    `<path d="${d}" fill="${sketchColor(fill,c)}" stroke="${sketchColor(stroke,c)}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
}
const sketchPaths = new Map();
function paintCatPart(g,part,c){
  g.lineJoin = g.lineCap = "round";
  for (const [d,fill,stroke,w] of catLines[part]){
    if (!sketchPaths.has(d)) sketchPaths.set(d,new Path2D(d));
    const path = sketchPaths.get(d);
    if (fill !== "none"){ g.fillStyle=sketchColor(fill,c); g.fill(path); }
    if (stroke){ g.strokeStyle=sketchColor(stroke,c); g.lineWidth=w; g.stroke(path); }
  }
}
// Origin at eye level. Callers supply the scale and facing for their pose.
function paintSketchHead(g,c,lap,look=0,blink=1,wide=1,lookY=0){
  g.save(); g.scale(catHeadWidth(lap),lap ? .89 : 1); g.translate(-100,-102);
  paintCatPart(g,lap ? "lapEarL" : "earL",c); paintCatPart(g,"earR",c); paintCatPart(g,"face",c);
  for (const x of [80,120]){
    g.save(); g.translate(x,102); g.scale(1,blink);
    g.fillStyle=c.eyes; g.strokeStyle=sketchInk; g.lineWidth=1.5; g.beginPath(); g.ellipse(0,0,9.6,lap?7:8,0,0,Math.PI*2); g.fill(); g.stroke();
    g.fillStyle=sketchInk; g.beginPath(); g.ellipse(look,lookY,2.8*wide,5.8,0,0,Math.PI*2); g.fill();
    g.fillStyle="#f9ecd6"; g.beginPath(); g.arc(look-2,-3+lookY,1.3,0,Math.PI*2); g.fill(); g.restore();
  }
  paintCatPart(g,"muzzle",c); if (!lap) paintCatPart(g,"teeth",c); paintCatPart(g,"whiskers",c); g.restore();
}
