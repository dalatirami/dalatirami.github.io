const translations = {
  en: {
    brandName: "Dalati English",
    widgetTitle: "Verify Certificate",
    verifyBtn: "Verify",
    errorEmpty: "Please enter a valid certificate code",
    errorNotFound: "Your certificate has not been added yet. New certificates are added on the first day of each month, so please try again later, or the code entered is incorrect",
    errorConnection: "Connection Error",
    loadingPreview: "Certificate found! Loading image preview, please wait...",
    errorPreview: "Certificate verified, but the image preview could not be loaded.",
    successFound: "Verification Successful! Certificate available.",
    downloadBtn: "Download Certificate",
    langBtn: "English",
    shareLabel: "Share your certificate via",
    shareFacebook: "Facebook",
    shareWhatsapp: "WhatsApp",
    shareLinkedIn: "LinkedIn",
    addToLinkedIn: "Add to LinkedIn Profile",
    shareText: "I verified my certificate from Dalati English! My Code is:",
    footerText: "© 2026 Dalati English - All Rights Reserved"
  },
  ar: {
    brandName: "Dalati English",
    widgetTitle: "التحقق من الشهادة",
    verifyBtn: "تحقق",
    errorEmpty: "الرجاء إدخال كود الشهادة",
    errorNotFound: "لم يتم إضافة شهادتك حاليا، يتم إضافة الشهادات الجديدة في اليوم الأول من كل شهر، لذا حاول لاحقاَ، أو الكودالذي ادخلته خاطئ",
    errorConnection: "خطأ في الاتصال",
    loadingPreview: "تم العثور على الشهادة! جاري تحميل صورة المعاينة، يرجى الانتظار...",
    errorPreview: "تم التحقق من الشهادة، لكن تعذر تحميل صورة المعاينة.",
    successFound: "تم التحقق بنجاح! الشهادة متوفرة.",
    downloadBtn: "تحميل الشهادة",
    langBtn: "العربية",
    shareLabel: "شارك شهادتك عبر",
    shareFacebook: "فيسبوك",
    shareWhatsapp: "واتساب",
    shareLinkedIn: "LinkedIn",
    addToLinkedIn: "إضافة إلى الملف الشخصي في LinkedIn",
    shareText: "لقد قمت بالتحقق من شهادتي من Dalati English! كود الشهادة الخاص بي هو:",
    footerText: "© 2026 Dalati English - جميع الحقوق محفوظة"
  }
};

const CERTIFICATE_WORKER_URL = "https://dalati.org/english/certificate";
let currentLang = "ar";
let linkedInShareButton;
let linkedInProfileButton;

function toggleLanguage() {
  currentLang = currentLang === "en" ? "ar" : "en";
  try {
    localStorage.setItem("dalati-cert-lang", currentLang);
  } catch (error) {}
  updateContent();
}

