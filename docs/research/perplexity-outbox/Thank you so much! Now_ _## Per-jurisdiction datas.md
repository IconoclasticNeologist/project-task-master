<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Thank you so much! Now:

## Per-jurisdiction dataset for a "select your location" picker

> I need a **structured, machine-readable dataset** of the court-related rights
> and procedures that matter to an **adult human-trafficking survivor preparing to
> testify in criminal court**, broken down **per jurisdiction**, so I can build a
> "select your state or country" picker in an app. This is educational only, not
> legal advice.
>
> Produce the data as **JSON**, one object per jurisdiction, using **exactly** the
> schema below. Do the U.S. first: all **50 states + D.C.** (add Puerto Rico and
> other territories if you can verify them). Then the following countries:
> United Kingdom, Ireland, Canada, Australia, New Zealand, Germany, France, Spain,
> Italy, Netherlands, Sweden, Mexico, Brazil, India, Philippines, Nigeria, Kenya,
> South Africa, and the EU as a bloc.
>
> **Work in batches** (e.g., 5–10 jurisdictions per reply) so nothing is
> truncated; I'll say "continue" between batches. Keep the schema identical across
> every batch.
>
> **Rules:**
> - Every non-empty field must carry a **source**: a citation string and a direct
>   URL, inside the field's `source` object.
> - If you cannot verify a field for a jurisdiction, set its `value` to `null` and
>   set `status` to `"unknown"`. **Never guess or infer.** A `null` is more useful
>   to me than a wrong answer.
> - Add a top-level `last_verified` date and a `confidence` of
>   `"high" | "medium" | "low"` per jurisdiction.
> - Keep each `value` short and plain-language; put the precise legal detail in
>   `notes`.
>
> Schema (per jurisdiction):
>
> ```json > { >   "jurisdiction": "Texas", >   "level": "us_state",              // "us_state" | "us_territory" | "country" | "bloc" >   "iso_or_postal": "US-TX", >   "last_verified": "2026-07", >   "confidence": "medium", >   "fields": { >     "victims_rights_source": { "value": "", "notes": "", "status": "ok", "source": { "citation": "", "url": "" } }, >     "sexual_history_shield_rule": { "value": "", "notes": "procedure to invoke: notice period, in-camera hearing", "status": "ok", "source": { "citation": "", "url": "" } }, >     "support_person_in_courtroom": { "value": "", "notes": "allowed? limits if support person is also a witness", "status": "ok", "source": { "citation": "", "url": "" } }, >     "facility_dog_or_support_animal": { "value": "", "notes": "", "status": "ok", "source": { "citation": "", "url": "" } }, >     "remote_or_shielded_testimony_adult": { "value": "", "notes": "CCTV / screen / remote for adult vulnerable witnesses; legal standard", "status": "ok", "source": { "citation": "", "url": "" } }, >     "interpreter_provision": { "value": "", "notes": "who provides/pays; how to request", "status": "ok", "source": { "citation": "", "url": "" } }, >     "disability_accommodation_process": { "value": "", "notes": "ADA/equivalent; coordinator or form; deadline", "status": "ok", "source": { "citation": "", "url": "" } }, >     "victim_compensation_program": { "value": "", "notes": "eligibility basics; application deadline", "status": "ok", "source": { "citation": "", "url": "" } }, >     "address_confidentiality_program": { "value": "", "notes": "e.g., Safe at Home; how to enroll", "status": "ok", "source": { "citation": "", "url": "" } }, >     "trafficking_statute_of_limitations": { "value": "", "notes": "", "status": "ok", "source": { "citation": "", "url": "" } }, >     "victim_witness_assistance_contact": { "value": "", "notes": "official office name + how to reach", "status": "ok", "source": { "citation": "", "url": "" } }, >     "local_trafficking_help": { "value": "", "notes": "state coalition or national hotline serving this jurisdiction", "status": "ok", "source": { "citation": "", "url": "" } } >   } > } > ```
>
> For each field, `status` is `"ok"` when you have a verified source, or
> `"unknown"` when you don't (with `value: null`). Prefer primary sources
> (statutes, court rules, official court/AG/victim-services sites) over secondary
> ones, and say so in the citation. For non-U.S. jurisdictions, map each field to
> the nearest local equivalent and note the local term in `notes`.
>
> After the final batch, give me one flat summary table (jurisdiction × field)
> showing just `ok` / `unknown` per cell, so I can see coverage at a glance.

