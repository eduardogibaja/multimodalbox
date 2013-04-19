/*
 *  MULTIMODALBOX - a lightbox plugin inspired in colorbox using jquery ui dialogs.
 *  Eduardo Gibaja <2012>
 */

var multimodalbox = function(options){
                    this.wrap,
                    this.topBorder,
                    this.leftBorder,
                    this.rightBorder,
                    this.bottomBorder,
                    this.container,
                    this.content,
                    this.title,
                    //this.open = false;
                    this.mutex = false;

                    // this prefix will be added to all the identifiers
                    this.prefix;

                    // this custom event get triggered when the content in the advent box is ready
                    this.loadEvent,
                    this.openEvent,
                    this.completeEvent,
                    this.cleanupEvent,
                    this.closedEvent;
                    
                    // dialogs for this object
                    this.dialog;                    
                    this.loading = false;
                    this.defaults = {
                        element : false,    //required
                        // options similar to colorbox
                        href    : false,    // str
                        data    : false,    // dictionary
                        inline  : false,    // boolean
                        iframe  : false,    // boolean
                        uiblocker: false,  
                        closable: true, 
                        photo   : false,
                        html    : false,    // str
                        width   : "auto",
                        height  : "auto",
                        maxWidth: "90%",
                        maxHeight:"90%",
                        onOpen  : false,
                        onLoad  : false,
                        onComplete: "false",   // use instead <<element_id>> + "_ready", (see documentation)
                        onCleanUp : "false",
                        onClose : "false",
                        isOpen    : false,   
                        isNew   : true,
                        open    : true,         //if true the multimodalbox is openned right after creation.  
                        // options from jquery ui dialog not present in the colorbox options
                        dialog  :{
                                autoOpen    : false,
                                dialogClass : "",
                                hide        : null,
                                modal       : true,
                                position    : "center",
                                //minWidth    : "150px",
                                minHeight   : "150px",
                                resizable   : false,
                                show        : null
                        }
                    };

                    // initialize the object
                    this.init(options);

};


var div = "div";

// Using html() , FF ignores DOM changes (different implementations of innerHTML between browsers) 
// code from: http://stackoverflow.com/questions/1388893/jquery-html-in-firefox-uses-innerhtml-ignores-dom-changes 
(function($) {
  var oldHTML = $.fn.html;

  $.fn.formhtml = function() {
    if (arguments.length) return oldHTML.apply(this,arguments);
    $("input,button", this).each(function() {
      this.setAttribute('value',this.value);
    });
    $("textarea", this).each(function() {
      this.innerHTML = this.value;
    });
    $("input:radio,input:checkbox", this).each(function() {
      // im not really even sure you need to do this for "checked"
      // but what the heck, better safe than sorry
      if (this.checked) this.setAttribute('checked', 'checked');
      else this.removeAttribute('checked');
    });
    $("option", this).each(function() {
      // also not sure, but, better safe...
      if (this.selected) this.setAttribute('selected', 'selected');
      else this.removeAttribute('selected');
    });
    return oldHTML.apply(this);
  };

  //optional to override real .html() if you want
  // $.fn.html = $.fn.formhtml;
})(jQuery);



// this function creates a new element for this dialog (with the proper prefix)
function tag(tag, id, css_classes, css) {
    var element = document.createElement(tag);

    if (id) {
        element.id = this.prefix + id;
    }
    if (css_classes){
            css_classes = [].concat(css_classes);
            $.each(css_classes, function(i, v){
                $(element).addClass(v);
        });
    }
    if (css) {
        element.style.cssText = css;
    }
    return $(element);
}


function trigger(element, custom_event, callback){
    $.event.trigger(custom_event);
    
    if (callback && (typeof(callback) == "function")){
        callback.call(element);
    }
}


// Generate the three divs wrapper
function generateWrap(data){
    if (!this.wrap){
        this.content = tag.apply(this,[div, "Content",["Content","Border"]]);
        this.title = tag.apply(this,[div, "Title", ["Title"]]);
        this.title.append(tag.apply(this,[div,"Close", "Close"]));
        this.content.append(data);
        this.container = tag.apply(this,[div,false, '', 'float:left;']);
        this.container.append(this.title, this.content);
        this.wrap = tag.apply(this,[div,"Wrapper", "Wrapper"]);
        this.wrap.append( // The 3x3 Grid that makes up multimodalbox
        tag.call(this,div).append(
            tag.apply(this,[div,"TopLeft", ["TopLeft","Corner","Border"]]),
            this.topBorder = tag.apply(this,[div, "TopCenter",["TopCenter","Border"]]),
            tag.apply(this,[div,"TopRight", ["TopRight","Corner","Border"]])
        ),
        tag.apply(this,[div,false, 'clear:left']).append(
            this.leftBorder = tag.apply(this,[div, "MiddleLeft", ["MiddleLeft","Border"]]),
            this.container,
            this.rightBorder = tag.apply(this,[div, "MiddleRight", ["MiddleRight","Border"]])
        ),
        tag.apply(this,[div, false, 'clear:left']).append(
            tag.apply(this,[div, "BottomLeft", ["BottomLeft","Corner","Border"]]),
            this.bottomBorder = tag.apply(this,[div, "BottomCenter", ["BottomCenter","Border"]]),
            tag.apply(this,[div, "BottomRight", ["BottomRight","Corner","Border"]])
        ));

    }else{
        // if wrap already existed, we are only updating his content
        this.content.html(data);
    }
    return this.wrap;
}

