import { Locale } from "./config";
import {
  COMPANY_NAME,
  OWNER_NAME,
  COMPANY_LEGAL_FORM,
  COMPANY_REGISTRATION,
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_DOMAIN,
} from "../config/constants";

export interface LegalNoticeContent {
  title: string;
  subtitle: string;
  metaDescription: string;
  s1_title: string;
  s1_intro: string;
  fields: {
    owner: string;
    form: string;
    tradeName: string;
    taxId: string;
    eori: string;
    address: string;
    email: string;
    phone: string;
    website: string;
    activity: string;
  };
  s2_title: string;
  s2_text: string;
  s3_title: string;
  s3_text: string;
  s4_title: string;
  s4_text: string;
  s5_title: string;
  s5_text: string;
}

export interface PrivacyPolicyContent {
  title: string;
  subtitle: string;
  metaDescription: string;
  s1_title: string;
  s2_title: string;
  s2_intro: string;
  s2_bullets: string[];
  s3_title: string;
  s3_intro: string;
  s3_bullets: string[];
  s4_title: string;
  s4_text: string;
  s5_title: string;
  s5_text: string;
  s6_title: string;
  s6_intro: string;
  s6_aepd: string;
}

export interface CookiePolicyContent {
  title: string;
  subtitle: string;
  metaDescription: string;
  s1_title: string;
  s1_text: string;
  s2_title: string;
  s2_intro: string;
  table_header_type: string;
  table_header_purpose: string;
  table_header_duration: string;
  table_header_management: string;
  cookie_tech_type: string;
  cookie_tech_purpose: string;
  cookie_tech_duration: string;
  cookie_tech_mgmt: string;
  cookie_anal_type: string;
  cookie_anal_purpose: string;
  cookie_anal_duration: string;
  cookie_anal_mgmt: string;
  s3_title: string;
  s3_text: string;
  s4_title: string;
  s4_intro: string;
  s5_title: string;
  s5_text: string;
}

