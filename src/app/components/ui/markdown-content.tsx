import ReactMarkdown from "react-markdown";

export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-semibold mt-6 mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-1">{children}</h3>,
        p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-3">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 text-muted-foreground">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 text-muted-foreground">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        hr: () => <hr className="my-4 border-border" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
