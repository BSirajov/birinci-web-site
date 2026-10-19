"""Regression checks for real multilingual catalog paragraph classification."""
import json
from pathlib import Path
import shutil
import subprocess
import pytest

ROOT=Path(__file__).resolve().parents[1]

def test_comparison_preserves_explicit_morals_and_poetry():
    node=shutil.which('node')
    if not node:pytest.skip('Node.js is required for the comparison JavaScript regression')
    source=(ROOT/'assets/story-compare.js').read_text(encoding='utf-8')
    classifier=source[source.index('  const foldAzI ='):source.index('  const findStory =')]
    cases=[
        (['First stanza\nSecond line','Last stanza','Etibar Siracsoy'],'flowers','az',''),
        (['Body','Moral: Be kind.','Stories collected from the internet and processed by AI.'],'test','en','Moral: Be kind.'),
        (['Text','Lehre: Sei freundlich.','Geschichten aus dem Internet gesammelt.'],'test','de','Lehre: Sei freundlich.'),
    ]
    script=classifier+'\nconst cases='+json.dumps(cases)+'; console.log(JSON.stringify(cases.map(c=>classifyParagraphs(c[0],c[1],c[2]))));'
    results=json.loads(subprocess.check_output([node,'-e',script],text=True,encoding='utf-8'))
    for case,result in zip(cases,results):
        assert result['moral']==case[3]
        assert result['source']==case[0][-1]
    assert results[0]['body']==cases[0][0][:-1]
