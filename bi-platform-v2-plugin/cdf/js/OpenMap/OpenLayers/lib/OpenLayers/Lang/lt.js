/*! Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
* full list of contributors). Published under the Clear BSD license.
* See http://svn.openlayers.org/trunk/openlayers/license.txt for the
* full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["lt"]
 * Dictionary for Lithuanian.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */

OpenLayers.Lang['lt'] = OpenLayers.Util.applyDefaults({

    'unhandledRequest': "Neapdorota užklausa gražino ${statusText}",

    'Permalink': "Pastovi nuoroda",

    'Overlays': "Papildomi sluoksniai",

    'Base Layer': "Pagrindinis sluoksnis",

    'readNotImplemented': "Skaitymas nėra įgyvendintas.",

    'writeNotImplemented': "Rašymas nėra įgyvendintas.",

    'noFID': "Negaliu atnaujinti objekto, kuris neturi FID.",

    'errorLoadingGML': "Klaida užkraunant GML failą ${url}",

    'browserNotSupported':
	"Jūsų naršyklė nemoka parodyti vektorių. Šiuo metu galima naudotis tokiais rodymo varikliais:\n{renderers}",

    'componentShouldBe': "addFeatures : komponentas turi būti ${geomType}",

    // console message
    'getFeatureError':
	"getFeatureFromEvent buvo iškviestas sluoksniui, kuris neturi priskirto paišymo variklio. Tai paprastai nutinka, kai jūs pašalinate sluoksnį, bet paliekate su juo susijusį [handler]",

    'commitSuccess': "WFS Tranzakcija: PAVYKO ${response}",

    'commitFailed': "WFS Tranzakcija: ŽLUGO ${response}",

    'Scale = 1 : ${scaleDenom}': "Mastelis = 1 : ${scaleDenom}",
    
    //labels for the graticule control
    'W': 'V',
    'E': 'R',
    'N': 'Š',
    'S': 'P',
    'Graticule': 'Tinklelis',

    // console message
    'layerAlreadyAdded':
        "Bandėte pridėti prie žemėlapio sluoksnį ${layerName}, ta�?iau jis jau yra pridėtas",

    // console message
    'methodDeprecated':
	"Šis metodas yra pasenęs ir 3.0 versijoje bus pašalintas. " +
	"Prašome naudoti ${newMethod}.",

    // console message
    'boundsAddError': "Add funkcijai reikia pateikti tiek x, tiek y reikšmes.",

    // console message
    'lonlatAddError': "Add funkcijai reikia pateikti tiek lon, tiek lat reikšmes",

    // console message
    'pixelAddError': "Add funkcijai būtina perduoti tiek x, tiek y reikšmes.",

    // console message
    'unsupportedGeometryType': "Nepalaikomas geometrijos tipas: ${geomType}",

    // **** end ****
    'end': ''
    
});
