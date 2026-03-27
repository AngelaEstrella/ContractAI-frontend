type MarkdownRendererProps = {
  content: string;
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    const elements: React.ReactNode[] = [];
    let key = 0;
    const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|('(.+?)')/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.slice(lastIndex, match.index));
      }

      if (match[1]) {
        elements.push(
          <strong key={key++} className="font-semibold">
            {match[2]}
          </strong>,
        );
      } else if (match[3]) {
        elements.push(
          <em key={key++} className="italic">
            {match[4]}
          </em>,
        );
      } else if (match[5]) {
        elements.push(
          <code key={key++} className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-sm text-blue-700">
            {match[6]}
          </code>,
        );
      } else if (match[7]) {
        elements.push(
          <span key={key++} className="font-semibold text-[#1152D4]">
            {match[8]}
          </span>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements.length > 0 ? elements : text;
  };

  const lines = content.split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {renderMarkdown(line)}
          {index < lines.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}
