"""Build the five localized manuals from reviewed text and current UI captures."""
from pathlib import Path
import json, sys
from docx import Document
from docx.shared import Cm, Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent
REFERENCE = ROOT / 'Birinci-user-manual-AZ.docx'
NAMES = {lang: f'Birinci-user-manual-{lang.upper()}.docx' for lang in ('az','en','de','ru','ky')}
LOCALES={'az':'az-Latn-AZ','en':'en-GB','de':'de-DE','ru':'ru-RU','ky':'ky-KG'}

def field(p, instruction, cached=''):
    r=p.add_run();a=OxmlElement('w:fldChar');a.set(qn('w:fldCharType'),'begin');r._r.append(a)
    a=OxmlElement('w:instrText');a.set(qn('xml:space'),'preserve');a.text=instruction;r._r.append(a)
    a=OxmlElement('w:fldChar');a.set(qn('w:fldCharType'),'separate');r._r.append(a)
    p.add_run(cached)
    a=OxmlElement('w:fldChar');a.set(qn('w:fldCharType'),'end');p.add_run()._r.append(a)

def para(doc,text,style=None):
    p=doc.add_paragraph(text,style);p.paragraph_format.space_after=Pt(8)
    p.paragraph_format.line_spacing=1.12
    return p

def build(lang):
    data=json.loads((ROOT/f'manual-{lang}.json').read_text(encoding='utf-8'))
    d=Document(REFERENCE)
    for e in list(d._element.body):
        if e.tag!=qn('w:sectPr'):d._element.body.remove(e)
    # Remove orphaned old screenshots while preserving source styles and furniture.
    for key,rel in list(d.part.rels.items()):
        if rel.reltype.endswith('/image'):del d.part.rels[key]
    for border in list(d.styles.element.iter(qn('w:pBdr'))):border.getparent().remove(border)
    normal=d.styles['Normal'];normal.font.name='Calibri';normal.font.size=Pt(11)
    langel=OxmlElement('w:lang');langel.set(qn('w:val'),LOCALES[lang]);normal.element.get_or_add_rPr().append(langel)
    for level,size in [(1,18),(2,14)]:
        st=d.styles[f'Heading {level}'];st.font.name='Calibri';st.font.size=Pt(size);st.font.color.rgb=RGBColor.from_string('0F3D6E')
    for sec in d.sections:
        sec.page_width=Cm(21);sec.page_height=Cm(29.7);sec.left_margin=Cm(2.2);sec.right_margin=Cm(2.2);sec.top_margin=Cm(2);sec.bottom_margin=Cm(2)
        hp=sec.header.paragraphs[0];hp.clear();hp.alignment=WD_ALIGN_PARAGRAPH.RIGHT
        r=hp.add_run(data['title']);r.font.size=Pt(9);r.font.color.rgb=RGBColor.from_string('475569')
        fp=sec.footer.paragraphs[0];fp.clear();fp.alignment=WD_ALIGN_PARAGRAPH.CENTER;fp.add_run('Birİnci  ·  ');field(fp,' PAGE ','1')
        for r in fp.runs:r.font.size=Pt(9)
    p=para(d,'Birİnci');p.paragraph_format.space_before=Pt(80);p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p.runs[0].font.size=Pt(36);p.runs[0].font.bold=True;p.runs[0].font.color.rgb=RGBColor.from_string('0069B4')
    p=para(d,data['title'],'Title');p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    for r in p.runs:r.font.color.rgb=RGBColor(0,0,0);r.font.size=Pt(26);r.font.bold=True
    for text in [data['subtitle'],'birinci.cloud',data['date']]:
        p=para(d,text);p.alignment=WD_ALIGN_PARAGRAPH.CENTER
    p=para(d,data['intro']);p.paragraph_format.space_before=Pt(30)
    para(d,data['scope'])
    d.add_page_break()
    p=para(d,data['contents']);p.runs[0].bold=True;p.runs[0].font.size=Pt(20);p.runs[0].font.color.rgb=RGBColor.from_string('0F3D6E')
    field(d.add_paragraph(),' TOC \\o "1-1" \\h \\z \\u ')
    for i,sec in enumerate(data['sections'],1):
        d.add_page_break();h=d.add_heading(sec['title'],level=1);h.paragraph_format.space_before=Pt(0)
        para(d,sec['paras'][0])
        p=d.add_paragraph();p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.space_after=Pt(2)
        width=2.35 if sec['shot']=='mobile' else 6.3
        shape=p.add_run().add_picture(str(ROOT/'screenshots-20261030'/lang/(sec['shot']+'.png')),width=Inches(width))
        shape._inline.docPr.set('descr',sec['caption'])
        p.paragraph_format.keep_with_next=True
        p=para(d,f"{data['figure']} {i}. {sec['caption']}");p.alignment=WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:r.italic=True;r.font.size=Pt(9.5);r.font.color.rgb=RGBColor.from_string('475569')
        for text in sec['paras'][1:]:para(d,text)
    d.core_properties.title=data['title'];d.core_properties.subject=data['subtitle'];d.core_properties.language=LOCALES[lang];d.core_properties.author='Birİnci'
    d.core_properties.comments=''
    out=ROOT/NAMES[lang];d.save(out);print(out)

if __name__=='__main__':
    for lang in sys.argv[1:] or NAMES:build(lang)