function percentageToPixel(dimension){
    if ((dimension)&&(dimension!="auto")){
        return (dimension.toString().slice(-1) == '%')? Math.round((parseInt(dimension)*screen.height)/100) : parseInt(dimension);
    }
    return dimension;
}

function formatWrap(){
    var a = this.defaults;
    a.width = percentageToPixel(a.width);
    a.height = percentageToPixel(a.height);
    a.maxHeight = percentageToPixel(a.maxHeight);
    a.minHeight = percentageToPixel(a.minHeight);

    $(a.element).css({"width": a.width, "height": a.height, "overflow": "hidden"});
    var bordersHeight = parseInt($(this.leftBorder).css("width")) * 2;
    var bordersWidth = parseInt($(this.bottomBorder).css("height")) * 2;
    var padding =  parseInt($(this.content).css("padding-top"))*2;
    var contentHeight = parseInt($(a.element).css("height")) - bordersHeight - padding - 25;
    var contentWidth = parseInt($(a.element).css("width")) - bordersWidth - padding; 
    $(this.content).css({
        "min-height" : a.minHeight,
        "max-height" : a.maxHeight,
        "height"     : contentHeight + "px",
        "width"      : contentWidth + "px",
        "overflow"   : "auto"
    });

    if (a.photo){
        $(this.content).find("div:eq(2)").css({
            "overflow": "auto",
            "max-height": contentHeight -30+ "px",
            "max-width" : contentWidth -20+ "px"
        });
    }
    if (a.iframe){
        $(this.content).find("iframe").css({
        "height"     : contentHeight - 20 + "px",
        "width"      : contentWidth + "px",
        "overflow"   : "auto"
        });
    }

    $(this.topBorder).css("width",$(this.content).outerWidth());
    $(this.bottomBorder).css("width", $(this.content).outerWidth());

    $(this.leftBorder).css({"height": $(this.content).outerHeight()+25});
    $(this.rightBorder).css("height", $(this.content).outerHeight()+25);
    this.defaults.isNew = false;


}

function updateOptions(options, current){
    // Here 'this' is window, use this function with apply or call
    $.each(options, function(k,v){
        if (k == "dialog"){
            $.each(v, function(k2, v2){
                current["dialog"][k2] = v2;
            });
        }
        current[k] = v;
    });

    // Jquery dialogs only accepts dimensions in pixels
    current.dialog["width"] = parseInt(percentageToPixel(current.width));
    current.dialog["height"] = parseInt(percentageToPixel(current.height));
    current.dialog["maxWidth"] = parseInt(percentageToPixel(current.maxWidht));
    current.dialog["maxHeight"] = parseInt(percentageToPixel(current.maxHeight));

    this.defaults = current;

}

//remove elements that already exist within a ui-dialog
function removeDuplicates(target){
    var matches = $(".ui-dialog").find("#"+target);
    if (matches.length > 1){
        //the element with the deepest path is the one we have to remove.
        var depths = $.map(matches, function(el,index){
                    return $(el).parents().length;                                    
        });
        var max = Math.max.apply(null,depths);
        var index = $.inArray(max,depths);
        $(matches[index]).remove();
    }
}


function appendLoaderDiv(){
    if ($("#multimodalbox_loading").length == 0){
        var loading = document.createElement('div');
        loading.id = 'multimodalbox_loading';
        var loading_img = document.createElement('img');
        loading_img.src = "/static/img/loading.gif";
        $(loading_img).css({'position':'relative','top':'40%','left':'45%'});
        $(loading).append(loading_img);
        return $(loading);
    }else{
        return $("#multimodalbox_loading")
    }
}