export const LEGAL_NOTICES: Record<Locale, LegalNoticeContent> = {
  en: {
    title: "Legal Notice (Aviso Legal)",
    subtitle: "Identification and corporate transparency information in accordance with Article 10 of Spanish Law 34/2002 (LSSICE).",
    metaDescription: "Legal notice and identification information for Viasglobal in compliance with EU and Spanish commercial regulations.",
    s1_title: "1. Identification & Company Information",
    s1_intro: "In compliance with Article 10 of Law 34/2002 (LSSICE), the identifying information of the website operator is provided below:",
    fields: {
      owner: `Legal Representative: ${OWNER_NAME}`,
      form: `Legal Form: ${COMPANY_LEGAL_FORM}`,
      tradeName: `Commercial Trade Name: ${COMPANY_NAME}`,
      taxId: `Tax ID / EU VAT ID: ${COMPANY_REGISTRATION}`,
      eori: `EORI Registration: ${COMPANY_REGISTRATION}`,
      address: `Registered Address: ${COMPANY_ADDRESS}`,
      email: `Official Contact Email: ${COMPANY_EMAIL}`,
      phone: `Commercial Desk / Phone: ${COMPANY_PHONE}`,
      website: `Official Website: https://${COMPANY_DOMAIN}`,
      activity: "Commercial Activity: B2B Wholesale Distribution, digital commerce, and intra-community trade in the European Union.",
    },
    s2_title: "2. Scope of Application",
    s2_text: `This Legal Notice governs access to, navigation, and use of https://${COMPANY_DOMAIN}. Access to the website grants user status and implies full acceptance of all terms stated herein.`,
    s3_title: "3. Intellectual and Industrial Property",
    s3_text: `All contents of this website, including designs, text, graphics, logos, and software, are the exclusive property of ${OWNER_NAME} (operating under the trade name ${COMPANY_NAME}) or its authorized licensors and are protected under international and Spanish intellectual property laws.`,
    s4_title: "4. Disclaimer and Limitation of Liability",
    s4_text: `${COMPANY_NAME} cannot be held liable for technical interruptions or external links to third-party services over which it exercises no editorial or technical control.`,
    s5_title: "5. Governing Law and Jurisdiction",
    s5_text: "Any dispute arising from the use of this portal shall be governed exclusively by the laws of the Kingdom of Spain, subject to the jurisdiction of the courts of Castellón (Spain).",
  },
  es: {
    title: "Aviso Legal",
    subtitle: "Información legal e identificativa en cumplimiento del artículo 10 de la Ley 34/2002 (LSSICE).",
    metaDescription: "Aviso Legal e información identificativa de Viasglobal en cumplimiento del artículo 10 de la Ley 34/2002 (LSSICE).",
    s1_title: "1. Datos Identificativos del Titular",
    s1_intro: "En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSICE), se exponen los datos identificativos:",
    fields: {
      owner: `Titular / Representante Legal: ${OWNER_NAME}`,
      form: `Forma Jurídica: ${COMPANY_LEGAL_FORM}`,
      tradeName: `Nombre Comercial: ${COMPANY_NAME}`,
      taxId: `NIF / CIF / VAT ID (UE): ${COMPANY_REGISTRATION}`,
      eori: `Número EORI: ${COMPANY_REGISTRATION}`,
      address: `Domicilio de Actividad: ${COMPANY_ADDRESS}`,
      email: `Correo Electrónico: ${COMPANY_EMAIL}`,
      phone: `Teléfono de Contacto: ${COMPANY_PHONE}`,
      website: `Sitio Web Oficial: https://${COMPANY_DOMAIN}`,
      activity: "Actividad Comercial: Venta al por mayor, distribución B2B y comercio digital transfronterizo en la Unión Europea.",
    },
    s2_title: "2. Objeto y Ámbito de Aplicación",
    s2_text: `El presente Aviso Legal regula el acceso, navegación y uso del sitio web https://${COMPANY_DOMAIN}. El acceso al sitio atribuye la condición de Usuario e implica la aceptación plena de todas las disposiciones.`,
    s3_title: "3. Propiedad Intelectual e Industrial",
    s3_text: `El diseño del portal, logotipos, signos distintivos, textos y gráficos pertenecen a ${OWNER_NAME} (operando comercialmente como ${COMPANY_NAME}) o a sus respectivos licenciantes, estando protegidos por la legislación española e internacional.`,
    s4_title: "4. Régimen de Responsabilidad y Enlaces",
    s4_text: `${COMPANY_NAME} no se hace responsable de los daños derivados de interferencias o virus informáticos ajenos a su control, ni de los contenidos de enlaces a sitios web de terceros.`,
    s5_title: "5. Legislación Aplicable y Jurisdicción",
    s5_text: "Para la resolución de controversias será de aplicación la legislación española vigente, sometiéndose expresamente a los Juzgados y Tribunales de Castellón (España).",
  },
  de: {
    title: "Impressum (Aviso Legal)",
    subtitle: "Gesetzliche Angaben und Anbieterkennzeichnung gemäß Artikel 10 des spanischen Gesetzes 34/2002 (LSSICE).",
    metaDescription: "Impressum und rechtliche Angaben für Viasglobal gemäß den Handelsvorschriften der EU und Spaniens.",
    s1_title: "1. Anbieterkennzeichnung & Unternehmensdaten",
    s1_intro: "In Übereinstimmung mit Artikel 10 des Gesetzes 34/2002 (LSSICE) werden nachfolgend die Unternehmensdaten angegeben:",
    fields: {
      owner: `Vertretungsberechtigt: ${OWNER_NAME}`,
      form: `Rechtsform: ${COMPANY_LEGAL_FORM}`,
      tradeName: `Handelsname: ${COMPANY_NAME}`,
      taxId: `USt-IdNr. / EU VAT ID: ${COMPANY_REGISTRATION}`,
      eori: `EORI-Nummer: ${COMPANY_REGISTRATION}`,
      address: `Geschäftsadresse: ${COMPANY_ADDRESS}`,
      email: `Offizielle E-Mail: ${COMPANY_EMAIL}`,
      phone: `Telefon / WhatsApp: ${COMPANY_PHONE}`,
      website: `Offizielle Website: https://${COMPANY_DOMAIN}`,
      activity: "Geschäftstätigkeit: B2B-Großhandel, Omnichannel-Distribution und innergemeinschaftlicher Handel in der EU.",
    },
    s2_title: "2. Anwendungsbereich",
    s2_text: `Dieses Impressum regelt den Zugang und die Nutzung der Website https://${COMPANY_DOMAIN}. Die Nutzung setzt das Einverständnis mit diesen Bestimmungen voraus.`,
    s3_title: "3. Urheberrecht und Markenschutz",
    s3_text: `Alle Inhalte, Designs und Texte dieser Website sind geistiges Eigentum von ${OWNER_NAME} (${COMPANY_NAME}) und unterliegen dem spanischen und europäischen Urheberrecht.`,
    s4_title: "4. Haftungsausschluss",
    s4_text: `${COMPANY_NAME} haftet nicht für externe Verlinkungen oder technische Ausfälle, die außerhalb des eigenen Verantwortungsbereichs liegen.`,
    s5_title: "5. Anwendbares Recht und Gerichtsstand",
    s5_text: "Es gilt das Recht des Königreichs Spanien. Gerichtsstand für alle Streitigkeiten ist Castellón (Spanien).",
  },
  fr: {
    title: "Mentions Légales (Aviso Legal)",
    subtitle: "Informations d'identification et mentions légales conformément à l'article 10 de la loi espagnole 34/2002 (LSSICE).",
    metaDescription: "Mentions légales et informations corporatives de Viasglobal en conformité avec la réglementation espagnole et européenne.",
    s1_title: "1. Informations Légales et Identité",
    s1_intro: "Conformément à l'article 10 de la loi 34/2002 (LSSICE), les coordonnées de l'exploitant sont précisées ci-dessous :",
    fields: {
      owner: `Représentant Légal : ${OWNER_NAME}`,
      form: `Forme Juridique : ${COMPANY_LEGAL_FORM}`,
      tradeName: `Nom Commercial : ${COMPANY_NAME}`,
      taxId: `N° TVA Intracommunautaire : ${COMPANY_REGISTRATION}`,
      eori: `N° EORI : ${COMPANY_REGISTRATION}`,
      address: `Adresse Commerciale : ${COMPANY_ADDRESS}`,
      email: `Email de Contact : ${COMPANY_EMAIL}`,
      phone: `Téléphone : ${COMPANY_PHONE}`,
      website: `Site Officiel : https://${COMPANY_DOMAIN}`,
      activity: "Activité : Vente en gros B2B, distribution et commerce numérique intracommunautaire dans l'Union Européenne.",
    },
    s2_title: "2. Champ d'Application",
    s2_text: `Les présentes mentions légales régissent l'accès et l'utilisation du site https://${COMPANY_DOMAIN}. L'accès au site implique l'acceptation pleine et entière des conditions.`,
    s3_title: "3. Propriété Intellectuelle",
    s3_text: `La structure générale, les textes, graphismes et logos sont la propriété exclusive de ${OWNER_NAME} (${COMPANY_NAME}) ou de ses partenaires licenciés.`,
    s4_title: "4. Responsabilité et Liens Externes",
    s4_text: `${COMPANY_NAME} décline toute responsabilité quant aux dysfonctionnements techniques externes ou aux contenus des liens vers des sites tiers.`,
    s5_title: "5. Droit Applicable et Juridiction",
    s5_text: "Tout litige relatif à ce site est soumis au droit espagnol et à la compétence des tribunaux de Castellón (Espagne).",
  },
  it: {
    title: "Note Legali (Aviso Legal)",
    subtitle: "Informazioni legali e identificative ai sensi dell'articolo 10 della legge spagnola 34/2002 (LSSICE).",
    metaDescription: "Note legali e informazioni societarie di Viasglobal in conformità con la normativa spagnola ed europea.",
    s1_title: "1. Dati Identificativi del Titolare",
    s1_intro: "In conformità con l'articolo 10 della legge 34/2002 (LSSICE), si riportano i dati identificativi dell'operatore:",
    fields: {
      owner: `Rappresentante Legale: ${OWNER_NAME}`,
      form: `Forma Giuridica: ${COMPANY_LEGAL_FORM}`,
      tradeName: `Denominazione Commerciale: ${COMPANY_NAME}`,
      taxId: `Partita IVA UE / NIF: ${COMPANY_REGISTRATION}`,
      eori: `Codice EORI: ${COMPANY_REGISTRATION}`,
      address: `Sede Legale: ${COMPANY_ADDRESS}`,
      email: `Email Ufficiale: ${COMPANY_EMAIL}`,
      phone: `Telefono / WhatsApp: ${COMPANY_PHONE}`,
      website: `Sito Ufficiale: https://${COMPANY_DOMAIN}`,
      activity: "Attività: Vendita all'ingrosso B2B, distribuzione e commercio digitale intracomunitario nell'Unione Europea.",
    },
    s2_title: "2. Oggetto e Ambito di Applicazione",
    s2_text: `Le presenti Note Legali disciplinano l'accesso e l'uso del sito web https://${COMPANY_DOMAIN}. L'accesso al sito implica l'accettazione integrale di tali termini.`,
    s3_title: "3. Proprietà Intellettuale e Industriale",
    s3_text: `Tutti i contenuti, testi, loghi e grafiche sono di proprietà esclusiva di ${OWNER_NAME} (${COMPANY_NAME}) e sono protetti dalle leggi spagnole e internazionali sul diritto d'autore.`,
    s4_title: "4. Limitazione di Responsabilità",
    s4_text: `${COMPANY_NAME} non è responsabile per eventuali problemi tecnici o per i contenuti di siti di terze parti accessibili tramite collegamenti esterni.`,
    s5_title: "5. Legge Applicabile e Foro Competente",
    s5_text: "Per qualsiasi controversia sarà applicabile la legge spagnola, con competenza esclusiva del foro di Castellón (Spagna).",
  },
};

