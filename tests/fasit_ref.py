"""The ceiling for tests/fasit.py: how well one year's landing notes alone foretell another's, with the same measures (no game, no build).

  python3 tests/fasit_ref.py <fiske json of the year the model is made from> <fiske json of the year it is tested on>

No model can be expected to beat this by much: it is how much the fishing itself moves from one year to the next."""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fasit import truth_index, measures, SPS

def main():
    A, B = json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))
    res = {sp: measures(truth_index(A, sp), truth_index(B, sp)) for sp in SPS}
    json.dump(res, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'fasit-tak.json'), 'w'), indent=1)
    print('taket: %s mot %s' % (os.path.basename(sys.argv[1]), os.path.basename(sys.argv[2])))
    for sp, v in res.items(): print('  %-8s alle %s · steder %s · sesong %s · (%d celler, %d steder)' % (sp, v['all'], v['place'], v['season'], v['cells'], v['places']))

if __name__ == '__main__': main()
