// Fill in once a business inbox exists, e.g. "hello@datacentral.com".
var CONTACT_EMAIL = "";

document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("header nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  var form = document.querySelector("#contact-form-el");
  var status = document.querySelector("#contact-form-status");

  if (form && status) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!CONTACT_EMAIL) {
        status.textContent = "This form isn't connected to an inbox yet — add an address to CONTACT_EMAIL in main.js.";
        status.className = "contact-form-status is-error";
        status.hidden = false;
        return;
      }

      var data = new FormData(form);
      var subject = "New enquiry from " + (data.get("name") || "website visitor");
      var body = [
        "Name: " + (data.get("name") || ""),
        "Business: " + (data.get("business") || ""),
        "Email: " + (data.get("email") || ""),
        "Phone: " + (data.get("phone") || ""),
        "Industry: " + (data.get("industry") || ""),
        "",
        "Message:",
        data.get("message") || ""
      ].join("\n");

      window.location.href =
        "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      status.textContent = "Opening your email client to send this message...";
      status.className = "contact-form-status is-success";
      status.hidden = false;
    });
  }
});