export const PRIVACY_POLICIES: Record<Locale, PrivacyPolicyContent> = {
  en: {
    title: "Privacy Policy (RGPD / GDPR)",
    subtitle: "Information on personal data processing in compliance with EU Regulation 2016/679 (GDPR) and Spanish Organic Law 3/2018 (LOPDGDD).",
    metaDescription: "Privacy policy and data protection framework for Viasglobal under EU GDPR regulations.",
    s1_title: "1. Data Controller Information",
    s2_title: "2. Purposes of Data Processing",
    s2_intro: `At ${COMPANY_NAME}, we process data provided by corporate representatives, brands, and partners for the following purposes:`,
    s2_bullets: [
      "B2B Partner Intake & Commercial Inquiries: Evaluating wholesale catalogs and responding to dealer account requests.",
      "Commercial & Contract Management: Processing purchase orders, invoicing, delivery reception under agreed MAP/pricing terms.",
      "Legal and Tax Compliance: Fulfilling Spanish and EU intra-community VAT requirements (VIES 0% supplies).",
    ],
    s3_title: "3. Legal Basis for Processing",
    s3_intro: "The processing of personal data is legally grounded on:",
    s3_bullets: [
      "Explicit consent (Art. 6.1.a GDPR) when submitting the B2B onboarding form.",
      "Execution of pre-contractual and contractual measures (Art. 6.1.b GDPR) for wholesale transactions.",
      "Compliance with EU/Spanish legal and fiscal obligations (Art. 6.1.c GDPR).",
    ],
    s4_title: "4. Data Retention Periods",
    s4_text: "Data is retained during active commercial relationships and subsequently preserved under statutory limitation periods (minimum 6 years pursuant to Article 30 of the Spanish Commercial Code).",
    s5_title: "5. Recipients and International Transfers",
    s5_text: "Personal data is not transferred to third parties except under statutory legal obligations (Tax authorities, SEPA banking partners). All hosting infrastructure complies with EU data privacy standards.",
    s6_title: "6. User Rights (ARCO-POL) and Supervisory Authority",
    s6_intro: `You may exercise your rights of Access, Rectification, Erasure, Restriction, Portability, and Objection by contacting: ${COMPANY_EMAIL}.`,
    s6_aepd: "You also have the right to lodge a complaint with the Spanish Data Protection Agency (AEPD) at www.aepd.es.",
  },
  es: {
    title: "Política de Privacidad",
    subtitle: "Información sobre protección de datos de conformidad con el Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD).",
    metaDescription: "Política de Privacidad y Tratamiento de Datos Personales con arreglo al Reglamento General de Protección de Datos (RGPD) y la LOPDGDD.",
    s1_title: "1. Responsable del Tratamiento",
    s2_title: "2. Finalidad y Naturaleza de los Datos Tratados",
    s2_intro: `En ${COMPANY_NAME} tratamos la información facilitada por los representantes comerciales y proveedores con las siguientes finalidades:`,
    s2_bullets: [
      "Gestión de Consultas B2B e Integración de Proveedores: Atender solicitudes y evaluación de catálogos mayoristas.",
      "Gestión Comercial y Contractual: Tramitar pedidos de compra, facturación, recepción de mercancías y acuerdos de distribución.",
      "Cumplimiento de Obligaciones Legales y Fiscales: Cumplir con la normativa tributaria y mercantil de España y la Unión Europea (VIES 0% IVA).",
    ],
    s3_title: "3. Legitimación para el Tratamiento",
    s3_intro: "La base jurídica que legitima el tratamiento de sus datos es:",
    s3_bullets: [
      "Consentimiento expreso del interesado (Art. 6.1.a RGPD) al remitir formularios habiendo aceptado esta Política.",
      "Ejecución de medidas precontractuales o contractuales (Art. 6.1.b RGPD) para la gestión de compras mayoristas.",
      "Cumplimiento de obligaciones legales (Art. 6.1.c RGPD) aplicables en materia fiscal y contable.",
    ],
    s4_title: "4. Plazos de Conservación de los Datos",
    s4_text: "Los datos se conservarán durante la relación comercial y posteriormente durante los plazos legalmente exigibles (mínimo 6 años de conformidad con el Código de Comercio español).",
    s5_title: "5. Destinatarios y Transferencias Internacionales",
    s5_text: "No se cederán datos a terceros salvo obligación legal (Administración Tributaria, entidades bancarias SEPA).",
    s6_title: "6. Derechos del Interesado y Reclamación ante la Autoridad de Control",
    s6_intro: `Puede ejercitar sus derechos de Acceso, Rectificación, Supresión, Limitación, Portabilidad y Oposición escribiendo a: ${COMPANY_EMAIL}.`,
    s6_aepd: "Asimismo, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) en www.aepd.es.",
  },
  de: {
    title: "Datenschutzerklärung (DSGVO)",
    subtitle: "Informationen zur Datenverarbeitung gemäß der Datenschutz-Grundverordnung (EU-DSGVO) und dem spanischen Datenschutzgesetz (LOPDGDD).",
    metaDescription: "Datenschutzerklärung von Viasglobal nach den Standards der EU-Datenschutz-Grundverordnung.",
    s1_title: "1. Verantwortlicher für die Datenverarbeitung",
    s2_title: "2. Zwecke der Datenverarbeitung",
    s2_intro: `Bei ${COMPANY_NAME} verarbeiten wir Daten von Geschäftspartnern und Lieferanten für folgende Zwecke:`,
    s2_bullets: [
      "B2B-Partner-Onboarding & Handelsanfragen: Prüfung von Händlerkatalogen und B2B-Kontoeröffnungen.",
      "Vertrags- & Bestellabwicklung: Erteilung von Einkaufsaufträgen, Rechnungsstellung und Warenannahme.",
      "Erfüllung steuerlicher und handelsrechtlicher Pflichten in der EU (VIES 0% innergemeinschaftliche Lieferungen).",
    ],
    s3_title: "3. Rechtsgrundlagen der Verarbeitung",
    s3_intro: "Die Verarbeitung stützt sich auf folgende Rechtsgrundlagen:",
    s3_bullets: [
      "Ausdrückliche Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) bei Übermittlung des Onboarding-Formulars.",
      "Erfüllung vorvertraglicher und vertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO).",
      "Erfüllung rechtlicher und steuerlicher Pflichten (Art. 6 Abs. 1 lit. c DSGVO).",
    ],
    s4_title: "4. Speicherdauer",
    s4_text: "Die Daten werden für die Dauer der Geschäftsbeziehung und gemäß den gesetzlichen Aufbewahrungsfristen (mindestens 6 Jahre nach spanischem Handelsrecht) gespeichert.",
    s5_title: "5. Empfänger und Drittlandübermittlung",
    s5_text: "Eine Weitergabe an Dritte erfolgt ausschließlich im Rahmen gesetzlicher Pflichten (Finanzbehörden, SEPA-Banken).",
    s6_title: "6. Rechte der Betroffenen & Aufsichtsbehörde",
    s6_intro: `Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung und Datenübertragbarkeit via: ${COMPANY_EMAIL}.`,
    s6_aepd: "Sie haben zudem das Recht auf Beschwerde bei der zuständigen Aufsichtsbehörde (AEPD, www.aepd.es).",
  },
  fr: {
    title: "Politique de Confidentialité (RGPD)",
    subtitle: "Informations sur le traitement des données personnelles conformément au Règlement (UE) 2016/679 (RGPD) et à la loi espagnole LOPDGDD.",
    metaDescription: "Politique de confidentialité et protection des données personnelles de Viasglobal selon les normes européennes.",
    s1_title: "1. Responsable du Traitement",
    s2_title: "2. Finalités du Traitement",
    s2_intro: `Chez ${COMPANY_NAME}, nous traitons les données de nos partenaires et fournisseurs pour les finalités suivantes :`,
    s2_bullets: [
      "Gestion des Demandes B2B & Onboarding : Examen des catalogues grossistes et ouverture de comptes partenaires.",
      "Gestion Commerciale & Commandes : Émission des bons de commande, facturation et réception logistique.",
      "Conformité Fiscale et Comptable dans l'UE : Gestion des livraisons intracommunautaires à 0% de TVA (VIES).",
    ],
    s3_title: "3. Base Juridique du Traitement",
    s3_intro: "Le traitement repose sur les bases légales suivantes :",
    s3_bullets: [
      "Consentement explicite (Art. 6.1.a RGPD) lors de la soumission du formulaire.",
      "Exécution de mesures précontractuelles et contractuelles (Art. 6.1.b RGPD).",
      "Respect des obligations légales et fiscales (Art. 6.1.c RGPD).",
    ],
    s4_title: "4. Durée de Conservation",
    s4_text: "Les données sont conservées pendant la durée de la relation commerciale et selon les délais légaux de prescription (minimum 6 ans en vertu du Code de Commerce espagnol).",
    s5_title: "5. Destinataires des Données",
    s5_text: "Aucune transmission de données à des tiers n'a lieu, hors obligations légales (Administration fiscale, banques SEPA).",
    s6_title: "6. Droits des Personnes Concernées & Autorité de Contrôle",
    s6_intro: `Vous pouvez exercer vos droits d'accès, de rectification, d'effacement et d'opposition en écrivant à : ${COMPANY_EMAIL}.`,
    s6_aepd: "Vous disposez également du droit d'introduire une réclamation auprès de l'autorité compétente (AEPD, www.aepd.es).",
  },
  it: {
    title: "Informativa sulla Privacy (GDPR)",
    subtitle: "Informazioni sul trattamento dei dati personali ai sensi del Regolamento (UE) 2016/679 (GDPR) e della legge spagnola LOPDGDD.",
    metaDescription: "Informativa sulla privacy e protezione dei dati personali per Viasglobal secondo le norme europee.",
    s1_title: "1. Titolare del Trattamento",
    s2_title: "2. Finalità del Trattamento",
    s2_intro: `Presso ${COMPANY_NAME} trattiamo i dati personali dei partner commerciali per le seguenti finalità:`,
    s2_bullets: [
      "Gestione Richieste B2B & Onboarding: Valutazione dei cataloghi e apertura di account commerciali.",
      "Gestione Contrattuale & Ordini: Elaborazione degli ordini di acquisto, fatturazione e ricezione logistica.",
      "Adempimenti Fiscali e Legali nell'UE: Gestione delle cessioni intracomunitarie con aliquota IVA zero (VIES).",
    ],
    s3_title: "3. Base Giuridica del Trattamento",
    s3_intro: "Il trattamento è fondato su:",
    s3_bullets: [
      "Consenso esplicito (Art. 6.1.a GDPR) espresso al momento dell'invio del modulo.",
      "Esecuzione di misure precontrattuali o contrattuali (Art. 6.1.b GDPR).",
      "Adempimento di obblighi legali e fiscali (Art. 6.1.c GDPR).",
    ],
    s4_title: "4. Periodo di Conservazione",
    s4_text: "I dati sono conservati per la durata del rapporto commerciale e conformemente ai termini di legge previsti dal Codice di Commercio spagnolo (minimo 6 anni).",
    s5_title: "5. Destinatari dei Dati",
    s5_text: "I dati non vengono ceduti a terzi ad eccezione degli obblighi di legge (Autorità tributarie, istituti bancari SEPA).",
    s6_title: "6. Diritti dell'Interessato e Reclamo all'Autorità di Controllo",
    s6_intro: `È possibile esercitare i diritti di accesso, rettifica, cancellazione, limitazione e opposizione scrivendo a: ${COMPANY_EMAIL}.`,
    s6_aepd: "L'interessato ha inoltre il diritto di proporre reclamo all'autorità di controllo competente (AEPD, www.aepd.es).",
  },
};

