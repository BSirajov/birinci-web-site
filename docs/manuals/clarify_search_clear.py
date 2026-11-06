"""Keep the search-clear explanation precise in all guide source languages."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEXT = {
 'az': ('«Müəllif» siyahısından istədiyiniz müəllifi seçin. Müəllif seçimini ləğv etmək üçün «Bütün müəlliflər» seçin. Kateqoriya seçimi olan səhifələrdə mövzunu da dəyişə bilərsiniz. Axtarış sahəsinin yanındakı × düyməsi («Filtri təmizlə») yalnız axtarış mətnini silir; müəllif və kateqoriya seçimlərini dəyişmir.', 'Axtarış mətninin silinməsi: axtarış sahəsinin yanındakı ×. Müəllif seçiminin ləğvi: «Bütün müəlliflər».'),
 'en': ('Choose an author from the author filter; select “All authors” to reset the author selection. Where a category selector is available, use it to change the topic. The × button beside the search field (tooltip: “Clear filter”) clears only the search text; it does not change the author or category selections.', 'Clear search text: × beside the search field. Reset the author selection: “All authors”.'),
 'de': ('Wähle im Autorenfilter einen Autor. Mit „Alle Autoren“ setzt du die Autorenauswahl zurück. Wo eine Kategorieauswahl vorhanden ist, kannst du damit das Thema wechseln. Die Schaltfläche × neben dem Suchfeld (Tooltip: „Filter zurücksetzen“) löscht nur den Suchtext; die Auswahl von Autor und Kategorie bleibt unverändert.', 'Suchtext löschen: × neben dem Suchfeld. Autorenauswahl zurücksetzen: „Alle Autoren“.'),
 'ru': ('Выберите автора в фильтре. Чтобы сбросить выбор автора, выберите «Все авторы». Там, где доступен выбор категории, можно сменить тему. Кнопка × рядом с полем поиска (подсказка «Сбросить фильтр») удаляет только поисковый запрос; выбранные автор и категория остаются без изменений.', 'Очистить поисковый запрос: × рядом с полем поиска. Сбросить выбор автора: «Все авторы».'),
 'ky': ('Авторлор тизмесинен керектүү авторду тандаңыз. Автор боюнча чыпканы алып салуу үчүн бардык авторлорду көрсөткөн пунктту тандаңыз. Категория тандоо мүмкүн болгон барактарда теманы да өзгөртө аласыз. Издөө талаасынын жанындагы × баскычы («Фильтрди тазалоо») издөө текстин гана өчүрөт; тандалган автор менен категория өзгөрбөйт.', 'Издөө текстин өчүрүү: издөө талаасынын жанындагы ×. Автор боюнча чыпканы алып салуу: бардык авторлорду тандоо.'),
}
for lang, (paragraph, quick) in TEXT.items():
    path = ROOT / f'manual-{lang}.json'
    manual = json.loads(path.read_text(encoding='utf-8'))
    for section in manual['sections']:
        if section.get('shot') == 'category':
            section['paras'][2] = paragraph
        elif section.get('shot') == 'footer':
            prefix = re.split(r'(?:Filtrlərin ləğvi:|Axtarış mətninin silinməsi:|Clear filters:|Clear search text:|Filter entfernen:|Suchtext löschen:|Снять фильтры:|Очистить поисковый запрос:|Чыпкаларды алып салуу:|Издөө текстин өчүрүү:)', section['paras'][0])[0]
            section['paras'][0] = prefix.rstrip() + ' ' + quick
    path.write_text(json.dumps(manual, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