function updateContent() {
  const labels = translations[currentLang];
  const isArabic = currentLang === "ar";

  document.documentElement.lang = currentLang;
  document.documentElement.dir = isArabic ? "rtl" : "ltr";
  document.body.style.direction = isArabic ? "rtl" : "ltr";

  const elements = [
    ["brand-name-text", "brandName"],
    ["widget-title", "widgetTitle"],
    ["verify-btn", "verifyBtn"],
    ["download-link", "downloadBtn"],
    ["share-label-text", "shareLabel"],
    ["facebook-share", "shareFacebook"],
    ["whatsapp-share", "shareWhatsapp"],
    ["lang-btn", "langBtn"]
  ];

  elements.forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = labels[key];
  });

  if (linkedInShareButton) linkedInShareButton.textContent = labels.shareLinkedIn;
  if (linkedInProfileButton) linkedInProfileButton.textContent = labels.addToLinkedIn;

  const footer = document.getElementById("footer-text");
  if (footer) footer.textContent = labels.footerText;

  const status = document.getElementById("status-message");
  if (status) {
    status.innerHTML = "";
    status.className = "";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const codeInput = document.getElementById("cert-code-input");
  const verifyButton = document.getElementById("verify-btn");
  const statusMessage = document.getElementById("status-message");
  const loader = document.getElementById("loader");
  const displayArea = document.getElementById("cert-display-area");
  const preview = document.getElementById("cert-preview");
  const downloadLink = document.getElementById("download-link");
  const languageButton = document.getElementById("lang-btn");
  const facebookShare = document.getElementById("facebook-share");
  const whatsappShare = document.getElementById("whatsapp-share");
  const shareContainer = document.querySelector(".share-buttons-container");

  if (!codeInput || !verifyButton || !statusMessage || !loader ||
      !displayArea || !preview || !downloadLink || !languageButton ||
      !facebookShare || !whatsappShare || !shareContainer) {
    console.error("Certificate verifier: required page elements are missing.");
    return;
  }

  // Add LinkedIn sharing and profile buttons without changing the existing page markup.
  linkedInShareButton = document.getElementById("linkedin-share");
  if (!linkedInShareButton) {
    linkedInShareButton = document.createElement("a");
    linkedInShareButton.id = "linkedin-share";
    linkedInShareButton.className = "share-btn linkedin";
    linkedInShareButton.href = "#";
    linkedInShareButton.target = "_blank";
    linkedInShareButton.rel = "noopener noreferrer";
    linkedInShareButton.style.backgroundColor = "#0A66C2";
    linkedInShareButton.textContent = translations[currentLang].shareLinkedIn;
    shareContainer.appendChild(linkedInShareButton);
  }

  linkedInProfileButton = document.getElementById("linkedin-profile-add");
  if (!linkedInProfileButton) {
    linkedInProfileButton = document.createElement("a");
    linkedInProfileButton.id = "linkedin-profile-add";
    linkedInProfileButton.className = "share-btn linkedin-profile";
    linkedInProfileButton.href = "#";
    linkedInProfileButton.target = "_blank";
    linkedInProfileButton.rel = "noopener noreferrer";
    linkedInProfileButton.style.backgroundColor = "#0A66C2";
    linkedInProfileButton.textContent = translations[currentLang].addToLinkedIn;
    shareContainer.appendChild(linkedInProfileButton);
  }

  try {
    const savedLanguage = localStorage.getItem("dalati-cert-lang");
    if (savedLanguage === "ar" || savedLanguage === "en") {
      currentLang = savedLanguage;
    }
  } catch (error) {}

  updateContent();

  function showStatus(type, message) {
    if (!message) {
      statusMessage.innerHTML = "";
      statusMessage.className = "";
      return;
    }

    let icon = "";
    if (type === "error") {
      icon = '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    } else if (type === "success") {
      icon = '<svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else if (type === "loading") {
      icon = '<svg class="status-icon status-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>';
    }

    const safeMessage = document.createElement("div");
    safeMessage.textContent = message;
    statusMessage.className = `visible ${type}-msg`;
    statusMessage.innerHTML = `<div class="status-icon-wrap">${icon}</div><div class="status-content"></div>`;
    statusMessage.querySelector(".status-content").appendChild(safeMessage);
  }

  function showError(message) {
    showStatus("error", message);
    codeInput.classList.add("shake");
    setTimeout(() => codeInput.classList.remove("shake"), 400);
  }

  function setLoading(isLoading) {
    verifyButton.disabled = isLoading;
    loader.style.display = isLoading ? "block" : "none";
  }

  function updateShareLinks(certificateId) {
    const certificatePage = `${CERTIFICATE_WORKER_URL}/${encodeURIComponent(certificateId)}`;
    const shareMessage = `${translations[currentLang].shareText} ${certificateId}`;
    const encodedPage = encodeURIComponent(certificatePage);
    const encodedMessage = encodeURIComponent(shareMessage);

    facebookShare.href =
      `https://www.facebook.com/sharer/sharer.php?u=${encodedPage}&quote=${encodedMessage}`;

    whatsappShare.href =
      `https://wa.me/?text=${encodedMessage}%0A${encodedPage}`;

    linkedInShareButton.href =
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedPage}`;

    const profileParams = new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: "Dalati English Certificate",
      organizationName: "Dalati English",
      certId: certificateId,
      certUrl: certificatePage
    });
    linkedInProfileButton.href =
      `https://www.linkedin.com/profile/add?${profileParams.toString()}`;
  }

  async function verifyCertificate() {
    const enteredCode = codeInput.value.trim();
    const labels = translations[currentLang];

    showStatus(null, "");
    displayArea.style.display = "none";
    preview.removeAttribute("src");
    codeInput.classList.remove("shake");

    if (!enteredCode) {
      showError(labels.errorEmpty);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showError(labels.errorConnection);
      return;
    }

    setLoading(true);

    let verifiedCode = null;

    try {
      // Verify through the same-origin Cloudflare Worker, not directly from the browser to GitLab.
      const verifyUrl =
        `${CERTIFICATE_WORKER_URL}/verify/${encodeURIComponent(enteredCode)}`;

      const response = await fetch(verifyUrl, {
        method: "GET",
        cache: "no-store"
      });

      if (response.status === 404) {
        showError(labels.errorNotFound);
        return;
      }

      if (!response.ok) {
        throw new Error(`Certificate verification service returned ${response.status}`);
      }

      const result = await response.json();

      if (!result.exists || !result.certificateId) {
        showError(labels.errorNotFound);
        return;
      }

      verifiedCode = result.certificateId;

      const imageUrl =
        `${CERTIFICATE_WORKER_URL}/image/${encodeURIComponent(verifiedCode)}.jpg`;
      const downloadUrl =
        `${CERTIFICATE_WORKER_URL}/download/${encodeURIComponent(verifiedCode)}.pdf`;

      showStatus("loading", labels.loadingPreview);

      preview.onload = function () {
        showStatus("success", labels.successFound);
      };

      preview.onerror = function () {
        showStatus("error", labels.errorPreview);
      };

      preview.src = imageUrl;
      downloadLink.href = downloadUrl;
      downloadLink.removeAttribute("target");

      updateShareLinks(verifiedCode);
      displayArea.style.display = "block";
    } catch (error) {
      console.error("Certificate verification failed:", error);
      showError(labels.errorConnection);
    } finally {
      setLoading(false);
    }
  }

  codeInput.focus();
  codeInput.addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z0-9]/g, "");
  });
  languageButton.addEventListener("click", toggleLanguage);
  verifyButton.addEventListener("click", verifyCertificate);
  codeInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") verifyCertificate();
  });
});