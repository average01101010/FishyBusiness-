"""The server is the truth for haill and everything bought (HS4, 11.11.2026, docs/planer/haill-saldo.md; ui/10i-shop.js shopClaim4 and
srvApply, supabase/migrations/20261111140000_haill_srv.sql): step 10 of tests/kjoptest.py run alone, against its stand-ins for WorkOS,
Supabase and Stripe. A save that was written in has what the server says after the next start (the haill in store, the haill aboard,
a trim, Skippertak, the credit for the yard done now, a paint design); the game's own numbers are brought over once within the
server's cap; a purchase is delivered by the server's answer and confirmed once; the credit and a haill switched on are told to the
server, with and without a network; the pub's wheel is the server's and needs a network; the haill of chapter 2 is the server's; and
a server from before the migration (404) gets the game as after HS3. The steps and the stand-in are in kjoptest.py (hs4), which has
the grants the two share. The pictures go to tests/out/ (KJOP_SHOTS=<absolute folder> puts them elsewhere). Prints OK or FEIL."""
import os, runpy, sys

HERE = os.path.dirname(os.path.abspath(__file__))
os.environ['KJOP_FRA'] = '10'
sys.path.insert(0, HERE)
runpy.run_path(os.path.join(HERE, 'kjoptest.py'), run_name='__main__')
