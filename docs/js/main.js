(function($) {
  "use strict";

  const isDev = (window.location.search == '?dev');

  /* set up video */
  // Grab elements, create settings, etc.
  var video = document.getElementById("video");
  var useMedia = false;

  function setUseMedia() {
    useMedia = true;
    $('.cameraStuff').hide();
    $('.mediaStuff').show();
  }

  // Get access to the camera!
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      navigator.mediaDevices
        .getUserMedia({
          video: {
            width: { min: 900, ideal: 1275 },
            height: { min: 700, ideal: 1875 },
            aspectRatio: 4.0 / 6
          }
        })
        .then(function(stream) {
          video.srcObject = stream;
          video.play();
        })
        .catch((e) => setUseMedia())
      } catch (err) {
        setUseMedia()
      }
  } else {
    setUseMedia();
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

  function set_placeholder() {
    $("#message").attr(
      "placeholder",
      '... ' + $("#opening :selected").data('placeholder')
    );
  }

function selectRandomOption(selector) {
  var options = $(`${selector} > option`);
  var random = Math.floor(options.length * (Math.random() % 1));
  console.log(options[random].text);
  $(selector).val(options[random].text)
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

  // deal with media

  function upload_file() {
    console.log('upload file')
    function getBase64(file) {
      console.log('get base 64')
       var reader = new FileReader();
       reader.readAsDataURL(file);
       reader.onload = function () {
          var image = document.getElementById("myImage");
          image.src = reader.result;
          $('.whileTaking').hide();
          $('.afterUpload').show();
       };
       reader.onerror = function (error) {
         console.log('Error: ', error);
       };
    }

    $(".beforeTaken").hide();
    $('.whileTaking').show();
    var file = document.querySelector('#uploadFileInput').files[0];
    getBase64(file); // prints the base64 string
  }
  $('#uploadFileInput').change(upload_file)
  $('div#uploadFile').click((e) => $('uploadFileInput').trigger())


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
  var text_max = 700;
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

    if ($(message).val().length > 700) {
      showValidate(message);
      check = false;
    }

    if (check) {
      $(".beforeSubmit").hide();
      $(".afterSubmit").show();

      function callback(data) {
        $('.beforeResponse').hide();
        $('.afterResponse.success').show()
        $("#expectedDate").html(data.res.expected_delivery_date);
      }

      function error_callback(data, textStatus, errorThrown) {
        $('.beforeResponse').hide();
        $('.afterResponse.error').show()
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

  // Elements for taking the snapshot
  var video = document.getElementById("video");

  // Trigger photo take
  document.getElementById("snap").addEventListener("click", function() {
    $(".beforeTaken").hide();
    $('.whileTaking').show();

    var canvas = document.createElement("canvas")
    var offscreenCanvas = false;
    if (canvas.transferControlToOffscreen != null) {
      offscreenCanvas = true;
      canvas = canvas.transferControlToOffscreen();
    }

    if (video.videoWidth > video.videoHeight) {
      // widescreen
      const width = Math.ceil(video.videoHeight / 0.68);
      const offset = video.videoWidth - width;

      var scaleFactor = 1
      if (width < 1875) {
        scaleFactor = (1875 / width)*1.02
        console.log('scaling widescreen image')
      }

      canvas.width = width * scaleFactor;
      canvas.height = video.videoHeight * scaleFactor;

      canvas.getContext("2d", { alpha: false }).drawImage(
        video,
        offset / 2, // crop/offset
        0, // Start at 10 pixels from the left and the top of the image (crop),
        width, // "Get" a (w * h) area from the source image (crop),
        video.videoHeight, // area
        0,
        0, // Place the result at 0, 0 in the canvas,
        canvas.width,
        canvas.height
      ); // With as width / height: 160 * 60 (scale)
      console.log('cropped wide image')
    } else {
      const height = Math.ceil(video.videoWidth / 0.68);
      const offset = video.videoHeight - height;

      console.log(`video res: ${video.videoWidth} x ${video.videoHeight}`);
      var scaleFactor = 1
      if (height < 1875) {
        scaleFactor = (1875 / height)*1.02;
        console.log('scaling portrait image')
      }

      canvas.height = height * scaleFactor;
      canvas.width = video.videoWidth * scaleFactor;

      canvas.getContext("2d", { alpha: false }).drawImage(
        video,
        0, // Start at 10 pixels from the left and the top of the image (crop),
        offset / 2, // crop/offset
        video.videoWidth, // "Get" a (w * h) area from the source image (crop),
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
      $('.whileTaking').hide();
      $(".afterTaken").show();
    }

    if (offscreenCanvas) {
      canvas.convertToBlob({  type: "image/jpeg" }).then(function(blob) {
        blobToDataURL(blob, setImageDataUrl)
      })
    } else {
      setImageDataUrl(canvas.toDataURL('image/jpeg'));
    }
  });

  document.getElementById("retake").addEventListener("click", function() {
    $(".afterTaken").hide();
    $(".beforeTaken").show();
  });

  document.getElementById("reupload").addEventListener("click", function() {
    $(".afterUpload").hide();
    $(".beforeTaken.mediaStuff").show();
  });

  $(".afterTaken").hide();
  $('.beforeSubmit').show();
  $('.afterSubmit').hide();


})(jQuery);
