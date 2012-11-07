/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.pentaho.cdf;


/**
 *
 * @author pedro
 */
public class InvalidCdfOperationException extends Exception{

    private static final long serialVersionUID = 1L;

    public InvalidCdfOperationException(Exception ex) {
        super(ex);
    }

    public InvalidCdfOperationException(String string) {
        super(string);
    }

}