//display a loading img and block the UI
multimodalbox.prototype.showBlocker = function(){
    var this_box = this;
    var a = this_box.defaults;
    if (!this_box.loading){
        var loading = appendLoaderDiv();
        this_box.loading = $(loading).dialog(a.dialog);
    }
    this_box.loading.dialog("open");
    this_box.loading.dialog('option','width','328px');
    $("#multimodalbox_loading").css({'height':'200px', 'width':'300px', 'border':'14px solid black'});
    this_box.loading.dialog("option","position","center");
    return true;
}

multimodalbox.prototype.hideBlocker = function(){
    var this_box = this;
    var a = this_box.defaults;
    this_box.loading.dialog("close")
}

// initialize the object with the options given by the user
multimodalbox.prototype.init = function(options){
    var a = this.defaults;
    updateOptions.apply(this,[options, a]);
    if (!a.element){
        // probably an iframe 
        this.prefix = "iframe_"+new Date().getTime();
    }else{
        this.prefix = a.element.slice(1);
        // if we received an element but it doesn't exist yet... we create it! cause we are that nice!.
        if (!($(a["element"]).attr("id"))){
            a.element = tag.apply(this,[div,""," ","background-color:white"]);
            $(a.element).attr("id", this.prefix);
            $('body').append(a.element);
        }
    }
    this.loadEvent = $.Event(this.prefix + "_ready");
    this.openEvent = $.Event(this.prefix + "_open");
    this.completeEvent = $.Event(this.prefix + "_complete");
    this.cleanupEvent = $.Event(this.prefix + "_cleanup");
    this.closedEvent = $.Event(this.prefix + "_closed");
    this.create();
};

multimodalbox.prototype.create = function(){
    var this_box = this;
    var a = this_box.defaults;

    // content from the current document can be displayed by passing the href property a jQuery selector.
    if (a.inline){
        this_box.wrap = generateWrap.apply(this_box, [$(a.href).formhtml()]);
        $(a.element).html(this_box.wrap);
        this_box.dialog = $(a.element).dialog(a.dialog);
        if (a.open){
            this_box.open();
        }
		console.log("triguering");
        //trigger($(a.element),this_box.loadEvent, a.onLoad);
		$(a.element).trigger(this_box.loadEvent);
		console.log($(a.element));
		console.log(this_box.loadEvent);
		console.log(a.onLoad);
        this_box.listeners();
        this_box.mutex = false;

    }else if (a.html){
    // Display text or a HTML string
        this_box.wrap = generateWrap.apply(this_box, [a.html]);            
        $(a.element).html(this_box.wrap);
        this_box.dialog = $(a.element).dialog(a.dialog);
        if (a.open){
            this_box.open();
        }
        trigger($(a.element),this_box.loadEvent, a.onLoad);
        this_box.listeners();
        this_box.mutex = false
    }else if (a.photo){
        // Display a photo
        var img = "<div><img style='margin:8px;' src='"+a.href+"' ></div>";
        this_box.wrap = generateWrap.apply(this_box, [img]);            
        $(a.element).html(this_box.wrap);
        this_box.dialog = $(a.element).dialog(a.dialog);
        if (a.open){
            this_box.open();
        }
        trigger($(a.element),this_box.loadEvent, a.onLoad);
        this_box.listeners();
        this_box.mutex = false
    }else if (a.iframe){
        // Display iframe
        var iframe = "<iframe frameborder='0' src='"+a.href+"'><p>Your browser does not support iframes.</p></iframe>";
        if (!a.element){
            a.element = tag.apply(this_box,[div,"", "iFrame","background-color:white"]);
            $('body').append(a.element);
 
        }           
        // Just in case we didn't receive dimensions for the iframe...
        $(a.element).css({"width": "700px", "height":"700px"});
        this_box.showBlocker();
        this_box.wrap = generateWrap.apply(this_box, [iframe]);
        $(a.element).html(this_box.wrap);
        this_box.dialog = $(a.element).dialog(a.dialog);
        if (a.open){
            this_box.open();
            $(a.element).ready(function(){
                this_box.hideBlocker();
            });
        }
        trigger($(a.element),this_box.loadEvent, a.onLoad);
        this_box.listeners();
        this_box.mutex = false;
    }else if (!a.inline && a.href){
    // the content displayed will be the result of an Ajax call to the url in href
        
        var method = (a.data)? "POST":"GET";
        $.ajax({
                type    : method,
                url     : a.href,
                data    : a.data,
                beforeSend : function(){
                    if (a.open){
                        this_box.showBlocker();
                    }
                },      
                complete: function(){
                    if (a.open){
                        this_box.hideBlocker();
                    }
                },
                success : function(data){
                    this_box.wrap = generateWrap.apply(this_box, [data]);
                    $(a.element).html(this_box.wrap);
                    this_box.dialog = $(a.element).dialog(a.dialog);
                    if (a.open){
                        this_box.open();
                    }
                    this_box.listeners();
                    trigger($(a.element),this_box.loadEvent, a.onLoad);
                    this_box.mutex = false;
                   
                }
            });
    }else if (a.uiblocker){
        this_box.showBlocker();
    }else{
        alert("Unknown option");        
    }

};


