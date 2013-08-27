(function() {
	
	var defineDataox = function($, _, rdfstore) {
		var https = window.location.protocol != "http:";
		var dataox = function(options) {
			$.extend(this, {
				staticURL: $('body').attr('data-dataox-static-url') ||"https://static.data.ox.ac.uk/",
				sparqlURL: $('body').attr('data-dataox-sparql-url') ||"https://data.ox.ac.uk/sparql/",
				searchURL: $('body').attr('data-dataox-search-url') || "https://data.ox.ac.uk/search/",
				uriLookupURL: $('body').attr('data-dataox-uri-lookup-url') || "https://data.ox.ac.uk/doc/",

				osmTiles: https ? 'https://static.data.ox.ac.uk/osm-tiles/${z}/${x}/${y}.png' : 'http://tile.openstreetmap.org/${z}/${x}/${y}.png' , // OpenStreetMap
				ocmTiles: https ? 'https://static.data.ox.ac.uk/ocm-tiles/${z}/${x}/${y}.png' : 'http://tile.opencyclemap.org/cycle/${z}/${x}/${y}.png', // OpenCycleMap
				transportTiles: https ? 'https://static.data.ox.ac.uk/transport-tiles/${z}/${x}/${y}.png' : 'http://tile2.opencyclemap.org/transport/${z}/${x}/${y}.png', // OpenCycleMap Transport
				mapquestOpenTiles: https ? 'https://static.data.ox.ac.uk/mapquestopen-tiles/${z}/${x}/${y}.png' : 'http://otile4.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png', // MapQuest Open
								
				defaultZoom: 14,
				https: https
			}, options || {});
		};
		
		$.extend(dataox.prototype, {
			locationQuery: ["SELECT * WHERE {",
			                "  [SELECTOR]",
			                "  OPTIONAL { ?uri skos:prefLabel|rdfs:label ?label }",
			                "  OPTIONAL {",
			                "    ?uri org:subOrganizationOf* ?withSite . ?withSite [SITE] ?site .",
			                "    NOT EXISTS {",
			                "      ?uri org:subOrganizationOf* ?intermediate .",
			                "      ?intermediate org:subOrganizationOf+ ?withSite ; [SITE] ?intermediateSite",
			                "    }",
			                "  }",
			                "  BIND(IF(BOUND(?site), ?site, ?uri) AS ?place)",
			                "  OPTIONAL { ?place skos:prefLabel|rdfs:label ?placeLabel }",
			                "  OPTIONAL {",
			                "    ?place spatialrelations:within* ?withGeo . ?withGeo geo:lat ?lat ; geo:long ?lon .",
			                "    NOT EXISTS {",
			                "      ?place spatialrelations:within* ?intermediate .",
			                "      ?intermediate spatialrelations:within+ ?withGeo ; geo:lat ?intermediateLat ; geo:long ?intermediateLon",
			                "    }",
			                "  }",
			                "  OPTIONAL {",
			                "    ?place spatialrelations:within* ?withAdr . ?withAdr v:adr ?adr .",
			                "    OPTIONAL {",
			                "      ?withAdr skos:prefLabel|rdfs:label ?containerLabel",
			                "    }",
			                "    OPTIONAL { ?adr v:street-address ?streetAddress }",
			                "    OPTIONAL { ?adr v:extended-address ?extendedAddress }",
			                "    OPTIONAL { ?adr v:locality ?locality }",
			                "    OPTIONAL { ?adr v:postal-code ?postalCode }",
			                "    OPTIONAL { ?adr v:country-name ?countryName }",
			                "    NOT EXISTS {",
			                "      ?place spatialrelations:within* ?intermediate .",
			                "      ?intermediate spatialrelations:within+ ?withAdr ; v:adr ?intermediateAdr",
			                "    }",
			                "  }",
			                "}"].join("\n"),
			getElement: function(e) {
				if (typeof e == "string")
					return $(document.getElementById(e));
				if (typeof HTMLElement == "object" ? e instanceof HTMLElement : typeof e == "object" && e.nodeType == 1)
					return $(e);
				return e;
			},
			generatedIdIndex: 0,
			generateId: function() {
				return 'dataox-element-' + dataox.generatedIdIndex++;
			},
			// Autocomplete. See https://data.ox.ac.uk/docs/api/autocomplete.html
			autocomplete: function(e, options) {
				options = options || {};
	
				/* If false, we use the more minimal 'autocomplete' format,
				 * otherwise we ask for full search results                 */
				options.fullContent = !!(options.fullContent || options.focus || options.select);
	
				e = this.getElement(e); // get the jQuery-wrapped version
				var obj = e.get(0);              // and the original DOM object
	
				searchURL = options.searchURL || this.searchURL;
	
				// build the default params for AJAX calls
				var defaultParams = {format: options.fullContent ? 'json' : 'autocomplete'};
				for (var i = 0; i < obj.attributes.length; i++) {
					var attribute = obj.attributes[i];
					if (attribute.name.slice(0, 18) == 'data-autocomplete-')
						defaultParams[attribute.name.slice(18)] = attribute.value;
				}
	
				var h = $('<input type="hidden">').attr('name', e.attr('name')).val(e.val());
				e.attr('name', e.attr('name') + '-label').after(h);
				if (e.val()) {
					var originalVal = e.val();
					e.val("looking up…");
					$.get(searchURL, $.extend({}, defaultParams, {
						q: "uri:\""+originalVal+"\""
					}), function(data) {
						if (options.fullContent)
							e.val(data.hits.total ? data.hits.hits[0].label : originalVal);
						else
							e.val(data ? data[0].label : originalVal);
					}, this.jQueryDataType);
				}
				e.autocomplete({
					source: _.bind(function(request, callback) {
						$.get(searchURL, $.extend({}, defaultParams, {
							q: request.term + '*'
						}), function(data) {
							if (options.fullContent) {
								for (var i=0; i<data.hits.hits.length; i++) {
									data.hits.hits[i] = data.hits.hits[i]._source;
									data.hits.hits[i].value = data.hits.hits[i].uri;
								}
								callback(data.hits.hits);
							} else
								callback(data);
						}, this.jQueryDataType);
					}, this),
					minLength: 2,
					focus: function(event, ui) {
						e.val(ui.item.label);
						if (options.focus)
							options.focus(event, ui);
						return false;
					},
					select: function(event, ui) {
						e.val(ui.item.label);
						h.val(ui.item.value);
						if (options.select)
							options.select(event, ui);
						return false;
					}
				});
			},
			lonLat: function(map, lon, lat) {
				return new OpenLayers.LonLat(lon, lat)
					.transform(new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
					           map.getProjectionObject());
			},
			mapLayers: {
				"openstreetmap": function() { return new OpenLayers.Layer.OSM("OpenStreetMap", dataox.osmTiles, {attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"}); },
				"opencyclemap": function() { return new OpenLayers.Layer.OSM("OpenCycleMap", dataox.ocmTiles, {attribution: "&copy; <a href=\"http://www.thunderforest.com/opencyclemap/\">Thunderforest</a>, and <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"}); },
				"transport": function() { return new OpenLayers.Layer.OSM("Transport", dataox.transportTiles, {attribution: "&copy; <a href=\"http://www.thunderforest.com/transport/\">Thunderforest</a>, and <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"}); },
				"mapquest-open": function() { return new OpenLayers.Layer.OSM("MapQuest Open", dataox.mapquestOpenTiles, {attribution: "Tiles courtesy of <a href=\"http://www.mapquest.com/\">MapQuest</a>"}); },
				"google-physical": function() { return new OpenLayers.Layer.Google("Google Physical", {type: google.maps.MapTypeId.TERRAIN}); },
				"google-streets": function() { return new OpenLayers.Layer.Google("Google Streets", {numZoomLevels: 20}); },
				"google-hybrid": function() { return new OpenLayers.Layer.Google("Google Hybrid", {numZoomLevels: 20, type: google.maps.MapTypeId.HYBRID}); },
				"google-satellite": function() { return new OpenLayers.Layer.Google("Google Satellite", {numZoomLevels: 22, type: google.maps.MapTypeId.SATELLITE}); }
			},
	        maps: {}, // Stores mapping from element IDs to their options
			// Maps. https://data.ox.ac.uk/docs/api/maps.html
			map: function(e, options) {
				options = options || {};
				e = dataox.getElement(e);
				var domElement = e.get(0);
				if (!domElement.id)
					domElement.id = dataox.generateId();
	
				if (e.attr('data-layers'))
					options.layers = e.attr('data-layers').split(" ");
				else
					options.layers = options.layers || ["openstreetmap"];
	
				if (e.hasClass('olMap') && domElement.id in this.maps) {
					var previousOptions = dataox.maps[domElement.id];
					options.map = previousOptions.map;
					options.map.removeLayer(previousOptions.markers);
				} else {
					options.map = new OpenLayers.Map(domElement.id, { controls: [] });
					options.map.addControl(new OpenLayers.Control.Navigation());
					options.map.addControl(new OpenLayers.Control.Attribution());
					if (options.layers.length > 1)
						options.map.addControl(new OpenLayers.Control.LayerSwitcher());
	
					for (var i=0; i<options.layers.length; i++) {
						var layer = options.layers[i];
						if (typeof layer == "string")
							layer = this.mapLayers[layer]();
						if (typeof layer != "object")
							continue;
						options.map.addLayer(layer);
					}
				}
				this.maps[domElement.id] = options;
	
				options.markers = new OpenLayers.Layer.Markers( "Markers" );
				options.map.addLayer(options.markers);
	
				if (!options.places) options.places = [];
	
				options.zoom = options.zoom || e.attr('data-zoom');
				options.sitePredicate = options.sitePredicate || e.attr('data-site-predicate') || 'org:hasPrimarySite';
				options.selector = options.selector || e.attr('data-selector');
	
				var lon = options.lon || e.attr('data-lon');
				var lat = options.lon || e.attr('data-lat');
				if (lon && lat)
					options.places.push({
						lon: lon,
						lat: lat,
						label: options.label || e.attr('data-label')
					})
	
				var uris = [];
	
				var oxpointsID = options.oxpointsID || e.attr('data-oxpoints-id');
				if (oxpointsID) uris.push("http://oxpoints.oucs.ox.ac.uk/id/" + oxpointsID);
	
				var uri = options.uri || e.attr('data-uri');
				if (uri) uris.push(uri);
	
				var oxpointsIDs = options.oxpointsIDs || (e.attr('data-oxpoints-ids') ? e.attr('data-oxpoints-ids').split(" ") : []);
				for (var i=0; i<oxpointsIDs.length; i++)
					uris.push("http://oxpoints.oucs.ox.ac.uk/id/" + oxpointsIDs[i]);
	
				var otherURIs = options.uris || (e.attr('data-uris') ? e.attr('data-uris').split(" ") : []);
				for (var i=0; i<otherURIs.length; i++)
					uris.push(otherURIs[i]);
	
				if (options.selector || uris.length) {
					var query = this.locationQuery.replace("[SELECTOR]", options.selector || "VALUES ?uri { [URIS] }")
	                                              .replace("[URIS]", "<" + uris.join("> <") + ">")
					                              .replace(/\[SITE\]/g, options.sitePredicate);
					this.sparql(query, function(data) {
						var newPlaces = {};
						for (var i=0; i<data.results.bindings.length; i++) {
							var binding = data.results.bindings[i];
							if (!newPlaces[binding.place.value])
								newPlaces[binding.place.value] = {}
							for (var field in binding)
								newPlaces[binding.place.value][field] = binding[field].value;
						}
						for (var placeURI in newPlaces) {
							var newPlace = newPlaces[placeURI];
							if (!(newPlace.lon && newPlace))
								continue;
							if (newPlace.containerLabel == (newPlace.extendedAddress || newPlace.streetAddress) || newPlace.containerLabel == newPlace.label)
								delete newPlace.containerLabel;
							newPlace.address = [newPlace.containerLabel, newPlace.extendedAddress, newPlace.streetAddress, newPlace.locality, newPlace.postalCode, newPlace.CountryName];
	        				// Remove any elements of the address that are missing.
	        				for (var i=newPlace.address.length-1; i>=0; i--)
	        					if (!newPlace.address[i]) newPlace.address.splice(i, 1);
	        				options.places.push(newPlace);
						}
						this._mapShowPlaces(options);
					})
				} else if (options.places)
					this._mapShowPlaces(options);
			},
			_mapShowPlaces: function(options) {
				var size = new OpenLayers.Size(21,25);
				var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
				var icon = new OpenLayers.Icon(this.staticURL + 'marker.png', size, offset);
	
				for (var i=0; i<options.places.length; i++) {
					var place = options.places[i];
					place.lonLat = this.lonLat(options.map, place.lon, place.lat);
					place.marker = new OpenLayers.Marker(place.lonLat, icon.clone());
					options.markers.addMarker(place.marker);
					if (place.placeLabel && place.label && place.placeLabel != place.label)
						place.compositeLabel = place.label + " (" + place.placeLabel + ")";
					else
						place.compositeLabel = place.label || place.placeLabel;
					if (place.compositeLabel)
						$(place.marker.icon.imageDiv).attr('title', place.compositeLabel);
				}
	
				if (options.places.length == 0) {
					options.map.setCenter(this.lonLat(options.map, 0, 0), 1);
				} else if (options.places.length > 1) {
					options.map.zoomToExtent(options.markers.getDataExtent(), false);
				} else {
					options.map.setCenter(options.places[0].lonLat, options.zoom || this.defaultZoom);
				}
	
				if (options.complete) options.complete(options);
			},
			supportsCORS: ('withCredentials' in new XMLHttpRequest()),
			//jQueryDataType: ('withCredentials' in new XMLHttpRequest()) ? 'json' : 'jsonp',
			sparql: function(options, callback) {
				if (!$.isPlainObject(options))
					options = {query: options};
				var accepts = [], formats = [];
				if (options.type != 'graph') {
					accepts.push('application/sparql-results+json');
					formats.push('srj');
				}
				if (options.type != 'resultset') {
					accepts.push('text/turtle');
					formats.push('ttl')
				}
				var ajaxOptions = $.extend({
					url: options.sparqlURL || this.sparqlURL,
					type: "POST",
					headers: {Accept: accepts.join(', ')},
					data: {
						query: options.query,
						common_prefixes: options.commonPrefixes ? "on" : "",
						format: formats.join(',')
					},
					//dataType: 'jsonp',
					success: function(data, textStatus, xhr) {
						if (!options.type) {
							var contentType = xhr.getResponseHeader('Content-type');
							if (contentType.split(';')[0] == 'text/turtle')
								options.type = 'graph';
						}
						
						if (options.type == 'graph') {
							var store = new rdfstore.Store();
							store.load("text/turtle", data, function(success, results) {
								callback(store);
							});
						} else {
							callback(data);
						}
					}
				}, options.ajaxOptions || {});
				$.ajax(ajaxOptions);
			},
			objectify: function (bindings, groups) {
				if (bindings.results) bindings = bindings.results.bindings;
				groups = groups || [];
				var things = [], objID = 0;
				things.idMap = {};
				things.get = function(field) {
					return things.idMap["uri," + (field.value || field)];
				};
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
									var newThing = {};
									thing[lastName].idMap[id] = newThing;
									thing[lastName].push(newThing);
									thing = newThing;
								}
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
			},
			hooks: function() {
				$('.dataox-autocomplete').each(_.bind(function(i, e) { dataox.autocomplete(e); }), this);
				$('.dataox-map').each(_.bind(function(i, e) { dataox.map(e); }), this);

			}
		});
		return dataox;
	};

	if (window.define && define.amd)
		define(['jquery', 'underscore', 'rdfstore'], defineDataox);
	else
		window.dataox = defineDataox($, _, rdfstore);
})();
