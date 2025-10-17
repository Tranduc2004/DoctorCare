import React from "react";

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

const RichTextDisplay: React.FC<RichTextDisplayProps> = ({
  content,
  className = "",
}) => {
  // Parse content để hiển thị với format đẹp
  const parseContent = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let currentSection: React.ReactElement[] = [];
    let currentList: string[] = [];
    let inList = false;

    const flushCurrentList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul
            key={`list-${elements.length}`}
            className="list-disc list-inside space-y-2 ml-4 mb-6"
          >
            {currentList.map((item, index) => (
              <li key={index} className="text-gray-600 leading-relaxed">
                {item.replace(/^[•\-*]\s*/, "")}
              </li>
            ))}
          </ul>
        );
        currentList = [];
        inList = false;
      }
    };

    const flushCurrentSection = () => {
      if (currentSection.length > 0) {
        elements.push(
          <div key={`section-${elements.length}`} className="mb-8">
            {currentSection}
          </div>
        );
        currentSection = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        if (inList) {
          flushCurrentList();
        }
        return;
      }

      // Check if it's a list item
      if (trimmedLine.match(/^[•\-*]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        if (!inList && currentSection.length > 0) {
          flushCurrentSection();
        }
        currentList.push(trimmedLine);
        inList = true;
        return;
      }

      // If we were in a list and now we're not, flush the list
      if (inList) {
        flushCurrentList();
      }

      // Check if it's a heading (all caps or ends with colon)
      if (
        trimmedLine === trimmedLine.toUpperCase() &&
        trimmedLine.length > 5 &&
        trimmedLine.length < 50
      ) {
        flushCurrentSection();
        elements.push(
          <h3
            key={`heading-${elements.length}`}
            className="text-xl font-bold text-gray-900 mb-4 mt-8 first:mt-0"
          >
            {trimmedLine}
          </h3>
        );
        return;
      }

      if (trimmedLine.endsWith(":") && trimmedLine.length < 50) {
        flushCurrentSection();
        elements.push(
          <h4
            key={`subheading-${elements.length}`}
            className="text-lg font-semibold text-gray-800 mb-3 mt-6 first:mt-0"
          >
            {trimmedLine}
          </h4>
        );
        return;
      }

      // Regular paragraph
      currentSection.push(
        <p key={`p-${index}`} className="text-gray-600 leading-relaxed mb-4">
          {trimmedLine}
        </p>
      );
    });

    // Flush remaining content
    if (inList) {
      flushCurrentList();
    }
    if (currentSection.length > 0) {
      flushCurrentSection();
    }

    return elements;
  };

  return (
    <div className={`prose max-w-none ${className}`}>
      {parseContent(content)}
    </div>
  );
};

export default RichTextDisplay;
