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


package org.pentaho.cdf.packager;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.pentaho.cdf.CdfConstants;
import org.pentaho.cdf.environment.packager.ICdfHeadersProvider;

import pt.webdetails.cpf.PluginEnvironment;
import pt.webdetails.cpf.context.api.IUrlProvider;
import pt.webdetails.cpf.packager.DependenciesPackage;
import pt.webdetails.cpf.packager.DependenciesPackage.PackageType;
import pt.webdetails.cpf.packager.StringFilter;
import pt.webdetails.cpf.packager.dependencies.Dependency;
import pt.webdetails.cpf.packager.dependencies.FileDependency;
import pt.webdetails.cpf.packager.origin.PathOrigin;
import pt.webdetails.cpf.packager.origin.StaticSystemOrigin;
import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.repository.api.IReadAccess;

/**
 * Provides includes needed for CDF Dashboards.
 */
public class CdfHeadersProvider implements ICdfHeadersProvider {

  // any static path will do
  private static final String BASE_DIR = "";
  // base properties, can be overridden by 'resources.<dashboardType>.properties'
  private static final String BASE_DEPENDENCIES = "resources.properties";
  private static final String CDF_DASHBOARD_DEPENDENCIES = "resources.cdf.dashboards.properties";

  private static final String SUFFIX_SCRIPT = ".script";
  private static final String SUFFIX_STYLE = ".link";
  private static final String SUFFIX_MAP = ".map";
  // special case for conditional include
  private static final String SUFFIX_IE8_STYLE = ".ie8link";
  private static final String SUFFIX_IE8_SCRIPT = ".ie8script";
  private static final String SUFFIX_IE8_SCRIPT_AFTER_STYLE = ".ie8scriptAfterLink";
  private static final String SUFFIX_IE8_SCRIPT_BEFORE_SCRIPT = ".ie8scriptBeforeScript";
  // these are always loaded first
  private static final String BASE_SCRIPTS_PROPERTY = "script";
  private static final String BASE_STYLES_PROPERTY = "link";
  private static final String BASE_STYLEMAP_PROPERTY = "map";

  private static final List<String> acceptedDashboardTypes = new ArrayList<String>( 3 );
  static {
    acceptedDashboardTypes.add( CdfConstants.BLUEPRINT );
    acceptedDashboardTypes.add( CdfConstants.MOBILE );
    acceptedDashboardTypes.add( CdfConstants.BOOTSTRAP );
    acceptedDashboardTypes.add( CdfConstants.CLEAN );
  }
  private static final String DEFAULT_DASHBOARD_TYPE = "blueprint";

  // base properties cache
  private Properties baseProperties;
  private Properties extraProperties;
  // for cdf dashboards
  private List<? extends DependenciesPackage> extraIncludes;

  private Map<String, List<? extends DependenciesPackage>> dashboardIncludes =
      new HashMap<String, List<? extends DependenciesPackage>>();

  public CdfHeadersProvider() {
    IReadAccess reader = getContentAccess().getPluginSystemReader( BASE_DIR );
    // base includes
    baseProperties = new Properties();
    loadProperties( reader, BASE_DEPENDENCIES, baseProperties );
    // extra includes
    extraProperties = loadProperties( reader, CDF_DASHBOARD_DEPENDENCIES, new Properties() );
    PathSet pathSet = new PathSet();
    addCustomDependencies( pathSet, extraProperties );
    extraIncludes = createDependenciesPackages( "cdf-dashboard", pathSet );
    // dashboard types
    for ( String dashboardType : acceptedDashboardTypes ) {
      try {
        dashboardIncludes.put( dashboardType, createDependenciesPackages( dashboardType ) );
      } catch ( Exception e ) {
        logError( "Unable to load headers for " + dashboardType, e );
      }
    }
  }

  /**
   * Get header includes for CDF Dashboards.
   * 
   * @param dashboardType
   *          blueprint|mobile
   * @param isDebugMode
   *          will concatenate/minify files if false
   * @param componentTypes
   *          components used in the dashboard
   * @return html script/style includes
   */
  @Override
  public String getHeaders( String dashboardType, boolean isDebugMode, List<String> componentTypes ) {
    return getHeaders( dashboardType, isDebugMode, null, componentTypes );
  }

