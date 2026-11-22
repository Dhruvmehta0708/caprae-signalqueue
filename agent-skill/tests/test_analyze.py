import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from analyze import analyze, dedupe, normalize, score, safe_cell

class TestSignalQueue(unittest.TestCase):
    def test_dedupe_merges(self):
        leads, duplicates = dedupe([{'company':'A','website':'https://a.example','phone':''},{'company':'A','website':'https://a.example','phone':'123'}])
        self.assertEqual(duplicates,1)
        self.assertEqual(leads[0]['phone'],'123')
    def test_complete_lead(self):
        lead=normalize({'company':'CloudAxis','website':'https://cloudaxis.example','industry':'IT Services','location':'Dallas, Texas','revenue':'24000000','employees':'150','contactName':'Michael','email':'michael@cloudaxis.example','phone':'123','linkedin':'https://linkedin.com/in/test'})
        r=score(lead,{})
        self.assertEqual((r['fitScore'],r['confidenceScore'],r['priority']),(100,100,'Contact Now'))
    def test_incomplete_lead(self):
        lead=normalize({'company':'DataNest','industry':'Software','location':'Austin, Texas','revenue':'8000000','employees':'55','email':'contact@datanest.example'})
        r=score(lead,{})
        self.assertEqual((r['fitScore'],r['confidenceScore'],r['priority']),(85,40,'Verify First'))
    def test_blank_dedupe_keys_not_merged(self):
        leads,duplicates=dedupe([{},{}])
        self.assertEqual((len(leads),duplicates),(2,0))
    def test_formula_escaping(self):
        self.assertEqual(safe_cell('=HYPERLINK("x")'),"'=HYPERLINK(\"x\")")
    def test_summary(self):
        r=analyze([{'company':'A','website':'https://a.example'},{'company':'A','website':'https://a.example'}],{})
        self.assertEqual(r['importSummary']['duplicatesRemoved'],1)

if __name__=='__main__': unittest.main()
