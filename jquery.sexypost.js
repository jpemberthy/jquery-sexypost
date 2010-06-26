/*!
 * jQuery.sexyPost v1.0.0
 * http://github.com/jurisgalang/
 *
 * Copyright 2010, Juris Galang
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://github.com/jurisgalang/
 *
 * Date: Sat June 26 14:20:01 2010 -0800
 */
(function($){
  $.fn.sexyPost = function(options) {
    var events = [ "onstart", "onprogress", "oncomplete", "onerror", "onabort", "onfilestart", "onfilecomplete" ];
    var config = { 
      // options
      async : true,                                              // set to true to submit the form asynchronously
                                                                 
      // events                                                  
      onstart   : function(event) { },                           // triggered right before the form is submitted
      onprogress: function(event, completed, loaded, total) { }, // repeatedly triggered while the form is being submitted
      oncomplete: function(event, responseText) { },             // triggered after the form has been fully submitted
      onerror   : function(event) { },                           // triggered if an error occurs during submission
      onabort   : function(event) { }                            // triggered if an abort() signal is received
    };

    if (options) $.extend(config, options);
    
    this.each(function(){
			for (event in events) {
				if (config[events[event]]) {
					$(this).bind("sexyPost." + events[event], config[events[event]]);
				}
			}

      // override default submit event for the form to use the plugins own post function. 
      var form = $(this);

      form.submit(function(){ 
        var action = $(this).attr("action");
        var method = $(this).attr("method");
        send(this, action, method, config.async);
        return false; 
      });
      
      // controls may trigger form submission if tagged with the submit-trigger class
      $(".submit-trigger", form).not(":button")
        .bind("change", function(){ form.trigger("submit"); });

      $(".submit-trigger", form).not(":input")
        .bind("click", function(){ form.trigger("submit"); });

      // create request object and configure event handlers
      var xhr = new XMLHttpRequest();
      
      xhr.onloadstart = function(event) { 
        form.trigger("sexyPost.onstart");    
      }

      xhr.onload = function(event) { 
        form.trigger("sexyPost.oncomplete", [xhr.responseText]); 
      }

      xhr.onerror = function(event) { 
        form.trigger("sexyPost.onerror");    
      }

      xhr.onabort = function(event) { 
        form.trigger("sexyPost.onabort");    
      }

      xhr.upload["onprogress"] = function(event) { 
        var completed = event.loaded / event.total;
        form.trigger("sexyPost.onprogress", [completed, event.loaded, event.total]); 
      }
      
      // this function will POST the contents of the selected form via XmlHttpRequest.
      function send(form, action, method, async) {
        var data = new FormData();
        
        $("input:text, input:hidden, input:password, textarea", form).each(function(){
          data.append($(this).attr("name"), $(this).val());
        });
        
        $("input:file", form).each(function(){
          var files = this.files;
          for (i=0; i<files.length; i++) data.append($(this).attr("name"), files[i]);
        });

        $("select option:selected", form).each(function(){
          data.append($(this).parent().attr("name"), $(this).val());
        });
        
        $("input:checked", form).each(function(){
          data.append($(this).attr("name"), $(this).val());
        });
        
        xhr.open(method, action, async);  
				xhr.setRequestHeader("Cache-Control", "no-cache");
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.send(data);
      }
    });

    return this;
  }
})(jQuery);