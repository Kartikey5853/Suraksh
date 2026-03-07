import json
import re
from typing import Optional
from app.core.config import settings
from google import genai  # type: ignore

# ── Base Template ─────────────────────────────────────────────────────────────

BASE_TEMPLATE = """AGREEMENT

This Agreement is entered into as of [DATE] between Suraksh Technologies ("Company") and [PARTY NAME] ("Party").

1. SCOPE:
[Describe the scope here.]

2. TERMS & CONDITIONS:
[Describe the terms here.]

3. REPRESENTATIONS AND WARRANTIES:
Each party represents that they have full authority to enter into this agreement.

4. CONFIDENTIALITY:
[Confidentiality terms if applicable.]

5. TERMINATION:
[Termination conditions.]

6. GOVERNING LAW:
This Agreement shall be governed by the laws of India.

7. SIGNATURES:
Both parties agree to the terms outlined herein.

Company: ___________________    Date: ____________

Party: ___________________      Date: ____________"""


# ── Category-specific Pre-Built Templates ────────────────────────────────────

VC_TEMPLATES: dict[str, str] = {

    "Investment Agreement": """INVESTMENT AGREEMENT

This Investment Agreement ("Agreement") is entered into as of [DATE] ("Effective Date"),
by and between:

Investor:  [INVESTOR NAME], residing at [INVESTOR ADDRESS] ("Investor")
Company:   [COMPANY NAME], a company incorporated under the laws of India,
           having its registered office at [COMPANY ADDRESS] ("Company")

WHEREAS the Investor desires to invest in the Company and the Company desires to accept
such investment, subject to the terms and conditions set forth herein.

1. INVESTMENT AMOUNT
   The Investor agrees to invest a total amount of INR [AMOUNT] ("Investment Amount")
   into the Company in exchange for [EQUITY %]% equity stake.

2. VALUATION
   The pre-money valuation of the Company is agreed at INR [PRE-MONEY VALUATION].
   The post-money valuation shall be INR [POST-MONEY VALUATION].

3. USE OF FUNDS
   The Investment Amount shall be utilised exclusively for:
   (a) [PURPOSE 1]
   (b) [PURPOSE 2]
   (c) Working capital requirements

4. REPRESENTATIONS & WARRANTIES OF THE COMPANY
   (a) The Company is duly incorporated and validly existing under the laws of India.
   (b) The Company has full power and authority to enter into this Agreement.
   (c) There is no pending or threatened litigation that could materially affect the Company.
   (d) All financial statements provided to the Investor are accurate and complete.

5. REPRESENTATIONS & WARRANTIES OF THE INVESTOR
   (a) The Investor has the legal authority and capacity to enter into this Agreement.
   (b) The Investment is made for the Investor's own account.

6. ANTI-DILUTION
   The Investor shall have weighted-average anti-dilution protection in the event of a
   down round, as described in Schedule A.

7. INFORMATION RIGHTS
   The Company shall provide the Investor with quarterly financial statements, annual
   audited accounts, and any other information reasonably requested.

8. BOARD REPRESENTATION
   The Investor shall have the right to appoint one (1) observer to the Board of Directors.

9. LOCK-IN PERIOD
   Investor shares shall be subject to a lock-in period of [LOCK-IN MONTHS] months from
   the Effective Date.

10. CONFIDENTIALITY
    Each party agrees to keep confidential all non-public information disclosed under
    this Agreement and not to disclose such information to any third party without prior
    written consent.

11. GOVERNING LAW & DISPUTE RESOLUTION
    This Agreement shall be governed by the laws of India. Any dispute shall be resolved
    by arbitration in accordance with the Arbitration and Conciliation Act, 1996.
    Seat of arbitration: [CITY], India.

12. ENTIRE AGREEMENT
    This Agreement constitutes the entire agreement between the parties with respect to
    the subject matter hereof and supersedes all prior agreements.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first above written.

INVESTOR                                    COMPANY
____________________________                ____________________________
Name: [INVESTOR NAME]                       Name: [DIRECTOR NAME]
Date: _______________                       Designation: [TITLE]
                                            Date: _______________""",


    "SAFE Agreement": """SAFE (SIMPLE AGREEMENT FOR FUTURE EQUITY)

THIS CERTIFIES THAT in exchange for the payment by [INVESTOR NAME] ("Investor") of INR [INVESTMENT AMOUNT]
("Purchase Amount") on or about [DATE], [COMPANY NAME], a company incorporated under the laws of India
("Company"), hereby issues to the Investor the right to certain shares of the Company's capital stock,
subject to the terms set forth below.

VALUATION CAP:  INR [VALUATION CAP]
DISCOUNT RATE:  [DISCOUNT]% (i.e., Investor receives a [DISCOUNT]% discount on the price per share
                in the next equity round)

1. EVENTS
   (a) Equity Financing
       If there is an Equity Financing before the termination of this SAFE, the Company will
       automatically issue to the Investor a number of shares of SAFE Preferred Stock equal to
       the Purchase Amount divided by the Conversion Price.

   (b) Liquidity Event
       If there is a Liquidity Event before the termination of this SAFE, the Investor will
       receive a cash payment equal to the greater of (i) the Purchase Amount or (ii) the amount
       payable on the number of shares of Common Stock equal to the Purchase Amount divided by the
       Liquidity Price.

   (c) Dissolution Event
       If there is a Dissolution Event before the termination of this SAFE, the Investor will be
       paid an amount equal to the Purchase Amount, prior and in preference to any distribution
       to holders of Common Stock.

2. DEFINITIONS
   "Conversion Price" means the lower of:
   (a) the Valuation Cap divided by the Company Capitalization, or
   (b) the price per share of the Standard Preferred Stock sold in the Equity Financing multiplied
       by the Discount Rate.

   "Equity Financing" means a bona fide transaction in which the Company issues and sells shares of
   Preferred Stock at a fixed pre-money valuation, raising a minimum of INR [MINIMUM ROUND SIZE].

   "Liquidity Event" means a Change of Control or an Initial Public Offering.

3. COMPANY REPRESENTATIONS
   (a) The Company is duly incorporated and in good standing.
   (b) The issuance of this SAFE does not violate any existing agreement.

4. INVESTOR REPRESENTATIONS
   (a) The Investor is acquiring this SAFE for its own account.
   (b) The Investor understands that this SAFE is a risk investment.

5. MISCELLANEOUS
   Any dispute arising out of or relating to this SAFE shall be resolved by arbitration under
   the Arbitration and Conciliation Act, 1996. Governing law: Laws of India.

INVESTOR                                    COMPANY
____________________________                ____________________________
Name: [INVESTOR NAME]                       Name: [AUTHORIZED SIGNATORY]
Date: _______________                       Date: _______________""",


    "SHA": """SHAREHOLDERS' AGREEMENT (SHA)

This Shareholders' Agreement ("Agreement") is entered into as of [DATE], among:

1. [FOUNDER 1 NAME], holding [%]% of shares ("Founder 1")
2. [FOUNDER 2 NAME], holding [%]% of shares ("Founder 2")
3. [INVESTOR NAME], a [entity type] ("Investor")
   (collectively, the "Parties")

with respect to [COMPANY NAME] ("Company"), a company incorporated under the Companies Act, 2013.

1. DEFINITIONS
   "Shares" means the equity shares of the Company.
   "Transfer" means any sale, assignment, pledge, or other disposition of Shares.

2. MANAGEMENT & GOVERNANCE
   2.1 Board Composition
       The Board shall consist of [NUMBER] directors:
       (a) [NUMBER] directors nominated by the Founders
       (b) [NUMBER] director nominated by the Investor
       (c) [NUMBER] independent director(s) appointed by mutual agreement

   2.2 Reserved Matters
       The following actions require approval of [75%/unanimous] of the Board:
       (a) Raising additional funding or incurring debt above INR [THRESHOLD]
       (b) Acquisition or disposal of assets above INR [THRESHOLD]
       (c) Changes to the Company's business plan
       (d) Appointment or removal of the CEO / CFO

3. VESTING
   Founder shares vest over [4] years with a [1]-year cliff. Upon resignation or termination
   without cause, unvested shares are subject to buyback at face value.

4. TRANSFER RESTRICTIONS
   4.1 Right of First Refusal (ROFR)
       Before any Party transfers Shares to a third party, the other Parties have the right
       to purchase such Shares at the same price and terms.

   4.2 Tag-Along Rights
       If any Founder proposes to transfer more than [20]% of Shares, the Investor has the
       right to include a pro-rata portion of its Shares in the transfer.

   4.3 Drag-Along Rights
       If Parties holding more than [75]% of Shares approve a sale, all other Shareholders
       must participate in such sale on the same terms.

5. ANTI-DILUTION
   The Investor shall have broad-based weighted-average anti-dilution protection.

6. LIQUIDATION PREFERENCE
   Upon a Liquidity Event, the Investor shall receive [1x] non-participating liquidation
   preference before any distributions to Common shareholders.

7. INFORMATION RIGHTS
   The Company shall provide all Shareholders:
   (a) Monthly MIS reports
   (b) Quarterly audited financial statements
   (c) Annual audited accounts within 90 days of year-end

8. CONFIDENTIALITY
   All Parties shall keep confidential the terms of this Agreement and all non-public
   Company information.

9. NON-COMPETE & NON-SOLICIT
   Each Founder agrees not to engage in any competing business for [2] years after leaving
   the Company, and not to solicit Company employees for [1] year.

10. GOVERNING LAW
    This Agreement is governed by the laws of India. Disputes shall be resolved by arbitration
    in [CITY], India under the Arbitration and Conciliation Act, 1996.

SIGNATURES
____________________________    ____________________________    ____________________________
[FOUNDER 1]                     [FOUNDER 2]                     [INVESTOR REPRESENTATIVE]
Date: _______________           Date: _______________           Date: _______________""",


    "Term Sheet": """TERM SHEET — NON-BINDING

                        INDICATIVE TERM SHEET
           Proposed Investment in [COMPANY NAME]

Date:           [DATE]
Investors:      [LEAD INVESTOR NAME] and co-investors (collectively, "Investors")
Company:        [COMPANY NAME] ("Company")
Round Type:     Series [SEED / A / B]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INVESTMENT TERMS

Investment Amount:      INR [AMOUNT] ([AMOUNT in words])

Pre-Money Valuation:    INR [PRE-MONEY VALUATION]

Post-Money Valuation:   INR [POST-MONEY VALUATION]

Security Type:          Series [X] Compulsorily Convertible Preference Shares (CCPS)

Equity Offered:         [EQUITY %]% on a fully diluted post-money basis

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY TERMS

Liquidation Preference: [1x] non-participating preference on invested capital

Anti-Dilution:          Weighted-average broad-based anti-dilution protection

Board Seat:             Lead Investor appoints [1] Board director;
                        [1] observer seat for co-investors

Pro-Rata Rights:        Investors have pro-rata rights in future financing rounds

Information Rights:     Monthly MIS, Quarterly financials, Annual audited accounts

ROFR / Co-Sale:         Standard ROFR and co-sale rights for Investors

Drag-Along:             Majority shareholders may drag minority on agreed exit

Founder Vesting:        [4]-year vesting with [1]-year cliff for all Founder shares

ESOP Pool:              [10%] ESOP pool to be created prior to close (dilution pre-money)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONDITIONS TO CLOSE

1. Satisfactory completion of legal and financial due diligence
2. Execution of definitive transaction documents (SHA, SSA, Articles)
3. No material adverse change in Company's business or financials
4. Necessary regulatory and shareholder approvals

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXCLUSIVITY:        [45] days from date of signing this term sheet

GOVERNING LAW:      Laws of India; jurisdiction: [CITY]

THIS TERM SHEET IS NON-BINDING except for the Exclusivity and Confidentiality clauses.

Agreed and acknowledged:

Lead Investor: ____________________________    Company: ____________________________
Name: [INVESTOR NAME]                          Name: [FOUNDER NAME]
Date: _______________                          Title: [TITLE]
                                               Date: _______________""",


    "NDA": """NON-DISCLOSURE AGREEMENT (NDA)

This Non-Disclosure Agreement ("Agreement") is entered into as of [DATE]
between:

Disclosing Party:  [COMPANY / PERSON NAME], [Address] ("Disclosing Party")
Receiving Party:   [COMPANY / PERSON NAME], [Address] ("Receiving Party")

1. PURPOSE
   The parties wish to explore a potential business relationship ("Purpose") and may
   disclose confidential information to each other in connection with the Purpose.

2. CONFIDENTIAL INFORMATION
   "Confidential Information" means any non-public information disclosed by the
   Disclosing Party, including but not limited to: business plans, financials,
   technology, trade secrets, customer lists, and investment strategies.

3. OBLIGATIONS
   The Receiving Party shall:
   (a) Keep Confidential Information strictly confidential;
   (b) Not disclose it to any third party without prior written consent;
   (c) Use it solely for the Purpose;
   (d) Protect it with at least the same degree of care used for its own confidential
       information, but no less than reasonable care.

4. EXCLUSIONS
   The obligations above do not apply to information that:
   (a) Is or becomes publicly available through no breach of this Agreement;
   (b) Was already known to the Receiving Party prior to disclosure;
   (c) Is independently developed by the Receiving Party; or
   (d) Is required to be disclosed by law or court order.

5. TERM
   This Agreement shall remain in effect from the date hereof until [DATE] / [NUMBER]
   years from the Effective Date. Obligations survive termination for [2] years.

6. RETURN OF INFORMATION
   Upon request, the Receiving Party shall promptly return or destroy all Confidential
   Information and certify the same in writing.

7. GOVERNING LAW
   This Agreement is governed by the laws of India. Any dispute shall be subject to
   exclusive jurisdiction of courts in [CITY].

Disclosing Party: ____________________________   Receiving Party: ____________________________
Name: [NAME]                                     Name: [NAME]
Date: _______________                            Date: _______________""",


    "Board Resolution": """BOARD RESOLUTION

                    CERTIFIED COPY OF RESOLUTION OF THE BOARD OF DIRECTORS
                              OF [COMPANY NAME]
                    ("Company", CIN: [CIN], incorporated under the Companies Act, 2013)

Date of Meeting:   [DATE]
Time:              [TIME]
Venue:             [ADDRESS / Video Conference]
Directors Present: [LIST OF DIRECTORS]

QUORUM: A quorum being present, the meeting was duly called and held.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESOLUTION 1: [SUBJECT OF RESOLUTION]

RESOLVED THAT:
[Insert the operative part of the resolution here. Be specific about what is being
authorised, approved, or ratified.]

RESOLVED FURTHER THAT:
[Any additional or consequential resolution, e.g. authorising a director to sign
documents on behalf of the Company, or to file forms with the Registrar of Companies.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESOLUTION 2: [SUBJECT OF RESOLUTION] (if applicable)

RESOLVED THAT:
[...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

There being no other business, the meeting was concluded at [TIME].

Certified as a true copy:

____________________________
[DIRECTOR NAME]
Director (DIN: [DIN])
[COMPANY NAME]
Date: _______________""",
}


