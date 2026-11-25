// Build-time projection for /lernen/pruefungsplan only. Keep the shared server
// adapters complete; remove only fields this page demonstrably does not read.
const record = value => Boolean(value && typeof value === "object" && !Array.isArray(value));

function pageSummary(value) {
  if (!record(value)) return value;
  const { articleCount, reviewedArticleCount, questionCount, lawTitle, officialUrl, ...summary } = value;
  return summary;
}

export function projectExamStudyPlanPageProps(props) {
  if (!record(props)) return props;
  return {
    ...props,
    ...(record(props.data) && Array.isArray(props.data.countries) ? { data: {
      ...props.data,
      countries: props.data.countries.map(country => !record(country) ? country : {
        ...country,
        ...(Object.hasOwn(country, "federal") ? { federal: pageSummary(country.federal) } : {}),
        ...(Array.isArray(country.regions) ? { regions: country.regions.map(pageSummary) } : {}),
      }),
    } } : {}),
    ...(record(props.examAlignment) && Array.isArray(props.examAlignment.regions) ? { examAlignment: {
      ...props.examAlignment,
      regions: props.examAlignment.regions.map(region => {
        if (!record(region) || !Array.isArray(region.subjectAreas) || !region.subjectAreas.length) return region;
        // The reader explicitly suppresses these general starts whenever the
        // detailed subject goals exist, including an empty filtered result.
        const { focus, moduleIds, ...detailed } = region;
        return detailed;
      }),
    } } : {}),
  };
}
