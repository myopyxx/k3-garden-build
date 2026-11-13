# Собирает образец редизайна в один файл: картинки котиков вшиваются внутрь страницы.
# Результат: src/redesign/sample.html (в репозиторий не попадает, на сайте его нет).
import pathlib, base64, json, subprocess, sys, tempfile
here = pathlib.Path(__file__).resolve().parent
spr = {f.stem: "data:image/webp;base64," + base64.b64encode(f.read_bytes()).decode() for f in sorted((here / "sprites").glob("*.webp"))}
src = (here / "sample.src.html").read_text(encoding="utf-8"); assert src.count("/*SPRITES*/{}") == 1
out = src.replace("/*SPRITES*/{}", json.dumps(spr))
js = out.split("<script>")[1].split("</script>")[0]
with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f: f.write(js)
r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True)
pathlib.Path(f.name).unlink()
if r.returncode: print(r.stderr); sys.exit(1)
target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else here / "sample.html"
target.write_text(out, encoding="utf-8"); print("ok:", target, len(out.encode())//1024, "KB,", len(spr), "sprites")
