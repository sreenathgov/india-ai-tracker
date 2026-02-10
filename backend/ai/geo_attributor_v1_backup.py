"""
Geographic Attribution Module - ROBUST IMPLEMENTATION

Every ingested item must be attributable to at least one of:
- One or more Indian States
- India at the national level

ATTRIBUTION STRATEGY (in order):
1. SOURCE-LEVEL RULES (geo_mode):
   - force: Always assign this state (e.g., TN govt website = always TN)
   - default: Use source state as fallback if no explicit location found
   - strict: Only use source state if content explicitly mentions it

2. CONTENT ANALYSIS (multi-layer):
   - Layer 1: Explicit state/city names in headline (highest priority)
   - Layer 2: Indian company headquarters mapping
   - Layer 3: Known institutions/landmarks
   - Layer 4: Explicit state/city names in content
   - Layer 5: LLM attribution for ambiguous cases

3. NATIONAL vs STATE:
   - If article mentions multiple states, assign to all
   - If article is pan-India/national scope, assign to 'IN'
   - If no location found and no source fallback, assign to 'IN'

Design Philosophy:
- Accurate geographic placement is CRITICAL for the map
- State-specific sources should strongly bias toward that state
- Company HQs provide strong geographic signals
- Default to 'IN' (All India) if genuinely national or ambiguous
"""

import os
import re
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from groq import Groq


