// components/clients/OtherInformation.tsx
"use client"

import { useMemo, useState } from "react"
import {
  FileText,
  Link as LinkIcon,
  AtSign,
  Phone as PhoneIcon,
  Copy,
  Check,
  Braces,
  List as ListIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface OtherInformationProps {
  clientData: {
    otherField?: any
  }
}

/* ---------- utils ---------- */

const prettyTitle = (s: string) =>
  s
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isPhone = (v: string) => /^\+?\d[\d\s\-()]{6,}$/.test(v)
const isLikelyUrl = (v: string) => {
  if (!v) return false
  const str = v.trim()
  if (/^https?:\/\//i.test(str)) return true
  // naked domain like example.com/path
  return /^[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(str)
}

type Token =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string }
  | { type: "email"; value: string; href: string }
  | { type: "phone"; value: string; href: string }

/** split text into clickable tokens (url/email/phone + plain text) */
function tokenizeText(input: string): Token[] {
  if (!input) return [{ type: "text", value: "" }]
  const text = String(input)

  // one pass with URL+email+phone regexes; fallback to plain text
  const url =
    /((https?:\/\/|www\.)[^\s)]+|[a-z0-9.-]+\.[a-z]{2,}(\/[^\s)]*)?)/gi
  const email = /([^\s@]+@[^\s@]+\.[^\s@]+)/gi
  const phone = /(\+?\d[\d\s\-()]{6,}\d)/g

  // merge matches with positions
  type Match = { start: number; end: number; type: "link" | "email" | "phone"; text: string }
  const matches: Match[] = []

  const pushMatches = (re: RegExp, type: Match["type"]) => {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, type, text: m[0] })
    }
  }

  pushMatches(url, "link")
  pushMatches(email, "email")
  pushMatches(phone, "phone")

  // de-duplicate overlaps by preferring longer spans (urls > emails > phones roughly)
  matches.sort((a, b) => a.start - b.start || b.end - a.end)
  const filtered: Match[] = []
  let lastEnd = -1
  for (const m of matches) {
    if (m.start >= lastEnd) {
      filtered.push(m)
      lastEnd = m.end
    }
  }

  if (!filtered.length) return [{ type: "text", value: text }]

  const tokens: Token[] = []
  let idx = 0
  for (const m of filtered) {
    if (m.start > idx) tokens.push({ type: "text", value: text.slice(idx, m.start) })

    if (m.type === "link") {
      const raw = m.text
      const href = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      tokens.push({ type: "link", value: raw, href })
    } else if (m.type === "email") {
      tokens.push({ type: "email", value: m.text, href: `mailto:${m.text}` })
    } else {
      tokens.push({ type: "phone", value: m.text, href: `tel:${m.text.replace(/\s+/g, "")}` })
    }
    idx = m.end
  }
  if (idx < text.length) tokens.push({ type: "text", value: text.slice(idx) })
  return tokens
}

function CopyButton({ value }: { value: string }) {
  const [ok, setOk] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setOk(true)
          toast.success("Copied to clipboard")
          setTimeout(() => setOk(false), 900)
        } catch {
          toast.error("Failed to copy")
        }
      }}
      title="Copy"
    >
      {ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  )
}

function AutoLinkText({ text }: { text: string }) {
  const tokens = useMemo(() => tokenizeText(text), [text])
  return (
    <span className="whitespace-pre-wrap break-words">
      {tokens.map((t, i) => {
        if (t.type === "text") return <span key={i}>{t.value}</span>
        if (t.type === "link")
          return (
            <a
              key={i}
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              {t.value}
            </a>
          )
        if (t.type === "email")
          return (
            <a key={i} href={t.href} className="underline text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1">
              <AtSign className="h-3.5 w-3.5" />
              {t.value}
            </a>
          )
        return (
          <a key={i} href={t.href} className="underline text-emerald-600 hover:text-emerald-800 inline-flex items-center gap-1">
            <PhoneIcon className="h-3.5 w-3.5" />
            {t.value}
          </a>
        )
      })}
    </span>
  )
}

/* collapse long blocks (e.g., bios/notes) */
function CollapsibleText({ text, previewChars = 240 }: { text: string; previewChars?: number }) {
  const [open, setOpen] = useState(false)
  if (text.length <= previewChars) return <AutoLinkText text={text} />
  const head = text.slice(0, previewChars)
  const tail = text.slice(previewChars)
  return (
    <div>
      <AutoLinkText text={open ? text : `${head}`} />
      {!open && <span className="text-slate-500">…</span>}
      <button
        className="ml-2 text-blue-600 underline hover:text-blue-800"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Show less" : "Show more"}
      </button>
    </div>
  )
}

