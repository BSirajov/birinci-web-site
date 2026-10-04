# -*- coding: utf-8 -*-
"""Localized legal-page copy for Birİnci (production-accurate)."""

CONTACT_EMAIL = "info@birinci.cloud"
SITE_HOST = "birinci.cloud"


def _p(*paras):
    return list(paras)


def _sec(sid, heading, paragraphs, bullets=None):
    return {
        "id": sid,
        "heading": heading,
        "paragraphs": list(paragraphs or []),
        "bullets": list(bullets or []),
    }


FEEDBACK_LEAD = {
    "az": (
        "Rəyiniz saytı yaxşılaşdırmağa kömək edir. "
        "Təklif, düzəliş və ya üzləşdiyiniz problemi bizə bildirin."
    ),
    "en": (
        "Your feedback helps us improve the site. "
        "Share a suggestion, a correction, or a problem you have run into."
    ),
    "ru": (
        "Ваш отзыв помогает улучшить сайт. "
        "Напишите предложение, исправление или проблему, с которой вы столкнулись."
    ),
    "ky": (
        "Пикириңиз сайтты жакшыртууга жардам берет. "
        "Сунуш, оңдоо же жолуккан көйгөйүңүздү бизге билдириңиз."
    ),
}


def _page(title, lead, description, highlights, sections, form=None, panel=None):
    return {
        "title": title,
        "lead": lead,
        "description": description,
        "highlights_title": None,
        "highlights": highlights,
        "sections": sections,
        "form": form,
        "panel": panel if panel is not None else lead,
    }


def pages_en():
    privacy = _page(
        "Privacy notice",
        "How Birİnci uses information on this public website.",
        "Privacy notice for the Birİnci website: how preferences are stored, what we do not collect, and how to contact us.",
        [
            "The public site is a static, multilingual collection of wisdom stories. We do not place advertising or analytics cookies on our pages.",
            "We do not sell personal data.",
            "You do not need an account to read the site.",
            "The only contact address published on the site is " + CONTACT_EMAIL + ".",
            "Birİnci is registered in Austria. This notice follows the GDPR and the Austrian Data Protection Act (DSG).",
            "We have not yet published a street address, telephone number, Firmenbuch number, UID/VAT number, names of managing directors, or a named data-protection officer. Those details will appear here when they are available.",
        ],
        [
            _sec(
                "controller",
                "1. Controller (Art. 4(7) GDPR)",
                _p(
                    "Birİnci is a knowledge hearth registered in Austria. It publishes wisdom stories at https://"
                    + SITE_HOST
                    + ". This notice covers the public website as it is hosted for readers. It does not describe unpublished development features.",
                    "The controller is established in Austria and processes personal data under Regulation (EU) 2016/679 (GDPR) and the Austrian Data Protection Act (Datenschutzgesetz — DSG).",
                    "The legal form, Firmenbuch number (FN), UID/VAT number, registered-office street address, and a named data-protection officer (Datenschutzbeauftragte/r) are not yet published. Those details will appear here when they are available. Until then, write to "
                    + CONTACT_EMAIL
                    + ".",
                ),
            ),
            _sec(
                "what",
                "2. What information may arise",
                _p("Depending on how you use the site, the following information may arise:"),
                [
                    "Browsing: pages are static HTML. Our scripts do not include Google Analytics, gtag, Plausible, or Meta/Facebook Pixel.",
                    "Preferences on your device: language, list or card view, whether story illustrations or text are collapsed, and playback speed, volume, and mute for listen controls. These use localStorage and, in some cases, sessionStorage — not tracking cookies that we set.",
                    "Email you choose to send: if you write to "
                    + CONTACT_EMAIL
                    + " (including from the Feedback page), we receive whatever you include in that message.",
                    "Hosting: the site is served from Hostinger. The host may keep technical logs (for example IP address, browser type, and the requested address) as part of running a web server. We do not run a separate analytics product on the published pages.",
                    "Accounts: sign-in and account pages are not available on the public website. Do not assume that accounts, session cookies, or comment profiles exist there.",
                    "Speech and audio: some languages can use the browser’s speech features. Story audio files are not included on the public site. Listen controls may be missing, or they may use the browser’s own speech features instead.",
                    "Compare pages may load Google Fonts from Google’s servers. Ordinary story and home pages use fonts stored with the site.",
                ],
            ),
            _sec(
                "why",
                "3. Purposes and legal bases (Art. 6 GDPR)",
                _p(
                    "We process personal data only as needed for the public site. Typical legal bases are:"
                ),
                [
                    "Art. 6(1)(f) GDPR (legitimate interests): delivering the static site, keeping it secure, remembering layout and language on your device, and answering unsolicited email you send us;",
                    "Art. 6(1)(b) GDPR: only if you later enter a contract with us (reading the site does not form a contract);",
                    "Art. 6(1)(c) GDPR: where Austrian or EU law requires us to retain or disclose information;",
                    "Art. 6(1)(a) GDPR: we would rely on consent only if we later introduce optional analytics or similar tools. The public site does not load them.",
                ],
            ),
            _sec(
                "share",
                "4. Who else may see it",
                _p(
                    "We do not sell personal data. Hostinger processes hosting data as the web host. Email you send is processed by the mail systems behind "
                    + CONTACT_EMAIL
                    + ". We do not embed third-party advertising networks. Outbound links (for example to encyclopaedia pages) are ordinary links; following them takes you off this site."
                ),
            ),
            _sec(
                "retention",
                "5. How long it is kept",
                _p(
                    "Preferences remain in your browser until you clear site data. Email is kept only as long as needed to reply and for ordinary correspondence. Hosting logs follow the host’s retention rules. We have not published a separate company timetable for how long records are kept."
                ),
            ),
            _sec(
                "rights",
                "6. Your rights (GDPR Arts. 15–21)",
                _p(
                    "You may request access, rectification, erasure, restriction, and data portability, and you may object to processing based on legitimate interests. For this static site, the personal data we actually hold is mainly email you sent us, plus whatever the host stores in server logs. Write to "
                    + CONTACT_EMAIL
                    + ". We have not published the name of a data-protection officer.",
                    "You may lodge a complaint with the Austrian Data Protection Authority (Österreichische Datenschutzbehörde), Barichgasse 40-42, 1030 Vienna, Austria, https://www.dsb.gv.at/. If you live in another EU or EEA country, you may also contact your local supervisory authority.",
                ),
            ),
            _sec(
                "children",
                "7. Children",
                _p(
                    "The site offers educational reading. We do not knowingly run sign-up or profiling aimed at children. Do not send us a child’s personal data unless you are that child’s parent or guardian and you need to contact us."
                ),
            ),
            _sec(
                "security",
                "8. Security",
                _p(
                    "The public website is served over HTTPS. No method of transmission is perfectly secure. Do not send passwords or identity documents to the feedback address unless we specifically ask through a verified channel."
                ),
            ),
            _sec(
                "changes",
                "9. Changes",
                _p(
                    "If the site starts using analytics, accounts, or new processors, this notice will be updated."
                ),
            ),
            _sec(
                "contact",
                "10. Contact",
                _p(
                    "Email: " + CONTACT_EMAIL + ".",
                    "Website: https://" + SITE_HOST + ".",
                    "Telephone, postal address, legal-entity identifiers, and a named privacy contact will be published here when they are available. The site footer does not yet show real values for those fields.",
                ),
            ),
        ],
    )
    cookies = _page(
        "Cookie policy",
        "What this site stores in your browser — and what it does not.",
        "Cookie and local-storage practices for the public Birİnci website.",
        [
            "The public pages do not set advertising or analytics cookies.",
            "There is no cookie banner, because we do not load trackers that would require consent.",
            "Display preferences use localStorage on your device.",
            "The web host may still set strictly technical cookies. Those cookies are not set by our page code.",
        ],
        [
            _sec(
                "none-analytics",
                "1. Cookies we do not set",
                _p(
                    "The public pages do not include Google Analytics, gtag, Google Tag Manager, Plausible, or Facebook Pixel. We do not set a cookie for audience measurement on the static site."
                ),
            ),
            _sec(
                "storage",
                "2. Local and session storage (not cookies)",
                _p(
                    "Scripts may store small preference values in the browser. Typical keys include:"
                ),
                [
                    "birinci-lang — last language choice;",
                    "birinci-home-view, birinci-category-view, birinci-inventions-view — list or card layout;",
                    "birinci-images-collapsed, birinci-images-collapsed-default-v2, birinci-texts-collapsed — whether illustrations or story text stay collapsed;",
                    "birinci-audio-rate, birinci-audio-volume, birinci-audio-muted — listen-control settings;",
                    "sessionStorage keys such as birinci-lang-ctx and birinci-compare-* — short-lived navigation context for language or compare views;",
                    "birinci-dev-story-edit — a development editing flag, not a public feature.",
                ],
            ),
            _sec(
                "host",
                "3. Hosting and other cookies",
                _p(
                    "Hostinger (or a content-delivery network in front of it) may set cookies needed to deliver the site, balance traffic, or protect against abuse. We cannot list every host cookie here, because they are not created by these pages.",
                    "Account or session cookies would exist only if an optional account service were turned on in production. The public static site does not enable that interface.",
                ),
            ),
            _sec(
                "fonts",
                "4. Third-party requests",
                _p(
                    "Main pages load fonts from this site. Some compare views still request fonts.googleapis.com. If you open those pages, Google may see that request. Ordinary wisdom-story pages do not load Google Fonts.",
                    "YouTube and other video hosts are not embedded on the public story home. Discoveries and inventions is a development section and is not part of the public site; it is not described here as a live catalogue.",
                ),
            ),
            _sec(
                "control",
                "5. How to control storage",
                _p(
                    "Use your browser to clear site data for "
                    + SITE_HOST
                    + " if you want preferences reset. If you block all storage, the site may forget your language and layout choices. There is no cookie settings panel on these pages, because we do not use a consent platform for trackers."
                ),
            ),
        ],
    )
    terms = _page(
        "Terms of use",
        "The rules for reading and using Birİnci’s public pages.",
        "Terms of use for the Birİnci wisdom-stories website.",
        [
            "The site is for personal reading, learning, and reflection.",
            "Stories are gathered from open internet sources; illustrations are generated with artificial intelligence, as stated on the site.",
            "Do not scrape, republish, or present the collection as your own product without permission.",
        ],
        [
            _sec(
                "service",
                "1. The site",
                _p(
                    "Birİnci publishes a static multilingual website of wisdom stories, together with pages about our mission. The public site does not include Discoveries and inventions, and story audio files are not part of the public website.",
                    "Pages are provided “as is”. We work to keep texts careful and sourced, but we do not warrant completeness or fitness for a particular purpose.",
                ),
            ),
            _sec(
                "use",
                "2. Acceptable use",
                _p("You may browse, read, and share links to public pages. You may not:"),
                [
                    "attack, overload, or probe the host;",
                    "misrepresent the site as an official government, religious, or academic institution;",
                    "use automated harvesting that impairs the service;",
                    "post unlawful material through any form we later add.",
                ],
            ),
            _sec(
                "content",
                "3. Content and sources",
                _p(
                    "Story pages state that stories are taken from open internet sources and that illustrations are created with artificial intelligence. Treat the narratives as wisdom literature, not as professional advice — medical, legal, or financial.",
                    "Trademarks and third-party names that appear in stories remain with their owners."
                ),
            ),
            _sec(
                "liability",
                "4. Liability",
                _p(
                    "To the extent allowed by law, Birİnci is not liable for loss arising from use of the site, hosting interruptions, or reliance on a story. Nothing in these terms limits liability that cannot be limited by law."
                ),
            ),
            _sec(
                "law",
                "5. Governing law",
                _p(
                    "These terms are governed by the laws of the Republic of Austria, excluding conflict-of-law rules and excluding the UN Convention on Contracts for the International Sale of Goods, so far as that convention could apply. Mandatory consumer-protection rules of your country of residence remain unaffected where EU law so requires.",
                    "Unless mandatory law provides otherwise, the courts of Austria have jurisdiction. A specific court location will be named here once a registered-office address is published.",
                ),
            ),
        ],
    )
    imprint = _page(
        "Legal notice (Imprint)",
        "Imprint information required under Austrian and EU law (MedienG / ECG). Only details we can verify are filled in.",
        "Imprint for Birİnci: Austria-registered publisher, verified public contacts, and unpublished registration identifiers.",
        [
            "Birİnci is registered in Austria.",
            "Public website: https://" + SITE_HOST + ".",
            "Public email: " + CONTACT_EMAIL + ".",
            "Firmenbuch number, UID, street address, telephone, and names of managing directors are not yet published. This page does not invent them.",
        ],
        [
            _sec(
                "identity",
                "1. Media owner / publisher (Medieninhaber)",
                _p(
                    "The website is published under the name Birİnci (pearl of knowledge and moral values).",
                    "Country of registration: Austria. This page is meant to meet the information duties under the Austrian Media Act (Mediengesetz — MedienG) and the e-Commerce Act (ECG / § 5 ECG), so far as those duties apply to this online offering.",
                    "Legal form (for example GmbH, association, or sole trader), Firmenbuch number (FN), commercial court, and UID (ATU…) are not yet published. Those details will appear here when they are available.",
                ),
            ),
            _sec(
                "published",
                "2. Details that can be verified on the site",
                _p("The following appear in the site footer and nearby site elements:"),
                [
                    "Website: https://" + SITE_HOST + ".",
                    "Email: " + CONTACT_EMAIL + ".",
                    "A QR code pointing to the same public website.",
                ],
            ),
            _sec(
                "missing",
                "3. Mandatory imprint fields still missing",
                _p(
                    "The site footer currently shows telephone and address labels without real values (placeholders such as “Address to be added”). Until official records are added to the site we do not invent:"
                ),
                [
                    "registered office (Anschrift / Sitz);",
                    "telephone number;",
                    "Firmenbuch number and court of registration;",
                    "UID / VAT identification number;",
                    "names of managing directors (Geschäftsführer) or association officers;",
                    "name of the person responsible for editorial content (medienrechtlich Verantwortliche/r).",
                ],
            ),
            _sec(
                "hosting",
                "4. Hosting",
                _p(
                    "Public files are intended to be served from Hostinger. Hostinger is the hosting provider, not the media owner or the author of the texts."
                ),
            ),
            _sec(
                "dispute",
                "5. Dispute resolution / jurisdiction",
                _p(
                    "The publisher is established in Austria. EU consumers may use the European Commission’s ODR platform (https://ec.europa.eu/consumers/odr/) where that procedure applies. We are not obliged to take part in a consumer-arbitration board unless Austrian law so requires; that participation is not stated here.",
                    "Civil-law disputes are subject to Austrian courts unless mandatory EU consumer rules give you another forum. A specific venue will be added once a registered office is published.",
                ),
            ),
        ],
    )
    feedback = _page(
        "Feedback",
        FEEDBACK_LEAD["en"],
        "Send comments, suggestions, and website problems to Birİnci.",
        [],
        [],
        panel="Share a suggestion, a correction, or a problem you have run into. Messages go to "
        + CONTACT_EMAIL
        + ".",
        form={
            "name_label": "Name",
            "email_label": "Email address",
            "email_placeholder": "example@email.com",
            "type_label": "Feedback type",
            "subject_label": "Subject",
            "subject_hint": "(for example: a broken link, a page that does not open, a spelling correction, and similar issues)",
            "message_label": "Your feedback",
            "url_label": "Related page URL",
            "url_optional": "(optional)",
            "url_hint": "This field is filled in automatically when you arrive from a page-specific feedback link.",
            "url_placeholder": "https://birinci.cloud/en/…",
            "privacy_label": "I have read the Privacy notice and understand that this message will be used as described there",
            "privacy_link": "Privacy notice",
            "section_title": "Your feedback",
            "section_sub": "Comments, suggestions, and website problems",
            "intro": FEEDBACK_LEAD["en"],
            "required_note": "Fields marked with * are required.",
            "submit": "Send feedback",
            "file_label": "Screenshot or attachment",
            "file_hint": "JPG, PNG, WEBP, GIF, or PDF. Maximum 5 MB.",
            "file_choose": "Choose file",
            "file_replace": "Replace",
            "file_remove": "Remove",
            "file_ready": "Ready to send",
            "honeypot_label": "Website",
            "success_title": "Thank you. Your feedback has been sent.",
            "success_body": "We read every message and use it to improve the website.",
            "success_home": "Back to the home page",
        },
    )
    return {
        "privacy-notice": privacy,
        "cookie-policy": cookies,
        "terms-of-use": terms,
        "legal-notice": imprint,
        "feedback": feedback,
    }


