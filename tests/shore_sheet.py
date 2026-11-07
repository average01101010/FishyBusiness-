"""#61: before/after sheets from shore_edge.py pictures: python3 shore_sheet.py <before tag> <after tag> [places] -> shore_cmp/sheet_<place>.png
(a row per tide and shot: before | after, with a 2x crop of the middle of each)"""
import cv2, numpy as np, sys, os
A, B = sys.argv[1], sys.argv[2]
PL = sys.argv[3].split(',') if len(sys.argv) > 3 else ['havoy', 'husoy', 'vangshamn']
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'shore_cmp'))
def cell(f, lab, w=640, h=400):
    a = cv2.imread(f)
    if a is None: a = np.zeros((800, 1280, 3), np.uint8)
    full = cv2.resize(a, (w, h)); cv2.putText(full, lab, (8, 26), 0, 0.7, (0, 255, 255), 2)
    H, W = a.shape[:2]; c = a[H // 2 - 200:H // 2 + 200, W // 2 - 320:W // 2 + 320]; crop = cv2.resize(c, (w, h), interpolation=cv2.INTER_LINEAR)
    cv2.putText(crop, 'crop 2x', (8, 26), 0, 0.7, (0, 255, 255), 2)
    return np.hstack([full, crop])
for pl in PL:
    rows = []
    for t in ('low', 'high'):
        for shot in ('near', 'top', 'far', 'foam'):
            rows.append(np.hstack([cell('edge_%s_%s_%s_%s.png' % (A, pl, t, shot), '%s %s %s %s' % (A, pl, t, shot)), cell('edge_%s_%s_%s_%s.png' % (B, pl, t, shot), '%s %s %s %s' % (B, pl, t, shot))]))
    cv2.imwrite('sheet_%s.png' % pl, np.vstack(rows)); print('sheet_%s.png' % pl)
