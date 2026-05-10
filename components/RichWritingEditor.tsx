"use client";

import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  Bold,
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import type { Editor, JSONContent } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

export type RichWritingChange = {
  content: string;
  contentJson: JSONContent | null;
  contentMarkdown: string;
};

type RichWritingEditorProps = {
  ariaLabel: string;
  contentJson?: JSONContent | null;
  fallbackMarkdown?: string;
  onBlur: () => void;
  onChange: (change: RichWritingChange) => void;
  sourceKey: string;
};

type ToolbarState = {
  blockquote: boolean;
  bold: boolean;
  bulletList: boolean;
  canRedo: boolean;
  canUndo: boolean;
  code: boolean;
  codeBlock: boolean;
  h1: boolean;
  h2: boolean;
  h3: boolean;
  italic: boolean;
  link: boolean;
  orderedList: boolean;
  strike: boolean;
  taskList: boolean;
  underline: boolean;
};

type ToolbarButtonConfig = {
  active?: boolean;
  disabled?: boolean;
  icon: ComponentType<{ "aria-hidden": true; size: number }>;
  label: string;
  onClick: () => void;
};

const emptyToolbarState: ToolbarState = {
  blockquote: false,
  bold: false,
  bulletList: false,
  canRedo: false,
  canUndo: false,
  code: false,
  codeBlock: false,
  h1: false,
  h2: false,
  h3: false,
  italic: false,
  link: false,
  orderedList: false,
  strike: false,
  taskList: false,
  underline: false,
};

function setEditorContent(
  editor: Editor,
  contentJson: JSONContent | null | undefined,
  fallbackMarkdown: string | undefined,
) {
  if (contentJson) {
    editor.commands.setContent(contentJson, { emitUpdate: false });
    return;
  }

  editor.commands.setContent(fallbackMarkdown ?? "", {
    contentType: "markdown",
    emitUpdate: false,
  });
}

function getMarkdownFromEditor(editor: Editor) {
  return editor.getMarkdown?.() ?? editor.getText({ blockSeparator: "\n\n" });
}

function ToolbarButton({ active, disabled, icon: Icon, label, onClick }: ToolbarButtonConfig) {
  return (
    <button
      aria-label={label}
      className={cn("survey-control rich-tool-button", active && "active")}
      data-tooltip={label}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(event) => event.preventDefault()}
      title={label}
      type="button"
    >
      <Icon aria-hidden={true} size={17} />
    </button>
  );
}

function toggleLink(editor: Editor) {
  const previousHref = editor.getAttributes("link").href;
  const nextHref = window.prompt("Link URL", typeof previousHref === "string" ? previousHref : "https://");

  if (nextHref === null) {
    return;
  }

  if (!nextHref.trim()) {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: nextHref.trim() })
    .run();
}

