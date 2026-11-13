# Собирает «Ночную арену»: склеивает части кода и вставляет их в оболочку.
# Запуск: python3 src/arena/build.py            -> arena/index.html
#         python3 src/arena/build.py путь.html  -> в указанный файл, сайт не трогает
import pathlib, subprocess, sys, tempfile
here = pathlib.Path(__file__).resolve().parent
PARTS = ["core.js", "maps.js", "game.js", "modes.js", "render.js", "main.js"]   # порядок важен
js = "\n".join((here / f).read_text(encoding="utf-8") for f in PARTS)
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f: f.write(js)
r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
pathlib.Path(f.name).unlink()
if r.returncode: print(r.stderr); sys.exit(1)
shell = (here / "shell.html").read_text(encoding="utf-8"); assert shell.count("/*JS*/") == 1
html = shell.replace("/*JS*/", js)
target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else here.parent.parent / "arena" / "index.html"
target.write_text(html, encoding="utf-8"); print("ok:", target, len(html.encode()), "bytes")
