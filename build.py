import re
from pathlib import Path
import sys
import os

os.system("npm run build")
os.system("npx javascript-obfuscator dist/game.js")

HTML_IN = "./dist/index.html"
CSS_IN = "./dist/game.css"
JS_IN = "./dist/game-obfuscated.js"
HTML_OUT = "MSS.html"

def read_text(p: str) -> str:
    path = Path(p)
    if not path.exists():
        print(f"找不到文件 {p}")
        sys.exit(1)
    return path.read_text(encoding="utf-8")

html = read_text(HTML_IN)
css = read_text(CSS_IN)
js = read_text(JS_IN)

style_tag = f"<style>\n{css}\n</style>"
script_tag = f"<script>\n{js}\n</script>"


link_re = re.compile(r'<link[^>]*\bgame\.css\b[^>]*>', flags=re.IGNORECASE)
script_ref_re = re.compile(r'<script[^>]*\bgame\.js\b[^>]*>\s*</script>', flags=re.IGNORECASE)
new_html = link_re.sub(lambda m: style_tag, html, count=1)
new_html = script_ref_re.sub("", new_html, count=1)
body_close_re = re.search(r'</body\s*>', new_html, flags=re.IGNORECASE)
inserted = False

if body_close_re:
    idx = body_close_re.start()
    new_html = new_html[:idx] + script_tag + new_html[idx:]
    inserted = True
    location = "</body>"
else:
    html_close_re = re.search(r'</html\s*>', new_html, flags=re.IGNORECASE)
    if html_close_re:
        idx = html_close_re.start()
        new_html = new_html[:idx] + script_tag + new_html[idx:]
        inserted = True
        location = "</html>"

if not inserted:
    new_html = new_html + "\n" + script_tag
    location = "EOF (append)"

Path(HTML_OUT).write_text(new_html, encoding="utf-8")
print(f"输出：{HTML_OUT}")