function RichEditorToolbar({ editor }: { editor: Editor | null }) {
  const state =
    useEditorState({
      editor,
      selector: ({ editor: currentEditor }) => {
        if (!currentEditor) {
          return emptyToolbarState;
        }

        return {
          blockquote: currentEditor.isActive("blockquote"),
          bold: currentEditor.isActive("bold"),
          bulletList: currentEditor.isActive("bulletList"),
          canRedo: currentEditor.can().redo(),
          canUndo: currentEditor.can().undo(),
          code: currentEditor.isActive("code"),
          codeBlock: currentEditor.isActive("codeBlock"),
          h1: currentEditor.isActive("heading", { level: 1 }),
          h2: currentEditor.isActive("heading", { level: 2 }),
          h3: currentEditor.isActive("heading", { level: 3 }),
          italic: currentEditor.isActive("italic"),
          link: currentEditor.isActive("link"),
          orderedList: currentEditor.isActive("orderedList"),
          strike: currentEditor.isActive("strike"),
          taskList: currentEditor.isActive("taskList"),
          underline: currentEditor.isActive("underline"),
        };
      },
    }) ?? emptyToolbarState;

  const disabled = !editor;

  const buttons: ToolbarButtonConfig[] = [
    {
      active: state.h1,
      disabled,
      icon: Heading1,
      label: "제목 1",
      onClick: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      active: state.h2,
      disabled,
      icon: Heading2,
      label: "제목 2",
      onClick: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      active: state.h3,
      disabled,
      icon: Heading3,
      label: "제목 3",
      onClick: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      active: state.bold,
      disabled,
      icon: Bold,
      label: "굵게",
      onClick: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      active: state.italic,
      disabled,
      icon: Italic,
      label: "기울임",
      onClick: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      active: state.underline,
      disabled,
      icon: UnderlineIcon,
      label: "밑줄",
      onClick: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      active: state.strike,
      disabled,
      icon: Strikethrough,
      label: "취소선",
      onClick: () => editor?.chain().focus().toggleStrike().run(),
    },
    {
      active: state.bulletList,
      disabled,
      icon: List,
      label: "목록",
      onClick: () => editor?.chain().focus().toggleBulletList().run(),
    },
    {
      active: state.orderedList,
      disabled,
      icon: ListOrdered,
      label: "번호 목록",
      onClick: () => editor?.chain().focus().toggleOrderedList().run(),
    },
    {
      active: state.taskList,
      disabled,
      icon: CheckSquare,
      label: "체크리스트",
      onClick: () => editor?.chain().focus().toggleTaskList().run(),
    },
    {
      active: state.blockquote,
      disabled,
      icon: Quote,
      label: "인용",
      onClick: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    {
      active: state.code,
      disabled,
      icon: Code2,
      label: "인라인 코드",
      onClick: () => editor?.chain().focus().toggleCode().run(),
    },
    {
      active: state.codeBlock,
      disabled,
      icon: Pilcrow,
      label: "코드 블록",
      onClick: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    {
      active: state.link,
      disabled,
      icon: LinkIcon,
      label: "링크",
      onClick: () => {
        if (editor) {
          toggleLink(editor);
        }
      },
    },
    {
      disabled,
      icon: Minus,
      label: "구분선",
      onClick: () => editor?.chain().focus().setHorizontalRule().run(),
    },
  ];

  return (
    <div className="rich-editor-topbar">
      <div className="rich-format-toolbar" aria-label="Rich text formatting tools">
        {buttons.map((button) => (
          <ToolbarButton key={button.label} {...button} />
        ))}
      </div>
      <div className="rich-history-toolbar" aria-label="Writing history tools">
        <ToolbarButton
          disabled={disabled || !state.canUndo}
          icon={Undo2}
          label="실행 취소"
          onClick={() => editor?.chain().focus().undo().run()}
        />
        <ToolbarButton
          disabled={disabled || !state.canRedo}
          icon={Redo2}
          label="다시 실행"
          onClick={() => editor?.chain().focus().redo().run()}
        />
      </div>
    </div>
  );
}

export function RichWritingEditor({
  ariaLabel,
  contentJson,
  fallbackMarkdown,
  onBlur,
  onChange,
  sourceKey,
}: RichWritingEditorProps) {
  const contentRef = useRef({ contentJson, fallbackMarkdown });
  const onBlurRef = useRef(onBlur);
  const onChangeRef = useRef(onChange);
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      Underline,
      TiptapLink.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: "오늘의 긴 글을 바로 작성하세요.",
      }),
      Markdown.configure({
        indentation: {
          size: 2,
          style: "space",
        },
      }),
    ],
    [],
  );

  useEffect(() => {
    contentRef.current = { contentJson, fallbackMarkdown };
  }, [contentJson, fallbackMarkdown]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor(
    {
      content: contentJson ?? fallbackMarkdown ?? "",
      contentType: contentJson ? "json" : "markdown",
      editorProps: {
        attributes: {
          "aria-label": ariaLabel,
          class: "rich-editor-content",
          spellcheck: "true",
        },
      },
      extensions,
      immediatelyRender: false,
      onBlur: () => {
        onBlurRef.current();
      },
      onUpdate: ({ editor: currentEditor }) => {
        const contentMarkdown = getMarkdownFromEditor(currentEditor);

        onChangeRef.current({
          content: contentMarkdown,
          contentJson: currentEditor.getJSON(),
          contentMarkdown,
        });
      },
    },
    [extensions],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextContent = contentRef.current;

    setEditorContent(editor, nextContent.contentJson, nextContent.fallbackMarkdown);
  }, [editor, sourceKey]);

  return (
    <div className="rich-editor-panel">
      <RichEditorToolbar editor={editor} />
      <div className="rich-editor-frame">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

type RichWritingPreviewProps = {
  compact?: boolean;
  contentJson?: JSONContent | null;
  fallbackMarkdown?: string;
};

function isDocumentNode(node: JSONContent | null | undefined): node is JSONContent {
  return node?.type === "doc";
}

function hasRenderableJsonContent(node: JSONContent | null | undefined): boolean {
  if (!node) {
    return false;
  }

  if (node.type === "text") {
    return Boolean(node.text?.trim());
  }

  return Boolean(node.content?.some((child) => hasRenderableJsonContent(child)));
}

function renderChildren(node: JSONContent, keyPrefix: string) {
  return node.content?.map((child, index) => renderNode(child, `${keyPrefix}-${index}`)) ?? null;
}

function getNodeText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? "";
  }

  return node.content?.map(getNodeText).join("") ?? "";
}

