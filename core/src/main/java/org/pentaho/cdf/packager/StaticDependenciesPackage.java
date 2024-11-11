/*! ******************************************************************************
 *
 * Pentaho
 *
 * Copyright (C) 2024 by Hitachi Vantara, LLC : http://www.pentaho.com
 *
 * Use of this software is governed by the Business Source License included
 * in the LICENSE.TXT file.
 *
 * Change Date: 2028-08-13
 ******************************************************************************/


package org.pentaho.cdf.packager;

import pt.webdetails.cpf.context.api.IUrlProvider;
import pt.webdetails.cpf.packager.DependenciesPackage;
import pt.webdetails.cpf.packager.origin.PathOrigin;
import pt.webdetails.cpf.repository.api.IContentAccessFactory;
import pt.webdetails.cpf.repository.api.IReadAccess;

/**
 * A {@link DependenciesPackage} that only accepts files at creation. TODO: extract common superclass
 */
public class StaticDependenciesPackage extends DependenciesPackage {

  private boolean registryClosed = false;

  public StaticDependenciesPackage(
      String name,
      PackageType type,
      IContentAccessFactory factory,
      IUrlProvider urlProvider,
      PathOrigin origin,
      String[] files ) {
    super( name, type, factory, urlProvider );
    IReadAccess reader = origin.getReader( factory );
    for ( String filePath : files ) {
      String version = Long.toString( reader.getLastModified( filePath ) );
      registerFileDependency( filePath, version, origin, filePath );
    }
    registryClosed = true;
  }

  @Override
  public boolean registerFileDependency( String name, String version, PathOrigin origin, String path ) {
    if ( registryClosed ) {
      throw new IllegalStateException( "Can only register in constructor!" );
    }
    return super.registerFileDependency( name, version, origin, path );
  }
}