# ── Helper: get pre-built template ───────────────────────────────────────────

def get_category_template(doc_type: str, doc_category: str = "") -> str:
    """Return the pre-built template for doc_type, or the BASE_TEMPLATE as fallback."""
    return VC_TEMPLATES.get(doc_type, BASE_TEMPLATE)

def _get_model():
    """Lazily initialise the Gemini generative model."""
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured.")
    return genai.Client(api_key=settings.GEMINI_API_KEY)

def generate_agreement(
    prompt: str,
    doc_type: str,
    doc_category: str,
    title: Optional[str] = None,
) -> dict:
    """Generate a full agreement text + extract key points using Gemini."""
    client = _get_model()

    base = get_category_template(doc_type, doc_category)
    system_prompt = f"""You are a professional legal document drafting assistant for Suraksh Technologies.
    Respond with ONLY a valid JSON object, no markdown.

    Part 1: Draft a legal agreement based on:
    - User instruction: {prompt}
    - Document type: {doc_type}
    - Use this template as structure (fill in placeholders): {base[:2000]}

    Part 2: Extract key points. Return exactly this JSON structure:
    {{
        "content": "agreement text string",
        "key_points": {{
            "parties": ["list"],
            "key_terms": ["list"],
            "financial_terms": {{"valuation": "val", "investment_amount": "amt"}},
            "duration": "duration",
            "governing_law": "India",
            "summary": "summary string"
        }}
    }}"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=system_prompt
    )

    raw = response.text.strip()
    raw = re.sub(r"^```json\n?|\n?```$", "", raw, flags=re.MULTILINE)

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        data = json.loads(match.group()) if match else {}

    content = data.get("content", "").replace("\\n", "\n")
    return {"content": content, "key_points": data.get("key_points", {})}

def analyze_agreement(content: str, doc_type: str) -> dict:
    """
    Analyze an agreement from the COMPANY / ADMIN perspective — focuses on
    how well the agreement protects the company's interests, legal quality,
    risk exposure, and completeness.
    """
    client = _get_model()

    system_prompt = f"""You are a senior legal counsel reviewing a {doc_type} on behalf of a company (Suraksh Technologies).
