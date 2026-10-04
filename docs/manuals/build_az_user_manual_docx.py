# -*- coding: utf-8 -*-
"""Build the Azerbaijani Birİnci user manual (.docx)."""
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parent
SHOTS = ROOT / "screenshots"
OUT = ROOT / "Birinci-sayt-istifade-qaydasi.docx"
BLUE = RGBColor(0x00, 0x69, 0xB4)
DARK = RGBColor(0x1E, 0x29, 0x3B)
MUTED = RGBColor(0x47, 0x55, 0x69)
NAVY = RGBColor(0x0F, 0x3D, 0x6E)


def set_run_font(run, name="Calibri", size=11, bold=False, italic=False, color=None):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color is not None:
        run.font.color.rgb = color


def set_paragraph_spacing(p, before=0, after=8, line=1.15):
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE


def shade_cell(cell, hex_color):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), hex_color)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def add_page_number(paragraph):
    run = paragraph.add_run()
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    run._r.append(fld1)
    run._r.append(instr)
    run._r.append(fld2)
    set_run_font(run, size=9, color=MUTED)


def add_toc_field(paragraph):
    """Word TOC field (updates on open / F9)."""
    r1 = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    begin.set(qn("w:dirty"), "true")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = ' TOC \\o "1-3" \\h \\z \\u '
    sep = OxmlElement("w:fldChar")
    sep.set(qn("w:fldCharType"), "separate")
    r1._r.append(begin)
    r1._r.append(instr)
    r1._r.append(sep)
    r2 = paragraph.add_run(
        "Mündəricat Word-də sənəd açılarkən yenilənir. Əgər siyahı boşdursa, sahənin üzərinə sağ klikləyib «Sahəni yenilə» (Update Field) seçin, və ya F9 basın."
    )
    set_run_font(r2, size=10, italic=True, color=MUTED)
    r3 = paragraph.add_run()
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    r3._r.append(end)


def enable_update_fields(doc):
    settings = doc.settings.element
    upd = OxmlElement("w:updateFields")
    upd.set(qn("w:val"), "true")
    settings.append(upd)


def heading(doc, text, level):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        run.font.color.rgb = NAVY if level == 1 else BLUE
        run.font.name = "Calibri"
        run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    return p


def body(doc, text, *, first_line=True):
    p = doc.add_paragraph()
    set_paragraph_spacing(p, before=0, after=8, line=1.15)
    if first_line:
        p.paragraph_format.first_line_indent = Cm(0.5)
    run = p.add_run(text)
    set_run_font(run, size=11, color=DARK)
    return p


def note(doc, text):
    p = doc.add_paragraph()
    set_paragraph_spacing(p, before=4, after=10, line=1.12)
    p.paragraph_format.left_indent = Cm(0.4)
    run = p.add_run(text)
    set_run_font(run, size=10.5, italic=True, color=MUTED)
    return p


def bullets(doc, items, numbered=False):
    style = "List Number" if numbered else "List Bullet"
    for item in items:
        p = doc.add_paragraph(style=style)
        set_paragraph_spacing(p, before=1, after=3, line=1.12)
        p.clear()
        run = p.add_run(item)
        set_run_font(run, size=11, color=DARK)


def steps(doc, items):
    bullets(doc, items, numbered=True)


def caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=2, after=12, line=1.0)
    run = p.add_run(text)
    set_run_font(run, size=9.5, italic=True, color=MUTED)
    return p


def add_shot(doc, filename, cap, width=6.3):
    path = SHOTS / filename
    if not path.exists():
        note(doc, f"(Şəkil tapılmadı: {filename})")
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=8, after=2, line=1.0)
    run = p.add_run()
    run.add_picture(str(path), width=Inches(width))
    caption(doc, cap)


def ui(label):
    return f"«{label}»"


def setup_header_footer(doc, title):
    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(2.2)
    section.right_margin = Cm(2.2)
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.header_distance = Cm(1.0)
    section.footer_distance = Cm(1.0)
    section.different_first_page_header_footer = True

    hp = section.header.paragraphs[0]
    hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r = hp.add_run(title)
    set_run_font(r, size=9, color=MUTED)

    fp = section.footer.paragraphs[0]
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = fp.add_run("Birİnci  ·  ")
    set_run_font(r, size=9, color=MUTED)
    add_page_number(fp)

    # First page: no header, still footer brand
    fhp = section.first_page_header.paragraphs[0]
    fhp.text = ""
    ffp = section.first_page_footer.paragraphs[0]
    ffp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = ffp.add_run("Birİnci")
    set_run_font(r, size=9, color=MUTED)