def pages_az():
    privacy = _page(
        "Məxfilik bildirişi",
        "Birİnci bu ictimai saytda məlumatları necə istifadə edir.",
        "Birİnci saytının məxfilik bildirişi: tərcihlərin saxlanması, toplanmayan məlumatlar və əlaqə.",
        [
            "İctimai sayt statik, çoxdilli hikmət hekayələri toplusudur. Səhifələrimizdə reklam və ya analitika kukisi qoymuruq.",
            "Şəxsi məlumat satmırıq.",
            "Saytı oxumaq üçün hesab lazım deyil.",
            "Saytda dərc olunmuş yeganə əlaqə ünvanı " + CONTACT_EMAIL + "-dir.",
            "Birİnci Avstriyada qeydiyyatdan keçib. Bu bildiriş GDPR və Avstriya Məlumatların Qorunması Qanununa (DSG) əsaslanır.",
            "Küçə ünvanı, telefon, Firmenbuch nömrəsi, UID/ƏDV, idarəedici adları və məlumatların qorunması üzrə məsul şəxs hələ dərc olunmayıb. Bu məlumatlar mövcud olanda burada göstəriləcək.",
        ],
        [
            _sec(
                "controller",
                "1. Məlumat nəzarətçisi (GDPR m. 4(7))",
                _p(
                    "Birİnci Avstriyada qeydiyyatdan keçmiş bilik ocağıdır və hikmət hekayələrini https://"
                    + SITE_HOST
                    + " ünvanında dərc edir. Bu bildiriş oxucular üçün yerləşdirilmiş ictimai saytı əhatə edir; dərc olunmamış inkişaf funksiyalarını təsvir etmir.",
                    "Nəzarətçi Avstriyada yerləşir və şəxsi məlumatları (Aİ) 2016/679 Qaydası (GDPR) və Avstriya Məlumatların Qorunması Qanunu (Datenschutzgesetz — DSG) əsasında emal edir.",
                    "Hüquqi forma, Firmenbuch nömrəsi (FN), UID/ƏDV, qeydiyyat ünvanı və adlandırılmış Datenschutzbeauftragte hələ dərc olunmayıb. Bu məlumatlar mövcud olanda burada görünəcək. Hələlik "
                    + CONTACT_EMAIL
                    + " ünvanına yazın.",
                ),
            ),
            _sec(
                "what",
                "2. Hansı məlumatlar yarana bilər",
                _p("Saytdan necə istifadə etdiyinizdən asılı olaraq aşağıdakı məlumatlar yarana bilər:"),
                [
                    "Baxış: səhifələr statik HTML-dir. Skriptlərimizdə Google Analytics, gtag, Plausible və ya Meta/Facebook Pixel yoxdur.",
                    "Cihazınızdakı tərcihlər: dil, siyahı və ya kart görünüşü, illüstrasiya və mətnin yığılması, dinləmə sürəti, səs və susdurma. Bunlar localStorage və bəzən sessionStorage ilə saxlanır — bizim qoyduğumuz izləmə kukisi deyil.",
                    "Göndərdiyiniz e-poçt: "
                    + CONTACT_EMAIL
                    + " ünvanına (o cümlədən Rəy səhifəsindən) yazsanız, mesajdakı məlumat bizə çatır.",
                    "Hosting: sayt Hostinger-də saxlanır. Host texniki jurnallar (məsələn IP ünvanı, brauzer növü və sorğu ünvanı) apara bilər. Dərc olunan səhifələrdə ayrıca analitika məhsulu yoxdur.",
                    "Hesablar: ictimai saytda giriş və hesab səhifələri yoxdur. Orada hesab, sessiya kukisi və ya şərh profili olduğunu güman etməyin.",
                    "Nitq və audio: bəzi dillər brauzerin nitq xüsusiyyətlərindən istifadə edə bilər. Hekayə audio faylları ictimai sayta daxil edilmir. Dinləmə idarələri olmaya bilər, ya da brauzerin öz nitq funksiyasına keçə bilər.",
                    "Müqayisə səhifələri Google Fonts yükləyə bilər. Adi hekayə və ana səhifələr saytdakı şriftlərdən istifadə edir.",
                ],
            ),
            _sec(
                "why",
                "3. Məqsəd və hüquqi əsaslar (GDPR m. 6)",
                _p("İctimai sayt üçün yalnız lazım olan emal aparılır. Tipik hüquqi əsaslar:"),
                [
                    "GDPR m. 6(1)(f) (qanuni maraq): saytı göstərmək, onu təhlükəsiz saxlamaq, dil və görünüşü cihazınızda yadda saxlamaq, göndərdiyiniz e-poçta cavab vermək;",
                    "GDPR m. 6(1)(b): yalnız sonradan müqavilə bağlansa (saytı oxumaq müqavilə yaratmır);",
                    "GDPR m. 6(1)(c): Avstriya və ya Aİ hüququ tələb etdikdə;",
                    "GDPR m. 6(1)(a): analitika kimi alətlər sonradan əlavə olunarsa razılıq — ictimai saytda belə alət yoxdur.",
                ],
            ),
            _sec(
                "share",
                "4. Kim görə bilər",
                _p(
                    "Şəxsi məlumat satmırıq. Hostinger host kimi hosting məlumatını emal edir. Göndərdiyiniz e-poçtu "
                    + CONTACT_EMAIL
                    + " arxasındakı poçt sistemləri emal edir. Üçüncü tərəf reklam şəbəkəsi yerləşdirilməyib. Xarici keçidlər (məsələn ensiklopediya səhifələri) adi keçidlərdir; onlara keçmək bu saytdan kənara çıxmaqdır."
                ),
            ),
            _sec(
                "retention",
                "5. Saxlama müddəti",
                _p(
                    "Tərcihlər sayt məlumatını təmizləyənə qədər brauzerinizdə qalır. E-poçt yalnız cavab və adi yazışma üçün lazım olduğu qədər saxlanır. Hosting jurnalları hostun saxlama qaydalarına tabedir. Ayrı bir şirkət arxivi cədvəli dərc olunmayıb."
                ),
            ),
            _sec(
                "rights",
                "6. Hüquqlarınız (GDPR m. 15–21)",
                _p(
                    "Məlumat almaq, düzəliş, silinmə, məhdudlaşdırma, daşınma hüququnuz var və qanuni maraq əsasında emala etiraz edə bilərsiniz. Bu statik saytda əlimizdəki şəxsi məlumat əsasən göndərdiyiniz e-poçt və host jurnallarıdır. "
                    + CONTACT_EMAIL
                    + " ünvanına yazın. Məlumatların qorunması üzrə məsul şəxsin adı dərc olunmayıb.",
                    "Şikayəti Avstriya Məlumatların Qorunması Orqanına (Österreichische Datenschutzbehörde), Barichgasse 40-42, 1030 Vyana, Avstriya, https://www.dsb.gv.at/ ünvanına verə bilərsiniz. Aİ və ya AEE-nin başqa ölkəsində yaşayırsınızsa, yerli nəzarət orqanına da müraciət edə bilərsiniz.",
                ),
            ),
            _sec(
                "children",
                "7. Uşaqlar",
                _p(
                    "Sayt maarifləndirici oxu təqdim edir. Uşaqlara yönəlmiş qeydiyyat və ya profil yaratmırıq. Uşaq haqqında şəxsi məlumat göndərməyin, əgər o uşağın valideyni və ya qəyyumu deyilsinizsə, yaxud bizimlə əlaqə saxlamağa ehtiyac yoxdursa."
                ),
            ),
            _sec(
                "security",
                "8. Təhlükəsizlik",
                _p(
                    "İctimai sayt HTTPS ilə verilir. Heç bir ötürmə tam təhlükəsiz deyil. Təsdiqlənmiş kanaldan xahiş etməmişiksə, rəy ünvanına parol və ya şəxsiyyət sənədi göndərməyin."
                ),
            ),
            _sec(
                "changes",
                "9. Dəyişikliklər",
                _p(
                    "Sayt analitika, hesablar və ya yeni emaledicilər istifadə etməyə başlasa, bu bildiriş yenilənəcək."
                ),
            ),
            _sec(
                "contact",
                "10. Əlaqə",
                _p(
                    "E-poçt: " + CONTACT_EMAIL + ".",
                    "Sayt: https://" + SITE_HOST + ".",
                    "Telefon, poçt ünvanı, hüquqi şəxs rekvizitləri və məxfilik üzrə adlı əlaqə şəxsi mövcud olanda burada dərc olunacaq. Saytın aşağı hissəsində bu sahələr hələ real dəyərlə doldurulmayıb.",
                ),
            ),
        ],
    )
    cookies = _page(
        "Kuki siyasəti",
        "Bu sayt brauzerinizdə nə saxlayır — və nə saxlamır.",
        "İctimai Birİnci saytında kuki və lokal yaddaş təcrübəsi.",
        [
            "İctimai səhifələr reklam və ya analitika kukisi qoymur.",
            "Razılıq tələb edən izləyici yükləmədiyimiz üçün kuki banneri yoxdur.",
            "Görünüş tərcihləri cihazınızdakı localStorage-də saxlanır.",
            "Host hələ də yalnız texniki kuki qoya bilər. Bu kukilər səhifə kodumuzda təyin olunmayıb.",
        ],
        [
            _sec(
                "none-analytics",
                "1. Qoymadığımız kukilər",
                _p(
                    "İctimai səhifələrdə Google Analytics, gtag, Google Tag Manager, Plausible və ya Facebook Pixel yoxdur. Statik saytda auditoriya ölçümü üçün kuki qoymuruq."
                ),
            ),
            _sec(
                "storage",
                "2. Lokal və sessiya yaddaşı (kuki deyil)",
                _p("Skriptlər brauzerdə kiçik tərcih dəyərləri saxlaya bilər. Tipik açarlar:"),
                [
                    "birinci-lang — son dil seçimi;",
                    "birinci-home-view, birinci-category-view, birinci-inventions-view — siyahı və ya kart görünüşü;",
                    "birinci-images-collapsed, birinci-images-collapsed-default-v2, birinci-texts-collapsed — illüstrasiya və ya hekayə mətninin yığılması;",
                    "birinci-audio-rate, birinci-audio-volume, birinci-audio-muted — dinləmə tənzimləri;",
                    "sessionStorage açarları, məsələn birinci-lang-ctx və birinci-compare-* — dil və ya müqayisə görünüşü üçün qısamüddətli naviqasiya;",
                    "birinci-dev-story-edit — inkişaf bayrağı, ictimai funksiya deyil.",
                ],
            ),
            _sec(
                "host",
                "3. Hosting və digər kukilər",
                _p(
                    "Hostinger (və ya qarşısındakı məzmun çatdırma şəbəkəsi) saytı çatdırmaq, yükü bölüşdürmək və ya sui-istifadənin qarşısını almaq üçün kuki qoya bilər. Hər host kukisini burada sadalaya bilmərik, çünki onlar bu səhifələrdə yaradılmayıb.",
                    "Hesab və ya sessiya kukiləri yalnız istəyə bağlı hesab xidməti istehsal mühitində açıq olsa mövcud olardı. İctimai statik sayt bu interfeysi açmır.",
                ),
            ),
            _sec(
                "fonts",
                "4. Üçüncü tərəf sorğuları",
                _p(
                    "Əsas səhifələr şriftləri bu saytdan yükləyir. Bəzi müqayisə görünüşləri hələ fonts.googleapis.com sorğulayır. Həmin səhifələri açsanız, Google sorğunu görə bilər. Adi hikmət hekayələri Google Fonts yükləmir.",
                    "İctimai hekayə ana səhifəsində YouTube və ya başqa video pleyeri yoxdur. Kəşf və ixtiralar inkişaf bölməsidir və ictimai sayta daxil deyil; burada canlı kataloq kimi təsvir olunmur.",
                ),
            ),
            _sec(
                "control",
                "5. Necə idarə etməli",
                _p(
                    "Tərcihləri sıfırlamaq üçün brauzerdə "
                    + SITE_HOST
                    + " sayt məlumatını silin. Bütün yaddaşı bloklasanız, sayt dil və görünüş seçiminizi unuda bilər. İzləyici üçün razılıq platformasından istifadə etmədiyimizə görə bu səhifələrdə kuki tənzimləmə paneli yoxdur."
                ),
            ),
        ],
    )
    terms = _page(
        "İstifadə şərtləri",
        "Birİnci-nin ictimai səhifələrini oxumaq və istifadə etmək qaydaları.",
        "Birİnci hikmət hekayələri saytının istifadə şərtləri.",
        [
            "Sayt şəxsi oxu, öyrənmə və düşüncə üçündür.",
            "Hekayələr açıq internet mənbələrindən götürülüb; illüstrasiyalar süni intellektlə yaradılıb (saytda qeyd olunur).",
            "Kolleksiyanı icazəsiz avtomatik yığmayın, yenidən dərc etməyin və öz məhsulunuz kimi təqdim etməyin.",
        ],
        [
            _sec(
                "service",
                "1. Sayt",
                _p(
                    "Birİnci hikmət hekayələrinin statik çoxdilli saytını və məram səhifələrini dərc edir. İctimai sayta Kəşf və ixtiralar daxil deyil; hekayə audio faylları ictimai sayta daxil edilmir.",
                    "Səhifələr «olduğu kimi» verilir. Mətnlərə diqqət yetiririk, lakin tamlıq və ya xüsusi məqsədə uyğunluq təminatı vermirik.",
                ),
            ),
            _sec(
                "use",
                "2. Qəbul edilən istifadə",
                _p("Səhifələri oxuya və keçid paylaşa bilərsiniz. Aşağıdakılar olmaz:"),
                [
                    "hosta hücum etmək, onu həddən artıq yükləmək və ya yoxlamaq;",
                    "saytı dövlət, dini və ya akademik qurum kimi təqdim etmək;",
                    "xidməti zədələyən avtomatik yığım;",
                    "sonradan əlavə olunacaq formalarda qanunsuz məzmun yerləşdirmək.",
                ],
            ),
            _sec(
                "content",
                "3. Məzmun və mənbələr",
                _p(
                    "Hekayə səhifələrində qeyd olunur ki, hekayələr açıq internet mənbələrindəndir, illüstrasiyalar isə süni intellektlə yaradılıb. Onları hikmət ədəbiyyatı sayın, tibbi, hüquqi və ya maliyyə məsləhəti yox.",
                    "Hekayələrdəki əmtəə nişanları və üçüncü tərəf adları sahiblərinə məxsusdur.",
                ),
            ),
            _sec(
                "liability",
                "4. Məsuliyyət",
                _p(
                    "Qanunun icazə verdiyi həddə Birİnci saytdan istifadə, hosting fasiləsi və ya hekayəyə bel bağlamaqdan yaranan zərərə görə məsuliyyət daşımır. Qanunla məhdudlaşdırıla bilməyən məsuliyyət bu şərtlərlə azaldılmır."
                ),
            ),
            _sec(
                "law",
                "5. Tətbiq olunan hüquq",
                _p(
                    "Bu şərtlər Avstriya Respublikasının hüququna tabedir (kolliziya qaydaları və tətbiq oluna biləcəyi halda Malların beynəlxalq alqı-satqısına dair BMT Konvensiyası istisna olmaqla). Aİ hüququnun tələb etdiyi istehlakçı müdafiəsi qaydaları qüvvədə qalır.",
                    "Məcburi norma başqa cür demədikdə, mübahisələrə Avstriya məhkəmələri baxır. Qeydiyyat ünvanı dərc olunanda konkret məhkəmə yeri burada göstəriləcək.",
                ),
            ),
        ],
    )
    imprint = _page(
        "Hüquqi rekvizitlər (Impressum)",
        "Avstriya və Aİ hüququna görə tələb olunan imprint məlumatı (MedienG / ECG). Yalnız yoxlana bilən məlumatlar doldurulur.",
        "Birİnci imprint: Avstriyada qeydiyyat, təsdiqlənmiş ictimai əlaqə, dərc olunmamış qeydiyyat identifikatorları.",
        [
            "Birİnci Avstriyada qeydiyyatdan keçib.",
            "İctimai sayt: https://" + SITE_HOST + ".",
            "İctimai e-poçt: " + CONTACT_EMAIL + ".",
            "Firmenbuch nömrəsi, UID, küçə ünvanı, telefon və idarəedici adları hələ dərc olunmayıb. Bu səhifədə onlar uydurulmur.",
        ],
        [
            _sec(
                "identity",
                "1. Media sahibi / nəşriyyatçı (Medieninhaber)",
                _p(
                    "Sayt Birİnci adı ilə dərc olunur (bilik və mənəvi dəyərlər incisi).",
                    "Qeydiyyat ölkəsi: Avstriya. Səhifə Avstriya Media Qanunu (Mediengesetz — MedienG) və Elektron ticarət qanunu (ECG / § 5 ECG) üzrə məlumatlandırma vəzifələrinə, tətbiq olunduğu həddə, cavab vermək üçündür.",
                    "Hüquqi forma (məsələn GmbH, dərnək və ya fərdi sahibkar), Firmenbuch nömrəsi (FN), kommersiya məhkəməsi və UID (ATU…) hələ dərc olunmayıb. Bu məlumatlar mövcud olanda burada görünəcək.",
                ),
            ),
            _sec(
                "published",
                "2. Saytda yoxlana bilənlər",
                _p("Saytın aşağı hissəsində və yaxın elementlərdə görünənlər:"),
                [
                    "Sayt: https://" + SITE_HOST + ".",
                    "E-poçt: " + CONTACT_EMAIL + ".",
                    "Eyni ünvana işarə edən QR kod.",
                ],
            ),
            _sec(
                "missing",
                "3. Hələ əskik imprint sahələri",
                _p(
                    "Saytın aşağı hissəsində telefon və ünvan etiketləri var, real dəyər yoxdur (məsələn «Ünvan əlavə olunacaq»). Rəsmi qeydlər sayta əlavə olunana qədər aşağıdakıları uydurmuruz:"
                ),
                [
                    "qeydiyyat ünvanı (Anschrift / Sitz);",
                    "telefon;",
                    "Firmenbuch nömrəsi və qeydiyyat məhkəməsi;",
                    "UID / ƏDV identifikatoru;",
                    "idarəedici (Geschäftsführer) və ya dərnək rəhbərlərinin adları;",
                    "redaksiya məzmununa görə məsul şəxs (medienrechtlich Verantwortliche/r).",
                ],
            ),
            _sec(
                "hosting",
                "4. Hosting",
                _p(
                    "İctimai fayllar Hostinger-də saxlanmaq üçün nəzərdə tutulub. Hostinger hosting təminatçısıdır, media sahibi və ya mətnlərin müəllifi deyil."
                ),
            ),
            _sec(
                "dispute",
                "5. Mübahisələr / yurisdiksiya",
                _p(
                    "Nəşriyyatçı Avstriyada yerləşir. Aİ istehlakçıları tətbiq olunduğu halda Avropa Komissiyasının ODR platformasından (https://ec.europa.eu/consumers/odr/) istifadə edə bilər. Avstriya hüququ tələb etmədikcə istehlakçı arbitrajında iştirak etməyə borclu deyilik; belə iştirak burada bəyan edilmir.",
                    "Məcburi Aİ istehlakçı qaydaları başqa forum vermədikdə, mülki mübahisələr Avstriya məhkəmələrinə tabedir. Qeydiyyat ünvanı dərc olunanda konkret məhkəmə yeri əlavə olunacaq.",
                ),
            ),
        ],
    )
    feedback = _page(
        "Rəy",
        FEEDBACK_LEAD["az"],
        "Birİnci-yə şərh, təklif və sayt problemləri göndərin.",
        [],
        [],
        panel="Təklif, düzəliş və ya üzləşdiyiniz problemi bizə bildirin. Mesajlar "
        + CONTACT_EMAIL
        + " ünvanına gedir.",
        form={
            "name_label": "Ad",
            "email_label": "E-poçt ünvanı",
            "email_placeholder": "nümunə@email.com",
            "type_label": "Rəy növü",
            "subject_label": "Mövzu",
            "subject_hint": "(məsələn: sınmış keçid, açılmayan səhifə, imla düzəlişi və oxşar hallar)",
            "message_label": "Rəyiniz",
            "url_label": "Əlaqəli səhifənin ünvanı",
            "url_optional": "(istəyə bağlı)",
            "url_hint": "Səhifəyə aid rəy keçidindən gəldikdə bu sahə avtomatik doldurulur.",
            "url_placeholder": "https://birinci.cloud/az/…",
            "privacy_label": "Məxfilik bildirişini oxudum və bu mesajın orada təsvir olunduğu kimi istifadə olunacağını başa düşürəm",
            "privacy_link": "Məxfilik bildirişini",
            "section_title": "Rəyiniz",
            "section_sub": "Şərhlər, təkliflər və sayt problemləri",
            "intro": FEEDBACK_LEAD["az"],
            "required_note": "* ilə işarələnən sahələr məcburidir.",
            "submit": "Rəyi göndər",
            "file_label": "Ekran şəkli və ya əlavə",
            "file_hint": "JPG, PNG, WEBP, GIF və ya PDF. Ən çoxu 5 MB.",
            "file_choose": "Fayl seçin",
            "file_replace": "Əvəz et",
            "file_remove": "Sil",
            "file_ready": "Göndərməyə hazırdır",
            "honeypot_label": "Veb-sayt",
            "success_title": "Təşəkkür edirik. Rəyiniz göndərildi.",
            "success_body": "Hər mesajı oxuyuruq və saytı yaxşılaşdırmaq üçün ondan istifadə edirik.",
            "success_home": "Ana səhifəyə qayıt",
        },
    )
    return {
        "privacy-notice": privacy,
        "cookie-policy": cookies,
        "terms-of-use": terms,
        "legal-notice": imprint,
        "feedback": feedback,
    }


