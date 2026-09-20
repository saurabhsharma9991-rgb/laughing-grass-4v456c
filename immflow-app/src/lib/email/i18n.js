/**
 * Lightweight email copy by locale (Phase E).
 * Falls back to English for missing keys.
 */

const SUBJECTS = {
  en: {
    verify: "Verify your ImmFlow email",
    welcome: "Welcome to ImmFlow",
    newApplication: "New application on your listing",
    applicationStatus: "Your application status was updated",
    newMessage: "New ImmFlow message",
    renewal: "Your ImmFlow Pro subscription renews soon",
    providerApproved: "Your provider profile is approved",
    providerRejected: "Provider verification update",
    credentialUpdate: "Updated credential requested",
    orderUpdate: "Translation order update",
    bookingUpdate: "Booking update",
  },
  es: {
    verify: "Verifique su correo de ImmFlow",
    welcome: "Bienvenido a ImmFlow",
    newApplication: "Nueva solicitud en su anuncio",
    applicationStatus: "Se actualizó el estado de su solicitud",
    newMessage: "Nuevo mensaje de ImmFlow",
    renewal: "Su suscripción ImmFlow Pro se renueva pronto",
    providerApproved: "Su perfil de proveedor está aprobado",
    providerRejected: "Actualización de verificación del proveedor",
    credentialUpdate: "Se solicitó una credencial actualizada",
    orderUpdate: "Actualización del pedido de traducción",
    bookingUpdate: "Actualización de la reserva",
  },
  hi: {
    verify: "अपना ImmFlow ईमेल सत्यापित करें",
    welcome: "ImmFlow में आपका स्वागत है",
    newApplication: "आपकी लिस्टिंग पर नया आवेदन",
    applicationStatus: "आपके आवेदन की स्थिति अपडेट हुई",
    newMessage: "नया ImmFlow संदेश",
    renewal: "आपकी ImmFlow Pro सदस्यता जल्द नवीनीकृत होगी",
    providerApproved: "आपकी प्रदाता प्रोफ़ाइल स्वीकृत है",
    providerRejected: "प्रदाता सत्यापन अपडेट",
    credentialUpdate: "अपडेट किया हुआ प्रमाणपत्र आवश्यक है",
    orderUpdate: "अनुवाद ऑर्डर अपडेट",
    bookingUpdate: "बुकिंग अपडेट",
  },
  ru: {
    verify: "Подтвердите email ImmFlow",
    welcome: "Добро пожаловать в ImmFlow",
    newApplication: "Новая заявка на ваше объявление",
    applicationStatus: "Статус вашей заявки обновлён",
    newMessage: "Новое сообщение ImmFlow",
    renewal: "Скоро продление ImmFlow Pro",
    providerApproved: "Профиль поставщика одобрен",
    providerRejected: "Обновление проверки поставщика",
    credentialUpdate: "Запрошен обновлённый документ",
    orderUpdate: "Обновление заказа перевода",
    bookingUpdate: "Обновление бронирования",
  },
  zh: {
    verify: "验证您的 ImmFlow 邮箱",
    welcome: "欢迎加入 ImmFlow",
    newApplication: "您的职位有新申请",
    applicationStatus: "您的申请状态已更新",
    newMessage: "新的 ImmFlow 消息",
    renewal: "您的 ImmFlow Pro 即将续订",
    providerApproved: "您的服务商资料已获批准",
    providerRejected: "服务商验证更新",
    credentialUpdate: "需要更新资质文件",
    orderUpdate: "翻译订单更新",
    bookingUpdate: "预约更新",
  },
};

export function emailSubject(locale, key, fallback) {
  const code = SUBJECTS[locale] ? locale : "en";
  return SUBJECTS[code][key] || SUBJECTS.en[key] || fallback || key;
}

