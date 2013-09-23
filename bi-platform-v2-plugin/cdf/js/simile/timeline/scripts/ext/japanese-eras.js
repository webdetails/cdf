/*!
* Copyright 2002 - 2013 Webdetails, a Pentaho company.  All rights reserved.
* 
* This software was developed by Webdetails and is provided under the terms
* of the Mozilla Public License, Version 2.0, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to  http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

﻿/*==================================================
 *  Japanese Era Date Labeller
 *==================================================
 */

Timeline.JapaneseEraDateLabeller = function(locale, timeZone, useRomanizedName) {
    var o = new Timeline.GregorianDateLabeller(locale, timeZone);
    
    o._useRomanizedName = (useRomanizedName);
    o._oldLabelInterval = o.labelInterval;
    o.labelInterval = Timeline.JapaneseEraDateLabeller._labelInterval;
    
    return o;
};

Timeline.JapaneseEraDateLabeller._labelInterval = function(date, intervalUnit) {
    var text;
    var emphasized = false;
    
    var date2 = Timeline.DateTime.removeTimeZoneOffset(date, this._timeZone);
    
    switch(intervalUnit) {
    case Timeline.DateTime.YEAR:
    case Timeline.DateTime.DECADE:
    case Timeline.DateTime.CENTURY:
    case Timeline.DateTime.MILLENNIUM:
        var y = date2.getUTCFullYear();
        if (y >= Timeline.JapaneseEraDateLabeller._eras.elementAt(0).startingYear) {
            var eraIndex = Timeline.JapaneseEraDateLabeller._eras.find(function(era) {
                    return era.startingYear - y;
                }
            );
            if (eraIndex < Timeline.JapaneseEraDateLabeller._eras.length()) {
                var era = Timeline.JapaneseEraDateLabeller._eras.elementAt(eraIndex);
                if (y < era.startingYear) {
                    era = Timeline.JapaneseEraDateLabeller._eras.elementAt(eraIndex - 1);
                }
            } else {
                var era = Timeline.JapaneseEraDateLabeller._eras.elementAt(eraIndex - 1);
            }
            
            text = (this._useRomanizedName ? era.romanizedName : era.japaneseName) + " " + (y - era.startingYear + 1);
            emphasized = intervalUnit == Timeline.DateTime.YEAR && y == era.startingYear;
            break;
        } // else, fall through
    default:
        return this._oldLabelInterval(date, intervalUnit);
    }
    
    return { text: text, emphasized: emphasized };
};

/*==================================================
 *  Japanese Era Ether Painter
 *==================================================
 */
 
Timeline.JapaneseEraEtherPainter = function(params, band, timeline) {
    this._params = params;
    this._theme = params.theme;
};

Timeline.JapaneseEraEtherPainter.prototype.initialize = function(band, timeline) {
    this._band = band;
    this._timeline = timeline;
    
    this._backgroundLayer = band.createLayerDiv(0);
    this._backgroundLayer.setAttribute("name", "ether-background"); // for debugging
    this._backgroundLayer.style.background = this._theme.ether.backgroundColors[band.getIndex()];
    
    this._markerLayer = null;
    this._lineLayer = null;
    
    var align = ("align" in this._params) ? this._params.align : 
        this._theme.ether.interval.marker[timeline.isHorizontal() ? "hAlign" : "vAlign"];
    var showLine = ("showLine" in this._params) ? this._params.showLine : 
        this._theme.ether.interval.line.show;
        
    this._intervalMarkerLayout = new Timeline.EtherIntervalMarkerLayout(
        this._timeline, this._band, this._theme, align, showLine);
        
    this._highlight = new Timeline.EtherHighlight(
        this._timeline, this._band, this._theme, this._backgroundLayer);
}

Timeline.JapaneseEraEtherPainter.prototype.setHighlight = function(startDate, endDate) {
    this._highlight.position(startDate, endDate);
}

