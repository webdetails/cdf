/*! Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
* full list of contributors). Published under the Clear BSD license.
* See http://svn.openlayers.org/trunk/openlayers/license.txt for the
* full text of the license. */

/* Translators (2009 onwards):
 *  - Helix84
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["sk"]
 * Dictionary for Sloven�?ina.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */

OpenLayers.Lang["sk"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Neobslúžené požiadavky vracajú ${statusText}",

    'Permalink': "Trvalý odkaz",

    'Overlays': "Prekrytia",

    'Base Layer': "Základná vrstva",

    'readNotImplemented': "Čítanie nie je implementované.",

    'writeNotImplemented': "Zápis nie je implementovaný.",

    'noFID': "Nie je možné aktualizovať vlastnosť, pre ktorú neexistuje FID.",

    'errorLoadingGML': "Chyba pri na�?ítaní súboru GML ${url}",

    'browserNotSupported': "Váš prehliada�? nepodporuje vykresľovanie vektorov. Momentálne podporované vykresľova�?e sú:\n${renderers}",

    'componentShouldBe': "addFeatures: komponent by mal byť ${geomType}",

    'getFeatureError': "getFeatureFromEvent bola zavolaná na vrstve bez vykresľova�?a. To zvy�?ajne znamená, že ste odstránili vrstvu, ale nie niektorú z obslúh, ktorá je s ňou asociovaná.",

    'minZoomLevelError': "Vlastnosť minZoomLevel je ur�?ený iba na použitie s vrstvami odvodenými od FixedZoomLevels. To, že táto wfs vrstva kontroluje minZoomLevel je pozostatok z minulosti. Nemôžeme ho však odstrániť, aby sme sa vyhli možnému porušeniu aplikácií založených na Open Layers, ktoré na tomto môže závisieť. Preto ho ozna�?ujeme ako zavrhovaný - dolu uvedená kontrola minZoomLevel bude odstránená vo verzii 3.0. Použite prosím namiesto toho kontrolu min./max. rozlíšenia podľa tu uvedeného popisu: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transakcia WFS: ÚSPEŠN�? ${response}",

    'commitFailed': "Transakcia WFS: ZLYHALA ${response}",

    'googleWarning': "Vrstvu Google nebolo možné správne na�?ítať.\x3cbr\x3e\x3cbr\x3eAby ste sa tejto správy zbavili vyberte novú BaseLayer v prepína�?i vrstiev v pravom hornom rohu.\x3cbr\x3e\x3cbr\x3eToto sa stalo pravdepodobne preto, že skript knižnice Google Maps bu�? nebol na�?ítaný alebo neobsahuje správny kľú�? API pre vašu lokalitu.\x3cbr\x3e\x3cbr\x3eVývojári: Tu môžete získať \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3epomoc so sfunk�?nením\x3c/a\x3e",

    'getLayerWarning': "Vrstvu ${layerType} nebolo možné správne na�?ítať.\x3cbr\x3e\x3cbr\x3eAby ste sa tejto správy zbavili vyberte novú BaseLayer v prepína�?i vrstiev v pravom hornom rohu.\x3cbr\x3e\x3cbr\x3eToto sa stalo pravdepodobne preto, že skript knižnice ${layerType} bu�? nebol na�?ítaný alebo neobsahuje správny kľú�? API pre vašu lokalitu.\x3cbr\x3e\x3cbr\x3eVývojári: Tu môžete získať \x3ca href=\'http://trac.openlayers.org/wiki/${layerType}\' target=\'_blank\'\x3epomoc so sfunk�?nením\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Mierka = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Pokúsili ste sa do mapy pridať vrstvu ${layerName}, ale tá už bola pridaná",

    'reprojectDeprecated': "Používate voľby „reproject“ vrstvy ${layerType}. Táto voľba je zzavrhovaná: jej použitie bolo navrhnuté na podporu zobrazovania údajov nad komer�?nými základovými mapami, ale túto funkcionalitu je teraz možné dosiahnuť pomocou Spherical Mercator. Ďalšie informácie získate na stránke http://trac.openlayers.org/wiki/SphericalMercator.",

    'methodDeprecated': "Táto metóda je zavrhovaná a bude odstránená vo verzii 3.0. Použite prosím namiesto nej metódu ${newMethod}.",

    'boundsAddError': "S�?ítacej funkcii musíte dať hodnoty x aj y.",

    'lonlatAddError': "S�?ítacej funkcii musíte dať hodnoty lon (zem. dĺžka) aj lat (zem. šírka).",

    'pixelAddError': "S�?ítacej funkcii musíte dať hodnoty x aj y.",

    'unsupportedGeometryType': "Nepodporovaný typ geometrie: ${geomType}",

    'filterEvaluateNotImplemented': "evaluate nie je implementovaný pre tento typ filtra"

});
