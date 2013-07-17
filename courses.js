/*

Copyright (c) 2013 University of Oxford

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of the University of Oxford nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/


(function() {

// we assume jQuery is already loaded as per usgae instructions
// Localize jQuery variable
var jQuery;
jQuery = window.jQuery;
main();

/* Called once jQuery has loaded 
*/
function scriptLoadHandler() {
    // Restore $ and window.jQuery to their previous values and store the
    // new jQuery in our local jQuery variable
    jQuery = window.jQuery.noConflict(true);

    // Call our main function
    main(); 
}

/* Object converter - borrowed from http://snook.ca/archives/javascript/testing_for_a_v
 */
function oc(a)
{
    var o = {};
    for(var i=0;i<a.length;i++)
	{
	    o[a[i]]='';
	}
    return o;
}

/* Our main function 
*/
function main() {
    var objectify = function(bindings, groups) {
            if (bindings.results) bindings = bindings.results.bindings;
            groups = groups || [];
            var things = [], objID = 0;
            things.idMap = {};
            things.get = function(field) {
                return things.idMap["uri," + (field.value || field)];
            }; 
            var groupRefs = {};
            for (var i=0; i<bindings.length; i++) {
                var binding = bindings[i];

                var bindingID = binding.id || objID++;
                if ($.isPlainObject(bindingID)) bindingID = bindingID.type + "," + bindingID.value;

                for (var name in binding) {
                    if (name.substr(0, 1) == '_')
                        continue;

                    var thing;
                    if (bindingID in things.idMap)
                        thing = things.idMap[bindingID];
                    else {
                        thing = {};
                        things.idMap[bindingID] = thing;
                        things.push(thing);
                    }

                    if (name.substring(0, 1) == '_')
                        continue;
                    var splitName = name.split('_');
                    for (var j=0; j<splitName.length; j++) {
                        var subName = splitName.slice(0, j+1).join('_');
                        var lastName = splitName[j];
                        var isLast = j+1 == splitName.length;
                        var id = binding[subName + '_id'] || objID++;
                        if ($.isPlainObject(id)) id = id.type + "," + id.value;

                        if ($.inArray(subName, groups) >= 0) {
                            if (!(lastName in thing)) {
                                thing[lastName] = [];
                                thing[lastName].idMap = {};
                            }
                            if (id in thing[lastName].idMap)
                                thing = thing[lastName].idMap[id];
                            else {
                                var newThing = {}
                                thing[lastName].idMap[id] = newThing;
                                thing[lastName].push(newThing);
                                thing = newThing;
                            }
//                          if (isLast)
//                          $.extend(thing, binding[name]);
                            if (isLast)
                                thing[lastName] = binding[name];

                        } else {
                            if (!(lastName in thing))
                                thing[lastName] = {};

                            if (isLast)
                                thing[lastName] = binding[name];
                            else
                                thing = thing[lastName];
                        }
                    }
                }
            }
            return things;
        };


    jQuery(document).ready(function($) {
    
    		var dataTables = false; 

				if (jQuery.isFunction(jQuery.fn.dataTable) ) {
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
            href: "//static.data.ox.ac.uk/app/courses-1.0.css" 
        });
        css_link.appendTo('head');

				// add the loading icon

				        
        var paddedValue = function(v) {
          if (v < 10 ) {
          		v = "0"+v;
          }
          return v;
        }
        
        var now = function() {        
          d = new Date(); 
          return d.getFullYear() + "-" + paddedValue(d.getMonth()+1) + "-" + paddedValue(d.getDate()) + "T" + paddedValue(d.getHours()) + ":" + paddedValue(d.getMinutes()) + ":" + paddedValue(d.getSeconds());
        }
        
        // creates an options object with parameters from the containing div attributes
        // and then passes the element and the options on to getData
        var setUp = function(e) {
 	         options = {};
 	         options.noDates = false;
 	         options.title = ($(e).attr("data-title"))? $(e).attr("data-title") : "Courses";
	         options.displayColumns = ($(e).attr("data-displayColumns"))? $(e).attr("data-displayColumns") : "";
	         options.unit = ($(e).attr("data-providedBy"))? $(e).attr("data-providedBy") : "";
	         options.skill = ($(e).attr("data-skill"))? "https://data.ox.ac.uk/id/ox-rdf/descriptor/" + $(e).attr("data-skill") : "";
	         options.researchMethod = ($(e).attr("data-researchMethod"))? "https://data.ox.ac.uk/id/ox-rm/descriptor/" + $(e).attr("data-researchMethod") : "";	         
	         options.eligibilities = ($(e).attr("data-eligibilities"))? $(e).attr("data-eligibilities") : "";//"PU";
	         options.startingBefore = ($(e).attr("data-startingBefore"))? $(e).attr("data-startingBefore") : "";
	         options.startingAfter = ($(e).attr("data-startingAfter"))? $(e).attr("data-startingAfter") : "now";
	         
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
          
					var unitUri  = (options.unit)? options.unit : "http://oxpoints.oucs.ox.ac.uk/id/00000000";
					var subjectFilter = (subjectFilterValue) ? "FILTER (bound(?courseSubject) && ?courseSubject = <" + subjectFilterValue + ">)" : "";
					var eligibilityFilter = (options.eligibilities)? "EXISTS { ?course oxcap:eligibility/skos:notation ?eligibilityNotation. FILTER (datatype(?eligibilityNotation)=oxcap:eligibility && str(?eligibilityNotation) in ('" + options.eligibilities.split(" ").join("', '") + "'))}" : "";
					var startingBeforeFilter = (options.startingBefore && !options.noDates) ? "FILTER (bound(?start) && ((datatype(?start) = xsd:date && ?start <= \"" + options.startingBefore.substring(0, 10) + "\"^^xsd:date) || (tz(?start) && ?start <= \"" + options.startingBefore + "\"^^xsd:dateTime) || (?start <= \"" + options.startingBefore.substring(0, 19) + "\")))" : "";
					var startingAfterFilter = (options.startingAfter && !options.noDates) ? "FILTER (bound(?start) && ((datatype(?start) = xsd:date && ?start >= \"" + options.startingAfter.substring(0, 10) + "\"^^xsd:date) || (tz(?start) && ?start >= \"" + options.startingAfter + "\"^^xsd:dateTime) || (?start >= \"" + options.startingAfter.substring(0, 19) + "\")))" : "";
					var noDatesFilter = (options.noDates) ? "FILTER (!bound(?start))" : "";
					var applyUnitlInFuture = "FILTER !!!!TODO!!!!";
 
					var query = [
						"SELECT DISTINCT * WHERE {",
					  "VALUES ?unit_id { <"+ unitUri+"> }",
					  // every unit part of above unit
					  "?provider_id org:subOrganizationOf* ?unit_id ;",
					  // every course offered by every unit above
					  "  mlo:offers ?id ;",
					  // every label of every unit above (filters out units with no label
					  "  dcterms:title|dc:title ?provider_label .",
					  "NOT EXISTS { <http://course.data.ox.ac.uk/id/continuing-education/catalog> skos:member ?id }",
					  // course is a course
					  "?id a xcri:course .",
					  // fills in props
					  "OPTIONAL { ?id dcterms:title ?title }",
					  "OPTIONAL { ?id dcterms:description ?description }",
					  "OPTIONAL {",
					  "  ?id dcterms:subject/skos:related? ?subject_id",
					  "  OPTIONAL { ?subject_label skos:prefLabel ?subject_label }",
					  "}",
					  "OPTIONAL {", 
					  "  ?id oxcap:eligibility ?eligibility_id .",
					  "  OPTIONAL { ?eligibility_label skos:prefLabel ?eligibility_label}",
					  " }",
					  // instances of the course being run
					  "OPTIONAL {",
					  " ?id mlo:specifies ?presentation_id .",
					  " OPTIONAL { ?presentation_id xcri:applyTo ?presentation_applyTo }",
					  // start date 
					  " OPTIONAL {",
					  "    ?presentation mlo:start ?presentation_start_id .",
					  "    OPTIONAL { ?presentation_start_id rdf:value|time:inXSDDateTime ?presentation_start_dateTime }",
					  "    OPTIONAL { ?presentation_start_id rdfs:label ?presentation_start_label }",
					  "  }",
					  "  OPTIONAL {",
					  "   ?presentation_id xcri:venue ?presentation_venue_id .", 
					  // venue name
					  "   OPTIONAL { ?presentation_venue rdfs:label|dc:title ?presentation_venue_label }",
					  // venue lat lon
					  "   OPTIONAL {",
					  "     ?presentation_venue_id spatialrelations:within* ?_withGeo . ?_withGeo geo:lat ?presentation_venue_lat ; geo:long ?presentation_venue_lon .",
					  "     NOT EXISTS {",
					  "       ?presentationVenue spatialrelations:within* ?intermediate .",
					  "       ?intermediate spatialrelations:within+ ?_withGeo ; geo:lat ?intermediateLat ; geo:long ?intermediateLon",
					  "     }",
					  "   }",
					  // venue address
					  "   OPTIONAL {",
					  "     ?presentation_venue_id spatialrelations:within* ?presentation_venue_container_id . ?presentation_venue_container_id v:adr ?presentation_venue_adr_id .",
					  
					  "     OPTIONAL {",
					  "       ?presentation_venue_container_id skos:prefLabel|rdfs:label ?presentation_venue_container_label",
					  "     }",
					  "     OPTIONAL { ?presentation_venue_adr_id v:street-address ?presentation_venue_adr_streetAddress }",
					  "     OPTIONAL { ?presentation_venue_adr_id v:extended-address ?presentation_venue_adr_extendedAddress }",
					  "     OPTIONAL { ?presentation_venue_adr_id v:locality ?presentation_venue_adr_locality }",
					  "     OPTIONAL { ?presentation_venue_adr_id v:postal-code ?presentation_venue_adr_postalCode }",
					  "     OPTIONAL { ?presentation_venue_adr_id v:country-name ?presentation_venue_adr_countryName }",
					  "     NOT EXISTS {",
					  "       ?presentation_venue_id spatialrelations:within* ?intermediate .",
					  "       ?intermediate spatialrelations:within+ ?presentation_venue_container_id ; v:adr ?intermediateAdr",
					  "     }",
					  "   }",
					  " }",
					  "}",
					  eligibilityFilter,
					  subjectFilter,
					  startingBeforeFilter,
					  startingAfterFilter,
					  noDatesFilter,
						"} ORDER BY ASC(?courseTitle)"
					].join("\n");
										
					$.ajax({
						url: "https://data.ox.ac.uk/sparql/",
						    type: "GET",
						    data: {
							query: query,
							format: "srj",
							common_prefixes: "on"
							},
						    dataType: ('withCredentials' in new XMLHttpRequest()) ? 'json' : 'jsonp',
						    beforeSend: function() { $(e).children(".courses-widget-wait").show(); },
						    complete: function() { $(e).children(".courses-widget-wait").hide(); },
						    success: function(data) {
						    handleData(e, options, data);
						}
					});
				}

        // handles the query results 
 				var handleData = function(e, options, data) {
 				

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
					var columnsToDisplay = [];
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
	
					var tableHead = '<table class="course-results-table">' +
	                                                 '<thead>' +
						          '<tr>' +
						          tableHeaderCells +
	                                                  '</tr>' +
	                                                 '</thead>' + 
					                 '<tbody>';
	
					var tableRows = [];
					var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
					var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
					
					var presentations = [];
					
					var bindings = objectify(results.bindings, ["subject"]);
	
				  for (var i=0, max=bindings.length; i<max; i++) {
             
				    // for each result:
					  var binding = data.results.bindings[i];
					  var rowToDisplay = columnsToDisplay;
					    
					  if ($.inArray(binding.presentation.value, presentations) == -1) {

              presentations.push(binding.presentation.value); 

						  if ('start' in columnsToDisplay) {
						      var presentationStart = "";
						      if (binding.start) {
							  presentationStart = new Date(binding.start.value);
							  var presentationStartFormatted = weekday[presentationStart.getDay()] + " " + presentationStart.getDate() + " " + months[presentationStart.getMonth()] + " " + presentationStart.getFullYear() + ", " + presentationStart.getHours() + ":" + (presentationStart.getMinutes() < 10 ? "0" : "") + presentationStart.getMinutes();
							  // remove T0:00 - not meaningful (all day? no time given?)
							  if (presentationStartFormatted.match(/, 0:00/)) {
								  presentationStartFormatted = presentationStartFormatted.replace('\, 0:00', '')
							  }
	
						      }
						      rowToDisplay.start = '<td class="course-presentation-start">' + presentationStartFormatted + '</td>';
						  }
						  if ('title' in columnsToDisplay) {
						  		if (binding.courseTitle) {console.log(binding);
						        var courseTitle = binding.courseTitle.value;
						      }
						      if (binding.presentationApplyTo) {
							  courseTitle = '<a href="' + binding.presentationApplyTo.value + '"">' + courseTitle + '</a>';
						      }
						      rowToDisplay.title = '<td class="course-title">' + courseTitle + '</td>';
						  }
	
						  if ('subject' in columnsToDisplay) {
						      var courseSubject = "";
						      if (binding.courseSubjectLabel) {
							  courseSubject = binding.courseSubjectLabel.value;
						      }
						      rowToDisplay.subject = '<td class="course-subject">' + courseSubject + '</td>';
						  }
						  if ('provider' in columnsToDisplay) {
						      var courseProvider = "";
						      if (binding.unitLabel) {
							  courseProvider = binding.unitLabel.value;
						      }
						      rowToDisplay.provider = '<td class="course-provider">' + courseProvider + '</td>';
						  }
						  if ('description' in columnsToDisplay) {
						      var courseDescription = "";
						      if (binding.courseDescription) {
							  courseDescription = binding.courseDescription.value;
						      }
						      rowToDisplay.description = '<td class="course-description">' + courseDescription + '</td>';
						  }
						  if ('venue' in columnsToDisplay) {
						      var presentationVenueLabel = "";
						      if (binding.presentationVenueLabel) {
							  presentationVenueLabel = binding.presentationVenueLabel.value;
						      }
						      rowToDisplay.venue = '<td class="course-presentation-venue">' + presentationVenueLabel + '</td>';
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
						  
						  var row = "<tr>";
	
						  for(var column in rowToDisplay) {
						       row += rowToDisplay[column];
						  }
	
						  row += "</tr>";
						  tableRows.push(row);
						}
					}		
	  
					var tableFoot = '</tbody></table>';
					
					
					var linkTitle = (options.noDates)? "courses with specific dates" : "courses without specific dates";
					var $noDatesToggle = $('<a class="courses-widget-no-date-toggle-link" href="#">' + linkTitle + '</a>').click(function () {
	           options.noDates = (options.noDates)? false : true;
	           $(e).children('.course-results-table').remove();
	           $(e).children('.dataTables_wrapper').remove();
	           $(this).remove(); 
	           getData(e, options);	           
	           return false;
	         });

					$(e).append($noDatesToggle);

					$(e).append(tableHead + tableRows.join("\n") + tableFoot);
					if (dataTables) {
					  $(e).children(".course-results-table").dataTable();//options.dataTableConfig);
					}

				}
				 
        $('.courses-widget-container').each(function(i, e){ setUp(e);});
    });
}

})(); 
