/**

Copyright (c) 2013 University of Oxford

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of the University of Oxford nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

define(['jquery', 'underscore', 'jquery.dataTables'], function($, _, dataTables) {

	var filterUndefined = function(t) { return t !== undefined; };

	/* Object converter - borrowed from http://snook.ca/archives/javascript/testing_for_a_v
	 */
	function oc(a) {
		var o = {};
		for(var i=0;i<a.length;i++)
		{
			o[a[i]]=true;
		}
		return o;
	}

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


/* Our main function 
*/
	$(function() {

		var dataTable_css_link = $("<link>", { 
			rel: "stylesheet", 
			type: "text/css", 
			href: "//static.data.ox.ac.uk/lib/DataTables/media/css/jquery.dataTables.css" 
		});
		dataTable_css_link.appendTo('head');

		var css_link = $("<link>", { 
			rel: "stylesheet", 
			type: "text/css", 
			href: "//static.data.ox.ac.uk/courses-js-widget/courses.css" 
		});
		css_link.appendTo('head');


		// creates an options object with parameters from the containing div attributes
		// and then passes the element and the options on to getData
		var setUp = function(e) {
			options = {};
			options.withoutDates = false;
			options.title = ($(e).attr("data-title"))? $(e).attr("data-title") : "Courses";
			options.displayColumns = ($(e).attr("data-displayColumns"))? $(e).attr("data-displayColumns") : ""; 

			options.units = ($(e).attr("data-providedBy") || "").split(' ');

			options.skill = ($(e).attr("data-skill"))? "https://data.ox.ac.uk/id/ox-rdf/descriptor/" + $(e).attr("data-skill") : "";
			options.researchMethod = ($(e).attr("data-researchMethod"))? "https://data.ox.ac.uk/id/ox-rm/descriptor/" + $(e).attr("data-researchMethod") : "";	         
			options.eligibilities = ($(e).attr("data-eligibilities"))? $(e).attr("data-eligibilities") : "";//"PU";
			options.startingBefore = ($(e).attr("data-startingBefore"))? $(e).attr("data-startingBefore") : "";
			options.startingAfter = ($(e).attr("data-startingAfter"))? $(e).attr("data-startingAfter") : "now";
			options.includeContinuingEducation = false; // TODO should this be hardcoded false?

			if (options.startingAfter == "now") options.startingAfter = now();

			$(e).append('<h2 class="courses-widget-title">'+options.title+'</h2>');
			$(e).append('<div class="courses-widget-wait" style="font-family:\'Helvetica\';" align="center">Loading courses...<br/><img src="https://static.data.ox.ac.uk/loader.gif" alt="please wait"/></div>');

			$(e).children(".courses-widget-wait").show();

			getData(e, options);
		};

		// constructs the query from options and sends it
		var getData = function(e, options) {

			var subjectFilterValue = options.skill;
			if (options.researchMethod) {
				subjectFilterValue = options.researchMethod;
			}

			var params = {
				'format'    : 'js',
				'type'      : 'presentation',
				'q'         : '*',
				'page_size' : 10000,
			}

			if (!options.includeContinuingEducation) {
//				params.q = '*+NOT+offeredBy.label:"Department+of+Continuing+Education"';
			}

			if (options.units) {
				params['filter.offeredByAncestor.uri'] = options.units[0] // TODO handle multiple
			} else {
				params['filter.offeredByAncestor.uri'] = 'http://oxpoints.oucs.ox.ac.uk/id/00000000';
			}

			$.ajax({
					url : '//data.ox.ac.uk/search/',
					data : params,
					jsonpCallback : 'callback',
					dataType: 'jsonp',
					success : function(json) {
						handleData(e, options, json)
					},
					error : function(e) {
						console.log(e.message)
					}
			});

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
					'info': '<th class="course-info">Further information</th>',
			};

			var tableHeaderCells = "";
			var columnsToDisplay = {};

			if (options.displayColumns !== "") {
				columnsToDisplay = oc(options.displayColumns.replace(/^\s+|\s+$/g, '').split(" ")); // trim whitespace and split by spaces
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

			//var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
			var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

			presentations = results.hits.hits;

			for (var i=0, max=presentations.length; i<max; i++) {

				var presentation = presentations[i]._source;
				var course = presentation.course.uri;

				var cells = {};

				var start = new Date(presentation.start.time * 1000);
				if (start && columnsToDisplay.start) {
					var startTime = ""; 
					var startHour = start.getHours();
					if (startHour > 2) {
						var startMinutes = start.getMinutes();
						startTime = " " + (startHour > 12 ? startHour - 12 : startHour) + ":" + (startMinutes < 10 ? "0" : "") + startMinutes + " " + (startHour > 11 ? "PM" : "AM");
					}
					var startFormatted = weekday[start.getDay()] + " " + start.getDate()+ " " + months[start.getMonth()]  + " " + start.getFullYear() + startTime;
					cells.start = startFormatted;
				}

				var title = presentation.label
				var applyTo = presentation.applyTo;

				if (title && columnsToDisplay.title) {
					title = title ? title.valueOf() : '—';
					if (applyTo)
						cells.title = $('<a>', {title: title, href: applyTo}).text(title);
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

				if ('description' in columnsToDisplay) {
					var description = presentation.description
					cells.description = '<td class="course-description">' + description + '</td>';
				}


				var row = $("<tr>");

				for(var column in columnsToDisplay) {
					row.append($('<td>').append(cells[column]));
				}
				tbody.append(row);
				continue; // TODO what is this doing here? get rid of it.


				if ('eligibility' in columnsToDisplay) {
					var courseEligibility = "";
					if (binding.presentationRegulations) {
						courseEligibility = binding.presentationRegulations.value;
					}
					rowToDisplay.eligibility = '<td class="course-eligibility">' + courseEligibility + '</td>';
				}
				if ('info' in columnsToDisplay) {
					var courseInfo = "";
					if (binding.courseURL) {
						courseInfo = binding.courseURL.value;
					}
					rowToDisplay.info = '<td class="course-info">' + courseInfo + '</td>';
				}


			}

			var tableFoot = '</tbody></table>';

			var linkTitle = (options.withoutDates)? "courses with specific dates" : "courses without specific dates";
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
						dataTablesColumnsConfig.push({ "aTargets":[columnCount], "bSortable":true, "sType":"date"});
						break;
					default: break;
				}
				columnCount++;
			}
			$(e).children(".course-results-table").dataTable( {
				aoColumnDefs: dataTablesColumnsConfig,
				"bPaginate": false
			} );

			$(e).children(".courses-widget-wait").hide();


		};

		$('.courses-widget-container').each(function(i, e){ setUp(e);});
	});
});