def pages_ru():
    privacy = _page(
        "Уведомление о конфиденциальности",
        "Как Birİnci использует сведения на этом общедоступном сайте.",
        "Уведомление о конфиденциальности сайта Birİnci: как хранятся настройки, чего мы не собираем и как с нами связаться.",
        [
            "Общедоступный сайт — статическое многоязычное собрание историй мудрости. На наших страницах нет рекламных или аналитических cookie.",
            "Мы не продаём персональные данные.",
            "Для чтения сайта аккаунт не нужен.",
            "Единственный контактный адрес, опубликованный на сайте, — " + CONTACT_EMAIL + ".",
            "Birİnci зарегистрирован в Австрии. Это уведомление основано на GDPR и австрийском Законе о защите данных (DSG).",
            "Почтовый адрес, телефон, номер Firmenbuch, UID/НДС, имена руководителей и назначенный сотрудник по защите данных ещё не опубликованы. Эти сведения появятся здесь, когда будут доступны.",
        ],
        [
            _sec(
                "controller",
                "1. Контроллер (ст. 4(7) GDPR)",
                _p(
                    "Birİnci — очаг знаний, зарегистрированный в Австрии. Истории мудрости публикуются на https://"
                    + SITE_HOST
                    + ". Это уведомление относится к общедоступному сайту в том виде, в каком он размещён для читателей. Неопубликованные функции разработки здесь не описываются.",
                    "Контроллер учреждён в Австрии и обрабатывает персональные данные в соответствии с Регламентом (ЕС) 2016/679 (GDPR) и австрийским Законом о защите данных (Datenschutzgesetz — DSG).",
                    "Правовая форма, номер Firmenbuch (FN), UID/НДС, адрес регистрации и имя сотрудника по защите данных (Datenschutzbeauftragte/r) ещё не опубликованы. Эти сведения появятся здесь, когда будут доступны. До тех пор пишите на "
                    + CONTACT_EMAIL
                    + ".",
                ),
            ),
            _sec(
                "what",
                "2. Какие сведения могут появляться",
                _p("В зависимости от того, как вы пользуетесь сайтом, могут появляться:"),
                [
                    "Просмотр: страницы — статический HTML. В наших скриптах нет Google Analytics, gtag, Plausible и Meta/Facebook Pixel.",
                    "Настройки на вашем устройстве: язык, вид списка или карточек, свёрнутость иллюстраций и текста, скорость, громкость и отключение звука для кнопок прослушивания. Они хранятся в localStorage и иногда в sessionStorage — это не установленные нами трекинговые cookie.",
                    "Письмо, которое вы сами отправляете: если вы пишете на "
                    + CONTACT_EMAIL
                    + " (в том числе со страницы обратной связи), мы получаем то, что вы включили в сообщение.",
                    "Хостинг: сайт обслуживается Hostinger. Хостер может вести технические журналы (например IP-адрес, тип браузера и запрошенный адрес). Отдельного аналитического продукта на опубликованных страницах нет.",
                    "Аккаунты: вход и страницы учётной записи на общедоступном сайте недоступны. Не предполагайте, что там есть аккаунты, сессионные cookie или профили комментариев.",
                    "Речь и аудио: в некоторых языках можно использовать речевые возможности браузера. Аудиофайлы историй на общедоступный сайт не входят. Элементы управления прослушиванием могут отсутствовать или использовать функции браузера.",
                    "Страницы сравнения могут загружать Google Fonts с серверов Google. Обычные страницы историй и главная используют шрифты, хранящиеся на сайте.",
                ],
            ),
            _sec(
                "why",
                "3. Цели и правовые основания (ст. 6 GDPR)",
                _p(
                    "Мы обрабатываем персональные данные только в той мере, в какой это нужно для общедоступного сайта. Типичные основания:"
                ),
                [
                    "ст. 6(1)(f) GDPR (законный интерес): показ статического сайта, его безопасность, запоминание вида и языка на вашем устройстве, ответы на письма, которые вы нам направляете;",
                    "ст. 6(1)(b) GDPR: только если позже будет заключён договор (чтение сайта договором не является);",
                    "ст. 6(1)(c) GDPR: если австрийское право или право ЕС обязывает нас хранить или раскрывать сведения;",
                    "ст. 6(1)(a) GDPR: согласие — только если позже появятся необязательные средства аналитики; на общедоступном сайте их нет.",
                ],
            ),
            _sec(
                "share",
                "4. Кому это может быть видно",
                _p(
                    "Мы не продаём персональные данные. Hostinger обрабатывает данные хостинга как веб-хостер. Письма обрабатывают почтовые системы, стоящие за "
                    + CONTACT_EMAIL
                    + ". Сторонние рекламные сети не встраиваются. Исходящие ссылки (например на страницы энциклопедий) — обычные ссылки; переход по ним выводит вас с этого сайта."
                ),
            ),
            _sec(
                "retention",
                "5. Срок хранения",
                _p(
                    "Настройки остаются в браузере, пока вы не очистите данные сайта. Письма хранятся столько, сколько нужно для ответа и обычной переписки. Журналы хостинга подчиняются правилам хостера. Отдельный корпоративный график сроков хранения не опубликован."
                ),
            ),
            _sec(
                "rights",
                "6. Ваши права (ст. 15–21 GDPR)",
                _p(
                    "Вы можете запросить доступ, исправление, удаление, ограничение и переносимость данных, а также возразить против обработки на основании законного интереса. На этом статическом сайте персональные данные, которые у нас реально есть, — это в основном письма, которые вы нам отправили, и то, что хостер хранит в журналах сервера. Пишите на "
                    + CONTACT_EMAIL
                    + ". Имя сотрудника по защите данных не опубликовано.",
                    "Жалобу можно подать в австрийский орган по защите данных (Österreichische Datenschutzbehörde), Barichgasse 40-42, 1030 Вена, Австрия, https://www.dsb.gv.at/. Если вы живёте в другой стране ЕС или ЕЭЗ, можете также обратиться в свой надзорный орган.",
                ),
            ),
            _sec(
                "children",
                "7. Дети",
                _p(
                    "Сайт предназначен для познавательного чтения. Мы сознательно не ведём регистрацию и профилирование, нацеленные на детей. Не присылайте персональные данные ребёнка, если вы не его родитель или опекун либо вам не нужно с нами связаться."
                ),
            ),
            _sec(
                "security",
                "8. Безопасность",
                _p(
                    "Общедоступный сайт отдаётся по HTTPS. Ни один способ передачи не является абсолютно безопасным. Не отправляйте пароли и документы, удостоверяющие личность, на адрес обратной связи, если мы специально не попросили об этом по проверенному каналу."
                ),
            ),
            _sec(
                "changes",
                "9. Изменения",
                _p(
                    "Если сайт начнёт использовать аналитику, аккаунты или новых обработчиков, это уведомление будет обновлено."
                ),
            ),
            _sec(
                "contact",
                "10. Контакты",
                _p(
                    "Эл. почта: " + CONTACT_EMAIL + ".",
                    "Сайт: https://" + SITE_HOST + ".",
                    "Телефон, почтовый адрес, идентификаторы юридического лица и назначенный контакт по вопросам конфиденциальности будут опубликованы здесь, когда появятся. В подвале сайта эти поля пока не заполнены реальными значениями.",
                ),
            ),
        ],
    )
    cookies = _page(
        "Политика cookie",
        "Что этот сайт сохраняет в браузере — и чего не сохраняет.",
        "Практика cookie и локального хранилища на общедоступном сайте Birİnci.",
        [
            "Общедоступные страницы не устанавливают рекламные или аналитические cookie.",
            "Баннера cookie нет: трекеры, требующие согласия, не подключаются.",
            "Настройки вида хранятся в localStorage на вашем устройстве.",
            "Хостер всё же может ставить строго технические cookie. Они не задаются кодом наших страниц.",
        ],
        [
            _sec(
                "none-analytics",
                "1. Какие cookie мы не ставим",
                _p(
                    "На общедоступных страницах нет Google Analytics, gtag, Google Tag Manager, Plausible и Facebook Pixel. Мы не ставим cookie для измерения аудитории на статическом сайте."
                ),
            ),
            _sec(
                "storage",
                "2. Local и session storage (не cookie)",
                _p(
                    "Скрипты могут хранить небольшие значения настроек в браузере. Типичные ключи:"
                ),
                [
                    "birinci-lang — последний выбор языка;",
                    "birinci-home-view, birinci-category-view, birinci-inventions-view — список или карточки;",
                    "birinci-images-collapsed, birinci-images-collapsed-default-v2, birinci-texts-collapsed — свёрнутость иллюстраций или текста;",
                    "birinci-audio-rate, birinci-audio-volume, birinci-audio-muted — настройки прослушивания;",
                    "ключи sessionStorage, например birinci-lang-ctx и birinci-compare-* — краткий контекст навигации для языка или сравнения;",
                    "birinci-dev-story-edit — флаг разработки, не общедоступная функция.",
                ],
            ),
            _sec(
                "host",
                "3. Cookie хостинга и прочие",
                _p(
                    "Hostinger (или сеть доставки контента перед ним) может ставить cookie, нужные для выдачи сайта, распределения нагрузки или защиты от злоупотреблений. Мы не можем перечислить все cookie хостера, потому что они не создаются этими страницами.",
                    "Cookie аккаунта или сессии появились бы только если необязательная служба учётных записей была включена в производственной среде. Общедоступный статический сайт этот интерфейс не включает.",
                ),
            ),
            _sec(
                "fonts",
                "4. Сторонние запросы",
                _p(
                    "Основные страницы загружают шрифты с этого сайта. Некоторые виды сравнения по-прежнему запрашивают fonts.googleapis.com. Если вы откроете эти страницы, Google может увидеть запрос. Обычные страницы историй мудрости Google Fonts не загружают.",
                    "YouTube и другие видеохостинги не встроены на общедоступную главную историй. Раздел «Открытия и изобретения» — раздел разработки и не входит в общедоступный сайт; здесь он не описывается как живой каталог.",
                ),
            ),
            _sec(
                "control",
                "5. Как управлять хранением",
                _p(
                    "Чтобы сбросить настройки, очистите в браузере данные сайта "
                    + SITE_HOST
                    + ". Если заблокировать всё хранилище, сайт может забыть язык и вид страниц. Отдельной панели согласия нет, потому что платформы согласия на трекеры мы не используем."
                ),
            ),
        ],
    )
    terms = _page(
        "Условия использования",
        "Условия чтения и использования общедоступных страниц Birİnci.",
        "Условия использования сайта историй мудрости Birİnci.",
        [
            "Сайт предназначен для личного чтения, обучения и размышления.",
            "Истории собраны из открытых интернет-источников; иллюстрации созданы искусственным интеллектом, как указано на сайте.",
            "Не выгружайте сайт автоматически, не переиздавайте собрание и не выдавайте его за свой продукт без разрешения.",
        ],
        [
            _sec(
                "service",
                "1. Сайт",
                _p(
                    "Birİnci публикует статический многоязычный сайт историй мудрости и страницы о нашей миссии. Общедоступный сайт не включает раздел «Открытия и изобретения»; аудиофайлы историй в общедоступный сайт не входят.",
                    "Страницы предоставляются «как есть». Мы стремимся к аккуратным и обоснованным текстам, но не гарантируем полноту и пригодность для конкретной цели.",
                ),
            ),
            _sec(
                "use",
                "2. Допустимое использование",
                _p("Можно просматривать, читать и делиться ссылками на общедоступные страницы. Нельзя:"),
                [
                    "атаковать, перегружать или сканировать хост;",
                    "выдавать сайт за государственный, религиозный или академический орган;",
                    "использовать автоматический сбор данных во вред службе;",
                    "размещать незаконные материалы в любых формах, которые мы позже добавим.",
                ],
            ),
            _sec(
                "content",
                "3. Содержание и источники",
                _p(
                    "На страницах историй указано, что тексты взяты из открытых интернет-источников, а иллюстрации созданы искусственным интеллектом. Считайте повествования литературой мудрости, а не профессиональным советом — медицинским, юридическим или финансовым.",
                    "Товарные знаки и чужие имена, встречающиеся в историях, остаются за их правообладателями."
                ),
            ),
            _sec(
                "liability",
                "4. Ответственность",
                _p(
                    "В пределах, допускаемых законом, Birİnci не несёт ответственности за убытки от использования сайта, перерывов хостинга или опоры на историю. Ничто в этих условиях не ограничивает ответственность, которую закон ограничить не позволяет."
                ),
            ),
            _sec(
                "law",
                "5. Применимое право",
                _p(
                    "Эти условия регулируются правом Австрийской Республики, без коллизионных норм и без Конвенции ООН о договорах международной купли-продажи товаров, насколько она могла бы применяться. Обязательные нормы защиты потребителей страны вашего проживания сохраняются, если того требует право ЕС.",
                    "Если иное не следует из императивного права, споры рассматривают суды Австрии. Конкретное место суда будет указано здесь, когда будет опубликован адрес регистрации.",
                ),
            ),
        ],
    )
    imprint = _page(
        "Юридическое уведомление (Impressum)",
        "Сведения imprint по австрийскому и европейскому праву (MedienG / ECG). Заполнены только проверяемые поля.",
        "Импринт Birİnci: регистрация в Австрии, проверенные общедоступные контакты, неопубликованные регистрационные идентификаторы.",
        [
            "Birİnci зарегистрирован в Австрии.",
            "Общедоступный сайт: https://" + SITE_HOST + ".",
            "Общедоступная почта: " + CONTACT_EMAIL + ".",
            "Номер Firmenbuch, UID, почтовый адрес, телефон и имена руководителей ещё не опубликованы. Эта страница их не выдумывает.",
        ],
        [
            _sec(
                "identity",
                "1. Медиавладелец / издатель (Medieninhaber)",
                _p(
                    "Сайт издаётся под именем Birİnci (жемчужина знания и нравственных ценностей).",
                    "Страна регистрации: Австрия. Страница рассчитана на обязанности по информированию по австрийскому Закону о СМИ (Mediengesetz — MedienG) и Закону об электронной коммерции (ECG / § 5 ECG), насколько они применимы к этому онлайн-предложению.",
                    "Правовая форма (например GmbH, объединение или индивидуальный предприниматель), номер Firmenbuch (FN), коммерческий суд и UID (ATU…) ещё не опубликованы. Эти сведения появятся здесь, когда будут доступны.",
                ),
            ),
            _sec(
                "published",
                "2. Что уже можно проверить на сайте",
                _p("В подвале сайта и рядом с ним указано:"),
                [
                    "Сайт: https://" + SITE_HOST + ".",
                    "Эл. почта: " + CONTACT_EMAIL + ".",
                    "QR-код, указывающий на тот же общедоступный адрес.",
                ],
            ),
            _sec(
                "missing",
                "3. Обязательные поля imprint, которых ещё нет",
                _p(
                    "В подвале сайта сейчас есть подписи «телефон» и «адрес» без реальных значений (заполнители вроде «Адрес будет добавлен»). Пока официальные сведения не внесены на сайт, мы не выдумываем:"
                ),
                [
                    "зарегистрированный адрес (Anschrift / Sitz);",
                    "номер телефона;",
                    "номер Firmenbuch и суд регистрации;",
                    "идентификационный номер UID / НДС;",
                    "имена управляющих (Geschäftsführer) или должностных лиц объединения;",
                    "лицо, ответственное за редакционное содержание (medienrechtlich Verantwortliche/r).",
                ],
            ),
            _sec(
                "hosting",
                "4. Хостинг",
                _p(
                    "Общедоступные файлы предназначены для размещения у Hostinger. Hostinger — хостинг-провайдер, а не медиавладелец и не автор текстов."
                ),
            ),
            _sec(
                "dispute",
                "5. Разрешение споров / юрисдикция",
                _p(
                    "Издатель учреждён в Австрии. Потребители ЕС могут использовать платформу ODR Европейской комиссии (https://ec.europa.eu/consumers/odr/), где эта процедура применима. Мы не обязаны участвовать в потребительском арбитраже, если австрийское право этого не требует; такое участие здесь не заявлено.",
                    "Гражданско-правовые споры подлежат судам Австрии, если императивные нормы ЕС о защите потребителей не дают вам иной форум. Конкретная подсудность будет добавлена, когда будет опубликован адрес регистрации.",
                ),
            ),
        ],
    )
    feedback = _page(
        "Обратная связь",
        FEEDBACK_LEAD["ru"],
        "Отправьте Birİnci комментарии, предложения и сообщения о проблемах сайта.",
        [],
        [],
        panel="Напишите предложение, исправление или проблему, с которой вы столкнулись. Сообщения приходят на "
        + CONTACT_EMAIL
        + ".",
        form={
            "name_label": "Имя",
            "email_label": "Адрес электронной почты",
            "email_placeholder": "example@email.com",
            "type_label": "Тип отзыва",
            "subject_label": "Тема",
            "subject_hint": "(например: неработающая ссылка, страница не открывается, исправление опечатки и похожие случаи)",
            "message_label": "Ваш отзыв",
            "url_label": "Адрес связанной страницы",
            "url_optional": "(необязательно)",
            "url_hint": "Это поле заполняется автоматически, если вы пришли по ссылке обратной связи со страницы.",
            "url_placeholder": "https://birinci.cloud/ru/…",
            "privacy_label": "Я прочитал(а) уведомление о конфиденциальности и понимаю, что это сообщение будет использовано как там описано",
            "privacy_link": "уведомление о конфиденциальности",
            "section_title": "Ваш отзыв",
            "section_sub": "Замечания, предложения и проблемы сайта",
            "intro": FEEDBACK_LEAD["ru"],
            "required_note": "Поля, отмеченные *, обязательны.",
            "submit": "Отправить отзыв",
            "file_label": "Снимок экрана или вложение",
            "file_hint": "JPG, PNG, WEBP, GIF или PDF. Не больше 5 МБ.",
            "file_choose": "Выбрать файл",
            "file_replace": "Заменить",
            "file_remove": "Удалить",
            "file_ready": "Готово к отправке",
            "honeypot_label": "Веб-сайт",
            "success_title": "Спасибо. Ваш отзыв отправлен.",
            "success_body": "Мы читаем каждое сообщение и используем его, чтобы улучшить сайт.",
            "success_home": "На главную",
        },
    )
    return {
        "privacy-notice": privacy,
        "cookie-policy": cookies,
        "terms-of-use": terms,
        "legal-notice": imprint,
        "feedback": feedback,
    }


