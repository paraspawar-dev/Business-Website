const translations = {
  en: {
    hero: { badge: "⚡ 10+ Years of Trust", subtitle: "Complete IT Solutions, Sales & Services for Home and Business" },
    nav: { home: "Home", services: "Services", products: "Products", enterprise: "Enterprise", about: "About Us", contact: "Contact", ticket: "Raise a Ticket" },
    footer: { text: "Your Trusted Technology Partner in Thane.", copyright: "© 2026 OpenRepair Computer. All rights reserved." }
  },
  hi: {
    hero: { badge: "⚡ 10+ वर्षों का विश्वास", subtitle: "घर और व्यापार के लिए संपूर्ण आईटी समाधान, बिक्री और सेवाएं" },
    nav: { home: "होम", services: "सेवाएं", products: "उत्पाद", enterprise: "एंटरप्राइज़", about: "हमारे बारे में", contact: "संपर्क करें", ticket: "टिकट उठाएं" },
    footer: { text: "ठाणे में आपका भरोसेमंद तकनीकी भागीदार।", copyright: "© 2026 कैलिबर लिंक कंप्यूटर। सर्वाधिकार सुरक्षित।" }
  },
  mr: {
    hero: { badge: "⚡ 10+ वर्षांचा विश्वास", subtitle: "घर आणि व्यवसायासाठी संपूर्ण आयटी उपाय, विक्री आणि सेवा" },
    nav: { home: "मुख्यपृष्ठ", services: "सेवा", products: "उत्पादने", enterprise: "एंटरप्राइझ", about: "आमच्याबद्दल", contact: "संपर्क", ticket: "तिकीट नोंदवा" },
    footer: { text: "ठाण्यातील तुमचा विश्वासू तंत्रज्ञान भागीदार.", copyright: "© 2026 कॅलिबर लिंक कॉम्प्युटर. सर्व हक्क राखीव." }
  }
};

function setLanguage(lang) {
  localStorage.setItem('clink-lang', lang);
  document.querySelectorAll('.lang-switcher button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const path = el.getAttribute('data-i18n').split('.');
    let text = translations[lang];
    for (const key of path) text = text?.[key];
    if (text) el.textContent = text;
  });
}

function t(path, lang = localStorage.getItem('clink-lang') || 'en') {
  let text = translations[lang];
  for (const key of path.split('.')) text = text?.[key];
  return text || path;
}
