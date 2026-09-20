UPDATE `site_content`
SET `value` = 'Verified immigration service professionals'
WHERE `key` = 'home.hero.badge';

UPDATE `site_content`
SET `value` = 'Find the immigration service you need'
WHERE `key` = 'home.hero.title';

UPDATE `site_content`
SET `value` = 'Discover verified attorneys, certified translators, interpreters, and psychological evaluation professionals.'
WHERE `key` = 'home.hero.subtitle';

UPDATE `site_content`
SET `value` = 'Browse services'
WHERE `key` = 'home.hero.cta_primary';

UPDATE `site_content`
SET `value` = 'A marketplace for verified immigration attorneys, translators, interpreters, and psychological service professionals.'
WHERE `key` = 'footer.description';

UPDATE `site_content`
SET `value` = 'Verified providers · Discovery and connection only'
WHERE `key` = 'footer.notes';

INSERT INTO `site_content`
  (`key`, `value`, `translations`, `type`, `section`, `label`, `updated_at`)
VALUES
  (
    'help.intro',
    'ImmFlow helps you discover and connect with independent immigration service professionals. ImmFlow does not provide legal, medical, interpreting, or translation advice.',
    JSON_OBJECT(
      'es', 'ImmFlow le ayuda a encontrar profesionales independientes de servicios de inmigración. ImmFlow no brinda asesoramiento legal, médico, de interpretación ni de traducción.',
      'hi', 'ImmFlow स्वतंत्र इमिग्रेशन सेवा पेशेवरों को खोजने और उनसे जुड़ने में मदद करता है। ImmFlow कानूनी, चिकित्सा, दुभाषिया या अनुवाद सलाह नहीं देता।',
      'ru', 'ImmFlow помогает найти независимых специалистов по иммиграционным услугам. ImmFlow не предоставляет юридические, медицинские, устные или письменные переводы.',
      'zh', 'ImmFlow 帮助您寻找并联系独立的移民服务专业人士。ImmFlow 不提供法律、医疗、口译或翻译建议。'
    ),
    'textarea',
    'help',
    'Help page introduction',
    NOW(3)
  ),
  (
    'help.faq',
    'How are providers verified?|Administrators review the credentials appropriate to each provider category.\nHow do payments work?|Applicable orders and bookings use Stripe Checkout. Providers do not receive card details.\nWhat does the AI finder do?|It only helps identify a service category and relevant providers. It does not give professional advice.\nWho is responsible for the service?|The independent provider is responsible for the service and its professional quality.',
    JSON_OBJECT(
      'es', '¿Cómo se verifican los proveedores?|Los administradores revisan las credenciales correspondientes a cada categoría.\n¿Cómo funcionan los pagos?|Los pedidos y reservas aplicables usan Stripe Checkout.\n¿Qué hace el buscador de IA?|Solo ayuda a identificar servicios y proveedores; no ofrece asesoramiento profesional.\n¿Quién es responsable del servicio?|El proveedor independiente es responsable del servicio y de su calidad.',
      'hi', 'प्रदाताओं का सत्यापन कैसे होता है?|प्रशासक प्रत्येक श्रेणी के उपयुक्त प्रमाणपत्रों की समीक्षा करते हैं।\nभुगतान कैसे होता है?|लागू ऑर्डर और बुकिंग Stripe Checkout का उपयोग करते हैं।\nAI फ़ाइंडर क्या करता है?|यह केवल सेवा और प्रदाता खोजता है; पेशेवर सलाह नहीं देता।\nसेवा के लिए कौन जिम्मेदार है?|स्वतंत्र प्रदाता सेवा और उसकी गुणवत्ता के लिए जिम्मेदार है।',
      'ru', 'Как проверяются поставщики?|Администраторы проверяют документы для каждой категории.\nКак работают платежи?|Для соответствующих заказов используется Stripe Checkout.\nЧто делает ИИ-поиск?|Он только помогает найти услугу и поставщика, но не даёт профессиональных советов.\nКто отвечает за услугу?|Независимый поставщик отвечает за услугу и её качество.',
      'zh', '如何验证服务商？|管理员会审核各服务类别所需的资质。\n如何付款？|适用的订单和预约使用 Stripe Checkout。\nAI 查找器做什么？|它只帮助寻找服务和服务商，不提供专业建议。\n谁对服务负责？|独立服务商对服务及其专业质量负责。'
    ),
    'textarea',
    'help',
    'FAQ (one question|answer per line)',
    NOW(3)
  )
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `translations` = VALUES(`translations`),
  `type` = VALUES(`type`),
  `section` = VALUES(`section`),
  `label` = VALUES(`label`);
