const translations = {
  en: {
    brandName: "Dalati English",
    widgetTitle: "Verify Certificate",
    verifyBtn: "Verify",
    errorEmpty: "Please enter a valid certificate code",
    errorNotFound:
      "Your certificate has not been added yet. New certificates are added on the first day of each month, so please try again later, or the code entered is incorrect",
    errorConnection: "Connection Error",
    loadingPreview: "Certificate found! Loading preview, please wait...",
    successFound: "Verification Successful! Certificate available.",
    downloadBtn: "Download Certificate",
    langBtn: "العربية",
    shareLabel: "Share your certificate via",
    shareFacebook: "Facebook",
    shareWhatsapp: "WhatsApp",
    shareText: "I verified my certificate from Dalati English! My Code is: ",
    footerText: "© 2026 Dalati English - All Rights Reserved",
  },
  ar: {
    brandName: "Dalati English",
    widgetTitle: "التحقق من الشهادة",
    verifyBtn: "تحقق",
    errorEmpty: "الرجاء إدخال كود الشهادة",
    errorNotFound:
      "لم يتم إضافة شهادتك حاليا، يتم إضافة الشهادات الجديدة في اليوم الأول من كل شهر، لذا حاول لاحقاَ، أو الكودالذي ادخلته خاطئ",
    errorConnection: "خطأ في الاتصال",
    loadingPreview:
      "تم العثور على الشهادة! جاري تحميل المعاينة، يرجى الانتظار...",
    successFound: "تم التحقق بنجاح! الشهادة متوفرة.",
    downloadBtn: "تحميل الشهادة",
    langBtn: "English",
    shareLabel: "شارك شهادتك عبر",
    shareFacebook: "فيسبوك",
    shareWhatsapp: "واتساب",
    shareText:
      "لقد قمت بالتحقق من شهادتي من Dalati English! كود الشهادة الخاص بي هو: ",
    footerText: "© 2026 Dalati English - جميع الحقوق محفوظة",
  },
};

let currentLang = "en";

function toggleLanguage() {
  currentLang = currentLang === "en" ? "ar" : "en";
  try {
    localStorage.setItem("dalati-cert-lang", currentLang);
  } catch (e) {}
  updateContent();
}

function updateContent() {
  const t = translations[currentLang];
  const isAr = currentLang === "ar";
  document.documentElement.lang = currentLang;
  document.documentElement.dir = isAr ? "rtl" : "ltr";
  document.body.style.direction = isAr ? "rtl" : "ltr";

  const brandEl = document.getElementById("brand-name-text");
  if (brandEl) brandEl.textContent = t.brandName;

  const widgetTitle = document.getElementById("widget-title");
  if (widgetTitle) widgetTitle.textContent = t.widgetTitle;

  const verifyBtn = document.getElementById("verify-btn");
  if (verifyBtn) verifyBtn.textContent = t.verifyBtn;

  const downloadLink = document.getElementById("download-link");
  if (downloadLink) downloadLink.textContent = t.downloadBtn;

  const shareLabel = document.getElementById("share-label-text");
  if (shareLabel) shareLabel.textContent = t.shareLabel;

  const fbShare = document.getElementById("facebook-share");
  if (fbShare) fbShare.textContent = t.shareFacebook;

  const waShare = document.getElementById("whatsapp-share");
  if (waShare) waShare.textContent = t.shareWhatsapp;

  const langBtn = document.getElementById("lang-btn");
  if (langBtn) langBtn.textContent = t.langBtn;

  const footerText = document.getElementById("footer-text");
  if (footerText) footerText.textContent = t.footerText;

  const statusMsg = document.getElementById("status-message");
  if (statusMsg) {
    statusMsg.innerHTML = "";
    statusMsg.className = "";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const codeInput = document.getElementById("cert-code-input");
  const verifyBtn = document.getElementById("verify-btn");
  const statusMsg = document.getElementById("status-message");
  const loader = document.getElementById("loader");
  const displayArea = document.getElementById("cert-display-area");
  const certFrame = document.getElementById("cert-frame");
  const downloadLink = document.getElementById("download-link");
  const langBtn = document.getElementById("lang-btn");
  const fbShare = document.getElementById("facebook-share");
  const waShare = document.getElementById("whatsapp-share");

  try {
    const savedLang = localStorage.getItem("dalati-cert-lang");
    if (savedLang === "ar" || savedLang === "en") {
      currentLang = savedLang;
      if (currentLang === "ar") {
        updateContent();
      }
    }
  } catch (e) {}

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function showStatus(type, msg) {
    if (!msg) {
      statusMsg.innerHTML = "";
      statusMsg.className = "";
      return;
    }

    let iconSvg = "";
    if (type === "error") {
      iconSvg = `<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else if (type === "success") {
      iconSvg = `<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === "loading") {
      iconSvg = `<svg class="status-icon status-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>`;
    }

    statusMsg.className = `visible ${type}-msg`;
    statusMsg.innerHTML = `<div class="status-icon-wrap">${iconSvg}</div><div class="status-content">${escapeHtml(msg)}</div>`;
  }

  function showError(msg) {
    showStatus("error", msg);
    codeInput.classList.add("shake");
    setTimeout(() => codeInput.classList.remove("shake"), 400);
  }

  async function handleVerify() {
    const code = codeInput.value.trim();
    const t = translations[currentLang];

    showStatus(null, "");
    displayArea.style.display = "none";
    certFrame.removeAttribute("src");
    codeInput.classList.remove("shake");

    if (!code) {
      showError(t.errorEmpty);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showError(t.errorConnection);
      return;
    }

    setLoading(true);

    const candidates = [code];
    if (code.toUpperCase() !== code) {
      candidates.push(code.toUpperCase());
    }

    const urls = [];
    for (const c of candidates) {
      urls.push(
        `https://glcdn.githack.com/dalatirami/dalatienglish/raw/main/Certificate/${c}.pdf`,
        `https://gl.githack.com/dalatirami/dalatienglish/raw/main/Certificate/${c}.pdf`
      );
    }

    let foundUrl = null;

    try {
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            foundUrl = url;
            break;
          }
        } catch (fetchErr) {
          // If the file does not exist (404), CDNs without CORS on error pages cause fetch() to throw a TypeError in browser.
          // We catch and continue checking remaining candidate URLs.
        }
      }

      if (foundUrl) {
        showStatus("loading", t.loadingPreview);
        certFrame.onload = function () {
          showStatus("success", t.successFound);
        };
        certFrame.src = foundUrl;
        downloadLink.href = foundUrl;

        const shareText = encodeURIComponent(`${t.shareText} ${code}`);
        const shareUrl = encodeURIComponent("https://verify.dalati.org/");
        fbShare.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareText}`;
        waShare.href = `https://wa.me/?text=${shareText}%0A${shareUrl}`;
        displayArea.style.display = "block";
      } else {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          showError(t.errorConnection);
        } else {
          showError(t.errorNotFound);
        }
      }
    } catch (err) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        showError(t.errorConnection);
      } else {
        showError(t.errorNotFound);
      }
    } finally {
      setLoading(false);
    }
  }

  function setLoading(loading) {
    verifyBtn.disabled = loading;
    loader.style.display = loading ? "block" : "none";
  }

  codeInput.focus();
  codeInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z0-9]/g, "");
  });

  langBtn.addEventListener("click", toggleLanguage);
  verifyBtn.addEventListener("click", handleVerify);
  codeInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") handleVerify();
  });
});
