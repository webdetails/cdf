/*! Copyright (c) 2006-2011 by OpenLayers Contributors (see authors.txt for
* full list of contributors). Published under the Clear BSD license.
* See http://svn.openlayers.org/trunk/openlayers/license.txt for the
* full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["zh-CN"]
 * Dictionary for Simplified Chinese.  Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.String.format> calls.
 */

OpenLayers.Lang["zh-CN"] = {

    'unhandledRequest': "未处�?�的请求，返回值为 ${statusText}",

    'Permalink': "永久链接",

    'Overlays': "�?�加层",

    'Base Layer': "基础图层",

    'readNotImplemented': "读�?�功能没有实现。",

    'writeNotImplemented': "写入功能没有实现。",

    'noFID': "无法更新feature，缺少FID。",

    'errorLoadingGML': "加载GML文件 ${url} 出现错误。",

    'browserNotSupported':
        "你使用的�?览器�?支�?矢�?渲染。当�?支�?的渲染方�?包括：\n${renderers}",

    'componentShouldBe': "addFeatures : 组件类型应该是 ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent方法在一个没有渲染器的图层上被调用。 这通常�?味�?�您" +
        "销�?了一个图层，但并未销�?其关�?�的handler。",

    // console message
    'minZoomLevelError':
        "minZoomLevel属性仅适�?�用于" +
        "使用了固定缩放级别的图层。这个 " +
        "wfs 图层检查 minZoomLevel 是过去�?�留下�?�的。" +
        "然而，我们�?能移除它，" +
        "而破�??�?赖于它的基于OL的应用程�?。" +
        "因此，我们废除了它 -- minZoomLevel " +
        "将会在3.0中被移除。请改用 " +
        "min/max resolution 设置，�?�考：" +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "WFS Transaction: �?功。 ${response}",

    'commitFailed': "WFS Transaction: 失败。 ${response}",

    'googleWarning':
        "Google图层�?能正确加载。<br><br>" +
        "�?消除这个信�?�，请在�?�上角的" +
        "图层控制�?��?�中选择其他的基础图层。<br><br>" +
        "这�?情况很�?�能是没有正确的包�?�Google地图脚本库，" +
        "或者是没有包�?�在你的站点上" +
        "使用的正确的Google Maps API密匙。<br><br>" +
        "开�?�者：获�?�使其正确工作的帮助信�?�，" +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>点击这里</a>",

    'getLayerWarning':
        "${layerType} 图层�?能正确加载。<br><br>" +
        "�?消除这个信�?�，请在�?�上角的" +
        "图层控制�?��?�中选择其他的基础图层。<br><br>" +
        "这�?情况很�?�能是没有正确的包�?�" +
        "${layerLib} 脚本库。<br><br>" +
        "开�?�者：获�?�使其正确工作的帮助信�?�，" +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>点击这里</a>",

    'Scale = 1 : ${scaleDenom}': "比例尺 = 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "你�?试添加图层： ${layerName} 到地图中，但是它之�?就已�?被添加。",

    // console message
    'reprojectDeprecated':
        "你正在使用 ${layerName} 图层上的'reproject'选项。" +
        "这个选项已�?�?�?使用：" +
        "它是被设计用�?�支�?显示商业的地图数�?�，" + 
        "�?过现在该功能�?�以通过使用Spherical Mercator�?�实现。" +
        "更多信�?��?�以�?�阅" +
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "该方法已�?�?�?被支�?，并且将在3.0中被移除。" +
        "请使用 ${newMethod} 方法�?�替代。",

    // console message
    'boundsAddError': "您必须传递 x 和 y 两个�?�数值到 add 方法。",

    // console message
    'lonlatAddError': "您必须传递 lon 和 lat 两个�?�数值到 add 方法。",

    // console message
    'pixelAddError': "您必须传递 x and y 两个�?�数值到 add 方法。",

    // console message
    'unsupportedGeometryType': "�?支�?的几何体类型： ${geomType}",

    'end': ''
};
