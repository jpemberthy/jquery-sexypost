/*!
 * jQuery.sexyPost v1.0.0
 * http://github.com/jurisgalang/jquery-sexypost
 *
 * Copyright 2010, Juris Galang
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Date: Sat June 26 14:20:01 2010 -0800
 */
(function($){
  $.fn.sexyPost = function(options) {
    var events = [ "start", "progress", "complete", "error", "abort", "filestart", "filecomplete" ];
    var config = {
      // options
      async    : true,                                           // set to true to submit the form asynchronously
      autoclear: false,                                          // automatically clear the form on successful post

      // events
      start   : function(event) { },                           // triggered right before the form is submitted
      progress: function(event, completed, loaded, total) { }, // repeatedly triggered while the form is being submitted
      complete: function(event, responseText) { },             // triggered after the form has been fully submitted
      error   : function(event) { },                           // triggered if an error occurs during submission
      abort   : function(event) { }                            // triggered if an abort() signal is received
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
        form.trigger("sexyPost.start");
      }

      xhr.onload = function(event) {
        if (config.autoclear && (xhr.status >= 200) && (xhr.status <= 204)) clearFields(form);
        form.trigger("sexyPost.complete", [xhr.responseText]);
      }

      xhr.onerror = function(event) {
        form.trigger("sexyPost.error");
      }

      xhr.onabort = function(event) {
        form.trigger("sexyPost.abort");
      }

      xhr.upload["onprogress"] = function(event) {
        var completed = event.loaded / event.total;
        form.trigger("sexyPost.progress", [completed, event.loaded, event.total]);
      }

      // this function will clear all the fields in a form
      function clearFields(form) {
        $(":input", form)
          .not(":button, :submit, :reset, :hidden")
          .removeAttr("checked").removeAttr("selected").val("");
      }

      // this function will POST the contents of the selected form via XmlHttpRequest.
      function send(form, action, method, async) {
        // now send the serialized fields over
        xhr.open(method, action, async);
        xhr.setRequestHeader("Cache-Control", "no-cache");
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        if (window.FormData) {
          var data = new FormData();

          var fields = $(form).serializeArray();
          $.each(fields, function(){
            data.append($(this).attr("name"), $(this).val());
          });

          $("input:file", form).each(function(){
            var files = this.files;
            for (i=0; i<files.length; i++) data.append($(this).attr("name"), files[i]);
          });

          xhr.send(data);
        } else if (window.FileReader) {
          var upl = new Uploader(form);
          upl.send(xhr);
        }
      }
    });

    return this;
  }
})(jQuery);

/*
 * Copyright (c) 2008-2009, Ionut Gabriel Stan. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 *    * Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer.
 *
 *    * Redistributions in binary form must reproduce the above copyright notice,
 *      this list of conditions and the following disclaimer in the documentation
 *      and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var Uploader = function(form) {
    this.form = form;
};

Uploader.prototype = {
    headers : {},

    /**
     * @return Array
     */
    get elements() {
        var fields = [];

        // gather INPUT elements
        var inputs = this.form.getElementsByTagName("INPUT");
        for (var l=inputs.length, i=0; i<l; i++) {
            fields.push(inputs[i]);
        }

        // gather SELECT elements
        var selects = this.form.getElementsByTagName("SELECT");
        for (var l=selects.length, i=0; i<l; i++) {
            fields.push(selects[i]);
        }

        // gather TEXTARE elements
        var textarea = this.form.getElementsByTagName("TEXTAREA");
        for (var l=textarea.length, i=0; i<l; i++) {
            fields.push(textarea[i]);
        }

        return fields;
    },

    /**
     * @return String
     */
    generateBoundary : function() {
        return "---------------------------" + (new Date).getTime();
    },

    /**
     * @param  Array elements
     * @param  String boundary
     * @return String
     */
    buildMessage : function(elements, boundary) {
        var CRLF  = "\r\n";
        var parts = [];

        elements.forEach(function(element, index, all) {
            var part = "";
            var type = "TEXT";

            if (element.nodeName.toUpperCase() === "INPUT") {
                type = element.getAttribute("type").toUpperCase();
            }

            if (type === "FILE" && element.files.length > 0) {
                var fieldName = element.name;
                var fileName  = element.files[0].fileName;

                /*
                 * Content-Disposition header contains name of the field used
                 * to upload the file and also the name of the file as it was
                 * on the user's computer.
                 */
                part += 'Content-Disposition: form-data; ';
                part += 'name="' + fieldName + '"; ';
                part += 'filename="'+ fileName + '"' + CRLF;

                /*
                 * Content-Type header contains the mime-type of the file to
                 * send. Although we could build a map of mime-types that match
                 * certain file extensions, we'll take the easy approach and
                 * send a general binary header: application/octet-stream.
                 */
                part += "Content-Type: application/octet-stream" + CRLF + CRLF;

                /*
                 * File contents read as binary data, obviously
                 */
                part += element.files[0].getAsBinary() + CRLF;
            } else {
                /*
                 * In case of non-files fields, Content-Disposition contains
                 * only the name of the field holding the data.
                 */
                part += 'Content-Disposition: form-data; ';
                part += 'name="' + element.name + '"' + CRLF + CRLF;

                /*
                 * Field value
                 */
                part += element.value + CRLF;
            }

            parts.push(part);
        });

        var request = "--" + boundary + CRLF;
            request+= parts.join("--" + boundary + CRLF);
            request+= "--" + boundary + "--" + CRLF;

        return request;
    },

    /**
     * @return null
     */
    send : function(xhr) {
        var boundary = this.generateBoundary();
        // var xhr      = new XMLHttpRequest;

        // xhr.open("POST", this.form.action, true);
        // xhr.onreadystatechange = function() {
        //     if (xhr.readyState === 4) {
        //         alert(xhr.responseText);
        //     }
        // };
        var contentType = "multipart/form-data; boundary=" + boundary;
        xhr.setRequestHeader("Content-Type", contentType);

        for (var header in this.headers) {
            xhr.setRequestHeader(header, headers[header]);
        }

        message = this.buildMessage(this.elements, boundary);
        // finally send the request as binary data
        xhr.sendAsBinary(message.replace(/✓/, ""));
    }
};