def pages_ky():
    privacy = _page(
        "Купуялык билдирүүсү",
        "Birİnci бул коомдук сайтта маалыматты кантип колдонот.",
        "Birİnci сайтынын купуялык билдирүүсү: жөндөөлөр кантип сакталат, эмне чогултулбайт жана кантип байланышуу керек.",
        [
            "Коомдук сайт — статикалык, көп тилдүү акылмандык окуялар жыйнагы. Барактарыбызда жарнама же аналитика cookie койбойбуз.",
            "Жеке маалыматты сатпайбыз.",
            "Сайтты окуу үчүн аккаунт керек эмес.",
            "Сайтта жарыяланган жалгыз байланыш дареги — " + CONTACT_EMAIL + ".",
            "Birİnci Австрияда катталган. Бул билдирүү GDPR жана Австриянын Маалыматтарды коргоо мыйзамына (DSG) негизделген.",
            "Көчө дареги, телефон, Firmenbuch номери, UID/КНС, жетекчилердин аттары жана аталган маалымат коргоо кызматкери азырынча жарыялана элек. Бул маалыматтар болгондо бул жерде көрсөтүлөт.",
        ],
        [
            _sec(
                "controller",
                "1. Маалымат контроллери (GDPR 4(7)-берене)",
                _p(
                    "Birİnci Австрияда катталган билим очогу. Акылмандык окуялар https://"
                    + SITE_HOST
                    + " дарегинде жарыяланат. Бул билдирүү окурмандар үчүн жайгаштырылган коомдук сайтты камтыйт; жарыялана элек иштеп чыгуу мүмкүнчүлүктөрүн сүрөттөбөйт.",
                    "Контроллер Австрияда жайгашкан жана жеке маалыматты (ЕБ) 2016/679 Регламенти (GDPR) жана Австриянын Маалыматтарды коргоо мыйзамы (Datenschutzgesetz — DSG) боюнча иштетет.",
                    "Юридикалык форма, Firmenbuch номери (FN), UID/КНС, каттоо дареги жана аталган Datenschutzbeauftragte/r азырынча жарыялана элек. Бул маалыматтар болгондо бул жерде көрүнөт. Азырынча "
                    + CONTACT_EMAIL
                    + " дарегине жазыңыз.",
                ),
            ),
            _sec(
                "what",
                "2. Кандай маалымат пайда болушу мүмкүн",
                _p("Сайтты кантип колдонгонуңузга жараша төмөнкүлөр пайда болушу мүмкүн:"),
                [
                    "Карап чыгуу: барактар статикалык HTML. Скрипттерибизде Google Analytics, gtag, Plausible же Meta/Facebook Pixel жок.",
                    "Түзмөгүңүздөгү жөндөөлөр: тил, тизме же карта көрүнүшү, сүрөттөрдүн же тексттин жыйылышы, угуу ылдамдыгы, үн жана үнсүздөө. Алар localStorage жана кээде sessionStorage аркылуу сакталат — биз койгон көзөмөлдөө cookie эмес.",
                    "Сиз жөнөткөн кат: "
                    + CONTACT_EMAIL
                    + " дарегине (анын ичинде Пикир барагынан) жазсаңыз, каттагы маалымат бизге жетет.",
                    "Хостинг: сайтты Hostinger тейлейт. Хост техникалык журналдарга (мисалы IP дарек, браузер түрү жана суралган дарек) ээ болушу мүмкүн. Жарыяланган барактарда өзүнчө аналитика продуктусу жок.",
                    "Аккаунттар: коомдук сайтта кирүү жана аккаунт барактары жок. Ал жерде аккаунт, сессия cookie же комментарий профили бар деп ойлобоңуз.",
                    "Сүйлөө жана аудио: кээ бир тилдер браузердин сүйлөө мүмкүнчүлүгүн колдоно алат. Окуя аудио файлдары коомдук сайтка кирбейт. Угуу башкаруусу жок болушу же браузердин өз функциясына өтүшү мүмкүн.",
                    "Салыштыруу барактары Google’дун серверлеринен Google Fonts жүктөшү мүмкүн. Кадимки окуя жана башкы барактар сайтта сакталган шрифттерди колдонот.",
                ],
            ),
            _sec(
                "why",
                "3. Максат жана укуктук негиз (GDPR 6-берене)",
                _p(
                    "Жеке маалыматты коомдук сайт үчүн керек болгон чекте гана иштетебиз. Типтүү укуктук негиздер:"
                ),
                [
                    "GDPR 6(1)(f)-берене (мыйзамдуу кызыкчылык): статикалык сайтты көрсөтүү, аны коопсуз кармоо, түзмөгүңүздө көрүнүш менен тилди эстеп калуу, сиз жөнөткөн каттарга жооп берүү;",
                    "GDPR 6(1)(b)-берене: кийинчерээк келишим түзүлсө гана (сайтты окуу келишим эмес);",
                    "GDPR 6(1)(c)-берене: Австрия же ЕБ мыйзамы сактоону же ачыкка чыгарууну талап кылса;",
                    "GDPR 6(1)(a)-берене: макулдук — кийинчерээк аналитика сыяктуу куралдар кошулса; коомдук сайтта алар жок.",
                ],
            ),
            _sec(
                "share",
                "4. Ким көрүшү мүмкүн",
                _p(
                    "Жеке маалыматты сатпайбыз. Hostinger хост катары хостинг маалыматын иштетет. Сиз жөнөткөн каттарды "
                    + CONTACT_EMAIL
                    + " артындагы почта системалары иштетет. Үчүнчү тарап жарнама тармактары орнотулган эмес. Сырткы шилтемелер (мисалы энциклопедия барактары) кадимки шилтемелер; аларга өтүү бул сайттан чыгуу болуп саналат."
                ),
            ),
            _sec(
                "retention",
                "5. Сактоо мөөнөтү",
                _p(
                    "Жөндөөлөр сайт маалыматын тазалаганга чейин браузериңизде калат. Каттар жооп жана кадимки кат алышуу үчүн керек болгончо гана сакталат. Хостинг журналдары хосттун сактоо эрежелерине баш ийет. Өзүнчө компания архивинин графиги жарыялана элек."
                ),
            ),
            _sec(
                "rights",
                "6. Укуктарыңыз (GDPR 15–21-беренелер)",
                _p(
                    "Кирүү, оңдоо, өчүрүү, чектөө жана маалыматты көчүрүүнү сурашыңыз мүмкүн, ошондой эле мыйзамдуу кызыкчылыкка негизделген иштетүүгө каршы чыга аласыз. Бул статикалык сайтта бизде чындыгында бар жеке маалымат негизинен сиз жөнөткөн каттар жана хост сервер журналдарында сактаган нерсе. "
                    + CONTACT_EMAIL
                    + " дарегине жазыңыз. Аталган маалымат коргоо кызматкери жарыялана элек.",
                    "Арызды Австриянын маалымат коргоо органына (Österreichische Datenschutzbehörde), Barichgasse 40-42, 1030 Вена, Австрия, https://www.dsb.gv.at/ дарегине бере аласыз. ЕБ же ЕЭАнын башка өлкөсүндө жашасаңыз, жергиликтүү көзөмөл органына да кайрылсаңыз болот.",
                ),
            ),
            _sec(
                "children",
                "7. Балдар",
                _p(
                    "Сайт таалим берүүчү окууну сунуштайт. Балдарга багытталган каттоо же профилдөөнү атайылап жүргүзбөйбүз. Баланын ата-энеси же камкорчусу болбосоңуз, же биз менен байланышуу зарыл болбосо, бала жөнүндө жеке маалымат жөнөтпөңүз."
                ),
            ),
            _sec(
                "security",
                "8. Коопсуздук",
                _p(
                    "Коомдук сайт HTTPS аркылуу берилет. Эч бир өткөрүү ыкмасы толук коопсуз эмес. Текшерилген канал аркылуу атайын сурабасак, сырсөздү же инсандык документтерди пикир дарегине жөнөтпөңүз."
                ),
            ),
            _sec(
                "changes",
                "9. Өзгөртүүлөр",
                _p(
                    "Сайт аналитика, аккаунттар же жаңы иштетүүчүлөрдү колдоно баштаса, бул билдирүү жаңыртылат."
                ),
            ),
            _sec(
                "contact",
                "10. Байланыш",
                _p(
                    "Электрондук почта: " + CONTACT_EMAIL + ".",
                    "Сайт: https://" + SITE_HOST + ".",
                    "Телефон, почта дареги, юридикалык жактын идентификаторлору жана аталган купуялык байланышы болгондо бул жерде жарыяланат. Сайттын төмөнкү бөлүгүндө бул талаалар азырынча чыныгы маани менен толтурула элек.",
                ),
            ),
        ],
    )
    cookies = _page(
        "Cookie саясаты",
        "Бул сайт браузериңизде эмнени сактайт — жана эмнени сактабайт.",
        "Коомдук Birİnci сайтындагы cookie жана локалдык сактоо тажрыйбасы.",
        [
            "Коомдук барактар жарнама же аналитика cookie койбойт.",
            "Макулдук талап кылган трекерлер жүктөлбөгөндүктөн cookie баннери жок.",
            "Көрүнүш жөндөөлөрү түзмөгүңүздөгү localStorage аркылуу сакталат.",
            "Хост дагы эле техникалык cookie коюшу мүмкүн. Алар биздин барак кодунда аныкталган эмес.",
        ],
        [
            _sec(
                "none-analytics",
                "1. Биз койбогон cookie файлдары",
                _p(
                    "Коомдук барактарда Google Analytics, gtag, Google Tag Manager, Plausible же Facebook Pixel жок. Статикалык сайтта аудиторияны өлчөө үчүн cookie койбойбуз."
                ),
            ),
            _sec(
                "storage",
                "2. Local жана session storage (cookie эмес)",
                _p(
                    "Скрипттер браузерде кичинекей жөндөө маанилерин сакташы мүмкүн. Типтүү ачкычтар:"
                ),
                [
                    "birinci-lang — акыркы тил тандоосу;",
                    "birinci-home-view, birinci-category-view, birinci-inventions-view — тизме же карта көрүнүшү;",
                    "birinci-images-collapsed, birinci-images-collapsed-default-v2, birinci-texts-collapsed — сүрөттөрдүн же окуя текстинин жыйылышы;",
                    "birinci-audio-rate, birinci-audio-volume, birinci-audio-muted — угуу жөндөөлөрү;",
                    "sessionStorage ачкычтары, мисалы birinci-lang-ctx жана birinci-compare-* — тил же салыштыруу көрүнүшү үчүн кыска мөөнөттүү навигация;",
                    "birinci-dev-story-edit — иштеп чыгуу белгиси, коомдук мүмкүнчүлүк эмес.",
                ],
            ),
            _sec(
                "host",
                "3. Хостинг жана башка cookie’лер",
                _p(
                    "Hostinger (же анын алдындагы контент жеткирүү тармагы) сайтты берүү, жүктү бөлүштүрүү же кыянаттыктан коргоо үчүн cookie коюшу мүмкүн. Хосттун бардык cookie файлдарын бул жерде тизмелей албайбыз, анткени алар бул барактарда түзүлгөн эмес.",
                    "Аккаунт же сессия cookie файлдары кошумча аккаунт кызматы өндүрүштө күйгүзүлсө гана пайда болмок. Коомдук статикалык сайт бул интерфейсти күйгүзбөйт.",
                ),
            ),
            _sec(
                "fonts",
                "4. Үчүнчү тарап сурамдары",
                _p(
                    "Негизги барактар шрифттерди ушул сайттан жүктөйт. Кээ бир салыштыруу көрүнүштөрү дагы эле fonts.googleapis.com сурайт. Ошол барактарды ачсаңыз, Google сурамды көрүшү мүмкүн. Кадимки акылмандык окуя барактары Google Fonts жүктөбөйт.",
                    "YouTube жана башка видео хосттор коомдук окуя башкы бетинде орнотулган эмес. «Ачылыштар жана ойлоп табуулар» — иштеп чыгуу бөлүмү жана коомдук сайтка кирбейт; бул жерде жандуу каталог катары сүрөттөлбөйт.",
                ),
            ),
            _sec(
                "control",
                "5. Сактоону кантип башкаруу",
                _p(
                    "Жөндөөлөрдү кайра коюу үчүн браузерде "
                    + SITE_HOST
                    + " үчүн сайт маалыматын тазалаңыз. Бардык сактоону бөгөттөсөңүз, сайт тил жана көрүнүш тандоолорун унутушу мүмкүн. Трекерге макулдук платформабыз жок болгондуктан бул барактарда cookie башкаруу панели жок."
                ),
            ),
        ],
    )
    terms = _page(
        "Колдонуу шарттары",
        "Birİnciнин коомдук барактарын окуу жана колдонуу шарттары.",
        "Birİnci акылмандык окуялар сайтынын колдонуу шарттары.",
        [
            "Сайт жеке окуу, үйрөнүү жана ой жүгүртүү үчүн.",
            "Окуялар ачык интернет булактарынан алынган; сүрөттөр жасалма интеллект менен жасалган, сайтта көрсөтүлгөндөй.",
            "Жыйнакты уруксатсыз автоматтык түрдө жыйнабаңыз, кайра жарыялабаңыз жана өз өнүмүңүз кылып көрсөтпөңүз.",
        ],
        [
            _sec(
                "service",
                "1. Сайт",
                _p(
                    "Birİnci акылмандык окуялардын статикалык көп тилдүү сайтын жана миссия барактарын жарыялайт. Коомдук сайтка «Ачылыштар жана ойлоп табуулар» кирбейт; окуя аудио файлдары коомдук сайтка кирбейт.",
                    "Барактар азыркы абалында берилет. Тексттерге кылдат мамиле кылабыз, бирок толуктукка же белгилүү бир максатка ылайыктуулукка кепилдик бербейбиз.",
                ),
            ),
            _sec(
                "use",
                "2. Жол берилген колдонуу",
                _p("Коомдук барактарды карап, окуп, шилтеме бөлүшсөңүз болот. Төмөнкүлөргө болбойт:"),
                [
                    "хостту чабуулга алуу, ашыкча жүктөө же текшерүү;",
                    "сайтты мамлекеттик, диний же академиялык мекеме катары көрсөтүү;",
                    "кызматка зыян келтирген автоматтык жыйноо;",
                    "кийинчерээк кошкон формаларда мыйзамсыз материал жайгаштыруу.",
                ],
            ),
            _sec(
                "content",
                "3. Мазмун жана булактар",
                _p(
                    "Окуя барактарында окуялар ачык интернет булактарынан алынганы жана сүрөттөр жасалма интеллект менен жасалганы айтылат. Баяндарды акылмандык адабияты катары кабыл алыңыз, медициналык, юридикалык же финансылык кеңеш катары эмес.",
                    "Окуялардагы товардык белгилер жана үчүнчү жактын аттары ээлеринде калат."
                ),
            ),
            _sec(
                "liability",
                "4. Жоопкерчилик",
                _p(
                    "Мыйзам уруксат берген чекте Birİnci сайтты колдонуудан, хостинг үзгүлтүктөрүнөн же окуяга таянуудан келип чыккан чыгым үчүн жооп бербейт. Бул шарттар мыйзам чектебеген жоопкерчиликти чектебейт."
                ),
            ),
            _sec(
                "law",
                "5. Колдонулуучу укук",
                _p(
                    "Бул шарттар Австрия Республикасынын укугуна баш ийет, коллизия эрежелери жана Эл аралык товар сатуу келишимдери жөнүндө БУУ конвенциясы (колдонула турган болсо) эске алынбайт. ЕБ укугу талап кылса, жашаган өлкөңүздүн милдеттүү керектөөчү коргоо эрежелери күчүндө калат.",
                    "Милдеттүү норма башкача дебесе, талаш-тартыштарды Австрия соттору карай. Каттоо дареги жарыяланганда конкреттүү сот жери бул жерде көрсөтүлөт.",
                ),
            ),
        ],
    )
    imprint = _page(
        "Юридикалык билдирүү (Impressum)",
        "Австрия жана ЕБ укугу боюнча талап кылынган imprint маалыматы (MedienG / ECG). Текшерилген талаалар гана толтурулат.",
        "Birİnci импринти: Австрияда каттоо, текшерилген коомдук байланыш, жарыялана элек каттоо идентификаторлору.",
        [
            "Birİnci Австрияда катталган.",
            "Коомдук сайт: https://" + SITE_HOST + ".",
            "Коомдук почта: " + CONTACT_EMAIL + ".",
            "Firmenbuch номери, UID, көчө дареги, телефон жана жетекчилердин аттары азырынча жарыялана элек. Бул барак аларды ойлоп таппайт.",
        ],
        [
            _sec(
                "identity",
                "1. Медиа ээси / жарыялоочу (Medieninhaber)",
                _p(
                    "Сайт Birİnci аты менен чыгат (билим жана адеп-ахлак баалуулуктарынын бермети).",
                    "Каттоо өлкөсү: Австрия. Бул барак Австриянын Медиа мыйзамы (Mediengesetz — MedienG) жана Электрондук коммерция мыйзамы (ECG / § 5 ECG) боюнча маалымат милдеттерине, колдонулган чекке чейин, жооп берүү үчүн даярдалган.",
                    "Юридикалык форма (мисалы GmbH, бирикме же жеке ишкер), Firmenbuch номери (FN), коммерциялык сот жана UID (ATU…) азырынча жарыялана элек. Бул маалыматтар болгондо бул жерде көрүнөт.",
                ),
            ),
            _sec(
                "published",
                "2. Сайттан текшерилүүчү маалымат",
                _p("Сайттын төмөнкү бөлүгүндө жана жакын элементтерде көрүнгөндөр:"),
                [
                    "Сайт: https://" + SITE_HOST + ".",
                    "Электрондук почта: " + CONTACT_EMAIL + ".",
                    "Ошол эле коомдук дарекке багытталган QR код.",
                ],
            ),
            _sec(
                "missing",
                "3. Азырынча жок милдеттүү imprint талаалары",
                _p(
                    "Сайттын төмөнкү бөлүгүндө телефон жана дарек энбелгилери бар, чыныгы маани жок (мисалы «Дарек кошулат»). Расмий жазуулар сайтка кошулганга чейин төмөнкүлөрдү ойлоп таппайбыз:"
                ),
                [
                    "катталган дарек (Anschrift / Sitz);",
                    "телефон номери;",
                    "Firmenbuch номери жана каттоо соту;",
                    "UID / КНС идентификатору;",
                    "жетекчилердин (Geschäftsführer) же бирикме кызмат адамдарынын аттары;",
                    "редакциялык мазмунга жооптуу адам (medienrechtlich Verantwortliche/r).",
                ],
            ),
            _sec(
                "hosting",
                "4. Хостинг",
                _p(
                    "Коомдук файлдар Hostingerде жайгаштыруу үчүн арналган. Hostinger хостинг провайдери, медиа ээси же тексттердин автору эмес."
                ),
            ),
            _sec(
                "dispute",
                "5. Талаш-тартыштар / юрисдикция",
                _p(
                    "Жарыялоочу Австрияда жайгашкан. ЕБ керектөөчүлөрү колдонула турган жерде Европа Комиссиясынын ODR платформасын (https://ec.europa.eu/consumers/odr/) колдоно алышат. Австрия мыйзамы талап кылбаса, керектөөчү арбитражына катышууга милдеттүү эмеспиз; мындай катышуу бул жерде жарыяланган эмес.",
                    "ЕБнин милдеттүү керектөөчү эрежелери башка форум бербесе, жарандык-укуктук талаштар Австрия сотторуна баш ийет. Каттоо дареги жарыяланганда конкреттүү сот жери кошулат.",
                ),
            ),
        ],
    )
    feedback = _page(
        "Пикир",
        FEEDBACK_LEAD["ky"],
        "Birİnciге пикир, сунуш жана сайт көйгөйлөрүн жөнөтүңүз.",
        [],
        [],
        panel="Сунуш, оңдоо же жолуккан көйгөйүңүздү бизге билдириңиз. Каттар "
        + CONTACT_EMAIL
        + " дарегине келет.",
        form={
            "name_label": "Аты",
            "email_label": "Электрондук почта дареги",
            "email_placeholder": "misal@email.com",
            "type_label": "Пикирдин түрү",
            "subject_label": "Тема",
            "subject_hint": "(мисалы: иштебеген шилтеме, ачылбаган барак, орфография оңдоо жана ушул сыяктуулар)",
            "message_label": "Пикириңиз",
            "url_label": "Байланыштуу барактын дареги",
            "url_optional": "(милдеттүү эмес)",
            "url_hint": "Баракка тиешелүү пикир шилтемесинен келгенде бул талаа автоматтык толтурулат.",
            "url_placeholder": "https://birinci.cloud/ky/…",
            "privacy_label": "Купуялык билдирүүсүн окудум жана бул кат ал жерде сүрөттөлгөндөй колдонуларын түшүнөм",
            "privacy_link": "Купуялык билдирүүсүн",
            "section_title": "Пикириңиз",
            "section_sub": "Пикирлер, сунуштар жана сайт көйгөйлөрү",
            "intro": FEEDBACK_LEAD["ky"],
            "required_note": "* менен белгиленген талаалар милдеттүү.",
            "submit": "Пикир жөнөтүү",
            "file_label": "Экран сүрөтү же тиркеме",
            "file_hint": "JPG, PNG, WEBP, GIF же PDF. Эң көбү 5 МБ.",
            "file_choose": "Файл тандаңыз",
            "file_replace": "Алмаштыруу",
            "file_remove": "Өчүрүү",
            "file_ready": "Жөнөтүүгө даяр",
            "honeypot_label": "Веб-сайт",
            "success_title": "Рахмат. Пикириңиз жөнөтүлдү.",
            "success_body": "Ар бир катты окуйбуз жана сайтты жакшыртуу үчүн колдонобуз.",
            "success_home": "Башкы бетке кайтуу",
        },
    )
    return {
        "privacy-notice": privacy,
        "cookie-policy": cookies,
        "terms-of-use": terms,
        "legal-notice": imprint,
        "feedback": feedback,
    }


