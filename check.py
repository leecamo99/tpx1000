#!/usr/bin/env python3
"""上傳前自檢：確認每個單字都有對應且存在的音檔"""
import json, os, re, sys
h = open('index.html', encoding='utf-8').read()
def g(n):
    i = h.index('const %s = ' % n); s = h.index('{', i); e = h.index('};', s)
    return json.loads(h[s:e+1])
i = h.index('const DATA = '); s = h.index('[', i); e = h.index('];', s)
D = json.loads(h[s:e+1]); C = g('CLIP_MAP')
have = set(os.listdir('audio/kaitei_en'))
miss, nofile = [], []
for d in D:
    cm = C.get(d['id'])
    if not cm: miss.append(d['id']); continue
    for f in [cm['word']] + cm['phrases']:
        if f not in have: nofile.append(f)
used = {f for k in C for f in [C[k]['word']] + C[k]['phrases']}
print('單字總數      :', len(D))
print('無音檔對應    :', len(miss))
print('對應但檔案缺失:', len(nofile))
print('孤兒檔案      :', len(have - used))
print('音檔總數      :', len(have))
sys.exit(1 if (miss or nofile) else print('\n全部通過，可以上傳。') or 0)
