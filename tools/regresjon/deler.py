#!/usr/bin/env python3
"""The regression in parts (tools/regresjon/RUTINE.md, 09.11.2026). `run.py full` runs every test in one command, and the tool that
runs it stops a command after two hours: on 09.11.2026 both the full run and the follow-up stopped there, and about 50 of the 58 3D
tests never ran. This prints the parts, one command line each, so each part is its own background command under the limit:

    python3 tools/regresjon/deler.py lite      the unit tests and the tests that do not look at 3D (LITE), in two halves
    python3 tools/regresjon/deler.py 3d        the 3D tests (D3), eight to a line
    python3 tools/regresjon/deler.py solo      the tests that measure time, alone, one to a line
    python3 tools/regresjon/deler.py alle      all three, in that order

Each line is the arguments to `python3 tests/run.py smoke`. Nothing is left out: the union of the lines is D3 + LITE + SOLO, as
`run.py full` runs them.
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, 'tests'))
import run as R   # tests/run.py: D3, LITE, SOLO (its main() runs only as a script)


def parts(kind):
    solo = list(dict.fromkeys(R.SOLO))
    lite = [n for n in dict.fromkeys(R.LITE) if n not in solo]
    d3 = [n for n in dict.fromkeys(R.D3) if n not in solo and n not in lite]
    if kind == 'lite':
        h = (len(lite) + 1) // 2   # two halves: on 09.11.2026 all of LITE took most of the two hours
        return [['unit'] + lite[:h], lite[h:]]
    if kind == '3d':
        return [d3[i:i + 8] for i in range(0, len(d3), 8)]
    if kind == 'solo':
        return [[n] for n in solo]
    if kind == 'alle':
        return parts('lite') + parts('3d') + parts('solo')
    sys.exit(__doc__)


if __name__ == '__main__':
    for p in parts(sys.argv[1] if len(sys.argv) > 1 else 'alle'):
        print(' '.join(p))