export const COOKIE_POLICIES: Record<Locale, CookiePolicyContent> = {
  en: {
    title: "Cookie Policy",
    subtitle: "Detailed information on data storage devices in accordance with Article 22.2 of Spanish Law 34/2002 (LSSICE) and AEPD guidelines.",
    metaDescription: "Cookie policy and management guide for Viasglobal in compliance with EU ePrivacy directives.",
    s1_title: "1. What are Cookies?",
    s1_text: "A cookie is a small text file stored in your browser when you visit a website. It allows the website to remember your session, language settings, and ensure secure and smooth navigation.",
    s2_title: "2. Types of Cookies Used",
    s2_intro: `In compliance with Spanish Data Protection Agency (AEPD) guidelines, the cookies used on ${COMPANY_NAME} are detailed below:`,
    table_header_type: "Cookie Type",
    table_header_purpose: "Purpose",
    table_header_duration: "Duration",
    table_header_management: "Management",
    cookie_tech_type: "Technical / Necessary",
    cookie_tech_purpose: "Essential for website functionality, language preferences, and cookie consent state.",
    cookie_tech_duration: "Session / 1 Year",
    cookie_tech_mgmt: "First-Party",
    cookie_anal_type: "Aggregated Analytics",
    cookie_anal_purpose: "Measures site performance and anonymous statistical traffic without tracking individual identities.",
    cookie_anal_duration: "Persistent (up to 2 years)",
    cookie_anal_mgmt: "First / Third-Party",
    s3_title: "3. Legal Basis and Consent",
    s3_text: "Strictly necessary technical cookies are deployed under legitimate interest (Art. 22.2 LSSICE). Analytics cookies are activated only upon your explicit consent by clicking 'Accept All' on the cookie banner.",
    s4_title: "4. How to Configure or Disable Cookies in Your Browser",
    s4_intro: "You can allow, block, or delete cookies installed on your device through your browser settings:",
    s5_title: "5. Contact Information",
    s5_text: `For any questions regarding our Cookie Policy, please reach out to us at: ${COMPANY_EMAIL}.`,
  },
  es: {
    title: "Política de Cookies",
    subtitle: "Información detallada sobre el uso de cookies en cumplimiento del artículo 22.2 de la LSSICE y la Guía de cookies de la AEPD.",
    metaDescription: "Política de Cookies de Viasglobal en cumplimiento del artículo 22.2 de la LSSICE y las directrices de la AEPD.",
    s1_title: "1. ¿Qué son las Cookies?",
    s1_text: "Una cookie es un pequeño fichero de texto que se almacena en su navegador cuando visita un sitio web. Permite recordar su visita, preferencias de idioma y garantizar una navegación segura.",
    s2_title: "2. Tipos de Cookies Utilizadas",
    s2_intro: `De conformidad con las directrices de la AEPD, detallamos las cookies utilizadas en ${COMPANY_NAME}:`,
    table_header_type: "Tipo de Cookie",
    table_header_purpose: "Finalidad",
    table_header_duration: "Temporalidad",
    table_header_management: "Gestión",
    cookie_tech_type: "Técnicas / Necesarias",
    cookie_tech_purpose: "Permiten la navegación web, la gestión del idioma y el almacenamiento del consentimiento de cookies.",
    cookie_tech_duration: "Sesión / 1 año",
    cookie_tech_mgmt: "Propias",
    cookie_anal_type: "Analíticas (Agregadas)",
    cookie_anal_purpose: "Permiten la medición estadística anónima del tráfico web para mejorar el servicio.",
    cookie_anal_duration: "Persistente (hasta 2 años)",
    cookie_anal_mgmt: "Propias / Terceros",
    s3_title: "3. Base Legal y Gestión del Consentimiento",
    s3_text: "Las cookies técnicas necesarias se instalan por interés legítimo (art. 22.2 LSSICE). Las cookies analíticas únicamente se instalan tras pulsar 'Aceptar todas' en el banner.",
    s4_title: "4. Cómo Desactivar o Eliminar Cookies desde su Navegador",
    s4_intro: "Puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante las opciones de su navegador:",
    s5_title: "5. Contacto para Dudas",
    s5_text: `Si tiene cualquier duda sobre nuestra Política de Cookies, contáctenos en: ${COMPANY_EMAIL}.`,
  },
  de: {
    title: "Cookie-Richtlinie",
    subtitle: "Detaillierte Informationen zum Einsatz von Cookies gemäß Artikel 22.2 des Gesetzes 34/2002 (LSSICE) und den AEPD-Richtlinien.",
    metaDescription: "Cookie-Richtlinie und Einstellungen für Viasglobal gemäß den europäischen Datenschutz- und ePrivacy-Vorschriften.",
    s1_title: "1. Was sind Cookies?",
    s1_text: "Ein Cookie ist eine kleine Textdatei, die in Ihrem Browser gespeichert wird, wenn Sie eine Website besuchen. Es speichert Spracheinstellungen und gewährleistet den sicheren Betrieb.",
    s2_title: "2. Verwendete Cookie-Arten",
    s2_intro: `Gemäß den Leitlinien der Datenschutzbehörde (AEPD) informieren wir über die auf ${COMPANY_NAME} eingesetzten Cookies:`,
    table_header_type: "Cookie-Art",
    table_header_purpose: "Zweck",
    table_header_duration: "Dauer",
    table_header_management: "Verwaltung",
    cookie_tech_type: "Technisch / Notwendig",
    cookie_tech_purpose: "Erforderlich für Navigation, Sprachauswahl und Speicherung des Cookie-Einwilligungsstatus.",
    cookie_tech_duration: "Sitzung / 1 Jahr",
    cookie_tech_mgmt: "Erstanbieter",
    cookie_anal_type: "Analytisch (Aggregiert)",
    cookie_anal_purpose: "Ermöglicht anonyme statistische Reichweitenmessung zur Optimierung der Website.",
    cookie_anal_duration: "Persistent (bis zu 2 Jahre)",
    cookie_anal_mgmt: "Erstanbieter / Dritte",
    s3_title: "3. Rechtsgrundlage und Einwilligung",
    s3_text: "Technisch notwendige Cookies werden auf Basis berechtigten Interesses gesetzt (Art. 22.2 LSSICE). Analytische Cookies werden erst nach Klick auf 'Alle akzeptieren' aktiviert.",
    s4_title: "4. Deaktivierung von Cookies im Browser",
    s4_intro: "Sie können Cookies über die Einstellungen Ihres Browsers verwalten, blockieren oder löschen:",
    s5_title: "5. Kontakt",
    s5_text: `Bei Fragen zu unserer Cookie-Richtlinie erreichen Sie uns unter: ${COMPANY_EMAIL}.`,
  },
  fr: {
    title: "Politique relative aux Cookies",
    subtitle: "Informations détaillées sur l'utilisation des cookies conformément à l'article 22.2 de la loi 34/2002 (LSSICE) et aux directives de l'AEPD.",
    metaDescription: "Politique relative aux cookies de Viasglobal en conformité avec la directive européenne ePrivacy.",
    s1_title: "1. Qu'est-ce qu'un Cookie ?",
    s1_text: "Un cookie est un fichier texte enregistré sur votre navigateur lors de la visite d'un site. Il permet de mémoriser vos préférences de langue et d'assurer une navigation sécurisée.",
    s2_title: "2. Types de Cookies Utilisés",
    s2_intro: `Conformément aux directives de l'autorité de protection des données (AEPD), voici les cookies utilisés sur ${COMPANY_NAME} :`,
    table_header_type: "Type de Cookie",
    table_header_purpose: "Finalité",
    table_header_duration: "Durée",
    table_header_management: "Gestion",
    cookie_tech_type: "Techniques / Nécessaires",
    cookie_tech_purpose: "Indispensables au fonctionnement du site, à la langue sélectionnée et au consentement.",
    cookie_tech_duration: "Session / 1 an",
    cookie_tech_mgmt: "Propriétaire",
    cookie_anal_type: "Analytiques (Agrégés)",
    cookie_anal_purpose: "Mesure statistique anonyme de l'audience pour améliorer les services du portail.",
    cookie_anal_duration: "Persistant (jusqu'à 2 ans)",
    cookie_anal_mgmt: "Propriétaire / Tiers",
    s3_title: "3. Base Légale et Consentement",
    s3_text: "Les cookies techniques sont installés sur la base de l'intérêt légitime (art. 22.2 LSSICE). Les cookies analytiques sont activés uniquement après accord via 'Tout accepter'.",
    s4_title: "4. Gestion des Cookies dans votre Navigateur",
    s4_intro: "Vous pouvez configurer, bloquer ou supprimer les cookies via les paramètres de votre navigateur :",
    s5_title: "5. Contact",
    s5_text: `Pour toute question relative aux cookies, contactez-nous à : ${COMPANY_EMAIL}.`,
  },
  it: {
    title: "Politica sui Cookie",
    subtitle: "Informazioni dettagliate sull'uso dei cookie ai sensi dell'articolo 22.2 della legge 34/2002 (LSSICE) e delle linee guida AEPD.",
    metaDescription: "Politica sui cookie e gestione del consenso per Viasglobal secondo le direttive europee ePrivacy.",
    s1_title: "1. Cosa sono i Cookie?",
    s1_text: "Un cookie è un piccolo file di testo memorizzato nel browser quando si visita un sito web. Consente di memorizzare la lingua e garantire una navigazione sicura.",
    s2_title: "2. Tipologie di Cookie Utilizzate",
    s2_intro: `In conformità con le linee guida dell'autorità per la protezione dei dati (AEPD), di seguito sono riportati i cookie usati su ${COMPANY_NAME}:`,
    table_header_type: "Tipo di Cookie",
    table_header_purpose: "Finalità",
    table_header_duration: "Durata",
    table_header_management: "Gestione",
    cookie_tech_type: "Tecnici / Necessari",
    cookie_tech_purpose: "Indispensabili per la navigazione, la gestione della lingua e il consenso ai cookie.",
    cookie_tech_duration: "Sessione / 1 anno",
    cookie_tech_mgmt: "Proprietari",
    cookie_anal_type: "Analitici (Aggregati)",
    cookie_anal_purpose: "Consentono la misurazione statistica anonima del traffico per migliorare il servizio.",
    cookie_anal_duration: "Persistente (fino a 2 anni)",
    cookie_anal_mgmt: "Proprietari / Terze parti",
    s3_title: "3. Base Giuridica e Consenso",
    s3_text: "I cookie tecnici necessari sono installati per legittimo interesse (art. 22.2 LSSICE). I cookie analitici vengono attivati solo dopo aver cliccato 'Accetta tutti'.",
    s4_title: "4. Come Disabilitare o Eliminare i Cookie dal Browser",
    s4_intro: "È possibile gestire, bloccare o eliminare i cookie attraverso le impostazioni del proprio browser web:",
    s5_title: "5. Contatti per Informazioni",
    s5_text: `Per qualsiasi chiarimento sulla Politica sui Cookie, scrivere a: ${COMPANY_EMAIL}.`,
  },
};
