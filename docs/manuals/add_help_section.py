"""Explain the public Help navigation and guide controls in each manual."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COPY = {
 'en': ('Using Help', 'The Help page with the Help button, guide search, topic filter and Contents panel.', [
  'Select “Help” at the end of the main navigation bar to open the user guide in your current language. It explains how to read stories, use illustrations and language comparison, send feedback and use the offline edition. On a phone or narrow tablet screen, open the three-line menu first, then select “Help”.',
  'Use the search field below the navigation trail to find instructions by a word or phrase. The topic dropdown narrows the guide to a subject. Search and the topic filter work together; clear the search field and choose “All topics” to show the complete guide again.',
  'Select a heading in Contents to jump to that section. On wider screens, Contents stays below the search panel as you scroll and highlights the section you are reading. On narrow screens, open the Contents panel when needed. Select a section heading to collapse or expand its instructions.',
  'Select a screenshot to enlarge it; close it with × or Esc. “Link to section” provides a direct link to the relevant instructions. The page arrows move to the top or bottom. Use the language selector to open another language’s guide, or the main navigation to return to stories.']),
 'az': ('Kömək bölməsindən istifadə', 'Kömək düyməsi, təlimatda axtarış, mövzu filtri və Mündəricat paneli olan Kömək səhifəsi.', [
  'Cari dildə istifadəçi təlimatını açmaq üçün əsas naviqasiya menyusunun sonundakı “Kömək” düyməsini seçin. Təlimat hekayələri oxumağı, illüstrasiyalardan və dil müqayisəsindən istifadəni, rəy göndərməyi və oflayn versiyanı izah edir. Telefon və ya dar planşet ekranında əvvəlcə üçxətli menyunu açın, sonra “Kömək” seçin.',
  'Təlimatları söz və ya ifadə ilə tapmaq üçün naviqasiya yolunun altındakı axtarış sahəsindən istifadə edin. Açılan mövzu siyahısı təlimatı seçilmiş mövzu üzrə filtrləyir. Axtarış və mövzu filtri birlikdə işləyir; bütün təlimatı yenidən göstərmək üçün axtarış sahəsini boşaldın və “Bütün mövzular” seçin.',
  'Bölməyə keçmək üçün Mündəricatda onun başlığını seçin. Geniş ekranda Mündəricat səhifəni sürüşdürərkən axtarış panelinin altında görünür və oxuduğunuz bölməni vurğulayır. Dar ekranda lazım olduqda Mündəricat panelini açın. Təlimatları yığmaq və ya açmaq üçün bölmənin başlığını seçin.',
  'Ekran şəklini böyütmək üçün üzərinə basın; × və ya Esc ilə bağlayın. “Bölməyə keçid” müvafiq təlimata birbaşa keçid verir. Səhifədəki oxlar yuxarıya və aşağıya aparır. Başqa dildə təlimatı açmaq üçün dil seçicisindən, hekayələrə qayıtmaq üçün əsas naviqasiyadan istifadə edin.']),
 'de': ('Die Hilfe verwenden', 'Die Hilfeseite mit der Schaltfläche Hilfe, der Suche, dem Themenfilter und dem Inhaltsverzeichnis.', [
  'Wählen Sie „Hilfe“ am Ende der Hauptnavigation, um das Benutzerhandbuch in der aktuellen Sprache zu öffnen. Es erklärt das Lesen von Geschichten, Illustrationen, den Sprachvergleich, Rückmeldungen und die Offlineversion. Öffnen Sie auf einem Smartphone oder schmalen Tablet zuerst das Menü mit den drei Linien und wählen Sie dann „Hilfe“.',
  'Suchen Sie im Feld unter dem Navigationspfad nach einem Wort oder einer Formulierung. Die Themenauswahl beschränkt das Handbuch auf ein Thema. Suche und Themenfilter wirken zusammen. Leeren Sie das Suchfeld und wählen Sie „Alle Themen“, um wieder das gesamte Handbuch anzuzeigen.',
  'Wählen Sie im Inhaltsverzeichnis eine Überschrift, um zum Abschnitt zu springen. Auf breiten Bildschirmen bleibt das Inhaltsverzeichnis beim Scrollen unter der Suche sichtbar und hebt den gelesenen Abschnitt hervor. Öffnen Sie es auf schmalen Bildschirmen bei Bedarf. Mit der Abschnittsüberschrift können Sie die Anleitung ein- oder ausklappen.',
  'Wählen Sie einen Screenshot zum Vergrößern und schließen Sie ihn mit × oder Esc. „Link zum Abschnitt“ führt direkt zur betreffenden Anleitung. Die Seitenpfeile springen nach oben oder unten. Die Sprachauswahl öffnet das Handbuch in einer anderen Sprache; über die Hauptnavigation gelangen Sie zurück zu den Geschichten.']),
 'ru': ('Как пользоваться помощью', 'Страница помощи с кнопкой «Помощь», поиском по руководству, фильтром тем и содержанием.', [
  'Нажмите «Помощь» в конце главного меню, чтобы открыть руководство на выбранном языке. В нём объясняется, как читать рассказы, просматривать иллюстрации, сравнивать языки, отправлять отзывы и пользоваться офлайн-версией. На телефоне или узком экране планшета сначала откройте меню с тремя линиями, затем выберите «Помощь».',
  'Введите слово или фразу в поле поиска под навигационной цепочкой. Выпадающий список тем позволяет оставить только нужную тему. Поиск и фильтр тем действуют одновременно. Чтобы снова увидеть всё руководство, очистите поле поиска и выберите «Все темы».',
  'Нажмите заголовок в содержании, чтобы перейти к разделу. На широком экране содержание остаётся под панелью поиска при прокрутке и выделяет текущий раздел. На узком экране открывайте панель содержания по необходимости. Нажмите заголовок раздела, чтобы свернуть или развернуть инструкции.',
  'Нажмите снимок экрана, чтобы увеличить его; закройте с помощью × или Esc. «Ссылка на раздел» ведёт непосредственно к нужной инструкции. Стрелки страницы перемещают вверх или вниз. Переключатель языков открывает руководство на другом языке; главное меню позволяет вернуться к рассказам.']),
 'ky': ('Жардам бөлүмүн колдонуу', 'Жардам баскычы, колдонмодон издөө, тема чыпкасы жана мазмун панели бар Жардам барагы.', [
  'Учурдагы тилдеги колдонмону ачуу үчүн негизги менюдун аягындагы «Жардам» баскычын басыңыз. Колдонмодо аңгемелерди окуу, иллюстрацияларды көрүү, тилдерди салыштыруу, пикир жөнөтүү жана офлайн нусканы колдонуу түшүндүрүлөт. Телефондо же планшеттин тар экранында адегенде үч сызыктуу менюну ачып, андан соң «Жардам» тандаңыз.',
  'Керектүү нускаманы табуу үчүн багыттоо сабынын астындагы издөө талаасына сөз же сөз айкашын жазыңыз. Ачылма тема тизмеси колдонмону тандалган тема боюнча чыпкалайт. Издөө жана тема чыпкасы чогуу иштейт. Толук колдонмону кайра көрсөтүү үчүн издөө талаасын тазалап, «Бардык темалар» тандаңыз.',
  'Бөлүмгө өтүү үчүн мазмундан анын аталышын басыңыз. Кең экранда баракты жылдырганда мазмун издөө панелинин астында көрүнүп турат жана окулуп жаткан бөлүмдү белгилейт. Тар экранда мазмун панелин керектүү учурда ачыңыз. Нускамаларды жыйноо же ачуу үчүн бөлүмдүн аталышын басыңыз.',
  'Экран сүрөтүн чоңойтуу үчүн аны басыңыз; × же Esc менен жабыңыз. «Бөлүмгө шилтеме» керектүү нускамага түз алып барат. Барактагы жебелер жогору же ылдый жылдырат. Башка тилдеги колдонмону ачуу үчүн тил тандагычты, аңгемелерге кайтуу үчүн негизги менюну колдонуңуз.'])
}

# Match the existing German manual's informal address.
de_title, de_caption, de_paras = COPY['de']
de_replacements = {'Wählen Sie':'Wähle','wählen Sie':'wähle','Öffnen Sie':'Öffne','Suchen Sie':'Suche','Leeren Sie':'Leere','schließen Sie':'schließe','können Sie':'kannst du','gelangen Sie':'gelangst du'}
old_de_sentence = de_paras[0].split('. ')[0] + '.'
for before, after in de_replacements.items():
    de_paras = [p.replace(before, after) for p in de_paras]
COPY['de'] = de_title, de_caption, de_paras

for lang, (title, caption, paras) in COPY.items():
    path = ROOT / f'manual-{lang}.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    data['sections'] = [s for s in data['sections'] if s.get('id') != 'help']
    data['sections'].append(dict(id='help', shot='help', topic='navigation', title=title, caption=caption, paras=paras))
    intro = data['sections'][0]['paras'][0].replace(' ' + paras[0], '')
    if lang == 'de': intro = intro.replace(' ' + old_de_sentence, '')
    sentence = paras[0].split('. ')[0] + '.'
    data['sections'][0]['paras'][0] = intro if sentence in intro else intro + ' ' + sentence
    data['sections'][0]['caption'] = {
      'az':'Əsas menyu, Kömək düyməsi, dil seçicisi və kateqoriya kartları olan ana səhifə.',
      'en':'The home page with the main menu, Help button, language selector and category cards.',
      'de':'Die Startseite mit Hauptmenü, Hilfe, Sprachauswahl und Themenkarten.',
      'ru':'Главная страница с основным меню, кнопкой «Помощь», выбором языка и карточками категорий.',
      'ky':'Негизги меню, Жардам баскычы, тил тандагыч жана категория карталары бар башкы барак.'
    }[lang]
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

for name in ('build_user_manuals.py', '../../tools/build_html_manuals.py'):
    path = ROOT / name
    path.write_text(path.read_text(encoding='utf-8').replace('screenshots-20261030', 'screenshots-20261031'), encoding='utf-8')
