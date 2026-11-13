/* =================== КАРТЫ =================== */
/* . пол  # стена  b кусты  w вода  x коробка  G фонтан капель  1/2 старт команд  S старт (одиночный режим) */
function mirrorV(top, center, swap){
  const rows = top.slice(); if (center) rows.push(center);
  for (let i = top.length - 1; i >= 0; i--) rows.push(swap ? top[i].replace(/2/g, "1") : top[i]);
  return rows;
}
function mirror4(q){                 /* четверть 13×13 → поле 25×25 */
  const half = q.map(r => r + r.slice(0, 12).split("").reverse().join(""));
  return half.concat(half.slice(0, 12).reverse());
}
const MAPS = {
  gems: mirrorV([
    ".....2..2..2.....",
    ".................",
    "..bbb.......bbb..",
    "..bbb..###..bbb..",
    "........#........",
    "##.............##",
    "....bb.....bb....",
    "....bb.....bb....",
    ".#.............#.",
    ".#...##...##...#.",
    "......b...b......",
    "...bbb.....bbb...",
    "......w...w......"
  ], "........G........", true),
  surv: mirror4([
    ".............",
    ".S..........S",
    "......bb.....",
    "..##..bb..x..",
    "..#.......x..",
    "......x......",
    ".bb..xx...bb.",
    ".bb.......bb.",
    "....##..x....",
    "..x.....#....",
    "..x..bb.#..x.",
    ".....bb......",
    "....x.....x.."
  ]),
  waves: mirrorV([
    ".................",
    ".................",
    "...##.......##...",
    "...#.........#...",
    "......bb.bb......",
    ".................",
    ".bb...........bb.",
    ".bb....###....bb.",
    ".................",
    "....#.......#....",
    "................."
  ], "........P........", false)
};
/* сетка карты для одного матча: коробки можно ломать, поэтому копия */
function loadMap(id){
  const rows = MAPS[id], H = rows.length, W = rows[0].length, g = [], boxHp = {}, spots = {1: [], 2: [], S: [], P: [], G: []};
  for (let y = 0; y < H; y++){ g.push([]);
    for (let x = 0; x < W; x++){ let c = rows[y][x];
      if (c === "1" || c === "2" || c === "S" || c === "P" || c === "G"){ spots[c].push({x: (x + .5)*T, y: (y + .5)*T}); c = "."; }
      if (c === "x") boxHp[x + "," + y] = 3200;
      g[y].push(c); } }
  return {id, W, H, g, boxHp, spots, pw: W*T, ph: H*T};
}