  /**
   * Get header includes for CDF Dashboards.
   * 
   * @param dashboardType
   *          blueprint|mobile
   * @param isDebugMode
   *          will concatenate/minify files if false
   * @param absRoot
   *          if you really need to add protocol+domain for some reason
   * @param componentTypes
   *          components used in the dashboard
   * @return html script/style includes
   */
  @Override
  public String getHeaders( String dashboardType, boolean isDebugMode, String absRoot, List<String> componentTypes ) {
    if ( !isAcceptedDashboardType( dashboardType ) ) {
      getLog().error( dashboardType + " is not a valid dashboard type. Defaulting to " + DEFAULT_DASHBOARD_TYPE );
      dashboardType = DEFAULT_DASHBOARD_TYPE;
    }
    StringBuilder deps = new StringBuilder();
    for ( DependenciesPackage pkg : getDependenciesPackages( dashboardType ) ) {
      deps.append( String.format( "<!-- %s -->", pkg.getName() ) );
      try {
        appendDependencies( deps, pkg, !isDebugMode, absRoot );
      } catch ( Exception e ) {
        logError( "Error with dependencies package '" + pkg.getName() + "'.", e );
      }
    }
    if ( componentTypes != null && !componentTypes.isEmpty() ) {
      for ( DependenciesPackage pkg : extraIncludes ) {
        deps.append( String.format( "<!-- %s -->", pkg.getName() ) );
        ArrayList<String> filePaths = new ArrayList<String>( componentTypes.size() );
        String tmp;
        // build new List with dependencies to be included
        switch ( pkg.getType() ) {
          case JS:
            for ( String name : componentTypes ) {
              tmp = name.concat( SUFFIX_IE8_SCRIPT_BEFORE_SCRIPT );
              if (  extraProperties.containsKey( tmp ) ) {
                String[] value = extraProperties.getProperty( tmp ).split( "," );
                filePaths.addAll( Arrays.asList( value ) );
              }
              tmp = name.concat( SUFFIX_SCRIPT );
              if (  extraProperties.containsKey( tmp ) ) {
                String[] value = extraProperties.getProperty( tmp ).split( "," );
                filePaths.addAll( Arrays.asList( value ) );
              }
              tmp = name.concat( SUFFIX_IE8_SCRIPT );
              if (  extraProperties.containsKey( tmp ) ) {
                String[] value = extraProperties.getProperty( tmp ).split( "," );
                filePaths.addAll( Arrays.asList( value ) );
              }
              tmp = name.concat( SUFFIX_IE8_SCRIPT_AFTER_STYLE );
              if (  extraProperties.containsKey( tmp ) ) {
                String[] value = extraProperties.getProperty( tmp ).split( "," );
                filePaths.addAll( Arrays.asList( value ) );
              }
            }
            break;
          case CSS:
            for ( String name : componentTypes ) {
              tmp = name.concat( SUFFIX_STYLE );
              if (  extraProperties.containsKey( tmp ) ) {
                String[] value = extraProperties.getProperty( tmp ).split( "," );
                filePaths.addAll( Arrays.asList( value ) );
              }
              tmp = name.concat( SUFFIX_IE8_STYLE );
              if (  extraProperties.containsKey( tmp ) ) {
                String[] value = extraProperties.getProperty( tmp ).split( "," );
                filePaths.addAll( Arrays.asList( value ) );
              }
            }
            break;
          default:
            break;
        }
        if ( !filePaths.isEmpty() ) {
          // map component cannot be minified for now because of OpenLayers.js
          appendDependencies( deps, pkg, false, absRoot, filePaths );
        }
      }
    }
    return deps.toString();
  }

  private static class CdfDependencyInclusionFilter implements DependenciesPackage.IDependencyInclusionFilter {
    private List<String> filePaths;
    public CdfDependencyInclusionFilter( List<String> filePaths ) {
      this.filePaths = filePaths;
    }
    @Override
    public boolean include( Dependency dependency ) {
      if ( filePaths == null ) {
        return false;
      }
      for ( String filePath: filePaths ) {
        if ( dependency.getClass().isAssignableFrom( FileDependency.class )
            && ( (FileDependency) dependency ).getUrlFilePath().endsWith( filePath ) ) {
          return true;
        }
      }
      return false;
    }
  }

  protected void appendDependencies( StringBuilder deps, DependenciesPackage pkg, boolean minify,
                                   String absRoot, final ArrayList<String> files ) {
    if ( absRoot != null ) {
      StringFilter filter = new AbsolutizingStringFilter( absRoot, pkg.getDefaultFilter() );
      deps.append( pkg.getDependencies( filter, minify, new CdfDependencyInclusionFilter( files ) ) );
    } else {
      deps.append( pkg.getDependencies( minify, new CdfDependencyInclusionFilter( files ) ) );
    }
  }

  protected void appendDependencies( StringBuilder deps, DependenciesPackage pkg, boolean minify, String absRoot ) {
    if ( absRoot != null ) {
      StringFilter filter = new AbsolutizingStringFilter( absRoot, pkg.getDefaultFilter() );
      deps.append( pkg.getDependencies( filter, minify ) );
    } else {
      deps.append( pkg.getDependencies( minify ) );
    }
  }

  private static List<String> getProperty( Properties properties, String propertyName ) {
    return Arrays.asList( properties.getProperty( propertyName, "" ).split( "," ) );
  }

