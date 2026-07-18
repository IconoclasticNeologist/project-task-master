// State court-protection cards — extracted VERBATIM (values, notes, citations)
// from the verified research dossier (docs/research/perplexity-outbox, per-
// jurisdiction dataset, last_verified 2026-07). Fields whose status was not
// "ok" are omitted — a null was preferred over a guess at research time, and
// the same honesty holds here. English-first like the narration; the UI
// chrome is bilingual and the advocate-confirm note always shows.

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
        label: "Money help (victim compensation)",
        value: "California Victim Compensation Board (CalVCB) compensation program.",
        notes:
          "CalVCB pays certain crime-related expenses (medical, counseling, relocation, funeral, etc.) for eligible victims; applications generally due within seven years of crime or later discovery, with limited late consideration.",
        citation: "CalVCB \u2013 How to Get Compensated.",
        url: "https://victims.ca.gov/for-victims/how-compensation-works/",
      },
      {
        key: "address_confidentiality_program",
        label: "Keeping your address confidential",
        value: "Safe at Home confidential address program run by California Secretary of State.",
        notes:
          "Provides substitute address and mail forwarding for eligible victims (including domestic violence, sexual assault, stalking, trafficking) to protect residential location; enrollment via application through Secretary of State.",
        citation: "Safe at Home Confidential Address Program FAQ.",
        url: "https://www.sos.ca.gov/registries/safe-home/frequently-asked-questions",
      },
      {
        key: "victim_witness_assistance_contact",
        label: "The victim-witness office",
        value: "County Victim Witness Assistance Centers coordinated through CalVCB.",
        notes:
          "CalVCB works with local victim-witness centers where advocates help victims apply for compensation and find emergency support; contact details vary by county.",
        citation: "CalVCB \u2013 For Victims (advocates and Witness Assistance Centers).",
        url: "https://victims.ca.gov/for-victims/",
      },
      {
        key: "local_trafficking_help",
        label: "Trafficking help in this state",
        value:
          "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving California.",
        notes:
          "Provides confidential help and referrals to California trafficking services; available 24/7 with interpreter access.",
        citation: "National Human Trafficking Hotline \u2013 Get Help.",
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
        notes:
          "Provides confidential help and referrals for trafficking survivors in the District of Columbia.",
        citation: "National Human Trafficking Hotline \u2013 Get Help.",
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
        notes: "Provides confidential help and referrals for trafficking survivors in Florida.",
        citation: "National Human Trafficking Hotline \u2013 Get Help.",
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
        label: "Money help (victim compensation)",
        value:
          "Victim Compensation program administered by New York Office of Victim Services (OVS).",
        notes:
          "OVS may reimburse certain crime-related expenses (medical, counseling, funeral, lost wages, etc.) for crimes occurring in New York State; eligibility and claim steps are described on OVS site.",
        citation: "OVS \u2013 Victim Compensation.",
        url: "https://ovs.ny.gov/victim-compensation",
      },
      {
        key: "address_confidentiality_program",
        label: "Keeping your address confidential",
        value: "New York State Address Confidentiality Program (ACP) run by Department of State.",
        notes:
          "Provides substitute mailing address and mail forwarding for eligible victims of domestic violence, stalking, sexual offences, and human trafficking; participation lasts four years and is governed by Executive Law \u00a7 108 and related regulations.",
        citation: "NYS ACP \u2013 program page; Executive Law \u00a7 108.",
        url: "https://dos.ny.gov/ACP",
      },
      {
        key: "victim_witness_assistance_contact",
        label: "The victim-witness office",
        value: "New York Office of Victim Services and local Victim Assistance Programs (VAPs).",
        notes:
          "OVS funds and supports more than 200 VAPs across New York State; victims can connect with programs via OVS Resource Connect for counseling, advocacy, shelter, and other services.",
        citation: "OVS \u2013 main site and program overview.",
        url: "https://ovs.ny.gov",
      },
      {
        key: "local_trafficking_help",
        label: "Trafficking help in this state",
        value: "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving New York.",
        notes:
          "Provides confidential help and referrals to New York trafficking programs; free, 24/7.",
        citation: "National Human Trafficking Hotline \u2013 Get Help.",
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
        value:
          "Court may allow a qualified facility or therapy dog to accompany a witness during testimony.",
        notes:
          "Any party may petition at least 14 days before the proceeding; court must find the dog will assist the witness and that liability insurance is in place; handler must accompany the dog.",
        citation:
          "Tex. Gov\u2019t Code \u00a7 21.012 (Presence of Qualified Facility Dog or Qualified Therapy Dog in Court Proceeding).",
        url: "https://www.animallaw.info/statute/tx-facility-dog-\u00a7-21012-presence-qualified-facility-dog-or-qualified-therapy-dog-court",
      },
      {
        key: "sexual_history_shield_rule",
        label: "Limits on questions about sexual history",
        value:
          "Texas rape-shield protections in Rule of Evidence 412 and new Art. 38.372 for trafficking and sexual offences.",
        notes:
          "Rule 412 generally bars reputation/opinion and most specific-instance evidence of a victim\u2019s past sexual behavior; Art. 38.372 adds in-camera review and balancing test, including for trafficking victims.",
        citation:
          "Tex. R. Evid. 412; Tex. Code Crim. Proc. Art. 38.372 (Evidence of Victim\u2019s Past Sexual Behavior).",
        url: "https://capitol.texas.gov/tlodocs/89R/analysis/html/SB00535S.htm",
      },
      {
        key: "victim_compensation_program",
        label: "Money help (victim compensation)",
        value:
          "Crime Victims\u2019 Compensation (CVC) Program run by Texas Office of the Attorney General.",
        notes:
          "Provides reimbursement for certain crime-related expenses (medical, counseling, relocation, funeral, etc.) for eligible victims; must generally apply within three years of the crime, with some extensions.",
        citation: "Texas Crime Victims\u2019 Compensation Program overview.",
        url: "https://texaslawhelp.org/article/crime-victims-compensation-cvc-program",
      },
      {
        key: "address_confidentiality_program",
        label: "Keeping your address confidential",
        value:
          "Texas address confidentiality program for certain victims, referenced in Art. 58.052 and AG materials.",
        notes:
          "Provides substitute address and mail forwarding for eligible victims (including some trafficking survivors) to protect residential address; exact enrollment process and eligibility should be confirmed from Attorney General\u2019s official program page.",
        citation:
          "Summary of address confidentiality and pseudonym rights referencing Tex. Code Crim. Proc. Art. 58.102, 58.052.",
        url: "https://www.tamuv.edu/title-ix/resources/criminal-justice/",
      },
      {
        key: "victim_witness_assistance_contact",
        label: "The victim-witness office",
        value:
          "Local victim assistance coordinators in each prosecutor\u2019s office; statewide VOCA contacts via OVC.",
        notes:
          "Texas law requires each attorney representing the state to designate a victim assistance coordinator; OVC lists state VOCA victim assistance and compensation contacts (Governor\u2019s Public Safety Office, AG Crime Victims\u2019 Compensation Program).",
        citation: "Tex. Code Crim. Proc. Art. 56.04; OVC Texas state support listing.",
        url: "https://ovc.ojp.gov/states/texas",
      },
      {
        key: "local_trafficking_help",
        label: "Trafficking help in this state",
        value: "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving Texas.",
        notes:
          "Provides confidential help, safety planning, and referrals to local Texas services for trafficking survivors; available 24/7 with interpreter access.",
        citation: "National Human Trafficking Hotline \u2013 Get Help.",
        url: "https://humantraffickinghotline.org/en/get-help",
      },
    ],
  },
];
