/*
 * File:        jquery.dataTables.js
 * Version:     1.2.4
 * CVS:         $Id$
 * Description: Paginate, search and sort HTML tables
 * Author:      Allan Jardine
 * Created:     28/3/2008
 * Modified:    $Date$ by $Author$
 * Language:    Javascript
 * License:     GPL v2 or BSD 3 point style
 * Project:     Mtaala
 * Contact:     allan.jardine@sprymedia.co.uk
 * 
 * Copyright 2007-2008 Allan Jardine, all rights reserved.
 *
 * This source file is free software, under either the GPL v2 license or a
 * BSD style license, as supplied with this software.
 * 
 * This source file is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 * 
 * For details pleease refer to: http://sprymedia.co.uk/article/DataTables
 */


(function($) {
	$.fn.dataTable = function( oInit )
	{
		/*
		 * Variable: _aoSettings
		 * Purpose:  Store the settings for each dataTables instance
		 * Scope:    jQuery.dataTable
		 */
		var _aoSettings = new Array();
		
		/*
		 * Function: classSettings
		 * Purpose:  Settings container function for all 'class' properties which are required
		 *   by dataTables
		 * Returns:  -
		 * Inputs:   -
		 */
		function classSettings ()
		{
			/*
			 * Variable: oFeatures
			 * Purpose:  Indicate the enablement of key dataTable features
			 * Scope:    jQuery.dataTable.classSettings 
			 */
			this.oFeatures = {
				"bPaginate": true,
				"bLengthChange": true,
				"bFilter": true,
				"bSort": true,
				"bInfo": true,
				"bProcessing": true,
				"bAutoWidth": true
			};
			
			/*
			 * Variable: oLanguage
			 * Purpose:  Store the language strings used by dataTables
			 * Scope:    jQuery.dataTable.classSettings
			 * Notes:    The words in the format _VAR_ are variables which are dynamically replaced
			 *   by javascript
			 */
			this.oLanguage = {
				"sProcessing": "Processing...",
				"sLengthMenu": "Show _MENU_ entries",
				"sZeroRecords": "No matching records found",
				"sInfo": " _START_ to _END_ of _TOTAL_ entries",
				"sInfoEmtpy": " 0 to 0 of 0 entries",
				"sInfoFiltered": "(filtered from _MAX_ total entries)",
				"sInfoPostFix": "",
				"sSearch": "Search:",
				"sUrl": ""
			};			
							
			/*
			 * Variable: aoColumns
			 * Purpose:  Store information about each column that is in use
			 * Scope:    jQuery.dataTable.classSettings 
			 */
			this.aoColumns = new Array();
			
			/*
			 * Variable: aaData
			 * Purpose:  Data to be used for the table of information
			 * Scope:    jQuery.dataTable.classSettings
			 * Notes:    (horiz) data row,  (vert) columns
			 */
			this.aaData = new Array();
			
			/*
			 * Variable: aaDataMaster
			 * Purpose:  Complete record of original information from the DOM
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.aaDataMaster = new Array();
			
			/*
			 * Variable: asDataSearch
			 * Purpose:  Search data array for regular expression searching
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.asDataSearch = new Array();
			
			/*
			 * Variable: sPreviousSearch
			 * Purpose:  Store the previous search incase we want to force a re-search
			 *   or compare the old search to a new one
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.sPreviousSearch = '';
			
			/*
			 * Variable: nInfo
			 * Purpose:  Info display for user to see what records are displayed
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.nInfo = null;
			
			/*
			 * Variable: nProcessing
			 * Purpose:  Processing indicator div
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.nProcessing = null;
			
			/*
			 * Variable: iDisplayLength, iDisplayStart, iDisplayEnd
			 * Purpose:  Display length variables
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.iDisplayLength = 10;
			this.iDisplayStart = 0;
			this.iDisplayEnd = 10;
			
			/*
			 * Variable: iColumnSorting
			 * Purpose:  Column sort index
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.iColumnSorting = null;
			
			/*
			 * Variable: iSortingDirection
			 * Purpose:  Column sort direction - 0 as per Array.sort. 1 reversed
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.iSortingDirection = 0;
			
			/*
			 * Variable: sDefaultSortingDirection
			 * Purpose:  Column sort direction - asc (ascending) desc (descending)
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.sDefaultSortingDirection = "asc";
			
			/*
			 * Variable: asStripClasses
			 * Purpose:  Classes to use for the striping of a table
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.asStripClasses = new Array();
			
			/*
			 * Variable: fnRowCallback
			 * Purpose:  Call this function every time a row is inserted (draw)
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.fnRowCallback = null;
			
			/*
			 * Variable: fnHeaderCallback
			 * Purpose:  Callback function for the header on each draw
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.fnHeaderCallback = null;
			
			/*
			 * Variable: fnFooterCallback
			 * Purpose:  Callback function for the footer on each draw
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.fnFooterCallback = null;
			
			/*
			 * Variable: nFooter
			 * Purpose:  Footer node
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.nFooter = null;
			
			/*
			 * Variable: sTableId
			 * Purpose:  Cache the table ID for quick access
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.sTableId = "";
			
			/*
			 * Variable: nTable
			 * Purpose:  Cache the table node for quick access
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.nTable = null;
			
			/*
			 * Variable: iDefaultSortIndex
			 * Purpose:  Sorting index which will be used by default
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.iDefaultSortIndex = 0;
			
			/*
			 * Variable: bInitialised
			 * Purpose:  Indicate if all required information has been read in
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.bInitialised = false;
			
			/*
			 * Variable: nOpenRow
			 * Purpose:  Cache the open row node
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.nOpenRow = null;
			
			
			/*
			 * Variable: nPaginate, nPrevious, nNext
			 * Purpose:  Cache nodes for pagination
			 * Scope:    jQuery.dataTable.classSettings
			 */
			this.nPaginate = null;
			this.nPrevious = null;
			this.nNext = null;
		}
		
		
		
		
		
		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * API functions
		 */
		
		/*
		 * Function: fnDraw
		 * Purpose:  Redraw the table
		 * Returns:  -
		 * Inputs:   -
		 */
		this.fnDraw = function()
		{
			/* Find settings from table node */
			var oSettings = _fnSettingsFromNode( this[0] );
			
			_fnCalculateEnd( oSettings );
			_fnDraw( oSettings );
		}
		
		/*
		 * Function: fnFilter
		 * Purpose:  Filter the input based on data
		 * Returns:  -
		 * Inputs:   string:sInput - string to filter the table on
		 */
		this.fnFilter = function( sInput )
		{
			_fnFilter( _fnSettingsFromNode( this[0] ), sInput, 1 );
		}
		
		/*
		 * Function: fnSort
		 * Purpose:  Sort the table by a particular row
		 * Returns:  -
		 * Inputs:   int:iCol - the data index to sort on. Note that this will
		 *   not match the 'display index' if you have hidden data entries
		 */
		this.fnSort = function( iCol )
		{
			_fnSort( _fnSettingsFromNode( this[0] ), this, iCol );
		}
		
		/*
		 * Function: fnAddData
		 * Purpose:  Add new row(s) into the table
		 * Returns:  0 - ok
		 *           1 - length error
		 * Inputs:   array:mData - the data to be added. The length must match
		 *   the original data from the DOM
		 *           or
		 *           array array:mData - 2D array of data to be added
		 * Notes:    Warning - the refilter here will cause the table to redraw
		 *   starting at zero
		 * Notes:    Thanks to Yekimov Denis for contributing the basis for this function!
		 */
		this.fnAddData = function( mData )
		{
			/* Find settings from table node */
			var oSettings = _fnSettingsFromNode( this[0] );
			
			/* Check if we want to add multiple rows or not */
			if ( typeof mData[0] == "object" )
			{
				if ( mData[0].length != oSettings.aoColumns.length )
				{
					return 1;
				}
				else
				{
					/* Add an array */
					oSettings.aaDataMaster = oSettings.aaDataMaster.concat(mData.slice());
				}
			}
			else
			{
				if ( mData.length != oSettings.aoColumns.length )
				{
					return 1;
				}
				else
				{
					oSettings.aaDataMaster[ oSettings.aaDataMaster.length++ ] = mData.slice();
				}
			}
			
			oSettings.aaData = oSettings.aaDataMaster.slice();
			
			/* Rebuild the search */
			_fnBuildSearchArray( oSettings, 1 );
			
			/* Re-sort */
			_fnSort( oSettings, oSettings.iColumnSorting, true );
			
			/* But we do need to re-filter or re-draw */
			if ( oSettings.oFeatures.bFilter )
			{
				_fnFilter( oSettings, oSettings.sPreviousSearch );
			}
			else
			{
				_fnCalculateEnd( oSettings );
				_fnDraw( oSettings );
			}
			return 0;
		}
		
		/*
		 * Function: fnAddRow
		 * Notes:    Depreciated - fnAddData should be used over this function
		 */
		this.fnAddRow = function( aData )
		{
			this.fnAddData( aData );
		}
		
		/*
		 * Function: fnAddArray
		 * Notes:    Depreciated - fnAddData should be used over this function
		 */
		this.fnAddArray = function( aaData )
		{
			this.fnAddData( aaData );
		}
		
		/*
		 * Function: fnDeleteRow
		 * Purpose:  Remove a row for the table
		 * Returns:  array:aReturn - the row that was deleted
		 * Inputs:   int:iIndex - index of _aaData to be deleted
		 */
		this.fnDeleteRow = function( iIndexAAData, fnCallBack )
		{
			/* Find settings from table node */
			var oSettings = _fnSettingsFromNode( this[0] );
			
			/* Check that the index's are valid */
			if ( oSettings.aaDataMaster.length == oSettings.aaData.length )
			{
				iIndexAAMaster = iIndexAAData;
			}
			else
			{
				/* Need to find the index of the master array which matches the passed index from aaData */
				iIndexAAMaster = _fnMasterIndexFromDisplay( oSettings, iIndexAAData );
			}
			
			var aReturn = oSettings.aaDataMaster[ iIndexAAMaster ].slice();
			oSettings.aaDataMaster.splice( iIndexAAMaster, 1 );
			oSettings.aaData.splice( iIndexAAData, 1 );
			
			/* Rebuild the search */
			_fnBuildSearchArray( oSettings, 1 );
			
			/* If there is a user callback function - call it */
			if ( typeof fnCallBack == "function" )
			{
				fnCallBack.call( this );
			}
			
			/* Check for an 'overflow' they case for dislaying the table */
			if ( oSettings.iDisplayStart > oSettings.aaData.length )
			{
				oSettings.iDisplayStart -= oSettings.iDisplayLength;
			}
			
			_fnCalculateEnd( oSettings );
			_fnDraw( oSettings );
			
			return aReturn;
		}
		
		/*
		 * Function: fnClearTable
		 * Purpose:  Quickly and simply clear a table
		 * Returns:  -
		 * Inputs:   -
		 * Notes:    Thanks to Yekimov Denis for contributing this function!
		 */
		this.fnClearTable = function()
		{
			/* Find settings from table node */
			var oSettings = _fnSettingsFromNode( this[0] );
			
			oSettings.aaDataMaster.length = 0;
			oSettings.aaData.length = 0;
			_fnCalculateEnd( oSettings );
			_fnDraw( oSettings );
		}
		
		/*
		 * Function: fnOpen
		 * Purpose:  Open a display row (append a row after the row in question)
		 * Returns:  -
		 * Inputs:   node:nTr - the table row to 'open'
		 *           string:sHtml - the HTML to put into the row
		 *           string:sClass - class to give the new row
		 */
		this.fnOpen = function( nTr, sHtml, sClass )
		{
			/* Find settings from table node */
			var oSettings = _fnSettingsFromNode( this[0] );
			
			/* Remove an old open row if there is one */
			if ( oSettings.nOpenRow != null )
			{
				this.fnClose();
			}
			
			var nNewRow = document.createElement("tr");
			var nNewCell = document.createElement("td");
			nNewRow.appendChild( nNewCell );
			nNewRow.className = sClass;
			nNewCell.colSpan = oSettings.aoColumns.length; // XXX - does this need to be visble columns?
			nNewCell.innerHTML = sHtml;
			
			$(nNewRow).insertAfter(nTr);
			oSettings.nOpenRow = nNewRow;
		}
		
		/*
		 * Function: fnClose
		 * Purpose:  Close a display row
		 * Returns:  -
		 * Inputs:   -
		 */
		this.fnClose = function()
		{
			/* Find settings from table node */
			var oSettings = _fnSettingsFromNode( this[0] );
			
			$(oSettings.nOpenRow).remove();
			oSettings.nOpenRow = null;
		}
		
		/*
		 * Function: fnDecrement
		 * Purpose:  Decremenet all numbers bigger than iMatch (for deleting)
		 * Returns:  -
		 * Inputs:   int:iMatch - decrement numbers bigger than this
		 *           int:iIndex - index of the data to decrement
		 */
		this.fnDecrement = function( iMatch, iIndex )
		{
			if ( typeof iIndex == 'undefined' )
				iIndex = 0;
			
			/* Find settings from table node */
			var oSettings = _fnSettingsFromNode( this[0] );
			
			for ( var i=0 ; i<oSettings.aaDataMaster.length ; i++ )
			{
				if ( oSettings.aaDataMaster[i][iIndex]*1 > iMatch )
				{
					oSettings.aaDataMaster[i][iIndex] = (oSettings.aaDataMaster[i][iIndex]*1) - 1;
				}
			}
		}
		
		
		
		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * Local functions
		 */
		
		/*
		 * Function: _fnAddColumn
		 * Purpose:  Add a column to the list used for the table
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 *           oOptions - object with sType, bVisible and bSearchable
		 * Notes:    All options in enter column can be over-ridden by the user
		 *   initialisation of dataTables
		 */
		function _fnAddColumn( oSettings, oOptions )
		{
			oSettings.aoColumns[ oSettings.aoColumns.length++ ] = {
				"sType": null,
				"bVisible": true,
				"bSearchable": true,
				"bSortable": true,
				"sTitle": null,
				"sWidth": null,
				"sClass": null,
				"fnRender": null,
				"fnSort": null,
				"bUrl" : null,
			};
			
			/* User specified column options */
			if ( typeof oOptions != 'undefined' && oOptions != null )
			{
				var iLength = oSettings.aoColumns.length-1;
				
				if ( typeof oOptions.sType != 'undefined' )
					oSettings.aoColumns[ iLength ].sType = oOptions.sType;
				
				if ( typeof oOptions.bVisible != 'undefined' )
					oSettings.aoColumns[ iLength ].bVisible = oOptions.bVisible;
				
				if ( typeof oOptions.bSearchable != 'undefined' )
					oSettings.aoColumns[ iLength ].bSearchable = oOptions.bSearchable;
				
				if ( typeof oOptions.bSortable != 'undefined' )
					oSettings.aoColumns[ iLength ].bSortable = oOptions.bSortable;
				
				if ( typeof oOptions.sTitle != 'undefined' )
					oSettings.aoColumns[ iLength ].sTitle = oOptions.sTitle;
				
				if ( typeof oOptions.sWidth != 'undefined' )
					oSettings.aoColumns[ iLength ].sWidth = oOptions.sWidth;
				
				if ( typeof oOptions.sClass != 'undefined' )
					oSettings.aoColumns[ iLength ].sClass = oOptions.sClass;
				
				if ( typeof oOptions.fnRender != 'undefined' )
					oSettings.aoColumns[ iLength ].fnRender = oOptions.fnRender;
				
				if ( typeof oOptions.fnSort != 'undefined' )
					oSettings.aoColumns[ iLength ].fnSort = oOptions.fnSort;
					
				if ( typeof oOptions.bUrl != 'undefined' )
					oSettings.aoColumns[ iLength ].bUrl = oOptions.bUrl;
			}
		}
		
		
		/*
		 * Function: _fnGatherData
		 * Purpose:  Read in the data from the target table
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 */
		function _fnGatherData( oSettings )
		{
			var nDataNodes;
			
			if ( $('thead th', oSettings.nTable).length != oSettings.aoColumns.length )
			{
				alert( 'Warning - columns do not match' );
			}
			
			for ( var i=0 ; i<oSettings.aoColumns.length ; i++ )
			{
				/* Get the title of the column - unless there is a user set one */
				if ( oSettings.aoColumns[i].sTitle == null )
				{
					oSettings.aoColumns[i].sTitle = $('thead th:nth-child('+(i+1)+')', oSettings.nTable).text();
				}
				
				if ( oSettings.aoColumns[i].sFooter == null && typeof $('tfoot', oSettings.nTable)[0] != 'undefined' )
				{
					oSettings.nFooter = $('tfoot', oSettings.nTable)[0];
				}
				
				/* Get the data for the column */
				$('tbody td:nth-child('+oSettings.aoColumns.length+'n+'+(i+1)+')', oSettings.nTable).each( function( index ) {
					if ( typeof oSettings.aaData[index] != 'object' )
					{
						oSettings.aaData[index] = new Array();
					}
					oSettings.aaData[index][i] = this.innerHTML;
					
					/* Check if the user has set a type for this column, or if we should auto detect */
					if ( oSettings.aoColumns[i].sType == null )
					{
						oSettings.aoColumns[i].sType = _fnDetectType( oSettings.aaData[index][i] );
					}
					/* Otherwise assume that the user knows what they are doing (...) and go with the type
					 * that they provided
					 */
					
					/* Check if the user has set a class for this column, or if we should auto detect */
					if ( oSettings.aoColumns[i].sClass == null )
					{
						if ( this.className != '' )
						{
							oSettings.aoColumns[i].sClass = this.className;
						}
					}
				} );
			}
		}
		
		
		/*
		 * Function: _fnDetectType
		 * Purpose:  Get the sort type based on an input string
		 * Returns:  string:
		 *   - 'string'
		 *   - 'numeric'
		 *   - 'date'
		 * Inputs:   string:sData - data we wish to know the type of
		 */
		function _fnDetectType( sData )
		{
			if ( _fnIsNumeric(sData) )
			{
				return 'numeric';
			}
			else if ( ! isNaN(Date.parse(sData) ) )
			{
				return 'date';
			}
			else
			{
				return 'string';
			}
		}
		
		
		/*
		 * Function: _fnIsNumeric
		 * Purpose:  Check to see if a string is numeric
		 * Returns:  bool:bIsNumber - true:is number, false:not number
		 * Inputs:   string:sText - string to check
		 */
		function _fnIsNumeric ( sText )
		{
			var ValidChars = "0123456789.-";
			var Char;
			
			for ( i=0 ; i<sText.length ; i++ ) 
			{ 
				Char = sText.charAt(i); 
				if (ValidChars.indexOf(Char) == -1) 
				{
					return false;
				}
			}
			
			return true;
		}
		
		
		/*
		 * Function: _fnDrawHead
		 * Purpose:  Create the HTML header for the table
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 *           int:iSortCol - column being sorted on
		 */
		function _fnDrawHead( oSettings, iSortCol )
		{
			var nTr = document.createElement( "tr" );
			var nTrFoot = document.createElement( "tr" );
			var nTh;
			
			for ( var i=0 ; i<oSettings.aoColumns.length ; i++ )
			{
				if ( oSettings.aoColumns[i].bVisible )
				{
					nTh = document.createElement( "th" );
					
					if ( i == iSortCol )
					{
						nTh.className = "sorting_asc";
					}
					
					var sWidth = '';
					if ( oSettings.aoColumns[i].sWidth != null )
					{
						nTh.style.width = oSettings.aoColumns[i].sWidth + "px";
					}
					
					nTh.innerHTML = oSettings.aoColumns[i].sTitle;
					nTr.appendChild( nTh );
				}
			}
			
			/* Add the new header */
			$('thead', oSettings.nTable).html( '' )[0].appendChild( nTr );
			
			/* Add sort listener */
			if ( oSettings.oFeatures.bSort )
			{
				$('thead th', oSettings.nTable).click( function() {
					if ( oSettings.oFeatures.bProcessing )
					{
						_fnProcessingDisplay( oSettings, true );
					}
					
					/* Convert the column index to data index */
					var iDataIndex = $("thead th", oSettings.nTable).index(this); /* back up */
					
					for ( var i=0 ; i<oSettings.aoColumns.length ; i++ )
					{
						if ( this.innerHTML == oSettings.aoColumns[i].sTitle )
						{
							iDataIndex = i;
							break;
						}
					}
					
					/* Run the sort */
					_fnSort( oSettings, iDataIndex );
					
					/* Remove previous sort */
					$("thead th", oSettings.nTable).removeClass( "sorting_asc" ).removeClass( "sorting_desc" );
					
					/* Set the class name for the sorting th */
					if ( oSettings.iSortingDirection == 0 )
						this.className = "sorting_asc";
					else
						this.className = "sorting_desc";
					
					if ( oSettings.oFeatures.bProcessing )
					{
						_fnProcessingDisplay( oSettings, false );
					}
				} );
			}
			
			/* Set an absolute width for the table such that pagination doesn't
			 * cause the table to resize
			 */
			oSettings.nTable.style.width = oSettings.nTable.offsetWidth+"px";
		}
		
		
		/*
		 * Function: _fnDraw
		 * Purpose:  Create the HTML needed for the table and write it to the page
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 */
		function _fnDraw( oSettings )
		{
			var anRows = new Array();
			var sparkLines =  [];
			var sOutput = "";
			var iRowCount = 0;
			var nTd;
			var i;
			
			if ( oSettings.aaData.length != 0 )
			{
				for ( var j=oSettings.iDisplayStart ; j<oSettings.iDisplayEnd ; j++ )
				{
					anRows[ iRowCount ] = document.createElement( 'tr' );
					
					/* Class names for striping */
					if ( oSettings.asStripClasses.length > 0 )
					{
						anRows[ iRowCount ].className =
							oSettings.asStripClasses[ iRowCount % oSettings.asStripClasses.length ];
					}
					
					for ( i=0 ; i<oSettings.aoColumns.length ; i++ )
					{
						
						
						
						/* Ensure that we are allow to display this column */
						if ( oSettings.aoColumns[i].bVisible )
						{
							nTd = document.createElement( 'td' );
							nTd.setAttribute( 'valign', "top" );
							nTd.setAttribute( 'id', oSettings.nTable.id + "col" + j + "" + (i-1) );
							
							if ( oSettings.iColumnSorting == i && oSettings.aoColumns[i].sClass != null )
							{
								nTd.className = oSettings.aoColumns[i].sClass + ' sorting';
							}
							else if ( oSettings.iColumnSorting == i )
							{
								nTd.className = 'sorting';
							}
							else if ( oSettings.aoColumns[i].sClass != null )
							{
								nTd.className = oSettings.aoColumns[i].sClass;
							}
							
							if (oSettings.aoColumns[i].bUrl != null  )
							{
								nTd.className = "tableRowDimLink";
								nTd.setAttribute( 'onclick', oSettings.aoColumns[i].bUrl.replace(/{PARAM}/,oSettings.aaData[j][i]) );
							}
							
							/* Check for a custom render - otherwise output the data */
							if ( typeof oSettings.aoColumns[i].fnRender == 'function' )
							{
								nTd.innerHTML = oSettings.aoColumns[i].fnRender( {
									"iDataRow": j,
									"iDataColumn": i,
									"aData": oSettings.aaData } );
							}
							else
							{
								var data = oSettings.aaData[j][i];
								if(oSettings.aoColumns[i].sType == "sparkLine"){
									sparkLines.push(data);
								}
								else
									nTd.innerHTML = oSettings.aaData[j][i];
							}
							
							anRows[ iRowCount ].appendChild( nTd );
						}
					}
					
					/* Custom row callback function - might want to manipule the row */
					if ( typeof oSettings.fnRowCallback == "function" )
					{
						anRows[ iRowCount ] = oSettings.fnRowCallback( 
								anRows[ iRowCount ], oSettings.aaData[j], iRowCount, j );
					}
					
					iRowCount++;
				}
			}
			else
			{
				anRows[ 0 ] = document.createElement( 'tr' );
				nTd = document.createElement( 'td' );
				nTd.setAttribute( 'valign', "top" );
				nTd.colSpan = oSettings.aoColumns.length;
				nTd.style.textAlign = "center";
				nTd.innerHTML = oSettings.oLanguage.sZeroRecords;
				
				anRows[ iRowCount ].appendChild( nTd );
			}
			
			/* Callback the header and footer custom funcation if there is one */
			if ( typeof oSettings.fnHeaderCallback == 'function' )
			{
				oSettings.fnHeaderCallback( $('thead tr', oSettings.nTable)[0], 
					oSettings.aaData, oSettings.iDisplayStart, oSettings.iDisplayEnd );
			}
			
			if ( typeof oSettings.fnFooterCallback == 'function' )
			{
				oSettings.fnFooterCallback( oSettings.nFooter, 
					oSettings.aaData, oSettings.iDisplayStart, oSettings.iDisplayEnd );
			}
			
			/* Put the draw table into the dom */
			var nBody = $('tbody', oSettings.nTable);
			nBody.html( '' );
			for ( i=0 ; i<anRows.length ; i++ )
			{
				nBody[0].appendChild( anRows[i] );
			}
			
			/* Update the pagination display buttons */
			if ( oSettings.oFeatures.bPaginate )
			{
				oSettings.nPrevious.className = 
					( oSettings.iDisplayStart == 0 ) ? 
					"paginate_disabled_previous" : "paginate_enabled_previous";
				
				oSettings.nNext.className = 
					( oSettings.iDisplayEnd == oSettings.aaData.length ) ? 
					"paginate_disabled_next" : "paginate_enabled_next";
			}
			
			/* Show information about the table */
			if ( oSettings.oFeatures.bInfo )
			{
				/* Update the information */
				if ( oSettings.aaData.length == 0 && oSettings.aaData.length == oSettings.aaDataMaster.length )
				{
					oSettings.nInfo.innerHTML = 
						oSettings.oLanguage.sInfoEmtpy +' '+ oSettings.oLanguage.sInfoPostFix;
				}
				else if ( oSettings.aaData.length == 0 )
				{
					oSettings.nInfo.innerHTML = oSettings.oLanguage.sInfoEmtpy +' '+ 
						oSettings.oLanguage.sInfoFiltered.replace('_MAX_', oSettings.aaDataMaster.length) +' '+ 
						oSettings.oLanguage.sInfoPostFix;
				}
				else if ( oSettings.aaData.length == oSettings.aaDataMaster.length )
				{
					oSettings.nInfo.innerHTML = 
						oSettings.oLanguage.sInfo.
							replace('_START_',oSettings.iDisplayStart+1).
							replace('_END_',oSettings.iDisplayEnd).
							replace('_TOTAL_',oSettings.aaData.length) +' '+ 
						oSettings.oLanguage.sInfoPostFix;
				}
				else
				{
					oSettings.nInfo.innerHTML = 
						oSettings.oLanguage.sInfo.
							replace('_START_',oSettings.iDisplayStart+1).
							replace('_END_',oSettings.iDisplayEnd).
							replace('_TOTAL_',oSettings.aaData.length) +' '+ 
						oSettings.oLanguage.sInfoFiltered.replace('_MAX_', oSettings.aaDataMaster.length) +' '+ 
						oSettings.oLanguage.sInfoPostFix;
				}
			}
			
			for(i = 0; i < sparkLines.length; i++)
			{
				eval(sparkLines[i]);
			}
		}
		
		
		/*
		 * Function: _fnAddOptionsHtml
		 * Purpose:  Add the options to the page HTML for the table
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 */
		function _fnAddOptionsHtml( oSettings )
		{
			/*
			 * Filter details
			 */
			if ( oSettings.oFeatures.bFilter )
			{
				var nFilter = document.createElement( 'div' );
				if ( oSettings.sTableId != "" )
				{
					nFilter.setAttribute( 'id', oSettings.sTableId+'_filter' );
				}
				nFilter.className = "dataTables_filter";
				nFilter.innerHTML = 
					oSettings.oLanguage.sSearch+' <input type="text">';
				oSettings.nTable.parentNode.insertBefore( nFilter, oSettings.nTable );
				
				$("input", nFilter).keyup( 
					function() { _fnFilter( oSettings, this.value ); } );
			}
			
			/*
			 * Information about the table
			 */
			if ( oSettings.oFeatures.bInfo )
			{
				oSettings.nInfo = document.createElement( 'div' );
				if ( oSettings.sTableId != "" )
				{
					oSettings.nInfo.setAttribute( 'id', oSettings.sTableId+'_info' );
				}
				oSettings.nInfo.className = "dataTables_info";
				$(oSettings.nInfo).insertAfter( oSettings.nTable );
			}
			
			/*
			 * Paginate details
			 */
			if ( oSettings.oFeatures.bPaginate )
			{
				oSettings.nPaginate = document.createElement( 'div' );
				oSettings.nPrevious = document.createElement( 'div' );
				oSettings.nNext = document.createElement( 'div' );
				
				if ( oSettings.sTableId != "" )
				{
					oSettings.nPaginate.setAttribute( 'id', oSettings.sTableId+'_paginate' );
					oSettings.nPrevious.setAttribute( 'id', oSettings.sTableId+'_previous' );
					oSettings.nNext.setAttribute( 'id', oSettings.sTableId+'_next' );
				}
				
				oSettings.nPaginate.className = "dataTables_paginate";
				oSettings.nPrevious.className = "paginate_disabled_previous";
				oSettings.nNext.className = "paginate_disabled_next";
				
				oSettings.nPaginate.appendChild( oSettings.nPrevious );
				oSettings.nPaginate.appendChild( oSettings.nNext );
				$(oSettings.nPaginate).insertAfter( oSettings.nTable );
				
				$(oSettings.nPrevious).click( function() {
					oSettings.iDisplayStart -= oSettings.iDisplayLength;
					
					/* Correct for underrun */
					if ( oSettings.iDisplayStart < 0 )
					  oSettings.iDisplayStart = 0;
					
					_fnCalculateEnd( oSettings );
					_fnDraw( oSettings );
				} );
				
				$(oSettings.nNext).click( function() {
					/* Make sure we are not over running the display array */
					if ( oSettings.iDisplayStart + oSettings.iDisplayLength < oSettings.aaData.length )
						oSettings.iDisplayStart += oSettings.iDisplayLength;
					
					_fnCalculateEnd( oSettings );
					_fnDraw( oSettings );
				} );
				
				/*
				 * Display length
				 */
				if ( oSettings.oFeatures.bLengthChange )
				{
					/* This can be overruled by not using the _MENU_ var/macro in the language variable */
					var sName = (oSettings.sTableId == "") ? "" : 'name="'+oSettings.sTableId+'_length"';
					var sStdMenu = 
						'<select size="1" '+sName+'>'+
							'<option value="10">10</option>'+
							'<option value="25">25</option>'+
							'<option value="50">50</option>'+
							'<option value="100">100</option>'+
						'</select>';
					
					var nLength = document.createElement( 'div' );
					if ( oSettings.sTableId != "" )
					{
						nLength.setAttribute( 'id', oSettings.sTableId+'_length' );
					}
					nLength.className = "dataTables_length";
					nLength.innerHTML = oSettings.oLanguage.sLengthMenu.replace( '_MENU_', sStdMenu );
					
					oSettings.nTable.parentNode.insertBefore( nLength, oSettings.nTable );
					$('select', nLength).change( function() {
						oSettings.iDisplayLength = parseInt($(this).val());
						
						_fnCalculateEnd( oSettings );
						_fnDraw( oSettings );
					} );
				}
				
				/*
				 * Create a wrapper div around the table
				 */
				var nWrapper = document.createElement( 'div' );
				if ( oSettings.sTableId != "" )
				{
					nWrapper.setAttribute( 'id', oSettings.sTableId+'_wrapper' );
				}
				nWrapper.className = "dataTables_wrapper";
				oSettings.nTable.parentNode.insertBefore( nWrapper, oSettings.nTable );
				nWrapper.appendChild( oSettings.nTable );
			}
			
			/*
			 * Processing
			 */
			if ( oSettings.oFeatures.bProcessing )
			{
				oSettings.nProcessing = document.createElement( 'div' );
				if ( oSettings.sTableId != "" )
				{
					oSettings.nProcessing.setAttribute( 'id', oSettings.sTableId+'_processing' );
				}
				oSettings.nProcessing.appendChild( document.createTextNode( oSettings.oLanguage.sProcessing ) );
				oSettings.nProcessing.className = "dataTables_processing";
				oSettings.nProcessing.style.visibility = "hidden";
				oSettings.nTable.parentNode.insertBefore( oSettings.nProcessing, oSettings.nTable );
			}
		}
		
		/*
		 * Function: _fnProcessingDisplay
		 * Purpose:  Display or hide the processing indicator
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 *           bool:
		 *   true - show the processing indicator
		 *   false - don't show
		 */
		function _fnProcessingDisplay ( oSettings, bShow )
		{
			if ( bShow )
				oSettings.nProcessing.style.visibility = "visible";
			else
				oSettings.nProcessing.style.visibility = "hidden";
		}
		
		
		
		/*
		 * Function: _fnConvertToWidth
		 * Purpose:  Convert a CSS unit width to pixels (e.g. 2em)
		 * Returns:  int:iWidth - width in pixels
		 * Inputs:   string:sWidth - width to be converted
		 *           node:nParent - parent to get the with for (required for
		 *             relative widths) - optional
		 */
		function _fnConvertToWidth ( sWidth, nParent )
		{
			if ( !sWidth || sWidth==null || sWidth=='' )
			{
				return 0;
			}
			
			if ( typeof nParent == "undefined" )
			{
				nParent = document.getElementsByTagName('body')[0];
			}
			
			var iWidth;
			var nTmp = document.createElement( "div" );
			nTmp.style.width = sWidth;
			
			nParent.appendChild( nTmp );
			iWidth = nTmp.offsetWidth;
			nParent.removeChild( nTmp );
			
			return ( iWidth );
		}
		
		
		/*
		 * Function: _fnFilter
		 * Purpose:  Filter the data table based on user input and draw the table
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 *           string:sInput - string to filter on
		 *           int:iForce - force a research of the master array (1) or not (undefined or 0)
		 */
		function _fnFilter( oSettings, sInput, iForce )
		{
			var flag, i, j;
			var aaDataSearch = new Array();
			
			if ( typeof iForce == 'undefined' || iForce == null )
				iForce = 0;
			
			/* Generate the regular expression to use. Something along the lines of:
			 * ^(?=.*?\bone\b)(?=.*?\btwo\b)(?=.*?\bthree\b).*$
			 */
			var asSearch = sInput.split( ' ' );
			var sRegExpString = '^(?=.*?'+asSearch.join( ')(?=.*?' )+').*$';
			var rpSearch = new RegExp( sRegExpString, "i" );
			
			/*
			 * If the input is blank - we want the full data set
			 */
			if ( sInput.length <= 0 )
			{
				oSettings.aaData.splice( 0, oSettings.aaData.length);
				oSettings.aaData = oSettings.aaDataMaster.slice();
				oSettings.sPreviousSearch = sInput;
			}
			else
			{
				/*
				 * We are starting a new search or the new search string is smaller 
				 * then the old one (i.e. delete). Search from the master array
			 	 */
				if ( oSettings.aaData.length == oSettings.aaDataMaster.length ||
					   oSettings.sPreviousSearch.length > sInput.length || iForce == 1 )
				{
					/* Wipe the old search array */
					aaDataSearch.splice( 0, aaDataSearch.length );
					_fnBuildSearchArray( oSettings, 1 );
					
					/* Search through all records to populate the search array
					 * The the oSettings.aaDataMaster and asDataSearch arrays have 1 to 1 
					 * mapping
					 */
					for ( i=0 ; i<oSettings.aaDataMaster.length ; i++ )
					{
						if ( rpSearch.test(oSettings.asDataSearch[i]) )
						{
							aaDataSearch[aaDataSearch.length++] = oSettings.aaDataMaster[i];
						}
					}
					
					oSettings.aaData = aaDataSearch;
			  }
			  else
				{
			  	/* Using old search array - refine it - do it this way for speed
			  	 * Don't have to search the whole master array again
			 		 */
			  	var iIndexCorrector = 0;
			  	
			  	/* Search the current results */
			  	for ( i=0 ; i<oSettings.asDataSearch.length ; i++ )
					{
			  		if ( ! rpSearch.test(oSettings.asDataSearch[i]) )
						{
			  			oSettings.aaData.splice( i-iIndexCorrector, 1 );
			  			iIndexCorrector++;
			  		}
			  	}
			  }
				
				oSettings.sPreviousSearch = sInput;
			}
			
			/* Redraw the table */
			oSettings.iDisplayStart = 0; /* Start the user from the first page on filter */
			_fnCalculateEnd( oSettings );
			_fnDraw( oSettings );
			
			/* Rebuild search array 'offline' */
			_fnBuildSearchArray( oSettings, 0 );
		}
		
		
		/*
		 * Function: _fnCalculateEnd
		 * Purpose:  Rcalculate the end point based on the start point
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 */
		function _fnCalculateEnd( oSettings )
		{
			if ( oSettings.oFeatures.bPaginate == false )
			{
				oSettings.iDisplayEnd = oSettings.aaData.length;
			}
			else
			{
				/* Set the end point of the display - based on how many elements there are
				 * still to display
				 */
				if ( oSettings.iDisplayStart + oSettings.iDisplayLength > oSettings.aaData.length )
					oSettings.iDisplayEnd = oSettings.aaData.length;
				else
					oSettings.iDisplayEnd = oSettings.iDisplayStart + oSettings.iDisplayLength;
			}
		}
		
		
		/*
	 	 * Function: _fnSort
		 * Purpose:  Change the order of the table
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 *           int:iColumn - column number to be ordered
		 *           bool:bForce - force a resort - optional - default false
		 * Notes:    We always sort the master array and then apply a filter again
		 *   if it is needed. This probably isn't optimal - but atm I can't think
		 *   of any other way which is (each has disadvantages)
		 */
		_fnSort = function ( oSettings, iColumn, bForce )
		{
			/* Check if column is sortable */
			if ( ! oSettings.aoColumns[ iColumn ].bSortable )
			{
				return;
			}
			
			if ( typeof bForce == 'undefined' )
				bForce = false;
			
			/* Find out if we are reversing the order of the array */
			if ( iColumn == oSettings.iColumnSorting && !bForce )
			{
				oSettings.aaDataMaster.reverse(); /* needs to be data master - and force */
				
				oSettings.iSortingDirection = (oSettings.iSortingDirection == 0) ? 1 : 0;
			}
			else
			{
				/* Need to sort the array */
				oSettings.iColumnSorting = iColumn;
				oSettings.iSortingDirection = 0;
				
				if ( typeof oSettings.aoColumns[ iColumn ].fnSort == 'function' )
				{
					/* Custom sort function */
					oSettings.aaDataMaster.sort( oSettings.aoColumns[ iColumn ].fnSort );
				}
				else if ( oSettings.aoColumns[ iColumn ].sType == 'numeric' )
				{
					/* Use numerical sorting */
					oSettings.aaDataMaster.sort( function ( a, b ) {
						var x = a[iColumn] == "-" ? 0 : a[iColumn];
						var y = b[iColumn] == "-" ? 0 : b[iColumn];
						return x - y;
					} );
				}
				else if ( oSettings.aoColumns[ iColumn ].sType == 'date' )
				{
					/* Use date sorting */
					oSettings.aaDataMaster.sort( function ( a, b ) {
						var x = Date.parse( a[iColumn] );
						var y = Date.parse( b[iColumn] );
						return x - y;
					} );
				}
				else if ( oSettings.aoColumns[ iColumn ].sType == 'html' )
				{
					/* Use html sorting - strip html tags */
					oSettings.aaDataMaster.sort( function ( a, b ) {
						var x = a[iColumn].replace( /<.*?>/g, "" );
						var y = b[iColumn].replace( /<.*?>/g, "" );
						
						x = x.toLowerCase();
						y = y.toLowerCase();
						return ((x < y) ? -1 : ((x > y) ? 1 : 0));
					} );
				}
				else
				{
					/* Use default alphabetical sorting */
					oSettings.aaDataMaster.sort( function ( a, b ) {
						var x = a[iColumn].toLowerCase();
						var y = b[iColumn].toLowerCase();
						return ((x < y) ? -1 : ((x > y) ? 1 : 0));
					} );
				}
				
				/* Reverse if required by the default sorting direction */
				if ( oSettings.sDefaultSortingDirection == "desc" )
				{
					oSettings.aaDataMaster.reverse();
				}
			}
			
			
			/* Copy the master data into the draw array and re-draw */
			if ( oSettings.oFeatures.bFilter )
			{
				/* _fnFilter() will redraw the table for us */
				_fnFilter( oSettings, oSettings.sPreviousSearch, 1 );
			}
			else
			{
				oSettings.aaData = oSettings.aaDataMaster.slice();
				_fnCalculateEnd( oSettings );
				_fnDraw( oSettings );
			}
		}
		
		
		/*
		 * Function: _fnBuildSearchArray
		 * Purpose:  Create an array which can be quickly search through
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 *           int:iMaster - use the master data array - optional
		 */
		function _fnBuildSearchArray ( oSettings, iMaster )
		{
			/* Clear out the old data */
			oSettings.asDataSearch.splice( 0, oSettings.asDataSearch.length );
			
			var aArray = (typeof iMaster != 'undefined' && iMaster == 1) ?
			 	oSettings.aaDataMaster : oSettings.aaData;
			
			for ( i=0 ; i<aArray.length ; i++ )
			{
				oSettings.asDataSearch[i] = '';
				for ( j=0 ; j<oSettings.aoColumns.length ; j++ )
				{
					if ( oSettings.aoColumns[j].bSearchable )
					{
						oSettings.asDataSearch[i] += aArray[i][j].replace(/\n/g," ")+' ';
					}
				}
			}
		}
		
		
		/*
		 * Function: _fnCalculateColumnWidths
		 * Purpose:  Calculate the width of columns for the table
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 */
		function _fnCalculateColumnWidths ( oSettings )
		{
			var iTableWidth = oSettings.nTable.offsetWidth;
			var iTotalUserIpSize = 0;
			var iTmpWidth;
			var iVisibleColumns = 0;
			var i;
			var oHeaders = $('thead th', oSettings.nTable);
			
			/* Convert any user input sizes into pixel sizes */
			for ( var i=0 ; i<oSettings.aoColumns.length ; i++ )
			{
				if ( oSettings.aoColumns[i].bVisible )
				{
					iVisibleColumns++;
					
					if ( oSettings.aoColumns[i].sWidth != null )
					{
						iTmpWidth = _fnConvertToWidth( oSettings.aoColumns[i].sWidth, 
							oSettings.nTable.parentNode );
						
						/* Total up the user defined widths for later calculations */
						iTotalUserIpSize += iTmpWidth;
						
						oSettings.aoColumns[i].sWidth = iTmpWidth+"px";
					}
				}
			}
			
			/* If the number of columns in the DOM equals the number that we
			 * have to process in dataTables, then we can use the offsets that are
			 * created by the web-browser. No custom sizes can be set in order for
			 * this to happen
			 */
			if ( oSettings.aoColumns.length == oHeaders.length && iTotalUserIpSize == 0 )
			{
				for ( i=0 ; i<oSettings.aoColumns.length ; i++ )
				{
					oSettings.aoColumns[i].sWidth = oHeaders[i].offsetWidth+"px";
				}
			}
			else
			{
				/* Otherwise we are going to have to do some calculations to get
				 * the width of each column. Construct a 1 row table with the maximum
				 * string sizes in the data, and any user defined widths
				 */
				var nCalcTmp = oSettings.nTable.cloneNode( false );
				nCalcTmp.setAttribute( "id", '' );
				
				var sTableTmp = '<table class="'+nCalcTmp.className+'">';
				var sCalcHead = "<tr>";
				var sCalcHtml = "<tr>";
				
				/* Construct a tempory table which we will inject (invisibly) into
				 * the dom - to let the browser do all the hard word
				 */
				for ( var i=0 ; i<oSettings.aoColumns.length ; i++ )
				{
					if ( oSettings.aoColumns[i].bVisible )
					{
						sCalcHead += '<th>'+oSettings.aoColumns[i].sTitle+'</th>';
						
						if ( oSettings.aoColumns[i].sWidth != null )
						{
							var sWidth = '';
							if ( oSettings.aoColumns[i].sWidth != null )
							{
								sWidth = ' style="width:'+oSettings.aoColumns[i].sWidth+';"';
							}
							
							sCalcHtml += '<td'+sWidth+' tag_index="'+i+'">'+fnGetMaxLenString( oSettings, i)+'</td>';
						}
						else
						{
							sCalcHtml += '<td tag_index="'+i+'">'+fnGetMaxLenString( oSettings, i)+'</td>';
						}
					}
				}
				
				sCalcHead += "</tr>";
				sCalcHtml += "</tr>";
				
				/* Create the tmp table node (thank you jQuery) */
				nCalcTmp = $( sTableTmp + sCalcHead + sCalcHtml +'</table>' )[0];
				nCalcTmp.style.width = iTableWidth + "px";
				nCalcTmp.style.visibility = "hidden";
				nCalcTmp.style.position = "absolute"; /* Try to aviod scroll bar */
				
				oSettings.nTable.parentNode.appendChild( nCalcTmp );
				
				var oNodes = $("td", nCalcTmp);
				var iIndex;
				
				/* Gather in the browser calculated widths for the rows */
				for ( i=0 ; i<oNodes.length ; i++ )
				{
					iIndex = oNodes[i].getAttribute('tag_index');
					
					
					oSettings.aoColumns[iIndex].sWidth = $("td", nCalcTmp)[i].offsetWidth +"px";
				}
				
				oSettings.nTable.parentNode.removeChild( nCalcTmp );
			}
		}
		
		
		/*
		 * Function: fnGetMaxLenString
		 * Purpose:  Get the maximum strlen for each data column
		 * Returns:  string: - max strlens for each column
		 * Inputs:   object:oSettings - datatTables settings object
		 *           int:iCol - column of interest
		 */
		function fnGetMaxLenString( oSettings, iCol )
		{
			var iMax = 0;
			var iMaxIndex = -1;
			
			for ( var i=0 ; i<oSettings.aaDataMaster.length ; i++ )
			{
				if ( oSettings.aaDataMaster[i][iCol].length > iMax )
				{
					iMax = oSettings.aaDataMaster[i][iCol].length;
					iMaxIndex = i;
				}
			}
			
			if ( iMaxIndex >= 0 )
				return oSettings.aaDataMaster[iMaxIndex][iCol];
			else
				return '';
		}
		
		
		/*
		 * Function: _fnArrayCmp
		 * Purpose:  Compare two arrays
		 * Returns:  0 if match, 1 if length is different, 2 if no match
		 * Inputs:   array:aArray1 - first array
		 *           array:aArray2 - second array
		 */
		function _fnArrayCmp( aArray1, aArray2 )
		{
			if ( aArray1.length != aArray2.length )
			{
				return 1;
			}
			
			for ( var i=0 ; i<aArray1.length ; i++ )
			{
				if ( aArray1[i] != aArray2[i] )
				{
					return 2;
				}
			}
			
			return 0;
		}
		
		
		/*
		 * Function: _fnMasterIndexFromDisplay
		 * Purpose:  Get the master index from the display index
		 * Returns:  int:i - index
		 * Inputs:   object:oSettings - datatTables settings object
		 *           int:iIndexAAData - display array index
		 */
		function _fnMasterIndexFromDisplay( oSettings, iIndexAAData )
		{
			var i = 0;
			
			while ( _fnArrayCmp( oSettings.aaDataMaster[i], oSettings.aaData[iIndexAAData] ) != 0 )
			{
				i++;
			}
			
			return i;
		}
		
		
		/*
		 * Function: _fnLanguageProcess
		 * Purpose:  Copy language variables from remote object to a local one
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 *           object:oLanguage - Language information
		 */
		function _fnLanguageProcess( oSettings, oLanguage )
		{
			if ( typeof oLanguage.sProcessing != 'undefined' )
				oSettings.oLanguage.sProcessing = oLanguage.sProcessing;
			
			if ( typeof oLanguage.sLengthMenu != 'undefined' )
				oSettings.oLanguage.sLengthMenu = oLanguage.sLengthMenu;
			
			if ( typeof oLanguage.sZeroRecords != 'undefined' )
				oSettings.oLanguage.sZeroRecords = oLanguage.sZeroRecords;
			
			if ( typeof oLanguage.sInfo != 'undefined' )
				oSettings.oLanguage.sInfo = oLanguage.sInfo;
			
			if ( typeof oLanguage.sInfoEmtpy != 'undefined' )
				oSettings.oLanguage.sInfoEmtpy = oLanguage.sInfoEmtpy;
			
			if ( typeof oLanguage.sInfoFiltered != 'undefined' )
				oSettings.oLanguage.sInfoFiltered = oLanguage.sInfoFiltered;
			
			if ( typeof oLanguage.sInfoPostFix != 'undefined' )
				oSettings.oLanguage.sInfoPostFix = oLanguage.sInfoPostFix;
			
			if ( typeof oLanguage.sSearch != 'undefined' )
				oSettings.oLanguage.sSearch = oLanguage.sSearch;
			
			_fnInitalise( oSettings );
		}
		
		
		/*
		 * Function: _fnInitalise
		 * Purpose:  Draw the table for the first time, adding all required features
		 * Returns:  -
		 * Inputs:   object:oSettings - datatTables settings object
		 */
		function _fnInitalise ( oSettings )
		{
			/* Ensure that the table data is fully initialised */
			if ( oSettings.bInitialised == false )
			{
				setTimeout( function(){ _fnInitalise( oSettings ) }, 200 );
				return;
			}
			
			/* Show the display HTML options */
			_fnAddOptionsHtml( oSettings );
			
			/* Draw the headers for the table */
			_fnDrawHead( oSettings, oSettings.iDefaultSortIndex );
			
			/* If there is default sorting required - let's do it. The sort function
			 * will do the drawing for us. Otherwise we draw the table
			 */
			if ( oSettings.oFeatures.bSort )
			{
				_fnSort( oSettings, oSettings.iDefaultSortIndex );
			}
			else
			{
				 oSettings.aaData =  oSettings.aaDataMaster;
				_fnCalculateEnd( oSettings );
				_fnDraw( oSettings );
			}
		}
		
		
		/*
		 * Function: _fnSettingsFromNode
		 * Purpose:  Return the settings object for a particular table
		 * Returns:  object: Settings object - or null if not found
		 * Inputs:   node:nTable - table we are using as a dataTable
		 */
		_fnSettingsFromNode = function( nTable )
		{
			for ( var i=0 ; i<_aoSettings.length ; i++ )
			{
				if ( _aoSettings[i].nTable == nTable )
				{
					return _aoSettings[i];
				}
			}
			
			return null;
		}
		
		
		
		/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
		 * Construct
		 */
		return this.each(function()
		{
			/* Make a complete and independent copy of the settings object */
			var oSettings = new classSettings()
			_aoSettings.push( oSettings );
			
			var bInitHandedOff = false;
			var bUsePassedData = false;
			
			/* Set the id */
			if ( this.getAttribute( 'id' ) != null )
			{
				oSettings.sTableId = this.getAttribute( 'id' );
			}
			
			/* Set the table node */
			oSettings.nTable = this;
			
			/* Store the features that we have available */
			if ( typeof oInit != 'undefined' && oInit != null )
			{
				if ( typeof oInit.bPaginate != 'undefined' )
					oSettings.oFeatures.bPaginate = oInit.bPaginate;
				
				if ( typeof oInit.bLengthChange != 'undefined' )
					oSettings.oFeatures.bLengthChange = oInit.bLengthChange;
				
				if ( typeof oInit.bFilter != 'undefined' )
					oSettings.oFeatures.bFilter = oInit.bFilter;
				
				if ( typeof oInit.bSort != 'undefined' )
					oSettings.oFeatures.bSort = oInit.bSort;
				
				if ( typeof oInit.bInfo != 'undefined' )
					oSettings.oFeatures.bInfo = oInit.bInfo;
				
				if ( typeof oInit.bProcessing != 'undefined' )
					oSettings.oFeatures.bProcessing = oInit.bProcessing;
				
				if ( typeof oInit.bAutoWidth != 'undefined' )
					oSettings.oFeatures.bAutoWidth = oInit.bAutoWidth;
				
				if ( typeof oInit.aaData != 'undefined' )
					bUsePassedData = true;
				
				if ( typeof oInit.iDisplayLength != 'undefined' )
					oSettings.iDisplayLength = oInit.iDisplayLength;
				
				if ( typeof oInit.asStripClasses != 'undefined' )
					oSettings.asStripClasses = oInit.asStripClasses;
				else
					oSettings.asStripClasses = [ "odd", "even" ];
				
				if ( typeof oInit.fnRowCallback != 'undefined' )
					oSettings.fnRowCallback = oInit.fnRowCallback;
				
				if ( typeof oInit.fnHeaderCallback != 'undefined' )
					oSettings.fnHeaderCallback = oInit.fnHeaderCallback;
				
				if ( typeof oInit.fnFooterCallback != 'undefined' )
					oSettings.fnFooterCallback = oInit.fnFooterCallback;
				
				if ( typeof oInit.iDefaultSortIndex != 'undefined' )
					oSettings.iDefaultSortIndex = oInit.iDefaultSortIndex;
				
				if ( typeof oInit.sDefaultSortDirection != 'undefined' )
					oSettings.sDefaultSortingDirection = oInit.sDefaultSortDirection;
				
				/* Backwards compatability */
				/* aoColumns / aoData - remove in 1.3 */
				if ( typeof oInit != 'undefined' && typeof oInit.aoData != 'undefined' )
				{
					oInit.aoColumns = oInit.aoData;
				}
				
				/* Language definitions */
				if ( typeof oInit.oLanguage != 'undefined' )
				{
					bInitHandedOff = true;
					
					if ( typeof oInit.oLanguage.sUrl != 'undefined' )
					{
						/* Get the language definitions from a file */
						oSettings.oLanguage.sUrl = oInit.oLanguage.sUrl;
						$.getJSON( oSettings.oLanguage.sUrl, null, function( json ) { 
							_fnLanguageProcess( oSettings, json ) } );
					}
					else
					{
						_fnLanguageProcess( oSettings, oInit.oLanguage );
					}
				}
				/* Warning: The _fnLanguageProcess function is async to the remainder of this function due
				 * to the XHR. We use _bInitialised in _fnLanguageProcess() to check this the processing 
				 * below is complete. The reason for spliting it like this is optimisation - we can fire
				 * off the XHR (if needed) and then continue processing the data.
				 */
			}
			
			/* See if we should load columns automatically or use defined ones */
			if ( typeof oInit != 'undefined' && typeof oInit.aoColumns != 'undefined' )
			{
				for ( var i=0 ; i<oInit.aoColumns.length ; i++ )
				{
					_fnAddColumn( oSettings, oInit.aoColumns[i] );
				}
			}
			else
			{
				$('thead th', this).each( function() { _fnAddColumn( oSettings, null ) } );
			}
			
			/* Check if there is data passing into the constructor */
			if ( bUsePassedData )
			{
				oSettings.aaDataMaster = oInit.aaData.slice();
				/* Add a thead and tbody to the table */
			 	$(this).html( '<thead></thead><tbody></tbody>' );
			}
			else
			{
				/* Grab the data from the page */
				_fnGatherData( oSettings );
				
				/* Copy the data array */
				oSettings.aaDataMaster = oSettings.aaData.slice();
			}
			
			/* Calculate sizes for columns */
			if ( oSettings.oFeatures.bAutoWidth )
			{
				_fnCalculateColumnWidths( oSettings );
			}
			
			/* Initialisation complete - table can be drawn */
			oSettings.bInitialised = true;
			
			/* Check if we need to initialise the table (it might not have been handed off to the
			 * language processor)
			 */
			if ( bInitHandedOff == false )
			{
				_fnInitalise( oSettings )
			}
		})
	}
})(jQuery);