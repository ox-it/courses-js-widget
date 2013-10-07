/**

Copyright (c) 2013 University of Oxford

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of the University of Oxford nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

define(['jquery', 'jquery.dataTables', 'moment'], function($) {

	var filterUndefined = function(t) { return t !== undefined; };

	function paddedValue(v) {
		if (v < 10 ) {
			v = "0"+v;
		}
		return v;
	}

	function now() {
		d = new Date(); 
		return d.getFullYear() + "-" + paddedValue(d.getMonth()+1) + "-" + paddedValue(d.getDate()) + "T" + paddedValue(d.getHours()) + ":" + paddedValue(d.getMinutes()) + ":" + paddedValue(d.getSeconds());
	}

	function add_css(url) {
		if (document.createStyleSheet) {
			document.createStyleSheet(url);
		} else {
			$('<link rel="stylesheet" type="text/css" href="' + url + '" />').appendTo('head');
		}
	}

/* Our main function 
*/
	$(function() {

		add_css("//static.data.ox.ac.uk/lib/DataTables/media/css/jquery.dataTables.css");
		add_css("//static.data.ox.ac.uk/courses-js-widget/courses.css");

		// creates an options object with parameters from the containing div attributes
		// and then passes the element and the options on to getData
		var setUp = function(e) {
			options = {};
			options.withoutDates = false;
			options.title = ($(e).attr("data-title"))? $(e).attr("data-title") : "Courses";
			options.displayColumns = ($(e).attr("data-displayColumns"))? $(e).attr("data-displayColumns") : ""; 

			options.units          = ($(e).attr("data-providedBy")  || "").split(' ');
			options.eligibilities  = ($(e).attr("data-eligibility") || "OX PU").split(' ');

			options.researchMethod = ($(e).attr("data-researchMethod"))? "https://data.ox.ac.uk/id/ox-rm/" + $(e).attr("data-researchMethod") : "";	         
			options.skill          = ($(e).attr("data-skill"))         ? "https://data.ox.ac.uk/id/ox-rdf/descriptor/" + $(e).attr("data-skill") : "";
			options.startingBefore = ($(e).attr("data-startingBefore"))? $(e).attr("data-startingBefore") : "";

			options.includeContinuingEducation = false; // hardcoded

			if ($(e).attr("data-startingAfter") !== undefined) {
				options.startingAfter = $(e).attr("data-startingAfter");
			} else if(options.startingBefore == "") {
				options.startingAfter = "now";
			}

			if (options.startingAfter == "now") {
				options.startingAfter = now();
			}

			if (options.startingBefore == "now") {
				options.startingBefore = now();
			}

			$(e).append('<h2 class="courses-widget-title">'+options.title+'</h2>');
			$(e).append('<div class="courses-widget-wait" style="font-family:\'Helvetica\';" align="center">Loading courses...<br/><img src="https://static.data.ox.ac.uk/loader.gif" alt="please wait"/></div>');

			$(e).children(".courses-widget-wait").show();

			getData(e, options);
		};

		// constructs the query from options and sends it
		var getData = function(e, options) {

			var params = {
				'format'    : 'js',
				'type'      : 'presentation',
				'q'         : '*',
				'page_size' : 10000,
			}

			if (!options.includeContinuingEducation) {
				params.q = '* NOT offeredBy.label:"Department of Continuing Education"';
			}

			if (options.units && options.units.length > 0) {
				params['filter.offeredByAncestor.uri'] = options.units
			} else {
				params['filter.offeredByAncestor.uri'] = 'http://oxpoints.oucs.ox.ac.uk/id/00000000';
			}

			if(options.withoutDates) {
				params['filter.start.time'] = '-';
			} else {

				if(options.startingAfter) {
					params['gte.start.time'] = options.startingAfter
				}

				if(options.startingBefore) {
					params['lt.start.time'] = options.startingBefore
				}
			}

			if(options.eligibilities && options.eligibilities.length > 0) {
				params['filter.eligibility.uri'] = []
				for(i in options.eligibilities) {
					eligibility = options.eligibilities[i]
					switch(eligibility) {
						case 'PU':
							params['filter.eligibility.uri'].push('oxcap:eligibility-public')
							break;
						case 'OX':
							params['filter.eligibility.uri'].push('oxcap:eligibility-members')
							break;
						case 'ST':
							params['filter.eligibility.uri'].push('oxcap:eligibility-staff')
							break;
						default:
					}
				}
			}

			if(options.skill) {
			  params['subject.uri'] = options.skill;
			}

			if(options.researchMethod) {
			  params['filter.researchMethod.uri'] = options.researchMethod;
			}

			$.ajaxSettings.traditional = true;
			$.getJSON('https://data.ox.ac.uk/search/?callback=?', params, function(json) { handleData(e, options, json) } );

		};

		// handles the query results 
		var handleData = function(e, options, results) {

			// TODO Are these results safe to output as html?

			var columnsAvailable = { 
					'start': '<th class="course-presentation-start">Start date</th>',
					'title': '<th class="course-title">Title</th>',
					'subject': '<th class="course-subject">Subject(s)</th>',
					'venue': '<th class="course-presentation-venue">Venue</th>',
					'provider': '<th class="course-provider">Provider</th>',
					'description': '<th class="course-description">Description</th>',
					'eligibility': '<th class="course-eligibility">Eligibility</th>',
			};

			var tableHeaderCells = "";
			var columnsToDisplay = {};

			if (options.displayColumns !== "") {

				options.displayColumns = options.displayColumns.replace(/^\s+|\s+$/g, '') // trim whitespace and split by spaces
				var columns = options.displayColumns.split(' ');

				var columnsToDisplay = {}; // now to convert into an object
				for (i in columns) {
					if (columns[i] == 'start' && options.withoutDates) {

						// do nothing

					} else {

						columnsToDisplay[columns[i]] = true;

					}
				}

			} else {
				// if no columns specified, default to all available
				columnsToDisplay = columnsAvailable;
			}

			for (var i in columnsToDisplay) {
				tableHeaderCells += columnsAvailable[i];
			}
			
			var tbody = $('<tbody>');
			var table = $('<table>', {"class": 'course-results-table'})
				.append($('<thead>').append($('<tr>').html(tableHeaderCells)))
				.append(tbody);

			var moment = require('moment');
			//var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

			presentations = results.hits.hits;

			for (var i=0, max=presentations.length; i<max; i++) {

				var presentation = presentations[i]._source;

				var cells = {};

				var start = presentation.start;
				if (start && columnsToDisplay.start) {
					time = moment(start.time);
					cells.start = time.format("ddd D MMM YYYY"); // Mon 1 Oct 2012
				}

				var title    = presentation.label
				var applyTo  = presentation.applyTo;
				var homepage = presentation.homepage;

				if (title && columnsToDisplay.title) {
					title = title ? title.valueOf() : '—';
					if (applyTo)
						cells.title = $('<a>', {title: title, href: applyTo.uri}).text(title);
					else if (homepage)
						cells.title = $('<a>', {title: title, href: homepage.uri}).text(title);
					else
						cells.title = $('<span>', {title: title}).text(title);
				}

				var subjects = presentation.subject;
				if (subjects && columnsToDisplay.subject) {

					var notJACS = new Array();
					for (j in subjects) {
						if (subjects[j].uri.indexOf('http://jacs.dataincubator.org/') !== 0) { // Ignore JACS codes
							notJACS.push(subjects[j].label);
						}
					}

					cells.subject = $('<span>').text(notJACS.join(', '));
				}

				var venue = presentation.venue;
				if (venue && 'venue' in columnsToDisplay) {
					cells.venue = $('<span>').text(venue.label ? venue.label : '-');
				}

				if ('provider' in columnsToDisplay) {
					var provider = presentation.offeredBy.label
					cells.provider = provider ? provider : '-';
				}

				var description = presentation.description;
				if (description && 'description' in columnsToDisplay) {
					cells.description = $('<span>').text(description);
				}

				var eligibility = presentation.eligibility;
				if (eligibility && 'eligibility' in columnsToDisplay) {
					capitalised = eligibility.label.charAt(0).toUpperCase() + eligibility.label.slice(1)
					cells.eligibility = $('<span>').text(capitalised);
				}

				var row = $("<tr>");

				for(var column in columnsToDisplay) {
					row.append($('<td>').append(cells[column]));
				}

				tbody.append(row);
			}

			var tableFoot = '</tbody></table>';

			var linkTitle = (options.withoutDates)? "Show courses with specific dates" : "Show courses without specific dates";
			var $noDatesToggle = $('<a class="courses-widget-no-date-toggle-link" href="#">' + linkTitle + '</a>').click(function () {
				options.withoutDates = (options.withoutDates)? false : true;
				$(e).children('.course-results-table').remove();
				$(e).children('.dataTables_wrapper').remove();
				$(this).remove(); 
				getData(e, options);
				return false;
			});

			$(e).append($noDatesToggle);

			$(e).append(table);

			var dataTablesColumnsConfig = new Array();
			var columnCount = 0;
			for (var column in columnsToDisplay) {
				switch (column) {
					case 'start':
						dataTablesColumnsConfig.push({ "sWidth": '8.1em', "aTargets":[columnCount], 'sType':'date'});
						break;
					default: break;
				}
				columnCount++;
			}
			dataTable = $(e).children(".course-results-table").dataTable( {
				aoColumnDefs: dataTablesColumnsConfig,
        "iDisplayLength": 25,
				"oLanguage": {
						"sEmptyTable" : "No matching courses found.",
					},
			} );

			$(e).children(".courses-widget-wait").hide();

		};

		$('.courses-widget-container').each(function(i, e){ setUp(e);});
	});
});