Timeline.JapaneseEraEtherPainter.prototype.paint = function() {
    if (this._markerLayer) {
        this._band.removeLayerDiv(this._markerLayer);
    }
    this._markerLayer = this._band.createLayerDiv(100);
    this._markerLayer.setAttribute("name", "ether-markers"); // for debugging
    this._markerLayer.style.display = "none";
    
    if (this._lineLayer) {
        this._band.removeLayerDiv(this._lineLayer);
    }
    this._lineLayer = this._band.createLayerDiv(1);
    this._lineLayer.setAttribute("name", "ether-lines"); // for debugging
    this._lineLayer.style.display = "none";
    
    var minYear = this._band.getMinDate().getUTCFullYear();
    var maxYear = this._band.getMaxDate().getUTCFullYear();
    var eraIndex = Timeline.JapaneseEraDateLabeller._eras.find(function(era) {
            return era.startingYear - minYear;
        }
    );
    
    var l = Timeline.JapaneseEraDateLabeller._eras.length();
    for (var i = eraIndex; i < l; i++) {
        var era = Timeline.JapaneseEraDateLabeller._eras.elementAt(i);
        if (era.startingYear > maxYear) {
            break;
        }
        
        var d = new Date(0);
        d.setUTCFullYear(era.startingYear);
        
        var labeller = {
            labelInterval: function(date, intervalUnit) {
                return {
                    text: era.japaneseName,
                    emphasized: true
                };
            }
        };
        
        this._intervalMarkerLayout.createIntervalMarker(
            d, labeller, Timeline.DateTime.YEAR, this._markerLayer, this._lineLayer);
    }
    this._markerLayer.style.display = "block";
    this._lineLayer.style.display = "block";
};

Timeline.JapaneseEraEtherPainter.prototype.softPaint = function() {
};


