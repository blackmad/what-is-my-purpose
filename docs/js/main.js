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
    $('div#uploadFile').click((e) => $('uploadFileInput').trigger())

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

    const postUrl = isDev ?
      "https://jjt53ry4fg.execute-api.us-east-1.amazonaws.com/dev/sendCard" :
      "https://rmzrok1de3.execute-api.us-east-1.amazonaws.com/prod/sendCard";

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

    if (initialWidth > initialHeight) {
      // widescreen
      const width = Math.ceil(initialHeight / 0.68);
      const offset = initialWidth - width;

      var scaleFactor = 1
      scaleFactor = (1875 / width)*1.02

      canvas.width = width * scaleFactor;
      canvas.height = initialHeight * scaleFactor;
      console.log(`scaling portrait image to ${canvas.width} x ${canvas.height}`)

      canvas.getContext("2d", { alpha: true }).drawImage(
        src,
        offset / 2, // crop/offset
        0, // Start at 10 pixels from the left and the top of the image (crop),
        width, // "Get" a (w * h) area from the source image (crop),
        initialHeight, // area
        0,
        0, // Place the result at 0, 0 in the canvas,
        canvas.width,
        canvas.height
      ); // With as width / height: 160 * 60 (scale)
      console.log('cropped wide image')
    } else {
      const height = Math.ceil(initialWidth / 0.68);
      const offset = initialHeight - height;

      var scaleFactor = 1
      scaleFactor = (1875 / height)*1.02;

      canvas.height = height * scaleFactor;
      canvas.width = initialWidth * scaleFactor;
      console.log(`scaling portrait image to ${canvas.width} x ${canvas.height}`)

      canvas.getContext("2d", { alpha: true }).drawImage(
        src,
        0, // Start at 10 pixels from the left and the top of the image (crop),
        offset / 2, // crop/offset
        initialWidth, // "Get" a (w * h) area from the source image (crop),
        height, // area
        0, // Place the result at 0, 0 in the canvas,
        0,
        canvas.width,
        canvas.height
      ); // With as width / height: 160 * 60 (scale)
      console.log('cropped portrait image')
    }

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
