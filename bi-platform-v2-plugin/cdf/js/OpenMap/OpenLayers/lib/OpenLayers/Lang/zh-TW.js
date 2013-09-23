/*! Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
* full list of contributors). Published under the Clear BSD license.
* See http://svn.openlayers.org/trunk/openlayers/license.txt for the
* full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["zh-TW"]
 * Dictionary for Traditional Chinese. (Used Mainly in Taiwan) 
 * Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */

OpenLayers.Lang["zh-TW"] = {

    'unhandledRequest': "未處�?�的請求，傳回值為 ${statusText}。",

    'Permalink': "永久連�?",

    'Overlays': "�?外圖層",

    'Base Layer': "基礎圖層",

    'readNotImplemented': "沒有實作讀�?�的功能。",

    'writeNotImplemented': "沒有實作寫入的功能。",

    'noFID': "因為沒有 FID 所以無法更新 feature。",

    'errorLoadingGML': "讀�?�GML檔案 ${url} 錯誤。",

    'browserNotSupported':
        "您的�?覽器未支�?��?��?渲染. 目�?支�?�的渲染方�?是:\n${renderers}",

    'componentShouldBe': "addFeatures : 元件應該為 ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent 在一個沒有被渲染的圖層裡被呼�?�。這通常�?味著您 " +
        "摧毀了一個圖層，但並未摧毀相關的handler。",

    // console message
    'minZoomLevelError':
        "minZoomLevel 屬性僅�?��?�用在 " +
        "FixedZoomLevels-descendent 類型的圖層. 這個" +
        "wfs layer 的 minZoomLevel 是�?�去所�?�留下來的，" +
        "然而我們�?能移除它而�?讓它將" +
        "�?�去的程�?相容性給破壞掉。" +
        "因此我們將會迴�?�使用它 -- minZoomLevel " +
        "會在3.0被移除，請改" +
        "用在這邊�??述的 min/max resolution 設定: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaction: �?功 ${response}",

    'commitFailed': "WFS Transaction: 失敗 ${response}",

    'googleWarning':
        "The Google Layer 圖層無法被正確的載入。<br><br>" +
        "�?迴�?�這個訊�?�, 請在�?�上角的圖層改變器裡，" +
        "�?�一個新的基礎圖層。<br><br>" +
        "很有�?�能是因為 Google Maps 的函�?庫" +
        "腳本沒有被正確的置入，或沒有包�?� " +
        "您網站上正確的 API key <br><br>" +
        "開發者: �?幫助這個行為正確完�?，" +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>請按這裡</a>",

    'getLayerWarning':
        "${layerType} 圖層無法被正確的載入。<br><br>" +
        "�?迴�?�這個訊�?�, 請在�?�上角的圖層改變器裡，" +
        "�?�一個新的基礎圖層。<br><br>" +
        "很有�?�能是因為 ${layerLib} 的函�?庫" +
        "腳本沒有被正確的置入。<br><br>" +
        "開發者: �?幫助這個行為正確完�?，" +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>請按這裡</a>",

    'Scale = 1 : ${scaleDenom}': "Scale = 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "你試著新增圖層: ${layerName} 到地圖上，但圖層之�?就已經被新增了。",

    // console message
    'reprojectDeprecated':
        "你正使用 'reproject' 這個�?�項 " +
        "在 ${layerName} 層。這個�?�項已經�?�?使用:" +
        "它的使用原本是設計用來支�?�在商業地圖上秀出資料，" + 
        "但這個功能已經被" +
        "Spherical Mercator所�?�代。更多的資訊�?�以在 " +
        "http://trac.openlayers.org/wiki/SphericalMercator 找到。",

    // console message
    'methodDeprecated':
        "這個方法已經�?�?使用且在3.0將會被移除，" +
        "請使用 ${newMethod} 來代替。",

    // console message
    'boundsAddError': "您必須傳入 x 跟 y 兩者的值進 add 函數。",

    // console message
    'lonlatAddError': "您必須傳入 lon 跟 lat 兩者的值進 add 函數。",

    // console message
    'pixelAddError': "您必須傳入 x 跟 y 兩者的值進 add 函數。",

    // console message
    'unsupportedGeometryType': "未支�?�的幾何型別: ${geomType}。",

    'end': ''
};
