/**
 * LINE Flex Message template builders.
 */

import type { ParsedWord } from "./types";

const BRAND_COLOR = "#06C755";
const BRAND_NAME = "SnappWord 截詞";

/** Build a single vocab card bubble. */
function buildVocabCard(
  word: ParsedWord,
  cardId: string,
  sourceApp: string
): Record<string, unknown> {
  const tagBoxes = word.tags.slice(0, 3).map((tag) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: tag,
        size: "xxs",
        color: "#FFFFFF",
        wrap: false,
      },
    ],
    backgroundColor: BRAND_COLOR,
    cornerRadius: "md",
    paddingAll: "4px",
    paddingStart: "8px",
    paddingEnd: "8px",
  }));

  return {
    type: "bubble",
    size: "kilo",
    header: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "text",
          text: sourceApp,
          size: "xs",
          color: "#FFFFFF",
          weight: "bold",
        },
        {
          type: "text",
          text: word.pronunciation || "",
          size: "xs",
          color: "#FFFFFFB3",
          align: "end",
        },
      ],
      backgroundColor: BRAND_COLOR,
      paddingAll: "12px",
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: word.word,
          size: "xl",
          weight: "bold",
          color: "#2D3436",
          wrap: true,
        },
        {
          type: "text",
          text: word.translation,
          size: "md",
          color: BRAND_COLOR,
          weight: "bold",
          margin: "sm",
        },
        ...(tagBoxes.length > 0
          ? [
              {
                type: "box",
                layout: "horizontal",
                contents: tagBoxes,
                spacing: "xs",
                margin: "md",
              },
            ]
          : []),
        {
          type: "separator",
          margin: "lg",
        },
        ...(word.context_sentence
          ? [
              {
                type: "text",
                text: word.context_sentence,
                size: "sm",
                color: "#636E72",
                wrap: true,
                margin: "lg",
                style: "italic",
              },
              {
                type: "text",
                text: word.context_trans || "",
                size: "xs",
                color: "#636E72",
                wrap: true,
                margin: "sm",
              },
            ]
          : []),
        ...(word.ai_example
          ? [
              {
                type: "text",
                text: `💡 ${word.ai_example}`,
                size: "xs",
                color: "#636E72",
                wrap: true,
                margin: "lg",
              },
            ]
          : []),
      ],
      paddingAll: "16px",
    },
    footer: {
      type: "box",
      layout: "horizontal",
      contents: [
        {
          type: "button",
          action: {
            type: "postback",
            label: "📖 記住了",
            data: `action=save&card_id=${cardId}`,
          },
          style: "primary",
          color: BRAND_COLOR,
          height: "sm",
        },
        {
          type: "button",
          action: {
            type: "postback",
            label: "⏭ 跳過",
            data: `action=skip&card_id=${cardId}`,
          },
          style: "secondary",
          height: "sm",
        },
      ],
      spacing: "sm",
      paddingAll: "12px",
    },
  };
}

/** Build a carousel of vocab cards. */
export function buildVocabCarousel(
  wordCardPairs: [ParsedWord, string][],
  sourceApp: string
): Record<string, unknown> {
  const bubbles = wordCardPairs
    .slice(0, 10)
    .map(([word, cardId]) => buildVocabCard(word, cardId, sourceApp));

  return {
    type: "flex",
    altText: `${BRAND_NAME} - ${wordCardPairs.length} 個新單字`,
    contents: {
      type: "carousel",
      contents: bubbles,
    },
  };
}

/** Build an error/info message. */
export function buildErrorMessage(text: string): Record<string, unknown> {
  return {
    type: "flex",
    altText: text,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: BRAND_NAME,
            size: "xs",
            color: BRAND_COLOR,
            weight: "bold",
          },
          {
            type: "text",
            text,
            size: "sm",
            color: "#2D3436",
            wrap: true,
            margin: "md",
          },
        ],
        paddingAll: "16px",
      },
    },
  };
}
