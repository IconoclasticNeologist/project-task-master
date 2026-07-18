// State court-protection cards, built from the verified research dossier
// (docs/research/perplexity-outbox, per-jurisdiction dataset, last_verified
// 2026-07). Only fields with an "ok" verification status appear — a null beat
// a guess at research time, and the same honesty holds here.
//
// The VALUES and NOTES are retold in the app's own register (plain words,
// experience-based — "victim" appears only inside official program and statute
// names a person will actually encounter). CITATIONS are verbatim from the
// dossier. English-first like the narration; the UI chrome is bilingual and
// the advocate-confirm note always shows.

export interface ProtectionCard {
  key: string;
  label: string;
  value: string;
  notes: string;
  citation: string;
  url: string;
}

export interface StateProtections {
  jurisdiction: string;
  postal: string;
  lastVerified: string;
  cards: ProtectionCard[];
}

export const STATE_PROTECTIONS: readonly StateProtections[] = [
  {
    jurisdiction: "California",
    postal: "CA",
    lastVerified: "2026-07",
    cards: [
      {
        key: "victim_compensation_program",
        label: "Money help (compensation)",
        value: "California's official program (CalVCB) can pay some costs a crime caused.",
        notes:
          "It can help with things like counseling, medical bills, moving, or a funeral. There is an application, and time limits apply — usually within seven years. An advocate can help you apply.",
        citation: "CalVCB – How to Get Compensated.",
        url: "https://victims.ca.gov/for-victims/how-compensation-works/",
      },
      {
        key: "address_confidentiality_program",
        label: "Keeping your address confidential",
        value: "Safe at Home — the state's confidential address program.",
        notes:
          "It gives you a substitute mailing address and forwards your mail, so your real address stays private. People who lived through trafficking can qualify. You enroll through the Secretary of State, and an advocate can help.",
        citation: "Safe at Home Confidential Address Program FAQ.",
        url: "https://www.sos.ca.gov/registries/safe-home/frequently-asked-questions",
      },
      {
        key: "victim_witness_assistance_contact",
        label: "The victim-witness office",
        value: "Every county has a Victim Witness Assistance Center.",
        notes:
          "Advocates there help with the compensation application and with finding emergency support. The center's contact depends on your county.",
        citation: "CalVCB – For Victims (advocates and Witness Assistance Centers).",
        url: "https://victims.ca.gov/for-victims/",
      },
      {
        key: "local_trafficking_help",
        label: "Trafficking help in this state",
        value:
          "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving California.",
        notes:
          "Free, confidential help and referrals to California services — any hour, with interpreters.",
        citation: "National Human Trafficking Hotline – Get Help.",
        url: "https://humantraffickinghotline.org/en/get-help",
      },
    ],
  },
  {
    jurisdiction: "District of Columbia",
    postal: "DC",
    lastVerified: "2026-07",
    cards: [
      {
        key: "local_trafficking_help",
        label: "Trafficking help in this state",
        value: "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving D.C.",
        notes: "Free, confidential help and referrals to services in the District — any hour.",
        citation: "National Human Trafficking Hotline – Get Help.",
        url: "https://humantraffickinghotline.org/en/get-help",
      },
    ],
  },
  {
    jurisdiction: "Florida",
    postal: "FL",
    lastVerified: "2026-07",
    cards: [
      {
        key: "local_trafficking_help",
        label: "Trafficking help in this state",
        value: "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving Florida.",
        notes: "Free, confidential help and referrals to Florida services — any hour.",
        citation: "National Human Trafficking Hotline – Get Help.",
        url: "https://humantraffickinghotline.org/en/get-help",
      },
    ],
  },
  {
    jurisdiction: "New York",
    postal: "NY",
    lastVerified: "2026-07",
    cards: [
      {
        key: "victim_compensation_program",
        label: "Money help (compensation)",
        value: "New York's Office of Victim Services runs the state compensation program.",
        notes:
          "It can pay some costs a crime caused — like counseling, medical bills, lost wages, or a funeral — for crimes that happened in New York. An advocate can help you apply.",
        citation: "OVS – Victim Compensation.",
        url: "https://ovs.ny.gov/victim-compensation",
      },
      {
        key: "address_confidentiality_program",
        label: "Keeping your address confidential",
        value: "New York's Address Confidentiality Program (ACP).",
        notes:
          "It gives you a substitute mailing address and forwards your mail so your real address stays private. People who lived through trafficking can qualify; enrollment lasts four years at a time.",
        citation: "NYS ACP – program page; Executive Law § 108.",
        url: "https://dos.ny.gov/ACP",
      },
      {
        key: "victim_witness_assistance_contact",
        label: "The victim-witness office",
        value: "New York's Office of Victim Services and local Victim Assistance Programs.",
        notes:
          "The state supports more than 200 local programs for counseling, advocacy, shelter, and more. OVS's Resource Connect helps you find the one near you.",
        citation: "OVS – main site and program overview.",
        url: "https://ovs.ny.gov",
      },
      {
        key: "local_trafficking_help",
        label: "Trafficking help in this state",
        value: "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving New York.",
        notes: "Free, confidential help and referrals to New York programs — any hour.",
        citation: "National Human Trafficking Hotline – Get Help.",
        url: "https://humantraffickinghotline.org/en/get-help",
      },
    ],
  },
  {
    jurisdiction: "Texas",
    postal: "TX",
    lastVerified: "2026-07",
    cards: [
      {
        key: "facility_dog_or_support_animal",
        label: "A trained facility dog beside the stand",
        value: "A judge can allow a trained facility dog to sit with you while you testify.",
        notes:
          "The request goes to the court at least 14 days ahead — your advocate or the prosecutor's office can ask for you. The dog's handler stays close by.",
        citation:
          "Tex. Gov’t Code § 21.012 (Presence of Qualified Facility Dog or Qualified Therapy Dog in Court Proceeding).",
        url: "https://www.animallaw.info/statute/tx-facility-dog-§-21012-presence-qualified-facility-dog-or-qualified-therapy-dog-court",
      },
      {
        key: "sexual_history_shield_rule",
        label: "Limits on questions about sexual history",
        value: "Texas law sharply limits questions about your sexual history in court.",
        notes:
          "Rule of Evidence 412 blocks most questions about a person's past sexual behavior, and a newer law adds a private review by the judge before any exception — including in trafficking cases. Your lawyer or the prosecutor can object for you.",
        citation:
          "Tex. R. Evid. 412; Tex. Code Crim. Proc. Art. 38.372 (Evidence of Victim’s Past Sexual Behavior).",
        url: "https://capitol.texas.gov/tlodocs/89R/analysis/html/SB00535S.htm",
      },
      {
        key: "victim_compensation_program",
        label: "Money help (compensation)",
        value: "The Crime Victims’ Compensation Program, run by the Texas Attorney General.",
        notes:
          "It can pay some costs a crime caused — like counseling, medical bills, moving, or a funeral. Applications are usually due within three years, with some exceptions. An advocate can help you apply.",
        citation: "Texas Crime Victims’ Compensation Program overview.",
        url: "https://texaslawhelp.org/article/crime-victims-compensation-cvc-program",
      },
      {
        key: "address_confidentiality_program",
        label: "Keeping your address confidential",
        value: "Texas has an address confidentiality program.",
        notes:
          "It gives a substitute address and forwards mail so your real address stays private; people who lived through trafficking can qualify. The Attorney General's office has the exact steps — your advocate can confirm them with you.",
        citation:
          "Summary of address confidentiality and pseudonym rights referencing Tex. Code Crim. Proc. Art. 58.102, 58.052.",
        url: "https://www.tamuv.edu/title-ix/resources/criminal-justice/",
      },
      {
        key: "victim_witness_assistance_contact",
        label: "The victim-witness office",
        value: "Every Texas prosecutor's office has a victim assistance coordinator.",
        notes:
          "State law requires it — this person helps with rights, logistics, and referrals. The federal OVC page lists the statewide contacts too.",
        citation: "Tex. Code Crim. Proc. Art. 56.04; OVC Texas state support listing.",
        url: "https://ovc.ojp.gov/states/texas",
      },
      {
        key: "local_trafficking_help",
        label: "Trafficking help in this state",
        value: "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving Texas.",
        notes:
          "Free, confidential help, safety planning, and referrals to local Texas services — any hour, with interpreters.",
        citation: "National Human Trafficking Hotline – Get Help.",
        url: "https://humantraffickinghotline.org/en/get-help",
      },
    ],
  },
];
