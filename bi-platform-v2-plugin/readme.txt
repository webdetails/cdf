This sub-project of CDF is designed as a Pentaho Platform 2.1 plugin.  See
the following doc for plugin API details:

http://wiki.pentaho.com/display/ServerDoc2x/BI+Platform+Plugins+in+V2

The goal of this project is to have CDF be a runtime drop-in to the BI Platform,
with zero changes to the webapp.

To build dist/pentaho-cdf.zip and dist/pentaho-cdf-samples.zip, run "ant dist".

The plugin must be installed in the pentaho-solutions/system/pentaho-cdf folder.

TODO:
- complete implementation of entire widget set (requires additional examples of widgets / etc)
- I18N .xcdf files 
- incorporate patched chart changes to the platform.
