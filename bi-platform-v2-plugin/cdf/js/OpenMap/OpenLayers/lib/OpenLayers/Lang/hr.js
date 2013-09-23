/*! Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
* full list of contributors). Published under the Clear BSD license.
* See http://svn.openlayers.org/trunk/openlayers/license.txt for the
* full text of the license. */

/* Translators (2009 onwards):
 *  - Mvrban
 */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["hr"]
 * Dictionary for Hrvatski.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */

OpenLayers.Lang["hr"] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Nepodržani zahtjev ${statusText}",

    'Permalink': "Permalink",

    'Overlays': "Overlays",

    'Base Layer': "Osnovna karta",

    'readNotImplemented': "Čitanje nije implementirano.",

    'writeNotImplemented': "Pisanje nije implementirano.",

    'noFID': "Ne mogu ažurirati zna�?ajku za koju ne postoji FID.",

    'errorLoadingGML': "Greška u u�?itavanju GML datoteke ${url}",

    'browserNotSupported': "Vaš preglednik ne podržava vektorsko renderiranje. Trenutno podržani rendereri su: ${renderers}",

    'componentShouldBe': "addFeatures : komponenta bi trebala biti ${geomType}",

    'getFeatureError': "getFeatureFromEvent je pozvao Layer bez renderera. Ovo obi�?no zna�?i da ste uništiili Layer, a ne neki Handler koji je povezan s njim.",

    'commitSuccess': "WFS Transakcija: USPJEŠNA ${response}",

    'commitFailed': "WFS Transakcija: NEUSPJEŠNA ${response}",

    'Scale = 1 : ${scaleDenom}': "Mjerilo = 1 : ${scaleDenom}",

    'layerAlreadyAdded': "Pokušali ste dodati layer:  ${layerName} na kartu, ali je već dodan",

    'methodDeprecated': "Ova metoda nije odobrena i biti će maknuta u 3.0. Koristite ${newMethod}.",

    'boundsAddError': "Morate dati obje vrijednosti ,  x i y  da bi dodali funkciju.",

    'lonlatAddError': "Morate dati obje vrijednosti , (lon i lat) da bi dodali funkciju.",

    'pixelAddError': "Morate dati obje vrijednosti ,  x i y  da bi dodali funkciju.",

    'unsupportedGeometryType': "Nepodržani tip geometrije: ${geomType}"

});