def style_defaults(doc):
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(11)
    normal.font.color.rgb = DARK
    for i, size in ((1, 18), (2, 14), (3, 12)):
        h = styles[f"Heading {i}"]
        h.font.name = "Calibri"
        h.font.size = Pt(size)
        h.font.bold = True
        h.font.color.rgb = NAVY if i == 1 else BLUE


def build():
    doc = Document()
    style_defaults(doc)
    title = "Birİnci saytının istifadə qaydası"
    setup_header_footer(doc, title)
    enable_update_fields(doc)

    # --- Title page ---
    for _ in range(3):
        doc.add_paragraph()
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Birİnci")
    set_run_font(r, size=36, bold=True, color=BLUE)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Bilik və Mənəvi Dəyərlər İncisi")
    set_run_font(r, size=14, italic=True, color=NAVY)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_paragraph_spacing(p, before=18, after=8)
    r = p.add_run("Saytın istifadə qaydası")
    set_run_font(r, size=22, bold=True, color=DARK)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Azərbaycan dili interfeysi  ·  birinci.cloud")
    set_run_font(r, size=12, color=MUTED)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Oktyabr 2026")
    set_run_font(r, size=11, color=MUTED)

    doc.add_page_break()

    heading(doc, "Giriş", 1)
    body(
        doc,
        "Bu təlimat Birİnci veb-saytının Azərbaycan dilindəki ictimai səhifələrini — ana səhifəni, hekayə kateqoriyalarını, sayt xəritəsini və «Məramımız, Baxış və Dəyərlərimiz» səhifəsini — addım-addım izah edir. Bütün düymə, menyu və sahə adları saytda gördüyünüz Azərbaycan etiketləridir.",
        first_line=False,
    )
    body(
        doc,
        "Təlimat dərc olunan (ictimai) sayta əsaslanır. Yerli inkişaf nüsxəsində bəzən «Kəşf və ixtiralar» menyusu görünə bilər; bu bölmə dərc olunan saytın ictimai funksiyası deyil və burada öyrədilmir. «Haqqımızda» altında hüquqi səhifələr (məxfilik, şərtlər, kukilər, rekvizitlər) və «Rəy» menyuda durur, lakin onların məzmunu bu sənədə daxil edilməyib.",
        first_line=False,
    )
    body(
        doc,
        "Hekayələrin səsli oxunması (Dinlə) hazırda qlobal olaraq söndürülüb: düymələr kodda qalsa da, istifadəçiyə göstərilmir. Dərc olunan saytda MP3 pleyeri gözləməyin.",
        first_line=False,
    )

    heading(doc, "Mündəricat", 1)
    toc_p = doc.add_paragraph()
    set_paragraph_spacing(toc_p, before=6, after=10)
    add_toc_field(toc_p)
    note(
        doc,
        "Aşağıdakı qısa siyahı Word sahəsi yenilənənə qədər də oriyentasiya verir.",
    )
    bullets(
        doc,
        [
            "1. Sayt üzrə naviqasiya — loqo, menyu, dil, axtarış, altlıq",
            "2. Səhifə səviyyəsində funksiyalar — ana səhifə, kateqoriyalar, filtrlər, sayt xəritəsi, məram",
            "3. Ayrı hekayə — siyahı, şəkil, mətn, lightbox, çoxdilli görünüş, səs",
        ],
    )

    # ========== 1 ==========
    heading(doc, "1. Sayt üzrə naviqasiya", 1)
    body(
        doc,
        "Hər səhifənin yuxarısında eyni göy zolaq (sayt başlığı) durur. Solda loqo, ortada əsas menyu, sağda dil keçidi və axtarış yerləşir. Səhifənin aşağısında isə əlaqə məlumatı, müəllif hüququ və (mövcuddursa) yığım (Build) nömrəsi görünür.",
        first_line=False,
    )
    add_shot(
        doc,
        "01-ana-sehife-tesnifli.png",
        "Şəkil 1. Ana səhifə (masaüstü): başlıq zolağı, alətlər paneli və kateqoriya kartları.",
    )

    heading(doc, "1.1. Loqo və «Məzmuna keç»", 2)
    body(
        doc,
        "Başlığın solundakı mirvari nişanı və Birİnci yazısı loqodur. Ona basmaq sizi saytın kök girişinə aparır. Klaviatura ilə gəzənlər üçün səhifənin ən əvvəlində gizli keçid var: " + ui("Məzmuna keç") + " — Tab düyməsi ilə görünür və əsas məzmuna atlayır.",
        first_line=False,
    )

    heading(doc, "1.2. Əsas menyu", 2)
    body(
        doc,
        "Masaüstündə (təxminən 1400 pikseldən geniş ekranda) menyu başlıqda üfüqi durur. Etiketlər belədir:",
        first_line=False,
    )
    bullets(
        doc,
        [
            ui("İbrətamiz hekayələr") + " — hekayə ana səhifəsini ardıcıl (siyahı) görünüşündə açır.",
            ui("Haqqımızda") + " — açılan menyu (aşağıda).",
            ui("Sayt xəritəsi") + " — bütün ictimai keçidlərin xəritəsi (əsas səviyyədə ayrıca bənd).",
        ],
    )
    body(
        doc,
        ui("Haqqımızda") + " açılınca bu bəndlər görünür:",
        first_line=False,
    )
    bullets(
        doc,
        [
            ui("Məramımız, Baxış və Dəyərlərimiz") + " — ocağın məqsədi və dəyərləri (bu təlimatda izah olunur).",
            ui("Rəy") + " — şərh göndərmək üçün; bu təlimatda məzmunu izah edilmir.",
            ui("Hüquqi məlumat") + " — içində məxfilik, istifadə şərtləri, kuki siyasəti və hüquqi rekvizitlər; bu təlimatda sənədlərin mətni izah edilmir.",
            ui("Saytın xəritəsi") + " — Haqqımızda panelində də eyni xəritəyə keçid.",
        ],
    )
    note(
        doc,
        "Yerli inkişaf nüsxəsində menyuda «Kəşf və ixtiralar» da görünə bilər. Dərc olunan saytda bu bölmə ictimai xüsusiyyət deyil; onu istifadə etməyi öyrətməyin.",
    )

    heading(doc, "1.3. Mobil menyu («Menyunu aç»)", 2)
    body(
        doc,
        "Daha dar ekranda (telefon və bir çox planşet) üfüqi menyu yığılır. Solda üç xətli düymə görünür; əlçatımlıq adı " + ui("Menyunu aç") + "-dır. Basınca menyu açılır, düymə isə bağlama (×) görünüşünə keçir və adı " + ui("Menyunu bağla") + " olur. Açılan siyahıda eyni bəndlər durur: " + ui("İbrətamiz hekayələr") + ", " + ui("Haqqımızda") + " (açılan), " + ui("Sayt xəritəsi") + ".",
        first_line=False,
    )
    add_shot(
        doc,
        "12-mobil-ana.png",
        "Şəkil 2. Telefon (390 px): hamburger, loqo, AZ və axtarış nişanı.",
        width=3.2,
    )
    add_shot(
        doc,
        "13-mobil-menyu.png",
        "Şəkil 3. Telefonda açılmış əsas menyu.",
        width=3.2,
    )

    heading(doc, "1.4. Dil keçidi", 2)
    body(
        doc,
        "Başlığın sağında bayraq və " + ui("AZ") + " yazısı durur. Düymənin başlığı " + ui("Azərbaycan") + "-dır; qrupun əlçatımlıq adı " + ui("Dil") + "-dir. Basınca siyahı açılır:",
        first_line=False,
    )
    bullets(
        doc,
        [
            "AZ — Azərbaycan",
            "EN — English",
            "RU — Русский",
            "KY — Кыргызча",
        ],
    )
    steps(
        doc,
        [
            ui("AZ") + " düyməsinə basın.",
            "Eyni səhifənin qarşılığını seçin (məsələn, EN).",
            "Brauzer sizi həmin dilin ünvanına aparır; mövzu və hekayə, mümkün olduqda, eyni qalır.",
        ],
    )

    heading(doc, "1.5. Qlobal axtarış", 2)
    body(
        doc,
        "Dil keçidinin yanında axtarış düyməsi durur. Görünən yazı " + ui("Axtar…") + "-dir; masaüstündə " + ui("Ctrl+K") + " qısayolu da göstərilir. Əlçatımlıq adı: " + ui("Qlobal axtarış, Ctrl+K") + ". Basınca (və ya Ctrl+K) dialoq açılır.",
        first_line=False,
    )
    bullets(
        doc,
        [
            "Başlıq: " + ui("Qlobal axtarış"),
            "Bağlama: " + ui("Bağla") + " (×) və ya fon (" + ui("Axtarışı bağla") + "), Esc",
            "Sahə: " + ui("Hekayə axtar") + ", yer tutucu " + ui("Bütün dillərdəki hekayələrdə axtar…"),
            "Nəticə sayı, məsələn: " + ui("40 nəticə") + "; hər sətirdə hekayə adı, dil kodu və kateqoriya",
        ],
    )
    steps(
        doc,
        [
            "Başlıqdakı " + ui("Axtar…") + " düyməsinə basın (və ya Ctrl+K).",
            "Sözü yazın (məsələn, dost).",
            "Siyahıdan hekayəyə basın — müvafiq kateqoriya səhifəsi açılır.",
            "Dialoqu ×, Esc və ya tünd fonla bağlayın.",
        ],
    )
    add_shot(
        doc,
        "03-qlobal-axtaris.png",
        "Şəkil 4. Qlobal axtarış dialoqu: «dost» sorğusu və nəticələr.",
    )

    heading(doc, "1.6. Çörək qırıntıları və səhifə naviqasiyası", 2)
    body(
        doc,
        "Başlığın altında yol göstərilir. Ana səhifədə yalnız " + ui("Ana səhifə") + " durur. Kateqoriyada, məsələn: " + ui("Ana səhifə") + " › " + ui("İbrətamiz hekayələr") + " › kateqoriya adı. Keçidlər sizi bir pillə yuxarı qaytarır.",
        first_line=False,
    )
    body(
        doc,
        "Ekranın sağ aşağı küncündə iki yuvarlaq düymə var:",
        first_line=False,
    )
    bullets(
        doc,
        [
            "Aşağı ox — " + ui("Səhifənin aşağısına get") + " (altlığa).",
            "Yuxarı ox — " + ui("Səhifənin yuxarısına qayıt") + ".",
        ],
    )

    heading(doc, "1.7. Altlıq (footer)", 2)
    body(
        doc,
        "Səhifənin sonunda üç sütunlu altlıq durur:",
        first_line=False,
    )
    bullets(
        doc,
        [
            "QR kod (birinci.cloud) və qısa ocaq mətni.",
            "Loqo, " + ui("Birİnci") + " və şüar: " + ui("Bilik və Mənəvi Dəyərlər İncisi") + ".",
            ui("Əlaqə vasitələri") + ": " + ui("Telefon") + ", " + ui("Ünvan") + " (yer tutucu ola bilər), veb " + ui("birinci.cloud") + ", e-poçt " + ui("info@birinci.cloud") + ".",
        ],
    )
    body(
        doc,
        "Ən altdakı hüquqi zolaqda keçidlər durur (məzmunları bu təlimatda izah olunmur): " + ui("Rəy") + ", " + ui("Məxfilik bildirişi") + ", " + ui("İstifadə şərtləri") + ", " + ui("Kuki siyasəti") + ", " + ui("Hüquqi rekvizitlər") + ", " + ui("Saytın xəritəsi") + ". Sağda müəllif sətri: «© Birİnci - All rights reserved». Yığım məlumatı yüklənibsə, eyni sətirdə « | Build …» əlavə olunur.",
        first_line=False,
    )

    # ========== 2 ==========
    heading(doc, "2. Səhifə səviyyəsində funksiyalar", 1)

    heading(doc, "2.1. Ana səhifə — İbrətamiz hekayələr", 2)
    body(
        doc,
        "Azərbaycan hekayə ana səhifəsinin başlığı " + ui("İbrətamiz hekayələr") + "-dir. Qısa girişdən sonra mənbə qeydi oxunur: " + ui("Hekayələr açıq internet mənbələrindən alınmış, illüstrasiyalar isə süni intellektlə yaradılmışdır.") + " Aşağıda kateqoriya kartları və ya bütün hekayələrin siyahısı durur.",
        first_line=False,
    )

    heading(doc, "2.1.1. Alətlər paneli", 3)
    body(
        doc,
        "Girişin üstündə (və ya siyahıda yapışqan) alətlər durur. Hamısının adı saytdakı kimidir:",
        first_line=False,
    )
    bullets(
        doc,
        [
            "Axtarış sahəsi — yer tutucu " + ui("Axtar…") + ". Yazdıqca kartlar və ya hekayələr süzülür. Uyğunluq yoxdursa: " + ui("Uyğun kateqoriya tapılmadı.") + " və ya " + ui("Uyğun hekayə tapılmadı.") + " Aktiv filtr çipində " + ui("Filtri təmizlə") + " (×) görünür.",
            ui("Müəllif") + " açılanı — " + ui("Bütün müəlliflər") + " (standart), " + ui("Bəxtiyar Siracov") + ", " + ui("Etibar Siracsoy") + ".",
            ui("Görüntü") + " qrupu: " + ui("Təsnifatlı") + " (tor/kart) və " + ui("Ardıcıl") + " (siyahı). Seçim yadda saxlanılır.",
            "Siyahıda əlavə: " + ui("Kateqoriya") + " filtri; " + ui("Şəkillər") + " / " + ui("Mətnlər") + " üçün " + ui("Göstər") + " və " + ui("Gizlət") + " (kateqoriya səhifəsində " + ui("Şəkli göstər") + " / " + ui("Şəkli gizlət") + ", " + ui("Mətni göstər") + " / " + ui("Mətni gizlət") + ").",
        ],
    )
    note(
        doc,
        "Saytda hekayələri təsadüfi qarışdıran (Shuffle) düymə yoxdur. «Hamısını aç / Hamısını yığ» yalnız dərc olunmayan kəşf kataloqundadır və burada öyrədilmir.",
    )
    steps(
        doc,
        [
            ui("Təsnifatlı") + " seçin — mövzu kartlarını görün (məsələn, " + ui("Dostluq və insan münasibətləri") + ", «29 hekayə»).",
            "Kartın üzərinə basın — həmin kateqoriya səhifəsi açılır.",
            ui("Ardıcıl") + " seçin — bütün hekayələr əlifba sırası ilə siyahıda, solda " + ui("Hekayələr") + " paneli ilə açılır.",
            "Axtarışa söz yazın və ya " + ui("Müəllif") + " seçin; bitirəndə × ilə filtri silin.",
        ],
    )

    heading(doc, "2.1.2. Kateqoriya kartları", 3)
    body(
        doc,
        "Təsnifatlı görünüşdə hər kartın başlığı, qısa təsviri və «N hekayə» sayğacı var. Cari mövzular (adlar dəqiq belədir): " + ui("İman və mənəviyyat") + ", " + ui("Ailə və tərbiyə") + ", " + ui("Sevgi və evlilik") + ", " + ui("Dostluq və insan münasibətləri") + ", " + ui("Əxlaq və xarakter") + ", " + ui("Söz, sükut və ünsiyyət") + ", " + ui("Hikmət və həyat dərsləri") + ", " + ui("Əmək, ruzi və sərvət") + ", " + ui("Ədalət və cəmiyyət") + ", " + ui("Yaşlanma və zaman") + ", " + ui("Təmsillər və məsəllər") + ", " + ui("Tarix və tanınmış şəxsiyyətlər") + ".",
        first_line=False,
    )

    heading(doc, "2.2. Kateqoriya səhifəsi", 2)
    body(
        doc,
        "Kateqoriya səhifəsində iri başlıq, qısa təsvir və hekayə sayı görünür (məsələn, «· 32 hekayə»). Standart görünüş adətən " + ui("Ardıcıl") + "-dır: solda mündəricat, sağda tam mətnlər.",
        first_line=False,
    )
    add_shot(
        doc,
        "04-kateqoriya-ardicil.png",
        "Şəkil 5. Kateqoriya səhifəsi: alətlər, «Hekayələr» paneli və hekayə mətni.",
    )
    add_shot(
        doc,
        "05-kateqoriya-tesnifli.png",
        "Şəkil 6. Eyni kateqoriyanın təsnifatlı (kart) görünüşü.",
    )

    heading(doc, "2.2.1. «Hekayələr» paneli (mündəricat)", 3)
    body(
        doc,
        "Sol sütunun başlığı " + ui("Hekayələr") + "-dir (ikitab nişanı ilə). Altında bu kateqoriyadakı bütün başlıqların siyahısı durur. Başlığa basmaq eyni səhifədə həmin hekayəyə sürüşdürür. Telefonda bu panel çox vaxt yığılır; açmaq üçün " + ui("Hekayələr menyusunu aç") + " düyməsindən istifadə olunur, bağlamaq üçün " + ui("Hekayələr menyusunu bağla") + ".",
        first_line=False,
    )

    heading(doc, "2.2.2. Kart görünüşündə hekayə", 3)
    body(
        doc,
        ui("Təsnifatlı") + " rejimində hər hekayə kartında başlıq və qısa parçası durur. Karta basmaq siyahıya keçir və həmin hekayəyə aparır. Kartlarda «Mətni dinlə» nişanı HTML-də var, lakin səs söndürüldüyü üçün gizlidir — istifadəçi onu görmür və basmır.",
        first_line=False,
    )
    add_shot(
        doc,
        "14-mobil-kateqoriya.png",
        "Şəkil 7. Telefonda kateqoriya: yapışqan axtarış və görünüş düymələri; mətn göstər/gizlət qrupu telefonda gizlidir.",
        width=3.2,
    )

    heading(doc, "2.3. Sayt xəritəsi", 2)
    body(
        doc,
        ui("Sayt xəritəsi") + " həm əsas menyuda, həm də altlıqda durur. Səhifə başlığı " + ui("Sayt xəritəsi") + "-dir. Yuxarıda yapışqan keçid çipləri var: " + ui("Əsas bölmələr") + ", " + ui("İbrətamiz hekayələr") + ", " + ui("Haqqımızda") + ", " + ui("Hüquqi məlumat") + ", " + ui("Dillər") + ". (Yerli nüsxədə kəşflər çipi də ola bilər — dərc olunan saytın ictimai bələdçisi deyil.)",
        first_line=False,
    )
    bullets(
        doc,
        [
            "Sahə: " + ui("Bu səhifədə axtar") + ", yer tutucu " + ui("Hekayə və bölmələrdə axtar…") + ". Uyğunluq yoxdursa: " + ui("Bu səhifədə uyğun nəticə yoxdur."),
            ui("İbrətamiz hekayələr") + " bölməsində " + ui("Hamısı") + " keçidi bütün siyahıya aparır; hər blokda kateqoriya adı, hekayə sayı və ayrı hekayə keçidləri durur.",
            ui("Haqqımızda") + " kartı " + ui("Məramımız, Baxış və Dəyərlərimiz") + " səhifəsinə gedir.",
            ui("Dillər") + ": " + ui("Eyni səhifəni başqa dildə açın.") + " — AZ, EN, RU, KY.",
        ],
    )
    add_shot(
        doc,
        "10-sayt-xeritesi.png",
        "Şəkil 8. Sayt xəritəsi: bölmə çipləri, axtarış və əsas kartlar.",
    )

    heading(doc, "2.4. Məramımız, Baxış və Dəyərlərimiz", 2)
    body(
        doc,
        "Bu səhifə Haqqımızda menyusundan açılır. Üç əsas kart: " + ui("Məram") + ", " + ui("Baxış") + ", " + ui("Dəyərlərimiz") + ". Dəyər həbləri (" + ui("Bilik") + ", " + ui("Həqiqət və etibarlılıq") + ", " + ui("Maariflənmə") + ", " + ui("Ümumbəşəri dəyərlər") + ", " + ui("İrsə ehtiram") + ", " + ui("Tənqidi və müstəqil düşüncə") + ", " + ui("İlham və inkişaf") + ") eyni səhifədəki izaha sürüşdürür.",
        first_line=False,
    )
    add_shot(
        doc,
        "11-meram-baxis-deyerler.png",
        "Şəkil 9. «Məramımız, Baxış və Dəyərlərimiz» səhifəsinin girişi.",
    )

    heading(doc, "2.5. Masaüstü və telefon fərqləri", 2)
    bullets(
        doc,
        [
            "Masaüstü: tam menyu, " + ui("Axtar…") + " yazısı və Ctrl+K; sol " + ui("Hekayələr") + " paneli həmişə açıq ola bilər.",
            "Dar ekran: " + ui("Menyunu aç") + "; axtarış çox vaxt yalnız lupa nişanıdır.",
            "Telefonda (iPhone/Android telefon UA): hekayənin " + ui("Mətn") + " göstər/gizlət qrupu gizlidir — mətn oxumaq üçün qalır. " + ui("Şəkil") + " düymələri qalır.",
            "Kateqoriya alətləri telefonda yığcam və yapışqan durur; " + ui("Müəllif") + " və görünüş nişanları saxlanır.",
        ],
    )

    # ========== 3 ==========
    heading(doc, "3. Ayrı hekayə", 1)
    body(
        doc,
        "Hekayə ayrıca veb-ünvan kimi yox, kateqoriya (və ya ana siyahı) səhifəsində kart kimi açılır. Ünvanın sonunda # və hekayənin qısa adı (məsələn, #friendship-of-horses) durur — bunu paylaşmaq olar.",
        first_line=False,
    )

    heading(doc, "3.1. Hekayəni açmaq", 2)
    steps(
        doc,
        [
            "Kateqoriyanı açın və ya ana səhifədə " + ui("Ardıcıl") + " seçin.",
            "Soldakı " + ui("Hekayələr") + " siyahısından başlığı seçin, və ya səhifəni sürüşdürün.",
            "Kart görünüşündə qısa karta basın — siyahıya və həmin hekayəyə keçirsiniz.",
        ],
    )
    add_shot(
        doc,
        "06-hekaye-siyahi.png",
        "Şəkil 10. Açılmış hekayə: başlıq, çoxdilli nişan, mətn, ibrət, mənbə və illüstrasiya.",
    )

    heading(doc, "3.2. Başlıq və çoxdilli görünüş", 2)
    body(
        doc,
        "Hekayənin göy zolağında başlıq durur. Yanındakı kiçik kürə nişanı " + ui("Çoxdilli görünüş") + "-dür; başlığı " + ui("Bu hekayəni çoxdilli görünüşdə aç") + "-dır. Basınca eyni hekayə bir neçə dildə yan-yana (örtük pəncərədə) açılır. Orada dilləri göstərmək/gizlətmək, " + ui("Əvvəlki hekayə") + " / " + ui("Növbəti hekayə") + " və hekayə nömrəsi sahəsi olur. Bağlamaq üçün Esc və ya örtüyün bağla düyməsi.",
        first_line=False,
    )

    heading(doc, "3.3. Şəkil və mətn düymələri", 2)
    body(
        doc,
        "Mətnin sağ üstündə (və alətlər panelində, siyahı rejimində) qruplar durur:",
        first_line=False,
    )
    bullets(
        doc,
        [
            ui("Şəkil") + ": " + ui("Şəkli göstər") + " (göz) və " + ui("Şəkli gizlət") + ". Standart olaraq illüstrasiyalar gizlidir; göstərmək üçün gözə basın.",
            ui("Mətn") + ": " + ui("Mətni göstər") + " və " + ui("Mətni gizlət") + ". Hər ikisini eyni anda gizlətmək olmur — biri qalmalıdır.",
            ui("Səs") + " qrupu (" + ui("Mətni dinlə") + " / " + ui("Dayandır") + ") hazırda gizlidir — növbəti bölməyə baxın.",
        ],
    )

    heading(doc, "3.4. Mətn, ibrət və mənbə", 2)
    body(
        doc,
        "Əsas mətn abzaslarla gəlir. Axırda vurğulanmış " + ui("İbrət:") + " sətri (hekayənin dərsi) və mənbə qeydi durur: " + ui("Hekayələr açıq internet mənbələrindən alınmış, illüstrasiyalar isə süni intellektlə yaradılmışdır.") + " Ayrı «İstinadlar» bölməsi yoxdur — mənbə bu sətirdədir.",
        first_line=False,
    )

    heading(doc, "3.5. Şəkil lightbox-u", 2)
    body(
        doc,
        "Şəkil görünəndə illüstrasiyaya basın (düymənin adı, məsələn, " + ui("Atların dostluğu şəklini böyüt") + "). Tam ekran dialoqu açılır: " + ui("Böyüdülmüş illüstrasiya") + ". Bağlamaq: " + ui("Bağla") + " (×), Esc və ya tünd fon.",
        first_line=False,
    )
    add_shot(
        doc,
        "07-sekil-lightbox.png",
        "Şəkil 11. Böyüdülmüş illüstrasiya (lightbox).",
    )

    heading(doc, "3.6. Mətn lightbox-u", 2)
    body(
        doc,
        "Hekayə başlığının özünə (kürə nişanına yox) basın. Dialoq açılır: " + ui("Böyüdülmüş hekayə mətni") + ". Üstdə başlıq, gövdədə tam mətn, ibrət və mənbə, sağda " + ui("Bağla") + ". Esc də bağlayır. Bu rejim oxumağı rahatlaşdırır; səs düymələri burada da gizlidir.",
        first_line=False,
    )
    add_shot(
        doc,
        "08-metn-lightbox.png",
        "Şəkil 12. Böyüdülmüş hekayə mətni (lightbox).",
    )

    heading(doc, "3.7. Səs — «Mətni dinlə»", 2)
    body(
        doc,
        "Kodda hər hekayə üçün " + ui("Səs") + " qrupu nəzərdə tutulub: " + ui("Mətni dinlə") + " və " + ui("Dayandır") + ". Hazırda səs idarəsi qlobal olaraq sönülüdür (AUDIO_CONTROLS_ENABLED = false). Nəticə: düymələr istifadəçiyə göstərilmir (gizlidir, disabled), pleyer açılmır. Dərc olunan saytda MP3 dinləməyin. Yerli HTML-də data-audio yolları qala bilər, amma interfeys onları təqdim etmir.",
        first_line=False,
    )
    body(
        doc,
        "Gələcəkdə səs açılsa, eyni etiketlər görünəcək; Azərbaycan səsi bəzi brauzerlərdə olmaya bilər və o zaman " + ui("Azərbaycan dilində səsli oxuma bu brauzerdə əlçatan deyil") + " izahı çıxar. Bu, indiki ictimai vəziyyət deyil.",
        first_line=False,
    )

    heading(doc, "3.8. Qısa yaddaş vərəqi", 2)
    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    hdr[0].text = "Nə etmək istəyirsiniz"
    hdr[1].text = "Haraya basın"
    for c in hdr:
        shade_cell(c, "0069B4")
        for p in c.paragraphs:
            for r in p.runs:
                set_run_font(r, size=10, bold=True, color=RGBColor(255, 255, 255))
    rows = [
        ("Kateqoriyaya keçmək", "Təsnifatlı kartdakı mövzu adı"),
        ("Bütün hekayələr", "Menyuda «İbrətamiz hekayələr» və ya «Ardıcıl»"),
        ("Hekayə tapmaq", "«Axtar…» (səhifədə) və ya «Qlobal axtarış»"),
        ("Dili dəyişmək", "«AZ» → EN / RU / KY"),
        ("Şəkli görmək", "«Şəkli göstər», sonra şəklin üzərinə"),
        ("Mətni böyütmək", "Hekayə başlığına klik"),
        ("Çoxdilli oxumaq", "Başlıqdakı kürə — «Çoxdilli görünüş»"),
        ("Səhifənin sonu / əvvəli", "Sağdakı aşağı / yuxarı oxlar"),
    ]
    for a, b in rows:
        row = table.add_row().cells
        row[0].text = a
        row[1].text = b
        for cell in row:
            for p in cell.paragraphs:
                for r in p.runs:
                    set_run_font(r, size=10, color=DARK)

    heading(doc, "Əlavə: bu təlimatda olmayanlar", 1)
    bullets(
        doc,
        [
            "Kəşf və ixtiralar — dərc olunan saytda ictimai funksiya deyil.",
            "Rəy forması və hüquqi sənədlərin mətni.",
            "Hesab («Daxil ol» / «Qeyd ol») — interfeysdə hal-hazırda göstərilmir.",
            "Hekayəni qarışdırmaq və ya «Hamısını aç» — hekayə səhifələrində yoxdur.",
        ],
    )
    body(
        doc,
        "Suallarınız üçün:  info@birinci.cloud  ·  https://birinci.cloud",
        first_line=False,
    )

    doc.save(str(OUT))
    print("wrote", OUT)


if __name__ == "__main__":
    build()
