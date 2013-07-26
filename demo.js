define(["jquery", "dataox", "courses"], function($, DataOx) {
        $(function() {
        	var dataox = new DataOx();
        	
        	dataox.autocomplete("autocomplete-with-callback", {
        		select: function(event, ui) {
        			var dl = $('<dl>');
	                        var name = $('input#autocomplete-with-callback').val();
        			var metadata = $('#autocomplete-with-callback-metadata').empty().append(dl);
        			if (ui.item.uri) {
          
        				dl.append($('<dt>').text('Unit:'))
	                                  .append($('<dd>').html(name))
	                                  .append($('<dt>').text('Oxpoints URI:'))
        				  .append($('<dd>').html(ui.item.uri));
        			}
         		}
        	});
        });
});
