/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2029-07-20
 ******************************************************************************/


/*==================================================
 *  HTML Utility Functions
 *==================================================
 */

SimileAjax.HTML = new Object();

SimileAjax.HTML._e2uHash = {};
(function() {
    var e2uHash = SimileAjax.HTML._e2uHash;
    e2uHash['nbsp']= '\u00A0[space]';
    e2uHash['iexcl']= '\u00A1';
    e2uHash['cent']= '\u00A2';
    e2uHash['pound']= '\u00A3';
    e2uHash['curren']= '\u00A4';
    e2uHash['yen']= '\u00A5';
    e2uHash['brvbar']= '\u00A6';
    e2uHash['sect']= '\u00A7';
    e2uHash['uml']= '\u00A8';
    e2uHash['copy']= '\u00A9';
    e2uHash['ordf']= '\u00AA';
    e2uHash['laquo']= '\u00AB';
    e2uHash['not']= '\u00AC';
    e2uHash['shy']= '\u00AD';
    e2uHash['reg']= '\u00AE';
    e2uHash['macr']= '\u00AF';
    e2uHash['deg']= '\u00B0';
    e2uHash['plusmn']= '\u00B1';
    e2uHash['sup2']= '\u00B2';
    e2uHash['sup3']= '\u00B3';
    e2uHash['acute']= '\u00B4';
    e2uHash['micro']= '\u00B5';
    e2uHash['para']= '\u00B6';
    e2uHash['middot']= '\u00B7';
    e2uHash['cedil']= '\u00B8';
    e2uHash['sup1']= '\u00B9';
    e2uHash['ordm']= '\u00BA';
    e2uHash['raquo']= '\u00BB';
    e2uHash['frac14']= '\u00BC';
    e2uHash['frac12']= '\u00BD';
    e2uHash['frac34']= '\u00BE';
    e2uHash['iquest']= '\u00BF';
    e2uHash['Agrave']= '\u00C0';
    e2uHash['Aacute']= '\u00C1';
    e2uHash['Acirc']= '\u00C2';
    e2uHash['Atilde']= '\u00C3';
    e2uHash['Auml']= '\u00C4';
    e2uHash['Aring']= '\u00C5';
    e2uHash['AElig']= '\u00C6';
    e2uHash['Ccedil']= '\u00C7';
    e2uHash['Egrave']= '\u00C8';
    e2uHash['Eacute']= '\u00C9';
    e2uHash['Ecirc']= '\u00CA';
    e2uHash['Euml']= '\u00CB';
    e2uHash['Igrave']= '\u00CC';
    e2uHash['Iacute']= '\u00CD';
    e2uHash['Icirc']= '\u00CE';
    e2uHash['Iuml']= '\u00CF';
    e2uHash['ETH']= '\u00D0';
    e2uHash['Ntilde']= '\u00D1';
    e2uHash['Ograve']= '\u00D2';
    e2uHash['Oacute']= '\u00D3';
    e2uHash['Ocirc']= '\u00D4';
    e2uHash['Otilde']= '\u00D5';
    e2uHash['Ouml']= '\u00D6';
    e2uHash['times']= '\u00D7';
    e2uHash['Oslash']= '\u00D8';
    e2uHash['Ugrave']= '\u00D9';
    e2uHash['Uacute']= '\u00DA';
    e2uHash['Ucirc']= '\u00DB';
    e2uHash['Uuml']= '\u00DC';
    e2uHash['Yacute']= '\u00DD';
    e2uHash['THORN']= '\u00DE';
    e2uHash['szlig']= '\u00DF';
    e2uHash['agrave']= '\u00E0';
    e2uHash['aacute']= '\u00E1';
    e2uHash['acirc']= '\u00E2';
    e2uHash['atilde']= '\u00E3';
    e2uHash['auml']= '\u00E4';
    e2uHash['aring']= '\u00E5';
    e2uHash['aelig']= '\u00E6';
    e2uHash['ccedil']= '\u00E7';
    e2uHash['egrave']= '\u00E8';
    e2uHash['eacute']= '\u00E9';
    e2uHash['ecirc']= '\u00EA';
    e2uHash['euml']= '\u00EB';
    e2uHash['igrave']= '\u00EC';
    e2uHash['iacute']= '\u00ED';
    e2uHash['icirc']= '\u00EE';
    e2uHash['iuml']= '\u00EF';
    e2uHash['eth']= '\u00F0';
    e2uHash['ntilde']= '\u00F1';
    e2uHash['ograve']= '\u00F2';
    e2uHash['oacute']= '\u00F3';
    e2uHash['ocirc']= '\u00F4';
    e2uHash['otilde']= '\u00F5';
    e2uHash['ouml']= '\u00F6';
    e2uHash['divide']= '\u00F7';
    e2uHash['oslash']= '\u00F8';
    e2uHash['ugrave']= '\u00F9';
    e2uHash['uacute']= '\u00FA';
    e2uHash['ucirc']= '\u00FB';
    e2uHash['uuml']= '\u00FC';
    e2uHash['yacute']= '\u00FD';
    e2uHash['thorn']= '\u00FE';
    e2uHash['yuml']= '\u00FF';
    e2uHash['quot']= '\u0022';
    e2uHash['amp']= '\u0026';
    e2uHash['lt']= '\u003C';
    e2uHash['gt']= '\u003E';
    e2uHash['OElig']= '';
    e2uHash['oelig']= '\u0153';
    e2uHash['Scaron']= '\u0160';
    e2uHash['scaron']= '\u0161';
    e2uHash['Yuml']= '\u0178';
    e2uHash['circ']= '\u02C6';
    e2uHash['tilde']= '\u02DC';
    e2uHash['ensp']= '\u2002';
    e2uHash['emsp']= '\u2003';
    e2uHash['thinsp']= '\u2009';
    e2uHash['zwnj']= '\u200C';
    e2uHash['zwj']= '\u200D';
    e2uHash['lrm']= '\u200E';
    e2uHash['rlm']= '\u200F';
    e2uHash['ndash']= '\u2013';
    e2uHash['mdash']= '\u2014';
    e2uHash['lsquo']= '\u2018';
    e2uHash['rsquo']= '\u2019';
    e2uHash['sbquo']= '\u201A';
    e2uHash['ldquo']= '\u201C';
    e2uHash['rdquo']= '\u201D';
    e2uHash['bdquo']= '\u201E';
    e2uHash['dagger']= '\u2020';
    e2uHash['Dagger']= '\u2021';
    e2uHash['permil']= '\u2030';
    e2uHash['lsaquo']= '\u2039';
    e2uHash['rsaquo']= '\u203A';
    e2uHash['euro']= '\u20AC';
    e2uHash['fnof']= '\u0192';
    e2uHash['Alpha']= '\u0391';
    e2uHash['Beta']= '\u0392';
    e2uHash['Gamma']= '\u0393';
    e2uHash['Delta']= '\u0394';
    e2uHash['Epsilon']= '\u0395';
    e2uHash['Zeta']= '\u0396';
    e2uHash['Eta']= '\u0397';
    e2uHash['Theta']= '\u0398';
    e2uHash['Iota']= '\u0399';
    e2uHash['Kappa']= '\u039A';
    e2uHash['Lambda']= '\u039B';
    e2uHash['Mu']= '\u039C';
    e2uHash['Nu']= '\u039D';
    e2uHash['Xi']= '\u039E';
    e2uHash['Omicron']= '\u039F';
    e2uHash['Pi']= '\u03A0';
    e2uHash['Rho']= '\u03A1';
    e2uHash['Sigma']= '\u03A3';
    e2uHash['Tau']= '\u03A4';
    e2uHash['Upsilon']= '\u03A5';
    e2uHash['Phi']= '\u03A6';
    e2uHash['Chi']= '\u03A7';
    e2uHash['Psi']= '\u03A8';
    e2uHash['Omega']= '\u03A9';
    e2uHash['alpha']= '\u03B1';
    e2uHash['beta']= '\u03B2';
    e2uHash['gamma']= '\u03B3';
    e2uHash['delta']= '\u03B4';
    e2uHash['epsilon']= '\u03B5';
    e2uHash['zeta']= '\u03B6';
    e2uHash['eta']= '\u03B7';
    e2uHash['theta']= '\u03B8';
    e2uHash['iota']= '\u03B9';
    e2uHash['kappa']= '\u03BA';
    e2uHash['lambda']= '\u03BB';
    e2uHash['mu']= '\u03BC';
    e2uHash['nu']= '\u03BD';
    e2uHash['xi']= '\u03BE';
    e2uHash['omicron']= '\u03BF';
    e2uHash['pi']= '\u03C0';
    e2uHash['rho']= '\u03C1';
    e2uHash['sigmaf']= '\u03C2';
    e2uHash['sigma']= '\u03C3';
    e2uHash['tau']= '\u03C4';
    e2uHash['upsilon']= '\u03C5';
    e2uHash['phi']= '\u03C6';
    e2uHash['chi']= '\u03C7';
    e2uHash['psi']= '\u03C8';
    e2uHash['omega']= '\u03C9';
    e2uHash['thetasym']= '\u03D1';
    e2uHash['upsih']= '\u03D2';
    e2uHash['piv']= '\u03D6';
    e2uHash['bull']= '\u2022';
    e2uHash['hellip']= '\u2026';
    e2uHash['prime']= '\u2032';
    e2uHash['Prime']= '\u2033';
    e2uHash['oline']= '\u203E';
    e2uHash['frasl']= '\u2044';
    e2uHash['weierp']= '\u2118';
    e2uHash['image']= '\u2111';
    e2uHash['real']= '\u211C';
    e2uHash['trade']= '\u2122';
    e2uHash['alefsym']= '\u2135';
    e2uHash['larr']= '\u2190';
    e2uHash['uarr']= '\u2191';
    e2uHash['rarr']= '\u2192';
    e2uHash['darr']= '\u2193';
    e2uHash['harr']= '\u2194';
    e2uHash['crarr']= '\u21B5';
    e2uHash['lArr']= '\u21D0';
    e2uHash['uArr']= '\u21D1';
    e2uHash['rArr']= '\u21D2';
    e2uHash['dArr']= '\u21D3';
    e2uHash['hArr']= '\u21D4';
    e2uHash['forall']= '\u2200';
    e2uHash['part']= '\u2202';
    e2uHash['exist']= '\u2203';
    e2uHash['empty']= '\u2205';
    e2uHash['nabla']= '\u2207';
    e2uHash['isin']= '\u2208';
    e2uHash['notin']= '\u2209';
    e2uHash['ni']= '\u220B';
    e2uHash['prod']= '\u220F';
    e2uHash['sum']= '\u2211';
    e2uHash['minus']= '\u2212';
    e2uHash['lowast']= '\u2217';
    e2uHash['radic']= '\u221A';
    e2uHash['prop']= '\u221D';
    e2uHash['infin']= '\u221E';
    e2uHash['ang']= '\u2220';
    e2uHash['and']= '\u2227';
    e2uHash['or']= '\u2228';
    e2uHash['cap']= '\u2229';
    e2uHash['cup']= '\u222A';
    e2uHash['int']= '\u222B';
    e2uHash['there4']= '\u2234';
    e2uHash['sim']= '\u223C';
    e2uHash['cong']= '\u2245';
    e2uHash['asymp']= '\u2248';
    e2uHash['ne']= '\u2260';
    e2uHash['equiv']= '\u2261';
    e2uHash['le']= '\u2264';
    e2uHash['ge']= '\u2265';
    e2uHash['sub']= '\u2282';
    e2uHash['sup']= '\u2283';
    e2uHash['nsub']= '\u2284';
    e2uHash['sube']= '\u2286';
    e2uHash['supe']= '\u2287';
    e2uHash['oplus']= '\u2295';
    e2uHash['otimes']= '\u2297';
    e2uHash['perp']= '\u22A5';
    e2uHash['sdot']= '\u22C5';
    e2uHash['lceil']= '\u2308';
    e2uHash['rceil']= '\u2309';
    e2uHash['lfloor']= '\u230A';
    e2uHash['rfloor']= '\u230B';
    e2uHash['lang']= '\u2329';
    e2uHash['rang']= '\u232A';
    e2uHash['loz']= '\u25CA';
    e2uHash['spades']= '\u2660';
    e2uHash['clubs']= '\u2663';
    e2uHash['hearts']= '\u2665';
    e2uHash['diams']= '\u2666'; 
})();

SimileAjax.HTML.deEntify = function(s) {
    var e2uHash = SimileAjax.HTML._e2uHash;
    
    var re = /&(\w+?);/;
    while (re.test(s)) {
        var m = s.match(re);
        s = s.replace(re, e2uHash[m[1]]);
    }
    return s;
};
