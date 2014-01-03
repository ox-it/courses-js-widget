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

	function mixedContentSafeLink(text, url) {
		if(url.indexOf('http://') == 0) {
			return $('<a>', {title: text, href: url, target: "_blank"}).text(text);
		} else {
			return $('<a>', {title: text, href: url}).text(text);
		}
	}

	// Loads the parameters from div attributes and passses them to an Options instance
	function ParametersReader(options, element) {

		this.options = options;
		this.e = element;
		this.$e = $(div);

		this.fetch = function(param) {
			return $e.attr(param)
		}

		this.read = function() {
			options.setTitle(fetch("data-title"));
			options.setDisplaycolumns(fetch("data-displayColumns"));
			options.setUnits(fetch("data-providedBy"));
			options.setEligibilities(fetch("data-eligibility"));
			options.setResearchMethod(fetch("data-researchMethod"));
			options.setSkill(fetch("data-skill"));

			options.setStartingFilters(
				fetch("data-startingBefore"),
				fetch("data-startingAfter")
			);

			return options;
		}

	}

	// Holding the parameters for the widget
	function Options() {

		this.withoutDates = false;
		this.includeContinuingEducation = false;

		this.setTitle = function(title) {
			this.title = title || "Courses";
		}

		this.setDisplayColumns = function(columns) {
			this.displayColumns = columns ? trimWhitespace(columns).split(' ') : [];
		}

		this.trimWhitespace = function(string) {
			return string.replace(/^\s+|\s+$/g, '');
		}

		// assumes a space separated list
		this.setUnits = function(units) {
			this.units = (units || "").split(' ');
		}

		// assumes a space separated list
		this.setEligibilities = function(eligibilities) {
			this.eligibilities = (eligibilities || "OX PU").split(' ');
		}

		this.setResearchMethod = function(method) {
			this.researchMethod = method ? "https://data.ox.ac.uk/id/ox-rm/" + method : "";
		}

		this.setSkill = function(skill) {
			this.skill = skill ? "https://data.ox.ac.uk/id/ox-rdf/descriptor/" + skill : "";
		}

		this.setStartingFilters = function(before, after) {
			if (before == undefined) {
				if (after == undefined) {
					after = "now"; // set default to courses in the future
				}
			}

			// set to either now(), the current time, or failing these an empty string
			this.startingBefore = readNowAsCurrentTime(before || "");
			this.startingAfter  = readNowAsCurrentTime(after || "");
		}

		// helper function for setting dates
		this.readNowAsCurrentTime = function(param) {
			return param == "now" ? now() : param;
		}

		// controls the interface of the widget
		function WidgetUI(element) {
			this.e  = element;
			this.$e = $(element);

			this.appendLoadingMessage = function() {
				$('<div/>', {'class': 'courses-widget-wait', 'text': 'Loading courses...'})
					.append(loadingImage())
				  .appendTo($e);

				// I don't think this is necessary any more
				// $e.children(".courses-widget-wait").show();
			}

			this.loadingImage = function() {
				return $('<img/>', {'src': 'https://static.data.ox.ac.uk/loader.gif', 'alt': 'Please wait'})
			}

			this.addTitle = function(title) {
				$('<h2/>', {'class': 'courses-widget-title', 'text': title}).appendTo($e);
			}

			this.addNoDatesLink = function() {
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
			}

			this.addTable = function(tableHtml) {
				$e.append(tableHtml);
			}

			this.configureDataTables = function(availableColumns) {

				var dataTablesColumnsConfig = new Array();
				var columnCount = 0;

				for (var column in availableColumns) {
					switch (column.name) {
						case 'start':
							dataTablesColumnsConfig.push({ "sWidth": '8.1em', "aTargets":[columnCount], 'sType':'date'});
							break;
						default: break;
					}
					columnCount++;
				}

				dataTable = $e.children(".course-results-table").dataTable( {
					aoColumnDefs: dataTablesColumnsConfig,
					"iDisplayLength": 25,
					"oLanguage": {
						"sEmptyTable" : "No matching courses found.",
					},
				} );

			}
		}

		// prepares the call to data.ox.ac.uk
		function OxDataCall() {

			this.url = 'https://data.ox.ac.uk/search/?callback=?';

			this.params = {
				'format'    : 'js',
				'type'      : 'presentation',
				'q'         : '*',
				'page_size' : 10000,
			}

			this.Fields = {
				QUERY         : 'q',
				UNIT_ANCESTOR : 'filter.offeredByAncestor',
				WITHOUT_DATES : 'filter.start.time',
				START_AFTER   : 'gte.start.time',
				START_BEFORE  : 'lt.start.time',
				SUBJECT_URI   : 'subject.uri',
				METHOD_URI    : 'filter.researchMethod.uri'
			}

			this.prepare = function(options) {
				this.setQuery(options.includeContinuingEducation);
				this.setUnits(options.units);

				if(options.withoutDates) {
					this.setNoDates();
				} else {
					this.setDates(options.startingBefore, options.startingAfter);
				}

				this.setEligibility(options.eligibilities);
				this.setSkill(options.skill);
				this.setResearchMethod(options.researchMethod);

			}

			this.set = function(name, value) {
				this.params[name] = value;
			}

			this.setQuery = function(includeCE) {
				set(Fields.QUERY, includeCE ? '*' : '* NOT offeredBy.label:"Department of Continuing Education"');
			}

			this.setUnits = function(units) {
				var uri = (units && units.length > 0) ? units : 'http://oxpoints.oucs.ox.ac.uk/id/00000000';
				set(Fields.UNIT_ANCESTOR, uri);
			}

			this.setNoDates = function() {
				set(Fields.WITHOUT_DATES, '-');
			}

			this.setDates = function(before, after) {
				if(before) set(Fields.START_BEFORE, before);
				if(after)  set(Fields.START_AFTER, after);
			}

			this.EligibilityIndex = {
				'SU': 'oxcap:eligibility-public',
				'OX': 'oxcap:eligibility-members',
				'ST': 'oxcap:eligibility-staff'
			}

			this.setEligibility = function(eligibilities) {
				var list = $.map(eligibilities, function(val, i) {
						return EligibilityIndex[val] ? val : null;
					});
				set(Fields.ELIGIBILITY_URIS, list);
			}

			this.setSkill = function(skill) {
				if (skill) set(Fields.SUBJECT_URI, skill);
			}

			this.setResearchMethod = function(method) {
				if (method) set(Fields.METHOD_URI, method);
			}

			this.perform = function(callback) {
				$.ajaxSettings.traditional = true;
				$.getJSON(url, params, callback);
			}

		}

		// responsible for putting the results table together
		//   @param chosenColumns the columns that were specified in the div on initialisation
		//   @param showDates boolean flag indicating whether dates should be shown
		function TableBuilder(chosenColumns, showDates) {

			this.rows = [];
			this.columns = [];

			// let's initialise these columns based on the what was chosen in the options
			if (chosenColumns && chosenColumns.size > 0) {
				var availableColumns = this.filter(Fields, function(x) {
						return this.isAChosenColumn(x, chosenColumns) && this.canDisplaycolumn(x, showDates);
					});
				this.columns = this.convertToObject(availableColumns);
			} else {
				this.columns = Fields;
			}

			// public
			this.availableColumnbs = function() {
				return this.columns;
			}

			this.addRows = function(rows) {
				for (var i in rows) {
					this.rows.push(rows[i]);
				}
			}

			this.build = function() {
				var table = $('<table/>', {'class': 'course-results-table'});

				var head = $('<thead/>');
				for (var i in this.columns) {
					head.append(this.columns[i].toHtml());
				}
				table.append(head);

				var body = $('<tbody/>');
				for (var i in this.rows) {
					body.append(this.rows[i].toHtml());
				}
				table.append(body);

				return table;
			}

			// private
			this.isAChosenColumn = function(column, chosenColumns) {
				return $.inArray(column.name, chosenColumns);
			}

			this.canDisplayColumn = function(column, showDates) {
				return showDates || column.name != 'start';
			}

			this.filter = function(list, predicate) {
				newList = [];
				for(var i in list) {
					if (predicate(list[i])) {
						newList.push(list[i]);
					}
				}
				return newList;
			}

			this.convertToObject = function(list) {
				newList = {};
				for(var i in list) {
					newList[list[i]] = true;
				}
				return newList;
			}
		}

		function Column(name, text, classname) {
			this.name       = name
			this.classname  = classname
			this.text       = text

			this.toHtml = function() {
				return $('<th/>', {'text': text, 'class': classname});
			}
		}

		var Fields = {
			START       : Column('start',       'Start date',  'course-presentation-start'),
			TITLE       : Column('title',       'Title',       'course-title'),
			SUBJECT     : Column('subject',     'Subject(s)',  'course-subject'),
			VENUE       : Column('venue',       'Venue',       'course-presentation-venue'),
			PROVIDER    : Column('provider',    'Provider',    'course-provider'),
			DESCRIPTION : Column('description', 'Description', 'course-description'),
			ELIGIBILITY : Column('eligibility', 'Eligibility', 'course-eligibility')
		};

		// handles the data that is returned from data.ox.ac.uk
		function ResponseParser(results) {
			this.presentations = results.hits.hits;
			// for date parsing
			this.momentLib = require('moment');

			this.toRows = function(availableColumns) {
				return $.map(presentations, function(presenatation, i) {
					result = presenation._source;

					row = new Row(availableColumns);
					row.setStart(result.start, this.momentLib);
					row.setTitle(result.label, result.applyTo, result.homepage);
					row.setSubjects(result.subject);
					row.setVenue(result.venue);
					row.setProvider(result.offeredBy);
					row.setDescription(result.description);
					row.setEligibility(result.eligibility);

					return row;
				});
			}
		}

		function Row(availableColumns) {
			this.cells = {}
			this.columns = availableColumns;

			this.addCell = function(field, html) {
				if ($.inArray(field, columns)) {
					this.cells[name] = html;
				}
			}

			this.toHtml = function() {
				var tds = $.map(this.cells, function(html, i) {
						$('<td/>').append(html);
					});
				return $('<tr/>').append(tds.join(''));
			};

			this.setStart = function(start, momentLib) {
				if(start) {
					// Mon 1 Oct 2012
					this.addCell(Fields.START, momentLib(start.time).format("ddd D MMM YYYY"));
				}
			}

			this.setTitle = function(label, apply, homepage) {
				title = label ? label.valueOf() : '-';

				if (apply) {
					this.addCell(Fields.TITLE, mixedContentSafeLink(label, applyTo.uri));
				} else if (homepage) {
					this.addCell(Fields.TITLE, mixedContentSafeLink(label, homepage.uri));
				} else {
					this.addCell(Fields.TITLE, $('<span/>', {'title': label, 'text': label}));
				}
			}

			this.setSubjects = function(subjects) {
				if (subjects) {
					var notJACS = new Array();
					for (j in subjects) {
						if (!this.isJacsCode(subjects[j].uri)) {
							notJACS.push(subjects[j].label);
						}
					}
					this.addCell(Fields.SUBJECT, $('<span>').text(notJACS.join(', ')));
				}
			}

			this.isJacsCode = function(code) {
				return code.indexOf('http://jacs.dataincubator.org/') == 0;
			}

			this.setVenue = function(venue) {
				if (venue) {
					var label = venue.label || '-';
					this.addCell(Fields.VENUE, label);
				}
			}

			this.setProvider = function(provider) {
				if (provider) {
					var label = provider.label || '-';
					this.addCell(Fields.PROVIDER, label);
				}
			}

			this.setDescription = function(description) {
				if (description) {
					this.addCell(Fields.DESCRIPTION, description);
				}
			}

			this.setEligibility = function(eligibility) {
				if (eligibility) {
					this.addCell(Fields.ELIGIBILITY, this.capitalise(eligibility));
				}
			}

			this.capitalise = function(sentence) {
				capitalised = sentence.label.charAt(0).toUpperCase() + sentence.label.slice(1)
			}
		}
	}

/* Our main function 
*/
	$(function() {

		add_css("//static.data.ox.ac.uk/lib/DataTables/media/css/jquery.dataTables.css");
		add_css("//static.data.ox.ac.uk/courses-js-widget/courses.css");

		var setUp = function(e) {

			var reader  = new ParametersReader(new Options(), e);
			var options = reader.read();

			var ui = new WidgetUI(e);
			ui.addTitle(options.title);
			ui.addLoadingMessage();

			call = new OxDataCall();
			call.prepare(options);
			callback = function(json) { handleData(e, options, json); };
			call.perform(callback);

		};

		// handles the query results 
		var handleData = function(e, options, results) {

			var parser  = new ResponseParser(results);
			var tabler  = new TableBuilder(options.displayColumns, !options.withoutDates);

			var availableColumns = tabler.availableColumns();

			tabler.addRows(parser.toRows(availableColumns));

			ui.addTable(tabler.build);
			// ui.addNoDatesLink();
			ui.configureDataTables(availableColumns);

			$(e).children(".courses-widget-wait").hide();

		};

		$('.courses-widget-container').each(function(i, e){ setUp(e);});
	});
});
