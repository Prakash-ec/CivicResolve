import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import enLocale from './locales/en.json';
import taLocale from './locales/ta.json';
import hiLocale from './locales/hi.json';
import teLocale from './locales/te.json';
import knLocale from './locales/kn.json';

// Helper to recursively flatten JSON locale tree
function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (typeof value === 'string') {
      result[fullKey] = value;
    }
  }
  return result;
}

const enFlat = flattenObject(enLocale as Record<string, any>);
const taFlat = flattenObject(taLocale as Record<string, any>);
const hiFlat = flattenObject(hiLocale as Record<string, any>);
const teFlat = flattenObject(teLocale as Record<string, any>);
const knFlat = flattenObject(knLocale as Record<string, any>);

// Build base dictionary from matching keys in all locales
function buildAutoDictionary(targetFlat: Record<string, string>): Record<string, string> {
  const dict: Record<string, string> = {};
  for (const [key, enText] of Object.entries(enFlat)) {
    const trimmedEn = enText.trim();
    const targetText = targetFlat[key]?.trim();
    if (trimmedEn && targetText) {
      dict[trimmedEn] = targetText;
    }
  }
  return dict;
}

// Supplementary domain phrases across landing, accountability, maps and administration
const SUPPLEMENTARY_PHRASES: Record<string, Record<string, string>> = {
  ta: {
    'Municipal Public Works Ledger': 'மாநகராட்சி பொதுப்பணி பதிவேடு',
    'Municipal Corporation Public Works Ledger': 'மாநகராட்சி பொதுப்பணி பதிவேடு',
    'Bitumen crater on Anna Salai Inner Lane': 'அண்ணா சாலை உட்புறப் பாதையில் பெரிய தார் பள்ளம்',
    'Pothole measuring 1.2m across near junction traffic signal. Assigned to Corporation Highway Division with 48h repair SLA.':
      'சந்திப்பு சிக்னல் அருகில் 1.2 மீ அகலமுள்ள சாலைக் குழி. 48 மணி நேர பழுதுபார்ப்பு இலக்குடன் நெடுஞ்சாலைப் பிரிவுக்கு ஒதுக்கப்பட்டுள்ளது.',
    'Highways & Drainage': 'நெடுஞ்சாலைகள் & வடிகால்',
    'High (Hazard score 75)': 'அதிகம் (ஆபத்து அளவு 75)',
    '42 residents verified': '42 குடியிருப்பாளர்கள் உறுதிசெய்துள்ளனர்',
    'Complaints filed': 'பதிவு செய்யப்பட்ட புகார்கள்',
    'Across 15 municipal zones': '15 நகராட்சி மண்டலங்களில்',
    'Resolved and verified': 'தீர்க்கப்பட்டு சரிபார்க்கப்பட்டது',
    'verified closure rate': 'உறுதிப்படுத்தப்பட்ட தீர்வு விகிதம்',
    'Field work in progress': 'களப் பணிகள் செயல்பாட்டில்',
    'Crews active on site': 'பணியாளர்கள் களத்தில் தீவிரமாக உள்ளனர்',
    'Participating citizens': 'பங்கேற்கும் பொதுமக்கள்',
    'utility credits issued': 'பயன்பாட்டு புள்ளிகள் வழங்கப்பட்டன',
    'Public Service Charter': 'பொது சேவை சாசனம்',
    'Direct municipal accountability through timestamped evidence': 'நேரடி நகராட்சி பொறுப்புடைமை',
    'Every reported road crater, severed electrical line, or sewage blockage is logged into a public ledger with fixed service-level targets and verifiable photographic records.':
      'ஒவ்வொரு புகாரும் புகைப்பட ஆதாரத்துடன் அதிகாரப்பூர்வ பொதுப் பதிவேட்டில் பதிவு செய்யப்படுகிறது.',
    'Immutable public audit trail': 'மாற்ற முடியாத பொது தணிக்கைத் தடம்',
    'Each status update is recorded with officer role and timestamp. Tickets cannot be closed without documentation.':
      'ஒவ்வொரு நிலை மாற்றமும் அதிகாரியின் பொறுப்பு மற்றும் கால முத்திரையுடன் பதிவு செய்யப்படுகிறது.',
    'Citizen verification lock': 'குடிமக்கள் சரிபார்ப்பு பூட்டு',
    'Resolution requires complainant sign-off or geotagged repair photo before the file is marked complete.':
      'புகார்தாரரின் ஒப்புதல் அல்லது களப் புகைப்பட ஆதாரம் இல்லாமல் புகார் முடிக்கப்படாது.',
    'Automated departmental routing': 'தானியங்கி துறை வழித்தடம்',
    'Photo evidence evaluates structural hazard severity and assigns tickets directly to the relevant municipal engineer.':
      'புகைப்பட ஆதாரம் ஆபத்தை மதிப்பீடு செய்து சம்பந்தப்பட்ட பொறியாளருக்கு நேரடியாக ஒதுக்குகிறது.',
    'Verified closed': 'உறுதிப்படுத்தப்பட்டு மூடப்பட்டது',
    'Assigned department': 'ஒதுக்கப்பட்ட துறை',
    'Highways & Road Maintenance': 'நெடுஞ்சாலை மற்றும் சாலை பராமரிப்பு',
    'Repair turnaround': 'பழுதுபார்க்கும் நேரம்',
    'Verification evidence': 'சரிபார்ப்பு சான்று',
    '2 on-site photos logged': '2 கள புகைப்படங்கள் பதிவு செய்யப்பட்டன',
    'Corporation Engineering Division, Zonal Office V': 'மாநகராட்சி பொறியியல் பிரிவு, மண்டல அலுவலகம் V',
    'Resolution pipeline': 'தீர்வு செயல்முறை',
    'Four documented milestones from initial report to verified closure.': 'நான்கு ஆவணப்படுத்தப்பட்ட மைல்கற்கள்.',
    'Documentation': 'ஆவணப்படுத்துதல்',
    'Citizen captures photo evidence and coordinates. Pre-submission checks verify nearby duplicates.':
      'புகைப்பட ஆதாரம் மற்றும் அமைவிடத்தை பதிவு செய்தல்.',
    'Triage & routing': 'வகைப்படுத்தல் & வழித்தடம்',
    'Defect category and life-safety score determine response urgency and departmental jurisdiction.':
      'பாதுகாப்பு மதிப்பெண் அவசரத்தை தீர்மானிக்கிறது.',
    'Crew deployment': 'பணியாளர்கள் அனுப்புதல்',
    'Zonal maintenance crews receive location markers and repair orders. Progress logged in public register.':
      'பராமரிப்புக் குழுக்கள் பணி ஆணைகளைப் பெறுகின்றன.',
    'Verified closure': 'உறுதிப்படுத்தப்பட்ட தீர்வு',
    'Before and after photographs recorded. Complainant confirms repair quality before ticket archiving.':
      'முன் மற்றும் பின் புகைப்படங்கள் பதிவு செய்யப்பட்டு பொதுமக்கள் தரம் உறுதி செய்கின்றனர்.',
    'Recent neighborhood grievances': 'சமீபத்திய பகுதி புகார்கள்',
    'Live register of citizen filings and field progress across city wards.': 'வார்டுகளில் பொதுமக்களின் புகார்கள் மற்றும் கள முன்னேற்றத்தின் நேரடி பதிவேடு.',
    'Zonal incident map': 'மண்டலப் புகார் வரைபடம்',
    'Geospatial clustering and active municipal maintenance zones. Automatically updates to your location.':
      'புவிசார் பகுப்பாய்வு மற்றும் பராமரிப்பு மண்டலங்கள்.',
    'Update Location': 'அமைவிடத்தைப் புதுப்பி',
    'Locate Me': 'என்னை கண்டறி',
    'Open full explorer': 'முழு வரைபடத்தை திற',
    'OPTIMAL': 'சிறப்பான நிலை',
    'MODERATE_LOAD': 'மிதமான பணிச்சுமை',
    'HIGH_LOAD': 'அதிக பணிச்சுமை',
    'CRITICAL_LOAD': 'அதிதீவிர சுமை',
    'Corporation Highway Division': 'மாநகராட்சி நெடுஞ்சாலைப் பிரிவு',
    'Health & Sanitation Division': 'சுகாதாரப் பிரிவு',
    'Electrical Engineering Division': 'மின்சார பொறியியல் பிரிவு',
    'Stormwater Drainage Division': 'மழைநீர் வடிகால் பிரிவு',
  },
  hi: {
    'Municipal Public Works Ledger': 'नगर निगम लोक निर्माण लेजर',
    'Municipal Corporation Public Works Ledger': 'नगर निगम लोक निर्माण लेजर',
    'Bitumen crater on Anna Salai Inner Lane': 'अन्ना सलाई इनर लेन पर सड़क में गहरा गड्ढा',
    'Pothole measuring 1.2m across near junction traffic signal. Assigned to Corporation Highway Division with 48h repair SLA.':
      'ट्रैफिक सिग्नल के पास 1.2 मीटर चौड़ा गड्ढा। 48 घंटे के मरम्मत SLA के साथ निगम राजमार्ग प्रभाग को सौंपा गया।',
    'Highways & Drainage': 'राजमार्ग एवं जल निकासी',
    'High (Hazard score 75)': 'उच्च (खतरा स्कोर 75)',
    '42 residents verified': '42 निवासियों ने सत्यापित किया',
    'Complaints filed': 'दर्ज की गई शिकायतें',
    'Across 15 municipal zones': '15 नगरपालिका क्षेत्रों में',
    'Resolved and verified': 'समाधान एवं सत्यापित',
    'verified closure rate': 'सत्यापित निवारण दर',
    'Field work in progress': 'फील्ड कार्य प्रगति पर',
    'Crews active on site': 'फील्ड टीम स्थल पर सक्रिय',
    'Participating citizens': 'सहभागी नागरिक',
    'utility credits issued': 'उपयोगिता क्रेडिट जारी',
    'Public Service Charter': 'नागरिक सेवा चार्टर',
    'Direct municipal accountability through timestamped evidence': 'समयबद्ध साक्ष्य के माध्यम से सीधी नगरपालिका जवाबदेही',
    'Every reported road crater, severed electrical line, or sewage blockage is logged into a public ledger with fixed service-level targets and verifiable photographic records.':
      'प्रत्येक रिपोर्ट की गई समस्या को निश्चित सेवा लक्ष्यों और फोटो साक्ष्यों के साथ सार्वजनिक लेजर में दर्ज किया जाता है।',
    'Immutable public audit trail': 'अपरिवर्तनीय सार्वजनिक ऑडिट ट्रेल',
    'Each status update is recorded with officer role and timestamp. Tickets cannot be closed without documentation.':
      'प्रत्येक स्थिति अद्यतन अधिकारी की भूमिका और टाइमस्टैम्प के साथ दर्ज किया जाता है।',
    'Citizen verification lock': 'नागरिक सत्यापन लॉक',
    'Resolution requires complainant sign-off or geotagged repair photo before the file is marked complete.':
      'समाधान के लिए शिकायतकर्ता की पुष्टि या जियोटैग की गई मरम्मत फोटो अनिवार्य है।',
    'Automated departmental routing': 'स्वचालित विभागीय रूटिंग',
    'Photo evidence evaluates structural hazard severity and assigns tickets directly to the relevant municipal engineer.':
      'फोटो साक्ष्य खतरे की गंभीरता का मूल्यांकन कर संबंधित नगर अभियंता को सौंपता है।',
    'Verified closed': 'सत्यापित समाधान',
    'Assigned department': 'आवंटित विभाग',
    'Highways & Road Maintenance': 'राजमार्ग एवं सड़क रखरखाव',
    'Repair turnaround': 'मरम्मत समय',
    'Verification evidence': 'सत्यापन साक्ष्य',
    '2 on-site photos logged': '2 ऑन-साइट फोटो दर्ज',
    'Corporation Engineering Division, Zonal Office V': 'निगम इंजीनियरिंग प्रभाग, क्षेत्रीय कार्यालय V',
    'Resolution pipeline': 'निवारण पाइपलाइन',
    'Four documented milestones from initial report to verified closure.': 'प्रारंभिक रिपोर्ट से सत्यापित समाधान तक चार प्रलेखित चरण।',
    'Documentation': 'दस्तावेज़ीकरण',
    'Citizen captures photo evidence and coordinates. Pre-submission checks verify nearby duplicates.':
      'नागरिक फोटो साक्ष्य और निर्देशांक दर्ज करते हैं।',
    'Triage & routing': 'वर्गीकरण एवं रूटिंग',
    'Defect category and life-safety score determine response urgency and departmental jurisdiction.':
      'समस्या की श्रेणी और सुरक्षा स्कोर तत्परता तय करते हैं।',
    'Crew deployment': 'टीम तैनाती',
    'Zonal maintenance crews receive location markers and repair orders. Progress logged in public register.':
      'क्षेत्रीय टीमों को मरम्मत आदेश मिलते हैं।',
    'Verified closure': 'सत्यापित समाधान',
    'Before and after photographs recorded. Complainant confirms repair quality before ticket archiving.':
      'पहले और बाद के फोटो रिकॉर्ड किए जाते हैं।',
    'Recent neighborhood grievances': 'आस-पड़ोस की हालिया समस्याएं',
    'Live register of citizen filings and field progress across city wards.': 'शहर के वार्डों में नागरिक शिकायतों और फील्ड प्रगति का लाइव रजिस्टर।',
    'Zonal incident map': 'क्षेत्रीय समस्या मानचित्र',
    'Geospatial clustering and active municipal maintenance zones. Automatically updates to your location.':
      'भू-स्थानिक क्लस्टरिंग और सक्रिय रखरखाव क्षेत्र।',
    'Update Location': 'स्थान अपडेट करें',
    'Locate Me': 'मेरी स्थिति खोजें',
    'Open full explorer': 'पूरा एक्सप्लोरर खोलें',
    'OPTIMAL': 'इष्टतम क्षमता',
    'MODERATE_LOAD': 'मध्यम भार',
    'HIGH_LOAD': 'अधिक भार',
    'CRITICAL_LOAD': 'गंभीर भार',
    'Corporation Highway Division': 'निगम राजमार्ग प्रभाग',
    'Health & Sanitation Division': 'स्वास्थ्य एवं स्वच्छता प्रभाग',
    'Electrical Engineering Division': 'विद्युत इंजीनियरिंग प्रभाग',
    'Stormwater Drainage Division': 'वर्षा जल निकासी प्रभाग',
  },
  te: {
    'Municipal Public Works Ledger': 'మునిసిపల్ పబ్లిక్ వర్క్స్ రిజిస్టర్',
    'Municipal Corporation Public Works Ledger': 'మున్సిపల్ కార్పొరేషన్ పబ్లిక్ వర్క్స్ లెడ్జర్',
    'Bitumen crater on Anna Salai Inner Lane': 'అన్నా సలై ఇన్నర్ లేన్‌లో తారు గుంత',
    'Pothole measuring 1.2m across near junction traffic signal. Assigned to Corporation Highway Division with 48h repair SLA.':
      'ట్రాఫిక్ సిగ్నల్ సమీపంలో 1.2 మీటర్ల గుంత. 48 గంటల పరిష్కార గడువుతో కార్పొరేషన్ హైవే విభాగానికి కేటాయించబడింది.',
    'Highways & Drainage': 'రహదారులు & డ్రైనేజీ',
    'High (Hazard score 75)': 'అధికం (ప్రమాద తీవ్రత 75)',
    '42 residents verified': '42 మంది పౌరులు ధృవీకరించారు',
    'Complaints filed': 'దాఖలైన ఫిర్యాదులు',
    'Across 15 municipal zones': '15 మునిసిపల్ జోన్లలో',
    'Resolved and verified': 'పరిష్కరించబడి ధృవీకరించబడినవి',
    'verified closure rate': 'ధృవీకరించబడిన పరిష్కార రేటు',
    'Field work in progress': 'ఫీల్డ్ పని పురోగతిలో ఉంది',
    'Crews active on site': 'సిబ్బంది సైట్‌లో పనిచేస్తున్నారు',
    'Participating citizens': 'పాల్గొంటున్న పౌరులు',
    'utility credits issued': 'యుటిలిటీ క్రెడిట్‌లు జారీ చేయబడ్డాయి',
    'Public Service Charter': 'ప్రజా సేవా చార్టర్',
    'Direct municipal accountability through timestamped evidence': 'టైమ్‌స్టాంప్ చేసిన సాక్ష్యాల ద్వారా ప్రత్యక్ష మునిసిపల్ జవాబుదారీతనం',
    'Every reported road crater, severed electrical line, or sewage blockage is logged into a public ledger with fixed service-level targets and verifiable photographic records.':
      'నమోదైన ప్రతి సమస్య కాలపరిమితి లక్ష్యాలు మరియు ఫోటో రుజువులతో పబ్లిక్ లెడ్జర్‌లో నమోదు చేయబడుతుంది.',
    'Immutable public audit trail': 'మార్చలేని పబ్లిక్ ఆడిట్ ట్రయల్',
    'Each status update is recorded with officer role and timestamp. Tickets cannot be closed without documentation.':
      'ప్రతి స్థితి మార్పు అధికారి వివరాలు మరియు టైమ్‌స్టాంప్‌తో నమోదు చేయబడుతుంది.',
    'Citizen verification lock': 'పౌర ధృవీకరణ లాక్',
    'Resolution requires complainant sign-off or geotagged repair photo before the file is marked complete.':
      'ఫిర్యాదుదారుని సంతకం లేదా జియోట్యాగ్ ఫోటో లేకుండా పనిని మూసివేయడం సాధ్యం కాదు.',
    'Automated departmental routing': 'స్వయంచాలక శాఖా మార్గదర్శకం',
    'Photo evidence evaluates structural hazard severity and assigns tickets directly to the relevant municipal engineer.':
      'ఫోటో సాక్ష్యం ప్రమాద తీవ్రతను అంచనా వేసి నేరుగా సంబంధిత మున్సిపల్ ఇంజనీర్‌కు కేటాయిస్తుంది.',
    'Verified closed': 'ధృవీకరించి మూసివేయబడింది',
    'Assigned department': 'కేటాయించిన శాఖ',
    'Highways & Road Maintenance': 'రహదారులు & రోడ్డు నిర్వహణ',
    'Repair turnaround': 'మరమ్మతు సమయం',
    'Verification evidence': 'ధృవీకరణ సాక్ష్యం',
    '2 on-site photos logged': '2 సైట్ ఫోటోలు నమోదు చేయబడ్డాయి',
    'Corporation Engineering Division, Zonal Office V': 'కార్పొరేషన్ ఇంజనీరింగ్ విభాగం, జోనల్ ఆఫీస్ V',
    'Resolution pipeline': 'పరిష్కార ప్రక్రియ',
    'Four documented milestones from initial report to verified closure.': 'ప్రారంభ నివేదిక నుండి ధృవీకరించబడిన ముగింపు వరకు నాలుగు దశలు.',
    'Documentation': 'డాక్యుమెంటేషన్',
    'Citizen captures photo evidence and coordinates. Pre-submission checks verify nearby duplicates.':
      'పౌరులు ఫోటో ఆధారాలు మరియు లొకేషన్‌ను సంగ్రహిస్తారు.',
    'Triage & routing': 'వర్గీకరణ & రూటింగ్',
    'Defect category and life-safety score determine response urgency and departmental jurisdiction.':
      'సమస్య తీవ్రత మరియు భద్రతా స్కోరు అత్యవసరతను నిర్ణయిస్తాయి.',
    'Crew deployment': 'సిబ్బంది మోహరింపు',
    'Zonal maintenance crews receive location markers and repair orders. Progress logged in public register.':
      'జోనల్ బృందాలు పని ఆదేశాలను అందుకుని మరమ్మతులు చేస్తాయి.',
    'Verified closure': 'ధృవీకరించబడిన పరిష్కారం',
    'Before and after photographs recorded. Complainant confirms repair quality before ticket archiving.':
      'మరమ్మతు నాణ్యతను ఫిర్యాదుదారు ధృవీకరించిన తర్వాతే రికార్డు పూర్తవుతుంది.',
    'Recent neighborhood grievances': 'ఇటీవలి పరిసర సమస్యలు',
    'Live register of citizen filings and field progress across city wards.': 'నగర వార్డులలో పౌరుల ఫిర్యాదులు మరియు క్షేత్ర పురోగతి యొక్క ప్రత్యక్ష రిజిస్టర్.',
    'Zonal incident map': 'జోనల్ సమస్యల మ్యాప్',
    'Geospatial clustering and active municipal maintenance zones. Automatically updates to your location.':
      'భౌగోళిక క్లస్టరింగ్ మరియు యాక్టివ్ మెయింటెనెన్స్ జోన్లు.',
    'Update Location': 'స్థానాన్ని అప్‌డేట్ చేయండి',
    'Locate Me': 'నన్ను గుర్తించండి',
    'Open full explorer': 'పూర్తి ఎక్స్‌ప్లోరర్‌ను తెరవండి',
    'OPTIMAL': 'ఆదర్శవంతమైన సామర్థ్యం',
    'MODERATE_LOAD': 'మితమైన లోడ్',
    'HIGH_LOAD': 'అధిక లోడ్',
    'CRITICAL_LOAD': 'తీవ్రమైన లోడ్',
    'Corporation Highway Division': 'కార్పొరేషన్ హైవే విభాగం',
    'Health & Sanitation Division': 'ఆరోగ్య & పారిశుద్ధ్య విభాగం',
    'Electrical Engineering Division': 'ఎలక్ట్రికల్ ఇంజనీరింగ్ విభాగం',
    'Stormwater Drainage Division': 'వర్షపు నీటి డ్రైనేజీ విభాగం',
  },
  kn: {
    'Municipal Public Works Ledger': 'ಪುರಸಭೆ ಲೋಕೋಪಯೋಗಿ ಲೆಡ್ಜರ್',
    'Municipal Corporation Public Works Ledger': 'ಮಹಾನಗರ ಪಾಲಿಕೆ ಲೋಕೋಪಯೋಗಿ ಲೆಡ್ಜರ್',
    'Bitumen crater on Anna Salai Inner Lane': 'ಅಣ್ಣಾ ಸಲೈ ಒಳ ರಸ್ತೆಯಲ್ಲಿ ತಾರು ಗುಂಡಿ',
    'Pothole measuring 1.2m across near junction traffic signal. Assigned to Corporation Highway Division with 48h repair SLA.':
      'ಟ್ರಾಫಿಕ್ ಸಿಗ್ನಲ್ ಬಳಿ 1.2 ಮೀಟರ್ ಅಗಲದ ಗುಂಡಿ. 48 ಗಂಟೆಗಳ ರಿಪೇರಿ ಗುರಿಯೊಂದಿಗೆ ಮಹಾನಗರ ಪಾಲಿಕೆ ಹೆದ್ದಾರಿ ವಿಭಾಗಕ್ಕೆ ನಿಯೋಜಿಸಲಾಗಿದೆ.',
    'Highways & Drainage': 'ಹೆದ್ದಾರಿಗಳು & ಒಳಚರಂಡಿ',
    'High (Hazard score 75)': 'ಹೆಚ್ಚು (ಅಪಾಯದ ಅಂಕ 75)',
    '42 residents verified': '42 ನಿವಾಸಿಗಳು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ',
    'Complaints filed': 'ದಾಖಲಾದ ದೂರುಗಳು',
    'Across 15 municipal zones': '15 ಪುರಸಭೆ ವಲಯಗಳಲ್ಲಿ',
    'Resolved and verified': 'ಪರಿಹರಿಸಲಾಗಿದೆ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    'verified closure rate': 'ಪರಿಶೀಲಿಸಿದ ಪರಿಹಾರ ದರ',
    'Field work in progress': 'ಕ್ಷೇತ್ರ ಕಾರ್ಯ ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    'Crews active on site': 'ಸಿಬ್ಬಂದಿ ಸ್ಥಳದಲ್ಲಿ ಸಕ್ರಿಯರಾಗಿದ್ದಾರೆ',
    'Participating citizens': 'ಭಾಗವಹಿಸುವ ನಾಗರಿಕರು',
    'utility credits issued': 'ಯುಟಿಲಿಟಿ ಕ್ರೆಡಿಟ್‌ಗಳನ್ನು ನೀಡಲಾಗಿದೆ',
    'Public Service Charter': 'ಸಾರ್ವಜನಿಕ ಸೇವಾ ಸನ್ನದು',
    'Direct municipal accountability through timestamped evidence': 'ಸಮಯ ಮುದ್ರೆ ಪುರಾವೆಯ ಮೂಲಕ ನೇರ ಪುರಸಭೆ ಹೊಣೆಗಾರಿಕೆ',
    'Every reported road crater, severed electrical line, or sewage blockage is logged into a public ledger with fixed service-level targets and verifiable photographic records.':
      'ಪ್ರತಿಯೊಂದು ದೂರು ನಿಗದಿತ ಸೇವಾ ಗುರಿಗಳು ಮತ್ತು ಫೋಟೋ ಪುರಾವೆಗಳೊಂದಿಗೆ ಅಧಿಕೃತ ಲೆಡ್ಜರ್‌ನಲ್ಲಿ ದಾಖಲಾಗುತ್ತದೆ.',
    'Immutable public audit trail': 'ಬದಲಾಯಿಸಲಾಗದ ಸಾರ್ವಜನಿಕ ಲೆಕ್ಕಪರಿಶೋಧನಾ ಹಾದಿ',
    'Each status update is recorded with officer role and timestamp. Tickets cannot be closed without documentation.':
      'ಪ್ರತಿಯೊಂದು ಸ್ಥಿತಿ ಬದಲಾವಣೆಯು ಅಧಿಕಾರಿಯ ವಿವರ ಮತ್ತು ಸಮಯ ಮುದ್ರೆಯೊಂದಿಗೆ ದಾಖಲಾಗುತ್ತದೆ.',
    'Citizen verification lock': 'ನಾಗರಿಕ ಪರಿಶೀಲನಾ ಲಾಕ್',
    'Resolution requires complainant sign-off or geotagged repair photo before the file is marked complete.':
      'ದೂರುದಾರರ ಒಪ್ಪಿಗೆ ಅಥವಾ ಜಿಯೋಟ್ಯಾಗ್ ಫೋಟೋ ಇಲ್ಲದೆ ದೂರು ಪೂರ್ಣಗೊಳ್ಳುವುದಿಲ್ಲ.',
    'Automated departmental routing': 'ಸ್ವಯಂಚಾಲಿತ ಇಲಾಖಾ ಮಾರ್ಗ',
    'Photo evidence evaluates structural hazard severity and assigns tickets directly to the relevant municipal engineer.':
      'ಫೋಟೋ ಪುರಾವೆ ಅಪಾಯವನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಿ ಸಂಬಂಧಿತ ಇಂಜಿನಿಯರ್‌ಗೆ ನೇರವಾಗಿ ನಿಯೋಜಿಸುತ್ತದೆ.',
    'Verified closed': 'ಪರಿಶೀಲಿಸಿ ಮುಕ್ತಾಯಗೊಳಿಸಲಾಗಿದೆ',
    'Assigned department': 'ನಿಯೋಜಿತ ಇಲಾಖೆ',
    'Highways & Road Maintenance': 'ಹೆದ್ದಾರಿ ಮತ್ತು ರಸ್ತೆ ನಿರ್ವಹಣೆ',
    'Repair turnaround': 'ದುರಸ್ತಿ ಸಮಯ',
    'Verification evidence': 'ಪರಿಶೀಲನೆ ಪುರಾವೆ',
    '2 on-site photos logged': '2 ಸೈಟ್ ಫೋಟೋಗಳು ದಾಖಲಾಗಿವೆ',
    'Corporation Engineering Division, Zonal Office V': 'ಪಾಲಿಕೆ ಎಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ, ವಲಯ ಕಚೇರಿ V',
    'Resolution pipeline': 'ಪರಿಹಾರ ಪ್ರಕ್ರಿಯೆ',
    'Four documented milestones from initial report to verified closure.': 'ಆರಂಭಿಕ ವರದಿಯಿಂದ ಹಿಡಿದು ಪರಿಶೀಲಿಸಿದ ಮುಕ್ತಾಯದವರೆಗೆ ನಾಲ್ಕು ಹಂತಗಳು.',
    'Documentation': 'ದಾಖಲಾತಿ',
    'Citizen captures photo evidence and coordinates. Pre-submission checks verify nearby duplicates.':
      'ನಾಗರಿಕರು ಫೋಟೋ ಪುರಾವೆ ಮತ್ತು ಸ್ಥಳವನ್ನು ದಾಖಲಿಸುತ್ತಾರೆ.',
    'Triage & routing': 'ವರ್ಗೀಕರಣ ಮತ್ತು ಮಾರ್ಗ',
    'Defect category and life-safety score determine response urgency and departmental jurisdiction.':
      'ಸುರಕ್ಷತಾ ಸ್ಕೋರ್ ಪ್ರತಿಕ್ರಿಯೆಯ ತುರ್ತುಸ್ಥಿತಿಯನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ.',
    'Crew deployment': 'ಸಿಬ್ಬಂದಿ ನಿಯೋಜನೆ',
    'Zonal maintenance crews receive location markers and repair orders. Progress logged in public register.':
      'ನಿರ್ವಹಣಾ ಸಿಬ್ಬಂದಿ ಕೆಲಸದ ಆದೇಶಗಳನ್ನು ಪಡೆಯುತ್ತಾರೆ.',
    'Verified closure': 'ಪರಿಶೀಲಿಸಿದ ಮುಕ್ತಾಯ',
    'Before and after photographs recorded. Complainant confirms repair quality before ticket archiving.':
      'ಮುಂಚಿನ ಮತ್ತು ನಂತರದ ಫೋಟೋಗಳನ್ನು ದಾಖಲಿಸಿ ಸಾರ್ವಜನಿಕರು ಗುಣಮಟ್ಟವನ್ನು ದೃಢೀಕರಿಸುತ್ತಾರೆ.',
    'Recent neighborhood grievances': 'ಇತ್ತೀಚಿನ ನೆರೆಹೊರೆಯ ದೂರುಗಳು',
    'Live register of citizen filings and field progress across city wards.': 'ನಗರದ ವಾರ್ಡ್‌ಗಳಲ್ಲಿ ನಾಗರಿಕ ದೂರುಗಳು ಮತ್ತು ಕ್ಷೇತ್ರ ಪ್ರಗತಿಯ ಲೈವ್ ನೋಂದಣಿ.',
    'Zonal incident map': 'ವಲಯ ಘಟನಾ ನಕ್ಷೆ',
    'Geospatial clustering and active municipal maintenance zones. Automatically updates to your location.':
      'ಭೌಗೋಳಿಕ ಕ್ಲಸ್ಟರಿಂಗ್ ಮತ್ತು ಸಕ್ರಿಯ ಪುರಸಭೆ ನಿರ್ವಹಣಾ ವಲಯಗಳು.',
    'Update Location': 'ಸ್ಥಳ ನವೀಕರಿಸಿ',
    'Locate Me': 'ನನ್ನನ್ನು ಗುರುತಿಸಿ',
    'Open full explorer': 'ಪೂರ್ಣ ಪರಿಶೋಧಕ ತೆರೆಯಿರಿ',
    'OPTIMAL': 'ಸೂಕ್ತ ಸಾಮರ್ಥ್ಯ',
    'MODERATE_LOAD': 'ಮಧ್ಯಮ ಕೆಲಸದ ಹೊರೆ',
    'HIGH_LOAD': 'ಹೆಚ್ಚಿನ ಕೆಲಸದ ಹೊರೆ',
    'CRITICAL_LOAD': 'ಗಂಭೀರ ಕೆಲಸದ ಹೊರೆ',
    'Corporation Highway Division': 'ಪಾಲಿಕೆ ಹೆದ್ದಾರಿ ವಿಭಾಗ',
    'Health & Sanitation Division': 'ಆರೋಗ್ಯ ಮತ್ತು ನೈರ್ಮಲ್ಯ ವಿಭಾಗ',
    'Electrical Engineering Division': 'ವಿದ್ಯುತ್ ಎಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ',
    'Stormwater Drainage Division': 'ಮಳೆನೀರು ಒಳಚರಂಡಿ ವಿಭಾಗ',
  },
};

