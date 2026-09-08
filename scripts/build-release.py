"""Build a self-contained offline release. Fail on missing local image assets."""
from pathlib import Path
import re,sys,base64,mimetypes,shutil,zipfile
root=Path(__file__).resolve().parents[1]
version=re.search(r"version='([^']+)'",(root/'scripts/field-event.js').read_text())
# Result currently uses object-literal version syntax.
version=version.group(1) if version else re.search(r"version:'(0\.[^']+)'",(root/'scripts/field-event.js').read_text()).group(1)
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else root/'发行版'
name='玄鉴仙族·几笔长生-'+version;dest=out/name;dest.mkdir(parents=True,exist_ok=True)
def bundle(page):
 s=(root/page).read_text()
 def css(m):return '<style>'+(root/m[1].split('?')[0]).read_text()+'</style>'
 def js(m):
  path=m[1].split('?')[0];code=(root/path).read_text()
  if path=='scripts/game.js':code='\n'.join(x for x in code.split('\n') if not x.startswith("if(new URLSearchParams(location.search).has('test'))"))
  return '<script>'+re.sub(r'</script',r'<\\/script',code,flags=re.I)+'</script>'
 s=re.sub(r'<link rel="stylesheet" href="([^"]+)"\s*/?>',css,s)
 s=re.sub(r'<script src="([^"]+)"></script>',js,s)
 def asset(m):
  path=(root/m[1]).resolve();assert path.is_relative_to(root/'assets') and path.is_file(),f'Missing image: {m[1]}'
  mime=mimetypes.guess_type(path)[0] or 'application/octet-stream'
  return 'src="data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()+'"'
 return re.sub(r'src="(assets/[^"?]+)(?:\?[^"]*)?"',asset,s)
for page,target in [('index.html','开始游戏.html'),('guide.html','guide.html')]: (dest/target).write_text(bundle(page))
license=root/'vendor/LICENSE.phaser.txt'
if not license.exists():
 options=list((root/'vendor').glob('*LICENSE*'))+list((root/'vendor').glob('*license*'));assert options,'Missing Phaser license';license=options[0]
shutil.copy2(license,dest/'第三方许可.txt')
notes=list((root/'docs').glob(version+'-*.md'));assert len(notes)==1,'A unique version changelog is required';shutil.copy2(notes[0],dest/'更新说明.md')
(dest/'请先阅读.txt').write_text(name+'\n解压后双击“开始游戏.html”，无需联网。首页图片已内嵌。\n操作与设定见 guide.html；本版改动与验证见 更新说明.md。\n')
with zipfile.ZipFile(out/(name+'.zip'),'w',zipfile.ZIP_DEFLATED) as z:
 for p in dest.iterdir():z.write(p,name+'/'+p.name)
print(dest)