Timeline.JapaneseEraDateLabeller._eras = new Timeline.SortedArray(
    function(e1, e2) {
        return e1.startingYear - e2.startingYear;
    },
    [
        { startingYear: 645, japaneseName: '大化', romanizedName: "Taika" },
        { startingYear: 650, japaneseName: '白雉', romanizedName: "Hakuchi" },
        { startingYear: 686, japaneseName: '朱鳥', romanizedName: "Shuch�?" },
        { startingYear: 701, japaneseName: '大�?', romanizedName: "Taih�?" },
        { startingYear: 704, japaneseName: '慶雲', romanizedName: "Keiun" },
        { startingYear: 708, japaneseName: '和銅', romanizedName: "Wad�?" },
        { startingYear: 715, japaneseName: '霊亀', romanizedName: "Reiki" },
        { startingYear: 717, japaneseName: '養�?', romanizedName: "Y�?r�?" },
        { startingYear: 724, japaneseName: '神亀', romanizedName: "Jinki" },
        { startingYear: 729, japaneseName: '天平', romanizedName: "Tenpy�?" },
        { startingYear: 749, japaneseName: '天平感�?', romanizedName: "Tenpy�?-kanp�?" },
        { startingYear: 749, japaneseName: '天平�?�?', romanizedName: "Tenpy�?-sh�?h�?" },
        { startingYear: 757, japaneseName: '天平�?字', romanizedName: "Tenpy�?-h�?ji" },
        { startingYear: 765, japaneseName: '天平神護', romanizedName: "Tenpy�?-jingo" },
        { startingYear: 767, japaneseName: '神護景雲', romanizedName: "Jingo-keiun" },
        { startingYear: 770, japaneseName: '�?亀', romanizedName: "H�?ki" },
        { startingYear: 781, japaneseName: '天応', romanizedName: "Ten'�?" },
        { startingYear: 782, japaneseName: '延暦', romanizedName: "Enryaku" },
        { startingYear: 806, japaneseName: '大�?�', romanizedName: "Daid�?" },
        { startingYear: 810, japaneseName: '弘�?', romanizedName: "K�?nin" },
        { startingYear: 824, japaneseName: '天長', romanizedName: "Tench�?" },
        { startingYear: 834, japaneseName: '承和', romanizedName: "J�?wa" },
        { startingYear: 848, japaneseName: '嘉祥', romanizedName: "Kaj�?" },
        { startingYear: 851, japaneseName: '�?寿', romanizedName: "Ninju" },
        { startingYear: 854, japaneseName: '斉衡', romanizedName: "Saik�?" },
        { startingYear: 857, japaneseName: '天安', romanizedName: "Tennan" },
        { startingYear: 859, japaneseName: '貞観', romanizedName: "J�?gan" },
        { startingYear: 877, japaneseName: '元慶', romanizedName: "Gangy�?" },
        { startingYear: 885, japaneseName: '�?和', romanizedName: "Ninna" },
        { startingYear: 889, japaneseName: '寛平', romanizedName: "Kanpy�?" },
        { startingYear: 898, japaneseName: '昌泰', romanizedName: "Sh�?tai" },
        { startingYear: 901, japaneseName: '延喜', romanizedName: "Engi" },
        { startingYear: 923, japaneseName: '延長', romanizedName: "Ench�?" },
        { startingYear: 931, japaneseName: '承平', romanizedName: "J�?hei" },
        { startingYear: 938, japaneseName: '天慶', romanizedName: "Tengy�?" },
        { startingYear: 947, japaneseName: '天暦', romanizedName: "Tenryaku" },
        { startingYear: 957, japaneseName: '天徳', romanizedName: "Tentoku" },
        { startingYear: 961, japaneseName: '応和', romanizedName: "Ōwa" },
        { startingYear: 964, japaneseName: '康�?', romanizedName: "K�?h�?" },
        { startingYear: 968, japaneseName: '安和', romanizedName: "Anna" },
        { startingYear: 970, japaneseName: '天禄', romanizedName: "Tenroku" },
        { startingYear: 973, japaneseName: '天延', romanizedName: "Ten'en" },
        { startingYear: 976, japaneseName: '貞元', romanizedName: "J�?gen" },
        { startingYear: 978, japaneseName: '天元', romanizedName: "Tengen" },
        { startingYear: 983, japaneseName: '永観', romanizedName: "Eikan" },
        { startingYear: 985, japaneseName: '寛和', romanizedName: "Kanna" },
        { startingYear: 987, japaneseName: '永延', romanizedName: "Eien" },
        { startingYear: 988, japaneseName: '永祚', romanizedName: "Eiso" },
        { startingYear: 990, japaneseName: '正暦', romanizedName: "Sh�?ryaku" },
        { startingYear: 995, japaneseName: '長徳', romanizedName: "Ch�?toku" },
        { startingYear: 999, japaneseName: '長�?', romanizedName: "Ch�?h�?" },
        { startingYear: 1004, japaneseName: '寛弘', romanizedName: "Kank�?" },
        { startingYear: 1012, japaneseName: '長和', romanizedName: "Ch�?wa" },
        { startingYear: 1017, japaneseName: '寛�?', romanizedName: "Kannin" },
        { startingYear: 1021, japaneseName: '治安', romanizedName: "Jian" },
        { startingYear: 1024, japaneseName: '万寿', romanizedName: "Manju" },
        { startingYear: 1028, japaneseName: '長元', romanizedName: "Ch�?gen" },
        { startingYear: 1037, japaneseName: '長暦', romanizedName: "Ch�?ryaku" },
        { startingYear: 1040, japaneseName: '長久', romanizedName: "Ch�?kyū" },
        { startingYear: 1044, japaneseName: '寛徳', romanizedName: "Kantoku" },
        { startingYear: 1046, japaneseName: '永承', romanizedName: "Eish�?" },
        { startingYear: 1053, japaneseName: '天喜', romanizedName: "Tengi" },
        { startingYear: 1058, japaneseName: '康平', romanizedName: "K�?hei" },
        { startingYear: 1065, japaneseName: '治暦', romanizedName: "Jiryaku" },
        { startingYear: 1069, japaneseName: '延久', romanizedName: "Enkyū" },
        { startingYear: 1074, japaneseName: '承�?', romanizedName: "J�?h�?" },
        { startingYear: 1077, japaneseName: '承暦', romanizedName: "J�?ryaku" },
        { startingYear: 1081, japaneseName: '永�?', romanizedName: "Eih�?" },
        { startingYear: 1084, japaneseName: '応徳', romanizedName: "Ōtoku" },
        { startingYear: 1087, japaneseName: '寛治', romanizedName: "Kanji" },
        { startingYear: 1094, japaneseName: '嘉�?', romanizedName: "Kah�?" },
        { startingYear: 1096, japaneseName: '永長', romanizedName: "Eich�?" },
        { startingYear: 1097, japaneseName: '承徳', romanizedName: "J�?toku" },
        { startingYear: 1099, japaneseName: '康和', romanizedName: "K�?wa" },
        { startingYear: 1104, japaneseName: '長治', romanizedName: "Ch�?ji" },
        { startingYear: 1106, japaneseName: '嘉承', romanizedName: "Kaj�?" },
        { startingYear: 1108, japaneseName: '天�?', romanizedName: "Tennin" },
        { startingYear: 1110, japaneseName: '天永', romanizedName: "Ten'ei" },
        { startingYear: 1113, japaneseName: '永久', romanizedName: "Eikyū" },
        { startingYear: 1118, japaneseName: '元永', romanizedName: "Gen'ei" },
        { startingYear: 1120, japaneseName: '�?安', romanizedName: "H�?an" },
        { startingYear: 1124, japaneseName: '天治', romanizedName: "Tenji" },
        { startingYear: 1126, japaneseName: '大治', romanizedName: "Daiji" },
        { startingYear: 1131, japaneseName: '天承', romanizedName: "Tensh�?" },
        { startingYear: 1132, japaneseName: '長承', romanizedName: "Ch�?sh�?" },
        { startingYear: 1135, japaneseName: '�?延', romanizedName: "H�?en" },
        { startingYear: 1141, japaneseName: '永治', romanizedName: "Eiji" },
        { startingYear: 1142, japaneseName: '康治', romanizedName: "K�?ji" },
        { startingYear: 1144, japaneseName: '天養', romanizedName: "Ten'y�?" },
        { startingYear: 1145, japaneseName: '久安', romanizedName: "Kyūan" },
        { startingYear: 1151, japaneseName: '�?平', romanizedName: "Ninpei" },
        { startingYear: 1154, japaneseName: '久寿', romanizedName: "Kyūju" },
        { startingYear: 1156, japaneseName: '�?元', romanizedName: "H�?gen" },
        { startingYear: 1159, japaneseName: '平治', romanizedName: "Heiji" },
        { startingYear: 1160, japaneseName: '永暦', romanizedName: "Eiryaku" },
        { startingYear: 1161, japaneseName: '応�?', romanizedName: "Ōh�?" },
        { startingYear: 1163, japaneseName: '長寛', romanizedName: "Ch�?kan" },
        { startingYear: 1165, japaneseName: '永万', romanizedName: "Eiman" },
        { startingYear: 1166, japaneseName: '�?安', romanizedName: "Ninnan" },
        { startingYear: 1169, japaneseName: '嘉応', romanizedName: "Ka�?" },
        { startingYear: 1171, japaneseName: '承安', romanizedName: "J�?an" },
        { startingYear: 1175, japaneseName: '安元', romanizedName: "Angen" },
        { startingYear: 1177, japaneseName: '治承', romanizedName: "Jish�?" },
        { startingYear: 1181, japaneseName: '養和', romanizedName: "Y�?wa" },
        { startingYear: 1182, japaneseName: '寿永', romanizedName: "Juei" },
        { startingYear: 1184, japaneseName: '元暦', romanizedName: "Genryaku" },
        { startingYear: 1185, japaneseName: '文治', romanizedName: "Bunji" },
        { startingYear: 1190, japaneseName: '建久', romanizedName: "Kenkyū" },
        { startingYear: 1199, japaneseName: '正治', romanizedName: "Sh�?ji" },
        { startingYear: 1201, japaneseName: '建�?', romanizedName: "Kennin" },
        { startingYear: 1204, japaneseName: '元久', romanizedName: "Genkyū" },
        { startingYear: 1206, japaneseName: '建永', romanizedName: "Ken'ei" },
        { startingYear: 1207, japaneseName: '承元', romanizedName: "J�?gen" },
        { startingYear: 1211, japaneseName: '建暦', romanizedName: "Kenryaku" },
        { startingYear: 1213, japaneseName: '建�?', romanizedName: "Kenp�?" },
        { startingYear: 1219, japaneseName: '承久', romanizedName: "J�?kyū" },
        { startingYear: 1222, japaneseName: '貞応', romanizedName: "J�?�?" },
        { startingYear: 1224, japaneseName: '元�?', romanizedName: "Gennin" },
        { startingYear: 1225, japaneseName: '嘉禄', romanizedName: "Karoku" },
        { startingYear: 1227, japaneseName: '安貞', romanizedName: "Antei" },
        { startingYear: 1229, japaneseName: '寛喜', romanizedName: "Kanki" },
        { startingYear: 1232, japaneseName: '貞永', romanizedName: "J�?ei" },
        { startingYear: 1233, japaneseName: '天�?', romanizedName: "Tenpuku" },
        { startingYear: 1234, japaneseName: '文暦', romanizedName: "Bunryaku" },
        { startingYear: 1235, japaneseName: '嘉禎', romanizedName: "Katei" },
        { startingYear: 1238, japaneseName: '暦�?', romanizedName: "Ryakunin" },
        { startingYear: 1239, japaneseName: '延応', romanizedName: "En'�?" },
        { startingYear: 1240, japaneseName: '�?治', romanizedName: "Ninji" },
        { startingYear: 1243, japaneseName: '寛元', romanizedName: "Kangen" },
        { startingYear: 1247, japaneseName: '�?治', romanizedName: "H�?ji" },
        { startingYear: 1249, japaneseName: '建長', romanizedName: "Kench�?" },
        { startingYear: 1256, japaneseName: '康元', romanizedName: "K�?gen" },
        { startingYear: 1257, japaneseName: '正嘉', romanizedName: "Sh�?ka" },
        { startingYear: 1259, japaneseName: '正元', romanizedName: "Sh�?gen" },
        { startingYear: 1260, japaneseName: '文応', romanizedName: "Bun'�?" },
        { startingYear: 1261, japaneseName: '弘長', romanizedName: "K�?cho" },
        { startingYear: 1264, japaneseName: '文永', romanizedName: "Bun'ei" },
        { startingYear: 1275, japaneseName: '建治', romanizedName: "Kenji" },
        { startingYear: 1278, japaneseName: '弘安', romanizedName: "K�?an" },
        { startingYear: 1288, japaneseName: '正応', romanizedName: "Sh�?�?" },
        { startingYear: 1293, japaneseName: '永�?', romanizedName: "Einin" },
        { startingYear: 1299, japaneseName: '正安', romanizedName: "Sh�?an" },
        { startingYear: 1302, japaneseName: '乾元', romanizedName: "Kengen" },
        { startingYear: 1303, japaneseName: '嘉元', romanizedName: "Kagen" },
        { startingYear: 1306, japaneseName: '徳治', romanizedName: "Tokuji" },
        { startingYear: 1308, japaneseName: '延慶', romanizedName: "Enkei" },
        { startingYear: 1311, japaneseName: '応長', romanizedName: "Ōch�?" },
        { startingYear: 1312, japaneseName: '正和', romanizedName: "Sh�?wa" },
        { startingYear: 1317, japaneseName: '文�?', romanizedName: "Bunp�?" },
        { startingYear: 1319, japaneseName: '元応', romanizedName: "Gen'�?" },
        { startingYear: 1321, japaneseName: '元亨', romanizedName: "Genky�?" },
        { startingYear: 1324, japaneseName: '正中', romanizedName: "Sh�?chū" },
        { startingYear: 1326, japaneseName: '嘉暦', romanizedName: "Karyaku" },
        { startingYear: 1329, japaneseName: '元徳', romanizedName: "Gentoku" },
        { startingYear: 1331, japaneseName: '元弘', romanizedName: "Genk�?" },
        { startingYear: 1334, japaneseName: '建武', romanizedName: "Kenmu" },
        { startingYear: 1336, japaneseName: '延元', romanizedName: "Engen" },
        { startingYear: 1340, japaneseName: '興国', romanizedName: "K�?koku" },
        { startingYear: 1346, japaneseName: '正平', romanizedName: "Sh�?hei" },
        { startingYear: 1370, japaneseName: '建徳', romanizedName: "Kentoku" },
        { startingYear: 1372, japaneseName: '文中', romanizedName: "Bunchū" },
        { startingYear: 1375, japaneseName: '天授', romanizedName: "Tenju" },
        { startingYear: 1381, japaneseName: '弘和', romanizedName: "K�?wa" },
        { startingYear: 1384, japaneseName: '元中', romanizedName: "Genchū" },
        { startingYear: 1332, japaneseName: '正慶', romanizedName: "Sh�?kei" },
        { startingYear: 1338, japaneseName: '暦応', romanizedName: "Ryaku�?" },
        { startingYear: 1342, japaneseName: '康永', romanizedName: "K�?ei" },
        { startingYear: 1345, japaneseName: '貞和', romanizedName: "J�?wa" },
        { startingYear: 1350, japaneseName: '観応', romanizedName: "Kan'�?" },
        { startingYear: 1352, japaneseName: '文和', romanizedName: "Bunna" },
        { startingYear: 1356, japaneseName: '延文', romanizedName: "Enbun" },
        { startingYear: 1361, japaneseName: '康安', romanizedName: "K�?an" },
        { startingYear: 1362, japaneseName: '貞治', romanizedName: "J�?ji" },
        { startingYear: 1368, japaneseName: '応安', romanizedName: "Ōan" },
        { startingYear: 1375, japaneseName: '永和', romanizedName: "Eiwa" },
        { startingYear: 1379, japaneseName: '康暦', romanizedName: "K�?ryaku" },
        { startingYear: 1381, japaneseName: '永徳', romanizedName: "Eitoku" },
        { startingYear: 1384, japaneseName: '至徳', romanizedName: "Shitoku" },
        { startingYear: 1387, japaneseName: '嘉慶', romanizedName: "Kakei" },
        { startingYear: 1389, japaneseName: '康応', romanizedName: "K�?�?" },
        { startingYear: 1390, japaneseName: '明徳', romanizedName: "Meitoku" },
        { startingYear: 1394, japaneseName: '応永', romanizedName: "Ōei" },
        { startingYear: 1428, japaneseName: '正長', romanizedName: "Sh�?ch�?" },
        { startingYear: 1429, japaneseName: '永享', romanizedName: "Eiky�?" },
        { startingYear: 1441, japaneseName: '嘉�?�', romanizedName: "Kakitsu" },
        { startingYear: 1444, japaneseName: '文安', romanizedName: "Bunnan" },
        { startingYear: 1449, japaneseName: '�?徳', romanizedName: "H�?toku" },
        { startingYear: 1452, japaneseName: '享徳', romanizedName: "Ky�?toku" },
        { startingYear: 1455, japaneseName: '康正', romanizedName: "K�?sh�?" },
        { startingYear: 1457, japaneseName: '長禄', romanizedName: "Ch�?roku" },
        { startingYear: 1460, japaneseName: '寛正', romanizedName: "Kansh�?" },
        { startingYear: 1466, japaneseName: '文正', romanizedName: "Bunsh�?" },
        { startingYear: 1467, japaneseName: '応�?', romanizedName: "Ōnin" },
        { startingYear: 1469, japaneseName: '文明', romanizedName: "Bunmei" },
        { startingYear: 1487, japaneseName: '長享', romanizedName: "Ch�?ky�?" },
        { startingYear: 1489, japaneseName: '延徳', romanizedName: "Entoku" },
        { startingYear: 1492, japaneseName: '明応', romanizedName: "Mei�?" },
        { startingYear: 1501, japaneseName: '文亀', romanizedName: "Bunki" },
        { startingYear: 1504, japaneseName: '永正', romanizedName: "Eish�?" },
        { startingYear: 1521, japaneseName: '大永', romanizedName: "Daiei" },
        { startingYear: 1528, japaneseName: '享禄', romanizedName: "Ky�?roku" },
        { startingYear: 1532, japaneseName: '天文', romanizedName: "Tenbun" },
        { startingYear: 1555, japaneseName: '弘治', romanizedName: "K�?ji" },
        { startingYear: 1558, japaneseName: '永禄', romanizedName: "Eiroku" },
        { startingYear: 1570, japaneseName: '元亀', romanizedName: "Genki" },
        { startingYear: 1573, japaneseName: '天正', romanizedName: "Tensh�?" },
        { startingYear: 1592, japaneseName: '文禄', romanizedName: "Bunroku" },
        { startingYear: 1596, japaneseName: '慶長', romanizedName: "Keich�?" },
        { startingYear: 1615, japaneseName: '元和', romanizedName: "Genna" },
        { startingYear: 1624, japaneseName: '寛永', romanizedName: "Kan'ei" },
        { startingYear: 1644, japaneseName: '正�?', romanizedName: "Sh�?h�?" },
        { startingYear: 1648, japaneseName: '慶安', romanizedName: "Keian" },
        { startingYear: 1652, japaneseName: '承応', romanizedName: "J�?�?" },
        { startingYear: 1655, japaneseName: '明暦', romanizedName: "Meireki" },
        { startingYear: 1658, japaneseName: '万治', romanizedName: "Manji" },
        { startingYear: 1661, japaneseName: '寛文', romanizedName: "Kanbun" },
        { startingYear: 1673, japaneseName: '延�?', romanizedName: "Enp�?" },
        { startingYear: 1681, japaneseName: '天和', romanizedName: "Tenna" },
        { startingYear: 1684, japaneseName: '貞享', romanizedName: "J�?ky�?" },
        { startingYear: 1688, japaneseName: '元禄', romanizedName: "Genroku" },
        { startingYear: 1704, japaneseName: '�?永', romanizedName: "H�?ei" },
        { startingYear: 1711, japaneseName: '正徳', romanizedName: "Sh�?toku" },
        { startingYear: 1716, japaneseName: '享�?', romanizedName: "Ky�?h�?" },
        { startingYear: 1736, japaneseName: '元文', romanizedName: "Genbun" },
        { startingYear: 1741, japaneseName: '寛�?', romanizedName: "Kanp�?" },
        { startingYear: 1744, japaneseName: '延享', romanizedName: "Enky�?" },
        { startingYear: 1748, japaneseName: '寛延', romanizedName: "Kan'en" },
        { startingYear: 1751, japaneseName: '�?暦', romanizedName: "H�?reki" },
        { startingYear: 1764, japaneseName: '明和', romanizedName: "Meiwa" },
        { startingYear: 1772, japaneseName: '安永', romanizedName: "An'ei" },
        { startingYear: 1781, japaneseName: '天明', romanizedName: "Tenmei" },
        { startingYear: 1789, japaneseName: '寛政', romanizedName: "Kansei" },
        { startingYear: 1801, japaneseName: '享和', romanizedName: "Ky�?wa" },
        { startingYear: 1804, japaneseName: '文化', romanizedName: "Bunka" },
        { startingYear: 1818, japaneseName: '文政', romanizedName: "Bunsei" },
        { startingYear: 1830, japaneseName: '天�?', romanizedName: "Tenp�?" },
        { startingYear: 1844, japaneseName: '弘化', romanizedName: "K�?ka" },
        { startingYear: 1848, japaneseName: '嘉永', romanizedName: "Kaei" },
        { startingYear: 1854, japaneseName: '安政', romanizedName: "Ansei" },
        { startingYear: 1860, japaneseName: '万延', romanizedName: "Man'en" },
        { startingYear: 1861, japaneseName: '文久', romanizedName: "Bunkyū" },
        { startingYear: 1864, japaneseName: '元治', romanizedName: "Genji" },
        { startingYear: 1865, japaneseName: '慶応', romanizedName: "Kei�?" },
        { startingYear: 1868, japaneseName: '明治', romanizedName: "Meiji" },
        { startingYear: 1912, japaneseName: '大正', romanizedName: "Taish�?" },
        { startingYear: 1926, japaneseName: '昭和', romanizedName: "Sh�?wa" },
        { startingYear: 1989, japaneseName: '平�?', romanizedName: "Heisei" }
    ]
);
