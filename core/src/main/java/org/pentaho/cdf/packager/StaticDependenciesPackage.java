/*!
 * Copyright 2002 - 2015 Webdetails, a Pentaho company. All rights reserved.
 *
 * This software was developed by Webdetails and is provided under the terms
 * of the Mozilla Public License, Version 2.0, or any later version. You may not use
 * this file except in compliance with the license. If you need a copy of the license,
 * please go to http://mozilla.org/MPL/2.0/. The Initial Developer is Webdetails.
 *
 * Software distributed under the Mozilla Public License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. Please refer to
 * the license for the specific language governing your rights and limitations.
 */

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
