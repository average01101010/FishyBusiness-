# Serves dist/ over HTTP for testing by hand (the game fetches its map data, which a file:// page cannot):
#   node build.mjs && python3 tools/serve.py [port]   then open http://localhost:8000/
import os, sys, functools, http.server
ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist')
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
print('http://localhost:%d/  (dist/)' % port)
http.server.ThreadingHTTPServer(('', port), functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)).serve_forever()
