# Ищет в исходнике игры дубли: одинаковые @keyframes, функции, константы и id.
# Дубль молча перекрывает первое определение, поэтому проверка идёт перед каждой сборкой.
import re, collections, pathlib
s = (pathlib.Path(__file__).resolve().parent / "diana.src.html").read_text(encoding="utf-8")
css = s[s.index('<style>'):s.index('</style>')]
js = s[s.rindex('<script>'):s.rindex('</script>')]
html = s[s.index('</style>'):s.rindex('<script>')]
def dups(items): return [k for k, v in collections.Counter(items).items() if v > 1]
print('dup @keyframes:', dups(re.findall(r'@keyframes\s+([\w-]+)', css)))
print('dup top-level functions:', dups(re.findall(r'^function\s+(\w+)', js, re.M)))
print('dup top-level const/let:', dups(re.findall(r'^(?:const|let)\s+(\w+)', js, re.M)))
print('dup html ids:', dups(re.findall(r'\bid="([^"$]+)"', html)))
