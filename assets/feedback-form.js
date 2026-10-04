/**
 * Website feedback: DAAB-style validate, disable-on-submit, POST FormData.
 */
(function () {
  "use strict";

  var MAX_FILE = 5 * 1024 * 1024;
  var FILE_EXT = { jpg: 1, jpeg: 1, png: 1, webp: 1, gif: 1, pdf: 1 };
  var sendState = "idle";
  var thumbUrl = "";

  var COPY = {
    az: {
      nameRequired: "Ad mütləqdir.",
      nameInvalid: "Zəhmət olmasa adı hərflərlə yazın.",
      unsafe:
        "Zəhmət olmasa bunu adi dildə yazın. Kod və sayta zərər verə biləcək mətn göndərilə bilməz.",
      emailInvalid: "Zəhmət olmasa etibarlı e-poçt ünvanı daxil edin.",
      emailRequired: "E-poçt ünvanı mütləqdir.",
      subjectRequired: "Mövzu mütləqdir.",
      messageRequired: "Rəy mətni mütləqdir.",
      typeRequired: "Rəyin növünü seçin.",
      urlInvalid: "Səhifə ünvanı http və ya https ilə başlamalıdır.",
      privacyRequired: "Davam etmək üçün məxfilik bildirişini təsdiq edin.",
      fileType: "Əlavə JPG, PNG, WEBP, GIF və ya PDF olmalıdır.",
      fileSize: "Əlavə 5 MB-dan böyük ola bilməz.",
      submitting: "Göndərilir…",
      submit: "Rəyinizi göndərin",
      submitFailed:
        "Rəy göndərilmədi. Məlumatlarınız formada qalıb — yenidən cəhd edin.",
      phpUnavailable:
        "Bu baxış serveri e-poçt göndərə bilmir. Canlı saytda rəy info@birinci.cloud ünvanına çatdırılır. Məlumatlarınız formada qalıb.",
      networkError:
        "Bağlantı kəsildi. Məlumatlarınız formada qalıb — yenidən cəhd edin.",
      fileReady: "Göndərməyə hazırdır"
    },
    en: {
      nameRequired: "A name is required.",
      nameInvalid: "Please enter your name using letters.",
      unsafe:
        "Please rewrite this in plain language. Code and other text that could harm the site cannot be sent.",
      emailInvalid: "Please enter a valid email address.",
      emailRequired: "An email address is required.",
      subjectRequired: "Subject is required.",
      messageRequired: "Your feedback is required.",
      typeRequired: "Choose a feedback type.",
      urlInvalid: "The page address must start with http:// or https://.",
      privacyRequired: "Please confirm the privacy notice before sending.",
      fileType: "The attachment must be a JPG, PNG, WEBP, GIF, or PDF file.",
      fileSize: "The attachment must be 5 MB or smaller.",
      submitting: "Sending…",
      submit: "Send your Feedback",
      submitFailed:
        "Your feedback could not be sent. What you entered is still in the form — please try again.",
      phpUnavailable:
        "This preview server cannot send email. On the live site, feedback is delivered to info@birinci.cloud. What you entered is still in the form.",
      networkError:
        "The connection failed. What you entered is still in the form — please try again.",
      fileReady: "Ready to submit"
    },
    ru: {
      nameRequired: "Укажите имя.",
      nameInvalid: "Введите имя буквами.",
      unsafe:
        "Напишите обычным языком. Код и текст, который может навредить сайту, отправить нельзя.",
      emailInvalid: "Введите действительный адрес электронной почты.",
      emailRequired: "Нужен адрес электронной почты.",
      subjectRequired: "Тема обязательна.",
      messageRequired: "Нужен текст отзыва.",
      typeRequired: "Выберите тип отзыва.",
      urlInvalid: "Адрес страницы должен начинаться с http:// или https://.",
      privacyRequired: "Подтвердите уведомление о конфиденциальности.",
      fileType: "Вложение должно быть JPG, PNG, WEBP, GIF или PDF.",
      fileSize: "Вложение не больше 5 МБ.",
      submitting: "Отправка…",
      submit: "Отправить отзыв",
      submitFailed:
        "Отзыв не отправлен. Данные остались в форме — попробуйте ещё раз.",
      phpUnavailable:
        "Этот просмотр не отправляет почту. На живом сайте отзыв уходит на info@birinci.cloud. Данные остались в форме.",
      networkError:
        "Связь прервалась. Данные остались в форме — попробуйте ещё раз.",
      fileReady: "Готово к отправке"
    },
    ky: {
      nameRequired: "Аты керек.",
      nameInvalid: "Атыңызды тамгалар менен жазыңыз.",
      unsafe:
        "Муну жөнөкөй тилде жазыңыз. Код жана сайтка зыян келтире турган текст жөнөтүлбөйт.",
      emailInvalid: "Жарактуу электрондук почта дарегин киргизиңиз.",
      emailRequired: "Электрондук почта дареги керек.",
      subjectRequired: "Тема керек.",
      messageRequired: "Пикир тексти керек.",
      typeRequired: "Пикирдин түрүн тандаңыз.",
      urlInvalid: "Барактын дареги http:// же https:// менен башталышы керек.",
      privacyRequired: "Купуялык билдирүүсүн ырастаңыз.",
      fileType: "Тиркеме JPG, PNG, WEBP, GIF же PDF болушу керек.",
      fileSize: "Тиркеме 5 МБдан чоң болбошу керек.",
      submitting: "Жөнөтүлүүдө…",
      submit: "Пикириңизди жөнөтүңүз",
      submitFailed:
        "Пикир жөнөтүлгөн жок. Маалыматыңыз формада калды — кайра аракет кылыңыз.",
      phpUnavailable:
        "Бул алдын ала көрүү сервери почта жөнөтө албайт. Жандуу сайтта пикир info@birinci.cloud дарегине жетет. Маалыматыңыз формада калды.",
      networkError:
        "Байланыш үзүлдү. Маалыматыңыз формада калды — кайра аракет кылыңыз.",
      fileReady: "Жөнөтүүгө даяр"
    }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function lang() {
    var body = document.body;
    var code = (body && body.getAttribute("data-lang")) || document.documentElement.lang || "en";
    return COPY[code] ? code : "en";
  }

  function text(key) {
    var pack = COPY[lang()] || COPY.en;
    return pack[key] || COPY.en[key] || "";
  }

  function showStatus(message, isError) {
    var box = byId("app-submit-status");
    if (!box) return;
    box.hidden = false;
    box.className = "app-submit-status" + (isError ? " app-submit-status--error" : "");
    box.textContent = message;
    box.setAttribute("role", isError ? "alert" : "status");
  }

  function clearStatus() {
    var box = byId("app-submit-status");
    if (!box) return;
    box.hidden = true;
    box.textContent = "";
    box.className = "app-submit-status";
  }

  function clearFieldNote(field) {
    if (!field) return;
    var group = field.closest
      ? field.closest(".field-group, .app-file-card, .opt-item")
      : null;
    var note = group ? group.querySelector(".field-required-warning") : null;
    if (note && note.parentNode) note.parentNode.removeChild(note);
    field.classList.remove("is-required-invalid");
  }

  function warn(field, message) {
    showStatus(message, true);
    if (!field) return;
    clearFieldNote(field);
    field.classList.add("is-required-invalid");
    field.setAttribute("aria-invalid", "true");
    var group =
      field.closest(".field-group, .app-file-card, .opt-item") || field.parentNode;
    var note = document.createElement("p");
    note.className = "field-required-warning";
    note.textContent = message;
    group.appendChild(note);
    try {
      field.focus({ preventScroll: true });
    } catch (e) {
      field.focus();
    }
    if (field.scrollIntoView) field.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clearWarnings() {
    clearStatus();
    document.querySelectorAll(".field-required-warning").forEach(function (node) {
      if (node.parentNode) node.parentNode.removeChild(node);
    });
    document.querySelectorAll(".is-required-invalid, [aria-invalid='true']").forEach(function (node) {
      node.classList.remove("is-required-invalid");
      node.removeAttribute("aria-invalid");
    });
  }

  function emailOk(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());
  }

  function nameOk(value) {
    return /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(String(value || "").trim());
  }

  function textUnsafe(value) {
    var raw = String(value || "");
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(raw)) return true;
    if (/<\s*\/?\s*[a-z!]/i.test(raw)) return true;
    if (/(?:javascript|vbscript|data)\s*:/i.test(raw)) return true;
    if (/<\?(?:php|=)?|<%/i.test(raw)) return true;
    if (/\bon(?:error|load|click|mouseover|focus)\s*=/i.test(raw)) return true;
    if (/%3c|&#x?0*60;|&lt;/i.test(raw)) return true;
    var folded = raw.toLowerCase();
    return (
      /\bunion\s+select\b/.test(folded) ||
      /\bdrop\s+table\b/.test(folded) ||
      /\binsert\s+into\b/.test(folded) ||
      /\bdelete\s+from\b/.test(folded) ||
      /\binformation_schema\b/.test(folded) ||
      /\bxp_cmdshell\b/.test(folded) ||
      /\binto\s+outfile\b/.test(folded) ||
      /\bload_file\s*\(/.test(folded) ||
      /\bor\s+1\s*=\s*1\b/.test(folded) ||
      /'\s*or\b/.test(folded) ||
      /['"]\s*;\s*--/.test(folded) ||
      /\b(?:sleep|benchmark)\s*\(/.test(folded) ||
      /\b(?:exec|execute)\s*\(/.test(folded)
    );
  }

  function urlOk(value) {
    var v = String(value || "").trim();
    if (!v) return true;
    if (v.length > 500 || /\s/.test(v)) return false;
    if (/^(javascript|data):/i.test(v)) return false;
    if (v.charAt(0) === "/") return v.charAt(1) !== "/";
    try {
      var url = new URL(v);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  function selectedFile() {
    var input = byId("attachment");
    return input && input.files && input.files[0] ? input.files[0] : null;
  }

  function fileError(file) {
    if (!file) return "";
    var name = String(file.name || "");
    var ext = name.indexOf(".") >= 0 ? name.split(".").pop().toLowerCase() : "";
    if (/\.(php\d?|phtml|phar|svg|html?|js|exe|dll|sh|bat|cmd|htaccess)(?:\.|$)/i.test(name)) {
      return text("fileType");
    }
    if (!FILE_EXT[ext]) return text("fileType");
    if (file.size > MAX_FILE) return text("fileSize");
    return "";
  }

  function setFileError(message) {
    var el = byId("attachment-error");
    var card = document.querySelector(".app-file-card");
    if (el) {
      el.hidden = !message;
      el.textContent = message || "";
    }
    if (card) card.classList.toggle("is-required-invalid", !!message);
  }

  function syncFileCard() {
    var file = selectedFile();
    var status = byId("attachment-status");
    var card = document.querySelector(".app-file-card");
    if (thumbUrl) {
      URL.revokeObjectURL(thumbUrl);
      thumbUrl = "";
    }
    if (!file) {
      if (status) status.hidden = true;
      if (card) card.classList.remove("is-selected");
      setFileError("");
      return;
    }
    var error = fileError(file);
    setFileError(error);
    if (status) {
      status.hidden = false;
      var name = status.querySelector(".app-file-name");
      var ready = status.querySelector(".app-file-ready");
      if (name) name.textContent = file.name;
      if (ready) ready.textContent = error ? "" : text("fileReady");
    }
    if (card) card.classList.add("is-selected");
    var thumb = byId("attachment-thumb");
    if (thumb && /^image\//.test(file.type)) {
      thumbUrl = URL.createObjectURL(file);
      thumb.src = thumbUrl;
      thumb.hidden = false;
    } else if (thumb) {
      thumb.hidden = true;
      thumb.removeAttribute("src");
    }
  }

  function prefillUrl() {
    var field = byId("related-url");
    if (!field || field.value.trim()) return;
    var params = new URLSearchParams(window.location.search);
    var incoming = params.get("url") || params.get("page") || "";
    if (incoming && urlOk(incoming)) field.value = incoming;
  }

  function setSubmitting(on) {
    var btn = byId("appSubmitBtn");
    var form = byId("feedbackForm");
    if (btn) {
      btn.disabled = on;
      btn.classList.toggle("is-loading", on);
      btn.textContent = on ? text("submitting") : text("submit");
    }
    if (form) form.setAttribute("aria-busy", on ? "true" : "false");
  }

  function showSuccess() {
    document.querySelectorAll(".legal-feedback-form .form-section").forEach(function (section) {
      section.hidden = true;
    });
    var success = byId("success");
    if (success) {
      success.classList.add("active");
      success.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function validateFields() {
    var type = byId("feedback-type");
    var subject = byId("subject");
    var message = byId("message");
    var name = byId("name");
    var email = byId("email");
    var url = byId("related-url");
    var privacy = byId("privacyconfirm");
    if (!name || !name.value.trim()) {
      warn(name, text("nameRequired"));
      return false;
    }
    if (!nameOk(name.value)) {
      warn(name, text("nameInvalid"));
      return false;
    }
    if (textUnsafe(name.value)) {
      warn(name, text("unsafe"));
      return false;
    }
    if (!email || !email.value.trim()) {
      warn(email, text("emailRequired"));
      return false;
    }
    if (!emailOk(email.value)) {
      warn(email, text("emailInvalid"));
      return false;
    }
    if (!type || !type.value) {
      warn(type, text("typeRequired"));
      return false;
    }
    if (!subject || !subject.value.trim()) {
      warn(subject, text("subjectRequired"));
      return false;
    }
    if (textUnsafe(subject.value)) {
      warn(subject, text("unsafe"));
      return false;
    }
    if (!message || !message.value.trim()) {
      warn(message, text("messageRequired"));
      return false;
    }
    if (textUnsafe(message.value)) {
      warn(message, text("unsafe"));
      return false;
    }
    if (url && url.value.trim() && !urlOk(url.value)) {
      warn(url, text("urlInvalid"));
      return false;
    }
    var uploadError = fileError(selectedFile());
    if (uploadError) {
      setFileError(uploadError);
      warn(byId("attachment-choose") || byId("attachment"), uploadError);
      return false;
    }
    if (!privacy || !privacy.checked) {
      warn(privacy, text("privacyRequired"));
      return false;
    }
    return true;
  }

  function endpoint() {
    var form = byId("feedbackForm");
    if (form && form.getAttribute("action")) return form.getAttribute("action");
    return "mail-feedback.php";
  }

  function submitForm(event) {
    if (event) event.preventDefault();
    if (sendState === "sending" || sendState === "sent") return;
    var honeypot = byId("website");
    if (honeypot && String(honeypot.value || "").trim()) {
      sendState = "sent";
      showSuccess();
      return;
    }
    clearWarnings();
    if (!validateFields()) return;

    var form = byId("feedbackForm");
    var started = byId("form-started");
    var submitted = byId("submitted-at");
    var pageUrl = byId("page-url");
    if (submitted) submitted.value = new Date().toISOString();
    if (pageUrl) pageUrl.value = window.location.href;
    if (started && !started.value) started.value = String(Date.now());

    sendState = "sending";
    setSubmitting(true);
    fetch(endpoint(), {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "text/plain, */*" }
    })
      .then(function (response) {
        return response.text().then(function (body) {
          return { ok: response.ok, status: response.status, body: String(body || "") };
        });
      })
      .then(function (result) {
        var first = result.body.trim().split(/\r?\n/)[0].toLowerCase();
        if (result.ok && first === "success") {
          sendState = "sent";
          setSubmitting(false);
          showSuccess();
          return;
        }
        sendState = "idle";
        setSubmitting(false);
        var map = {
          "error:name": "nameRequired",
          "error:name_invalid": "nameInvalid",
          "error:unsafe": "unsafe",
          "error:email": "emailInvalid",
          "error:email_required": "emailRequired",
          "error:subject": "subjectRequired",
          "error:message": "messageRequired",
          "error:type": "typeRequired",
          "error:url": "urlInvalid",
          "error:privacy": "privacyRequired",
          "error:file_type": "fileType",
          "error:file_size": "fileSize",
          "error:file_invalid": "fileType"
        };
        if (result.status === 404 || result.status === 405 || result.status === 501) {
          showStatus(text("phpUnavailable"), true);
          return;
        }
        if (/<\?php/.test(result.body)) {
          showStatus(text("phpUnavailable"), true);
          return;
        }
        showStatus(text(map[first] || "submitFailed"), true);
      })
      .catch(function () {
        sendState = "idle";
        setSubmitting(false);
        showStatus(text("networkError"), true);
      });
  }

  function start() {
    var form = byId("feedbackForm");
    if (!form) return;
    var started = byId("form-started");
    if (started) started.value = String(Date.now());
    prefillUrl();
    form.addEventListener("submit", submitForm);
    var choose = byId("attachment-choose");
    var input = byId("attachment");
    if (choose && input) {
      choose.addEventListener("click", function () {
        input.click();
      });
    }
    document.querySelectorAll("[data-file-target='attachment']").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (input) input.click();
      });
    });
    var remove = document.querySelector(".app-file-remove");
    if (remove && input) {
      remove.addEventListener("click", function () {
        input.value = "";
        syncFileCard();
      });
    }
    if (input) input.addEventListener("change", syncFileCard);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
