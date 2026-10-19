/*
  Business details for the About, Contact, Privacy and Terms pages. They are LEFT
  EMPTY ON PURPOSE: nothing here may be guessed or invented. The site owner fills in
  the real values (all of them are optional until then), and the pages show a
  contact address, operator name, and so on only when a value is set.
*/
export const company: {
  // The legal name of the person or company that operates VEYORAQ.
  operatorName: string | null;
  // A monitored email address for questions, privacy requests and deletion requests.
  contactEmail: string | null;
  // A postal address, if one should be published.
  postalAddress: string | null;
} = {
  operatorName: null,
  contactEmail: null,
  postalAddress: null,
};

// Details still needed before the Terms and a full Privacy Policy can be published.
export function missingCompanyDetails(): string[] {
  const missing: string[] = [];
  if (!company.operatorName) missing.push("The legal name of the person or company operating VEYORAQ");
  if (!company.contactEmail) missing.push("A monitored contact email address");
  if (!company.postalAddress) missing.push("A postal address, if one should be published");
  return missing;
}