const BODY_TEMPLATES = {
  en: {
    verify: (name, url) =>
      `Hello ${name}, verify your ImmFlow email: ${url}`,
    welcome: (name, url) =>
      `Welcome to ImmFlow, ${name}. Open your dashboard: ${url}`,
    application: (name, status, url) =>
      `Hello ${name}, your application is now ${status}. View it: ${url}`,
    message: (name, sender, url) =>
      `Hello ${name}, ${sender} sent you a message on ImmFlow. Open it: ${url}`,
    renewal: (name, date, url) =>
      `Hello ${name}, your ImmFlow Pro subscription renews on ${date}. Manage billing: ${url}`,
    providerApproved: (name, _reason, url) =>
      `Hello ${name}, your ImmFlow provider profile is approved. Open your dashboard: ${url}`,
    providerRejected: (name, reason) =>
      `Hello ${name}, your provider verification was not approved. ${reason}`,
    order: (name, status, url) =>
      `Hello ${name}, your translation order is now ${status}. View details: ${url}`,
    booking: (name, status, url) =>
      `Hello ${name}, your booking is now ${status}. View details: ${url}`,
    credential: (name, note, url) =>
      `Hello ${name}, an updated credential is required. ${note} Update your profile: ${url}`,
  },
  es: {
    verify: (name, url) =>
      `Hola ${name}, verifique su correo de ImmFlow: ${url}`,
    welcome: (name, url) =>
      `Bienvenido a ImmFlow, ${name}. Panel: ${url}`,
    application: (name, status, url) =>
      `Hola ${name}, su solicitud ahora está ${status}. Ver: ${url}`,
    message: (name, sender, url) =>
      `Hola ${name}, ${sender} le envió un mensaje en ImmFlow. Abrir: ${url}`,
    renewal: (name, date, url) =>
      `Hola ${name}, su suscripción ImmFlow Pro se renueva el ${date}. Facturación: ${url}`,
    providerApproved: (name, _reason, url) =>
      `Hola ${name}, su perfil de proveedor de ImmFlow está aprobado. Panel: ${url}`,
    providerRejected: (name, reason) =>
      `Hola ${name}, su verificación de proveedor no fue aprobada. ${reason}`,
    order: (name, status, url) =>
      `Hola ${name}, su pedido de traducción ahora está ${status}. Ver detalles: ${url}`,
    booking: (name, status, url) =>
      `Hola ${name}, su reserva ahora está ${status}. Ver detalles: ${url}`,
    credential: (name, note, url) =>
      `Hola ${name}, se requiere una credencial actualizada. ${note} Actualice su perfil: ${url}`,
  },
  hi: {
    verify: (name, url) =>
      `नमस्ते ${name}, अपना ImmFlow ईमेल सत्यापित करें: ${url}`,
    welcome: (name, url) =>
      `ImmFlow में स्वागत है, ${name}। डैशबोर्ड: ${url}`,
    application: (name, status, url) =>
      `नमस्ते ${name}, आपके आवेदन की स्थिति अब ${status} है। देखें: ${url}`,
    message: (name, sender, url) =>
      `नमस्ते ${name}, ${sender} ने ImmFlow पर संदेश भेजा है। खोलें: ${url}`,
    renewal: (name, date, url) =>
      `नमस्ते ${name}, आपकी ImmFlow Pro सदस्यता ${date} को नवीनीकृत होगी। बिलिंग: ${url}`,
    providerApproved: (name, _reason, url) =>
      `नमस्ते ${name}, आपकी ImmFlow प्रदाता प्रोफ़ाइल स्वीकृत है। डैशबोर्ड: ${url}`,
    providerRejected: (name, reason) =>
      `नमस्ते ${name}, आपका प्रदाता सत्यापन स्वीकृत नहीं हुआ। ${reason}`,
    order: (name, status, url) =>
      `नमस्ते ${name}, आपके अनुवाद ऑर्डर की स्थिति अब ${status} है। विवरण: ${url}`,
    booking: (name, status, url) =>
      `नमस्ते ${name}, आपकी बुकिंग की स्थिति अब ${status} है। विवरण: ${url}`,
    credential: (name, note, url) =>
      `नमस्ते ${name}, अपडेट किया हुआ प्रमाणपत्र आवश्यक है। ${note} प्रोफ़ाइल अपडेट करें: ${url}`,
  },
  ru: {
    verify: (name, url) =>
      `Здравствуйте, ${name}. Подтвердите email ImmFlow: ${url}`,
    welcome: (name, url) =>
      `Добро пожаловать в ImmFlow, ${name}. Панель: ${url}`,
    application: (name, status, url) =>
      `Здравствуйте, ${name}. Статус заявки: ${status}. Подробнее: ${url}`,
    message: (name, sender, url) =>
      `Здравствуйте, ${name}. ${sender} отправил сообщение в ImmFlow: ${url}`,
    renewal: (name, date, url) =>
      `Здравствуйте, ${name}. Подписка ImmFlow Pro продлится ${date}. Оплата: ${url}`,
    providerApproved: (name, _reason, url) =>
      `Здравствуйте, ${name}. Ваш профиль поставщика ImmFlow одобрен. Панель: ${url}`,
    providerRejected: (name, reason) =>
      `Здравствуйте, ${name}. Проверка поставщика не одобрена. ${reason}`,
    order: (name, status, url) =>
      `Здравствуйте, ${name}. Статус заказа перевода: ${status}. Подробнее: ${url}`,
    booking: (name, status, url) =>
      `Здравствуйте, ${name}. Статус бронирования: ${status}. Подробнее: ${url}`,
    credential: (name, note, url) =>
      `Здравствуйте, ${name}. Требуется обновить документ. ${note} Профиль: ${url}`,
  },
  zh: {
    verify: (name, url) =>
      `${name}，您好。请验证您的 ImmFlow 邮箱：${url}`,
    welcome: (name, url) =>
      `${name}，欢迎加入 ImmFlow。控制面板：${url}`,
    application: (name, status, url) =>
      `${name}，您好。您的申请状态现为 ${status}。查看：${url}`,
    message: (name, sender, url) =>
      `${name}，您好。${sender} 在 ImmFlow 给您发送了消息：${url}`,
    renewal: (name, date, url) =>
      `${name}，您好。您的 ImmFlow Pro 将于 ${date} 续订。账单：${url}`,
    providerApproved: (name, _reason, url) =>
      `${name}，您好。您的 ImmFlow 服务商资料已获批准。控制面板：${url}`,
    providerRejected: (name, reason) =>
      `${name}，您好。您的服务商验证未获批准。${reason}`,
    order: (name, status, url) =>
      `${name}，您好。您的翻译订单状态现为 ${status}。查看详情：${url}`,
    booking: (name, status, url) =>
      `${name}，您好。您的预约状态现为 ${status}。查看详情：${url}`,
    credential: (name, note, url) =>
      `${name}，您好。需要更新资质文件。${note} 更新资料：${url}`,
  },
};

export function emailBody(locale, key, values) {
  const code = BODY_TEMPLATES[locale] ? locale : "en";
  const fn = BODY_TEMPLATES[code][key] || BODY_TEMPLATES.en[key];
  if (typeof fn !== "function") {
    return `${values?.[0] || "Hello"}, you have an ImmFlow update.`;
  }
  return fn(...(Array.isArray(values) ? values : []));
}