function getSafeHref(href: unknown) {
  if (typeof href !== "string") {
    return null;
  }

  const trimmed = href.trim();

  if (!trimmed || /^javascript:/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function applyMarks(text: string, marks: JSONContent["marks"], key: string): ReactNode {
  return (marks ?? []).reduce<ReactNode>((children, mark, index) => {
    const markKey = `${key}-mark-${index}`;

    switch (mark.type) {
      case "bold":
        return <strong key={markKey}>{children}</strong>;
      case "italic":
        return <em key={markKey}>{children}</em>;
      case "strike":
        return <s key={markKey}>{children}</s>;
      case "underline":
        return <u key={markKey}>{children}</u>;
      case "code":
        return <code key={markKey}>{children}</code>;
      case "link": {
        const href = getSafeHref(mark.attrs?.href);

        return href ? (
          <a href={href} key={markKey} rel="noreferrer" target="_blank">
            {children}
          </a>
        ) : (
          children
        );
      }
      default:
        return children;
    }
  }, text);
}

function renderNode(node: JSONContent, key: string): ReactNode {
  switch (node.type) {
    case "doc":
      return <>{renderChildren(node, key)}</>;
    case "paragraph": {
      const children = renderChildren(node, key);

      return <p key={key}>{children || <br />}</p>;
    }
    case "heading": {
      const level = node.attrs?.level === 1 || node.attrs?.level === 2 ? node.attrs.level : 3;
      const HeadingTag = `h${level}` as "h1" | "h2" | "h3";

      return <HeadingTag key={key}>{renderChildren(node, key)}</HeadingTag>;
    }
    case "text":
      return applyMarks(node.text ?? "", node.marks, key);
    case "bulletList":
      return <ul key={key}>{renderChildren(node, key)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderChildren(node, key)}</ol>;
    case "listItem":
      return <li key={key}>{renderChildren(node, key)}</li>;
    case "taskList":
      return (
        <ul className="rich-preview-task-list" key={key}>
          {renderChildren(node, key)}
        </ul>
      );
    case "taskItem":
      return (
        <li className="rich-preview-task-item" key={key}>
          <input checked={Boolean(node.attrs?.checked)} readOnly tabIndex={-1} type="checkbox" />
          <div>{renderChildren(node, key)}</div>
        </li>
      );
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node, key)}</blockquote>;
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{getNodeText(node)}</code>
        </pre>
      );
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    default:
      return <div key={key}>{renderChildren(node, key)}</div>;
  }
}

export function RichWritingPreview({
  compact = false,
  contentJson,
  fallbackMarkdown = "",
}: RichWritingPreviewProps) {
  if (isDocumentNode(contentJson) && hasRenderableJsonContent(contentJson)) {
    return (
      <div className={cn("rich-preview", compact && "rich-preview-compact")}>
        {renderNode(contentJson, "root")}
      </div>
    );
  }

  if (!fallbackMarkdown.trim()) {
    return (
      <div className={cn("rich-preview-empty", compact && "rich-preview-compact")}>
        저장된 작문이 없습니다.
      </div>
    );
  }

  return (
    <div className={cn("rich-preview", compact && "rich-preview-compact")}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{fallbackMarkdown}</ReactMarkdown>
    </div>
  );
}