Your job is to assess the quality and protection this agreement offers TO THE COMPANY.
Focus on: company liability, missing clauses that protect the company, legal enforceability, and commercial risks.

Return ONLY a valid JSON object with this exact structure:
{{
    "score": 75,
    "summary": "2-3 sentence overview of the agreement quality from the company perspective",
    "strengths": ["clause or aspect that protects the company well 1", "strength 2", "strength 3"],
    "gaps": ["missing clause or protection for the company 1", "gap 2", "gap 3"],
    "risks": ["legal or commercial risk to the company 1", "risk 2"],
    "suggestions": ["improvement to better protect the company 1", "suggestion 2", "suggestion 3"]
}}

Scoring guide: 90-100 excellent, 70-89 good, 50-69 needs work, below 50 major issues.

AGREEMENT TEXT:
{content[:6000]}"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=system_prompt
    )

    raw = response.text.strip()
    raw = re.sub(r"^```json\n?|\n?```$", "", raw, flags=re.MULTILINE)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        return json.loads(match.group()) if match else {}

def scan_aadhaar_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Use Gemini Vision to scan an Aadhaar card image.
    Extracts the 12-digit Aadhaar number and provides an accuracy/confidence score.

    Returns:
        {
            "aadhaar_number": "1234 5678 9012",
            "last4": "9012",
            "name": "Holder Name or null",
            "dob": "DD/MM/YYYY or null",
            "gender": "Male/Female or null",
            "confidence_score": 85,   # 0-100
            "is_valid_format": True,
            "notes": "brief quality note"
        }
    """
    from google.genai import types as genai_types
    client = _get_model()

    prompt = """Analyze this Aadhaar card image carefully.

