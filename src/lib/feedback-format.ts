export const feedbackColors = ["default", "blue", "green", "red", "purple", "amber"] as const;
export type FeedbackColor = typeof feedbackColors[number];
export interface FeedbackRun { text: string; bold: boolean; underline: boolean; color: FeedbackColor }

export function trimFeedback(runs: FeedbackRun[]): FeedbackRun[] {
  const result = runs.filter(run => run.text).map(run => ({ ...run }));
  while (result.length && !result[0].text.trimStart()) result.shift();
  while (result.length && !result[result.length - 1].text.trimEnd()) result.pop();
  if (result.length) {
    result[0].text = result[0].text.trimStart();
    result[result.length - 1].text = result[result.length - 1].text.trimEnd();
  }
  return result;
}

export function feedbackRuns(text: string, format?: FeedbackRun[] | null): FeedbackRun[] {
  if (Array.isArray(format) && format.length && format.every(run => run && typeof run.text === "string" && typeof run.bold === "boolean" && typeof run.underline === "boolean" && feedbackColors.includes(run.color)) && format.map(run => run.text).join("") === text) return format;
  return text ? [{ text, bold: true, underline: false, color: "default" }] : [];
}
