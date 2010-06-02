package org.pentaho.cdf.export;


public interface IExport {

	public abstract void export(String[][] resultSet) ;
	
	public abstract String getExtension();
	
}