<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	version="2.0" xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40"
 xmlns:msg="org.pentaho.messages.Messages"
	xmlns:str_util="http://www.w3.org/2001/10/str-util.xsl"
 exclude-result-prefixes="o x ss html msg str_util">
<!--
	<xsl:import href="system/custom/xsl/str-util.xsl" />

	<xsl:include href="system/custom/xsl/xslUtil.xsl"/>
	<xsl:include href="system/custom/xsl/files-util.xsl"/> -->

	<xsl:output method="html" encoding="UTF-8" />

	<xsl:template match="files">
		<div id="dashboard_title" class="content_header"><xsl:value-of select="file/title"/></div>
		<div id="navsub">
			<xsl:for-each select="file/file[ @type='FILE.FOLDER']">
				<xsl:if test="@visible='true'">
					<a>
						<xsl:attribute name="id">
							<xsl:value-of select="path"/>
						</xsl:attribute>
						<xsl:attribute name="href">?dashboard=<xsl:value-of select="path"/></xsl:attribute>
						<xsl:value-of select="title"/>
					</a>
					<xsl:choose>
						<xsl:when test="position() = last()">
						</xsl:when>
						<xsl:otherwise>
							|
						</xsl:otherwise>
					</xsl:choose>
				</xsl:if>
			</xsl:for-each>
			<xsl:for-each select="file/file[ @type='FILE.FOLDER']">
			 	<xsl:if test="position() = 1">
					<script type="text/javascript">function emptyLoad(){ window.location='./Dashboards?dashboard=<xsl:value-of select="path"/>';}</script>
				</xsl:if>
			</xsl:for-each>
		</div>
	</xsl:template>
</xsl:stylesheet>