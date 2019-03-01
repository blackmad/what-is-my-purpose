(function($) {
  "use strict";

  /* set up video */
  // Grab elements, create settings, etc.
  var video = document.getElementById("video");

  // Get access to the camera!
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Not adding `{ audio: true }` since we only want video now
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { min: 900, ideal: 1280, max: 1920 },
          height: { min: 700, ideal: 720, max: 1080 },
          aspectRatio: 4.0 / 6
        }
      })
      .then(function(stream) {
        //video.src = window.URL.createObjectURL(stream);
        video.srcObject = stream;
        video.play();
      });

    // const originalDisplayHeight = $(video).height();
    // const originalDisplayWidth = $(video).width();

    // if (originalDisplayWidth > originalDisplayHeight) {
    //   const newWidth = originalDisplayHeight / 0.68;
    //   const offset = originalDisplayWidth - newWidth;
    //   $("#videoDiv")[0].style.width = newWidth + "px";
    //   $("#videoDiv")[0].style.height = originalDisplayHeight + "px";
    //   video.style.marginLeft = -offset / 2 + "px";
    // } else {
    //   const newHeight = originalDisplayWidth / 0.68;
    //   const offset = originalDisplayHeight - newWidth;
    //   $("#videoDiv")[0].style.height = newHeight + "px";
    //   $("#videoDiv")[0].style.width = originalDisplayWidth + "px";
    //   video.style.marginTop = -offset / 2 + "px";
    // }
  }

  const placeholder_mappings = {
    "I think you should travel to": "... ",
    "I think you should meet": "... ",
    "I think you could": "... take up salsa dancing",
    "I think your creative practice is":
      "... about computers talking to people",
    "I want you to know that": "... none of this matters",
    "I think your work is": "... a start",
    "I think your work is about": "... to go off",
    "I want to help you": "... cook senegalese food",
    "I need": "... advice on how to pet cats good",
    "I want to introduce you to": "... a nice jewish girl",
    'What if you': '... '
  };

  function set_placeholder() {
    $("#message").attr(
      "placeholder",
      '... ' + $("#opening :selected").data('placeholder')
    );
  }

  var options = $("#opening > option");
  var random = Math.floor(options.length * (Math.random() % 1));
  $("#opening > option")
    .attr("selected", false)
    .eq(random)
    .attr("selected", true);

  $("#opening").on("change", set_placeholder);
  set_placeholder();

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

    if ($(message).val().length > 70) {
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

      function error_callback(data) {
        $('.beforeResponse').hide();
        $('.afterResponse.error').show()
        $("#error").html(data.responseJSON.err._response.body.error.message);
      }

      $.ajax({
        type: "POST",
        url:
          "https://rmzrok1de3.execute-api.us-east-1.amazonaws.com/prod/sendCard",
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
    const canvas = document.createElement("canvas");

    if (video.videoWidth > video.videoHeight) {
      const width = video.videoHeight / 0.68;
      const offset = video.videoWidth - width;
      canvas.width = width * 2;
      canvas.height = video.videoHeight * 2;

      canvas.getContext("2d").drawImage(
        video,
        offset / 2,
        0, // Start at 10 pixels from the left and the top of the image (crop),
        width,
        video.videoHeight, // "Get" a (w * h) area from the source image (crop),
        0,
        0, // Place the result at 0, 0 in the canvas,
        width * 2,
        video.videoHeight * 2
      ); // With as width / height: 160 * 60 (scale)
    } else {
      const height = video.videoWidth / 0.68;
      const offset = video.videoHeight - height;
      canvas.height = height * 2;
      canvas.width = video.videoWidth * 2;
      canvas
        .getContext("2d")
        .drawImage(video, 0, -offset, video.videoHeight * 2, height * 2);
    }

    var image = document.getElementById("myImage");
    image.src = canvas.toDataURL("image/png");

    $(".afterTaken").show();
    $(".beforeTaken").hide();
  });

  document.getElementById("retake").addEventListener("click", function() {
    $(".afterTaken").hide();
    $(".beforeTaken").show();
  });

  $(".afterTaken").hide();
  $('.beforeSubmit').show();
  $('.afterSubmit').hide();
})(jQuery);
