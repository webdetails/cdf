/*!
 * Copyright 2002 - 2017 Webdetails, a Hitachi Vantara company. All rights reserved.
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

package org.pentaho.cdf.context.autoinclude;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.dom4j.Node;

/**
 * Determines if a matched cda should be applied to a dashboard.<br>
 * One will be generated for each matched cda file and every dashboard-matching rule.
 */
class DashboardMatchRule {

  private static Pattern REPLACE_TOKEN = Pattern.compile( "\\$([0-9]+)" );
  private static final Log log = LogFactory.getLog( DashboardMatchRule.class );

  public enum Mode {
    INCLUDE, EXCLUDE
  }

  private Pattern regex;
  private Mode mode;

  /**
   * 
   * @param cdaMatcher matcher for a cda file recognized by the cda regex
   * @param ruleNode &lt;include&gt; or &lt;exclude&gt; node
   */
  public DashboardMatchRule( Matcher cdaMatcher, Node ruleNode ) {
    this.mode = parseMode( ruleNode.getName() );
    this.regex = replaceTokens( cdaMatcher, ruleNode.getText() );
  }

  /**
   * 
   * @param dashboardPath full dashboard path for comparison (file name inc.)
   * @param result current inclusion status for dashboard
   * @return if dashboard should be included (assuming no more rules)
   */
  public boolean canInclude( String dashboardPath, boolean result ) {
    switch ( mode ) {
      case EXCLUDE:
        if ( !result ) {
          return false;
        }
        return !regex.matcher( dashboardPath ).matches();
      case INCLUDE:
        if ( result ) {
          return true;
        }
        return regex.matcher( dashboardPath ).matches();
      default:
        // should never happen
        throw new IllegalStateException( "Invalid rule!" );
    }
  }

  private static Mode parseMode( String nodeName ) {
    if ( nodeName.equals( "include" ) ) {
      return Mode.INCLUDE;
    } else if ( nodeName.equals( "exclude" ) ) {
      return Mode.EXCLUDE;
    } else {
      throw new IllegalArgumentException( "Inclusion rule mode " + nodeName + " not supported." );
    }
  }

  private Pattern replaceTokens( Matcher cdaMatcher, String regex ) {
    // replace $1 for group 1 in regex etc
    Matcher token = REPLACE_TOKEN.matcher( regex );
    StringBuffer sb = new StringBuffer();
    while ( token.find() ) {
      int group = Integer.parseInt( token.group( 1 ) );
      if ( group < cdaMatcher.groupCount() ) {
        token.appendReplacement( sb, Matcher.quoteReplacement( Pattern.quote( cdaMatcher.group( group ) ) ) );
      } else {
        log.error( String.format( "Error processing rule '%s', group %d does not exist.", regex, group ) );
      }
    }
    token.appendTail( sb );
    return Pattern.compile( sb.toString() );
  }

  @Override
  public String toString() {
    return mode + "(" + regex + ")";
  }

}
