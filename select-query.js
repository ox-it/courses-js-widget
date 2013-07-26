define(["underscore"], function(_) {
	return function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='PREFIX dc: <http://purl.org/dc/elements/1.1/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX mlo: <http://purl.org/net/mlo/>\nPREFIX org: <http://www.w3.org/ns/org#>\nPREFIX oxcap: <http://purl.ox.ac.uk/oxcap/ns/>\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\nPREFIX time: <http://www.w3.org/2006/time#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX xcri: <http://xcri.org/profiles/1.2/>\n\nSELECT DISTINCT ?presentation WHERE {\n  VALUES ?unit { ';
 _.each(units, function(unit) { 
__p+='<'+
((__t=(unit))==null?'':__t)+
'>';
 }); 
__p+=' }\n  ?unit ^org:subOrganizationOf* ?provider .\n  ?provider mlo:offers ?course .\n  ?course mlo:specifies ?presentation .\n';
 if (!includeContinuingEducation) { 
__p+='\n  NOT EXISTS { <http://course.data.ox.ac.uk/id/continuing-education/catalog> skos:member ?course }\n';
 } 
__p+='\n  OPTIONAL {\n    ?presentation mlo:start/(rdf:value|time:inXSDDateTime) ?start\n  }\n';
 if (withoutDates) { 
__p+='\n  FILTER (!bound(?start))\n';
 } 
__p+='\n';
 if (startingAfter) { 
__p+='\n  FILTER (bound(?start) && ((datatype(?start) = xsd:date && ?start >= "'+
((__t=(startingAfter.substring(0, 10)))==null?'':_.escape(__t))+
'"^^xsd:date)\n                         || (tz(?start) && ?start >= "'+
((__t=(startingAfter))==null?'':_.escape(__t))+
'"^^xsd:dateTime)\n                         || (?start >= "'+
((__t=(startingAfter.substring(0, 19)))==null?'':_.escape(__t))+
'"^^xsd:dateTime)))\n';
 } 
__p+='\n}';
}
return __p;
};
});