// Update an existing multimodalbox object
multimodalbox.prototype.update = function(options){
    if (this.mutex){
        return;
    }
    this.mutex = true;
    updateOptions.apply(this, [options, this.defaults]);
    this.create();
};


multimodalbox.prototype.open = function(){
    var a = this.defaults;
    if (a.uiblocker){
        this.showBlocker();
    }else{
        if (a.isOpen){
            // If the dialog existed already this will prevent having several loadEvents associated with it.
            $(a.element).unbind(this.loadEvent);
        }
        // This fix a bug in nested dialogs in which the html content of one of the dialogs is an element of the other dialog (who receives its content via AJAX).
        // Example:  <div id="a"> Bob Lawbla {{dynamic generated content retrieve via ajax}} <div id="b">I'm so nested..</div></div>
        //         a.dialog(open) [a ui-dialog is created for a] --> b.dialog(open) [a ui-dialog element is created for b]
        //         -->  b.dialog(close) --> a.dialog(close) --> NEW a.dialog(open) [we receive the content via AJAX and now there two divs with id='b', one
        //          inside a ui-dialog, and the other within the new content of div 'a'] --> at this point, we have to remove one of the duplicate "b" divs (the newer one).
        removeDuplicates($(a.element).attr("id"));        
        a.isOpen = true;
        trigger($(a.element),this.openEvent, a.onOpen);
        $(a.element).dialog("open");
        formatWrap.call(this);
        // Once it has been opened don't close it if the multimodalbox gets updated.
        a.open = true;
        $(a.element).dialog("option","position","center");
    }
};

multimodalbox.prototype.close = function(){
    var a = this.defaults;
    if (a.uiblocker){
        this.hideBlocker();
    }else{
        a.isOpen = false;
        $(a.element).dialog("close");
        trigger($(a.element),this.closedEvent, a.onClose);
        // Jquery dialog likes to bind all the events (again) everytime we open the dialog, and we don't want several events
        // everytime we click or whatever
        $(a.element).unbind();
    }
};

multimodalbox.prototype.remove = function(){
    var a = this.defaults;
    $(a.element).off();
    // Stupid datepickers don't get destroyed when the multimodalbox is removed
    $("#"+this.prefix+" .hasDatepicker").datepicker("destroy");
    $(a.element).dialog("destroy");
    trigger($(a.element), this.cleanupEvent, a.onCleanup);  
    $(a.element).html(this.content.html());
};


multimodalbox.prototype.resize = function(width, height, mseconds){
    mseconds = mseconds || 400;
    var a = this.defaults;
    var newwidth = percentageToPixel(width);
    var newheight = percentageToPixel(height);
    var e_id = "#"+this.prefix;
    $(e_id+"Content, "+e_id+"MiddleLeft, "+e_id+"MiddleRight, "+e_id+"TopCenter, "+e_id+"BottomCenter, .Corner, "+e_id+"Close").hide();
    this.content.animate({height:parseInt(newheight)-97+"px", width:parseInt(newwidth)-72+"px"},mseconds, function(){ });  
    $(this.dialog).dialog("widget").animate({
            width: newwidth, 
            height: newheight
        }, {
            duration: mseconds,
            step: function() {
                $(this.dialog).dialog('option', 'position', 'center');
            },
            complete: function() {
                $(a.element).css({
                    width: parseInt(newwidth),
                    height: parseInt(newheight)
                    });
                $(e_id+"TopCenter, "+e_id+"BottomCenter").css({width: parseInt(newwidth)-42+"px"});
                $(e_id+"MiddleLeft, "+e_id+"MiddleRight").css({height: parseInt(newheight)-42+"px"});
                $(e_id+"Content, "+e_id+"MiddleLeft, "+e_id+"MiddleRight, "+e_id+"TopCenter, "+e_id+"BottomCenter, .Corner, "+e_id+"Close").fadeIn(300);
            }
        }
    );
    // Next time multimodalbox opens this will be its dimensions
    a.width = newwidth;
    a.height = newheight;
};


multimodalbox.prototype.listeners = function(){
    var this_box = this;
    var a = this_box.defaults;

    if (a.closable){
        $("#"+this_box.prefix+"Close, .ui-widget-overlay").click(function(){ 
            this_box.close();
        });
    }else{
        $(this_box.title).children(":first").hide();
        this_box.dialog.dialog( "option", "closeOnEscape", false );
    }
};


