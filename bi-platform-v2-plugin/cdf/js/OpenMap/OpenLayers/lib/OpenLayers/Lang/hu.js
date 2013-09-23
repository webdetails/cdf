/*! Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
* full list of contributors). Published under the Clear BSD license.
* See http://svn.openlayers.org/trunk/openlayers/license.txt for the
* full text of the license. */

/* Translators (2009 onwards):
 *  - City-busz
 *  - Glanthor Reviol
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["hu"]
 * Dictionary for Magyar.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */

OpenLayers.Lang["hu"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Nem kezelt kérés visszatérése ${statusText}",

    'Permalink': "Permalink",

    'Overlays': "Rávetítések",

    'Base Layer': "Alapréteg",

    'readNotImplemented': "Olvasás nincs végrehajtva.",

    'writeNotImplemented': "�?rás nincs végrehajtva.",

    'noFID': "Nem frissíthető olyan jellemző, amely nem rendelkezik FID-del.",

    'errorLoadingGML': "Hiba GML-fájl betöltésekor ${url}",

    'browserNotSupported': "A böngészője nem támogatja a vektoros renderelést. A jelenleg támogatott renderelők:\n${renderers}",

    'componentShouldBe': "addFeatures : az összetevőnek ilyen típusúnak kell lennie: ${geomType}",

    'getFeatureError': "getFeatureFromEvent réteget hívott meg renderelő nélkül. Ez rendszerint azt jelenti, hogy megsemmisített egy fóliát, de néhány ahhoz társított kezelőt nem.",

    'minZoomLevelError': "A minZoomLevel tulajdonságot csak a következővel való használatra szánták: FixedZoomLevels-leszármazott fóliák. Ez azt jelenti, hogy a minZoomLevel wfs fólia jelölőnégyzetei már a múlté. Mi azonban nem távolíthatjuk el annak a veszélye nélkül, hogy az esetlegesen ettől függő OL alapú alkalmazásokat tönkretennénk. Ezért ezt érvénytelenítjük -- a minZoomLevel az alul levő jelölőnégyzet a 3.0-s verzióból el lesz távolítva. Kérjük, helyette használja a  min/max felbontás beállítást, amelyről az alábbi helyen talál leírást: http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS tranzakció: SIKERES ${response}",

    'commitFailed': "WFS tranzakció: SIKERTELEN ${response}",

    'googleWarning': "A Google fólia betöltése sikertelen.\x3cbr\x3e\x3cbr\x3eAhhoz, hogy ez az üzenet eltűnjön, válasszon egy új BaseLayer fóliát a jobb felső sarokban található fóliakapcsoló segítségével.\x3cbr\x3e\x3cbr\x3eNagy valószínűséggel ez azért van, mert a Google Maps könyvtár parancsfájlja nem található, vagy nem tartalmazza az Ön oldalához tartozó megfelelő API-kulcsot.\x3cbr\x3e\x3cbr\x3eFejlesztőknek: A helyes működtetésre vonatkozó segítség az alábbi helyen érhető el, \x3ca href=\'http://trac.openlayers.org/wiki/Google\' target=\'_blank\'\x3ekattintson ide\x3c/a\x3e",

    'getLayerWarning': "A(z) ${layerType} fólia nem töltődött be helyesen.\x3cbr\x3e\x3cbr\x3eAhhoz, hogy ez az üzenet eltűnjön, válasszon egy új BaseLayer fóliát a jobb felső sarokban található fóliakapcsoló segítségével.\x3cbr\x3e\x3cbr\x3eNagy valószínűséggel ez azért van, mert a(z) ${layerLib} könyvtár parancsfájlja helytelen.\x3cbr\x3e\x3cbr\x3eFejlesztőknek: A helyes működtetésre vonatkozó segítség az alábbi helyen érhető el, \x3ca href=\'http://trac.openlayers.org/wiki/${layerLib}\' target=\'_blank\'\x3ekattintson ide\x3c/a\x3e",

    'Scale = 1 : ${scaleDenom}': "Lépték = 1 : ${scaleDenom}",

    'W': "Ny",

    'E': "K",

    'N': "É",

    'S': "D",

    'layerAlreadyAdded': "Megpróbálta hozzáadni a(z) ${layerName} fóliát a térképhez, de az már hozzá van adva",

    'reprojectDeprecated': "Ön a \'reproject\' beállítást használja a(z) ${layerName} fólián. Ez a beállítás érvénytelen: használata az üzleti alaptérképek fölötti adatok megjelenítésének támogatására szolgált, de ezt a funkció ezentúl a Gömbi Mercator használatával érhető el. További információ az alábbi helyen érhető el: http://trac.openlayers.org/wiki/SphericalMercator",

    'methodDeprecated': "Ez a módszer érvénytelenítve lett és a 3.0-s verzióból el lesz távolítva. Használja a(z) ${newMethod} módszert helyette.",

    'boundsAddError': "Az x és y értékeknek egyaránt meg kell felelnie, hogy a funkciót hozzáadhassa.",

    'lonlatAddError': "A hossz. és szél. értékeknek egyaránt meg kell felelnie, hogy a funkciót hozzáadhassa.",

    'pixelAddError': "Az x és y értékeknek egyaránt meg kell felelnie, hogy a funkciót hozzáadhassa.",

    'unsupportedGeometryType': "Nem támogatott geometriatípus: ${geomType}",

    'filterEvaluateNotImplemented': "ennél a szűrőtípusnál kiértékelés nem hajtódik végre."

});