// Complete combined phrase dictionary
export const PHRASE_DICTIONARY: Record<string, Record<string, string>> = {
  ta: { ...buildAutoDictionary(taFlat), ...SUPPLEMENTARY_PHRASES.ta },
  hi: { ...buildAutoDictionary(hiFlat), ...SUPPLEMENTARY_PHRASES.hi },
  te: { ...buildAutoDictionary(teFlat), ...SUPPLEMENTARY_PHRASES.te },
  kn: { ...buildAutoDictionary(knFlat), ...SUPPLEMENTARY_PHRASES.kn },
};

// Case-insensitive lookup cache for efficiency
const lowerCaseCache = new Map<string, Map<string, string>>();

function getCaseInsensitive(dict: Record<string, string>, targetLang: string, key: string): string | undefined {
  let cache = lowerCaseCache.get(targetLang);
  if (!cache) {
    cache = new Map();
    for (const [k, v] of Object.entries(dict)) {
      cache.set(k.toLowerCase().trim(), v);
    }
    lowerCaseCache.set(targetLang, cache);
  }
  return cache.get(key.toLowerCase().trim());
}

/**
 * Translates a single text string based on active regional language.
 */
export function translateText(text: string, targetLang: string): string {
  if (!text || targetLang === 'en') return text;
  const langDict = PHRASE_DICTIONARY[targetLang];
  if (!langDict) return text;

  const trimmed = text.trim();
  if (!trimmed) return text;

  const leadingWs = text.match(/^\s*/)?.[0] || '';
  const trailingWs = text.match(/\s*$/)?.[0] || '';

  // 1. Direct match
  if (langDict[trimmed]) {
    return `${leadingWs}${langDict[trimmed]}${trailingWs}`;
  }

  // 2. Case-insensitive / normalized match
  const ciMatch = getCaseInsensitive(langDict, targetLang, trimmed);
  if (ciMatch) {
    return `${leadingWs}${ciMatch}${trailingWs}`;
  }

  // 3. Indian / Global Date strings: e.g. 'Saturday, 21 Nov 2026' or '21 Nov 2026'
  const dateRegex = /^(?:(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*)?(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})$/i;
  const dateMatch = trimmed.match(dateRegex);
  if (dateMatch) {
    try {
      const parsedDate = new Date(trimmed);
      if (!isNaN(parsedDate.getTime())) {
        const localeMap: Record<string, string> = {
          ta: 'ta-IN',
          hi: 'hi-IN',
          te: 'te-IN',
          kn: 'kn-IN',
        };
        const loc = localeMap[targetLang] || 'en-IN';
        const formatted = parsedDate.toLocaleDateString(loc, {
          weekday: dateMatch[1] ? 'long' : undefined,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        return `${leadingWs}${formatted}${trailingWs}`;
      }
    } catch {
      // Fall through if date parsing fails
    }
  }

  // 4. Ward Number: e.g. 'Ward 114' or 'Ward 50'
  const wardRegex = /^Ward\s+(\d+)(.*)$/i;
  const wardMatch = trimmed.match(wardRegex);
  if (wardMatch) {
    const num = wardMatch[1];
    const rest = wardMatch[2] || '';
    const wardWords: Record<string, string> = {
      ta: 'வார்டு',
      hi: 'वार्ड',
      te: 'వార్డు',
      kn: 'ವಾರ್ಡ್',
    };
    const wWord = wardWords[targetLang] || 'Ward';
    return `${leadingWs}${wWord} ${num}${rest}${trailingWs}`;
  }

  // 5. Timestamps: 'Logged: 2 hours ago' or '2 hours ago'
  const timeAgoRegex = /^(?:Logged:\s*)?(\d+)\s+(hours?|minutes?|days?|seconds?)\s+ago$/i;
  const timeMatch = trimmed.match(timeAgoRegex);
  if (timeMatch) {
    const n = timeMatch[1];
    const unit = timeMatch[2].toLowerCase();
    const hasLogged = trimmed.toLowerCase().startsWith('logged');

    const unitMap: Record<string, Record<string, string>> = {
      te: { hour: 'గంటల', minute: 'నిమిషాల', day: 'రోజుల', second: 'సెకన్ల' },
      ta: { hour: 'மணி நேரத்திற்கு', minute: 'நிமிடங்களுக்கு', day: 'நாட்களுக்கு', second: 'விநாடிகளுக்கு' },
      hi: { hour: 'घंटे', minute: 'मिनट', day: 'दिन', second: 'सेकंड' },
      kn: { hour: 'ಗಂಟೆಗಳ', minute: 'ನಿಮಿಷಗಳ', day: 'ದಿನಗಳ', second: 'ಸೆಕೆಂಡುಗಳ' },
    };

    const baseUnit = unit.startsWith('hour') ? 'hour' : unit.startsWith('minute') ? 'minute' : unit.startsWith('day') ? 'day' : 'second';
    const locUnit = unitMap[targetLang]?.[baseUnit] || unit;

    const templates: Record<string, string> = {
      te: hasLogged ? `నమోదైంది: ${n} ${locUnit} క్రితం` : `${n} ${locUnit} క్రితం`,
      ta: hasLogged ? `பதிவு செய்யப்பட்டது: ${n} ${locUnit} முன்` : `${n} ${locUnit} முன்`,
      hi: hasLogged ? `दर्ज: ${n} ${locUnit} पहले` : `${n} ${locUnit} पहले`,
      kn: hasLogged ? `ದಾಖಲಾಗಿದೆ: ${n} ${locUnit} ಹಿಂದೆ` : `${n} ${locUnit} ಹಿಂದೆ`,
    };

    if (templates[targetLang]) {
      return `${leadingWs}${templates[targetLang]}${trailingWs}`;
    }
  }

  // 6. Community Verifications: '42 residents verified'
  const verifiedRegex = /^(\d+)\s+residents?\s+verified$/i;
  const verifiedMatch = trimmed.match(verifiedRegex);
  if (verifiedMatch) {
    const n = verifiedMatch[1];
    const templates: Record<string, string> = {
      te: `${n} మంది పౌరులు ధృవీకరించారు`,
      ta: `${n} குடியிருப்பாளர்கள் உறுதிசெய்துள்ளனர்`,
      hi: `${n} निवासियों ने सत्यापित किया`,
      kn: `${n} ನಿವಾಸಿಗಳು ಪರಿಶೀಲಿಸಿದ್ದಾರೆ`,
    };
    if (templates[targetLang]) {
      return `${leadingWs}${templates[targetLang]}${trailingWs}`;
    }
  }

  // 7. Votes: '42 votes' or '1 vote'
  const votesMatch = trimmed.match(/^(\d+)\s+votes?$/i);
  if (votesMatch) {
    const count = votesMatch[1];
    const votesWord: Record<string, string> = {
      te: 'ఓట్లు',
      ta: 'வாக்குகள்',
      hi: 'वोट',
      kn: 'ಮತಗಳು',
    };
    const vWord = votesWord[targetLang] || 'votes';
    return `${leadingWs}${count} ${vWord}${trailingWs}`;
  }

  // 8. Open / Completed / Overdue: '12 open', '45 completed', '2 overdue'
  const countStatusMatch = trimmed.match(/^(\d+)\s+(open|completed|overdue)$/i);
  if (countStatusMatch) {
    const count = countStatusMatch[1];
    const st = countStatusMatch[2].toLowerCase();
    const statusMap: Record<string, Record<string, string>> = {
      te: { open: 'తెరిచి ఉన్నాయి', completed: 'పూర్తయింది', overdue: 'గడువు మించినవి' },
      ta: { open: 'நிலுவையில்', completed: 'முடிக்கப்பட்டது', overdue: 'காலாவதியானது' },
      hi: { open: 'खुले हैं', completed: 'पूरे हुए', overdue: 'समय सीमा पार' },
      kn: { open: 'ಬಾಕಿ ಇವೆ', completed: 'ಪೂರ್ಣಗೊಂಡಿದೆ', overdue: 'ಮೀರಿದ ದೂರುಗಳು' },
    };
    const locStatus = statusMap[targetLang]?.[st] || st;
    return `${leadingWs}${count} ${locStatus}${trailingWs}`;
  }

  // 9. Elevated / Moderate / Low Risk: 'Elevated Risk'
  const riskMatch = trimmed.match(/^(Elevated|Moderate|Low)\s+Risk$/i);
  if (riskMatch) {
    const level = riskMatch[1].toLowerCase();
    const riskMap: Record<string, Record<string, string>> = {
      te: { elevated: 'ఎక్కువ రిస్క్', moderate: 'మితమైన రిస్క్', low: 'తక్కువ రిస్క్' },
      ta: { elevated: 'அதிக ஆபத்து', moderate: 'மிதமான ஆபத்து', low: 'குறைந்த ஆபத்து' },
      hi: { elevated: 'उच्च जोखिम', moderate: 'मध्यम जोखिम', low: 'कम जोखिम' },
      kn: { elevated: 'ಹೆಚ್ಚಿನ ಅಪಾಯ', moderate: 'ಮಧ್ಯಮ ಅಪಾಯ', low: 'ಕಡಿಮೆ ಅಪಾಯ' },
    };
    const locRisk = riskMap[targetLang]?.[level];
    if (locRisk) {
      return `${leadingWs}${locRisk}${trailingWs}`;
    }
  }

  // 10. Hazard score: 'High (Hazard score 75)'
  const hazardMatch = trimmed.match(/^(High|Medium|Low|Critical)\s*\(Hazard score\s*(\d+)\)$/i);
  if (hazardMatch) {
    const pri = hazardMatch[1].toLowerCase();
    const score = hazardMatch[2];
    const priMap: Record<string, Record<string, string>> = {
      te: { high: 'అధికం', medium: 'మధ్యస్థం', low: 'తక్కువ', critical: 'తీవ్రం' },
      ta: { high: 'அதிகம்', medium: 'நடுத்தரம்', low: 'குறைவு', critical: 'அதிதீவிரம்' },
      hi: { high: 'उच्च', medium: 'मध्यम', low: 'कम', critical: 'गंभीर' },
      kn: { high: 'ಹೆಚ್ಚು', medium: 'ಮಧ್ಯಮ', low: 'ಕಡಿಮೆ', critical: 'ಗಂಭೀರ' },
    };
    const scoreWord: Record<string, string> = {
      te: 'ప్రమాద తీవ్రత',
      ta: 'ஆபத்து அளவு',
      hi: 'खतरा स्कोर',
      kn: 'ಅಪಾಯದ ಅಂಕ',
    };
    const pStr = priMap[targetLang]?.[pri] || hazardMatch[1];
    const sStr = scoreWord[targetLang] || 'Hazard score';
    return `${leadingWs}${pStr} (${sStr} ${score})${trailingWs}`;
  }

  // 11. Count pattern like 'All (5)', 'Reported (2)', 'Critical (85)'
  const countPattern = /^([A-Za-z\s&]+)\s*\((\d+)\)$/;
  const countMatch = trimmed.match(countPattern);
  if (countMatch) {
    const baseWord = countMatch[1].trim();
    const count = countMatch[2];
    const trans = langDict[baseWord] || getCaseInsensitive(langDict, targetLang, baseWord);
    if (trans) {
      return `${leadingWs}${trans} (${count})${trailingWs}`;
    }
  }

  // 12. Turnaround: '28 hours (SLA target: 48 hours)'
  const slaTurnMatch = trimmed.match(/^(\d+)\s*hours?\s*\(SLA target:\s*(\d+)\s*hours?\)$/i);
  if (slaTurnMatch) {
    const actual = slaTurnMatch[1];
    const target = slaTurnMatch[2];
    const templates: Record<string, string> = {
      te: `${actual} గంటలు (SLA లక్ష్యం: ${target} గంటలు)`,
      ta: `${actual} மணிநேரம் (SLA இலக்கு: ${target} மணிநேரம்)`,
      hi: `${actual} घंटे (SLA लक्ष्य: ${target} घंटे)`,
      kn: `${actual} ಗಂಟೆಗಳು (SLA ಗುರಿ: ${target} ಗಂಟೆಗಳು)`,
    };
    if (templates[targetLang]) {
      return `${leadingWs}${templates[targetLang]}${trailingWs}`;
    }
  }

  // 13. '2 on-site photos logged'
  const photoLogMatch = trimmed.match(/^(\d+)\s+on-site\s+photos?\s+logged$/i);
  if (photoLogMatch) {
    const count = photoLogMatch[1];
    const templates: Record<string, string> = {
      te: `${count} సైట్ ఫోటోలు నమోదు చేయబడ్డాయి`,
      ta: `${count} கள புகைப்படங்கள் பதிவு செய்யப்பட்டன`,
      hi: `${count} ऑन-साइट फोटो दर्ज`,
      kn: `${count} ಸೈಟ್ ಫೋಟೋಗಳು ದಾಖಲಾಗಿವೆ`,
    };
    if (templates[targetLang]) {
      return `${leadingWs}${templates[targetLang]}${trailingWs}`;
    }
  }

  // 14. Stage N
  const stageMatch = trimmed.match(/^Stage\s+(\d+)$/i);
  if (stageMatch) {
    const stg = stageMatch[1];
    const stgWords: Record<string, string> = {
      te: 'దశ',
      ta: 'நிலை',
      hi: 'चरण',
      kn: 'ಹಂತ',
    };
    const sWord = stgWords[targetLang] || 'Stage';
    return `${leadingWs}${sWord} ${stg}${trailingWs}`;
  }

  return text;
}

// Stores original text values to prevent destructive mutations
const originalTextNodes = new WeakMap<Node, string>();
const originalAttrs = new WeakMap<Element, Record<string, string>>();

/**
 * Scans and translates DOM text nodes, input placeholders, and aria labels.
 */
export function applyDomTranslations(container: Node, targetLang: string): void {
  if (!container || typeof document === 'undefined') return;

  const isEnglish = targetLang === 'en';
  const langDict = !isEnglish ? PHRASE_DICTIONARY[targetLang] : null;

  // 1. Walk Text Nodes
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        // Skip script, style, and code tags
        const parentTag = node.parentElement?.tagName;
        if (parentTag === 'SCRIPT' || parentTag === 'STYLE' || parentTag === 'CODE') {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.nodeValue || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_SKIP;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodesToUpdate: Node[] = [];
  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodesToUpdate.push(currentNode);
    currentNode = walker.nextNode();
  }

  for (const node of textNodesToUpdate) {
    let original = originalTextNodes.get(node);
    if (original === undefined) {
      original = node.nodeValue || '';
      originalTextNodes.set(node, original);
    }

    if (isEnglish) {
      if (node.nodeValue !== original) {
        node.nodeValue = original;
      }
    } else if (langDict) {
      const translated = translateText(original, targetLang);
      if (translated && node.nodeValue !== translated) {
        node.nodeValue = translated;
      }
    }
  }

  // 2. Translate Input / Textarea Placeholders and Titles
  const elementRoot = container instanceof Element ? container : document.body;
  const elements = elementRoot.querySelectorAll('input[placeholder], textarea[placeholder], button[title], [aria-label]');

  elements.forEach((el) => {
    let attrs = originalAttrs.get(el);
    if (!attrs) {
      attrs = {
        placeholder: el.getAttribute('placeholder') || '',
        title: el.getAttribute('title') || '',
        ariaLabel: el.getAttribute('aria-label') || '',
      };
      originalAttrs.set(el, attrs);
    }

    if (isEnglish) {
      if (attrs.placeholder) el.setAttribute('placeholder', attrs.placeholder);
      if (attrs.title) el.setAttribute('title', attrs.title);
      if (attrs.ariaLabel) el.setAttribute('aria-label', attrs.ariaLabel);
    } else if (langDict) {
      if (attrs.placeholder) {
        const trans = translateText(attrs.placeholder, targetLang);
        if (trans) el.setAttribute('placeholder', trans);
      }
      if (attrs.title) {
        const trans = translateText(attrs.title, targetLang);
        if (trans) el.setAttribute('title', trans);
      }
      if (attrs.ariaLabel) {
        const trans = translateText(attrs.ariaLabel, targetLang);
        if (trans) el.setAttribute('aria-label', trans);
      }
    }
  });
}

/**
 * React Component mounted in MainLayout to keep all pages synced to the chosen language.
 */
export const LanguageSynchronizer: React.FC = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const observerRef = useRef<MutationObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  const activeLang = (i18n.language || 'en').split('-')[0];

  useEffect(() => {
    const triggerTranslation = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        applyDomTranslations(document.body, activeLang);
      });
    };

    // Run on initial mount and route transition
    triggerTranslation();

    // Listen to custom language events
    const handleLangEvent = (e: any) => {
      const newLang = e.detail || activeLang;
      applyDomTranslations(document.body, newLang);
    };

    window.addEventListener('civicresolve_lang_changed', handleLangEvent);

    // Setup MutationObserver to translate async content & page updates
    observerRef.current = new MutationObserver(() => {
      triggerTranslation();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      window.removeEventListener('civicresolve_lang_changed', handleLangEvent);
      if (observerRef.current) observerRef.current.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [activeLang, location.pathname]);

  return null;
};
