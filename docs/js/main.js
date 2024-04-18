(function($) {
  "use strict";

  function parseQuery(queryString) {
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
  }

  const query = parseQuery(window.location.search);
  console.log(query);

  // GLOBAL VARS

  const isDev = query['dev'] != null;
  if (isDev) {
    $('.devMode').show();
  } else {
    Sentry.init({ dsn: 'https://2981797acaa34bc9a08164cd1e86a1e5@sentry.io/1406004' });
  }

  var video = document.getElementById("video");
  var useMedia = false;

  // INIT CAMERA

  function initCamera() {
   function setUseMedia() {
      useMedia = true;
      $('.cameraStuff').hide();
      $('.mediaStuff').show();
    }

    // Get access to the camera!
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && query['file'] == null && query['file]'] == null) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              width: { min: 100 },
              height: { min: 100 }
             }
          })
          .then(function(stream) {
            video.srcObject = stream;
            video.play();
          })
          .catch((e) => setUseMedia())
      } else {
        setUseMedia();
      }
    } catch (err) {
      setUseMedia()
    }

    video.addEventListener( "loadedmetadata", function (e) {
      const originalDisplayHeight = $(video).height();
      const originalDisplayWidth = $(video).width();
      if (video.videoWidth > video.videoHeight) {
        console.log('wide')
        const newWidth = originalDisplayHeight / 0.68;
        const offset = originalDisplayWidth - newWidth;
        $("#videoDiv")[0].style.width = newWidth + "px";
        $("#videoDiv")[0].style.height = originalDisplayHeight + "px";
        video.style.marginLeft = -offset / 2 + "px";
      } else {
        console.log('tall')
        console.log(`originalDisplayWidth: ${originalDisplayWidth}, originalDisplayHeight: ${originalDisplayHeight}`)
        const newHeight = originalDisplayWidth / 0.68;
        const offset = originalDisplayHeight - newHeight;
        console.log(`newHeight: ${newHeight}, offset: ${offset}`)
        $("#videoDiv")[0].style.height = newHeight + "px";
        $("#videoDiv")[0].style.width = originalDisplayWidth + "px";
        video.style.marginTop = -offset / 2 + "px";
      }
    })
  }

  function initDropdowns() {
    function selectRandomOption(selector) {
      var options = $(`${selector} > option`);
      var random = Math.floor(options.length * (Math.random() % 1));
      console.log(options[random].text);
      $(selector).val(options[random].text)
    }

    function set_placeholder() {
      $("#message").attr(
        "placeholder",
        '... ' + $("#opening :selected").data('placeholder')
      );
    }

    selectRandomOption('#opening')
    selectRandomOption('#greeting')
    selectRandomOption('#closing')

    $(".selection-2").select2({
      minimumResultsForSearch: 20,
      dropdownParent: $('#dropDownSelect1')
    });

    $("#opening").on("change", set_placeholder);
    set_placeholder();
  }

  function upload_file() {
    console.log('upload file')
    function getBase64(file) {
      console.log('get base 64')
       var reader = new FileReader();
       reader.onload = function (e) {
          var image = document.createElement("img")
          image.src = e.target.result;
          // $('#myImage').attr('src', e.target.result);
          // $('#myImage').show()
          // $('.afterUpload').show();
          $(image).on('load', () => {
            scaleFromSource(
              image, image.width, image.height,
              () => $(".afterUpload").show());
          })
       };
       reader.onerror = function (error) {
         console.log('Error: ', error);
       };
       reader.readAsDataURL(file);
    }


    var file = document.querySelector('#uploadFileInput').files[0];
    getBase64(file); // prints the base64 string
  }


  function initHandlers() {
    $('#uploadFileInput').change(upload_file)
    //$('#uploadFileDiv').click(() => { $('#uploadFileInput').trigger()})
   $('#uploadFileButton').click((e) => { $('#uploadFileInput').click()})
    //$('div#uploadFile').click((e) => { debugger; $('uploadFileInput').trigger()})

    document.getElementById("retake").addEventListener("click", function() {
      $(".afterTaken").hide();
      $(".beforeTaken").show();
    });

    document.getElementById("reupload").addEventListener("click", function() {
      if (useMedia) {
        $('#uploadFileInput').click();
      } else {
        $(".afterUpload").hide();
        $(".beforeTaken.mediaStuff").show();
      }
    });

    document.getElementById("snap").addEventListener("click", take_photo);

    $(".afterTaken").hide();
    $('.beforeSubmit').show();
    $('.afterSubmit').hide();
  }

  function doAPIPost() {
    $(".beforeSubmit").hide();
    $(".afterSubmit").show();

    function callback(data) {
      $('.beforeResponse').hide();
      $('.afterResponse.success').show()
      $("#expectedDate").html(data.res.expected_delivery_date);
    }

    function error_callback(data, textStatus, errorThrown) {
      $('.beforeResponse').hide();
      $('.afterResponse.error').show();
      $('#savedMessage').html($('#message'));
      if (data.responseJSON) {
        $("#error").html(data.responseJSON.err._response.body.error.message);
      } else {
        $("#error").html(`${textStatus}: ${errorThrown || '???'}`)
      }
    }

    const isLocalhost = window.location.hostname === "localhost"  || window.location.hostname === '[::]' || window.location.hostname === '127.0.0.1'

    const postUrl = isLocalhost ? "http://localhost:3000/dev/sendCard" : isDev ?
      "https://jjt53ry4fg.execute-api.us-east-1.amazonaws.com/dev/sendCard" :
      "https://r5rta6c2ih.execute-api.us-east-1.amazonaws.com/production/sendCard";

    console.log("using", window.location.hostname, {isLocalhost, postUrl})

    $.ajax({
      type: "POST",
      url: postUrl,
      dataType: "json",
      crossDomain: true,
      data: {
        image_data: document.getElementById("myImage").src,
        message: $("#message").val(),
        greeting: $("#greeting option:selected").text(),
        opening: $("#opening option:selected").text() + " ",
        closing: $("#closing option:selected").text(),
        name: $("#name").val()
      },
      success: callback,
      error: error_callback
    });
  }

  function initValidators() {
    /*==================================================================
      [ Focus Contact2 ]*/
    $(".input100").each(function() {
      $(this).on("blur", function() {
        if (
          $(this)
            .val()
            .trim() != ""
        ) {
          $(this).addClass("has-val");
        } else {
          $(this).removeClass("has-val");
        }
      });
    });

    /*==================================================================
      [ Validate ]*/
    var text_max = 500;
    $("#count_message").html("0 / " + text_max);

    $("#message").keyup(function() {
      var text_length = $("#message").val().length;
      var text_remaining = text_max - text_length;

      $("#count_message").html(text_length + " / " + text_max);
    });

    /*==================================================================
      [ Validate ]*/
    var name = $('.validate-input input[name="name"]');
    var message = $('.validate-input textarea[name="message"]');

    $(".submit-button").on("click", function(e) {
      console.log('submitting')
      var check = true;

      if (
        $(name)
          .val()
          .trim() == ""
      ) {
        showValidate(name);
        check = false;
      }

      if (
        $(message)
          .val()
          .trim() == ""
      ) {
        showValidate(message);
        check = false;
      }

      if ($(message).val().length > 500) {
        showValidate(message);
        check = false;
      }

      if (check) {
        doAPIPost()
      }

      e.preventDefault();

      return check;
    });

    $(".validate-form .input100").each(function() {
      $(this).focus(function() {
        hideValidate(this);
      });
    });

    function showValidate(input) {
      var thisAlert = $(input).parent();

      $(thisAlert).addClass("alert-validate");
    }

    function hideValidate(input) {
      var thisAlert = $(input).parent();

      $(thisAlert).removeClass("alert-validate");
    }
  }

  function scaleFromSource(src, initialWidth, initialHeight, updateLayoutCallback) {
    $(".beforeTaken").hide();
    $('.whileTaking').show();

    var canvas = document.createElement("canvas")
    // $('#imageCenter').append(canvas)
    var offscreenCanvas = false;
    if (canvas.transferControlToOffscreen != null) {
      offscreenCanvas = true;
      canvas = canvas.transferControlToOffscreen();
    }

    console.log(`initial res: ${initialWidth} x ${initialHeight}`);

    var widthFromOriginalToTake = 0;
    var heightFromOriginalToTake = 0;
    var cropHeight = 0;
    var cropWidth = 0;
    if (initialWidth > initialHeight) {
      // wide / landscape
      cropHeight = 1275;
      cropWidth = 1875;

      heightFromOriginalToTake = initialHeight;
      widthFromOriginalToTake = initialHeight / 0.68;
      if (widthFromOriginalToTake > initialWidth) {
        console.log('that would give black bars, so switching')
        widthFromOriginalToTake = initialWidth;
        heightFromOriginalToTake = initialWidth * 0.68;
      }
    } else {
      // portrait / tall
      cropWidth = 1275;
      cropHeight = 1875;

      // we need to take a chunk of the original image that has an aspect ratio of 0.68
      // so we use the width which is the more constrained dimension to do our calculations
      widthFromOriginalToTake = initialWidth;
      heightFromOriginalToTake = initialWidth / 0.68;
      if (heightFromOriginalToTake > initialHeight) {
        console.log('that would give black bars, so switching')
        heightFromOriginalToTake = initialHeight;
        widthFromOriginalToTake = initialHeight * 0.68;
      }
    }

    // and we need x and y offsets for that
    const widthOffset = (initialWidth - widthFromOriginalToTake) / 2
    const heightOffset = (initialHeight - heightFromOriginalToTake) / 2



    console.log(`cropping to ${cropWidth} x ${cropHeight}`)
    console.log(`from original taking ${widthFromOriginalToTake} x ${heightFromOriginalToTake}`)
    console.log(`at offset ${widthOffset}, ${heightOffset}`)

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    canvas.getContext("2d", { alpha: true }).drawImage(
      src,
      // start at this offset
      widthOffset, heightOffset,
      // take this much of the image
      widthFromOriginalToTake, heightFromOriginalToTake,
      // place it at 0, 0 in the canvas
      0, 0,
      // scaling to the size of the canvas (same as how much we're taking)
      canvas.width, canvas.height
    )

    var image = document.getElementById("myImage");

    function blobToDataURL(blob, callback) {
      var a = new FileReader();
      a.onload = function(e) {callback(e.target.result);}
      a.readAsDataURL(blob);
    }

    function setImageDataUrl(dataUrl) {
      image.src = dataUrl;
      updateLayoutCallback()
      $('.whileTaking').hide();
    }

    if (offscreenCanvas) {
      canvas.convertToBlob({  type: "image/jpeg" }).then(function(blob) {
        blobToDataURL(blob, setImageDataUrl)
      })
    } else {
      setImageDataUrl(canvas.toDataURL('image/jpeg'));
    }
  }

  function take_photo() {
    scaleFromSource(
      video, video.videoWidth, video.videoHeight,
      () => $(".afterTaken").show())
  }

  initCamera()
  initDropdowns()
  initValidators()
  initHandlers()
})(jQuery);
