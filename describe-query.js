define(["underscore"], function(_) {
	return function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='PREFIX dc: <http://purl.org/dc/elements/1.1/>\nPREFIX dcterms: <http://purl.org/dc/terms/>\nPREFIX mlo: <http://purl.org/net/mlo/>\nPREFIX org: <http://www.w3.org/ns/org#>\nPREFIX oxcap: <http://purl.ox.ac.uk/oxcap/ns/>\nPREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\nPREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\nPREFIX skos: <http://www.w3.org/2004/02/skos/core#>\nPREFIX time: <http://www.w3.org/2006/time#>\nPREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\nPREFIX xcri: <http://xcri.org/profiles/1.2/>\n\nDESCRIBE ?provider ?course ?presentation ?start ?venue ?subject WHERE {\n  VALUES ?presentation { ';
 _.each(presentations, function(presentation) { 
__p+='<'+
((__t=(presentation))==null?'':__t)+
'>';
 }); 
__p+=' }\n  ?course mlo:specifies ?presentation .\n  ?provider mlo:offers ?course\n  OPTIONAL { ?presentation mlo:start ?start }\n  OPTIONAL { ?presentation xcri:venue ?venue }\n  OPTIONAL { ?course dcterms:subject ?subject }\n}';
}
return __p;
};
});
