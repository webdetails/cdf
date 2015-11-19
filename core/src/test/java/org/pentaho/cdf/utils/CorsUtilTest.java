package org.pentaho.cdf.utils;

import org.junit.Before;
import org.junit.Test;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

public class CorsUtilTest {
  CorsUtil corsUtil, corsUtilSpy;


  @Before
  public void setUp() throws Exception {
    corsUtil = CorsUtil.getInstance();
    corsUtilSpy = spy( corsUtil );
  }

  @Test
  public void testSetCorsHeaders() throws Exception {
    String fakeLocal = "http://fakelocal:1234";

    HttpServletRequest request = mock( HttpServletRequest.class );
    doReturn( fakeLocal ).when( request ).getHeader( "ORIGIN" );
    HttpServletResponse response = mock( HttpServletResponse.class );

    doReturn( "true" ).when( corsUtilSpy ).getAllowCrossDomainResources();
    corsUtilSpy.setCorsHeaders( request, response );
    verify( request, times( 1 ) ).getHeader( "ORIGIN" );
    verify( response, times( 1 ) ).setHeader( "Access-Control-Allow-Origin", fakeLocal );
    verify( response, times( 1 ) ).setHeader( "Access-Control-Allow-Credentials", "true" );

    doReturn( null ).when( corsUtilSpy ).getAllowCrossDomainResources();
    corsUtilSpy.setCorsHeaders( request, response );
    verify( request, times( 1 ) ).getHeader( "ORIGIN" );
    verify( response, times( 1 ) ).setHeader( "Access-Control-Allow-Origin", fakeLocal );
    verify( response, times( 1 ) ).setHeader( "Access-Control-Allow-Credentials", "true" );

    doReturn( "false" ).when( corsUtilSpy ).getAllowCrossDomainResources();
    corsUtilSpy.setCorsHeaders( request, response );
    verify( request, times( 1 ) ).getHeader( "ORIGIN" );
    verify( response, times( 1 ) ).setHeader( "Access-Control-Allow-Origin", fakeLocal );
    verify( response, times( 1 ) ).setHeader( "Access-Control-Allow-Credentials", "true" );
  }
}
