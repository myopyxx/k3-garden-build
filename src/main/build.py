# Собирает основную игру: вставляет фото в исходник и кладёт результат в корень сайта.
# Запуск: python3 src/main/build.py            -> index.html
#         python3 src/main/build.py путь.html  -> в указанный файл, сайт не трогает
import base64, pathlib, subprocess, sys, tempfile
here = pathlib.Path(__file__).resolve().parent
src = (here / "diana.src.html").read_text(encoding="utf-8")
photos = (here / "photos.js").read_text(encoding="utf-8")
assert src.count("/*PHOTO_DATA*/") == 1, "в исходнике должна быть ровно одна метка /*PHOTO_DATA*/"
out = src.replace("/*PHOTO_DATA*/", photos).replace("/*FRAME_METER*/", (here.parent / "shared/frame-meter.js").read_text(encoding="utf-8"))
out = out.replace("/*CAT_SKETCH*/", (here.parent / "shared/cat-sketch.js").read_text(encoding="utf-8"))
out = out.replace("/*WARDROBE_ART*/", (here / "wardrobe-art.js").read_text(encoding="utf-8"))
for name in ("gate", "memory"):
    art = (here.parent / "shared/arena-art" / (name + ".webp")).read_bytes()
    asset = "data:image/webp;base64," + base64.b64encode(art).decode("ascii")
    out = out.replace("/*ARENA_" + name.upper() + "*/", asset)
# проверка синтаксиса скрипта до записи: сломанный файл на сайт не попадёт
js = out[out.index("<script>") + 8: out.rindex("</script>")]
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f: f.write(js)
r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
pathlib.Path(f.name).unlink()
if r.returncode: print(r.stderr); sys.exit(1)
target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else here.parent.parent / "index.html"
target.write_text(out, encoding="utf-8"); print("ok:", target, len(out.encode()), "bytes")
