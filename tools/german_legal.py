"""German translations of the remaining English legal pages."""
from legal_copy import _page, _sec


def remaining_pages_de():
    cookies = _page(
        "Cookie-Richtlinie",
        "Was diese Website in deinem Browser speichert – und was nicht.",
        "Cookies und lokale Speicherung auf der öffentlich zugänglichen Website Birİnci.",
        [
            "Die öffentlich zugänglichen Seiten setzen keine Werbe- oder Analyse-Cookies.",
            "Es gibt kein Cookie-Banner, da wir keine Tracker laden, für die eine Einwilligung erforderlich wäre.",
            "Darstellungseinstellungen werden im localStorage auf deinem Gerät gespeichert.",
            "Der Hosting-Anbieter kann dennoch rein technische Cookies setzen. Diese werden nicht durch unseren Seitencode gesetzt.",
        ], [
            _sec("none-analytics", "1. Cookies, die wir nicht setzen", [
                "Die öffentlich zugänglichen Seiten enthalten weder Google Analytics noch gtag, Google Tag Manager, Plausible oder Facebook Pixel. Wir setzen auf der statischen Website kein Cookie zur Reichweitenmessung.",
            ]),
            _sec("storage", "2. Lokaler Speicher und Sitzungsspeicher (keine Cookies)", [
                "Skripte können kleine Einstellungswerte im Browser speichern. Typische Schlüssel sind:",
            ], [
                "birinci-lang — zuletzt gewählte Sprache;",
                "birinci-home-view, birinci-category-view, birinci-inventions-view — Listen- oder Kartenansicht;",
                "birinci-images-collapsed, birinci-images-collapsed-default-v2, birinci-texts-collapsed — ob Illustrationen oder Geschichtentexte eingeklappt bleiben;",
                "birinci-audio-rate, birinci-audio-volume, birinci-audio-muted — Einstellungen der Vorlesefunktionen;",
                "sessionStorage-Schlüssel wie birinci-lang-ctx und birinci-compare-* — kurzzeitig gespeicherter Navigationskontext für Sprach- oder Vergleichsansichten;",
                "birinci-dev-story-edit — eine Kennzeichnung für die Bearbeitung während der Entwicklung, keine öffentliche Funktion.",
            ]),
            _sec("host", "3. Hosting und andere Cookies", [
                "Hostinger oder ein vorgeschaltetes Netzwerk zur Inhaltsauslieferung kann Cookies setzen, die zur Bereitstellung der Website, zur Lastverteilung oder zum Schutz vor Missbrauch erforderlich sind. Wir können hier nicht jedes Cookie des Hosting-Anbieters auflisten, da diese Cookies nicht von unseren Seiten erzeugt werden.",
                "Konto- oder Sitzungs-Cookies gäbe es nur, wenn ein optionaler Kontodienst auf der öffentlich betriebenen Website aktiviert würde. Auf der öffentlichen statischen Website ist diese Oberfläche nicht aktiviert.",
            ]),
            _sec("fonts", "4. Anfragen an Dritte", [
                "Die Hauptseiten laden Schriftarten von dieser Website. Einige Vergleichsansichten senden weiterhin Anfragen an fonts.googleapis.com. Wenn du diese Seiten öffnest, kann Google diese Anfrage sehen. Gewöhnliche Weisheitsgeschichten-Seiten laden keine Google Fonts.",
                "YouTube und andere Videoanbieter sind auf der öffentlichen Startseite der Geschichten nicht eingebettet. Der Bereich „Entdeckungen und Erfindungen“ befindet sich in der Entwicklung und ist nicht Teil der öffentlichen Website; er wird hier nicht als öffentlich verfügbarer Katalog beschrieben.",
            ]),
            _sec("control", "5. So kannst du die Speicherung steuern", [
                "Lösche in deinem Browser die Websitedaten für birinci.cloud, wenn du deine Einstellungen zurücksetzen möchtest. Wenn du jede Speicherung blockierst, kann die Website deine Sprach- und Darstellungseinstellungen vergessen. Auf diesen Seiten gibt es keine Cookie-Einstellungsübersicht, da wir keine Einwilligungsplattform für Tracker verwenden.",
            ]),
        ])
    terms = _page(
        "Nutzungsbedingungen",
        "Die Regeln für das Lesen und Nutzen der öffentlich zugänglichen Seiten von Birİnci.",
        "Nutzungsbedingungen für die Weisheitsgeschichten-Website Birİnci.",
        [
            "Die Website dient dem persönlichen Lesen, Lernen und Nachdenken.",
            "Die Geschichten stammen aus offenen Internetquellen; die Illustrationen werden mit künstlicher Intelligenz erstellt, wie auf der Website angegeben.",
            "Du darfst die Sammlung ohne Erlaubnis weder automatisiert auslesen noch erneut veröffentlichen oder als dein eigenes Produkt darstellen.",
        ], [
            _sec("service", "1. Die Website", [
                "Birİnci veröffentlicht eine statische, mehrsprachige Website mit Weisheitsgeschichten sowie Seiten über unsere Mission. Der Bereich „Entdeckungen und Erfindungen“ und Audiodateien zu den Geschichten sind nicht Teil der öffentlichen Website.",
                "Die Seiten werden in der vorliegenden Form bereitgestellt. Wir bemühen uns um sorgfältige Texte mit Quellenangaben, übernehmen jedoch keine Gewähr für Vollständigkeit oder Eignung für einen bestimmten Zweck.",
            ]),
            _sec("use", "2. Zulässige Nutzung", ["Du darfst öffentlich zugängliche Seiten aufrufen, lesen und Links darauf teilen. Nicht erlaubt ist es:"], [
                "den Hosting-Dienst anzugreifen, zu überlasten oder auf Schwachstellen zu untersuchen;",
                "die Website fälschlich als offizielle staatliche, religiöse oder wissenschaftliche Einrichtung darzustellen;",
                "Daten automatisiert so zu sammeln, dass der Dienst beeinträchtigt wird;",
                "rechtswidrige Inhalte über Formulare zu übermitteln, die wir künftig hinzufügen.",
            ]),
            _sec("content", "3. Inhalte und Quellen", [
                "Auf den Geschichtenseiten wird angegeben, dass die Geschichten aus offenen Internetquellen stammen und die Illustrationen mit künstlicher Intelligenz erstellt werden. Verstehe die Erzählungen als Weisheitsliteratur, nicht als medizinische, rechtliche oder finanzielle Fachberatung.",
                "Marken und Namen Dritter, die in den Geschichten vorkommen, bleiben ihren jeweiligen Inhabern zugeordnet.",
            ]),
            _sec("liability", "4. Haftung", [
                "Soweit gesetzlich zulässig, haftet Birİnci nicht für Schäden, die aus der Nutzung der Website, Unterbrechungen des Hosting-Dienstes oder dem Vertrauen auf eine Geschichte entstehen. Diese Bedingungen beschränken keine Haftung, die gesetzlich nicht beschränkt werden darf.",
            ]),
            _sec("law", "5. Anwendbares Recht", [
                "Diese Bedingungen unterliegen dem Recht der Republik Österreich unter Ausschluss der Kollisionsnormen und des UN-Kaufrechts, soweit dieses anwendbar sein könnte. Zwingende Verbraucherschutzvorschriften deines Wohnsitzstaates bleiben unberührt, soweit das EU-Recht dies verlangt.",
                "Sofern zwingendes Recht nichts anderes vorsieht, sind die österreichischen Gerichte zuständig. Ein konkreter Gerichtsstand wird hier genannt, sobald die Anschrift des Sitzes veröffentlicht ist.",
            ]),
        ])
    imprint = _page(
        "Impressum",
        "Impressumsangaben nach österreichischem und EU-Recht (MedienG / ECG). Es werden nur Angaben gemacht, die wir überprüfen können.",
        "Impressum von Birİnci: in Österreich registrierter Herausgeber, bestätigte öffentliche Kontaktdaten und noch nicht veröffentlichte Registrierungsangaben.",
        [
            "Birİnci ist in Österreich registriert.",
            "Öffentliche Website: https://birinci.cloud.",
            "Öffentliche E-Mail-Adresse: info@birinci.cloud.",
            "Firmenbuchnummer, UID, Straßenadresse, Telefonnummer und die Namen der Geschäftsführung sind noch nicht veröffentlicht. Diese Seite erfindet diese Angaben nicht.",
        ], [
            _sec("identity", "1. Medieninhaber / Herausgeber", [
                "Die Website wird unter dem Namen Birİnci (Perle des Wissens und der moralischen Werte) veröffentlicht.",
                "Registrierungsland: Österreich. Diese Seite soll die Informationspflichten nach dem österreichischen Mediengesetz (MedienG) und dem E-Commerce-Gesetz (ECG / § 5 ECG) erfüllen, soweit sie für dieses Online-Angebot gelten.",
                "Rechtsform (zum Beispiel GmbH, Verein oder Einzelunternehmen), Firmenbuchnummer (FN), Firmenbuchgericht und UID (ATU…) sind noch nicht veröffentlicht. Diese Angaben werden hier ergänzt, sobald sie vorliegen.",
            ]),
            _sec("published", "2. Auf der Website überprüfbare Angaben", ["In der Fußzeile und den angrenzenden Elementen der Website sind folgende Angaben zu finden:"], [
                "Website: https://birinci.cloud.",
                "E-Mail: info@birinci.cloud.",
                "Ein QR-Code, der auf dieselbe öffentliche Website verweist.",
            ]),
            _sec("missing", "3. Noch fehlende Pflichtangaben im Impressum", [
                "Die Fußzeile zeigt derzeit Beschriftungen für Telefonnummer und Adresse ohne tatsächliche Angaben (Platzhalter wie „Adresse wird ergänzt“). Solange keine amtlichen Angaben auf der Website ergänzt wurden, erfinden wir keine Angaben zu:",
            ], [
                "Anschrift und Sitz;",
                "Telefonnummer;",
                "Firmenbuchnummer und Firmenbuchgericht;",
                "UID / Umsatzsteuer-Identifikationsnummer;",
                "Namen der Geschäftsführung oder der Vereinsorgane;",
                "Name der medienrechtlich verantwortlichen Person.",
            ]),
            _sec("hosting", "4. Hosting", [
                "Die öffentlichen Dateien sind für die Bereitstellung über Hostinger vorgesehen. Hostinger ist der Hosting-Anbieter, nicht der Medieninhaber oder Verfasser der Texte.",
            ]),
            _sec("dispute", "5. Streitbeilegung / Gerichtszuständigkeit", [
                "Der Herausgeber hat seinen Sitz in Österreich. Die Online-Streitbeilegungsplattform der Europäischen Kommission wurde am 20. Juli 2025 eingestellt. Aktuelle Informationen zu Verbraucherschlichtungsstellen findest du unter https://consumer-redress.ec.europa.eu/dispute-resolution-bodies. Wir sind nicht zur Teilnahme an einem Verfahren vor einer Verbraucherschlichtungsstelle verpflichtet, sofern das österreichische Recht dies nicht verlangt; eine solche Teilnahme wird hier nicht zugesagt.",
                "Für zivilrechtliche Streitigkeiten sind österreichische Gerichte zuständig, sofern zwingende EU-Verbraucherschutzvorschriften keinen anderen Gerichtsstand vorsehen. Ein konkreter Gerichtsstand wird ergänzt, sobald ein Sitz veröffentlicht ist.",
            ]),
        ])
    return {"cookie-policy": cookies, "terms-of-use": terms, "legal-notice": imprint}
