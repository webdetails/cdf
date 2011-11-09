/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.pentaho.cdf;

import org.json.JSONException;

/**
 *
 * @author pedro
 */
public class InvalidCdfOperationException extends Exception{

    public InvalidCdfOperationException(Exception ex) {
        super(ex);
    }

    public InvalidCdfOperationException(String string) {
        super(string);
    }

}