  private Properties loadProperties( IReadAccess reader, String filePath, Properties properties ) {
    InputStream propertiesFile = null;
    try {
      if ( !reader.fileExists( filePath ) ) {
        getLog().warn( String.format( "Dependencies file %s not found.", filePath ) );
      } else {
        propertiesFile = reader.getFileInputStream( filePath );
        properties.load( propertiesFile );
      }
    } catch ( Exception e ) {
      logError( String.format( "Error reading resource definitions form file %s.", filePath ), e );
    } finally {
      IOUtils.closeQuietly( propertiesFile );
    }
    return properties;
  }

  private Iterable<? extends DependenciesPackage> getDependenciesPackages( String dashboardType ) {
    if ( !dashboardIncludes.containsKey( dashboardType ) ) {
      getLog().error( "Dependencies for type " + dashboardType + " were not loaded correctly." );
      return Collections.emptyList();
    }
    return dashboardIncludes.get( dashboardType );
  }

  private boolean isAcceptedDashboardType( String dashboardType ) {
    return acceptedDashboardTypes.contains( dashboardType );
  }

  private List<StaticDependenciesPackage> createDependenciesPackages( String dashboardType ) {
    IReadAccess reader = getContentAccess().getPluginSystemReader( BASE_DIR );
    String fileName = String.format( "resources.%s.properties", dashboardType );
    Properties dtProperties = new Properties( getBaseProperties() );
    if ( reader.fileExists( fileName ) ) {
      loadProperties( reader, fileName, dtProperties );
    }

    PathSet pathSet = new PathSet();
    addBaseDependencies( pathSet, dtProperties );
    addCustomDependencies( pathSet, dtProperties );
    return createDependenciesPackages( dashboardType, pathSet );
  }

  private Properties getBaseProperties() {
    return baseProperties;
  }

  private void addBaseDependencies( PathSet pathSet, Properties properties ) {
    pathSet.scripts.addAll( getProperty( properties, BASE_SCRIPTS_PROPERTY ) );
    pathSet.styles.addAll( getProperty( properties, BASE_STYLES_PROPERTY ) );
    pathSet.styleMaps.addAll( getProperty( properties, BASE_STYLEMAP_PROPERTY ) );
  }

  private void addCustomDependencies( PathSet pathSet, Properties properties ) {
    for ( String name : properties.stringPropertyNames() ) {
      if ( name.endsWith( SUFFIX_IE8_SCRIPT_BEFORE_SCRIPT ) ) {
        pathSet.ie8ScriptsBeforeScripts.addAll( getProperty( properties, name ) );
      } else if ( name.endsWith( SUFFIX_SCRIPT ) ) {
        pathSet.scripts.addAll( getProperty( properties, name ) );
      } else if ( name.endsWith( SUFFIX_IE8_SCRIPT ) ) {
        pathSet.ie8Scripts.addAll( getProperty( properties, name ) );
      } else if ( name.endsWith( SUFFIX_STYLE ) ) {
        pathSet.styles.addAll( getProperty( properties, name ) );
      } else if ( name.endsWith( SUFFIX_MAP ) ) {
        pathSet.styleMaps.addAll( getProperty( properties, name ) );
      } else if ( name.endsWith( SUFFIX_IE8_STYLE ) ) {
        pathSet.ie8Styles.addAll( getProperty( properties, name ) );
      } else if ( name.endsWith( SUFFIX_IE8_SCRIPT_AFTER_STYLE ) ) {
        pathSet.ie8ScriptsAfterStyles.addAll( getProperty( properties, name ) );
      } else if ( !name.equals( BASE_SCRIPTS_PROPERTY ) && !name.equals( BASE_STYLES_PROPERTY ) ) {
        // no default
        getLog().error(
            String.format( "Type of include property '%s' not recognized. Property name must end in one of ( '%s' )",
                name, StringUtils.join( new String[] { SUFFIX_SCRIPT, SUFFIX_STYLE, SUFFIX_IE8_STYLE,
                                                       SUFFIX_IE8_SCRIPT, SUFFIX_IE8_SCRIPT_AFTER_STYLE,
                                                       SUFFIX_IE8_SCRIPT_BEFORE_SCRIPT }, "', '" ) ) );
      }
    }
  }

