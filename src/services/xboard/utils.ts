/** 从 HTML 字符串中提取第一个 href URL（收银台降级用） */
export function extractUrlFromHtml(html: string): string {
  const match = html.match(/href=["']([^"']+)["']/i);
  return match?.[1] ?? "";
}