Extract the following:
1. The 12-digit Aadhaar number (usually printed in large digits, format: XXXX XXXX XXXX).
2. Card holder's name (if clearly visible).
3. Date of birth (format: DD/MM/YYYY, if visible).
4. Gender (Male / Female / Transgender, if visible).

Also give a confidence/accuracy score (0-100) based on:
- Document clarity and readability (40 pts)
- Aadhaar number is visible and valid 12-digit format (30 pts)
- Document appears authentic and unaltered (30 pts)

Scoring guide:
90-100: Clear, readable, authentic-looking Aadhaar
70-89: Mostly clear, minor readability issues
50-69: Partially obscured or low quality
Below 50: Cannot reliably read or does not appear to be an Aadhaar

Return ONLY a valid JSON object with NO markdown or code fences:
{
    "aadhaar_number": "1234 5678 9012",
    "last4": "9012",
    "name": "Full Name or null",
    "dob": "DD/MM/YYYY or null",
    "gender": "Male or null",
    "confidence_score": 85,
    "is_valid_format": true,
    "notes": "Document is clear and readable"
}

If you cannot find an Aadhaar number, set aadhaar_number and last4 to null and confidence_score to 0."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            genai_types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt,
        ],
    )

    raw = response.text.strip()
    raw = re.sub(r"^```json\n?|\n?```$", "", raw, flags=re.MULTILINE)

    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        result = json.loads(match.group()) if match else {}

    result.setdefault("confidence_score", 0)
    result.setdefault("aadhaar_number", None)
    result.setdefault("last4", None)
    result.setdefault("is_valid_format", False)
    result.setdefault("notes", "")
    return result