  private List<StaticDependenciesPackage> createDependenciesPackages( String pkgBaseName, PathSet pathSet ) {
    List<StaticDependenciesPackage> dependencies = new ArrayList<StaticDependenciesPackage>();
    PathOrigin origin = getDefaultOrigin();
    final String PKG_NAME = "cdf-%s-%s-includes";
    if ( !pathSet.ie8ScriptsBeforeScripts.isEmpty() ) {
      String name = String.format( PKG_NAME, pkgBaseName, "ie8scriptBeforeScript" );
      dependencies
          .add( new IE8Dependencies( name, PackageType.JS, getContentAccess(), getUrlProvider(),
            origin, pathSet.ie8ScriptsBeforeScripts ) );
    }
    if ( !pathSet.scripts.isEmpty() ) {
      String name = String.format( PKG_NAME, pkgBaseName, "script" );
      dependencies.add( createDependencyPackage( name, PackageType.JS, origin, pathSet.scripts ) );
    }
    if ( !pathSet.ie8Scripts.isEmpty() ) {
      String name = String.format( PKG_NAME, pkgBaseName, "ie8script" );
      dependencies
          .add( new IE8Dependencies( name, PackageType.JS, getContentAccess(), getUrlProvider(),
            origin, pathSet.ie8Scripts ) );
    }
    if ( !pathSet.styles.isEmpty() ) {
      String name = String.format( PKG_NAME, pkgBaseName, "style" );
      dependencies.add( createDependencyPackage( name, PackageType.CSS, origin, pathSet.styles ) );
    }
    if ( !pathSet.styleMaps.isEmpty() ) {
      for ( String map : pathSet.styleMaps ) {
        if ( StringUtils.isNotEmpty( map ) ) {
          dependencies.add( createStyleMap( map ) );
        }
      }
    }
    if ( !pathSet.ie8Styles.isEmpty() ) {
      String name = String.format( PKG_NAME, pkgBaseName, "ie8style" );
      dependencies
          .add( new IE8Dependencies( name, PackageType.CSS, getContentAccess(), getUrlProvider(),
            origin, pathSet.ie8Styles ) );
    }
    if ( !pathSet.ie8ScriptsAfterStyles.isEmpty() ) {
      String name = String.format( PKG_NAME, pkgBaseName, "ie8scriptAfterLink" );
      dependencies
          .add( new IE8Dependencies( name, PackageType.JS, getContentAccess(), getUrlProvider(),
            origin, pathSet.ie8ScriptsAfterStyles ) );
    }
    return dependencies;
  }

  private StaticDependenciesPackage createStyleMap( String map ) {
    return new StaticDependenciesPackage( FilenameUtils.getName( map ), PackageType.MAP,
        getContentAccess(), getUrlProvider(), getDefaultOrigin(), new String[]{map} );
  }

  private PathOrigin getDefaultOrigin() {
    return new StaticSystemOrigin( BASE_DIR );
  }

  private StaticDependenciesPackage createDependencyPackage( String name, PackageType pkgType, PathOrigin origin,
      List<String> fileNames ) {
    return new StaticDependenciesPackage( name, pkgType, getContentAccess(), getUrlProvider(), origin, fileNames
        .toArray( new String[fileNames.size()] ) );
  }

  protected IUrlProvider getUrlProvider() {
    return PluginEnvironment.env().getUrlProvider();
  }

  protected IContentAccessFactory getContentAccess() {
    return PluginEnvironment.repository();
  }

  protected Log getLog() {
    return LogFactory.getLog( getClass() );
  }

  protected void logError( String msg, Throwable error ) {
    Log log = getLog();
    if ( log.isDebugEnabled() && error != null ) {
      log.error( msg, error );
    } else {
      log.error( msg );
    }
  }

  private static class PathSet {
    public List<String> ie8ScriptsBeforeScripts = new ArrayList<String>();
    public List<String> scripts = new ArrayList<String>();
    public List<String> styles = new ArrayList<String>();
    public List<String> styleMaps = new ArrayList<String>();
    public List<String> ie8Styles = new ArrayList<String>();
    public List<String> ie8Scripts = new ArrayList<String>();
    public List<String> ie8ScriptsAfterStyles = new ArrayList<String>();
  }

  private static class AbsolutizingStringFilter implements StringFilter {

    private StringFilter delegate;
    private String absRoot;

    public AbsolutizingStringFilter( String absRoot, StringFilter delegate ) {
      assert delegate != null;
      this.delegate = delegate;
      this.absRoot = absRoot;
    }

    @Override
    public String filter( String input ) {
      return delegate.filter( input, absRoot );
    }

    @Override
    public String filter( String input, String absRoot ) {
      return delegate.filter( input, absRoot );
    }
  }

  private static class IE8Dependencies extends StaticDependenciesPackage {
    public IE8Dependencies( String name, PackageType type, IContentAccessFactory factory, IUrlProvider urlProvider,
                                 PathOrigin origin, List<String> fileList ) {
      super( name, type, factory, urlProvider, origin, fileList.toArray( new String[fileList.size()] ) );
    }

    @Override
    public String getDependencies( StringFilter format, boolean isPackaged ) {
      StringBuilder include = new StringBuilder();
      include.append( "<!--[if lte IE 8]>" );
      // no use packaging this one
      include.append( super.getDependencies( format, false ) );
      include.append( "<![endif]-->\n" );
      return include.toString();
    }
  }
}