PAGES_BY_LANG = {
    "en": pages_en,
    "az": pages_az,
    "ru": pages_ru,
    "ky": pages_ky,
}


HIGHLIGHTS_TITLE = {
    "az": "Əsas məqamlar",
    "en": "Key takeaways",
    "ru": "Главное",
    "ky": "Негизги пункттар",
}

PLAIN_LABEL = {
    "az": "Sadə dildə",
    "en": "In plain language",
    "ru": "Простыми словами",
    "ky": "Жөнөкөй тилде",
}

PANEL_TITLE = {
    "az": {
        "privacy-notice": "Məlumat nəzarətçisi",
        "cookie-policy": "Kukilər və yaddaş",
        "terms-of-use": "Bu saytdan istifadə",
        "legal-notice": "Saytı kim dərc edir?",
        "feedback": "Sayt rəyi",
    },
    "en": {
        "privacy-notice": "Data controller",
        "cookie-policy": "Cookies and storage",
        "terms-of-use": "Using this site",
        "legal-notice": "Who publishes this site?",
        "feedback": "Website feedback",
    },
    "ru": {
        "privacy-notice": "Контроллер данных",
        "cookie-policy": "Cookie и хранение",
        "terms-of-use": "Пользование сайтом",
        "legal-notice": "Кто публикует сайт?",
        "feedback": "Отзыв о сайте",
    },
    "ky": {
        "privacy-notice": "Маалымат контроллери",
        "cookie-policy": "Cookie жана сактоо",
        "terms-of-use": "Сайтты колдонуу",
        "legal-notice": "Сайтты ким чыгарат?",
        "feedback": "Сайт боюнча пикир",
    },
}

