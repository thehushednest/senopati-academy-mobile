/**
 * Markdown → React Native components. Simple renderer untuk lesson notes.
 * Support: h1-h3, paragraph, bold/italic, lists, link, code inline + block, hr.
 * Pakai markdown-it untuk parse → token, render manual ke RN primitives.
 */
import { Linking, StyleSheet, Text, View } from "react-native";
import MarkdownIt from "markdown-it";
import { colors, font, radius, spacing, weight } from "./theme";

const md = new MarkdownIt({ html: false, linkify: true, typographer: false });

type RenderState = {
  key: number;
  inHeader: number; // 1/2/3 atau 0
  inBold: boolean;
  inItalic: boolean;
  inCode: boolean;
  inList: "ul" | "ol" | null;
  listIndex: number;
  href: string | null;
  inlineBuffer: React.ReactNode[];
  blocks: React.ReactNode[];
};

function flushInline(s: RenderState) {
  if (s.inlineBuffer.length === 0) return;
  const HeaderStyle = [styles.h1, styles.h2, styles.h3][s.inHeader - 1];
  const baseStyle = s.inHeader ? HeaderStyle : styles.p;
  s.blocks.push(
    <Text key={`b${s.key++}`} style={baseStyle}>
      {s.inlineBuffer}
    </Text>,
  );
  s.inlineBuffer = [];
}

function inlineStyle(s: RenderState) {
  const styleArr: object[] = [];
  if (s.inBold) styleArr.push(styles.bold);
  if (s.inItalic) styleArr.push(styles.italic);
  if (s.inCode) styleArr.push(styles.codeInline);
  return styleArr;
}

function processInline(tokens: ReturnType<typeof md.parseInline>[number]["children"], s: RenderState) {
  if (!tokens) return;
  for (const t of tokens) {
    switch (t.type) {
      case "text":
        if (s.href) {
          const href = s.href;
          s.inlineBuffer.push(
            <Text key={`t${s.key++}`} style={[...inlineStyle(s), styles.link]} onPress={() => Linking.openURL(href)}>
              {t.content}
            </Text>,
          );
        } else {
          s.inlineBuffer.push(
            <Text key={`t${s.key++}`} style={inlineStyle(s)}>
              {t.content}
            </Text>,
          );
        }
        break;
      case "strong_open":
        s.inBold = true;
        break;
      case "strong_close":
        s.inBold = false;
        break;
      case "em_open":
        s.inItalic = true;
        break;
      case "em_close":
        s.inItalic = false;
        break;
      case "code_inline":
        s.inlineBuffer.push(
          <Text key={`c${s.key++}`} style={[...inlineStyle(s), styles.codeInline]}>
            {t.content}
          </Text>,
        );
        break;
      case "link_open":
        s.href = t.attrGet("href") ?? null;
        break;
      case "link_close":
        s.href = null;
        break;
      case "softbreak":
      case "hardbreak":
        s.inlineBuffer.push(<Text key={`br${s.key++}`}>{"\n"}</Text>);
        break;
    }
  }
}

export function Markdown({ source }: { source: string }) {
  if (!source.trim()) return null;
  const tokens = md.parse(source, {});
  const s: RenderState = {
    key: 0,
    inHeader: 0,
    inBold: false,
    inItalic: false,
    inCode: false,
    inList: null,
    listIndex: 0,
    href: null,
    inlineBuffer: [],
    blocks: [],
  };

  let listItemIndex = 0;

  for (const t of tokens) {
    switch (t.type) {
      case "heading_open":
        s.inHeader = parseInt(t.tag.slice(1), 10) || 1;
        break;
      case "heading_close":
        flushInline(s);
        s.inHeader = 0;
        break;
      case "paragraph_open":
        // OK
        break;
      case "paragraph_close":
        flushInline(s);
        break;
      case "inline":
        processInline(t.children, s);
        break;
      case "bullet_list_open":
        s.inList = "ul";
        listItemIndex = 0;
        break;
      case "ordered_list_open":
        s.inList = "ol";
        listItemIndex = 0;
        break;
      case "bullet_list_close":
      case "ordered_list_close":
        s.inList = null;
        break;
      case "list_item_open":
        listItemIndex++;
        break;
      case "list_item_close": {
        // Inline buffer di-pop sebagai list item
        const bullet = s.inList === "ol" ? `${listItemIndex}.` : "•";
        const content = s.inlineBuffer;
        s.inlineBuffer = [];
        s.blocks.push(
          <View key={`li${s.key++}`} style={styles.listItem}>
            <Text style={styles.bullet}>{bullet}</Text>
            <Text style={styles.p}>{content}</Text>
          </View>,
        );
        break;
      }
      case "hr":
        s.blocks.push(<View key={`hr${s.key++}`} style={styles.hr} />);
        break;
      case "fence":
      case "code_block":
        s.blocks.push(
          <View key={`cb${s.key++}`} style={styles.codeBlock}>
            <Text style={styles.codeBlockText}>{t.content}</Text>
          </View>,
        );
        break;
    }
  }

  return <View style={styles.container}>{s.blocks}</View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  h1: { fontSize: 24, fontWeight: weight.extrabold, color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.xs, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: weight.bold, color: colors.ink, marginTop: spacing.md, marginBottom: spacing.xs },
  h3: { fontSize: font.h3, fontWeight: weight.bold, color: colors.ink, marginTop: spacing.md, marginBottom: spacing.xs },
  p: { fontSize: font.body, lineHeight: 24, color: colors.inkSoft },
  bold: { fontWeight: weight.bold, color: colors.ink },
  italic: { fontStyle: "italic" },
  link: { color: colors.brandStrong, textDecorationLine: "underline" },
  codeInline: {
    fontFamily: "monospace",
    fontSize: font.small,
    backgroundColor: "rgba(15, 23, 42, 0.06)",
    paddingHorizontal: 4,
    borderRadius: 4,
    color: colors.brandStrong,
  },
  codeBlock: {
    backgroundColor: "#0b1220",
    padding: spacing.md,
    borderRadius: radius.md,
    marginVertical: spacing.sm,
  },
  codeBlockText: {
    color: "#c8d4e6",
    fontFamily: "monospace",
    fontSize: font.small,
    lineHeight: 20,
  },
  hr: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.md,
  },
  listItem: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    marginBottom: 4,
  },
  bullet: {
    color: colors.brandStrong,
    fontWeight: weight.bold,
    fontSize: font.body,
    minWidth: 18,
  },
});
