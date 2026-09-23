export const days = [
  { key:"2026-10-08", label:"Day One", date:"Thursday, October 8" },
  { key:"2026-10-09", label:"Day Two", date:"Friday, October 9" },
  { key:"2026-10-11", label:"Day Three", date:"Sunday, October 11" }
];

export function formatDate(value:string) {
  return new Intl.DateTimeFormat("en-NG",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Lagos"}).format(new Date(value));
}