CALLOUTS = {
    "az": {
        "privacy-notice": "Bu mətn GDPR və Avstriya Məlumatların Qorunması Qanunu (DSG) üzrə məlumat bildirişi kimi hazırlanıb. Hüquqi məsləhət deyil.",
        "legal-notice": "Səhifə Avstriya Media Qanunu (MedienG) və Elektron ticarət qanunu (ECG) üzrə məlumat vəzifələrinə, tətbiq olunduğu həddə, cavab vermək üçündür. Hələ dərc olunmayan məcburi sahələr əskik kimi göstərilir — uydurulmur.",
        "cookie-policy": "İctimai saytda analitika kukisi yoxdur, ona görə razılıq banneri göstərilmir.",
        "terms-of-use": "Bu şərtlər Avstriya və Aİ hüququna tabedir.",
    },
    "en": {
        "privacy-notice": "This text is an information notice under the GDPR and the Austrian Data Protection Act (DSG). It is not legal advice.",
        "legal-notice": "This page is meant to meet information duties under the Austrian Media Act (MedienG) and the e-Commerce Act (ECG), so far as they apply. Mandatory fields that are not yet published are listed as missing — they are not invented.",
        "cookie-policy": "The public site does not load analytics cookies, so there is no consent banner.",
        "terms-of-use": "These terms are governed by Austrian and EU law.",
    },
    "ru": {
        "privacy-notice": "Этот текст подготовлен как информационное уведомление по GDPR и австрийскому Закону о защите данных (DSG). Это не юридическая консультация.",
        "legal-notice": "Страница предназначена для обязанностей по австрийскому Закону о СМИ (MedienG) и Закону об электронной коммерции (ECG), насколько они применимы. Обязательные поля, которые ещё не опубликованы, указаны как отсутствующие и не выдуманы.",
        "cookie-policy": "На общедоступном сайте нет cookie аналитики, поэтому баннер согласия не показывается.",
        "terms-of-use": "Эти условия регулируются правом Австрии и ЕС.",
    },
    "ky": {
        "privacy-notice": "Бул текст GDPR жана Австриянын Маалыматтарды коргоо мыйзамы (DSG) боюнча маалымат билдирүүсү катары даярдалган. Юридикалык кеңеш эмес.",
        "legal-notice": "Барак Австриянын Медиа мыйзамы (MedienG) жана Электрондук коммерция мыйзамы (ECG) боюнча маалымат милдеттерине, колдонулган чекке чейин, жооп берүү үчүн. Азырынча жарыялана элек милдеттүү талаалар жок деп көрсөтүлөт — ойлоп табылбайт.",
        "cookie-policy": "Коомдук сайтта аналитика cookie жок, ошондуктан макулдук баннери көрсөтүлбөйт.",
        "terms-of-use": "Бул шарттар Австрия жана ЕБ укугуна баш ийет.",
    },
}

