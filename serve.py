#!/usr/bin/env python3
"""本地測試伺服器。執行後開 http://localhost:8000"""
import http.server, socketserver, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.mp3': 'audio/mpeg', '.html': 'text/html; charset=utf-8'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
print('http://localhost:8000  (Ctrl+C 結束)')
socketserver.TCPServer(('', 8000), H).serve_forever()
