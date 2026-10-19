"""Serve the standalone preview, not the editable Vite template or playable game."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from pathlib import Path
from urllib.parse import urlsplit
import argparse
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=4178);a=p.parse_args()
root=Path(__file__).resolve().parents[2]/'previews/franco'
class PreviewHandler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if urlsplit(self.path).path in ('/','/index.html'):self.path='/Franco-Animation-Preview.html'
  super().do_GET()
print('Franco animation preview: http://0.0.0.0:%s'%a.port,flush=True)
ThreadingHTTPServer(('0.0.0.0',a.port),partial(PreviewHandler,directory=str(root))).serve_forever()
