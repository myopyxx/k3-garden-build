// Accessories use the cat rig's coordinates. Item cards crop the same drawing.
const capeClasp = `<path d="M73 135 Q98 146 127 135 Q125 144 109 148 L100 151 L89 147 Q77 144 73 135Z" fill="#944655" stroke="#50303e"/>
  <path d="M94 146 Q100 141 106 146 Q104 152 100 153 Q96 151 94 146Z" fill="#e6bd80" stroke="#5d4050"/>`;
const wardrobeArt = {
  cape: {box:"31 125 139 104", drawing:`<path d="M74 133 Q88 127 101 131 Q118 127 132 136 C138 154 144 178 158 200 L168 219 Q156 217 147 224 Q130 217 119 224 Q106 218 96 223 Q78 218 67 225 Q52 217 34 221 C52 195 54 158 74 133Z" fill="#853a4c" stroke="#443440" stroke-width="1.8"/>
    <path d="M73 141 Q69 176 51 213 Q66 205 73 218 L85 158Z M130 142 Q141 187 156 216 L143 219 Q134 201 126 180Z" fill="#632e41"/>
    <path d="M68 155 Q62 191 48 210 M135 173 Q140 194 148 206 M55 216 l6 -2 m70 2 l8 2" fill="none" stroke="#c27476" stroke-width="1.2"/>`},
  bow: {box:"109 45 39 30", drawing:`<path d="M124 60 Q117 62 115 70 L121 68 L123 72 L129 62 L134 72 L136 67 L141 68 Q137 61 131 58Z" fill="#af6277" stroke="#573f54"/>
    <path d="M126 57 C119 48 111 47 112 52 L114 63 Q115 67 126 61 Q134 65 143 62 L142 50 Q141 47 137 50 L129 57Z" fill="#d890a2" stroke="#573f54" stroke-width="1.5"/>
    <path d="M115 53 Q122 55 126 59 M132 58 l8 -5 M131 61 l7 0" fill="none" stroke="#9f586e"/>
    <path d="M125 56 Q128 54 132 57 L131 62 Q127 64 124 61Z" fill="#ecb6b9" stroke="#704a5b"/>`},
  ring: {box:"99 208 26 19", drawing:`<path d="M102 217 Q111 212 121 215 L121 220 Q110 224 102 221Z" fill="#c39b65" stroke="#624c4d" stroke-width="1.4"/>
    <path d="M104 218 Q110 216 117 216" fill="none" stroke="#f2d99d"/>
    <path d="M108 214 L111 210 L116 211 L119 215 L115 220 L110 219Z" fill="#6b93a1" stroke="#5e4950" stroke-width="1.2"/>
    <path d="M110 214 L112 211.8 L115 212.4 L113 215.3Z" fill="#c3e1d4"/>`},
  tiara: {box:"75 45 50 26", drawing:`<path d="M78 53 L87 59 L89 49 L96 57 L100 46 L105 57 L113 49 L113 59 L122 53 L118 65 Q99 71 81 65Z" fill="#c8a064" stroke="#604a48" stroke-width="1.45"/>
    <path d="M82 62 Q100 66 118 62 M88 57 l1 -4 M98 56 l2 -6" fill="none" stroke="#f4dba3" stroke-width="1.2"/>
    <path d="M96.8 61 L100 56 L103.5 61 L100 65Z" fill="#98526b" stroke="#65495b"/>`},
  wreath: {box:"56 51 73 29", drawing:`<path d="M59 74 Q86 56 125 65" fill="none" stroke="#62664f" stroke-width="2.7"/>
    <path d="M70 68 Q62 69 58 61 Q67 60 70 68Z M80 64 Q76 55 82 53 Q86 57 83 64Z M104 62 Q110 54 117 56 Q114 63 104 62Z M118 65 Q125 62 128 67 Q122 69 118 65Z" fill="#849179" stroke="#4b5148"/>
    <path d="M63 68 Q61 63 66 60 Q72 57 76 62 Q80 66 75 72 Q68 77 63 68Z M85 61 Q84 56 89 54 Q94 52 98 57 Q102 61 97 65 Q90 69 85 61Z" fill="#bb6978" stroke="#644555" stroke-width="1.25"/>
    <path d="M65 66 l4 -4 5 2 -2 5 -4 1 -2 -4 4 -2 2 2 M87 59 l4 -3 4 2 -1 4 -4 1 -1 -3 3 -1" fill="none" stroke="#834656"/>`},
  shades: {box:"54 88 92 29", drawing:`<path d="M56 93 L66 98 M135 97 L144 92 M94 99 Q100 95 106 99" fill="none" stroke="#ac8c70" stroke-width="2.7"/>
    <path d="M64 94 Q78 89 94 94 Q98 98 93 107 Q87 116 74 113 Q65 111 64 101Z M106 94 Q122 89 136 94 L135 102 Q134 113 122 114 Q111 114 107 106 Q103 99 106 94Z" fill="#413f50" stroke="#bd9e7c" stroke-width="1.8"/>
    <path d="M68 97 Q77 93 89 95 L76 102 L68 104Z M110 96 Q119 93 129 95 L116 102 L110 102Z" fill="#68677a"/>
    <path class="sglint" d="M73 109 l8 -14 M116 110 l8 -15" fill="none" stroke="#f9e4c5" stroke-width="1.7"/>`},
  mask: {box:"51 77 100 43", drawing:`<path d="M54 92 Q69 89 77 89 Q91 88 100 96 Q109 87 125 89 Q138 89 145 83 Q143 99 136 109 Q125 120 112 114 L100 109 Q87 119 74 114 Q61 111 54 92Z M67 100 Q80 89 92 99 Q89 110 78 110 Q71 110 67 100Z M108 99 Q120 89 133 100 Q129 110 120 110 Q110 109 108 99Z" fill-rule="evenodd" fill="#584251" stroke="#c5a779" stroke-width="1.25"/>
    <path d="M134 91 Q137 80 148 78 Q146 87 136 93 M137 94 Q145 87 150 88 Q148 95 138 98" fill="#aa6673" stroke="#604452"/>
    <path d="M58 94 l6 3 M64 105 q4 5 9 6 M95 95 l5 4 5 -5 M128 113 l5 -3" fill="none" stroke="#d7bd8d" stroke-width="1.1"/>`}
};
function accessoryDrawing(id, extra=""){
  return `<g stroke-linecap="round" stroke-linejoin="round">${wardrobeArt[id].drawing}${extra}</g>`;
}
function wornAccessory(id){
  return `<g class="acc acc-${id}">${accessoryDrawing(id)}</g>`;
}
function accessoryIcon(id){
  const drawing = accessoryDrawing(id,id === "cape" ? capeClasp : "");
  return `<svg class="icv" data-item="${id}" viewBox="${wardrobeArt[id].box}" aria-hidden="true">${drawing}</svg>`;
}