[
{
"jurisdiction": "Texas",
"level": "us_state",
"iso_or_postal": "US-TX",
"last_verified": "2026-07",
"confidence": "medium",
"fields": {
"victims_rights_source": {
"value": "Crime victims’ rights in Texas Code of Criminal Procedure Chapter 56A.",
"notes": "Includes general rights (Art. 56A.051) and specific rights for sexual assault, stalking, trafficking victims (Art. 56A.021).",
"status": "ok",
"source": {
"citation": "Tex. Code Crim. Proc. ch. 56A, esp. Arts. 56A.051, 56A.021 (Crime Victims’ Rights).",
"url": "https://statutes.capitol.texas.gov/Docs/CR/htm/CR.56A.htm"
}
},
"sexual_history_shield_rule": {
"value": "Texas rape-shield protections in Rule of Evidence 412 and new Art. 38.372 for trafficking and sexual offences.",
"notes": "Rule 412 generally bars reputation/opinion and most specific-instance evidence of a victim’s past sexual behavior; Art. 38.372 adds in-camera review and balancing test, including for trafficking victims.",
"status": "ok",
"source": {
"citation": "Tex. R. Evid. 412; Tex. Code Crim. Proc. Art. 38.372 (Evidence of Victim’s Past Sexual Behavior).",
"url": "https://capitol.texas.gov/tlodocs/89R/analysis/html/SB00535S.htm"
}
},
"support_person_in_courtroom": {
"value": null,
"notes": "",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"facility_dog_or_support_animal": {
"value": "Court may allow a qualified facility or therapy dog to accompany a witness during testimony.",
"notes": "Any party may petition at least 14 days before the proceeding; court must find the dog will assist the witness and that liability insurance is in place; handler must accompany the dog.",
"status": "ok",
"source": {
"citation": "Tex. Gov’t Code § 21.012 (Presence of Qualified Facility Dog or Qualified Therapy Dog in Court Proceeding).",
"url": "https://www.animallaw.info/statute/tx-facility-dog-§-21012-presence-qualified-facility-dog-or-qualified-therapy-dog-court"
}
},
"remote_or_shielded_testimony_adult": {
"value": null,
"notes": "No verified Texas-wide statute or rule specifically authorizing screens/CCTV for adult vulnerable witnesses beyond general evidentiary and procedural provisions.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"interpreter_provision": {
"value": null,
"notes": "Court interpreter and language-access rules for adult witnesses not verified at statewide level.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"disability_accommodation_process": {
"value": null,
"notes": "Specific ADA accommodation process for Texas courts (coordinator, forms, deadlines) not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_compensation_program": {
"value": "Crime Victims’ Compensation (CVC) Program run by Texas Office of the Attorney General.",
"notes": "Provides reimbursement for certain crime-related expenses (medical, counseling, relocation, funeral, etc.) for eligible victims; must generally apply within three years of the crime, with some extensions.",
"status": "ok",
"source": {
"citation": "Texas Crime Victims’ Compensation Program overview.",
"url": "https://texaslawhelp.org/article/crime-victims-compensation-cvc-program"
}
},
"address_confidentiality_program": {
"value": "Texas address confidentiality program for certain victims, referenced in Art. 58.052 and AG materials.",
"notes": "Provides substitute address and mail forwarding for eligible victims (including some trafficking survivors) to protect residential address; exact enrollment process and eligibility should be confirmed from Attorney General’s official program page.",
"status": "ok",
"source": {
"citation": "Summary of address confidentiality and pseudonym rights referencing Tex. Code Crim. Proc. Art. 58.102, 58.052.",
"url": "https://www.tamuv.edu/title-ix/resources/criminal-justice/"
}
},
"trafficking_statute_of_limitations": {
"value": null,
"notes": "Specific statute of limitations for state human-trafficking offences (e.g., Tex. Penal Code §§ 20A.02 et seq.) not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_witness_assistance_contact": {
"value": "Local victim assistance coordinators in each prosecutor’s office; statewide VOCA contacts via OVC.",
"notes": "Texas law requires each attorney representing the state to designate a victim assistance coordinator; OVC lists state VOCA victim assistance and compensation contacts (Governor’s Public Safety Office, AG Crime Victims’ Compensation Program).",
"status": "ok",
"source": {
"citation": "Tex. Code Crim. Proc. Art. 56.04; OVC Texas state support listing.",
"url": "https://ovc.ojp.gov/states/texas"
}
},
"local_trafficking_help": {
"value": "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving Texas.",
"notes": "Provides confidential help, safety planning, and referrals to local Texas services for trafficking survivors; available 24/7 with interpreter access.",
"status": "ok",
"source": {
"citation": "National Human Trafficking Hotline – Get Help.",
"url": "https://humantraffickinghotline.org/en/get-help"
}
}
}
},
{
"jurisdiction": "California",
"level": "us_state",
"iso_or_postal": "US-CA",
"last_verified": "2026-07",
"confidence": "medium",
"fields": {
"victims_rights_source": {
"value": "Marsy’s Law (Victims’ Bill of Rights) in California Constitution Article I, section 28.",
"notes": "Provides broad victims’ rights to notice, presence, safety, participation, and restitution in criminal, juvenile, and parole matters.",
"status": "ok",
"source": {
"citation": "Cal. Const. art. I, § 28; CA DOJ Marsy’s Law overview.",
"url": "https://oag.ca.gov/victimservices/marsys_law"
}
},
"sexual_history_shield_rule": {
"value": null,
"notes": "California’s rape-shield and sexual-history rules (e.g., Evidence Code provisions for sexual-offence cases) not verified here.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"support_person_in_courtroom": {
"value": null,
"notes": "Specific statute allowing support persons for adult sexual-assault or trafficking witnesses (e.g., Penal Code § 868.5) not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"facility_dog_or_support_animal": {
"value": null,
"notes": "No statewide California statute on facility dogs with adult witnesses verified; some counties may use facility dogs by local practice.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"remote_or_shielded_testimony_adult": {
"value": null,
"notes": "Use of CCTV, screens, or other testimonial aids for adult vulnerable witnesses in California criminal courts not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"interpreter_provision": {
"value": null,
"notes": "Specific California rules on court interpreters for witnesses (who provides/pays, criminal vs civil) not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"disability_accommodation_process": {
"value": null,
"notes": "California statewide court ADA accommodation process (forms, coordinators) not verified here.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_compensation_program": {
"value": "California Victim Compensation Board (CalVCB) compensation program.",
"notes": "CalVCB pays certain crime-related expenses (medical, counseling, relocation, funeral, etc.) for eligible victims; applications generally due within seven years of crime or later discovery, with limited late consideration.",
"status": "ok",
"source": {
"citation": "CalVCB – How to Get Compensated.",
"url": "https://victims.ca.gov/for-victims/how-compensation-works/"
}
},
"address_confidentiality_program": {
"value": "Safe at Home confidential address program run by California Secretary of State.",
"notes": "Provides substitute address and mail forwarding for eligible victims (including domestic violence, sexual assault, stalking, trafficking) to protect residential location; enrollment via application through Secretary of State.",
"status": "ok",
"source": {
"citation": "Safe at Home Confidential Address Program FAQ.",
"url": "https://www.sos.ca.gov/registries/safe-home/frequently-asked-questions"
}
},
"trafficking_statute_of_limitations": {
"value": null,
"notes": "Specific California statute of limitations for human-trafficking offences not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_witness_assistance_contact": {
"value": "County Victim Witness Assistance Centers coordinated through CalVCB.",
"notes": "CalVCB works with local victim-witness centers where advocates help victims apply for compensation and find emergency support; contact details vary by county.",
"status": "ok",
"source": {
"citation": "CalVCB – For Victims (advocates and Witness Assistance Centers).",
"url": "https://victims.ca.gov/for-victims/"
}
},
"local_trafficking_help": {
"value": "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving California.",
"notes": "Provides confidential help and referrals to California trafficking services; available 24/7 with interpreter access.",
"status": "ok",
"source": {
"citation": "National Human Trafficking Hotline – Get Help.",
"url": "https://humantraffickinghotline.org/en/get-help"
}
}
}
},
{
"jurisdiction": "New York",
"level": "us_state",
"iso_or_postal": "US-NY",
"last_verified": "2026-07",
"confidence": "medium",
"fields": {
"victims_rights_source": {
"value": "Crime victims’ rights and services summarized by New York Office of Victim Services (OVS).",
"notes": "New York rights are spread across multiple statutes; OVS provides information on financial relief and access to more than 200 Victim Assistance Programs.",
"status": "ok",
"source": {
"citation": "Office of Victim Services – main site.",
"url": "https://ovs.ny.gov"
}
},
"sexual_history_shield_rule": {
"value": null,
"notes": "Specific New York rape-shield and sexual-history rules for adult criminal proceedings not verified in this dataset.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"support_person_in_courtroom": {
"value": null,
"notes": "No statewide statute on support persons for adult trafficking or sexual-assault witnesses verified here; practices may vary by court.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"facility_dog_or_support_animal": {
"value": null,
"notes": "No New York statute on courthouse facility dogs for adult witnesses verified; local practices may exist but are not captured here.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"remote_or_shielded_testimony_adult": {
"value": null,
"notes": "Specific New York provisions for adult vulnerable witnesses to use CCTV, screens, or remote testimony in criminal court not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"interpreter_provision": {
"value": null,
"notes": "Statewide rules for court interpreters for adult witnesses in New York criminal proceedings not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"disability_accommodation_process": {
"value": null,
"notes": "Specific process for disability accommodations (ADA/equivalent) in New York courts not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_compensation_program": {
"value": "Victim Compensation program administered by New York Office of Victim Services (OVS).",
"notes": "OVS may reimburse certain crime-related expenses (medical, counseling, funeral, lost wages, etc.) for crimes occurring in New York State; eligibility and claim steps are described on OVS site.",
"status": "ok",
"source": {
"citation": "OVS – Victim Compensation.",
"url": "https://ovs.ny.gov/victim-compensation"
}
},
"address_confidentiality_program": {
"value": "New York State Address Confidentiality Program (ACP) run by Department of State.",
"notes": "Provides substitute mailing address and mail forwarding for eligible victims of domestic violence, stalking, sexual offences, and human trafficking; participation lasts four years and is governed by Executive Law § 108 and related regulations.",
"status": "ok",
"source": {
"citation": "NYS ACP – program page; Executive Law § 108.",
"url": "https://dos.ny.gov/ACP"
}
},
"trafficking_statute_of_limitations": {
"value": null,
"notes": "Specific statute of limitations for New York human-trafficking offences not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_witness_assistance_contact": {
"value": "New York Office of Victim Services and local Victim Assistance Programs (VAPs).",
"notes": "OVS funds and supports more than 200 VAPs across New York State; victims can connect with programs via OVS Resource Connect for counseling, advocacy, shelter, and other services.",
"status": "ok",
"source": {
"citation": "OVS – main site and program overview.",
"url": "https://ovs.ny.gov"
}
},
"local_trafficking_help": {
"value": "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving New York.",
"notes": "Provides confidential help and referrals to New York trafficking programs; free, 24/7.",
"status": "ok",
"source": {
"citation": "National Human Trafficking Hotline – Get Help.",
"url": "https://humantraffickinghotline.org/en/get-help"
}
}
}
},
{
"jurisdiction": "District of Columbia",
"level": "us_state",
"iso_or_postal": "US-DC",
"last_verified": "2026-07",
"confidence": "low",
"fields": {
"victims_rights_source": {
"value": null,
"notes": "District of Columbia-specific crime victims’ rights statutes and summaries not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"sexual_history_shield_rule": {
"value": null,
"notes": "No verified District of Columbia rape-shield/sexual-history rule for adult criminal proceedings in this dataset.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"support_person_in_courtroom": {
"value": null,
"notes": "Support person rules for adult trafficking survivors in D.C. criminal court not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"facility_dog_or_support_animal": {
"value": null,
"notes": "No D.C. statute on facility dogs/support animals with witnesses verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"remote_or_shielded_testimony_adult": {
"value": null,
"notes": "Use of CCTV, screens, or remote testimony for adult vulnerable witnesses in D.C. criminal proceedings not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"interpreter_provision": {
"value": null,
"notes": "Interpreter provision for witnesses in D.C. criminal courts (who provides/pays, request process) not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"disability_accommodation_process": {
"value": null,
"notes": "D.C. court ADA/disability-accommodation process not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_compensation_program": {
"value": null,
"notes": "District of Columbia victim compensation program details not verified here.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"address_confidentiality_program": {
"value": null,
"notes": "Any D.C. address confidentiality program equivalent not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"trafficking_statute_of_limitations": {
"value": null,
"notes": "D.C. statute of limitations for trafficking offences not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_witness_assistance_contact": {
"value": null,
"notes": "Specific D.C. victim-witness assistance office contact information not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"local_trafficking_help": {
"value": "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving D.C.",
"notes": "Provides confidential help and referrals for trafficking survivors in the District of Columbia.",
"status": "ok",
"source": {
"citation": "National Human Trafficking Hotline – Get Help.",
"url": "https://humantraffickinghotline.org/en/get-help"
}
}
}
},
{
"jurisdiction": "Florida",
"level": "us_state",
"iso_or_postal": "US-FL",
"last_verified": "2026-07",
"confidence": "low",
"fields": {
"victims_rights_source": {
"value": null,
"notes": "Florida constitutional and statutory victims’ rights (including Marsy’s Law amendment) not verified here.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"sexual_history_shield_rule": {
"value": null,
"notes": "Florida rape-shield and sexual-history rules for adult witnesses not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"support_person_in_courtroom": {
"value": null,
"notes": "Support person rules for adult trafficking survivors in Florida criminal courts not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"facility_dog_or_support_animal": {
"value": null,
"notes": "Florida statutes or statewide policies on courthouse facility dogs/support animals not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"remote_or_shielded_testimony_adult": {
"value": null,
"notes": "Use of CCTV, screens, or remote testimony for adult vulnerable witnesses in Florida criminal proceedings not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"interpreter_provision": {
"value": null,
"notes": "Interpreter provision for witnesses in Florida courts not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"disability_accommodation_process": {
"value": null,
"notes": "Florida courts’ ADA/disability-accommodation process not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_compensation_program": {
"value": null,
"notes": "Florida victim compensation program details not verified here.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"address_confidentiality_program": {
"value": null,
"notes": "Any Florida address confidentiality program equivalent (e.g., Safe at Home) not verified in this dataset.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"trafficking_statute_of_limitations": {
"value": null,
"notes": "Florida statute of limitations for trafficking offences not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"victim_witness_assistance_contact": {
"value": null,
"notes": "Specific Florida statewide victim-witness assistance office contact not verified.",
"status": "unknown",
"source": {
"citation": "Unknown — not verified.",
"url": ""
}
},
"local_trafficking_help": {
"value": "National Human Trafficking Hotline (1-888-373-7888, text 233733) serving Florida.",
"notes": "Provides confidential help and referrals for trafficking survivors in Florida.",
"status": "ok",
"source": {
"citation": "National Human Trafficking Hotline – Get Help.",
"url": "https://humantraffickinghotline.org/en/get-help"
}
}
}
}
]
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^3][^30][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://law.justia.com/codes/texas/2017/code-of-criminal-procedure/title-1/chapter-56/

[^2]: https://law.justia.com/codes/texas/2019/code-of-criminal-procedure/title-1/chapter-56/a-crime-victims-rights/

[^3]: https://law.justia.com/codes/texas/2019/code-of-criminal-procedure/title-1/chapter-56/a-crime-victims-rights/article-56-07/

[^4]: https://ncvli.org/wp-content/uploads/2022/01/Texas-Select-Victims-Rights-last-updated-2021.pdf

[^5]: https://codes.findlaw.com/tx/code-of-criminal-procedure/crim-ptx-crim-pro-art-56a-051/

[^6]: https://www.tamuv.edu/title-ix/resources/criminal-justice/

[^7]: https://www.animallaw.info/statute/tx-facility-dog-§-21012-presence-qualified-facility-dog-or-qualified-therapy-dog-court

[^8]: https://capitol.texas.gov/tlodocs/87R/billtext/html/SB00492I.htm

[^9]: https://statutes.capitol.texas.gov/Docs/CR/htm/CR.56A.htm

[^10]: https://capitol.texas.gov/tlodocs/89R/analysis/html/SB00535S.htm

[^11]: https://www.cbsnews.com/texas/news/dogs-courthouse-bill-passes-senate/

[^12]: https://ovc.ojp.gov/states/texas

[^13]: https://texaslawhelp.org/article/crime-victims-compensation-cvc-program

[^14]: https://defensenet.org/wp-content/uploads/2023/07/SS_GC_5.19.23-Sheris-Sidebar-Edition-6.pdf

[^15]: https://www.ojp.gov/ncjrs/virtual-library/abstracts/texas-rape-shield-law-texas-rule-criminal-evidence-412

[^16]: https://oag.ca.gov/victimservices/marsys_law

[^17]: https://en.wikipedia.org/wiki/Marsy's_Law

[^18]: https://www.cdcr.ca.gov/bph/marsys-law/

[^19]: https://www.sos.ca.gov/registries/safe-home/frequently-asked-questions

[^20]: https://dos.ny.gov/apply-address-confidentiality-program

[^21]: https://www.sos.ca.gov/administration/regulations/current-regulations/registries/safe-home-confidential-address-program

[^22]: https://dos.ny.gov/ACP

[^23]: https://www.ca.gov/departments/162/

[^24]: https://dos.ny.gov/about-program

[^25]: https://victims.ca.gov/for-victims/

[^26]: https://dos.ny.gov/news/new-york-state-address-confidentiality-program-launches-new-online-application-victims

[^27]: https://law.justia.com/codes/new-york/exc/article-6/108/

[^28]: https://ovs.ny.gov/victim-compensation

[^29]: https://victims.ca.gov/for-victims/how-compensation-works/

[^30]: https://ovs.ny.gov

