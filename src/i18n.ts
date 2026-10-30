// CodexSheet speaks the languages its students actually study in. The UI keeps a
// deliberately small translated surface (the free path: landing, the pass lock,
// Guru, mentorship) and everything else falls back to English, while the AI
// teacher itself answers in the chosen language through /api/tutor.
import { useEffect, useState } from "react";

export type UiLanguage = "en" | "hi" | "bn" | "ta" | "te" | "mr" | "gu";

export type LanguageOption = {
  id: UiLanguage;
  native: string;
  english: string;
  speechLocale: string;
  scriptHint: string;
};

export const uiLanguages: LanguageOption[] = [
  { id: "en", native: "English", english: "English", speechLocale: "en-IN", scriptHint: "Latin" },
  { id: "hi", native: "हिन्दी", english: "Hindi", speechLocale: "hi-IN", scriptHint: "Devanagari" },
  { id: "bn", native: "বাংলা", english: "Bengali", speechLocale: "bn-IN", scriptHint: "Bengali" },
  { id: "ta", native: "தமிழ்", english: "Tamil", speechLocale: "ta-IN", scriptHint: "Tamil" },
  { id: "te", native: "తెలుగు", english: "Telugu", speechLocale: "te-IN", scriptHint: "Telugu" },
  { id: "mr", native: "मराठी", english: "Marathi", speechLocale: "mr-IN", scriptHint: "Devanagari" },
  { id: "gu", native: "ગુજરાતી", english: "Gujarati", speechLocale: "gu-IN", scriptHint: "Gujarati" },
];

export const languageInstruction: Record<UiLanguage, string> = {
  en: "Answer in simple Indian English. Keep technical names (hash map, two pointers, DP) in English.",
  hi: "आसान हिन्दी में जवाब दो, देवनागरी लिपि में। तकनीकी नाम (hash map, two pointers, DP, array) अंग्रेज़ी में ही रखो।",
  bn: "সহজ বাংলায় উত্তর দাও। প্রযুক্তির নাম (hash map, two pointers, DP, array) ইংরেজিতেই রাখো।",
  ta: "எளிய தமிழில் பதில் சொல்லு. தொழில்நுட்ப பெயர்களை (hash map, two pointers, DP, array) ஆங்கிலத்திலேயே வை.",
  te: "సులభమైన తెలుగులో సమాధానం చెప్పు. సాంకేతిక పేర్లను (hash map, two pointers, DP, array) ఇంగ్లీషులోనే ఉంచు. ",
  mr: "सोप्या मराठीत उत्तर दे, देवनागरी लिपीत. तांत्रिक नावे (hash map, two pointers, DP, array) इंग्रजीतच ठेव.",
  gu: "સરળ ગુજરાતીમાં જવાબ આપ. તકનીકી નામો (hash map, two pointers, DP, array) અંગ્રેજીમાં જ રાખ.",
};

export const languageSpeechName: Record<UiLanguage, string> = {
  en: "English (India)",
  hi: "Hindi (India)",
  bn: "Bengali (India)",
  ta: "Tamil (India)",
  te: "Telugu (India)",
  mr: "Marathi (India)",
  gu: "Gujarati (India)",
};

