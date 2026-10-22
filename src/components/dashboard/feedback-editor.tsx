"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Underline, Type } from "lucide-react";
import { feedbackColors, feedbackRuns, trimFeedback, type FeedbackRun } from "@/lib/feedback-format";

type Format = Omit<FeedbackRun, "text">;
const defaultFormat: Format = { bold: true, underline: false, color: "default" };

function readRuns(root: Node, inherited: Format = defaultFormat): FeedbackRun[] {
  if (root.nodeType === Node.TEXT_NODE) return root.textContent ? [{ ...inherited, text: root.textContent }] : [];
  const element = root instanceof HTMLElement ? root : null;
  if (element?.tagName === "BR") return [{ ...inherited, text: "\n" }];
  const format = { ...inherited };
  if (element?.dataset.bold) format.bold = element.dataset.bold === "true";
  if (element?.dataset.underline) format.underline = element.dataset.underline === "true";
  if (element?.dataset.feedbackColor && feedbackColors.includes(element.dataset.feedbackColor as Format["color"])) format.color = element.dataset.feedbackColor as Format["color"];
  const runs = Array.from(root.childNodes).flatMap(node => readRuns(node, format));
  if (element && ["DIV", "P"].includes(element.tagName) && element.previousSibling) runs.unshift({ ...format, text: "\n" });
  return runs;
}

function runNode(run: FeedbackRun) {
  const span = document.createElement("span");
  span.dataset.bold = String(run.bold);
  span.dataset.underline = String(run.underline);
  span.dataset.feedbackColor = run.color;
  span.style.fontWeight = run.bold ? "700" : "400";
  span.style.textDecoration = run.underline ? "underline" : "none";
  span.textContent = run.text;
  return span;
}

function formatAt(node: Node | null): Format {
  const result = { ...defaultFormat };
  const ancestors: HTMLElement[] = [];
  for (let element = node instanceof HTMLElement ? node : node?.parentElement; element; element = element.parentElement) ancestors.unshift(element);
  for (const element of ancestors) {
    if (element.dataset.bold) result.bold = element.dataset.bold === "true";
    if (element.dataset.underline) result.underline = element.dataset.underline === "true";
    if (feedbackColors.includes(element.dataset.feedbackColor as Format["color"])) result.color = element.dataset.feedbackColor as Format["color"];
  }
  return result;
}

export function FeedbackEditor({ initialText = "", initialFormat, disabled = false, onChange }: {
  initialText?: string; initialFormat?: FeedbackRun[] | null; disabled?: boolean;
  onChange: (text: string, runs: FeedbackRun[]) => void;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const initialValue = useRef({ text: initialText, format: initialFormat });
  const savedRange = useRef<Range | null>(null);
  const [format, setFormat] = useState<Format>(defaultFormat);
  const [length, setLength] = useState(initialText.length);

  useEffect(() => {
    const initial = initialValue.current;
    editor.current?.replaceChildren(...feedbackRuns(initial.text, initial.format).map(runNode));
  }, []);

  const capture = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editor.current?.contains(selection.anchorNode) && editor.current.contains(selection.focusNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
      const range = savedRange.current;
      const node = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer : range.startContainer.childNodes[range.collapsed ? Math.max(0, range.startOffset - 1) : range.startOffset] || range.startContainer;
      setFormat(formatAt(node));
    }
  };
  const emit = () => {
    if (!editor.current) return;
    const runs = readRuns(editor.current);
    const merged: FeedbackRun[] = [];
    for (const run of trimFeedback(runs)) {
      const last = merged[merged.length - 1];
      if (last && last.bold === run.bold && last.underline === run.underline && last.color === run.color) last.text += run.text;
      else merged.push(run);
    }
    const text = merged.map(run => run.text).join("");
    setLength(text.length);
    onChange(text, merged);
    capture();
  };
  const getRange = () => {
    const root = editor.current;
    if (!root) return null;
    const range = savedRange.current;
    if (range && root.contains(range.startContainer) && root.contains(range.endContainer)) return range;
    const end = document.createRange(); end.selectNodeContents(root); end.collapse(false); return end;
  };
  const insert = (text: string) => {
    const range = getRange();
    if (!range || !editor.current) return;
    const remaining = 1000 - (editor.current.textContent?.length || 0) + range.toString().length;
    text = text.slice(0, Math.max(0, remaining));
    if (!text) return;
    range.deleteContents();
    const node = runNode({ ...format, text });
    range.insertNode(node); range.setStartAfter(node); range.collapse(true);
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    savedRange.current = range.cloneRange();
    emit();
  };
  const apply = (changes: Partial<Format>) => {
    const next = { ...format, ...changes }; setFormat(next);
    const range = getRange();
    if (!range || range.collapsed) { editor.current?.focus(); return; }
    const selectedRuns = readRuns(range.cloneContents(), formatAt(range.startContainer));
    range.deleteContents();
    const fragment = document.createDocumentFragment();
    const nodes = selectedRuns.map(run => runNode({ ...run, ...changes }));
    fragment.append(...nodes); range.insertNode(fragment);
    if (nodes.length) { range.setStartBefore(nodes[0]); range.setEndAfter(nodes[nodes.length - 1]); }
    editor.current?.focus();
    const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    savedRange.current = range.cloneRange(); emit();
  };

  return <div className={"feedback-editor" + (disabled ? " editor-disabled" : "")}>
    <div className="feedback-toolbar" role="toolbar" aria-label="Feedback formatting">
      <button type="button" aria-label="Bold" aria-pressed={format.bold} disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={() => apply({ bold: !format.bold })}><Bold size={16} /></button>
      <button type="button" aria-label="Normal text" disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={() => apply({ bold: false })}><Type size={16} /></button>
      <button type="button" aria-label="Underline" aria-pressed={format.underline} disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={() => apply({ underline: !format.underline })}><Underline size={16} /></button>
      <span className="feedback-toolbar-divider" />
      {feedbackColors.map(color => <button type="button" key={color} aria-label={"Text color: " + color} aria-pressed={format.color === color} className="feedback-color" data-feedback-color={color} disabled={disabled} onMouseDown={event => event.preventDefault()} onClick={() => apply({ color })}><span /></button>)}
    </div>
    <div id="review-comment" ref={editor} role="textbox" aria-label="A note for the student" aria-multiline="true" aria-describedby="feedback-editor-hint" contentEditable={!disabled} suppressContentEditableWarning className="feedback-editable" data-placeholder="Explain what to fix and what to do next..." onInput={emit} onKeyUp={capture} onMouseUp={capture} onBlur={capture}
      onBeforeInput={event => { const input = event.nativeEvent as InputEvent; if (input.data && !input.isComposing && !input.type.startsWith("composition")) { event.preventDefault(); capture(); insert(input.data); } }}
      onKeyDown={event => { if (event.nativeEvent.isComposing) return; if (event.key === "Enter") { event.preventDefault(); capture(); insert("\n"); } if ((event.ctrlKey || event.metaKey) && ["b", "u"].includes(event.key.toLowerCase())) { event.preventDefault(); capture(); apply(event.key.toLowerCase() === "b" ? { bold: !format.bold } : { underline: !format.underline }); } }}
      onPaste={event => { event.preventDefault(); capture(); insert(event.clipboardData.getData("text/plain")); }} />
    <div className="feedback-editor-footer"><span id="feedback-editor-hint">Select text to format. Feedback starts bold.</span><span>{length} / 1,000</span></div>
  </div>;
}
