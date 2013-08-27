/**

Copyright (c) 2013 University of Oxford

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of the University of Oxford nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

define(['jquery', 'underscore', 'rdfstore', 'dataox', 'jquery.dataTables', 'select-query', 'describe-query'], function($, _, rdfstore, DataOx, dataTables, selectQueryTemplate, describeQueryTemplate) {
	var prefixes = {
		dc: 'http://purl.org/dc/elements/1.1/',
	    dcterms: 'http://purl.org/dc/terms/',
    	mlo: 'http://purl.org/net/mlo/',
    	org: 'http://www.w3.org/ns/org#',
    	oxcap: 'http://purl.ox.ac.uk/oxcap/ns/',
    	rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    	rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    	skos: 'http://www.w3.org/2004/02/skos/core#',
    	time: 'http://www.w3.org/2006/time#',
    	xcri: 'http://xcri.org/profiles/1.2/'
	};
	var sparqlPrefixes = _.map(prefixes, function(i, k) { return 'PREFIX ' + k + ': <' + prefixes[k] + '>\n'; }).join('');
	
	var dataox = new DataOx();

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
		var dataTables = false; 

		if ($.isFunction(jQuery.fn.dataTable) ) {
			var dataTables = true;
		}

		if (dataTables) {
			var dataTable_css_link = $("<link>", { 
				rel: "stylesheet", 
				type: "text/css", 
				href: "//static.data.ox.ac.uk/lib/dataTables/css/jquery.dataTables.css" 
			});
			dataTable_css_link.appendTo('head');
		}

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
			options.includeContinuingEducation = false;

			if (options.startingAfter == "now") options.startingAfter = now();

			$(e).append('<h2 class="courses-widget-title">'+options.title+'</h2>');
			$(e).append('<div class="courses-widget-wait" style="font-family:\'Helvetica\';" align="center">Loading courses...<br/><img src="https://static.data.ox.ac.uk/loader.gif" alt="please wait"/></div>');

			getData(e, options);
		}

		// constructs the query from options and sends it
		var getData = function(e, options) {


			var subjectFilterValue = options.skill;
			if (options.researchMethod) {
				subjectFilterValue = options.researchMethod;
			}

			/*
					var unitUri  = (options.unit)? options.unit : "http://oxpoints.oucs.ox.ac.uk/id/00000000";
					var subjectFilter = (subjectFilterValue) ? "FILTER (bound(?subject_id) && ?subject_id = <" + subjectFilterValue + ">)" : "";
					var eligibilityFilter = (options.eligibilities)? "EXISTS { ?course oxcap:eligibility/skos:notation ?eligibility_notation. FILTER (datatype(?eligibility_notation)=oxcap:eligibility && str(?eligibility_notation) in ('" + options.eligibilities.split(" ").join("', '") + "'))}" : "";
					var startingBeforeFilter = (options.startingBefore && !options.noDates) ? "FILTER (bound(?presentation_start_dateTime) && ((datatype(?presentation_start_dateTime) = xsd:date && ?presentation_start_dateTime <= \"" + options.startingBefore.substring(0, 10) + "\"^^xsd:date) || (tz(?presentation_start_dateTime) && ?presentation_start_dateTime <= \"" + options.startingBefore + "\"^^xsd:dateTime) || (?presentation_start_dateTime <= \"" + options.startingBefore.substring(0, 19) + "\")))" : "";
					var startingAfterFilter = (options.startingAfter && !options.noDates) ? "FILTER (bound(?presentation_start_dateTime) && ((datatype(?presentation_start_dateTime) = xsd:date && ?presentation_start_dateTime >= \"" + options.startingAfter.substring(0, 10) + "\"^^xsd:date) || (tz(?presentation_start_dateTime) && ?presentation_start_dateTime >= \"" + options.startingAfter + "\"^^xsd:dateTime) || (?presentation_start_dateTime >= \"" + options.startingAfter.substring(0, 19) + "\")))" : "";
					var noDatesFilter = (options.noDates) ? "FILTER (!bound(?presentation_start_dateTime))" : "";
					var applyUnitlInFuture = "FILTER !!!!TODO!!!!";
			 */

			dataox.sparql({
				query: sparqlPrefixes + selectQueryTemplate(options),
				type: "resultset",
				ajaxOptions: {
					beforeSend: function() { $(e).children(".courses-widget-wait").show(); }
				}
			}, function(results) {
				var presentations = _.map(results.results.bindings, function(r) { return r.presentation.value; });
				dataox.sparql({
					query: sparqlPrefixes + describeQueryTemplate({presentations: presentations}),
					type: "graph",
					ajaxOptions: {
						complete: function() { $(e).children(".courses-widget-wait").hide(); }
					}
				}, function(store) {
					handleData(e, options, presentations, store);
				})
			});

		}

		// handles the query results 
		var handleData = function(e, options, presentations, store) {
			for (var k in prefixes)
				store.setPrefix(k, prefixes[k]);


			/* *** uncomment for debugging: *** 
                if (window.jsDump) {
		    	  jsDump.HTML = true;
		    	  var dumped = jsDump.parse(data);
		    	  $('#debug').html(dumped);
                }
			    /* ******************************** */

			var columnsAvailable = { 'start': '<th class="course-presentation-start">Start date</th>',
					'title': '<th class="course-title">Title</th>',
					'subject': '<th class="course-subject">Subject(s)</th>',
					'provider': '<th class="course-provider">Provider</th>',
					'description': '<th class="course-description">Description</th>',
					'venue': '<th class="course-presentation-venue">Venue</th>',
					'eligibility': '<th class="course-eligibility">Eligibility</th>',
					'info': '<th class="course-info">Further information</th>',
			};

			var tableHeaderCells = "";
			var columnsToDisplay = {};
			if (options.displayColumns != "") {
				columnsToDisplay = options.displayColumns.split(" ");
				columnsToDisplay = oc(columnsToDisplay);
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

			var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

			var r = _.bind(store.rdf.resolve, store.rdf);

			//var bindings = dataox.objectify(data.results.bindings, ["subject", "presentation"]);
			store.graph(function(success, graph) {
				var all = function(s, p, o) {
					return graph.match(s, p, o).toArray();
				};
				var get = function(s, p, o) {
					var matches = all(s, p, o);
					return matches.length ? matches[0] : null;
				};
				var oneOf = function(s) {
					for (var i=1; i<arguments.length; i++) {
						var o = get(s, r(arguments[i]));
						if (o)
							return o.object;
					}
					return null;
				};
				

				for (var i=0, max=presentations.length; i<max; i++) {
					var presentation = presentations[i];
					var course = get(null, r('mlo:specifies'), presentation).subject;

					// for each result:
					//var  = data.results.bindings[i];
					var cells = {};

					var start = get(presentation, r('mlo:start'), null);
					if (start && columnsToDisplay.start) {
						start = start.object;
						start = oneOf(start, 'time:inXSDDateTime', 'rdf:value').valueOf();
						var startFormatted = weekday[start.getDay()] + " " + start.getDate() + " " + months[start.getMonth()] + " " + start.getFullYear() + ", " + start.getHours() + ":" + (start.getMinutes() < 10 ? "0" : "") + start.getMinutes();
						// remove T0:00 - not meaningful (all day? no time given?)
						if (startFormatted.match(/, 0:00/)) {
							startFormatted = startFormatted.replace('\, 0:00', '')
						}

						cells.start = $('<span>').text(startFormatted);
					}

					var title = oneOf(course, 'dcterms:title', 'rdfs:label');
					var applyTo = get(presentation, r('xcri:applyTo'));
					if ('title' in columnsToDisplay) {
						title = title ? title.valueOf() : '—';
						if (applyTo)
							cells.title = $('<a>', {title: presentation, href: applyTo.object.valueOf()}).text(title);
						else
							cells.title = $('<span>', {title: presentation}).text(title);
					}

					if ('subject' in columnsToDisplay) {
						var subjects = _.filter(_.map(all(course, r('dcterms:subject')), function(t) {
							var subject = t.object;
							// Ignore JACS codes
							if (subject.nominalValue.indexOf('http://jacs.dataincubator.org/') == 0)
								return undefined;
							return get(subject, r('skos:prefLabel')).object.valueOf();
						}), function(t) { return t != undefined; });
						cells.subject = $('<span>').text(subjects.join(', '));
					}

					var venue = oneOf(presentation, 'xcri:venue');
					if (venue && 'venue' in columnsToDisplay) {
						var venueLabel = oneOf(venue, 'rdfs:label', 'skos:prefLabel', 'dc:title');
						cells.venue = $('<span>').text(venueLabel ? venueLabel.valueOf() : "—");
					}

					var provider = get(null, 'mlo:offers', course);
					if (provider && 'provider' in columnsToDisplay) {
						var providerLabel = oneOf(provider, 'rdfs:label', 'skos:prefLabel', 'dc:title');
						cells.provider = $('<span>').text(providerLabel ? providerLabel.valueOf() : "—");
					}

					var row = $("<tr>");

					for(var column in columnsToDisplay) {
						row.append($('<td>').append(cells[column]));
					}
					tbody.append(row);
					continue;


					if ('description' in columnsToDisplay) {
						var courseDescription = "";
						if (binding.courseDescription) {
							courseDescription = binding.courseDescription.value;
						}
						rowToDisplay.description = '<td class="course-description">' + courseDescription + '</td>';
					}

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
			
			});

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
			if (dataTables) {
				$(e).children(".course-results-table").dataTable();//options.dataTableConfig);
			}

		}

		$('.courses-widget-container').each(function(i, e){ setUp(e);});
	});
});