def analyze_agreement_user(content: str, doc_type: str) -> dict:
    """
    Analyze an agreement from the USER / PERSONAL perspective — focuses on
    what the individual signing should know: their rights, personal risks,
    unfair clauses, and what to negotiate or watch out for before signing.
    """
    client = _get_model()

    system_prompt = f"""You are a personal legal advisor reviewing a {doc_type} on behalf of an individual about to sign this document.
Your job is to explain what this agreement means FOR THE INDIVIDUAL — their rights, obligations, risks, and anything they must clarify or negotiate before signing.
Write in plain English. Be direct about anything that could harm the individual.

Return ONLY a valid JSON object with this exact structure:
{{
    "score": 75,
    "summary": "2-3 sentence plain-English overview of what you are agreeing to and any immediate red flags",
    "strengths": ["clause that benefits you personally 1", "benefit 2", "benefit 3"],
    "gaps": ["clause missing that should protect your personal interests 1", "gap 2", "gap 3"],
    "risks": ["personal risk or obligation you are taking on 1", "risk 2"],
    "suggestions": ["what you should negotiate or clarify before signing 1", "suggestion 2", "suggestion 3"]
}}

Scoring guide (from individual's perspective): 90-100 very fair, 70-89 mostly fair, 50-69 some concerns, below 50 significant red flags.

AGREEMENT TEXT:
{content[:6000]}"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=system_prompt
    )

    raw = response.text.strip()
    raw = re.sub(r"^```json\n?|\n?```$", "", raw, flags=re.MULTILINE)

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        return json.loads(match.group()) if match else {}