const messages = {
  "lang.label": { en: "Language", hi: "भाषा", bn: "ভাষা", ta: "மொழி", te: "భాష", mr: "भाषा", gu: "ભાષા" },
  "nav.home": { en: "Home", hi: "होम", bn: "হোম", ta: "முகப்பு", te: "హోమ్", mr: "मुख्यपृष्ठ", gu: "હોમ" },
  "nav.problems": { en: "Problems", hi: "प्रॉब्लम", bn: "প্রবলেম", ta: "பிரச்சினைகள்", te: "సమస్యలు", mr: "प्रश्न", gu: "પ્રશ્નો" },
  "nav.deva": { en: "Deva", hi: "देवा", bn: "দেবা", ta: "தேவா", te: "దేవ", mr: "देवा", gu: "દેવ" },
  "nav.course": { en: "DSA Course", hi: "डीएसए कोर्स", bn: "ডিএসএ কোর্স", ta: "டிஎஸ்எ படிப்ப", te: "డీఎస్ఏ కోర్సు", mr: "डीएसए अभ्यासक्रम", gu: "ડીએસએ કોર્સ" },
  "nav.tutor": { en: "Ask Tutor", hi: "टीचर से पूछो", bn: "শিক্ষককে জিজ্ঞাসা", ta: "ஆசிரியரிடம் கேள்", te: "ట్యూటర్‌ను అడగి", mr: "शिक्षकांना विचारा", gu: "ટ્યુટરને પૂછો" },
  "nav.guru": { en: "Guru · free AI teacher", hi: "गुरु · मुफ़्त AI टीचर", bn: "গুরু · ফ্রি AI শিক্ষক", ta: "குரு · இலவச AI ஆசிரியர்", te: "గురు · ఉచిత AI ఉపాధ్యాయుడు", mr: "गुरु · मोफत AI शिक्षक", gu: "ગુરુ · મફત AI શિક્ષક" },
  "nav.more": { en: "More", hi: "और", bn: "আরও", ta: "மேலும்", te: "మరింత", mr: "अधिक", gu: "વધુ" },
  "top.pass": { en: "Pass ₹10–₹800", hi: "पास ₹10–₹800", bn: "পাস ₹10–₹800", ta: "பாஸ் ₹10–₹800", te: "పాస్ ₹10–₹800", mr: "पास ₹10–₹800", gu: "પાસ ₹10–₹800" },
  "home.eyebrow": { en: "YOUR NEXT INTERVIEW STARTS HERE", hi: "आपका अगला इंटरव्यू यहीं से शुरू", bn: "তোমার পরের ইন্টারভিউ এখান থেকে", ta: "உங்கள் அடுத்த நேர்காணல் இங்கே தொடங்குகிறது", te: "మీ తదుపరి ఇంటర్వ్యూ ఇక్కడే మొదలవుతుంది", mr: "तुमचा पुढचा इंटरव्यू इथूनच", gu: "તમારી આગલી ઈન્ટરવ્યૂ અહીંથી શરૂ" },
  "home.title1": { en: "DSA interview practice", hi: "डीएसए इंटरव्यू की तैयारी", bn: "ডিএসএ ইন্টারভিউ প্রস্তুতি", ta: "டிஎஸ்எ நேர்காணல் பயிற்சி", te: "డీఎస్ఏ ఇంటర్వ్యూ సన్నాహం", mr: "डीएसए इंटरव्यू सराव", gu: "ડીએસએ ઈન્ટરવ્યૂ અભ્યાસ" },
  "home.title2": { en: "with a plan.", hi: "एक प्लान के साथ।", bn: "একটি পরিকল্পনা নিয়ে।", ta: "ஒரு திட்டத்துடன்.", te: " ఒక ప్లాన్‌తో.", mr: "एक योजनेसह.", gu: "એક યોજના સાથે." },
  "home.body": {
    en: "Build problem-solving fluency one pattern at a time. Keep your practice, progress, and study group in one focused workspace.",
    hi: "एक-एक पैटर्न सीखकर प्रॉब्लम सॉल्विंग में मज़बूत बनो। अपना प्रैक्टिस, प्रोग्रेस और स्टडी ग्रुप एक जगह रखो।",
    bn: "একবারে একটি পেটার্ন শিখে সমস্যা সমাধানে দক্ষ হও। তোমার প্র্যাকটিস, প্রগ্রেস আর স্টাডি গ্রুপ এক জায়গায় রাখো।",
    ta: "ஒரு நேரத்தில் ஒரு பேட்டர்ன் கற்று, சிக்கல் தீர்வில் வலுவாகு. உங்கள் பிராக்டிஸ், முன்னேற்றம், படிப்பு குழு ஒரே இடத்தில் வை.",
    te: "ఒక్కో పాటర్న్ నేర్చుకుంటూ సమస్య పరిష్కారంలో బలపడు. మీ ప్రాక్టీస్, ప్రగతి, స్టడీ గ్రూప్ ఒకే చోట ఉంచు.",
    mr: "एकदात एक पॅटर्न शिकून प्रॉब्लम-सॉल्विंग मजबूत बन. तुझा सराव, प्रगती आणि अभ्यास गट एकाच ठिकाणी ठेव.",
    gu: "એક વખતે એક પેટર્ન શીખીને પ્રોબ્લમ સોલ્વિંગમાં મજબૂત બનો. તમારો સરળ અભ્યાસ, પ્રગતિ અને સ્ટડી ગ્રુપ એક જ જગ્યાએ રાખો.",
  },
  "home.cta1": { en: "Open Deva editor", hi: "देवा एडिटर खोलो", bn: "দেবা এডিটর খোলো", ta: "தேவா எடிட்டர் திற", te: "దేవ ఎడిటర్ తెరవండి", mr: "देवा एडिटर उघडा", gu: "દેવ એડિટર ખોલો" },
  "home.cta2": { en: "Meet your AI teacher", hi: "अपने AI टीचर से मिलो", bn: "তোমার AI শিক্ষকের সাথে দেখা", ta: "உங்கள் AI ஆசிரியரை சந்தி", te: "మీ AI ఉపాధ్యాయుడిని కలవండి", mr: "तुमच्या AI शिक्षकाला भेटा", gu: "તમારા AI શિક્ષકને મળો" },
  "home.proof1": { en: "250 curated problems", hi: "250 चुने हुए प्रॉब्लम", bn: "২৫০ বাছাই করা প্রবলেম", ta: "250 தேர்ந்த பிரச்சினைகள்", te: "250 ఎంపిక చేసిన సమస్యలు", mr: "250 निवडलेले प्रश्न", gu: "250 પસંદ કરેલા પ્રશ્નો" },
  "home.proof2": { en: "Free AI teacher, 7 languages", hi: "मुफ़्त AI टीचर, 7 भाषाएँ", bn: "ফ্রি AI শিক্ষক, ৭টি ভাষা", ta: "இலவச AI ஆசிரியர், 7 மொழிகள்", te: "ఉచిత AI ఉపాధ్యాయుడు, 7 భాషలు", mr: "मोफत AI शिक्षक, 7 भाषा", gu: "મફત AI શિક્ષક, 7 ભાષાઓ" },
  "lock.kicker": { en: "CODEXSHEET FAMILY PASS · ₹10–₹800", hi: "CODEXSHEET FAMILY PASS · ₹10–₹800", bn: "CODEXSHEET FAMILY PASS · ₹10–₹800", ta: "CODEXSHEET FAMILY PASS · ₹10–₹800", te: "CODEXSHEET FAMILY PASS · ₹10–₹800", mr: "CODEXSHEET FAMILY PASS · ₹10–₹800", gu: "CODEXSHEET FAMILY PASS · ₹10–₹800" },
  "lock.title": { en: "One payment opens all 19 features.", hi: "एक payment, सारे 19 features खुल जाते हैं।", bn: "একটি পেমেন্টেই খুলে যায় ১৯টি ফিচার।", ta: "ஒரு கட்டணமே, 19 அம்சங்களும் திறக்கும்.", te: "ఒక చెల్లింపుతోనే 19 ఫీచర్లు తెరుచుకుంటాయి.", mr: "एकच पेमेंट, सर्व 19 फीचर्स उघडतात.", gu: "એક જ પેમેન્ટ, બધા 19 ફીચર ખૂલી જાય." },
  "lock.body": {
    en: "The 250-problem sheet is the product. ₹10–₹800 on Paytm opens it in full, along with the Deva editor, the animated course, notes, chat, calls and your 1:1 session. Guru, the free AI teacher, stays free forever.",
    hi: "250 प्रॉब्लम वाली शीट ही प्रोडक्ट है। Paytm पर ₹10–₹800 से यह पूरा खुलता है — देवा एडिटर, एनिमेटेड कोर्स, नोट्स, चैट, कॉल्स और तुम्हारी 1:1 सीटिंग भी। गुरु, यानी AI टीचर, हमेशा मुफ़्त रहेगा।",
    bn: "২৫০ প্রবলেমের শীটই আসল প্রোডাক্ট। Paytm-এ ₹10–₹800 দিলে সব খোলে — দেবা এডিটর, অ্যানিমেটেড কোর্স, নোট, চ্যাট, কল আর 1:1 সেশনও। গুরু, তোমার AI শিক্ষক, সবসময় ফ্রি থাকবে।",
    ta: "250 பிரச்சினைகள் உள்ள ஷீட் தான் பிரோடக்ட். Paytm-ல் ₹10–₹800 கொடுத்தால் தேவா எடிட்டர், அனிமேட்டட் படிப்பு, குறிப்புகள், சாட், அழைப்பு, 1:1 அமர்வு அனைத்தும் திறக்கும். குரு (AI ஆசிரியர்) எப்போதும் இலவசம்.",
    te: "250 సమస్యల షీటే అసలైన ప్రోడక్ట్. Paytm పై ₹10–₹800 ఇస్తే దేవ ఎడిటర్, యానిమేటెడ్ కోర్సు, నోట్స్, చాట్, కాల్స్, 1:1 సెషన్ అన్నీ తెరుచుకుంటాయి. గురు (AI ఉపాధ్యాయుడు) ఎప్పుడూ ఉచితం.",
    mr: "250 प्रश्नांची शीटच खरे प्रोडक्ट. Paytm वर ₹10–₹800 द्या म्हणजे देवा एडिटर, अ‍ॅनिमेटेड अभ्यासक्रम, नोटीस, चॅट, कॉल्स आणि 1:1 सेशन्स सर्व उघडेल. गुरु (AI शिक्षक) नेहमी मोफत राहील.",
    gu: "250 પ્રશ્નોની શીટ જ સાચી પ્રોડક્ટ. Paytm પર ₹10–₹800 આપો એટલે દેવ એડિટર, એનિમેટેડ કોર્સ, નોટ્સ, ચેટ, કૉલ્સ અને 1:1 સેશન બધું ખૂલી જશે. ગુરુ (AI શિક્ષક) હંમેશા મફત રહેશે.",
  },
  "lock.note": {
    en: "Aditya matches every payment against his own Paytm statement, usually the same day. Your reference starts with CS-FAM-. Not for you? Say so within 5 days of confirmation and he refunds whatever you paid, straight back on Paytm.",
    hi: "Aditya हर payment अपनी Paytm statement से मिलाता है, अक्सर उसी दिन। तुम्हारा reference CS-FAM- से शुरू होता है। काम नहीं करना? confirm होने के 5 दिन में बताना, जितना भरा था उतना Paytm पर वापस मिलेगा।",
    bn: "Aditya প্রতিটি পেমেন্ট নিজের Paytm statement-এর সাথে মিলিয়ে নেন, প্রায় একই দিনে। তোমার reference শুরু হয় CS-FAM- দিয়ে। দরকার নেই? confirm হওয়ার ৫ দিনের মধ্যে বলো, যা দিয়েছিলে তা-ই Paytm-এ ফেরত পাবে।",
    ta: "Aditya ஒவ்வொரு payment-ஐயும் தன் Paytm statement-உடன் ஒப்பிடுவார், பெரும்பாலும் அன்றே. உங்கள் reference CS-FAM- என தொடங்கும். தேவையில்லையா? உறுதிப்படுத்த 5 நாட்கள் உள்ளே சொல்லுங்கள், நீங்கள் கொடுத்ததை Paytm-ல் திரும்பப் பெறுவீர்கள்.",
    te: "Aditya ప్రతి payment ను తన Paytm statement తో పోల్చి చూస్తాడు, చాలాసార్ల అదే రోజు. మీ reference CS-FAM- తో మొదలవుతుంది. అవసరం లేదా? confirm అయిన 5 రోజుల్లో చెప్పండి, మీరు చెల్లించింది Paytm లో తిరిగి ఇప్పిస్తాడు.",
    mr: "Aditya प्रत्येक payment आपल्या Paytm statement शी जुळवतो, बहुतेक त्याच दिवशी. तुझा reference CS-FAM- ने सुरू होतो. हवा नाही? confirm झाल्याच्या 5 दिसांत सांग, तू भरलली रकम Paytm वर परत मिळेल.",
    gu: "Aditya દરેક payment પોતાની Paytm statement સાથે મેળવે છે, ઘણીવાર એ જ દિવસે. તમારો reference CS-FAM- થી શરૂ થાય છે. જોઈતો નથી? confirm થયાના 5 દિવસમાં કહો, તમે ભરેલી રકમ Paytm પર પાછી મળશે.",
  },
  "lock.pay": { en: "Pay ₹10–₹800 on Paytm", hi: "Paytm पर ₹10–₹800 भुगतान करो", bn: "Paytm-এ ₹10–₹800 দিন", ta: "Paytm-ல் ₹10–₹800 செலுத்து", te: "Paytm పై ₹10–₹800 చెల్లించండి", mr: "Paytm वर ₹10–₹800 भरा", gu: "Paytm પર ₹10–₹800 ભુગટાવો" },
  "lock.paid": { en: "I paid — unlock", hi: "मैंने pay किया — खोलो", bn: "আমি দিয়েছি — খোলো", ta: "நான் செலுத்தினேன் — திற", te: "చెల్లించాను — తెరవండి", mr: "मी भरले — उघडा", gu: "મે ભર્યું — ખોલો" },
  "lock.checking": { en: "Checking…", hi: "देख रहे हैं…", bn: "দেখছি…", ta: "பார்க்கிறேன்…", te: "చూస్తున్నాను…", mr: "तपासत आहे…", gu: "તપાસી રહ્યું છે…" },
  "lock.free": { en: "No money? Ask Guru for free", hi: "पैसे नहीं? गुरु से मुफ़्त पूछो", bn: "টাকা নেই? গুরুকে ফ্রি জিজ্ঞাসা করো", ta: "பணம் இல்லை? குருவிடம் இலவசமாக கேள்", te: "డబ్బు లేదా? గురు ఉచితంగా అడగతాడు", mr: "पैसे नाहीत? गुरुला मोफत विचार", gu: "પૈસા નથી? ગુરુને મફત પૂછો" },
  "guru.kicker": { en: "FREE · AI TEACHER · 7 INDIAN LANGUAGES", hi: "मुफ़्त · AI टीचर · 7 भारतीय भाषाएँ", bn: "ফ্রি · AI শিক্ষক · ৭টি ভারতীয় ভাষা", ta: "இலவசம் · AI ஆசிரியர் · 7 இந்திய மொழிகள்", te: "ఉచితం · AI ఉపాధ్యాయుడు · 7 భారతీయ భాషలు", mr: "मोफत · AI शिक्षक · 7 भारतीय भाषा", gu: "મફત · AI શિક્ષક · 7 ભારતીય ભાષાઓ" },
  "guru.title": { en: "Guru teaches you DSA out loud.", hi: "गुरु तुम्हें DSA बोलकर सिखाता है।", bn: "গুরু তোমাকে DSA বলে বুঝিয়ে শেখায়।", ta: "குரு உங்களுக்கு DSA சொல்லித் தருவார்.", te: "గురు మీకు DSA నోటితోనే బోధిస్తాడు.", mr: "गुरु तुला DSA बोलून शिकवतो.", gu: "ગુરુ તમને DSA બોલીને શીખવે છે." },
  "guru.body": {
    en: "Ask in your language, get a 3D figure on the board, and hear the lesson spoken. Guru shows his face — he smiles when you get it, frowns when you skip the basics, and never judges you for being poor.",
    hi: "अपनी भाषा में पूछो, बोर्ड पर 3D आकृति देखो और lesson सुनो। गुरु का चेहरा है — तुम समझ जाओ तो मुस्कुराता है, बेसिक्स छोड़ो तो भौंह चढ़ाता है, और पैसे न होने का मज़ाक कभी नहीं उड़ाता।",
    bn: "নিজের ভাষায় জিজ্ঞাসা করো, বোর্ডে 3D ছবি দেখো, আর পাঠ শোনো। গুরুর মুখ আছে — বুঝতে পারলে হাসে, বেসিক এড়ালে ভ্রু কুঁচকায়, গরিব বলে কখনো খাপ্পা হয় না।",
    ta: "உங்கள் மொழியில் கேளு, போர்டில் 3D படத்தைப் பார், பாடத்தைக் கேளு. குருவுக்கு முகம் உண்டு — புரிந்தால் சிரிப்பார், அடிப்படையைத் தவிர்த்தால் கோபமாவார், பணமில்லை என்று ஒருபோதும் கேலி செய்யமாட்டார்.",
    te: "మీ భాషలో అడగండి, బోర్డుపై 3D చిత్రం చూడండి, పాఠాన్ని వినండి. గురుకి ముఖం ఉంది — అర్థమైతే నవ్వతాడు, బేసిక్స్ తప్పితే కోపంగా చూస్తాడు, డబ్బు లేదని ఎప్పటికీ హేళన చేయడు.",
    mr: "तुझ्या भाषेत विचार, बोर्डावर 3D आकृती पहा, பாठ बोलून ऐक. गुरुला चेहरा आहे — समजले की हसतो, बेसिक चुकले की रागवतो, आणि पैसे नाहीत म्हणून कधीच तुलना करत नाही.",
    gu: "તમારી ભાષામાં પૂછો, બોર્ડ પર 3D આકૃતિ જુઓ, પાઠ સાંભળો. ગુરુ પાસે મુખ છે — સમજાય તો હંસે, બેઝિક છોડે તો ગુસ્સે થાય, અને પૈસા નથી એટલે ક્યારેય મજાક ઉડાડે નહીં.",
  },
  "guru.placeholder": { en: "Ask in your language…", hi: "अपनी भाषा में पूछो…", bn: "নিজের ভাষায় জিজ্ঞাসা করো…", ta: "உங்கள் மொழியில் கேளு…", te: "మీ భాషలో అడగండి…", mr: "तुझ्या भाषेत विचार…", gu: "તમારી ભાષામાં પૂછો…" },
  "guru.send": { en: "Ask", hi: "पूछो", bn: "জিজ্ঞাসা", ta: "கேளு", te: "అడగండి", mr: "विचारा", gu: "પૂછો" },
  "guru.next": { en: "Next move", hi: "अगला कदम", bn: "পরের ধাপ", ta: "அடுத்த படி", te: "తర్వాతి అడుగు", mr: "पुढचा टप्पा", gu: "આગલું પગલું" },
  "guru.prev": { en: "Back", hi: "पीछे", bn: "পেছনে", ta: "பின்", te: "వెనుక", mr: "मागे", gu: "પાછળ" },
  "guru.hint": { en: "Give me a hint", hi: "एक हिंट दो", bn: "একটি হিন্ট দাও", ta: "ஒரு ஹிண்ட் দে", te: "ఒక హింట్ ఇవ్వు", mr: " एक हिंट दे", gu: "એક હિન્ટ આપો" },
  "guru.solve": { en: "Show the solution", hi: "सॉल्यूशन दिखाओ", bn: "সমাধান দেখাও", ta: "தீர்வு காட்டு", te: "పరిష్కారం చూపించు", mr: "उपाय दाखव", gu: "ઉકેલ બતાવો" },
  "guru.speakOn": { en: "Voice on", hi: "आवाज़ चालू", bn: "কণ্ঠ চালু", ta: "குரல் இயங்கும்", te: "వాయిస్ ఆన్", mr: "आवाज चालू", gu: "આવાજ ચાલુ" },
  "guru.speakOff": { en: "Voice off", hi: "आवाज़ बंद", bn: "কণ্ঠ বন্ধ", ta: "குரல் நிறுத்து", te: "వాయిస్ ఆఫ్", mr: "आवाज बंद", gu: "આવાજ બંધ" },
  "guru.thinking": { en: "Guru is thinking…", hi: "गुरु सोच रहा है…", bn: "গুরু ভাবছে…", ta: "குரு யோசிக்கிறார்…", te: "గురు ఆలోచిస్తున్నాడు…", mr: "गुरु विचारतोय…", gu: "ગુરુ વિચારે છે…" },
  "guru.offline": { en: "No network — teaching from the offline brain", hi: "നെറ്റ്‌वर्क नहीं — ऑफ़लाइन टीचिंग चल रही है", bn: "নেটওয়ার্ক নেই — অফলাইন পাঠ চলছে", ta: "நெட்வொர்க் இல்லை — ஆஃப்லைன் பாடம்", te: "నెట్‌వర్క్ లేదు — ఆఫ్‌లైన్ బోధన", mr: "नेटवर्क नाही — ऑफलाइन शिकवणी", gu: "નેટવર્ક નથી — ઓફલાઇન શીખવણી" },
  "guru.s1": { en: "Two Sum — how do I even start?", hi: "Two Sum — शुरू कहाँ से करूँ?", bn: "Two Sum — কোথা থেকে শুরু করব?", ta: "Two Sum — எங்கேயிருந்து தொடங்கு?", te: "Two Sum — ఎక్కడినుండి మొదలుపెట్టాలి?", mr: "Two Sum — सुरुवात कशी करू?", gu: "Two Sum — શું કરીને શરૂ કરું?" },
  "guru.s2": { en: "Explain sliding window", hi: "sliding window समझाओ", bn: "sliding window বোঝাও", ta: "sliding window விளக்கு", te: "sliding window వివరించు", mr: "sliding window समजाव", gu: "sliding window સમજાવો" },
  "guru.s3": { en: "Reverse a linked list", hi: "linked list को पलटो", bn: "linked list উল্টো করো", ta: "linked list திருப்பு", te: "linked list తిప్పు", mr: "linked list उलटा", gu: "linked list ઉલટાવો" },
  "guru.s4": { en: "I always fail at DP", hi: "DP में हमेशा अटक जाता हूँ", bn: "DP-তে সবসময় আটকে যাই", ta: "DP-ல் நான் எப்போதும் தடுமாறுவேன்", te: "DP లో ఎప్పుడూ ఇరుక్కుపోతాను", mr: "DP मध्ये नेहमी अडकतो", gu: "DP માં હંમેશા અટકી જાઉં" },
  "mood.calm": { en: "calm", hi: "शांत", bn: "শান্ত", ta: "அமைதி", te: "సామీప్యం", mr: "शांत", gu: "શાંત" },
  "mood.happy": { en: "smiling", hi: "मुस्कुरा रहा है", bn: "হাসছে", ta: "சிரிக்கிறது", te: "నవుతున్నాడు", mr: "हसतोय", gu: "હસે છે" },
  "mood.laugh": { en: "laughing", hi: "हँस रहा है", bn: "জোরে হাসছে", ta: "சிரித்து சிரிக்கிறது", te: "నవ్వుతోంది", mr: "हसून रडतोय", gu: "હસી રહ્યું છે" },
  "mood.angry": { en: "annoyed", hi: "नाराज़", bn: "রাগ হয়েছে", ta: "கோபம்", te: "కోపం", mr: "रागाला", gu: "ગુસ્સે" },
  "mood.think": { en: "thinking", hi: "सोच रहा है", bn: "ভাবছে", ta: "யோசிக்கிறது", te: "ఆలోచిస్తోంది", mr: "विचारतोय", gu: "વિચારે છે" },
  "mood.proud": { en: "proud of you", hi: "तुम पर गर्व है", bn: "তোমার উপর গর্ব", ta: "உங்களைப் பற்றி பெருமிதம்", te: "మీపై గర్వం", mr: "तुझा अभिमान", gu: "તમારા પર ગર્વ" },
  "guru.board": { en: "The board", hi: "बोर्ड", bn: "বোর্ড", ta: "போர்டு", te: "బోర్డు", mr: "फलक", gu: "બોર્ડ" },
  "guru.chat": { en: "Ask Guru", hi: "गुरु से पूछो", bn: "গুরুকে জিজ্ঞাসা", ta: "குருவிடம் கேள்", te: "గురుకి అడగి", mr: "गुरुला विचारा", gu: "ગુરુને પૂછો" },
  "guru.langNote": { en: "Guru replies in {language}.", hi: "गुरु {language} में जवाब देगा।", bn: "গুরু {language}-এ উত্তর দেবে।", ta: "குரு {language} இல் பதில் சொல்வார்.", te: "గురు {language} లో సమాధానం ఇస్తాడు.", mr: "गुरु {language} मध्ये उत्तर देतो.", gu: "ગુરુ {language} માં જવાબ આપે છે." },
  "guru.passCta": { en: "Want the whole CodexSheet too?", hi: "पूरा CodexSheet भी चाहिए?", bn: "পুরো CodexSheet-ও চাই?", ta: "முழு CodexSheet வேண்டுமா?", te: "మొత్తం CodexSheet కావాలా?", mr: "पूर्ण CodexSheet हवा आहे?", gu: "આખું CodexSheet પણ જોઈએ?" },
  "guru.free": { en: "Guru is free forever, in every language he speaks.", hi: "गुरु हमेशा मुफ़्त है, हर उस भाषा में जो वो बोलता है।", bn: "গুরু চিরকাল ফ্রি, যে সব ভাষায় কথা বলে।", ta: "குரு எப்போதும் இலவசம், அவர் பேசும் ஒவ்வொரு மொழியிலும்.", te: "గురు ఎప్పుడూ ఉచితం, అతను మాట్లాడే ప్రతి భాషలో.", mr: "गुरु नेहमी मोफत, ज्या भाषा तो बोलतो त्यात.", gu: "ગુરુ હંમેશા મફત, જે ભાષાઓ બોલે છે તેમાં." },
  "ms.kicker": { en: "ALL 19 FEATURES · ONE PASS · ₹10–₹800", hi: "सारे 19 features · एक पास · ₹10–₹800", bn: "সব ১৯ ফিচার · এক পাস · ₹10–₹800", ta: "அனைத்து 19 அம்சம் · ஒரே பாஸ் · ₹10–₹800", te: "అన్ని 19 ఫీచర్లు · ఒక పాస్ · ₹10–₹800", mr: "सर्व 19 फीचर्स · एक पास · ₹10–₹800", gu: "બધા 19 ફીચર · એક પાસ · ₹10–₹800" },
} as const;