/* renderers for different value shapes */
function ValueRenderer({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>

  if (typeof value === "number" || typeof value === "boolean") {
    return (
      <div className="inline-flex items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {String(value)}
        </Badge>
        <CopyButton value={String(value)} />
      </div>
    )
  }

  if (typeof value === "string") {
    // if the entire string is a single url/email/phone, show as a prominent pill
    const trimmed = value.trim()
    if (isEmail(trimmed) || isPhone(trimmed) || isLikelyUrl(trimmed)) {
      const href = isEmail(trimmed)
        ? `mailto:${trimmed}`
        : isPhone(trimmed)
        ? `tel:${trimmed.replace(/\s+/g, "")}`
        : /^https?:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`

      const Icon = isEmail(trimmed) ? AtSign : isPhone(trimmed) ? PhoneIcon : LinkIcon
      return (
        <div className="w-full">
          <a
            href={href}
            target={isEmail(trimmed) || isPhone(trimmed) ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="inline-flex items-start gap-2 rounded-lg px-3 py-1.5 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 break-all"
          >
            <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="font-medium break-words overflow-hidden text-ellipsis line-clamp-2">{trimmed}</span>
          </a>
        </div>
      )
    }

    // otherwise, rich text with auto-link + collapsible
    return (
      <div className="text-slate-900 dark:text-slate-100">
        <CollapsibleText text={trimmed} />
      </div>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-slate-400">—</span>

    // array of primitives
    if (value.every((v) => ["string", "number", "boolean"].includes(typeof v))) {
      const allAreLinks = value.every((v) => typeof v === "string" && isLikelyUrl(v))
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((v, i) => {
            const str = String(v)
            if (allAreLinks) {
              const href = /^https?:\/\//i.test(str) ? str : `https://${str}`
              return (
                <div className="w-full">
                  <a
                    key={i}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-2 rounded-lg px-3 py-1.5 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50 break-all"
                    title={str}
                  >
                    <LinkIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span className="break-words overflow-hidden text-ellipsis line-clamp-2">{str}</span>
                  </a>
                </div>
              )
            }
            return (
              <Badge key={i} variant="secondary" className="font-mono max-w-full">
                <span className="truncate block max-w-full">{str}</span>
              </Badge>
            )
          })}
        </div>
      )
    }

    // array of objects -> list style
    return (
      <div className="space-y-2">
        {value.map((obj, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50/60 dark:bg-slate-800/40"
          >
            <div className="mb-2 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 inline-flex items-center gap-2">
              <ListIcon className="h-4 w-4" />
              Item {i + 1}
            </div>
            <KeyValueGrid value={obj} compact />
          </div>
        ))}
      </div>
    )
  }

  // object -> key/value grid
  return <KeyValueGrid value={value} />
}

function KeyValueGrid({ value, compact = false }: { value: unknown; compact?: boolean }) {
  if (!value || typeof value !== "object") return <span className="text-slate-400">—</span>
  const entries = Object.entries(value as Record<string, unknown>)
  if (!entries.length) return <span className="text-slate-400">—</span>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className="rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 p-3"
        >
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            {prettyTitle(k)}
          </div>
          <div className="text-slate-900 dark:text-slate-100">
            {typeof v === "string" ? <AutoLinkText text={v} /> : <ValueRenderer value={v} />}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- main component ---------- */

export function OtherInformation({ clientData }: OtherInformationProps) {
  const pairs = useMemo(() => {
    const raw = clientData?.otherField
    let result: Array<{ title: string; data: unknown }> = []

    if (Array.isArray(raw)) {
      result = raw
        .map((it: any) => ({
          title: String((it?.title ?? it?.key ?? it?.name ?? "") || "").trim(),
          data: it?.data ?? it?.value ?? it?.content ?? "",
        }))
        .filter((p) => p.title || (p.data !== undefined && p.data !== null && String(p.data) !== ""))
    } else if (raw && typeof raw === "object") {
      result = Object.entries(raw).map(([k, v]) => ({
        title: prettyTitle(k),
        data: v,
      }))
    }

    return result
  }, [clientData])

  return (
    <Card className="shadow-lg border-0 bg-white dark:bg-slate-800 lg:col-span-2">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-indigo-600" />
          <span>Other Information</span>
          {pairs.length > 0 && (
            <Badge variant="secondary" className="ml-2">{pairs.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {pairs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pairs.map((p, i) => {
              // Skip rendering if data is empty or only contains whitespace
              if (p.data === undefined || p.data === null || (typeof p.data === 'string' && !p.data.trim())) {
                return null;
              }
              
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {p.title || "(Untitled)"}
                    </div>
                  </div>

                  <div className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 break-words">
                    <ValueRenderer value={p.data} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 italic">
            <Braces className="h-4 w-4" />
            No additional information
          </div>
        )}
      </CardContent>
    </Card>
  )
}