class GeoAttributor:
    """Attributes articles to Indian states based on content analysis."""

    # ==================== COMPANY HQ MAPPINGS ====================
    # Major Indian companies mapped to their headquarters state
    # Includes AI/ML companies, tech giants, and industry associations
    COMPANY_HQ_MAP = {
        # Tamil Nadu (Chennai) - AI/Tech Companies
        'zoho': 'TN', 'freshworks': 'TN', 'chargebee': 'TN',
        'kissflow': 'TN', 'kovai.co': 'TN', 'facilio': 'TN',
        'mad street den': 'TN', 'vue.ai': 'TN',
        'crayon data': 'TN', 'active.ai': 'TN', 'dataweave': 'TN',
        'perfios': 'TN', 'pi ventures': 'TN', 'uniphore': 'TN', 'tredence': 'TN',
        'hyperverge': 'TN', 'guvi': 'TN', 'great learning': 'TN',
        'indium software': 'TN', 'latentview': 'TN', 'aspire systems': 'TN',
        'payoda': 'TN', 'maarga systems': 'TN', 'ideas2it': 'TN',
        # TN Traditional/Infrastructure
        'tn government': 'TN', 'tamil nadu government': 'TN',
        'ashok leyland': 'TN', 'tvs': 'TN', 'murugappa': 'TN',
        'sify': 'TN', 'ramco': 'TN', 'intellect design': 'TN',
        'sundaram': 'TN', 'tube investments': 'TN',

        # Karnataka (Bangalore) - AI/Tech Companies
        'infosys': 'KA', 'wipro': 'KA', 'flipkart': 'KA',
        'swiggy': 'KA', 'razorpay': 'KA', 'zerodha': 'KA',
        'cred': 'KA', 'meesho': 'KA', 'ninjacart': 'KA',
        'udaan': 'KA', 'mindtree': 'KA', 'mphasis': 'KA',
        # AI-Specific Bangalore
        'mu sigma': 'KA', 'sigmoid': 'KA', 'manthan': 'KA',
        'sociolla': 'KA', 'fractal': 'KA', 'tigergraph': 'KA',
        'hasura': 'KA', 'suki.ai': 'KA', 'signzy': 'KA',
        'karza': 'KA', 'locus': 'KA', 'observe.ai': 'KA',
        'scribble data': 'KA', 'artivatic': 'KA', 'infeedo': 'KA',
        'mygate': 'KA', 'niramai': 'KA', 'sigtuple': 'KA',
        'belong.co': 'KA', 'hevo data': 'KA', 'detect technologies': 'KA',
        'mfine': 'KA', 'portea': 'KA', 'practo': 'KA',
        'juspay': 'KA', 'smallcase': 'KA', 'simpl': 'KA',
        'zetwerk': 'KA', 'dunzo': 'KA', 'rapido': 'KA',
        # KA Traditional/Infrastructure
        'biocon': 'KA', 'brigade': 'KA', 'prestige': 'KA',
        'walmart labs': 'KA', 'amazon development': 'KA',
        'isro': 'KA', 'isro headquarters': 'KA',
        'microsoft india': 'KA', 'google india': 'KA', 'oracle india': 'KA',
        'intel india': 'KA', 'nvidia india': 'KA', 'qualcomm india': 'KA',

        # Maharashtra (Mumbai/Pune) - AI/Tech Companies
        'tcs': 'MH', 'tata consultancy': 'MH', 'tata': 'MH',
        'reliance': 'MH', 'jio': 'MH', 'tech mahindra': 'MH',
        'persistent': 'MH', 'zensar': 'MH',
        # AI-Specific Mumbai/Pune
        'fractal analytics': 'MH', 'absolutdata': 'MH', 'bridgei2i': 'MH',
        'quantiphi': 'MH', 'abinitio': 'MH',
        'icertis': 'MH', 'druva': 'MH', 'pubmatic': 'MH',
        'firstsource': 'MH', 'mastek': 'MH', 'cybage': 'MH',
        'e-zest': 'MH', 'softcell': 'MH', 'harbinger': 'MH',
        'ugam': 'MH', 'clarisights': 'MH', 'rupeek': 'MH',
        'credgenics': 'MH', 'signdesk': 'MH', 'lendingkart': 'MH',
        # MH Traditional/Finance
        'mahindra': 'MH', 'l&t': 'MH', 'larsen': 'MH',
        'hdfc': 'MH', 'icici': 'MH', 'kotak': 'MH', 'axis bank': 'MH',
        'nykaa': 'MH', 'mamaearth': 'MH',
        'godrej': 'MH', 'tifr': 'MH', 'bse': 'MH', 'nse': 'MH',
        'crisil': 'MH', 'care ratings': 'MH',

        # Telangana (Hyderabad) - AI/Tech Companies
        'krutrim': 'TG', 'sarvam': 'TG', 'sarvam ai': 'TG',
        'qure.ai': 'TG', 'cyient': 'TG',
        # AI-Specific Hyderabad
        'openai hyderabad': 'TG', 'sprinklr india': 'TG',
        'virtusa': 'TG', 'infosys bpm': 'TG', 'genpact india': 'TG',
        'deloitte india': 'TG', 'kony': 'TG', 'broadridge': 'TG',
        'pegasystems india': 'TG', 'salesforce india': 'TG',
        'darwinbox': 'TG', 'atomberg': 'TG', 'skyroot': 'TG',
        'khatabook': 'TG', 'purplle': 'TG', 'gupshup': 'TG',
        'we work india': 'TG', 'amazon hyderabad': 'TG',
        # TG Traditional/Pharma
        'icrisat': 'TG', 'dr reddy': 'TG', 'hetero': 'TG',
        'cyberabad': 'TG', 'hitec city': 'TG',
        'genome valley': 'TG', 'tsic': 'TG',

        # Delhi NCR (Delhi/Gurgaon/Noida) - AI/Tech Companies
        'paytm': 'DL', 'ola': 'DL',
        'hcl': 'DL', 'hcl tech': 'DL', 'hcltech': 'DL', 'airtel': 'DL',
        'bharti': 'DL', 'makemytrip': 'DL', 'policybazaar': 'DL',
        'lenskart': 'DL', 'byjus': 'DL', 'unacademy': 'DL',
        'snapdeal': 'DL', 'delhivery': 'DL',
        # AI-Specific NCR
        'sprinklr': 'DL', 'eightfold': 'DL', 'ninjacart': 'DL',
        'urban company': 'DL', 'urbanclap': 'DL', 'cars24': 'DL',
        'droom': 'DL', 'spinny': 'DL', 'dealshare': 'DL',
        'vedantu': 'DL', 'toppr': 'DL', 'classplus': 'DL',
        'healthkart': 'DL', 'pharmeasy': 'DL', 'netmeds': 'DL',
        'rivigo': 'DL', 'blackbuck': 'DL', 'loadshare': 'DL',
        'moglix': 'DL', 'infra.market': 'DL', 'officespacey': 'DL',
        'innovaccer': 'DL', 'recko': 'DL', 'finbox': 'DL',
        'clevertap': 'DL', 'webengage': 'DL', 'moengage': 'DL',
        # NOTE: Central govt bodies (NITI Aayog, MeitY, DRDO, etc.) and industry
        # associations (NASSCOM, CII, FICCI) are NOT mapped to Delhi because their
        # announcements are typically national in scope, not Delhi-specific.
        # They are handled separately in CENTRAL_BODIES below.

        # Gujarat - AI/Tech Companies
        'adani': 'GJ', 'gift city': 'GJ',
        'infibeam': 'GJ', 'torrent': 'GJ', 'zydus': 'GJ',
        'nirma': 'GJ', 'amul': 'GJ', 'cadila': 'GJ',

        # West Bengal - AI/Tech Companies
        'tata steel': 'WB', 'itc': 'WB',
        'hindalco': 'WB', 'coal india': 'WB',
        'techno india': 'WB', 'webel': 'WB',

        # Kerala - AI/Tech Companies
        'ust global': 'KL', 'ust': 'KL', 'infosys kochi': 'KL',
        'tcs thiruvananthapuram': 'KL', 'wipro kochi': 'KL',
        'qburst': 'KL', 'poornam': 'KL', 'fingent': 'KL',
        'experion': 'KL', 'beyond key': 'KL', 'techversant': 'KL',
        'kspace': 'KL', 'ksitil': 'KL',

        # Rajasthan - Tech Companies
        'genpact jaipur': 'RJ', 'infosys jaipur': 'RJ',
        'jda software': 'RJ', 'blue star': 'RJ',

        # Uttar Pradesh - Tech Companies
        'hcl noida': 'UP', 'hcl lucknow': 'UP',
        'infosys noida': 'UP', 'wipro noida': 'UP',
        'paytm noida': 'UP',

        # Punjab/Chandigarh
        'infosys chandigarh': 'PB', 'quark': 'PB',
        'netsmartz': 'PB', 'chdtech': 'PB',

        # Odisha
        'infosys bhubaneswar': 'OD', 'tcs bhubaneswar': 'OD',
        'mindfire': 'OD', 'mindfire solutions': 'OD',
    }

    # ==================== CITY TO STATE MAPPING ====================
    # Includes Tier 1, Tier 2, and Tier 3 cities plus tech hubs and neighborhoods
    CITY_STATE_MAP = {
        # Tamil Nadu - Major Cities
        'chennai': 'TN', 'madras': 'TN', 'coimbatore': 'TN', 'madurai': 'TN',
        'tiruchirappalli': 'TN', 'trichy': 'TN', 'salem': 'TN', 'tirunelveli': 'TN',
        'tiruppur': 'TN', 'vellore': 'TN', 'erode': 'TN', 'thoothukudi': 'TN',
        'dindigul': 'TN', 'thanjavur': 'TN', 'kanchipuram': 'TN',
        # TN - Tier 2/3 Cities
        'hosur': 'TN', 'ooty': 'TN', 'kodaikanal': 'TN',
        'nagercoil': 'TN', 'karur': 'TN', 'cuddalore': 'TN', 'ambur': 'TN',
        'sivakasi': 'TN', 'kumbakonam': 'TN', 'rajapalayam': 'TN',
        'pollachi': 'TN', 'nagapattinam': 'TN', 'namakkal': 'TN',
        'virudhunagar': 'TN', 'tiruvallur': 'TN', 'villupuram': 'TN',
        'krishnagiri': 'TN', 'dharmapuri': 'TN', 'perambalur': 'TN',
        'ariyalur': 'TN', 'theni': 'TN', 'pudukkottai': 'TN', 'ranipet': 'TN',
        'tiruvannamalai': 'TN', 'tenkasi': 'TN', 'tuticorin': 'TN',
        # TN - Chennai Tech Areas
        'sholinganallur': 'TN', 'taramani': 'TN', 'guindy': 'TN',
        'tidel park': 'TN', 'sipcot': 'TN', 'siruseri': 'TN',
        'perungudi': 'TN', 'thoraipakkam': 'TN', 'omr': 'TN',
        'velachery': 'TN', 'adyar': 'TN', 'anna nagar': 'TN',
        't nagar': 'TN', 'ambattur': 'TN', 'porur': 'TN',
        'mahindra city': 'TN', 'sriperumbudur': 'TN', 'oragadam': 'TN',

        # Karnataka - Major Cities
        'bengaluru': 'KA', 'bangalore': 'KA', 'mysuru': 'KA', 'mysore': 'KA',
        'hubli': 'KA', 'mangaluru': 'KA', 'mangalore': 'KA', 'belgaum': 'KA',
        'belagavi': 'KA', 'gulbarga': 'KA', 'davanagere': 'KA', 'bellary': 'KA',
        'tumkur': 'KA', 'shimoga': 'KA', 'udupi': 'KA', 'dharwad': 'KA',
        'hassan': 'KA', 'bijapur': 'KA', 'raichur': 'KA', 'chitradurga': 'KA',
        # KA - Tier 2/3 Cities
        'hubballi': 'KA', 'davangere': 'KA', 'ballari': 'KA', 'tumakuru': 'KA',
        'shivamogga': 'KA', 'bidar': 'KA', 'gadag': 'KA', 'bagalkot': 'KA',
        'chikmagalur': 'KA', 'kolar': 'KA', 'mandya': 'KA', 'chamarajanagar': 'KA',
        'koppal': 'KA', 'haveri': 'KA', 'kodagu': 'KA', 'coorg': 'KA',
        'yadgir': 'KA', 'chikkaballapur': 'KA', 'ramanagara': 'KA',
        # KA - Bangalore Tech Hubs
        'whitefield': 'KA', 'electronic city': 'KA', 'manyata': 'KA',
        'koramangala': 'KA', 'indiranagar': 'KA', 'jayanagar': 'KA',
        'hebbal': 'KA', 'marathahalli': 'KA', 'bellandur': 'KA',
        'outer ring road': 'KA', 'sarjapur': 'KA', 'hsr layout': 'KA',
        'btm layout': 'KA', 'jp nagar': 'KA', 'bannerghatta': 'KA',
        'yelahanka': 'KA', 'kr puram': 'KA', 'ecospace': 'KA',
        'embassy tech village': 'KA', 'bagmane': 'KA', 'prestige tech park': 'KA',

        # Maharashtra - Major Cities
        'mumbai': 'MH', 'bombay': 'MH', 'pune': 'MH', 'nagpur': 'MH',
        'thane': 'MH', 'nashik': 'MH', 'aurangabad': 'MH', 'solapur': 'MH',
        'kolhapur': 'MH', 'navi mumbai': 'MH', 'sangli': 'MH', 'amravati': 'MH',
        'akola': 'MH', 'latur': 'MH', 'dhule': 'MH', 'ahmednagar': 'MH',
        'chandrapur': 'MH', 'parbhani': 'MH', 'jalgaon': 'MH', 'bhiwandi': 'MH',
        'satara': 'MH', 'ratnagiri': 'MH', 'wardha': 'MH',
        # MH - Tier 2/3 Cities
        'chhatrapati sambhajinagar': 'MH', 'nanded': 'MH', 'yavatmal': 'MH',
        'gondia': 'MH', 'bhandara': 'MH', 'buldhana': 'MH', 'washim': 'MH',
        'hingoli': 'MH', 'osmanabad': 'MH', 'beed': 'MH', 'raigad': 'MH',
        'sindhudurg': 'MH', 'gadchiroli': 'MH', 'palghar': 'MH',
        'kalyan': 'MH', 'dombivli': 'MH', 'ulhasnagar': 'MH', 'vasai': 'MH',
        'virar': 'MH', 'mira-bhayandar': 'MH', 'panvel': 'MH',
        # MH - Mumbai Tech Areas
        'bandra': 'MH', 'andheri': 'MH', 'powai': 'MH', 'worli': 'MH',
        'lower parel': 'MH', 'bkc': 'MH', 'bandra kurla complex': 'MH',
        'malad': 'MH', 'goregaon': 'MH', 'vikhroli': 'MH', 'airoli': 'MH',
        'vashi': 'MH', 'belapur': 'MH', 'kharghar': 'MH', 'seepz': 'MH',
        # MH - Pune Tech Areas
        'hinjewadi': 'MH', 'magarpatta': 'MH', 'kharadi': 'MH',
        'hadapsar': 'MH', 'baner': 'MH', 'wakad': 'MH', 'viman nagar': 'MH',
        'kalyani nagar': 'MH', 'koregaon park': 'MH', 'pimpri': 'MH',
        'chinchwad': 'MH', 'pcmc': 'MH', 'eon it park': 'MH',

        # Delhi NCR
        'delhi': 'DL', 'new delhi': 'DL', 'noida': 'DL', 'gurgaon': 'DL',
        'gurugram': 'DL', 'faridabad': 'DL', 'ghaziabad': 'DL', 'ncr': 'DL',
        'greater noida': 'DL', 'dwarka': 'DL', 'connaught place': 'DL',
        'nehru place': 'DL', 'aerocity': 'DL', 'cyber city': 'DL',
        'cyber hub': 'DL', 'dlf': 'DL',
        # NCR Tech Hubs
        'sector 62': 'DL', 'sector 63': 'DL', 'sector 125': 'DL',
        'sector 126': 'DL', 'noida expressway': 'DL', 'film city noida': 'DL',
        'udyog vihar': 'DL', 'sohna road': 'DL', 'golf course road': 'DL',
        'mg road gurgaon': 'DL', 'saket': 'DL', 'okhla': 'DL',
        'jasola': 'DL', 'netaji subhash place': 'DL', 'pitampura': 'DL',
        'rohini': 'DL', 'janakpuri': 'DL', 'vasant kunj': 'DL',
        'bhiwadi': 'DL', 'manesar': 'DL', 'bahadurgarh': 'DL',

        # Telangana - Major Cities
        'hyderabad': 'TG', 'secunderabad': 'TG', 'warangal': 'TG',
        'nizamabad': 'TG', 'karimnagar': 'TG', 'khammam': 'TG',
        'ramagundam': 'TG', 'mahbubnagar': 'TG',
        # TG - Tier 2/3 Cities
        'nalgonda': 'TG', 'adilabad': 'TG', 'siddipet': 'TG', 'medak': 'TG',
        'mancherial': 'TG', 'kamareddy': 'TG', 'jagitial': 'TG',
        'peddapalli': 'TG', 'bhongir': 'TG', 'suryapet': 'TG',
        # TG - Hyderabad Tech Areas
        'cyberabad': 'TG', 'hitec city': 'TG', 'gachibowli': 'TG', 'madhapur': 'TG',
        'banjara hills': 'TG', 'jubilee hills': 'TG', 'begumpet': 'TG',
        'nanakramguda': 'TG', 'mindspace': 'TG', 'kondapur': 'TG',
        'kukatpally': 'TG', 'ameerpet': 'TG', 'lb nagar': 'TG',
        'uppal': 'TG', 'miyapur': 'TG', 'bachupally': 'TG',
        'financial district': 'TG', 'raheja mindspace': 'TG',
        'durgam cheruvu': 'TG', 'kokapet': 'TG', 'narsingi': 'TG',

        # Andhra Pradesh - Major Cities
        'visakhapatnam': 'AP', 'vizag': 'AP', 'vijayawada': 'AP',
        'guntur': 'AP', 'nellore': 'AP', 'kurnool': 'AP', 'tirupati': 'AP',
        'amaravati': 'AP', 'kakinada': 'AP', 'rajahmundry': 'AP',
        'anantapur': 'AP', 'kadapa': 'AP', 'ongole': 'AP', 'eluru': 'AP',
        # AP - Tier 2/3 Cities
        'chittoor': 'AP', 'srikakulam': 'AP', 'vizianagaram': 'AP',
        'machilipatnam': 'AP', 'proddatur': 'AP', 'nandyal': 'AP',
        'adoni': 'AP', 'hindupur': 'AP', 'tenali': 'AP', 'chirala': 'AP',
        'bhimavaram': 'AP', 'tadepalligudem': 'AP', 'mangalagiri': 'AP',

        # West Bengal - Major Cities
        'kolkata': 'WB', 'calcutta': 'WB', 'howrah': 'WB', 'durgapur': 'WB',
        'asansol': 'WB', 'siliguri': 'WB', 'darjeeling': 'WB', 'kharagpur': 'WB',
        'bardhaman': 'WB', 'haldia': 'WB', 'kalyani': 'WB',
        # WB - Kolkata Tech Areas
        'saltlake': 'WB', 'salt lake': 'WB', 'newtown': 'WB', 'rajarhat': 'WB',
        'sector v': 'WB', 'ecospace': 'WB', 'bengal silicon valley': 'WB',
        # WB - Tier 2/3 Cities
        'malda': 'WB', 'baharampur': 'WB', 'krishnanagar': 'WB',
        'cooch behar': 'WB', 'jalpaiguri': 'WB', 'balurghat': 'WB',
        'raniganj': 'WB', 'bankura': 'WB', 'medinipur': 'WB',
        'purulia': 'WB', 'berhampore': 'WB', 'nabadwip': 'WB',

        # Gujarat - Major Cities
        'ahmedabad': 'GJ', 'surat': 'GJ', 'vadodara': 'GJ', 'baroda': 'GJ',
        'rajkot': 'GJ', 'bhavnagar': 'GJ', 'jamnagar': 'GJ', 'gandhinagar': 'GJ',
        'gift city': 'GJ', 'anand': 'GJ', 'navsari': 'GJ', 'morbi': 'GJ',
        'vapi': 'GJ', 'bharuch': 'GJ', 'mehsana': 'GJ', 'junagadh': 'GJ',
        # GJ - Tier 2/3 Cities
        'gandhidham': 'GJ', 'porbandar': 'GJ', 'veraval': 'GJ', 'godhra': 'GJ',
        'palanpur': 'GJ', 'nadiad': 'GJ', 'botad': 'GJ', 'amreli': 'GJ',
        'surendranagar': 'GJ', 'patan': 'GJ', 'dahod': 'GJ', 'kutch': 'GJ',
        'halol': 'GJ', 'sanand': 'GJ', 'mundra': 'GJ',
        # GJ - Ahmedabad Tech Areas
        'sg highway': 'GJ', 'science city': 'GJ', 'prahlad nagar': 'GJ',

        # Rajasthan - Major Cities
        'jaipur': 'RJ', 'jodhpur': 'RJ', 'udaipur': 'RJ', 'kota': 'RJ',
        'bikaner': 'RJ', 'ajmer': 'RJ', 'alwar': 'RJ', 'bharatpur': 'RJ',
        'sikar': 'RJ', 'bhilwara': 'RJ', 'pali': 'RJ', 'sri ganganagar': 'RJ',
        # RJ - Tier 2/3 Cities
        'chittorgarh': 'RJ', 'barmer': 'RJ', 'jaisalmer': 'RJ', 'nagaur': 'RJ',
        'hanumangarh': 'RJ', 'sawai madhopur': 'RJ', 'tonk': 'RJ',
        'bundi': 'RJ', 'jhunjhunu': 'RJ', 'churu': 'RJ', 'baran': 'RJ',
        'dungarpur': 'RJ', 'banswara': 'RJ', 'pratapgarh': 'RJ',
        'neemrana': 'RJ', 'behror': 'RJ',
        # RJ - Jaipur Tech Areas
        'mansarovar': 'RJ', 'sitapura': 'RJ', 'malviya nagar jaipur': 'RJ',

        # Uttar Pradesh - Major Cities
        'lucknow': 'UP', 'kanpur': 'UP', 'varanasi': 'UP', 'agra': 'UP',
        'prayagraj': 'UP', 'allahabad': 'UP', 'meerut': 'UP', 'bareilly': 'UP',
        'aligarh': 'UP', 'moradabad': 'UP', 'gorakhpur': 'UP', 'mathura': 'UP',
        'ayodhya': 'UP', 'jhansi': 'UP', 'firozabad': 'UP', 'shahjahanpur': 'UP',
        'muzaffarnagar': 'UP', 'saharanpur': 'UP',
        # UP - Tier 2/3 Cities
        'ghazipur': 'UP', 'azamgarh': 'UP', 'sultanpur': 'UP', 'faizabad': 'UP',
        'hardoi': 'UP', 'unnao': 'UP', 'sitapur': 'UP', 'lakhimpur': 'UP',
        'rae bareli': 'UP', 'fatehpur': 'UP', 'etawah': 'UP', 'mainpuri': 'UP',
        'rampur': 'UP', 'sambhal': 'UP', 'amroha': 'UP', 'bulandshahr': 'UP',
        'hapur': 'UP', 'bijnor': 'UP', 'mirzapur': 'UP', 'jaunpur': 'UP',
        'banda': 'UP', 'hamirpur': 'UP', 'mahoba': 'UP', 'lalitpur': 'UP',
        'deoria': 'UP', 'kushinagar': 'UP', 'basti': 'UP', 'sonbhadra': 'UP',
        'ballia': 'UP', 'mau': 'UP', 'gonda': 'UP', 'bahraich': 'UP',
        'shrawasti': 'UP', 'balrampur': 'UP', 'sant kabir nagar': 'UP',
        'kasganj': 'UP', 'etah': 'UP', 'auraiya': 'UP', 'farrukhabad': 'UP',
        'kannauj': 'UP', 'hathras': 'UP', 'bagpat': 'UP',

        # Kerala - Major Cities
        'thiruvananthapuram': 'KL', 'trivandrum': 'KL', 'kochi': 'KL',
        'cochin': 'KL', 'kozhikode': 'KL', 'calicut': 'KL', 'thrissur': 'KL',
        'kannur': 'KL', 'kollam': 'KL', 'alappuzha': 'KL', 'palakkad': 'KL',
        'malappuram': 'KL', 'kottayam': 'KL', 'ernakulam': 'KL',
        # KL - Tech Parks
        'technopark': 'KL', 'infopark': 'KL', 'smartcity kochi': 'KL',
        'cyberpark kozhikode': 'KL', 'technocity': 'KL',
        # KL - Tier 2/3 Cities
        'pathanamthitta': 'KL', 'idukki': 'KL', 'wayanad': 'KL', 'kasaragod': 'KL',
        'manjeri': 'KL', 'perinthalmanna': 'KL', 'tirur': 'KL', 'ponnani': 'KL',
        'chalakudy': 'KL', 'irinjalakuda': 'KL', 'angamaly': 'KL', 'perumbavoor': 'KL',
        'aluva': 'KL', 'muvattupuzha': 'KL', 'thodupuzha': 'KL', 'changanassery': 'KL',
        'kayamkulam': 'KL', 'karunagappally': 'KL', 'attingal': 'KL', 'neyyattinkara': 'KL',

        # Punjab - Major Cities
        'chandigarh': 'PB', 'ludhiana': 'PB', 'amritsar': 'PB', 'jalandhar': 'PB',
        'patiala': 'PB', 'mohali': 'PB', 'bathinda': 'PB', 'hoshiarpur': 'PB',
        # PB - Tier 2/3 Cities
        'pathankot': 'PB', 'gurdaspur': 'PB', 'moga': 'PB', 'firozpur': 'PB',
        'sangrur': 'PB', 'barnala': 'PB', 'faridkot': 'PB', 'kapurthala': 'PB',
        'nawanshahr': 'PB', 'ropar': 'PB', 'muktsar': 'PB', 'mansa': 'PB',
        'zirakpur': 'PB', 'kharar': 'PB', 'rajpura': 'PB', 'dera bassi': 'PB',
        # Mohali IT City
        'it city mohali': 'PB', 'quark city': 'PB', 'phase 8 mohali': 'PB',

        # Haryana
        'panipat': 'HR', 'ambala': 'HR', 'karnal': 'HR',
        'sonipat': 'HR', 'rohtak': 'HR', 'hisar': 'HR', 'rewari': 'HR',
        'bhiwani': 'HR', 'kurukshetra': 'HR', 'sirsa': 'HR',
        # HR - Tier 2/3 Cities
        'yamunanagar': 'HR', 'panchkula': 'HR', 'jind': 'HR', 'fatehabad': 'HR',
        'kaithal': 'HR', 'palwal': 'HR', 'mahendragarh': 'HR', 'charkhi dadri': 'HR',
        'nuh': 'HR', 'jhajjar': 'HR', 'bahadurgarh': 'HR',

        # Madhya Pradesh - Major Cities
        'bhopal': 'MP', 'indore': 'MP', 'gwalior': 'MP', 'jabalpur': 'MP',
        'ujjain': 'MP', 'rewa': 'MP', 'satna': 'MP', 'dewas': 'MP',
        'sagar': 'MP', 'ratlam': 'MP', 'burhanpur': 'MP',
        # MP - Tier 2/3 Cities
        'chhindwara': 'MP', 'morena': 'MP', 'khargone': 'MP', 'khandwa': 'MP',
        'neemuch': 'MP', 'mandsaur': 'MP', 'vidisha': 'MP', 'shivpuri': 'MP',
        'damoh': 'MP', 'panna': 'MP', 'tikamgarh': 'MP', 'chhatarpur': 'MP',
        'datia': 'MP', 'shahdol': 'MP', 'umaria': 'MP', 'mandla': 'MP',
        'dindori': 'MP', 'seoni': 'MP', 'balaghat': 'MP', 'hoshangabad': 'MP',
        'betul': 'MP', 'rajgarh': 'MP', 'shajapur': 'MP', 'guna': 'MP',
        'ashok nagar': 'MP', 'singrauli': 'MP', 'sidhi': 'MP', 'anuppur': 'MP',
        # MP - Tech Areas
        'crystal it park': 'MP', 'mpcst': 'MP',

        # Bihar - Major Cities
        'patna': 'BR', 'gaya': 'BR', 'muzaffarpur': 'BR', 'bhagalpur': 'BR',
        'darbhanga': 'BR', 'purnia': 'BR', 'arrah': 'BR', 'begusarai': 'BR',
        'katihar': 'BR', 'munger': 'BR', 'chapra': 'BR', 'nalanda': 'BR',
        # BR - Tier 2/3 Cities
        'saharsa': 'BR', 'sasaram': 'BR', 'hajipur': 'BR', 'dehri': 'BR',
        'siwan': 'BR', 'motihari': 'BR', 'samastipur': 'BR', 'bettiah': 'BR',
        'madhubani': 'BR', 'sitamarhi': 'BR', 'kishanganj': 'BR', 'araria': 'BR',
        'nawada': 'BR', 'buxar': 'BR', 'jehanabad': 'BR', 'aurangabad bihar': 'BR',
        'sheikhpura': 'BR', 'lakhisarai': 'BR', 'jamui': 'BR', 'khagaria': 'BR',
        'banka': 'BR', 'gopalganj': 'BR', 'saran': 'BR', 'vaishali': 'BR',
        'madhepura': 'BR', 'supaul': 'BR', 'sheohar': 'BR', 'east champaran': 'BR',
        'west champaran': 'BR', 'rohtas': 'BR', 'kaimur': 'BR',

        # Odisha - Major Cities
        'bhubaneswar': 'OD', 'cuttack': 'OD', 'rourkela': 'OD', 'puri': 'OD',
        'berhampur': 'OD', 'sambalpur': 'OD', 'balasore': 'OD', 'bhadrak': 'OD',
        # OD - Tier 2/3 Cities
        'angul': 'OD', 'dhenkanal': 'OD', 'jajpur': 'OD', 'kendrapara': 'OD',
        'jagatsinghpur': 'OD', 'khurda': 'OD', 'nayagarh': 'OD', 'ganjam': 'OD',
        'gajapati': 'OD', 'kandhamal': 'OD', 'boudh': 'OD', 'sonepur': 'OD',
        'bolangir': 'OD', 'kalahandi': 'OD', 'nuapada': 'OD', 'nabarangpur': 'OD',
        'koraput': 'OD', 'malkangiri': 'OD', 'rayagada': 'OD',
        'jharsuguda': 'OD', 'sundargarh': 'OD', 'bargarh': 'OD',
        'mayurbhanj': 'OD', 'keonjhar': 'OD', 'debgarh': 'OD',
        # OD - Tech Area
        'infocity bhubaneswar': 'OD', 'chandrasekharpur': 'OD',

        # Assam - Major Cities
        'guwahati': 'AS', 'dibrugarh': 'AS', 'silchar': 'AS', 'jorhat': 'AS',
        'tezpur': 'AS', 'nagaon': 'AS', 'tinsukia': 'AS',
        # AS - Tier 2/3 Cities
        'bongaigaon': 'AS', 'dhubri': 'AS', 'goalpara': 'AS', 'kokrajhar': 'AS',
        'nalbari': 'AS', 'barpeta': 'AS', 'kamrup': 'AS', 'morigaon': 'AS',
        'darrang': 'AS', 'udalguri': 'AS', 'baksa': 'AS', 'chirang': 'AS',
        'sonitpur': 'AS', 'biswanath': 'AS', 'lakhimpur': 'AS', 'dhemaji': 'AS',
        'majuli': 'AS', 'golaghat': 'AS', 'sivasagar': 'AS', 'charaideo': 'AS',
        'dibrugarh': 'AS', 'karbi anglong': 'AS', 'dima hasao': 'AS',
        'cachar': 'AS', 'karimganj': 'AS', 'hailakandi': 'AS',
        # AS - Tech Area
        'guwahati tech city': 'AS', 'itpark guwahati': 'AS',

        # Jharkhand - Major Cities
        'ranchi': 'JH', 'jamshedpur': 'JH', 'dhanbad': 'JH', 'bokaro': 'JH',
        'hazaribagh': 'JH', 'deoghar': 'JH', 'giridih': 'JH', 'ramgarh': 'JH',
        # JH - Tier 2/3 Cities
        'chaibasa': 'JH', 'gumla': 'JH', 'lohardaga': 'JH', 'simdega': 'JH',
        'khunti': 'JH', 'seraikela': 'JH', 'saraikela': 'JH', 'east singhbhum': 'JH',
        'west singhbhum': 'JH', 'koderma': 'JH', 'chatra': 'JH', 'palamu': 'JH',
        'latehar': 'JH', 'garhwa': 'JH', 'dumka': 'JH', 'pakur': 'JH',
        'godda': 'JH', 'sahebganj': 'JH', 'jamtara': 'JH',

        # Chhattisgarh - Major Cities
        'raipur': 'CG', 'bhilai': 'CG', 'bilaspur': 'CG', 'durg': 'CG',
        'korba': 'CG', 'rajnandgaon': 'CG',
        # CG - Tier 2/3 Cities
        'raigarh': 'CG', 'jagdalpur': 'CG', 'ambikapur': 'CG', 'dhamtari': 'CG',
        'mahasamund': 'CG', 'gariaband': 'CG', 'kanker': 'CG', 'bastar': 'CG',
        'narayanpur': 'CG', 'kondagaon': 'CG', 'bijapur cg': 'CG', 'dantewada': 'CG',
        'sukma': 'CG', 'jashpur': 'CG', 'surguja': 'CG', 'surajpur': 'CG',
        'balrampur cg': 'CG', 'koriya': 'CG', 'balod': 'CG', 'bemetara': 'CG',
        'kawardha': 'CG', 'mungeli': 'CG', 'janjgir': 'CG', 'champa': 'CG',

        # Uttarakhand - Major Cities
        'dehradun': 'UK', 'haridwar': 'UK', 'rishikesh': 'UK', 'nainital': 'UK',
        'haldwani': 'UK', 'roorkee': 'UK', 'mussoorie': 'UK', 'rudrapur': 'UK',
        # UK - Tier 2/3 Cities
        'kashipur': 'UK', 'rishikesh': 'UK', 'kotdwar': 'UK', 'ramnagar': 'UK',
        'almora': 'UK', 'pithoragarh': 'UK', 'champawat': 'UK', 'bageshwar': 'UK',
        'tehri': 'UK', 'uttarkashi': 'UK', 'chamoli': 'UK', 'rudraprayag': 'UK',
        'pauri': 'UK', 'lansdowne': 'UK', 'srinagar uk': 'UK',

        # Goa
        'panaji': 'GA', 'panjim': 'GA', 'margao': 'GA', 'vasco': 'GA',
        'mapusa': 'GA', 'ponda': 'GA',
        # GA - Other Areas
        'dona paula': 'GA', 'porvorim': 'GA', 'bicholim': 'GA', 'curchorem': 'GA',
        'sanquelim': 'GA', 'cuncolim': 'GA', 'pernem': 'GA', 'quepem': 'GA',
        'canacona': 'GA', 'sanguem': 'GA', 'goa velha': 'GA',

        # Himachal Pradesh
        'shimla': 'HP', 'dharamshala': 'HP', 'manali': 'HP', 'kullu': 'HP',
        'solan': 'HP', 'mandi': 'HP', 'kangra': 'HP', 'una': 'HP',
        # HP - Tier 2/3 Cities
        'bilaspur hp': 'HP', 'hamirpur hp': 'HP', 'nahan': 'HP', 'palampur': 'HP',
        'paonta sahib': 'HP', 'baddi': 'HP', 'nalagarh': 'HP', 'parwanoo': 'HP',
        'sundernagar': 'HP', 'chamba': 'HP', 'dalhousie': 'HP', 'kasauli': 'HP',
        'kinnaur': 'HP', 'lahaul': 'HP', 'spiti': 'HP', 'keylong': 'HP',

        # Jammu & Kashmir
        'srinagar': 'JK', 'jammu': 'JK', 'anantnag': 'JK', 'baramulla': 'JK',
        'sopore': 'JK', 'leh': 'JK', 'ladakh': 'JK',
        # JK - Tier 2/3 Cities
        'pulwama': 'JK', 'shopian': 'JK', 'kulgam': 'JK', 'budgam': 'JK',
        'ganderbal': 'JK', 'bandipora': 'JK', 'kupwara': 'JK', 'handwara': 'JK',
        'kathua': 'JK', 'udhampur': 'JK', 'reasi': 'JK', 'ramban': 'JK',
        'doda': 'JK', 'kishtwar': 'JK', 'rajouri': 'JK', 'poonch': 'JK',
        'samba': 'JK', 'kargil': 'JK',

        # Northeast states - Capitals and Major Towns
        # Manipur
        'imphal': 'MN', 'bishnupur': 'MN', 'thoubal': 'MN', 'churachandpur': 'MN',
        # Meghalaya
        'shillong': 'ML', 'tura': 'ML', 'jowai': 'ML', 'nongstoin': 'ML',
        # Mizoram
        'aizawl': 'MZ', 'lunglei': 'MZ', 'champhai': 'MZ', 'serchhip': 'MZ',
        # Nagaland
        'kohima': 'NL', 'dimapur': 'NL', 'mokokchung': 'NL', 'tuensang': 'NL', 'wokha': 'NL',
        # Tripura
        'agartala': 'TR', 'dharmanagar': 'TR', 'udaipur tripura': 'TR', 'kailashahar': 'TR',
        # Arunachal Pradesh
        'itanagar': 'AR', 'naharlagun': 'AR', 'pasighat': 'AR', 'tawang': 'AR', 'ziro': 'AR',
        # Sikkim
        'gangtok': 'SK', 'namchi': 'SK', 'gyalshing': 'SK', 'mangan': 'SK',

        # Puducherry (technically UT but often grouped with TN)
        'pondicherry': 'PY', 'puducherry': 'PY',
        'karaikal': 'PY', 'mahe': 'PY', 'yanam': 'PY',

        # Ladakh (UT)
        'leh': 'LA', 'kargil': 'LA',

        # Andaman & Nicobar (UT)
        'port blair': 'AN', 'car nicobar': 'AN',
    }

    # ==================== STATE NAME MAPPINGS ====================
    STATE_NAME_MAP = {
        'tamil nadu': 'TN', 'tamilnadu': 'TN',
        'karnataka': 'KA',
        'maharashtra': 'MH',
        'delhi': 'DL', 'new delhi': 'DL',
        'telangana': 'TG',
        'andhra pradesh': 'AP', 'andhra': 'AP',
        'west bengal': 'WB', 'bengal': 'WB',
        'gujarat': 'GJ',
        'rajasthan': 'RJ',
        'uttar pradesh': 'UP',
        'kerala': 'KL',
        'punjab': 'PB',
        'haryana': 'HR',
        'madhya pradesh': 'MP',
        'bihar': 'BR',
        'odisha': 'OD', 'orissa': 'OD',
        'assam': 'AS',
        'jharkhand': 'JH',
        'chhattisgarh': 'CG', 'chattisgarh': 'CG',
        'uttarakhand': 'UK', 'uttaranchal': 'UK',
        'goa': 'GA',
        'himachal pradesh': 'HP', 'himachal': 'HP',
        'jammu and kashmir': 'JK', 'jammu & kashmir': 'JK', 'kashmir': 'JK',
        'manipur': 'MN',
        'meghalaya': 'ML',
        'mizoram': 'MZ',
        'nagaland': 'NL',
        'tripura': 'TR',
        'arunachal pradesh': 'AR', 'arunachal': 'AR',
        'sikkim': 'SK',
        'puducherry': 'PY', 'pondicherry': 'PY',
    }

    # ==================== INSTITUTION MAPPINGS ====================
    KNOWN_LOCATIONS = {
        # IITs
        'iit madras': 'TN', 'iitm': 'TN', 'anna university': 'TN',
        'iit bombay': 'MH', 'iitb': 'MH',
        'iit delhi': 'DL', 'iitd': 'DL',
        'iit bangalore': 'KA', 'iit bengaluru': 'KA', 'iisc': 'KA', 'iisc bangalore': 'KA',
        'iit hyderabad': 'TG', 'iith': 'TG',
        'iit kanpur': 'UP', 'iitk': 'UP',
        'iit kharagpur': 'WB', 'iitkgp': 'WB',
        'iit roorkee': 'UK', 'iitr': 'UK',
        'iit guwahati': 'AS', 'iitg': 'AS',
        'iit ropar': 'PB', 'iit patna': 'BR', 'iit bhubaneswar': 'OD',
        'iit indore': 'MP', 'iit jodhpur': 'RJ', 'iit gandhinagar': 'GJ',
        'iit tirupati': 'AP', 'iit palakkad': 'KL', 'iit dharwad': 'KA',
        'iit bhilai': 'CG', 'iit goa': 'GA', 'iit jammu': 'JK',

        # IIMs
        'iim ahmedabad': 'GJ', 'iima': 'GJ',
        'iim bangalore': 'KA', 'iimb': 'KA', 'iim bengaluru': 'KA',
        'iim calcutta': 'WB', 'iimc': 'WB', 'iim kolkata': 'WB',
        'iim lucknow': 'UP', 'iiml': 'UP',
        'iim indore': 'MP', 'iim kozhikode': 'KL',
        'iim shillong': 'ML', 'iim ranchi': 'JH', 'iim raipur': 'CG',
        'iim rohtak': 'HR', 'iim kashipur': 'UK', 'iim trichy': 'TN',
        'iim udaipur': 'RJ', 'iim nagpur': 'MH', 'iim visakhapatnam': 'AP',
        'iim bodh gaya': 'BR', 'iim amritsar': 'PB', 'iim sirmaur': 'HP',
        'iim jammu': 'JK', 'iim sambalpur': 'OD',

        # NITs
        'nit trichy': 'TN', 'nit tiruchirappalli': 'TN',
        'nit warangal': 'TG', 'nit surathkal': 'KA', 'nitk': 'KA',
        'nit calicut': 'KL', 'nit rourkela': 'OD', 'nit durgapur': 'WB',
        'nit jamshedpur': 'JH', 'nit allahabad': 'UP', 'mnit jaipur': 'RJ',
        'nit nagpur': 'MH', 'nit surat': 'GJ', 'nit bhopal': 'MP',

        # Other institutions
        'bits pilani': 'RJ', 'bits goa': 'GA', 'bits hyderabad': 'TG',
        'vit vellore': 'TN', 'vit chennai': 'TN', 'vit bhopal': 'MP',
        'srm chennai': 'TN', 'manipal university': 'KA', 'symbiosis pune': 'MH',
        'amity noida': 'DL', 'lpu punjab': 'PB', 'christ university': 'KA',
        'isb hyderabad': 'TG', 'isb mohali': 'PB', 'xlri jamshedpur': 'JH',
        'fms delhi': 'DL', 'jnu': 'DL', 'jawaharlal nehru university': 'DL',
        'du': 'DL', 'delhi university': 'DL', 'ipu delhi': 'DL',
        'jadavpur university': 'WB', 'calcutta university': 'WB',
        'osmania university': 'TG', 'andhra university': 'AP',

        # Research centers
        'cdac pune': 'MH', 'cdac bangalore': 'KA',
        'cdac hyderabad': 'TG', 'cdac thiruvananthapuram': 'KL',
        'iiit hyderabad': 'TG', 'iiit bangalore': 'KA', 'iiit delhi': 'DL',
        'iiit allahabad': 'UP', 'iiit guwahati': 'AS',
    }

    # ==================== CENTRAL GOVERNMENT BODIES ====================
    # These entities are located in Delhi but their announcements are typically
    # NATIONAL in scope. They should NOT trigger Delhi attribution.
    CENTRAL_BODIES = {
        # Govt Ministries and Bodies
        'niti aayog', 'meity', 'ministry of electronics',
        'ministry of communications', 'ministry of it',
        'drdo', 'csir', 'icar', 'icmr', 'dbt', 'dst',
        'department of science', 'department of biotechnology',
        'pib', 'press information bureau',
        # Industry Associations (national scope)
        'nasscom', 'ficci', 'cii', 'assocham',
        'confederation of indian industry',
        # Parliament
        'parliament', 'lok sabha', 'rajya sabha',
        # Central regulatory
        'sebi', 'rbi', 'reserve bank', 'irdai', 'trai',
    }

    # ==================== DELHI-SPECIFIC INDICATORS ====================
    # These indicate an article is genuinely about Delhi (not just central govt)
    DELHI_SPECIFIC_INDICATORS = [
        r'\bdelhi government\b',
        r'\bdelhi state\b',
        r'\bdelhi cm\b',
        r'\bdelhi chief minister\b',
        r'\baap government\b',
        r'\barvind kejriwal\b',
        r'\bdelhi assembly\b',
        r'\bdelhi metro\b',
        r'\bdelhi police\b',
        r'\bdelhi university\b',
        r'\bjnu\b',
        r'\bdelhi high court\b',
        r'\bncr startup\b',
        r'\bgurgaon.*startup\b',
        r'\bnoida.*startup\b',
        r'\bstartup.*(?:gurgaon|noida|delhi)\b',
        r'\b(?:based|headquartered) in (?:delhi|gurgaon|noida|ncr)\b',
        r'\bdelhi-based\b',
        r'\bncr-based\b',
        r'\bgurgaon-based\b',
        r'\bnoida-based\b',
    ]

    # ==================== NATIONAL INDICATORS ====================
    NATIONAL_INDICATORS = [
        r'\bcentral government\b',
        r'\bunion government\b',
        r'\bgovernment of india\b',
        r'\bmeity\b',
        r'\bministry of',
        r'\bniti aayog\b',
        r'\bparliament\b',
        r'\brajya sabha\b',
        r'\blok sabha\b',
        r'\bnational ai\b',
        r'\bindia[\'\"]?s ai\b',
        r'\bacross india\b',
        r'\bpan[- ]india\b',
        r'\bnationwide\b',
        r'\bindian market\b',
        r'\bindian economy\b',
        r'\bacross (?:the )?country\b',
        r'\ball (?:over )?india\b',
        r'\bindian (?:tech|it|startup|industry)\b',
        r'\bindia targets\b',
        r'\bindia aims\b',
        r'\bindia plans\b',
        r'\bindia launches\b',
        # Central government positions - these indicate national news
        r'\bdot\s+secretary\b',  # Department of Telecom Secretary
        r'\bsecretary\b.*\b(?:dot|meity|dit|dpiit)\b',
        r'\bunion minister\b',
        r'\bcentral minister\b',
        r'\bit minister\b',
        r'\btelecom minister\b',
        r'\bfinance minister\b',
        r'\bcommerce minister\b',
        # National-level topics
        r'\bindia[\'\"]?s digital\b',
        r'\bnext phase of india\b',
        r'\bindia[\'\"]?s (?:tech|ai|digital) (?:growth|future|journey)\b',
        r'\basean\b.*\bindia\b',
        r'\bindia\b.*\basean\b',
        r'\bg20\b.*\bindia\b',
        r'\bindia\b.*\bg20\b',
        r'\bdigital public infrastructure\b',
        r'\bdpi\b.*\bindia\b',
    ]

    def __init__(self):
        api_key = os.getenv('GROQ_API_KEY')
        self.client = Groq(api_key=api_key) if api_key else None
        self._compile_patterns()

    def _compile_patterns(self):
        """Pre-compile regex patterns for performance."""
        self.national_patterns = [re.compile(p, re.IGNORECASE) for p in self.NATIONAL_INDICATORS]
        self.delhi_specific_patterns = [re.compile(p, re.IGNORECASE) for p in self.DELHI_SPECIFIC_INDICATORS]

    def _mentions_central_body(self, text):
        """Check if text mentions a central government body."""
        text_lower = text.lower()
        for body in self.CENTRAL_BODIES:
            if body in text_lower:
                return True
        return False

    def _is_delhi_specific(self, text):
        """Check if article is genuinely about Delhi (not just central govt)."""
        for pattern in self.delhi_specific_patterns:
            if pattern.search(text):
                return True
        return False

    def attribute(self, title, content="", source_state=None, is_state_specific_source=False, geo_mode="default"):
        """
        Determine which state(s) an article belongs to.

        Args:
            title: Article headline
            content: Article content
            source_state: State code from source configuration
            is_state_specific_source: Whether source is state-specific
            geo_mode: How to use source_state:
                     - 'force': Always include this state
                     - 'default': Use as fallback if no other state found
                     - 'strict': Only use if content explicitly mentions it

        Returns:
            list: List of state codes (e.g., ['TN'], ['TN', 'KA'], or ['IN'] for national)
        """
        title_lower = title.lower()
        content_lower = (content[:2000] if content else "").lower()
        combined_text = f"{title_lower} {content_lower}"

        found_states = set()

        # ==================== STEP 0: Early National Detection ====================
        # Check if this is clearly a national-level article BEFORE checking locations
        # This prevents "India targets..." articles from being tagged to Delhi just
        # because they mention a central body or Delhi incidentally
        if self._is_national_article(combined_text) and not self._is_delhi_specific(combined_text):
            # It's a national article - check if it ALSO mentions specific states
            # (e.g., "India launches AI policy, Bangalore hub announced")
            other_states = self._find_non_delhi_states(combined_text)
            if other_states:
                print(f"  [GEO] National article with specific state mentions: {other_states}")
                return list(other_states) + ['IN']
            print(f"  [GEO] National scope detected (early)")
            return ['IN']

        # ==================== STEP 1: Check headline for explicit geography ====================
        # Headline matches are highest priority

        # Check state names in headline
        for state_name, state_code in self.STATE_NAME_MAP.items():
            pattern = r'\b' + re.escape(state_name) + r'\b'
            if re.search(pattern, title_lower):
                # Special handling for Delhi - require Delhi-specific context
                if state_code == 'DL':
                    if self._is_delhi_specific(combined_text) or self._mentions_delhi_company(combined_text):
                        found_states.add(state_code)
                        print(f"  [GEO] Found Delhi with specific context in headline")
                    elif not self._mentions_central_body(combined_text):
                        # Delhi mentioned but not central body - might be actual Delhi news
                        found_states.add(state_code)
                        print(f"  [GEO] Found Delhi in headline (no central body)")
                else:
                    found_states.add(state_code)
                    print(f"  [GEO] Found state '{state_name}' in headline")

        # Check city names in headline (with Delhi special handling)
        for city, state_code in self.CITY_STATE_MAP.items():
            pattern = r'\b' + re.escape(city) + r'\b'
            if re.search(pattern, title_lower):
                if state_code == 'DL':
                    # For Delhi/NCR cities, require stronger context
                    if self._is_delhi_specific(combined_text) or self._mentions_delhi_company(combined_text):
                        found_states.add(state_code)
                        print(f"  [GEO] Found NCR city '{city}' with context -> DL")
                    elif not self._mentions_central_body(combined_text):
                        found_states.add(state_code)
                        print(f"  [GEO] Found NCR city '{city}' (no central body) -> DL")
                else:
                    found_states.add(state_code)
                    print(f"  [GEO] Found city '{city}' in headline -> {state_code}")

        # Check company HQs in headline
        for company, state_code in self.COMPANY_HQ_MAP.items():
            pattern = r'\b' + re.escape(company) + r'\b'
            if re.search(pattern, title_lower):
                found_states.add(state_code)
                print(f"  [GEO] Found company '{company}' in headline -> {state_code}")

        # ==================== STEP 2: Check known institutions ====================
        for location, state_code in self.KNOWN_LOCATIONS.items():
            # Use word boundary for short location names to avoid false matches
            if len(location) <= 4:
                pattern = r'\b' + re.escape(location) + r'\b'
                if re.search(pattern, combined_text):
                    # For Delhi institutions, apply same filter
                    if state_code == 'DL':
                        if self._is_delhi_specific(combined_text) or self._mentions_delhi_company(combined_text):
                            found_states.add(state_code)
                            print(f"  [GEO] Found institution '{location}' with context -> {state_code}")
                    else:
                        found_states.add(state_code)
                        print(f"  [GEO] Found institution '{location}' -> {state_code}")
            elif location in combined_text:
                if state_code == 'DL':
                    if self._is_delhi_specific(combined_text) or self._mentions_delhi_company(combined_text):
                        found_states.add(state_code)
                        print(f"  [GEO] Found institution '{location}' with context -> {state_code}")
                else:
                    found_states.add(state_code)
                    print(f"  [GEO] Found institution '{location}' -> {state_code}")

        # ==================== STEP 3: Check content for geography ====================
        if not found_states:
            # Check state names in content (with Delhi special handling)
            for state_name, state_code in self.STATE_NAME_MAP.items():
                pattern = r'\b' + re.escape(state_name) + r'\b'
                if re.search(pattern, content_lower):
                    if state_code == 'DL':
                        if self._is_delhi_specific(combined_text) or self._mentions_delhi_company(combined_text):
                            found_states.add(state_code)
                    else:
                        found_states.add(state_code)

            # Check city names in content (with Delhi special handling)
            for city, state_code in self.CITY_STATE_MAP.items():
                pattern = r'\b' + re.escape(city) + r'\b'
                if re.search(pattern, content_lower):
                    if state_code == 'DL':
                        if self._is_delhi_specific(combined_text) or self._mentions_delhi_company(combined_text):
                            found_states.add(state_code)
                    else:
                        found_states.add(state_code)

            # Check company HQs in content
            for company, state_code in self.COMPANY_HQ_MAP.items():
                pattern = r'\b' + re.escape(company) + r'\b'
                if re.search(pattern, content_lower):
                    found_states.add(state_code)

        # ==================== STEP 4: Apply source-level geo_mode ====================
        if source_state:
            if geo_mode == 'force':
                # Always include the source state
                found_states.add(source_state)
                print(f"  [GEO] Force-adding source state: {source_state}")

            elif geo_mode == 'default' and not found_states:
                # Use source state as fallback only if nothing found
                found_states.add(source_state)
                print(f"  [GEO] Using source state as fallback: {source_state}")

            elif geo_mode == 'strict':
                # Only add if content explicitly mentions this state
                state_name = self.get_state_name(source_state).lower()
                if state_name in combined_text:
                    found_states.add(source_state)
                    print(f"  [GEO] Strict mode: found {source_state} mention in content")

        # ==================== STEP 5: Post-processing for Delhi ====================
        # If Delhi was found but article is primarily about central govt, remove it
        if 'DL' in found_states and len(found_states) == 1:
            if self._mentions_central_body(combined_text) and not self._is_delhi_specific(combined_text):
                print(f"  [GEO] Removing Delhi - article is about central govt, not Delhi state")
                found_states.remove('DL')
                found_states.add('IN')

        # ==================== STEP 6: LLM attribution for ambiguous cases ====================
        if not found_states and self.client:
            # Check if this is a national article first
            if self._is_national_article(combined_text):
                print(f"  [GEO] National scope detected")
                return ['IN']

            llm_states = self._llm_attribute(title, content)
            if llm_states:
                found_states.update(llm_states)

        # ==================== STEP 7: Default to All India ====================
        if not found_states:
            print(f"  [GEO] No specific location found, defaulting to All India")
            return ['IN']

        return list(found_states)

    def _find_non_delhi_states(self, text):
        """Find states mentioned in text, excluding Delhi."""
        found = set()
        for state_name, state_code in self.STATE_NAME_MAP.items():
            if state_code != 'DL':
                pattern = r'\b' + re.escape(state_name) + r'\b'
                if re.search(pattern, text, re.IGNORECASE):
                    found.add(state_code)
        for city, state_code in self.CITY_STATE_MAP.items():
            if state_code != 'DL':
                pattern = r'\b' + re.escape(city) + r'\b'
                if re.search(pattern, text, re.IGNORECASE):
                    found.add(state_code)
        return found

    def _mentions_delhi_company(self, text):
        """Check if text mentions a Delhi/NCR-based company."""
        text_lower = text.lower()
        delhi_companies = [c for c, s in self.COMPANY_HQ_MAP.items() if s == 'DL']
        for company in delhi_companies:
            if company in text_lower:
                return True
        return False

    def _is_national_article(self, text):
        """Check if article is clearly national-level."""
        for pattern in self.national_patterns:
            if pattern.search(text):
                return True
        return False

    def _llm_attribute(self, title, content):
        """Use LLM to determine geographic attribution for ambiguous content."""
        try:
            prompt = f"""You are a geographic location classifier for Indian news articles.

ARTICLE TITLE: {title}
ARTICLE EXCERPT: {content[:800] if content else 'No additional content'}

TASK: Determine which Indian state(s) this article is primarily about.

STATE CODES:
TN=Tamil Nadu, KA=Karnataka, MH=Maharashtra, DL=Delhi, TG=Telangana, AP=Andhra Pradesh,
WB=West Bengal, GJ=Gujarat, RJ=Rajasthan, UP=Uttar Pradesh, KL=Kerala, PB=Punjab,
HR=Haryana, MP=Madhya Pradesh, BR=Bihar, OD=Odisha, AS=Assam, JH=Jharkhand,
CG=Chhattisgarh, UK=Uttarakhand, GA=Goa, HP=Himachal Pradesh, JK=Jammu & Kashmir

RULES:
- Look for Indian cities, districts, landmarks, universities, company headquarters
- Many Indian tech companies have known HQs: Zoho/Freshworks=Chennai(TN), Flipkart/Infosys=Bangalore(KA), TCS/Reliance=Mumbai(MH), HCL/Paytm=Delhi(DL)
- If about a specific organization, consider their headquarters location
- If multiple states mentioned, list all relevant ones
- If truly national/pan-India or no specific location, respond with "IN"
- Respond with ONLY the state code(s), comma-separated if multiple
- Examples: "KA" or "TN,KA" or "IN"

STATE CODE(S):"""

            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=20
            )

            result = response.choices[0].message.content.strip().upper()

            # Parse the response
            valid_codes = set(self.STATE_NAME_MAP.values()) | {'IN', 'PY'}
            found = []
            for code in result.replace(' ', '').split(','):
                if code in valid_codes and code != 'IN':
                    found.append(code)

            if found:
                print(f"  [GEO] LLM attributed to {found}: {title[:50]}...")
                return found

            return None

        except Exception as e:
            print(f"  [GEO] LLM error: {e}")
            return None

    def get_state_name(self, state_code):
        """Get full state name from code."""
        state_names = {
            'TN': 'Tamil Nadu', 'KA': 'Karnataka', 'MH': 'Maharashtra',
            'DL': 'Delhi', 'TG': 'Telangana', 'AP': 'Andhra Pradesh',
            'WB': 'West Bengal', 'GJ': 'Gujarat', 'RJ': 'Rajasthan',
            'UP': 'Uttar Pradesh', 'KL': 'Kerala', 'PB': 'Punjab',
            'HR': 'Haryana', 'MP': 'Madhya Pradesh', 'BR': 'Bihar',
            'OD': 'Odisha', 'AS': 'Assam', 'JH': 'Jharkhand',
            'CG': 'Chhattisgarh', 'UK': 'Uttarakhand', 'GA': 'Goa',
            'HP': 'Himachal Pradesh', 'JK': 'Jammu & Kashmir',
            'MN': 'Manipur', 'ML': 'Meghalaya', 'MZ': 'Mizoram',
            'NL': 'Nagaland', 'TR': 'Tripura', 'AR': 'Arunachal Pradesh',
            'SK': 'Sikkim', 'IN': 'All India', 'PY': 'Puducherry',
        }
        return state_names.get(state_code, state_code)