export type MessageKey = keyof typeof messages;

export function translate(key: MessageKey, lang: UiLanguage): string {
  const entry = messages[key] as Record<UiLanguage, string>;
  return entry[lang] ?? entry.en;
}

const STORAGE_KEY = "codexsheet.language";
const listeners = new Set<() => void>();

function inferLanguage(): UiLanguage {
  const stored = (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null) as UiLanguage | null;
  if (stored && stored in languageInstruction) return stored;
  const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
  const match = (Object.keys(languageInstruction) as UiLanguage[]).find((id) => id !== "en" && nav.startsWith(id));
  return match ?? "en";
}

let current: UiLanguage = inferLanguage();

function commit(next: UiLanguage) {
  current = next;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    root.dataset.lang = next;
    root.lang = next === "en" ? "en-IN" : `${next}-IN`;
  }
  listeners.forEach((listener) => listener());
}

if (typeof document !== "undefined") {
  document.documentElement.dataset.lang = current;
  document.documentElement.lang = current === "en" ? "en-IN" : `${current}-IN`;
}

export function getUiLanguage(): UiLanguage {
  return current;
}

export function setUiLanguage(next: UiLanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Private mode still gets a working session; only persistence is lost.
  }
  commit(next);
}

export function useUiLanguage(): UiLanguage {
  const [lang, setLang] = useState<UiLanguage>(current);
  useEffect(() => {
    const refresh = () => setLang(getUiLanguage());
    listeners.add(refresh);
    refresh();
    return () => {
      listeners.delete(refresh);
    };
  }, []);
  return lang;
}

export function t(key: MessageKey): string {
  return translate(key, current);
}

export function useT(): (key: MessageKey, vars?: Record<string, string>) => string {
  const lang = useUiLanguage();
  return (key, vars) => {
    let value = translate(key, lang);
    if (vars) for (const [name, replacement] of Object.entries(vars)) value = value.split(`{${name}}`).join(replacement);
    return value;
  };
}

export function languageOption(lang: UiLanguage): LanguageOption {
  return uiLanguages.find((option) => option.id === lang) ?? uiLanguages[0];
}