PLAINS = {
    "az": {
        "privacy-notice": "Nəzarətçi sizin məlumatlarınızın necə istifadə olunduğuna cavabdeh təşkilatdır. Birİnci Avstriyada qeydiyyatdadır. Bu səhifə nə topladığımızı (əsasən göndərdiyiniz e-poçt və host jurnalı), niyə və GDPR hüquqlarınızı izah edir. Küçə ünvanı, Firmenbuch, UID və məlumatların qorunması üzrə adlı məsul şəxs hələ dərc olunmayıb.",
        "legal-notice": "Hüquqi rekvizitlər (imprint) saytı hüquqi cəhətdən kimin dərc etdiyini göstərir. Təsdiqlənmiş əlaqə: vebsayt və e-poçt. Qeydiyyat identifikatorları və küçə ünvanı dərc olunanda burada görünəcək.",
        "cookie-policy": "Oxumaq üçün kuki razılığı lazım deyil. Dil və görünüş seçimləri sizin cihazınızdakı localStorage-də qalır.",
        "terms-of-use": "Səhifələri oxuya və keçid paylaşa bilərsiniz. Kolleksiyanı öz məhsulunuz kimi təqdim etməyin. Məcburi istehlakçı hüquqları qüvvədə qalır.",
    },
    "en": {
        "privacy-notice": "The controller is the organisation responsible for how your data is used. Birİnci is established in Austria. This page explains what we collect (mainly email you send us and host logs), why, and your GDPR rights. Street address, Firmenbuch, UID, and a named data-protection officer are not yet published.",
        "legal-notice": "An imprint tells you who is legally responsible for the website. Verified contacts are the website and email. Registration identifiers and a street address will appear here when they are published.",
        "cookie-policy": "You do not need to accept a cookie banner to read the site. Language and layout choices stay in localStorage on your device.",
        "terms-of-use": "You may read pages and share links. Do not present the collection as your own product. Mandatory consumer-protection rules still apply.",
    },
    "ru": {
        "privacy-notice": "Контроллер — организация, отвечающая за использование ваших данных. Birİnci учреждён в Австрии. Здесь описано, что мы собираем (в основном письма, которые вы нам пишете, и журналы хостинга), зачем, и ваши права по GDPR. Почтовый адрес, Firmenbuch, UID и назначенный сотрудник по защите данных ещё не опубликованы.",
        "legal-notice": "Импринт показывает, кто юридически отвечает за сайт. Подтверждённые контакты — сайт и электронная почта. Идентификаторы регистрации и почтовый адрес появятся здесь, когда будут опубликованы.",
        "cookie-policy": "Чтобы читать сайт, баннер cookie не нужен. Язык и вид страниц хранятся в localStorage на вашем устройстве.",
        "terms-of-use": "Можно читать страницы и делиться ссылками. Не представляйте собрание как свой продукт. Обязательные нормы защиты потребителей сохраняются.",
    },
    "ky": {
        "privacy-notice": "Контроллер — маалыматыңыздын кантип колдонуларын жоопкерчиликке алган уюм. Birİnci Австрияда катталган. Бул барак эмнени чогултаарыбызды (негизинен сиз жөнөткөн почта жана хост журналы), эмне үчүн жана GDPR укуктарыңызды түшүндүрөт. Көчө дареги, Firmenbuch, UID жана аталган маалымат коргоо кызматкери азырынча жарыялана элек.",
        "legal-notice": "Импринт сайтты юридикалык жактан ким чыгарарын көрсөтөт. Тастыкталган байланыш — сайт жана электрондук почта. Каттоо идентификаторлору жана көчө дареги жарыяланганда бул жерде көрүнөт.",
        "cookie-policy": "Окуу үчүн cookie баннери керек эмес. Тил жана көрүнүш тандоолору түзмөгүңүздө localStorageде калат.",
        "terms-of-use": "Барактарды окуп, шилтеме бөлүшсөңүз болот. Жыйнакты өз продуктуңуз катары көрсөтпөңүз. Милдеттүү керектөөчү укуктары күчүндө калат.",
    },
}

FORM_TYPE_OPTIONS = {
    "az": [
        ("", "Növ seçin"),
        ("general", "Ümumi rəy"),
        ("suggestion", "Təklif"),
        ("technical", "Texniki problem"),
        ("correction", "Məzmun düzəlişi"),
        ("other", "Digər"),
    ],
    "en": [
        ("", "Select a type"),
        ("general", "General feedback"),
        ("suggestion", "Suggestion"),
        ("technical", "Technical problem"),
        ("correction", "Content correction"),
        ("other", "Other"),
    ],
    "ru": [
        ("", "Выберите тип"),
        ("general", "Общий отзыв"),
        ("suggestion", "Предложение"),
        ("technical", "Техническая проблема"),
        ("correction", "Исправление текста"),
        ("other", "Другое"),
    ],
    "ky": [
        ("", "Түрүн тандаңыз"),
        ("general", "Жалпы пикир"),
        ("suggestion", "Сунуш"),
        ("technical", "Техникалык көйгөй"),
        ("correction", "Мазмун оңдоо"),
        ("other", "Башка"),
    ],
}


def page_for(lang: str, slug: str) -> dict:
    builder = PAGES_BY_LANG.get(lang) or pages_en
    pack = builder()
    return pack[slug]
